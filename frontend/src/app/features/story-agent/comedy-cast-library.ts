import type { ComedyToneStyle } from './comedy-templates';

export type CastRoleKind = 'scholar' | 'child' | 'elder' | 'king' | 'woman' | 'tank';

export interface ComedyCastMember {
  id: string;
  name: string;
  role: CastRoleKind;
  look: string;
  voiceId: string;
}

export interface ComedyVoiceOption {
  id: string;
  label: string;
}

export interface MultiCastTemplate {
  id: string;
  label: string;
  title: string;
  summary: string;
  locationPrompt: string;
  comedyStyle: ComedyToneStyle;
  cast: ComedyCastMember[];
  sceneBody: string;
}

export const GEMINI_CAST_VOICE_OPTIONS: readonly ComedyVoiceOption[] = [
  { id: 'Fenrir', label: 'Fenrir · Angry Bold Male' },
  { id: 'Puck', label: 'Puck · Fast Comic Youth' },
  { id: 'Algenib', label: 'Algenib · Gruff Uncle / Elder' },
  { id: 'Sadachbia', label: 'Sadachbia · Cheeky Sarcastic Male' },
  { id: 'Orus', label: 'Orus · Bossy Judge / Father' },
  { id: 'Alnilam', label: 'Alnilam · Heavy Loud Male' },
  { id: 'Rasalgethi', label: 'Rasalgethi · Deadpan Explainer' },
  { id: 'Charon', label: 'Charon · Deep Stern Male' },
  { id: 'Kore', label: 'Kore · Fierce Expressive Female' },
  { id: 'Aoede', label: 'Aoede · Lively Comic Female' },
  { id: 'Leda', label: 'Leda · Young Sassy Female' },
];

export const CAST_ROLE_OPTIONS: readonly { value: CastRoleKind; label: string }[] = [
  { value: 'scholar', label: 'Hero / Youth (Casual)' },
  { value: 'child', label: 'Naughty Kid / Chhotu' },
  { value: 'elder', label: 'Uncle / Elder (Beard)' },
  { value: 'king', label: 'Judge / Boss / Police' },
  { value: 'woman', label: 'Lady / Aunty / Mother' },
  { value: 'tank', label: 'Cartoon Tank' },
];

export const MAX_CAST_MEMBERS = 7;

export function createDefaultCastRoster(): ComedyCastMember[] {
  return [
    {
      id: 'c1',
      name: 'पप्पू भैया',
      role: 'scholar',
      look: 'mustard hoodie, spiky black hair, wide comic eyes',
      voiceId: 'Puck',
    },
    {
      id: 'c2',
      name: 'बबलू यार',
      role: 'child',
      look: 'teal jacket, backwards cap, sneaky grin',
      voiceId: 'Fenrir',
    },
    {
      id: 'c3',
      name: 'ताऊ जी',
      role: 'elder',
      look: 'white kurta, handlebar moustache, thick glasses',
      voiceId: 'Algenib',
    },
  ];
}

export const MULTI_CAST_TEMPLATES: readonly MultiCastTemplate[] = [
  {
    id: 'mjo-barber-kaand',
    label: '💈 Barber Salon Katora Kaand',
    title: 'अबे टकला कर दिया?! 😱 नाई का उल्टा चश्मा कांड',
    summary: '4 Cast: Customer (full hair -> half chop -> shiny Takla in mirror!), Blindfolded-attitude Barber, Kid & Uncle.',
    locationPrompt: 'colorful 3D Indian barber salon interior with front big mirror, back wall mirror, red rotating barber pole, swivel hydraulic chair',
    comedyStyle: 'DesiKhadiSitcom',
    cast: [
      { id: 'b1', name: 'अमरेंद्र नाई', role: 'scholar', look: 'red salon apron, black glasses, scissors in hand', voiceId: 'Fenrir' },
      { id: 'b2', name: 'पप्पू ग्राहक', role: 'scholar', look: 'bright yellow sweater, neat spiky hair', voiceId: 'Puck' },
      { id: 'b3', name: 'सुखिया चाचा', role: 'elder', look: 'white dhoti kurta, thick white moustache, spectator bench', voiceId: 'Algenib' },
      { id: 'b4', name: 'चिंटू बालक', role: 'child', look: 'green tee, spiky hair, cheeky grin', voiceId: 'Sadachbia' },
    ],
    sceneBody:
      '[SCENE]: barber shop | day | angry comedy\n' +
      '[पप्पू ग्राहक]: (angry) अबे ओ अमरेंद्र नाई! कान खोल के सुन ले — साइड से सिर्फ दो मिलीमीटर काटियो, पूरा मुंडन मत मार दियो!\n' +
      '[अमरेंद्र नाई]: (proud, cutting) अरे पप्पू तू चुप बैठ! बिना देखे भी शाहरुख़ खान जैसा हीरो कट ठोक दूँगा... चक-चक-चक!\n' +
      '[सुखिया चाचा]: (surprised) अरे अमरेंद्र भैया! तेरा तो चश्मा उल्टा टँगा है — तू क्या अँधेरे में खोपड़ी छील रहा है?!\n' +
      '[अमरेंद्र नाई]: (adjusting glasses, angry) चुप बैठो चाचा! ये नया पेरिस स्टाइल है... पप्पू लो तौलिया हटा के शीशे में देख ले!\n' +
      '[पप्पू ग्राहक]: (removing towel, look in mirror, surprised) अबे ये क्या बकवास है?! शीशे में मेरी चाँद चमक रही है — तूने मुझे टकला कर दिया नालायक!\n' +
      '[अमरेंद्र नाई]: (angry, pointing) अरे मेरा चश्मा उल्टा था यार! अब चिल्ला मत, ये नया कटोरा कट ही ट्रेंडिंग है!\n' +
      '[MEME]: shocked_face | पूरा मैदान साफ़ कर दिया!\n' +
      '[चिंटू बालक]: (laughing) हाहाहा! पप्पू भैया के सिर पे तो सोलर पैनल चमक रहा है — मक्खी फिसल के गिर जाएगी!\n' +
      '[पप्पू ग्राहक]: (angry, punch) तेरे पेरिस स्टाइल की ऐसी की तैसी! आज केंची ले के तेरा भी कटोरा बनाऊँगा — रुक बे नाई!',
  },
  {
    id: 'mjo-courtroom-kaand',
    label: '⚖️ Courtroom Tareekh Kaand',
    title: 'जज साहब भड़क गए! 🔨 अदालत में बवाल',
    summary: '4 Cast: Judge with Gavel, Over-smart Wakeel, Guilty Thief & Witness Uncle yelling across court.',
    locationPrompt: 'colorful 3D Indian courtroom with elevated wooden judge bench, gavel, witness box, pillars',
    comedyStyle: 'DesiKhadiSitcom',
    cast: [
      { id: 'ct1', name: 'जज साहब', role: 'king', look: 'black judge coat, white collar, spectacles, wooden gavel', voiceId: 'Orus' },
      { id: 'ct2', name: 'लल्लन वकील', role: 'scholar', look: 'black advocate coat, yellow tie, smug attitude', voiceId: 'Fenrir' },
      { id: 'ct3', name: 'गब्बर मुलज़िम', role: 'child', look: 'orange prison kurta, panicked wide eyes', voiceId: 'Puck' },
      { id: 'ct4', name: 'रामू गवाह', role: 'elder', look: 'white dhoti kurta, shaking stick, angry moustache', voiceId: 'Algenib' },
    ],
    sceneBody:
      '[SCENE]: courtroom | day | fiery comedy\n' +
      '[लल्लन वकील]: (proud, pointing) माय लॉर्ड! मेरा मुवक्किल इतना शरीफ़ है कि गली के कुत्ते से भी माफ़ी माँग के निकलता है!\n' +
      '[जज साहब]: (gavel, angry) बकवास बंद कर वकील! इसने बैंक का पूरा एटीएम उखाड़ के रिक्शे पे लाद लिया था!\n' +
      '[गब्बर मुलज़िम]: (surprised) अरे जज साहब गलती हो गई! मैं तो बस चेक कर रहा था कि मशीन के अंदर छोटा आदमी बैठ के नोट गिनता है क्या!\n' +
      '[रामू गवाह]: (angry) झूठ बोलता है टोपा! इसने रिक्शे वाले से किराया भी उधार लिखवाया और मेरी चप्पल चुरा के भागा!\n' +
      '[MEME]: dimag_hang | एटीएम में छोटा आदमी?!\n' +
      '[जज साहब]: (gavel, angry) ऑर्डर ऑर्डर! दोनों वकील और मुलज़िम का दिमाग़ सटक गया है — जाओ बीस साल तक कोर्ट के बाहर समोसे बेचो!',
  },
  {
    id: 'mjo-doctor-injection',
    label: '💉 Doctor Clinic Injection',
    title: 'अबे सुई मत ठोक डॉक्टर! 💉 क्लिनिक में चीख-पुकार',
    summary: '4 Cast: Trigger-happy Doctor with giant syringe, Screaming Patient, Compounder & Aunty.',
    locationPrompt: 'bright 3D Indian medical clinic room, examination bed, doctor desk, colorful charts',
    comedyStyle: 'DesiKhadiSitcom',
    cast: [
      { id: 'dr1', name: 'डॉ. झटका', role: 'scholar', look: 'white doctor coat, stethoscope, crooked glasses', voiceId: 'Algenib' },
      { id: 'dr2', name: 'कल्लू मरीज़', role: 'child', look: 'striped shirt, terrified bulging eyes', voiceId: 'Puck' },
      { id: 'dr3', name: 'आशा नर्स', role: 'woman', look: 'sky blue nurse coat, stern clipboard', voiceId: 'Kore' },
      { id: 'dr4', name: 'बंटी कंपाउंडर', role: 'scholar', look: 'green scrubs, giant syringe', voiceId: 'Fenrir' },
    ],
    sceneBody:
      '[SCENE]: doctor clinic | day | panic comedy\n' +
      '[कल्लू मरीज़]: (angry) अबे डॉक्टर साहब बस हल्का सा जुकाम है, मीठी गोली दे के छुट्टी करो फटाफट!\n' +
      '[डॉ. झटका]: (stethoscope, angry) चुप बैठ बावले! आजकल जुकाम का सीधा इलाज तीन फीट लंबी सुई से होता है... बंटी, हाथी वाली सिरिंज ला!\n' +
      '[बंटी कंपाउंडर]: (proud, syringe) लो सर! ये सुई एक बार घुसेगी तो छह महीने तक मच्छर भी इसके पास नहीं फटकेगा!\n' +
      '[कल्लू मरीज़]: (surprised) अरे बाप रे! ये सुई है या सरिया?! मुझे कोई जुकाम नहीं है — मैं तो बस रास्ता पूछने आया था!\n' +
      '[आशा नर्स]: (angry, pointing) पकड़ो इसको बंटी! फीस दिए बिना बाहर भागा तो गेट पे ही दो इंजेक्शन और ठोक दूँगी!\n' +
      '[MEME]: run_comedy | जुकाम गया तेल लेने!',
  },
  {
    id: 'mjo-classroom-backbench',
    label: '🏫 Classroom Backbencher Roast',
    title: 'मास्टरजी भड़के! 📏 होमवर्क ना करने का भयानक बहाना',
    summary: '4 Cast: Furious Masterji, Shameless Backbencher Pintu, Class Monitor Bablu & Chhotu.',
    locationPrompt: 'bright 3D Indian school classroom with green blackboard, wooden desks, chalk',
    comedyStyle: 'DesiKhadiSitcom',
    cast: [
      { id: 'cl1', name: 'मास्टरजी तिवारी', role: 'elder', look: 'cream kurta, thick glasses, chalk and stick', voiceId: 'Orus' },
      { id: 'cl2', name: 'पिंटू बैकबेंचर', role: 'child', look: 'navy school uniform, messy hair, smug look', voiceId: 'Puck' },
      { id: 'cl3', name: 'बबलू मॉनिटर', role: 'scholar', look: 'blue shirt, oversized specs, tattling finger', voiceId: 'Sadachbia' },
      { id: 'cl4', name: 'छोटू यार', role: 'child', look: 'yellow sweater, sleepy face', voiceId: 'Fenrir' },
    ],
    sceneBody:
      '[SCENE]: classroom | day | angry comedy\n' +
      '[मास्टरजी तिवारी]: (angry, pointing) अबे ओ पिंटू के बच्चे! कॉपी खोल — कल पाँच सौ बार पहाड़ा लिखने दिया था!\n' +
      '[पिंटू बैकबेंचर]: (proud) मास्टरजी लिखा तो पूरा था... पर रात को भैंस ने कॉपी खा ली और ऊपर से डकार भी मारी!\n' +
      '[बबलू मॉनिटर]: (angry) झूठ बोलता है सर! मैंने इसे कल रात गली में कंचे खेलते देखा — घर पे इसकी भैंस ही नहीं है!\n' +
      '[मास्टरजी तिवारी]: (angry) तेरे को शर्म नहीं आती नालायक?! भैंस का नाम लगा के मुझे मूर्ख समझता है — निकल क्लास के बाहर मुर्गा बन!\n' +
      '[छोटू यार]: (laughing) हाहा! भैंस कॉपी खा गई और भाई मुर्गा बन गया — पूरा चिड़ियाघर क्लास में ही खुल गया!\n' +
      '[MEME]: khatam_tata_bye | भैंस वाला बहाना फेल!',
  },
  {
    id: 'mjo-mohalla-gate',
    label: '🚪 Mohalla Gate Rent Fight',
    title: 'मकान मालिक ने ताला जड़ दिया! 🔑 किराये का घमासान',
    summary: '4 Cast: Angry Landlord, Broke Tenant, Watchman & Gossiping Padosi Aunty at Mohalla Gate.',
    locationPrompt: 'colorful 3D Indian mohalla colony gate, scooter parked, tea thermos, balconies',
    comedyStyle: 'DesiKhadiSitcom',
    cast: [
      { id: 'mg1', name: 'वर्मा जी', role: 'elder', look: 'orange shawl over kurta, angry red face, lock key', voiceId: 'Orus' },
      { id: 'mg2', name: 'पप्पू किरायेदार', role: 'scholar', look: 'mustard hoodie, empty pockets, panicked grin', voiceId: 'Puck' },
      { id: 'mg3', name: 'शर्मा आंटी', role: 'woman', look: 'pink saree, nosey stare, wagging finger', voiceId: 'Kore' },
      { id: 'mg4', name: 'रामू चौकीदार', role: 'king', look: 'khaki uniform, wooden baton, moustache', voiceId: 'Fenrir' },
    ],
    sceneBody:
      '[SCENE]: neighborhood gate | day | angry comedy\n' +
      '[वर्मा जी]: (angry, key) अरे पप्पू! तीन महीने का किराया तेरा बाप देगा क्या?! आज रात गेट के अंदर कदम रखा तो ताला लगा दूँगा!\n' +
      '[पप्पू किरायेदार]: (angry) वर्मा जी चिल्लाओ मत! कल मेरी क्रिप्टो वाली लॉटरी खुलते ही पूरी कॉलोनी खरीद के आपको ही गार्ड रख लूँगा!\n' +
      '[शर्मा आंटी]: (laughing) अरे हाय राम! जेब में दस रुपये का समोसा खाने के पैसे नहीं हैं और पूरी कॉलोनी खरीदने चले लाट साहब!\n' +
      '[रामू चौकीदार]: (angry) साहब जी ये रोज़ दो कप चाय भी मेरे खाते में बोल के निकल लेता है — आज तो चप्पल उतरवा के भगाऊँगा!\n' +
      '[MEME]: shocked_face | पूरी कॉलोनी खरीदेंगे भाई!\n' +
      '[पप्पू किरायेदार]: (running, surprised) अरे भागो रे! आज पूरा मोहल्ला पीछे पड़ गया — दोस्त, बाइक स्टार्ट रख!',
  },
  {
    id: 'mjo-chai-tapri',
    label: '🫖 Nukkad Chai Tapri Bil Scam',
    title: 'फ्री चाय का महा-स्कैम! ☕ टपरी पर जूतम-पैजार',
    summary: '5 Cast: Angry Tapri Owner, 3 Freeloader Friends & Furious Uncle roaring at roadside tea stall.',
    locationPrompt: 'lively 3D Indian nukkad chai tapri, steaming brass kettle, kulhad cups, plastic stools',
    comedyStyle: 'DesiKhadiSitcom',
    cast: [
      { id: 'tp1', name: 'पप्पू भैया', role: 'scholar', look: 'orange hoodie, cocky smirk', voiceId: 'Fenrir' },
      { id: 'tp2', name: 'बबलू यार', role: 'child', look: 'teal jacket, backwards cap', voiceId: 'Puck' },
      { id: 'tp3', name: 'टपरी भैया', role: 'elder', look: 'white apron, towel on shoulder, deadpan glare', voiceId: 'Algenib' },
      { id: 'tp4', name: 'राजू फ्रीलोडर', role: 'scholar', look: 'green tee, oversized glasses', voiceId: 'Sadachbia' },
      { id: 'tp5', name: 'सुशीला आंटी', role: 'woman', look: 'red saree, shopping bag, scolding finger', voiceId: 'Kore' },
    ],
    sceneBody:
      '[SCENE]: chai stall | day | angry comedy\n' +
      '[पप्पू भैया]: (angry) अबे ओ टपरी भैया! चार कड़क अदरक चाय और आठ समोसे फटाफट ठोक दे — आज बिल अपना रईस बबलू देगा!\n' +
      '[बबलू यार]: (angry, surprised) किस ख़ुशी में दूँ बे?! जेब में सिर्फ़ पांच रुपये का फटा नोट पड़ा है, तेरा ही पिछला उधार बाकी है!\n' +
      '[टपरी भैया]: (angry, pointing) तुम दोनों नालायकों का चार सौ अस्सी का उधार दीवार पे कोयले से लिखा है! आज बर्तन मांज के ही जाओगे!\n' +
      '[राजू फ्रीलोडर]: (surprised) अरे यार मैं तो बस समोसा सूँघने रुका था, मेरा नाम इसमें मत घसीटो!\n' +
      '[सुशीला आंटी]: (angry) शर्म करो मुफ़्तखोरों! चार गिलास चाय पी के भागने चले हैं — अभी पुलिस बुला के अंदर करवाती हूँ!\n' +
      '[MEME]: run_comedy | बर्तन मांजने की ड्यूटी पक्की!',
  },
];

export function formatCastLine(member: ComedyCastMember): string {
  const cleanName = (member.name || 'Character').replace(/\|/g, ' ').trim() || 'Character';
  const cleanLook = (member.look || 'bright casual outfit').replace(/\|/g, ',').trim();
  return `[CAST]: ${cleanName} | ${member.role} | ${cleanLook} | voice=${member.voiceId || 'Puck'}`;
}

export function syncCastDirectivesToScript(script: string, roster: readonly ComedyCastMember[]): string {
  const lines = (script ?? '').replace(/\r\n/g, '\n').split('\n');
  const bodyLines = lines.filter((line) => !/^\s*\[(CAST|पात्र|CHARACTER|CHARACTERS)\]\s*:/i.test(line));
  while (bodyLines.length > 0 && !bodyLines[0].trim()) bodyLines.shift();
  const castHeader = roster.slice(0, MAX_CAST_MEMBERS).map(formatCastLine).join('\n');
  const body = bodyLines.join('\n').trimStart();
  return body ? `${castHeader}\n${body}` : castHeader;
}

export function parseCastDirectivesFromScript(script: string): ComedyCastMember[] | null {
  const lines = (script ?? '').split(/\r?\n/);
  const parsed: ComedyCastMember[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*\[(?:CAST|पात्र|CHARACTER|CHARACTERS)\]\s*:\s*(.+)$/i);
    if (!match) continue;
    const parts = match[1].split('|').map((p) => p.trim());
    const name = parts[0];
    if (!name) continue;
    const rawRole = (parts[1] || '').toLowerCase();
    const role: CastRoleKind =
      rawRole.includes('child') || rawRole.includes('kid') ? 'child'
      : rawRole.includes('elder') || rawRole.includes('sage') || rawRole.includes('uncle') ? 'elder'
      : rawRole.includes('king') || rawRole.includes('judge') || rawRole.includes('police') ? 'king'
      : rawRole.includes('woman') || rawRole.includes('lady') || rawRole.includes('aunty') ? 'woman'
      : rawRole.includes('tank') ? 'tank'
      : 'scholar';
    let voiceId = 'Puck';
    const lookParts: string[] = [];
    for (const seg of parts.slice(2)) {
      const voiceMatch = seg.match(/^voice\s*[:=]\s*([A-Za-z0-9_-]+)/i);
      if (voiceMatch) {
        voiceId = voiceMatch[1];
      } else if (GEMINI_CAST_VOICE_OPTIONS.some((v) => v.id.toLowerCase() === seg.toLowerCase())) {
        voiceId = GEMINI_CAST_VOICE_OPTIONS.find((v) => v.id.toLowerCase() === seg.toLowerCase())!.id;
      } else if (seg) {
        lookParts.push(seg);
      }
    }
    parsed.push({
      id: `c${parsed.length + 1}`,
      name,
      role,
      look: lookParts.join(', ') || 'bright outfit',
      voiceId,
    });
  }
  return parsed.length >= 2 ? parsed.slice(0, MAX_CAST_MEMBERS) : null;
}
