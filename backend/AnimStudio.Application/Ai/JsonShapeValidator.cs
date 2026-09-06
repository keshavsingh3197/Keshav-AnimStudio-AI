using System.Globalization;
using System.Text.Json;

namespace AnimStudio.Application.Ai;

public sealed record ShapeError(string Path, string Message)
{
    public override string ToString() => $"{Path}: {Message}";
}

public sealed record ShapeResult(IReadOnlyList<ShapeError> Errors)
{
    public static readonly ShapeResult Valid = new([]);

    public bool IsValid => Errors.Count == 0;

    public string Summary => string.Join("; ", Errors.Take(5).Select(e => e.ToString()));
}

/// <summary>
/// Validates a model's JSON response against the shape its prompt template declared.
/// </summary>
/// <remarks>
/// <para>
/// A deliberately small subset of JSON Schema - <c>type</c>, <c>properties</c>,
/// <c>required</c>, <c>additionalProperties</c>, <c>items</c>, <c>enum</c>, and the
/// length/range/count bounds - rather than a full implementation or a dependency on one.
/// The shapes these templates ask for are arrays of flat objects; a complete validator
/// would be several thousand lines of specification compliance to enforce keywords no
/// template here uses.
/// </para>
/// <para>
/// An unrecognised keyword is a <em>schema</em> error, not something to skip. A validator
/// that quietly ignores the constraint you wrote is worse than no validator at all,
/// because you believe the constraint is being enforced.
/// </para>
/// </remarks>
public static class JsonShapeValidator
{
    private static readonly string[] KnownKeywords =
    [
        "type", "properties", "required", "additionalProperties", "items",
        "enum", "minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems",
        // Documentation only, carried so a schema can explain itself to a model.
        "title", "description", "$schema", "examples"
    ];

    public static ShapeResult Validate(JsonElement value, string schemaJson)
    {
        JsonDocument schema;
        try
        {
            schema = JsonDocument.Parse(schemaJson);
        }
        catch (JsonException ex)
        {
            return new ShapeResult([new ShapeError("$schema", $"The schema is not valid JSON: {ex.Message}")]);
        }

        using (schema)
        {
            var errors = new List<ShapeError>();
            Check(value, schema.RootElement, "$", errors);
            return errors.Count == 0 ? ShapeResult.Valid : new ShapeResult(errors);
        }
    }

    /// <summary>Parses and validates in one step, so a caller never handles raw JSON itself.</summary>
    public static bool TryParse(string? json, string schemaJson, out JsonElement value, out ShapeResult result)
    {
        value = default;

        if (string.IsNullOrWhiteSpace(json))
        {
            result = new ShapeResult([new ShapeError("$", "The response was empty.")]);
            return false;
        }

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(json);
        }
        catch (JsonException ex)
        {
            result = new ShapeResult([new ShapeError("$", $"The response was not valid JSON: {ex.Message}")]);
            return false;
        }

        // Cloned so the element outlives the document, which the caller never sees.
        value = document.RootElement.Clone();
        document.Dispose();

        result = Validate(value, schemaJson);
        return result.IsValid;
    }

    private static void Check(JsonElement value, JsonElement schema, string path, List<ShapeError> errors)
    {
        if (schema.ValueKind != JsonValueKind.Object)
        {
            errors.Add(new ShapeError(path, "The schema node is not an object."));
            return;
        }

        foreach (var keyword in schema.EnumerateObject())
        {
            if (!KnownKeywords.Contains(keyword.Name, StringComparer.Ordinal))
            {
                // Fail closed: an unenforced constraint that looks enforced is a trap.
                errors.Add(new ShapeError(path, $"The schema uses an unsupported keyword '{keyword.Name}'."));
                return;
            }
        }

        if (!schema.TryGetProperty("type", out var typeElement))
        {
            errors.Add(new ShapeError(path, "The schema node has no 'type'."));
            return;
        }

        var type = typeElement.GetString();

        switch (type)
        {
            case "object": CheckObject(value, schema, path, errors); break;
            case "array": CheckArray(value, schema, path, errors); break;
            case "string": CheckString(value, schema, path, errors); break;
            case "integer":
            case "number": CheckNumber(value, schema, path, type, errors); break;
            case "boolean":
                if (value.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                    errors.Add(new ShapeError(path, "Expected a boolean."));
                break;
            default:
                errors.Add(new ShapeError(path, $"The schema declares an unsupported type '{type}'."));
                break;
        }
    }

    private static void CheckObject(JsonElement value, JsonElement schema, string path, List<ShapeError> errors)
    {
        if (value.ValueKind != JsonValueKind.Object)
        {
            errors.Add(new ShapeError(path, "Expected an object."));
            return;
        }

        var properties = schema.TryGetProperty("properties", out var p) ? p : default;

        if (schema.TryGetProperty("required", out var required)
            && required.ValueKind == JsonValueKind.Array)
        {
            foreach (var name in required.EnumerateArray())
            {
                var key = name.GetString();
                if (key is null) continue;

                // A null for a required field is as absent as a missing key: a model that
                // writes "age": null has not answered.
                if (!value.TryGetProperty(key, out var supplied) || supplied.ValueKind == JsonValueKind.Null)
                    errors.Add(new ShapeError($"{path}.{key}", "Required, but missing or null."));
            }
        }

        // Defaults to false: an object that accepts anything is not a shape.
        var allowExtra = schema.TryGetProperty("additionalProperties", out var extra)
                         && extra.ValueKind == JsonValueKind.True;

        foreach (var property in value.EnumerateObject())
        {
            if (properties.ValueKind == JsonValueKind.Object
                && properties.TryGetProperty(property.Name, out var propertySchema))
            {
                // An optional field explicitly set to null is simply absent.
                if (property.Value.ValueKind != JsonValueKind.Null)
                    Check(property.Value, propertySchema, $"{path}.{property.Name}", errors);

                continue;
            }

            if (!allowExtra)
                errors.Add(new ShapeError($"{path}.{property.Name}", "Unexpected property."));
        }
    }

    private static void CheckArray(JsonElement value, JsonElement schema, string path, List<ShapeError> errors)
    {
        if (value.ValueKind != JsonValueKind.Array)
        {
            errors.Add(new ShapeError(path, "Expected an array."));
            return;
        }

        var length = value.GetArrayLength();

        if (schema.TryGetProperty("minItems", out var min) && length < min.GetInt32())
            errors.Add(new ShapeError(path, $"Expected at least {min.GetInt32()} items."));

        if (schema.TryGetProperty("maxItems", out var max) && length > max.GetInt32())
            errors.Add(new ShapeError(path, $"Expected at most {max.GetInt32()} items."));

        if (!schema.TryGetProperty("items", out var items)) return;

        var index = 0;
        foreach (var item in value.EnumerateArray())
        {
            Check(item, items, $"{path}[{index}]", errors);
            index++;

            // One malformed row should not produce a thousand-line error report.
            if (errors.Count > 50) return;
        }
    }

    private static void CheckString(JsonElement value, JsonElement schema, string path, List<ShapeError> errors)
    {
        if (value.ValueKind != JsonValueKind.String)
        {
            errors.Add(new ShapeError(path, "Expected a string."));
            return;
        }

        var text = value.GetString() ?? string.Empty;

        if (schema.TryGetProperty("minLength", out var min) && text.Length < min.GetInt32())
            errors.Add(new ShapeError(path, $"Shorter than the minimum of {min.GetInt32()}."));

        if (schema.TryGetProperty("maxLength", out var max) && text.Length > max.GetInt32())
            errors.Add(new ShapeError(path, $"Longer than the maximum of {max.GetInt32()}."));

        if (schema.TryGetProperty("enum", out var allowed) && allowed.ValueKind == JsonValueKind.Array)
        {
            var permitted = allowed.EnumerateArray()
                .Any(o => string.Equals(o.GetString(), text, StringComparison.Ordinal));

            if (!permitted) errors.Add(new ShapeError(path, "Not one of the permitted values."));
        }
    }

    private static void CheckNumber(
        JsonElement value, JsonElement schema, string path, string type, List<ShapeError> errors)
    {
        if (value.ValueKind != JsonValueKind.Number)
        {
            errors.Add(new ShapeError(path, $"Expected {(type == "integer" ? "an integer" : "a number")}."));
            return;
        }

        if (type == "integer" && !value.TryGetInt64(out _))
        {
            errors.Add(new ShapeError(path, "Expected an integer, not a fractional number."));
            return;
        }

        if (!value.TryGetDouble(out var number))
        {
            errors.Add(new ShapeError(path, "The number could not be read."));
            return;
        }

        if (schema.TryGetProperty("minimum", out var min) && number < min.GetDouble())
        {
            errors.Add(new ShapeError(path,
                $"Below the minimum of {min.GetDouble().ToString(CultureInfo.InvariantCulture)}."));
        }

        if (schema.TryGetProperty("maximum", out var max) && number > max.GetDouble())
        {
            errors.Add(new ShapeError(path,
                $"Above the maximum of {max.GetDouble().ToString(CultureInfo.InvariantCulture)}."));
        }
    }
}
