"use strict";(()=>{var yc=0,el=1,xc=2;var tl=1,Eo=2,Cn=3,zn=0,qt=1,gt=2,Xn=0,Si=1,Hn=2,nl=3,il=4,Tc=5,li=100,wc=101,_c=102,vc=103,Sc=104,bc=200,Rc=201,Ac=202,Cc=203,Fr=204,Nr=205,Hc=206,Pc=207,Ic=208,Dc=209,Lc=210,Bc=211,Gc=212,Uc=213,Fc=214,go=0,Mo=1,yo=2,bi=3,xo=4,To=5,wo=6,_o=7,sl=0,Nc=1,kc=2,Yn=0,Oc=1,zc=2,Vc=3,vo=4,Wc=5,Xc=6,Yc=7;var rl=300,Li=301,Bi=302,So=303,bo=304,er=306,kr=1e3,ai=1001,Or=1002,nn=1003,qc=1004;var tr=1005;var wn=1006,Ro=1007;var mi=1008;var Pn=1009,ol=1010,al=1011,fs=1012,Ao=1013,Ei=1014,In=1015,gi=1016,Co=1017,Ho=1018,ps=1020,ll=35902,cl=1021,hl=1022,rn=1023,ul=1024,dl=1025,is=1026,ms=1027,fl=1028,Po=1029,pl=1030,Io=1031;var Do=1033,nr=33776,ir=33777,sr=33778,rr=33779,Lo=35840,Bo=35841,Go=35842,Uo=35843,Fo=36196,No=37492,ko=37496,Oo=37808,zo=37809,Vo=37810,Wo=37811,Xo=37812,Yo=37813,qo=37814,Zo=37815,Jo=37816,Ko=37817,$o=37818,Qo=37819,jo=37820,ea=37821,or=36492,ta=36494,na=36495,ml=36283,ia=36284,sa=36285,ra=36286;var Cs=2300,zr=2301,Ur=2302,Va=2400,Wa=2401,Xa=2402;var Zc=3200,Jc=3201;var El=0,Kc=1,qn="",kt="srgb",Ri="srgb-linear",Hs="linear",St="srgb";var vi=7680;var Ya=519,$c=512,Qc=513,jc=514,gl=515,eh=516,th=517,nh=518,ih=519,qa=35044;var Ml="300 es",Rn=2e3,Ps=2001;var Vn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Jt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var ma=Math.PI/180,Is=180/Math.PI;function ar(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Jt[n&255]+Jt[n>>8&255]+Jt[n>>16&255]+Jt[n>>24&255]+"-"+Jt[e&255]+Jt[e>>8&255]+"-"+Jt[e>>16&15|64]+Jt[e>>24&255]+"-"+Jt[t&63|128]+Jt[t>>8&255]+"-"+Jt[t>>16&255]+Jt[t>>24&255]+Jt[i&255]+Jt[i>>8&255]+Jt[i>>16&255]+Jt[i>>24&255]).toLowerCase()}function ut(n,e,t){return Math.max(e,Math.min(t,n))}function uu(n,e){return(n%e+e)%e}function Ea(n,e,t){return(1-t)*n+t*e}function xs(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function tn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var Ge=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ut(this.x,e.x,t.x),this.y=ut(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ut(this.x,e,t),this.y=ut(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ut(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ut(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},ot=class n{constructor(e,t,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],u=i[7],E=i[2],m=i[5],f=i[8],d=s[0],g=s[3],p=s[6],x=s[1],w=s[4],y=s[7],R=s[2],S=s[5],A=s[8];return r[0]=o*d+a*x+l*R,r[3]=o*g+a*w+l*S,r[6]=o*p+a*y+l*A,r[1]=c*d+h*x+u*R,r[4]=c*g+h*w+u*S,r[7]=c*p+h*y+u*A,r[2]=E*d+m*x+f*R,r[5]=E*g+m*w+f*S,r[8]=E*p+m*y+f*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=h*o-a*c,E=a*l-h*r,m=c*r-o*l,f=t*u+i*E+s*m;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);let d=1/f;return e[0]=u*d,e[1]=(s*c-h*i)*d,e[2]=(a*i-s*o)*d,e[3]=E*d,e[4]=(h*t-s*l)*d,e[5]=(s*r-a*t)*d,e[6]=m*d,e[7]=(i*l-c*t)*d,e[8]=(o*t-i*r)*d,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(ga.makeScale(e,t)),this}rotate(e){return this.premultiply(ga.makeRotation(-e)),this}translate(e,t){return this.premultiply(ga.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ga=new ot;function yl(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ds(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function sh(){let n=Ds("canvas");return n.style.display="block",n}var Yl={};function lr(n){n in Yl||(Yl[n]=!0,console.warn(n))}function rh(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function oh(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function ah(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var ql=new ot().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Zl=new ot().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function du(){let n={enabled:!0,workingColorSpace:Ri,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===St&&(s.r=On(s.r),s.g=On(s.g),s.b=On(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===St&&(s.r=ns(s.r),s.g=ns(s.g),s.b=ns(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===qn?Hs:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Ri]:{primaries:e,whitePoint:i,transfer:Hs,toXYZ:ql,fromXYZ:Zl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:kt},outputColorSpaceConfig:{drawingBufferColorSpace:kt}},[kt]:{primaries:e,whitePoint:i,transfer:St,toXYZ:ql,fromXYZ:Zl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:kt}}}),n}var Mt=du();function On(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ns(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Wi,Vr=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Wi===void 0&&(Wi=Ds("canvas")),Wi.width=e.width,Wi.height=e.height;let s=Wi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=Wi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ds("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=On(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(On(t[i]/255)*255):t[i]=On(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},fu=0,ss=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:fu++}),this.uuid=ar(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Ma(s[o].image)):r.push(Ma(s[o]))}else r=Ma(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Ma(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Vr.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var pu=0,Qt=class n extends Vn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=ai,s=ai,r=wn,o=mi,a=rn,l=Pn,c=n.DEFAULT_ANISOTROPY,h=qn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:pu++}),this.uuid=ar(),this.name="",this.source=new ss(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Ge(0,0),this.repeat=new Ge(1,1),this.center=new Ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ot,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==rl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case kr:e.x=e.x-Math.floor(e.x);break;case ai:e.x=e.x<0?0:1;break;case Or:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case kr:e.y=e.y-Math.floor(e.y);break;case ai:e.y=e.y<0?0:1;break;case Or:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Qt.DEFAULT_IMAGE=null;Qt.DEFAULT_MAPPING=rl;Qt.DEFAULT_ANISOTROPY=1;var xt=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],E=l[1],m=l[5],f=l[9],d=l[2],g=l[6],p=l[10];if(Math.abs(h-E)<.01&&Math.abs(u-d)<.01&&Math.abs(f-g)<.01){if(Math.abs(h+E)<.1&&Math.abs(u+d)<.1&&Math.abs(f+g)<.1&&Math.abs(c+m+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(c+1)/2,y=(m+1)/2,R=(p+1)/2,S=(h+E)/4,A=(u+d)/4,C=(f+g)/4;return w>y&&w>R?w<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(w),s=S/i,r=A/i):y>R?y<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),i=S/s,r=C/s):R<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),i=A/r,s=C/r),this.set(i,s,r,t),this}let x=Math.sqrt((g-f)*(g-f)+(u-d)*(u-d)+(E-h)*(E-h));return Math.abs(x)<.001&&(x=1),this.x=(g-f)/x,this.y=(u-d)/x,this.z=(E-h)/x,this.w=Math.acos((c+m+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ut(this.x,e.x,t.x),this.y=ut(this.y,e.y,t.y),this.z=ut(this.z,e.z,t.z),this.w=ut(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ut(this.x,e,t),this.y=ut(this.y,e,t),this.z=ut(this.z,e,t),this.w=ut(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ut(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Wr=class extends Vn{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new xt(0,0,e,t),this.scissorTest=!1,this.viewport=new xt(0,0,e,t);let s={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:wn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new Qt(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new ss(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},mn=class extends Wr{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Ls=class extends Qt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=nn,this.minFilter=nn,this.wrapR=ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Xr=class extends Qt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=nn,this.minFilter=nn,this.wrapR=ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Dt=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],u=i[s+3],E=r[o+0],m=r[o+1],f=r[o+2],d=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=E,e[t+1]=m,e[t+2]=f,e[t+3]=d;return}if(u!==d||l!==E||c!==m||h!==f){let g=1-a,p=l*E+c*m+h*f+u*d,x=p>=0?1:-1,w=1-p*p;if(w>Number.EPSILON){let R=Math.sqrt(w),S=Math.atan2(R,p*x);g=Math.sin(g*S)/R,a=Math.sin(a*S)/R}let y=a*x;if(l=l*g+E*y,c=c*g+m*y,h=h*g+f*y,u=u*g+d*y,g===1-a){let R=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=R,c*=R,h*=R,u*=R}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],u=r[o],E=r[o+1],m=r[o+2],f=r[o+3];return e[t]=a*f+h*u+l*m-c*E,e[t+1]=l*f+h*E+c*u-a*m,e[t+2]=c*f+h*m+a*E-l*u,e[t+3]=h*f-a*u-l*E-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),u=a(r/2),E=l(i/2),m=l(s/2),f=l(r/2);switch(o){case"XYZ":this._x=E*h*u+c*m*f,this._y=c*m*u-E*h*f,this._z=c*h*f+E*m*u,this._w=c*h*u-E*m*f;break;case"YXZ":this._x=E*h*u+c*m*f,this._y=c*m*u-E*h*f,this._z=c*h*f-E*m*u,this._w=c*h*u+E*m*f;break;case"ZXY":this._x=E*h*u-c*m*f,this._y=c*m*u+E*h*f,this._z=c*h*f+E*m*u,this._w=c*h*u-E*m*f;break;case"ZYX":this._x=E*h*u-c*m*f,this._y=c*m*u+E*h*f,this._z=c*h*f-E*m*u,this._w=c*h*u+E*m*f;break;case"YZX":this._x=E*h*u+c*m*f,this._y=c*m*u+E*h*f,this._z=c*h*f-E*m*u,this._w=c*h*u-E*m*f;break;case"XZY":this._x=E*h*u-c*m*f,this._y=c*m*u-E*h*f,this._z=c*h*f+E*m*u,this._w=c*h*u+E*m*f;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],u=t[10],E=i+a+u;if(E>0){let m=.5/Math.sqrt(E+1);this._w=.25/m,this._x=(h-l)*m,this._y=(r-c)*m,this._z=(o-s)*m}else if(i>a&&i>u){let m=2*Math.sqrt(1+i-a-u);this._w=(h-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+c)/m}else if(a>u){let m=2*Math.sqrt(1+a-i-u);this._w=(r-c)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+h)/m}else{let m=2*Math.sqrt(1+u-i-a);this._w=(o-s)/m,this._x=(r+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ut(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let m=1-t;return this._w=m*o+t*this._w,this._x=m*i+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-t)*h)/c,E=Math.sin(t*h)/c;return this._w=o*u+this._w*E,this._x=i*u+this._x*E,this._y=s*u+this._y*E,this._z=r*u+this._z*E,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},B=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Jl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Jl.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),h=2*(a*t-r*s),u=2*(r*i-o*t);return this.x=t+l*c+o*u-a*h,this.y=i+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ut(this.x,e.x,t.x),this.y=ut(this.y,e.y,t.y),this.z=ut(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ut(this.x,e,t),this.y=ut(this.y,e,t),this.z=ut(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ut(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ya.copy(this).projectOnVector(e),this.sub(ya)}reflect(e){return this.sub(ya.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ut(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ya=new B,Jl=new Dt,ci=class{constructor(e=new B(1/0,1/0,1/0),t=new B(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(yn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(yn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=yn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,yn):yn.fromBufferAttribute(r,o),yn.applyMatrix4(e.matrixWorld),this.expandByPoint(yn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),pr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),pr.copy(i.boundingBox)),pr.applyMatrix4(e.matrixWorld),this.union(pr)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,yn),yn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ts),mr.subVectors(this.max,Ts),Xi.subVectors(e.a,Ts),Yi.subVectors(e.b,Ts),qi.subVectors(e.c,Ts),ei.subVectors(Yi,Xi),ti.subVectors(qi,Yi),xi.subVectors(Xi,qi);let t=[0,-ei.z,ei.y,0,-ti.z,ti.y,0,-xi.z,xi.y,ei.z,0,-ei.x,ti.z,0,-ti.x,xi.z,0,-xi.x,-ei.y,ei.x,0,-ti.y,ti.x,0,-xi.y,xi.x,0];return!xa(t,Xi,Yi,qi,mr)||(t=[1,0,0,0,1,0,0,0,1],!xa(t,Xi,Yi,qi,mr))?!1:(Er.crossVectors(ei,ti),t=[Er.x,Er.y,Er.z],xa(t,Xi,Yi,qi,mr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,yn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(yn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Gn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Gn=[new B,new B,new B,new B,new B,new B,new B,new B],yn=new B,pr=new ci,Xi=new B,Yi=new B,qi=new B,ei=new B,ti=new B,xi=new B,Ts=new B,mr=new B,Er=new B,Ti=new B;function xa(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){Ti.fromArray(n,r);let a=s.x*Math.abs(Ti.x)+s.y*Math.abs(Ti.y)+s.z*Math.abs(Ti.z),l=e.dot(Ti),c=t.dot(Ti),h=i.dot(Ti);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var mu=new ci,ws=new B,Ta=new B,hi=class{constructor(e=new B,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):mu.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ws.subVectors(e,this.center);let t=ws.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(ws,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ta.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ws.copy(e.center).add(Ta)),this.expandByPoint(ws.copy(e.center).sub(Ta))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Un=new B,wa=new B,gr=new B,ni=new B,_a=new B,Mr=new B,va=new B,rs=class{constructor(e=new B,t=new B(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Un)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Un.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Un.copy(this.origin).addScaledVector(this.direction,t),Un.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){wa.copy(e).add(t).multiplyScalar(.5),gr.copy(t).sub(e).normalize(),ni.copy(this.origin).sub(wa);let r=e.distanceTo(t)*.5,o=-this.direction.dot(gr),a=ni.dot(this.direction),l=-ni.dot(gr),c=ni.lengthSq(),h=Math.abs(1-o*o),u,E,m,f;if(h>0)if(u=o*l-a,E=o*a-l,f=r*h,u>=0)if(E>=-f)if(E<=f){let d=1/h;u*=d,E*=d,m=u*(u+o*E+2*a)+E*(o*u+E+2*l)+c}else E=r,u=Math.max(0,-(o*E+a)),m=-u*u+E*(E+2*l)+c;else E=-r,u=Math.max(0,-(o*E+a)),m=-u*u+E*(E+2*l)+c;else E<=-f?(u=Math.max(0,-(-o*r+a)),E=u>0?-r:Math.min(Math.max(-r,-l),r),m=-u*u+E*(E+2*l)+c):E<=f?(u=0,E=Math.min(Math.max(-r,-l),r),m=E*(E+2*l)+c):(u=Math.max(0,-(o*r+a)),E=u>0?r:Math.min(Math.max(-r,-l),r),m=-u*u+E*(E+2*l)+c);else E=o>0?-r:r,u=Math.max(0,-(o*E+a)),m=-u*u+E*(E+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(wa).addScaledVector(gr,E),m}intersectSphere(e,t){Un.subVectors(e.center,this.origin);let i=Un.dot(this.direction),s=Un.dot(Un)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,E=this.origin;return c>=0?(i=(e.min.x-E.x)*c,s=(e.max.x-E.x)*c):(i=(e.max.x-E.x)*c,s=(e.min.x-E.x)*c),h>=0?(r=(e.min.y-E.y)*h,o=(e.max.y-E.y)*h):(r=(e.max.y-E.y)*h,o=(e.min.y-E.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-E.z)*u,l=(e.max.z-E.z)*u):(a=(e.max.z-E.z)*u,l=(e.min.z-E.z)*u),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Un)!==null}intersectTriangle(e,t,i,s,r){_a.subVectors(t,e),Mr.subVectors(i,e),va.crossVectors(_a,Mr);let o=this.direction.dot(va),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ni.subVectors(this.origin,e);let l=a*this.direction.dot(Mr.crossVectors(ni,Mr));if(l<0)return null;let c=a*this.direction.dot(_a.cross(ni));if(c<0||l+c>o)return null;let h=-a*ni.dot(va);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},_t=class n{constructor(e,t,i,s,r,o,a,l,c,h,u,E,m,f,d,g){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,h,u,E,m,f,d,g)}set(e,t,i,s,r,o,a,l,c,h,u,E,m,f,d,g){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=E,p[3]=m,p[7]=f,p[11]=d,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/Zi.setFromMatrixColumn(e,0).length(),r=1/Zi.setFromMatrixColumn(e,1).length(),o=1/Zi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let E=o*h,m=o*u,f=a*h,d=a*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=m+f*c,t[5]=E-d*c,t[9]=-a*l,t[2]=d-E*c,t[6]=f+m*c,t[10]=o*l}else if(e.order==="YXZ"){let E=l*h,m=l*u,f=c*h,d=c*u;t[0]=E+d*a,t[4]=f*a-m,t[8]=o*c,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=m*a-f,t[6]=d+E*a,t[10]=o*l}else if(e.order==="ZXY"){let E=l*h,m=l*u,f=c*h,d=c*u;t[0]=E-d*a,t[4]=-o*u,t[8]=f+m*a,t[1]=m+f*a,t[5]=o*h,t[9]=d-E*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let E=o*h,m=o*u,f=a*h,d=a*u;t[0]=l*h,t[4]=f*c-m,t[8]=E*c+d,t[1]=l*u,t[5]=d*c+E,t[9]=m*c-f,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let E=o*l,m=o*c,f=a*l,d=a*c;t[0]=l*h,t[4]=d-E*u,t[8]=f*u+m,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=m*u+f,t[10]=E-d*u}else if(e.order==="XZY"){let E=o*l,m=o*c,f=a*l,d=a*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=E*u+d,t[5]=o*h,t[9]=m*u-f,t[2]=f*u-m,t[6]=a*h,t[10]=d*u+E}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Eu,e,gu)}lookAt(e,t,i){let s=this.elements;return an.subVectors(e,t),an.lengthSq()===0&&(an.z=1),an.normalize(),ii.crossVectors(i,an),ii.lengthSq()===0&&(Math.abs(i.z)===1?an.x+=1e-4:an.z+=1e-4,an.normalize(),ii.crossVectors(i,an)),ii.normalize(),yr.crossVectors(an,ii),s[0]=ii.x,s[4]=yr.x,s[8]=an.x,s[1]=ii.y,s[5]=yr.y,s[9]=an.y,s[2]=ii.z,s[6]=yr.z,s[10]=an.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],u=i[5],E=i[9],m=i[13],f=i[2],d=i[6],g=i[10],p=i[14],x=i[3],w=i[7],y=i[11],R=i[15],S=s[0],A=s[4],C=s[8],_=s[12],T=s[1],L=s[5],G=s[9],U=s[13],k=s[2],X=s[6],V=s[10],te=s[14],F=s[3],q=s[7],J=s[11],xe=s[15];return r[0]=o*S+a*T+l*k+c*F,r[4]=o*A+a*L+l*X+c*q,r[8]=o*C+a*G+l*V+c*J,r[12]=o*_+a*U+l*te+c*xe,r[1]=h*S+u*T+E*k+m*F,r[5]=h*A+u*L+E*X+m*q,r[9]=h*C+u*G+E*V+m*J,r[13]=h*_+u*U+E*te+m*xe,r[2]=f*S+d*T+g*k+p*F,r[6]=f*A+d*L+g*X+p*q,r[10]=f*C+d*G+g*V+p*J,r[14]=f*_+d*U+g*te+p*xe,r[3]=x*S+w*T+y*k+R*F,r[7]=x*A+w*L+y*X+R*q,r[11]=x*C+w*G+y*V+R*J,r[15]=x*_+w*U+y*te+R*xe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],u=e[6],E=e[10],m=e[14],f=e[3],d=e[7],g=e[11],p=e[15];return f*(+r*l*u-s*c*u-r*a*E+i*c*E+s*a*m-i*l*m)+d*(+t*l*m-t*c*E+r*o*E-s*o*m+s*c*h-r*l*h)+g*(+t*c*u-t*a*m-r*o*u+i*o*m+r*a*h-i*c*h)+p*(-s*a*h-t*l*u+t*a*E+s*o*u-i*o*E+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=e[9],E=e[10],m=e[11],f=e[12],d=e[13],g=e[14],p=e[15],x=u*g*c-d*E*c+d*l*m-a*g*m-u*l*p+a*E*p,w=f*E*c-h*g*c-f*l*m+o*g*m+h*l*p-o*E*p,y=h*d*c-f*u*c+f*a*m-o*d*m-h*a*p+o*u*p,R=f*u*l-h*d*l-f*a*E+o*d*E+h*a*g-o*u*g,S=t*x+i*w+s*y+r*R;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/S;return e[0]=x*A,e[1]=(d*E*r-u*g*r-d*s*m+i*g*m+u*s*p-i*E*p)*A,e[2]=(a*g*r-d*l*r+d*s*c-i*g*c-a*s*p+i*l*p)*A,e[3]=(u*l*r-a*E*r-u*s*c+i*E*c+a*s*m-i*l*m)*A,e[4]=w*A,e[5]=(h*g*r-f*E*r+f*s*m-t*g*m-h*s*p+t*E*p)*A,e[6]=(f*l*r-o*g*r-f*s*c+t*g*c+o*s*p-t*l*p)*A,e[7]=(o*E*r-h*l*r+h*s*c-t*E*c-o*s*m+t*l*m)*A,e[8]=y*A,e[9]=(f*u*r-h*d*r-f*i*m+t*d*m+h*i*p-t*u*p)*A,e[10]=(o*d*r-f*a*r+f*i*c-t*d*c-o*i*p+t*a*p)*A,e[11]=(h*a*r-o*u*r-h*i*c+t*u*c+o*i*m-t*a*m)*A,e[12]=R*A,e[13]=(h*d*s-f*u*s+f*i*E-t*d*E-h*i*g+t*u*g)*A,e[14]=(f*a*s-o*d*s-f*i*l+t*d*l+o*i*g-t*a*g)*A,e[15]=(o*u*s-h*a*s+h*i*l-t*u*l-o*i*E+t*a*E)*A,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,u=a+a,E=r*c,m=r*h,f=r*u,d=o*h,g=o*u,p=a*u,x=l*c,w=l*h,y=l*u,R=i.x,S=i.y,A=i.z;return s[0]=(1-(d+p))*R,s[1]=(m+y)*R,s[2]=(f-w)*R,s[3]=0,s[4]=(m-y)*S,s[5]=(1-(E+p))*S,s[6]=(g+x)*S,s[7]=0,s[8]=(f+w)*A,s[9]=(g-x)*A,s[10]=(1-(E+d))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=Zi.set(s[0],s[1],s[2]).length(),o=Zi.set(s[4],s[5],s[6]).length(),a=Zi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],xn.copy(this);let c=1/r,h=1/o,u=1/a;return xn.elements[0]*=c,xn.elements[1]*=c,xn.elements[2]*=c,xn.elements[4]*=h,xn.elements[5]*=h,xn.elements[6]*=h,xn.elements[8]*=u,xn.elements[9]*=u,xn.elements[10]*=u,t.setFromRotationMatrix(xn),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=Rn){let l=this.elements,c=2*r/(t-e),h=2*r/(i-s),u=(t+e)/(t-e),E=(i+s)/(i-s),m,f;if(a===Rn)m=-(o+r)/(o-r),f=-2*o*r/(o-r);else if(a===Ps)m=-o/(o-r),f=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=E,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=f,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=Rn){let l=this.elements,c=1/(t-e),h=1/(i-s),u=1/(o-r),E=(t+e)*c,m=(i+s)*h,f,d;if(a===Rn)f=(o+r)*u,d=-2*u;else if(a===Ps)f=r*u,d=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-E,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=d,l[14]=-f,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Zi=new B,xn=new _t,Eu=new B(0,0,0),gu=new B(1,1,1),ii=new B,yr=new B,an=new B,Kl=new _t,$l=new Dt,jt=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],E=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(ut(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(E,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ut(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(ut(E,-1,1)),Math.abs(E)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ut(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(E,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(ut(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-ut(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(E,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Kl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Kl,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return $l.setFromEuler(this),this.setFromQuaternion($l,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};jt.DEFAULT_ORDER="XYZ";var Bs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Mu=0,Ql=new B,Ji=new Dt,Fn=new _t,xr=new B,_s=new B,yu=new B,xu=new Dt,jl=new B(1,0,0),ec=new B(0,1,0),tc=new B(0,0,1),nc={type:"added"},Tu={type:"removed"},Ki={type:"childadded",child:null},Sa={type:"childremoved",child:null},Pt=class n extends Vn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Mu++}),this.uuid=ar(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new B,t=new jt,i=new Dt,s=new B(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new _t},normalMatrix:{value:new ot}}),this.matrix=new _t,this.matrixWorld=new _t,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Bs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ji.setFromAxisAngle(e,t),this.quaternion.multiply(Ji),this}rotateOnWorldAxis(e,t){return Ji.setFromAxisAngle(e,t),this.quaternion.premultiply(Ji),this}rotateX(e){return this.rotateOnAxis(jl,e)}rotateY(e){return this.rotateOnAxis(ec,e)}rotateZ(e){return this.rotateOnAxis(tc,e)}translateOnAxis(e,t){return Ql.copy(e).applyQuaternion(this.quaternion),this.position.add(Ql.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(jl,e)}translateY(e){return this.translateOnAxis(ec,e)}translateZ(e){return this.translateOnAxis(tc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Fn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?xr.copy(e):xr.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),_s.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Fn.lookAt(_s,xr,this.up):Fn.lookAt(xr,_s,this.up),this.quaternion.setFromRotationMatrix(Fn),s&&(Fn.extractRotation(s.matrixWorld),Ji.setFromRotationMatrix(Fn),this.quaternion.premultiply(Ji.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(nc),Ki.child=e,this.dispatchEvent(Ki),Ki.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Tu),Sa.child=e,this.dispatchEvent(Sa),Sa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Fn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Fn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Fn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(nc),Ki.child=e,this.dispatchEvent(Ki),Ki.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(_s,e,yu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(_s,xu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),u=o(e.shapes),E=o(e.skeletons),m=o(e.animations),f=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),E.length>0&&(i.skeletons=E),m.length>0&&(i.animations=m),f.length>0&&(i.nodes=f)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Pt.DEFAULT_UP=new B(0,1,0);Pt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Pt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Tn=new B,Nn=new B,ba=new B,kn=new B,$i=new B,Qi=new B,ic=new B,Ra=new B,Aa=new B,Ca=new B,Ha=new xt,Pa=new xt,Ia=new xt,oi=class n{constructor(e=new B,t=new B,i=new B){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Tn.subVectors(e,t),s.cross(Tn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){Tn.subVectors(s,t),Nn.subVectors(i,t),ba.subVectors(e,t);let o=Tn.dot(Tn),a=Tn.dot(Nn),l=Tn.dot(ba),c=Nn.dot(Nn),h=Nn.dot(ba),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let E=1/u,m=(c*l-a*h)*E,f=(o*h-a*l)*E;return r.set(1-m-f,f,m)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,kn)===null?!1:kn.x>=0&&kn.y>=0&&kn.x+kn.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,kn.x),l.addScaledVector(o,kn.y),l.addScaledVector(a,kn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return Ha.setScalar(0),Pa.setScalar(0),Ia.setScalar(0),Ha.fromBufferAttribute(e,t),Pa.fromBufferAttribute(e,i),Ia.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Ha,r.x),o.addScaledVector(Pa,r.y),o.addScaledVector(Ia,r.z),o}static isFrontFacing(e,t,i,s){return Tn.subVectors(i,t),Nn.subVectors(e,t),Tn.cross(Nn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Tn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),Tn.cross(Nn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;$i.subVectors(s,i),Qi.subVectors(r,i),Ra.subVectors(e,i);let l=$i.dot(Ra),c=Qi.dot(Ra);if(l<=0&&c<=0)return t.copy(i);Aa.subVectors(e,s);let h=$i.dot(Aa),u=Qi.dot(Aa);if(h>=0&&u<=h)return t.copy(s);let E=l*u-h*c;if(E<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector($i,o);Ca.subVectors(e,r);let m=$i.dot(Ca),f=Qi.dot(Ca);if(f>=0&&m<=f)return t.copy(r);let d=m*c-l*f;if(d<=0&&c>=0&&f<=0)return a=c/(c-f),t.copy(i).addScaledVector(Qi,a);let g=h*f-m*u;if(g<=0&&u-h>=0&&m-f>=0)return ic.subVectors(r,s),a=(u-h)/(u-h+(m-f)),t.copy(s).addScaledVector(ic,a);let p=1/(g+d+E);return o=d*p,a=E*p,t.copy(i).addScaledVector($i,o).addScaledVector(Qi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},lh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},Tr={h:0,s:0,l:0};function Da(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ve=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=kt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Mt.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=Mt.workingColorSpace){return this.r=e,this.g=t,this.b=i,Mt.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=Mt.workingColorSpace){if(e=uu(e,1),t=ut(t,0,1),i=ut(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Da(o,r,e+1/3),this.g=Da(o,r,e),this.b=Da(o,r,e-1/3)}return Mt.toWorkingColorSpace(this,s),this}setStyle(e,t=kt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=kt){let i=lh[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=On(e.r),this.g=On(e.g),this.b=On(e.b),this}copyLinearToSRGB(e){return this.r=ns(e.r),this.g=ns(e.g),this.b=ns(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=kt){return Mt.fromWorkingColorSpace(Kt.copy(this),e),Math.round(ut(Kt.r*255,0,255))*65536+Math.round(ut(Kt.g*255,0,255))*256+Math.round(ut(Kt.b*255,0,255))}getHexString(e=kt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Mt.workingColorSpace){Mt.fromWorkingColorSpace(Kt.copy(this),t);let i=Kt.r,s=Kt.g,r=Kt.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case i:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-i)/u+2;break;case r:l=(i-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Mt.workingColorSpace){return Mt.fromWorkingColorSpace(Kt.copy(this),t),e.r=Kt.r,e.g=Kt.g,e.b=Kt.b,e}getStyle(e=kt){Mt.fromWorkingColorSpace(Kt.copy(this),e);let t=Kt.r,i=Kt.g,s=Kt.b;return e!==kt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(si),this.setHSL(si.h+e,si.s+t,si.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(si),e.getHSL(Tr);let i=Ea(si.h,Tr.h,t),s=Ea(si.s,Tr.s,t),r=Ea(si.l,Tr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Kt=new Ve;Ve.NAMES=lh;var wu=0,_n=class extends Vn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:wu++}),this.uuid=ar(),this.name="",this.type="Material",this.blending=Si,this.side=zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Fr,this.blendDst=Nr,this.blendEquation=li,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ve(0,0,0),this.blendAlpha=0,this.depthFunc=bi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ya,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=vi,this.stencilZFail=vi,this.stencilZPass=vi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Si&&(i.blending=this.blending),this.side!==zn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Fr&&(i.blendSrc=this.blendSrc),this.blendDst!==Nr&&(i.blendDst=this.blendDst),this.blendEquation!==li&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==bi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ya&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==vi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==vi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==vi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Le=class extends _n{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ve(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new jt,this.combine=sl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ut=new B,wr=new Ge,_u=0,Xt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:_u++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=qa,this.updateRanges=[],this.gpuType=In,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)wr.fromBufferAttribute(this,t),wr.applyMatrix3(e),this.setXY(t,wr.x,wr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.applyMatrix3(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.applyMatrix4(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.applyNormalMatrix(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ut.fromBufferAttribute(this,t),Ut.transformDirection(e),this.setXYZ(t,Ut.x,Ut.y,Ut.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=xs(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=tn(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=xs(t,this.array)),t}setX(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=xs(t,this.array)),t}setY(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=xs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=xs(t,this.array)),t}setW(e,t){return this.normalized&&(t=tn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=tn(t,this.array),i=tn(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=tn(t,this.array),i=tn(i,this.array),s=tn(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=tn(t,this.array),i=tn(i,this.array),s=tn(s,this.array),r=tn(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==qa&&(e.usage=this.usage),e}};var Gs=class extends Xt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Us=class extends Xt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var dt=class extends Xt{constructor(e,t,i){super(new Float32Array(e),t,i)}},vu=0,fn=new _t,La=new Pt,ji=new B,ln=new ci,vs=new ci,Vt=new B,It=class n extends Vn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:vu++}),this.uuid=ar(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(yl(e)?Us:Gs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new ot().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return fn.makeRotationFromQuaternion(e),this.applyMatrix4(fn),this}rotateX(e){return fn.makeRotationX(e),this.applyMatrix4(fn),this}rotateY(e){return fn.makeRotationY(e),this.applyMatrix4(fn),this}rotateZ(e){return fn.makeRotationZ(e),this.applyMatrix4(fn),this}translate(e,t,i){return fn.makeTranslation(e,t,i),this.applyMatrix4(fn),this}scale(e,t,i){return fn.makeScale(e,t,i),this.applyMatrix4(fn),this}lookAt(e){return La.lookAt(e),La.updateMatrix(),this.applyMatrix4(La.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ji).negate(),this.translate(ji.x,ji.y,ji.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new dt(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ci);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new B(-1/0,-1/0,-1/0),new B(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];ln.setFromBufferAttribute(r),this.morphTargetsRelative?(Vt.addVectors(this.boundingBox.min,ln.min),this.boundingBox.expandByPoint(Vt),Vt.addVectors(this.boundingBox.max,ln.max),this.boundingBox.expandByPoint(Vt)):(this.boundingBox.expandByPoint(ln.min),this.boundingBox.expandByPoint(ln.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new B,1/0);return}if(e){let i=this.boundingSphere.center;if(ln.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];vs.setFromBufferAttribute(a),this.morphTargetsRelative?(Vt.addVectors(ln.min,vs.min),ln.expandByPoint(Vt),Vt.addVectors(ln.max,vs.max),ln.expandByPoint(Vt)):(ln.expandByPoint(vs.min),ln.expandByPoint(vs.max))}ln.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)Vt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Vt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Vt.fromBufferAttribute(a,c),l&&(ji.fromBufferAttribute(e,c),Vt.add(ji)),s=Math.max(s,i.distanceToSquared(Vt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xt(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let C=0;C<i.count;C++)a[C]=new B,l[C]=new B;let c=new B,h=new B,u=new B,E=new Ge,m=new Ge,f=new Ge,d=new B,g=new B;function p(C,_,T){c.fromBufferAttribute(i,C),h.fromBufferAttribute(i,_),u.fromBufferAttribute(i,T),E.fromBufferAttribute(r,C),m.fromBufferAttribute(r,_),f.fromBufferAttribute(r,T),h.sub(c),u.sub(c),m.sub(E),f.sub(E);let L=1/(m.x*f.y-f.x*m.y);isFinite(L)&&(d.copy(h).multiplyScalar(f.y).addScaledVector(u,-m.y).multiplyScalar(L),g.copy(u).multiplyScalar(m.x).addScaledVector(h,-f.x).multiplyScalar(L),a[C].add(d),a[_].add(d),a[T].add(d),l[C].add(g),l[_].add(g),l[T].add(g))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let C=0,_=x.length;C<_;++C){let T=x[C],L=T.start,G=T.count;for(let U=L,k=L+G;U<k;U+=3)p(e.getX(U+0),e.getX(U+1),e.getX(U+2))}let w=new B,y=new B,R=new B,S=new B;function A(C){R.fromBufferAttribute(s,C),S.copy(R);let _=a[C];w.copy(_),w.sub(R.multiplyScalar(R.dot(_))).normalize(),y.crossVectors(S,_);let L=y.dot(l[C])<0?-1:1;o.setXYZW(C,w.x,w.y,w.z,L)}for(let C=0,_=x.length;C<_;++C){let T=x[C],L=T.start,G=T.count;for(let U=L,k=L+G;U<k;U+=3)A(e.getX(U+0)),A(e.getX(U+1)),A(e.getX(U+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let E=0,m=i.count;E<m;E++)i.setXYZ(E,0,0,0);let s=new B,r=new B,o=new B,a=new B,l=new B,c=new B,h=new B,u=new B;if(e)for(let E=0,m=e.count;E<m;E+=3){let f=e.getX(E+0),d=e.getX(E+1),g=e.getX(E+2);s.fromBufferAttribute(t,f),r.fromBufferAttribute(t,d),o.fromBufferAttribute(t,g),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(i,f),l.fromBufferAttribute(i,d),c.fromBufferAttribute(i,g),a.add(h),l.add(h),c.add(h),i.setXYZ(f,a.x,a.y,a.z),i.setXYZ(d,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let E=0,m=t.count;E<m;E+=3)s.fromBufferAttribute(t,E+0),r.fromBufferAttribute(t,E+1),o.fromBufferAttribute(t,E+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),i.setXYZ(E+0,h.x,h.y,h.z),i.setXYZ(E+1,h.x,h.y,h.z),i.setXYZ(E+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Vt.fromBufferAttribute(e,t),Vt.normalize(),e.setXYZ(t,Vt.x,Vt.y,Vt.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,u=a.normalized,E=new c.constructor(l.length*h),m=0,f=0;for(let d=0,g=l.length;d<g;d++){a.isInterleavedBufferAttribute?m=l[d]*a.data.stride+a.offset:m=l[d]*h;for(let p=0;p<h;p++)E[f++]=c[m++]}return new Xt(E,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let E=c[h],m=e(E,i);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,E=c.length;u<E;u++){let m=c[u];h.push(m.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let E=0,m=u.length;E<m;E++)h.push(u[E].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},sc=new _t,wi=new rs,_r=new hi,rc=new B,vr=new B,Sr=new B,br=new B,Ba=new B,Rr=new B,oc=new B,Ar=new B,M=class extends Pt{constructor(e=new It,t=new Le){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Rr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Ba.fromBufferAttribute(u,e),o?Rr.addScaledVector(Ba,h):Rr.addScaledVector(Ba.sub(t),h))}t.add(Rr)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),_r.copy(i.boundingSphere),_r.applyMatrix4(r),wi.copy(e.ray).recast(e.near),!(_r.containsPoint(wi.origin)===!1&&(wi.intersectSphere(_r,rc)===null||wi.origin.distanceToSquared(rc)>(e.far-e.near)**2))&&(sc.copy(r).invert(),wi.copy(e.ray).applyMatrix4(sc),!(i.boundingBox!==null&&wi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,wi)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,E=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let f=0,d=E.length;f<d;f++){let g=E[f],p=o[g.materialIndex],x=Math.max(g.start,m.start),w=Math.min(a.count,Math.min(g.start+g.count,m.start+m.count));for(let y=x,R=w;y<R;y+=3){let S=a.getX(y),A=a.getX(y+1),C=a.getX(y+2);s=Cr(this,p,e,i,c,h,u,S,A,C),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let f=Math.max(0,m.start),d=Math.min(a.count,m.start+m.count);for(let g=f,p=d;g<p;g+=3){let x=a.getX(g),w=a.getX(g+1),y=a.getX(g+2);s=Cr(this,o,e,i,c,h,u,x,w,y),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let f=0,d=E.length;f<d;f++){let g=E[f],p=o[g.materialIndex],x=Math.max(g.start,m.start),w=Math.min(l.count,Math.min(g.start+g.count,m.start+m.count));for(let y=x,R=w;y<R;y+=3){let S=y,A=y+1,C=y+2;s=Cr(this,p,e,i,c,h,u,S,A,C),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let f=Math.max(0,m.start),d=Math.min(l.count,m.start+m.count);for(let g=f,p=d;g<p;g+=3){let x=g,w=g+1,y=g+2;s=Cr(this,o,e,i,c,h,u,x,w,y),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function Su(n,e,t,i,s,r,o,a){let l;if(e.side===qt?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===zn,a),l===null)return null;Ar.copy(a),Ar.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Ar);return c<t.near||c>t.far?null:{distance:c,point:Ar.clone(),object:n}}function Cr(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,vr),n.getVertexPosition(l,Sr),n.getVertexPosition(c,br);let h=Su(n,e,t,i,vr,Sr,br,oc);if(h){let u=new B;oi.getBarycoord(oc,vr,Sr,br,u),s&&(h.uv=oi.getInterpolatedAttribute(s,a,l,c,u,new Ge)),r&&(h.uv1=oi.getInterpolatedAttribute(r,a,l,c,u,new Ge)),o&&(h.normal=oi.getInterpolatedAttribute(o,a,l,c,u,new B),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let E={a,b:l,c,normal:new B,materialIndex:0};oi.getNormal(vr,Sr,br,E.normal),h.face=E,h.barycoord=u}return h}var Z=class n extends It{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],E=0,m=0;f("z","y","x",-1,-1,i,t,e,o,r,0),f("z","y","x",1,-1,i,t,-e,o,r,1),f("x","z","y",1,1,e,i,t,s,o,2),f("x","z","y",1,-1,e,i,-t,s,o,3),f("x","y","z",1,-1,e,t,i,s,r,4),f("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new dt(c,3)),this.setAttribute("normal",new dt(h,3)),this.setAttribute("uv",new dt(u,2));function f(d,g,p,x,w,y,R,S,A,C,_){let T=y/A,L=R/C,G=y/2,U=R/2,k=S/2,X=A+1,V=C+1,te=0,F=0,q=new B;for(let J=0;J<V;J++){let xe=J*L-U;for(let Ie=0;Ie<X;Ie++){let Ue=Ie*T-G;q[d]=Ue*x,q[g]=xe*w,q[p]=k,c.push(q.x,q.y,q.z),q[d]=0,q[g]=0,q[p]=S>0?1:-1,h.push(q.x,q.y,q.z),u.push(Ie/A),u.push(1-J/C),te+=1}}for(let J=0;J<C;J++)for(let xe=0;xe<A;xe++){let Ie=E+xe+X*J,Ue=E+xe+X*(J+1),K=E+(xe+1)+X*(J+1),pe=E+(xe+1)+X*J;l.push(Ie,Ue,pe),l.push(Ue,K,pe),F+=6}a.addGroup(m,F,_),m+=F,E+=te}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Gi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function $t(n){let e={};for(let t=0;t<n.length;t++){let i=Gi(n[t]);for(let s in i)e[s]=i[s]}return e}function bu(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function xl(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Mt.workingColorSpace}var oa={clone:Gi,merge:$t},Ru=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Au=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Yt=class extends _n{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ru,this.fragmentShader=Au,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Gi(e.uniforms),this.uniformsGroups=bu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Fs=class extends Pt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new _t,this.projectionMatrix=new _t,this.projectionMatrixInverse=new _t,this.coordinateSystem=Rn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ri=new B,ac=new Ge,lc=new Ge,Ft=class extends Fs{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Is*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(ma*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Is*2*Math.atan(Math.tan(ma*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ri.x,ri.y).multiplyScalar(-e/ri.z),ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ri.x,ri.y).multiplyScalar(-e/ri.z)}getViewSize(e,t){return this.getViewBounds(e,ac,lc),t.subVectors(lc,ac)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(ma*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},es=-90,ts=1,Yr=class extends Pt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ft(es,ts,e,t);s.layers=this.layers,this.add(s);let r=new Ft(es,ts,e,t);r.layers=this.layers,this.add(r);let o=new Ft(es,ts,e,t);o.layers=this.layers,this.add(o);let a=new Ft(es,ts,e,t);a.layers=this.layers,this.add(a);let l=new Ft(es,ts,e,t);l.layers=this.layers,this.add(l);let c=new Ft(es,ts,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===Rn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ps)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=e.getRenderTarget(),E=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),f=e.xr.enabled;e.xr.enabled=!1;let d=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=d,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(u,E,m),e.xr.enabled=f,i.texture.needsPMREMUpdate=!0}},Ns=class extends Qt{constructor(e=[],t=Li,i,s,r,o,a,l,c,h){super(e,t,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},qr=class extends mn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Ns(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:wn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Z(5,5,5),r=new Yt({name:"CubemapFromEquirect",uniforms:Gi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:qt,blending:Xn});r.uniforms.tEquirect.value=t;let o=new M(s,r),a=t.minFilter;return t.minFilter===mi&&(t.minFilter=wn),new Yr(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},he=class extends Pt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Cu={type:"move"},os=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new he,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new he,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new B,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new B),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new he,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new B,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new B),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let d of e.hand.values()){let g=t.getJointPose(d,i),p=this._getHandJoint(c,d);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],E=h.position.distanceTo(u.position),m=.02,f=.005;c.inputState.pinching&&E>m+f?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&E<=m-f&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Cu)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new he;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},ks=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ve(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Ai=class extends Pt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new jt,this.environmentIntensity=1,this.environmentRotation=new jt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Os=class extends Qt{constructor(e=null,t=1,i=1,s,r,o,a,l,c=nn,h=nn,u,E){super(null,o,a,l,c,h,s,r,u,E),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ga=new B,Hu=new B,Pu=new ot,pn=class{constructor(e=new B(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=Ga.subVectors(i,t).cross(Hu.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Ga),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Pu.getNormalMatrix(e),s=this.coplanarPoint(Ga).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},_i=new hi,Hr=new B,as=class{constructor(e=new pn,t=new pn,i=new pn,s=new pn,r=new pn,o=new pn){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Rn){let i=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],E=s[7],m=s[8],f=s[9],d=s[10],g=s[11],p=s[12],x=s[13],w=s[14],y=s[15];if(i[0].setComponents(l-r,E-c,g-m,y-p).normalize(),i[1].setComponents(l+r,E+c,g+m,y+p).normalize(),i[2].setComponents(l+o,E+h,g+f,y+x).normalize(),i[3].setComponents(l-o,E-h,g-f,y-x).normalize(),i[4].setComponents(l-a,E-u,g-d,y-w).normalize(),t===Rn)i[5].setComponents(l+a,E+u,g+d,y+w).normalize();else if(t===Ps)i[5].setComponents(a,u,d,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),_i.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),_i.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(_i)}intersectsSprite(e){return _i.center.set(0,0,0),_i.radius=.7071067811865476,_i.applyMatrix4(e.matrixWorld),this.intersectsSphere(_i)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Hr.x=s.normal.x>0?e.max.x:e.min.x,Hr.y=s.normal.y>0?e.max.y:e.min.y,Hr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Hr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var zs=class extends _n{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ve(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Zr=new B,Jr=new B,cc=new _t,Ss=new rs,Pr=new hi,Ua=new B,hc=new B,Kr=class extends Pt{constructor(e=new It,t=new zs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)Zr.fromBufferAttribute(t,s-1),Jr.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Zr.distanceTo(Jr);e.setAttribute("lineDistance",new dt(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Pr.copy(i.boundingSphere),Pr.applyMatrix4(s),Pr.radius+=r,e.ray.intersectsSphere(Pr)===!1)return;cc.copy(s).invert(),Ss.copy(e.ray).applyMatrix4(cc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,E=i.attributes.position;if(h!==null){let m=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let d=m,g=f-1;d<g;d+=c){let p=h.getX(d),x=h.getX(d+1),w=Ir(this,e,Ss,l,p,x,d);w&&t.push(w)}if(this.isLineLoop){let d=h.getX(f-1),g=h.getX(m),p=Ir(this,e,Ss,l,d,g,f-1);p&&t.push(p)}}else{let m=Math.max(0,o.start),f=Math.min(E.count,o.start+o.count);for(let d=m,g=f-1;d<g;d+=c){let p=Ir(this,e,Ss,l,d,d+1,d);p&&t.push(p)}if(this.isLineLoop){let d=Ir(this,e,Ss,l,f-1,m,f-1);d&&t.push(d)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Ir(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(Zr.fromBufferAttribute(a,s),Jr.fromBufferAttribute(a,r),t.distanceSqToSegment(Zr,Jr,Ua,hc)>i)return;Ua.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Ua);if(!(c<e.near||c>e.far))return{distance:c,point:hc.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var uc=new B,dc=new B,$r=class extends Kr{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)uc.fromBufferAttribute(t,s),dc.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+uc.distanceTo(dc);e.setAttribute("lineDistance",new dt(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Ci=class extends _n{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ve(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},fc=new _t,Za=new rs,Dr=new hi,Lr=new B,ls=class extends Pt{constructor(e=new It,t=new Ci){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Dr.copy(i.boundingSphere),Dr.applyMatrix4(s),Dr.radius+=r,e.ray.intersectsSphere(Dr)===!1)return;fc.copy(s).invert(),Za.copy(e.ray).applyMatrix4(fc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,u=i.attributes.position;if(c!==null){let E=Math.max(0,o.start),m=Math.min(c.count,o.start+o.count);for(let f=E,d=m;f<d;f++){let g=c.getX(f);Lr.fromBufferAttribute(u,g),pc(Lr,g,l,s,e,t,this)}}else{let E=Math.max(0,o.start),m=Math.min(u.count,o.start+o.count);for(let f=E,d=m;f<d;f++)Lr.fromBufferAttribute(u,f),pc(Lr,f,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function pc(n,e,t,i,s,r,o){let a=Za.distanceSqToPoint(n);if(a<t){let l=new B;Za.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Wn=class extends Qt{constructor(e,t,i,s,r,o,a,l,c){super(e,t,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Vs=class extends Qt{constructor(e,t,i=Ei,s,r,o,a=nn,l=nn,c,h=is){if(h!==is&&h!==ms)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ss(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},cn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],E=i[s+1]-h,m=(o-h)/E;return(s+m)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new Ge:new B);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new B,s=[],r=[],o=[],a=new B,l=new _t;for(let m=0;m<=e;m++){let f=m/e;s[m]=this.getTangentAt(f,new B)}r[0]=new B,o[0]=new B;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),E=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),E<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let m=1;m<=e;m++){if(r[m]=r[m-1].clone(),o[m]=o[m-1].clone(),a.crossVectors(s[m-1],s[m]),a.length()>Number.EPSILON){a.normalize();let f=Math.acos(ut(s[m-1].dot(s[m]),-1,1));r[m].applyMatrix4(l.makeRotationAxis(a,f))}o[m].crossVectors(s[m],r[m])}if(t===!0){let m=Math.acos(ut(r[0].dot(r[e]),-1,1));m/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(m=-m);for(let f=1;f<=e;f++)r[f].applyMatrix4(l.makeRotationAxis(s[f],m*f)),o[f].crossVectors(s[f],r[f])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},cs=class extends cn{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new Ge){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),E=l-this.aX,m=c-this.aY;l=E*h-m*u+this.aX,c=E*u+m*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Qr=class extends cs{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Tl(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let E=(o-r)/c-(a-r)/(c+h)+(a-o)/h,m=(a-o)/h-(l-o)/(h+u)+(l-a)/u;E*=h,m*=h,s(o,a,E,m)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Br=new B,Fa=new Tl,Na=new Tl,ka=new Tl,sn=class extends cn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new B){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Br.subVectors(s[0],s[1]).add(s[0]),c=Br);let u=s[a%r],E=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Br.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Br),this.curveType==="centripetal"||this.curveType==="chordal"){let m=this.curveType==="chordal"?.5:.25,f=Math.pow(c.distanceToSquared(u),m),d=Math.pow(u.distanceToSquared(E),m),g=Math.pow(E.distanceToSquared(h),m);d<1e-4&&(d=1),f<1e-4&&(f=d),g<1e-4&&(g=d),Fa.initNonuniformCatmullRom(c.x,u.x,E.x,h.x,f,d,g),Na.initNonuniformCatmullRom(c.y,u.y,E.y,h.y,f,d,g),ka.initNonuniformCatmullRom(c.z,u.z,E.z,h.z,f,d,g)}else this.curveType==="catmullrom"&&(Fa.initCatmullRom(c.x,u.x,E.x,h.x,this.tension),Na.initCatmullRom(c.y,u.y,E.y,h.y,this.tension),ka.initCatmullRom(c.z,u.z,E.z,h.z,this.tension));return i.set(Fa.calc(l),Na.calc(l),ka.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new B().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function mc(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function Iu(n,e){let t=1-n;return t*t*e}function Du(n,e){return 2*(1-n)*n*e}function Lu(n,e){return n*n*e}function Rs(n,e,t,i){return Iu(n,e)+Du(n,t)+Lu(n,i)}function Bu(n,e){let t=1-n;return t*t*t*e}function Gu(n,e){let t=1-n;return 3*t*t*n*e}function Uu(n,e){return 3*(1-n)*n*n*e}function Fu(n,e){return n*n*n*e}function As(n,e,t,i,s){return Bu(n,e)+Gu(n,t)+Uu(n,i)+Fu(n,s)}var Ws=class extends cn{constructor(e=new Ge,t=new Ge,i=new Ge,s=new Ge){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new Ge){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(As(e,s.x,r.x,o.x,a.x),As(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},jr=class extends cn{constructor(e=new B,t=new B,i=new B,s=new B){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new B){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(As(e,s.x,r.x,o.x,a.x),As(e,s.y,r.y,o.y,a.y),As(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Xs=class extends cn{constructor(e=new Ge,t=new Ge){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new Ge){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Ge){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},eo=class extends cn{constructor(e=new B,t=new B){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new B){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new B){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ys=class extends cn{constructor(e=new Ge,t=new Ge,i=new Ge){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new Ge){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Rs(e,s.x,r.x,o.x),Rs(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},qs=class extends cn{constructor(e=new B,t=new B,i=new B){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new B){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Rs(e,s.x,r.x,o.x),Rs(e,s.y,r.y,o.y),Rs(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Zs=class extends cn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new Ge){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return i.set(mc(a,l.x,c.x,h.x,u.x),mc(a,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new Ge().fromArray(s))}return this}},Ja=Object.freeze({__proto__:null,ArcCurve:Qr,CatmullRomCurve3:sn,CubicBezierCurve:Ws,CubicBezierCurve3:jr,EllipseCurve:cs,LineCurve:Xs,LineCurve3:eo,QuadraticBezierCurve:Ys,QuadraticBezierCurve3:qs,SplineCurve:Zs}),to=class extends cn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ja[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new Ja[s.type]().fromJSON(s))}return this}},no=class extends to{constructor(e){super(),this.type="Path",this.currentPoint=new Ge,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Xs(this.currentPoint.clone(),new Ge(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new Ys(this.currentPoint.clone(),new Ge(e,t),new Ge(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new Ws(this.currentPoint.clone(),new Ge(e,t),new Ge(i,s),new Ge(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Zs(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,o,a,l),this}absellipse(e,t,i,s,r,o,a,l){let c=new cs(e,t,i,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},ui=class n extends It{constructor(e=[new Ge(0,-.5),new Ge(.5,0),new Ge(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=ut(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,u=new B,E=new Ge,m=new B,f=new B,d=new B,g=0,p=0;for(let x=0;x<=e.length-1;x++)switch(x){case 0:g=e[x+1].x-e[x].x,p=e[x+1].y-e[x].y,m.x=p*1,m.y=-g,m.z=p*0,d.copy(m),m.normalize(),l.push(m.x,m.y,m.z);break;case e.length-1:l.push(d.x,d.y,d.z);break;default:g=e[x+1].x-e[x].x,p=e[x+1].y-e[x].y,m.x=p*1,m.y=-g,m.z=p*0,f.copy(m),m.x+=d.x,m.y+=d.y,m.z+=d.z,m.normalize(),l.push(m.x,m.y,m.z),d.copy(f)}for(let x=0;x<=t;x++){let w=i+x*h*s,y=Math.sin(w),R=Math.cos(w);for(let S=0;S<=e.length-1;S++){u.x=e[S].x*y,u.y=e[S].y,u.z=e[S].x*R,o.push(u.x,u.y,u.z),E.x=x/t,E.y=S/(e.length-1),a.push(E.x,E.y);let A=l[3*S+0]*y,C=l[3*S+1],_=l[3*S+0]*R;c.push(A,C,_)}}for(let x=0;x<t;x++)for(let w=0;w<e.length-1;w++){let y=w+x*e.length,R=y,S=y+e.length,A=y+e.length+1,C=y+1;r.push(R,S,C),r.push(A,C,S)}this.setIndex(r),this.setAttribute("position",new dt(o,3)),this.setAttribute("uv",new dt(a,2)),this.setAttribute("normal",new dt(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},vt=class n extends ui{constructor(e=1,t=1,i=4,s=8){let r=new no;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(i),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:s}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},Ct=class n extends It{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new B,h=new Ge;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,E=3;u<=t;u++,E+=3){let m=i+u/t*s;c.x=e*Math.cos(m),c.y=e*Math.sin(m),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[E]/e+1)/2,h.y=(o[E+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new dt(o,3)),this.setAttribute("normal",new dt(a,3)),this.setAttribute("uv",new dt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},_e=class n extends It{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],E=[],m=[],f=0,d=[],g=i/2,p=0;x(),o===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new dt(u,3)),this.setAttribute("normal",new dt(E,3)),this.setAttribute("uv",new dt(m,2));function x(){let y=new B,R=new B,S=0,A=(t-e)/i;for(let C=0;C<=r;C++){let _=[],T=C/r,L=T*(t-e)+e;for(let G=0;G<=s;G++){let U=G/s,k=U*l+a,X=Math.sin(k),V=Math.cos(k);R.x=L*X,R.y=-T*i+g,R.z=L*V,u.push(R.x,R.y,R.z),y.set(X,A,V).normalize(),E.push(y.x,y.y,y.z),m.push(U,1-T),_.push(f++)}d.push(_)}for(let C=0;C<s;C++)for(let _=0;_<r;_++){let T=d[_][C],L=d[_+1][C],G=d[_+1][C+1],U=d[_][C+1];(e>0||_!==0)&&(h.push(T,L,U),S+=3),(t>0||_!==r-1)&&(h.push(L,G,U),S+=3)}c.addGroup(p,S,0),p+=S}function w(y){let R=f,S=new Ge,A=new B,C=0,_=y===!0?e:t,T=y===!0?1:-1;for(let G=1;G<=s;G++)u.push(0,g*T,0),E.push(0,T,0),m.push(.5,.5),f++;let L=f;for(let G=0;G<=s;G++){let k=G/s*l+a,X=Math.cos(k),V=Math.sin(k);A.x=_*V,A.y=g*T,A.z=_*X,u.push(A.x,A.y,A.z),E.push(0,T,0),S.x=X*.5+.5,S.y=V*.5*T+.5,m.push(S.x,S.y),f++}for(let G=0;G<s;G++){let U=R+G,k=L+G;y===!0?h.push(k,k+1,U):h.push(k+1,k,U),C+=3}c.addGroup(p,C,y===!0?1:2),p+=C}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Qe=class n extends _e{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},hs=class n extends It{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new dt(r,3)),this.setAttribute("normal",new dt(r.slice(),3)),this.setAttribute("uv",new dt(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(x){let w=new B,y=new B,R=new B;for(let S=0;S<t.length;S+=3)m(t[S+0],w),m(t[S+1],y),m(t[S+2],R),l(w,y,R,x)}function l(x,w,y,R){let S=R+1,A=[];for(let C=0;C<=S;C++){A[C]=[];let _=x.clone().lerp(y,C/S),T=w.clone().lerp(y,C/S),L=S-C;for(let G=0;G<=L;G++)G===0&&C===S?A[C][G]=_:A[C][G]=_.clone().lerp(T,G/L)}for(let C=0;C<S;C++)for(let _=0;_<2*(S-C)-1;_++){let T=Math.floor(_/2);_%2===0?(E(A[C][T+1]),E(A[C+1][T]),E(A[C][T])):(E(A[C][T+1]),E(A[C+1][T+1]),E(A[C+1][T]))}}function c(x){let w=new B;for(let y=0;y<r.length;y+=3)w.x=r[y+0],w.y=r[y+1],w.z=r[y+2],w.normalize().multiplyScalar(x),r[y+0]=w.x,r[y+1]=w.y,r[y+2]=w.z}function h(){let x=new B;for(let w=0;w<r.length;w+=3){x.x=r[w+0],x.y=r[w+1],x.z=r[w+2];let y=g(x)/2/Math.PI+.5,R=p(x)/Math.PI+.5;o.push(y,1-R)}f(),u()}function u(){for(let x=0;x<o.length;x+=6){let w=o[x+0],y=o[x+2],R=o[x+4],S=Math.max(w,y,R),A=Math.min(w,y,R);S>.9&&A<.1&&(w<.2&&(o[x+0]+=1),y<.2&&(o[x+2]+=1),R<.2&&(o[x+4]+=1))}}function E(x){r.push(x.x,x.y,x.z)}function m(x,w){let y=x*3;w.x=e[y+0],w.y=e[y+1],w.z=e[y+2]}function f(){let x=new B,w=new B,y=new B,R=new B,S=new Ge,A=new Ge,C=new Ge;for(let _=0,T=0;_<r.length;_+=9,T+=6){x.set(r[_+0],r[_+1],r[_+2]),w.set(r[_+3],r[_+4],r[_+5]),y.set(r[_+6],r[_+7],r[_+8]),S.set(o[T+0],o[T+1]),A.set(o[T+2],o[T+3]),C.set(o[T+4],o[T+5]),R.copy(x).add(w).add(y).divideScalar(3);let L=g(R);d(S,T+0,x,L),d(A,T+2,w,L),d(C,T+4,y,L)}}function d(x,w,y,R){R<0&&x.x===1&&(o[w]=x.x-1),y.x===0&&y.z===0&&(o[w]=R/2/Math.PI+.5)}function g(x){return Math.atan2(x.z,-x.x)}function p(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}},di=class n extends hs{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=1/i,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-i,0,-s,i,0,s,-i,0,s,i,-s,-i,0,-s,i,0,s,-i,0,s,i,0,-i,0,-s,i,0,-s,-i,0,s,i,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var Js=class n extends hs{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Lt=class n extends hs{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},ft=class n extends It{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,u=e/a,E=t/l,m=[],f=[],d=[],g=[];for(let p=0;p<h;p++){let x=p*E-o;for(let w=0;w<c;w++){let y=w*u-r;f.push(y,-x,0),d.push(0,0,1),g.push(w/a),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let x=0;x<a;x++){let w=x+c*p,y=x+c*(p+1),R=x+1+c*(p+1),S=x+1+c*p;m.push(w,y,S),m.push(y,R,S)}this.setIndex(m),this.setAttribute("position",new dt(f,3)),this.setAttribute("normal",new dt(d,3)),this.setAttribute("uv",new dt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},An=class n extends It{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=e,E=(t-e)/s,m=new B,f=new Ge;for(let d=0;d<=s;d++){for(let g=0;g<=i;g++){let p=r+g/i*o;m.x=u*Math.cos(p),m.y=u*Math.sin(p),l.push(m.x,m.y,m.z),c.push(0,0,1),f.x=(m.x/t+1)/2,f.y=(m.y/t+1)/2,h.push(f.x,f.y)}u+=E}for(let d=0;d<s;d++){let g=d*(i+1);for(let p=0;p<i;p++){let x=p+g,w=x,y=x+i+1,R=x+i+2,S=x+1;a.push(w,y,S),a.push(y,R,S)}}this.setIndex(a),this.setAttribute("position",new dt(l,3)),this.setAttribute("normal",new dt(c,3)),this.setAttribute("uv",new dt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var fe=class n extends It{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new B,E=new B,m=[],f=[],d=[],g=[];for(let p=0;p<=i;p++){let x=[],w=p/i,y=0;p===0&&o===0?y=.5/t:p===i&&l===Math.PI&&(y=-.5/t);for(let R=0;R<=t;R++){let S=R/t;u.x=-e*Math.cos(s+S*r)*Math.sin(o+w*a),u.y=e*Math.cos(o+w*a),u.z=e*Math.sin(s+S*r)*Math.sin(o+w*a),f.push(u.x,u.y,u.z),E.copy(u).normalize(),d.push(E.x,E.y,E.z),g.push(S+y,1-w),x.push(c++)}h.push(x)}for(let p=0;p<i;p++)for(let x=0;x<t;x++){let w=h[p][x+1],y=h[p][x],R=h[p+1][x],S=h[p+1][x+1];(p!==0||o>0)&&m.push(w,y,S),(p!==i-1||l<Math.PI)&&m.push(y,R,S)}this.setIndex(m),this.setAttribute("position",new dt(f,3)),this.setAttribute("normal",new dt(d,3)),this.setAttribute("uv",new dt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var qe=class n extends It{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new B,u=new B,E=new B;for(let m=0;m<=i;m++)for(let f=0;f<=s;f++){let d=f/s*r,g=m/i*Math.PI*2;u.x=(e+t*Math.cos(g))*Math.cos(d),u.y=(e+t*Math.cos(g))*Math.sin(d),u.z=t*Math.sin(g),a.push(u.x,u.y,u.z),h.x=e*Math.cos(d),h.y=e*Math.sin(d),E.subVectors(u,h).normalize(),l.push(E.x,E.y,E.z),c.push(f/s),c.push(m/i)}for(let m=1;m<=i;m++)for(let f=1;f<=s;f++){let d=(s+1)*m+f-1,g=(s+1)*(m-1)+f-1,p=(s+1)*(m-1)+f,x=(s+1)*m+f;o.push(d,g,x),o.push(g,p,x)}this.setIndex(o),this.setAttribute("position",new dt(a,3)),this.setAttribute("normal",new dt(l,3)),this.setAttribute("uv",new dt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var En=class n extends It{constructor(e=new qs(new B(-1,-1,0),new B(-1,1,0),new B(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new B,l=new B,c=new Ge,h=new B,u=[],E=[],m=[],f=[];d(),this.setIndex(f),this.setAttribute("position",new dt(u,3)),this.setAttribute("normal",new dt(E,3)),this.setAttribute("uv",new dt(m,2));function d(){for(let w=0;w<t;w++)g(w);g(r===!1?t:0),x(),p()}function g(w){h=e.getPointAt(w/t,h);let y=o.normals[w],R=o.binormals[w];for(let S=0;S<=s;S++){let A=S/s*Math.PI*2,C=Math.sin(A),_=-Math.cos(A);l.x=_*y.x+C*R.x,l.y=_*y.y+C*R.y,l.z=_*y.z+C*R.z,l.normalize(),E.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,u.push(a.x,a.y,a.z)}}function p(){for(let w=1;w<=t;w++)for(let y=1;y<=s;y++){let R=(s+1)*(w-1)+(y-1),S=(s+1)*w+(y-1),A=(s+1)*w+y,C=(s+1)*(w-1)+y;f.push(R,S,C),f.push(S,A,C)}}function x(){for(let w=0;w<=t;w++)for(let y=0;y<=s;y++)c.x=w/t,c.y=y/s,m.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Ja[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Ks=class extends _n{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Ve(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var D=class extends _n{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ve(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ve(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=El,this.normalScale=new Ge(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new jt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var io=class extends _n{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Zc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},so=class extends _n{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Gr(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Nu(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Hi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ro=class extends Hi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Va,endingEnd:Va}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Wa:r=e,a=2*t-i;break;case Xa:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Wa:o=e,l=2*i-t;break;case Xa:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,E=this._weightPrev,m=this._weightNext,f=(i-t)/(s-t),d=f*f,g=d*f,p=-E*g+2*E*d-E*f,x=(1+E)*g+(-1.5-2*E)*d+(-.5+E)*f+1,w=(-1-m)*g+(1.5+m)*d+.5*f,y=m*g-m*d;for(let R=0;R!==a;++R)r[R]=p*o[h+R]+x*o[c+R]+w*o[l+R]+y*o[u+R];return r}},oo=class extends Hi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(s-t),u=1-h;for(let E=0;E!==a;++E)r[E]=o[c+E]*u+o[l+E]*h;return r}},ao=class extends Hi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},hn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Gr(t,this.TimeBufferType),this.values=Gr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Gr(e.times,Array),values:Gr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new ao(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new oo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ro(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Cs:t=this.InterpolantFactoryMethodDiscrete;break;case zr:t=this.InterpolantFactoryMethodLinear;break;case Ur:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Cs;case this.InterpolantFactoryMethodLinear:return zr;case this.InterpolantFactoryMethodSmooth:return Ur}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Nu(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Ur,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let u=a*i,E=u-i,m=u+i;for(let f=0;f!==i;++f){let d=t[u+f];if(d!==t[E+f]||d!==t[m+f]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*i,E=o*i;for(let m=0;m!==i;++m)t[E+m]=t[u+m]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};hn.prototype.ValueTypeName="";hn.prototype.TimeBufferType=Float32Array;hn.prototype.ValueBufferType=Float32Array;hn.prototype.DefaultInterpolation=zr;var fi=class extends hn{constructor(e,t,i){super(e,t,i)}};fi.prototype.ValueTypeName="bool";fi.prototype.ValueBufferType=Array;fi.prototype.DefaultInterpolation=Cs;fi.prototype.InterpolantFactoryMethodLinear=void 0;fi.prototype.InterpolantFactoryMethodSmooth=void 0;var lo=class extends hn{constructor(e,t,i,s){super(e,t,i,s)}};lo.prototype.ValueTypeName="color";var co=class extends hn{constructor(e,t,i,s){super(e,t,i,s)}};co.prototype.ValueTypeName="number";var ho=class extends Hi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)Dt.slerpFlat(r,0,o,c-a,o,c,l);return r}},$s=class extends hn{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new ho(this.times,this.values,this.getValueSize(),e)}};$s.prototype.ValueTypeName="quaternion";$s.prototype.InterpolantFactoryMethodSmooth=void 0;var pi=class extends hn{constructor(e,t,i){super(e,t,i)}};pi.prototype.ValueTypeName="string";pi.prototype.ValueBufferType=Array;pi.prototype.DefaultInterpolation=Cs;pi.prototype.InterpolantFactoryMethodLinear=void 0;pi.prototype.InterpolantFactoryMethodSmooth=void 0;var uo=class extends hn{constructor(e,t,i,s){super(e,t,i,s)}};uo.prototype.ValueTypeName="vector";var fo=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,E=c.length;u<E;u+=2){let m=c[u],f=c[u+1];if(m.global&&(m.lastIndex=0),m.test(h))return f}return null}}},ch=new fo,po=class{constructor(e){this.manager=e!==void 0?e:ch,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};po.DEFAULT_MATERIAL_NAME="__DEFAULT";var Pi=class extends Pt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ve(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Qs=class extends Pi{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Pt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ve(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Oa=new _t,Ec=new B,gc=new B,js=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ge(512,512),this.map=null,this.mapPass=null,this.matrix=new _t,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new as,this._frameExtents=new Ge(1,1),this._viewportCount=1,this._viewports=[new xt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;Ec.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ec),gc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(gc),t.updateMatrixWorld(),Oa.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Oa),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Oa)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Ka=class extends js{constructor(){super(new Ft(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Is*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(i!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=i,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},Ii=class extends Pi{constructor(e,t,i=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Pt.DEFAULT_UP),this.updateMatrix(),this.target=new Pt,this.distance=i,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new Ka}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Mc=new _t,bs=new B,za=new B,$a=class extends js{constructor(){super(new Ft(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Ge(4,2),this._viewportCount=6,this._viewports=[new xt(2,1,1,1),new xt(0,1,1,1),new xt(3,1,1,1),new xt(1,1,1,1),new xt(3,0,1,1),new xt(1,0,1,1)],this._cubeDirections=[new B(1,0,0),new B(-1,0,0),new B(0,0,1),new B(0,0,-1),new B(0,1,0),new B(0,-1,0)],this._cubeUps=[new B(0,1,0),new B(0,1,0),new B(0,1,0),new B(0,1,0),new B(0,0,1),new B(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),bs.setFromMatrixPosition(e.matrixWorld),i.position.copy(bs),za.copy(i.position),za.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(za),i.updateMatrixWorld(),s.makeTranslation(-bs.x,-bs.y,-bs.z),Mc.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Mc)}},Nt=class extends Pi{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new $a}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Di=class extends Fs{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Qa=class extends js{constructor(){super(new Di(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},us=class extends Pi{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Pt.DEFAULT_UP),this.updateMatrix(),this.target=new Pt,this.shadow=new Qa}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var mo=class extends Ft{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e,this.index=0}};var wl="\\[\\]\\.:\\/",ku=new RegExp("["+wl+"]","g"),_l="[^"+wl+"]",Ou="[^"+wl.replace("\\.","")+"]",zu=/((?:WC+[\/:])*)/.source.replace("WC",_l),Vu=/(WCOD+)?/.source.replace("WCOD",Ou),Wu=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",_l),Xu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",_l),Yu=new RegExp("^"+zu+Vu+Wu+Xu+"$"),qu=["material","materials","bones","map"],ja=class{constructor(e,t,i){let s=i||At.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},At=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(ku,"")}static parseTrackName(e){let t=Yu.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);qu.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};At.Composite=ja;At.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};At.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};At.prototype.GetterByBindingType=[At.prototype._getValue_direct,At.prototype._getValue_array,At.prototype._getValue_arrayElement,At.prototype._getValue_toArray];At.prototype.SetterByBindingTypeAndVersioning=[[At.prototype._setValue_direct,At.prototype._setValue_direct_setNeedsUpdate,At.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[At.prototype._setValue_array,At.prototype._setValue_array_setNeedsUpdate,At.prototype._setValue_array_setMatrixWorldNeedsUpdate],[At.prototype._setValue_arrayElement,At.prototype._setValue_arrayElement_setNeedsUpdate,At.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[At.prototype._setValue_fromArray,At.prototype._setValue_fromArray_setNeedsUpdate,At.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var fE=new Float32Array(1);var ds=class extends $r{constructor(e=10,t=10,i=4473924,s=8947848){i=new Ve(i),s=new Ve(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let E=0,m=0,f=-a;E<=t;E++,f+=o){l.push(-a,0,f,a,0,f),l.push(f,0,-a,f,0,a);let d=E===r?i:s;d.toArray(c,m),m+=3,d.toArray(c,m),m+=3,d.toArray(c,m),m+=3,d.toArray(c,m),m+=3}let h=new It;h.setAttribute("position",new dt(l,3)),h.setAttribute("color",new dt(c,3));let u=new zs({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};function vl(n,e,t,i){let s=Zu(i);switch(t){case cl:return n*e;case ul:return n*e;case dl:return n*e*2;case fl:return n*e/s.components*s.byteLength;case Po:return n*e/s.components*s.byteLength;case pl:return n*e*2/s.components*s.byteLength;case Io:return n*e*2/s.components*s.byteLength;case hl:return n*e*3/s.components*s.byteLength;case rn:return n*e*4/s.components*s.byteLength;case Do:return n*e*4/s.components*s.byteLength;case nr:case ir:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case sr:case rr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Bo:case Uo:return Math.max(n,16)*Math.max(e,8)/4;case Lo:case Go:return Math.max(n,8)*Math.max(e,8)/2;case Fo:case No:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ko:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Oo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case zo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Vo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Wo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Xo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Yo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case qo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Zo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Jo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ko:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case $o:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Qo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case jo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case ea:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case or:case ta:case na:return Math.ceil(n/4)*Math.ceil(e/4)*16;case ml:case ia:return Math.ceil(n/4)*Math.ceil(e/4)*8;case sa:case ra:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Zu(n){switch(n){case Pn:case ol:return{byteLength:1,components:1};case fs:case al:case gi:return{byteLength:2,components:1};case Co:case Ho:return{byteLength:2,components:4};case Ei:case Ao:case In:return{byteLength:4,components:1};case ll:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"175"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="175");function Dh(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Ku(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,u=c.byteLength,E=n.createBuffer();n.bindBuffer(l,E),n.bufferData(l,c,h),a.onUploadCallback();let m;if(c instanceof Float32Array)m=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=n.SHORT;else if(c instanceof Uint32Array)m=n.UNSIGNED_INT;else if(c instanceof Int32Array)m=n.INT;else if(c instanceof Int8Array)m=n.BYTE;else if(c instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:E,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function i(a,l,c){let h=l.array,u=l.updateRanges;if(n.bindBuffer(c,a),u.length===0)n.bufferSubData(c,0,h);else{u.sort((m,f)=>m.start-f.start);let E=0;for(let m=1;m<u.length;m++){let f=u[E],d=u[m];d.start<=f.start+f.count+1?f.count=Math.max(f.count,d.start+d.count-f.start):(++E,u[E]=d)}u.length=E+1;for(let m=0,f=u.length;m<f;m++){let d=u[m];n.bufferSubData(c,d.start*h.BYTES_PER_ELEMENT,h,d.start,d.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var $u=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Qu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ju=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ed=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,td=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,nd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,id=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,sd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,rd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,od=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ad=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ld=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,cd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,hd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ud=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,dd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,fd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,pd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,md=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ed=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,gd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Md=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,yd=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,xd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Td=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,wd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,_d=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,vd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Sd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,bd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Rd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ad=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Cd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Hd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Pd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Id=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Dd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ld=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Bd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Gd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ud=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Fd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Nd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,kd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Od=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Vd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Wd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Xd=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,qd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Jd=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Kd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,$d=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Qd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,jd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ef=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,tf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,nf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,sf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,rf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,of=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,af=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,lf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,cf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,uf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,df=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ff=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,pf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Ef=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,gf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,xf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Tf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,wf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_f=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,vf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Sf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,bf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Rf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Af=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Cf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Hf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Pf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,If=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Df=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Lf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Bf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Gf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Uf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ff=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Nf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,kf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Of=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,zf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Vf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Wf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Xf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Yf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,qf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Jf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Kf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,$f=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Qf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ep=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,np=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ip=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,sp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,rp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,op=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,ap=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,lp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cp=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,hp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,up=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,dp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,pp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Ep=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Mp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,yp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,wp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_p=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sp=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,bp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Rp=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ap=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Cp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Hp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ct={alphahash_fragment:$u,alphahash_pars_fragment:Qu,alphamap_fragment:ju,alphamap_pars_fragment:ed,alphatest_fragment:td,alphatest_pars_fragment:nd,aomap_fragment:id,aomap_pars_fragment:sd,batching_pars_vertex:rd,batching_vertex:od,begin_vertex:ad,beginnormal_vertex:ld,bsdfs:cd,iridescence_fragment:hd,bumpmap_pars_fragment:ud,clipping_planes_fragment:dd,clipping_planes_pars_fragment:fd,clipping_planes_pars_vertex:pd,clipping_planes_vertex:md,color_fragment:Ed,color_pars_fragment:gd,color_pars_vertex:Md,color_vertex:yd,common:xd,cube_uv_reflection_fragment:Td,defaultnormal_vertex:wd,displacementmap_pars_vertex:_d,displacementmap_vertex:vd,emissivemap_fragment:Sd,emissivemap_pars_fragment:bd,colorspace_fragment:Rd,colorspace_pars_fragment:Ad,envmap_fragment:Cd,envmap_common_pars_fragment:Hd,envmap_pars_fragment:Pd,envmap_pars_vertex:Id,envmap_physical_pars_fragment:Vd,envmap_vertex:Dd,fog_vertex:Ld,fog_pars_vertex:Bd,fog_fragment:Gd,fog_pars_fragment:Ud,gradientmap_pars_fragment:Fd,lightmap_pars_fragment:Nd,lights_lambert_fragment:kd,lights_lambert_pars_fragment:Od,lights_pars_begin:zd,lights_toon_fragment:Wd,lights_toon_pars_fragment:Xd,lights_phong_fragment:Yd,lights_phong_pars_fragment:qd,lights_physical_fragment:Zd,lights_physical_pars_fragment:Jd,lights_fragment_begin:Kd,lights_fragment_maps:$d,lights_fragment_end:Qd,logdepthbuf_fragment:jd,logdepthbuf_pars_fragment:ef,logdepthbuf_pars_vertex:tf,logdepthbuf_vertex:nf,map_fragment:sf,map_pars_fragment:rf,map_particle_fragment:of,map_particle_pars_fragment:af,metalnessmap_fragment:lf,metalnessmap_pars_fragment:cf,morphinstance_vertex:hf,morphcolor_vertex:uf,morphnormal_vertex:df,morphtarget_pars_vertex:ff,morphtarget_vertex:pf,normal_fragment_begin:mf,normal_fragment_maps:Ef,normal_pars_fragment:gf,normal_pars_vertex:Mf,normal_vertex:yf,normalmap_pars_fragment:xf,clearcoat_normal_fragment_begin:Tf,clearcoat_normal_fragment_maps:wf,clearcoat_pars_fragment:_f,iridescence_pars_fragment:vf,opaque_fragment:Sf,packing:bf,premultiplied_alpha_fragment:Rf,project_vertex:Af,dithering_fragment:Cf,dithering_pars_fragment:Hf,roughnessmap_fragment:Pf,roughnessmap_pars_fragment:If,shadowmap_pars_fragment:Df,shadowmap_pars_vertex:Lf,shadowmap_vertex:Bf,shadowmask_pars_fragment:Gf,skinbase_vertex:Uf,skinning_pars_vertex:Ff,skinning_vertex:Nf,skinnormal_vertex:kf,specularmap_fragment:Of,specularmap_pars_fragment:zf,tonemapping_fragment:Vf,tonemapping_pars_fragment:Wf,transmission_fragment:Xf,transmission_pars_fragment:Yf,uv_pars_fragment:qf,uv_pars_vertex:Zf,uv_vertex:Jf,worldpos_vertex:Kf,background_vert:$f,background_frag:Qf,backgroundCube_vert:jf,backgroundCube_frag:ep,cube_vert:tp,cube_frag:np,depth_vert:ip,depth_frag:sp,distanceRGBA_vert:rp,distanceRGBA_frag:op,equirect_vert:ap,equirect_frag:lp,linedashed_vert:cp,linedashed_frag:hp,meshbasic_vert:up,meshbasic_frag:dp,meshlambert_vert:fp,meshlambert_frag:pp,meshmatcap_vert:mp,meshmatcap_frag:Ep,meshnormal_vert:gp,meshnormal_frag:Mp,meshphong_vert:yp,meshphong_frag:xp,meshphysical_vert:Tp,meshphysical_frag:wp,meshtoon_vert:_p,meshtoon_frag:vp,points_vert:Sp,points_frag:bp,shadow_vert:Rp,shadow_frag:Ap,sprite_vert:Cp,sprite_frag:Hp},ze={common:{diffuse:{value:new Ve(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ot},alphaMap:{value:null},alphaMapTransform:{value:new ot},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ot}},envmap:{envMap:{value:null},envMapRotation:{value:new ot},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ot}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ot}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ot},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ot},normalScale:{value:new Ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ot},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ot}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ot}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ot}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ve(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ve(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ot},alphaTest:{value:0},uvTransform:{value:new ot}},sprite:{diffuse:{value:new Ve(16777215)},opacity:{value:1},center:{value:new Ge(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ot},alphaMap:{value:null},alphaMapTransform:{value:new ot},alphaTest:{value:0}}},Dn={basic:{uniforms:$t([ze.common,ze.specularmap,ze.envmap,ze.aomap,ze.lightmap,ze.fog]),vertexShader:ct.meshbasic_vert,fragmentShader:ct.meshbasic_frag},lambert:{uniforms:$t([ze.common,ze.specularmap,ze.envmap,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.fog,ze.lights,{emissive:{value:new Ve(0)}}]),vertexShader:ct.meshlambert_vert,fragmentShader:ct.meshlambert_frag},phong:{uniforms:$t([ze.common,ze.specularmap,ze.envmap,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.fog,ze.lights,{emissive:{value:new Ve(0)},specular:{value:new Ve(1118481)},shininess:{value:30}}]),vertexShader:ct.meshphong_vert,fragmentShader:ct.meshphong_frag},standard:{uniforms:$t([ze.common,ze.envmap,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.roughnessmap,ze.metalnessmap,ze.fog,ze.lights,{emissive:{value:new Ve(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ct.meshphysical_vert,fragmentShader:ct.meshphysical_frag},toon:{uniforms:$t([ze.common,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.gradientmap,ze.fog,ze.lights,{emissive:{value:new Ve(0)}}]),vertexShader:ct.meshtoon_vert,fragmentShader:ct.meshtoon_frag},matcap:{uniforms:$t([ze.common,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.fog,{matcap:{value:null}}]),vertexShader:ct.meshmatcap_vert,fragmentShader:ct.meshmatcap_frag},points:{uniforms:$t([ze.points,ze.fog]),vertexShader:ct.points_vert,fragmentShader:ct.points_frag},dashed:{uniforms:$t([ze.common,ze.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ct.linedashed_vert,fragmentShader:ct.linedashed_frag},depth:{uniforms:$t([ze.common,ze.displacementmap]),vertexShader:ct.depth_vert,fragmentShader:ct.depth_frag},normal:{uniforms:$t([ze.common,ze.bumpmap,ze.normalmap,ze.displacementmap,{opacity:{value:1}}]),vertexShader:ct.meshnormal_vert,fragmentShader:ct.meshnormal_frag},sprite:{uniforms:$t([ze.sprite,ze.fog]),vertexShader:ct.sprite_vert,fragmentShader:ct.sprite_frag},background:{uniforms:{uvTransform:{value:new ot},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ct.background_vert,fragmentShader:ct.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ot}},vertexShader:ct.backgroundCube_vert,fragmentShader:ct.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ct.cube_vert,fragmentShader:ct.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ct.equirect_vert,fragmentShader:ct.equirect_frag},distanceRGBA:{uniforms:$t([ze.common,ze.displacementmap,{referencePosition:{value:new B},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ct.distanceRGBA_vert,fragmentShader:ct.distanceRGBA_frag},shadow:{uniforms:$t([ze.lights,ze.fog,{color:{value:new Ve(0)},opacity:{value:1}}]),vertexShader:ct.shadow_vert,fragmentShader:ct.shadow_frag}};Dn.physical={uniforms:$t([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ot},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ot},clearcoatNormalScale:{value:new Ge(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ot},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ot},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ot},sheen:{value:0},sheenColor:{value:new Ve(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ot},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ot},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ot},transmissionSamplerSize:{value:new Ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ot},attenuationDistance:{value:0},attenuationColor:{value:new Ve(0)},specularColor:{value:new Ve(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ot},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ot},anisotropyVector:{value:new Ge},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ot}}]),vertexShader:ct.meshphysical_vert,fragmentShader:ct.meshphysical_frag};var aa={r:0,b:0,g:0},Ui=new jt,Pp=new _t;function Ip(n,e,t,i,s,r,o){let a=new Ve(0),l=r===!0?0:1,c,h,u=null,E=0,m=null;function f(w){let y=w.isScene===!0?w.background:null;return y&&y.isTexture&&(y=(w.backgroundBlurriness>0?t:e).get(y)),y}function d(w){let y=!1,R=f(w);R===null?p(a,l):R&&R.isColor&&(p(R,1),y=!0);let S=n.xr.getEnvironmentBlendMode();S==="additive"?i.buffers.color.setClear(0,0,0,1,o):S==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||y)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function g(w,y){let R=f(y);R&&(R.isCubeTexture||R.mapping===er)?(h===void 0&&(h=new M(new Z(1,1,1),new Yt({name:"BackgroundCubeMaterial",uniforms:Gi(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:qt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(S,A,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Ui.copy(y.backgroundRotation),Ui.x*=-1,Ui.y*=-1,Ui.z*=-1,R.isCubeTexture&&R.isRenderTargetTexture===!1&&(Ui.y*=-1,Ui.z*=-1),h.material.uniforms.envMap.value=R,h.material.uniforms.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Pp.makeRotationFromEuler(Ui)),h.material.toneMapped=Mt.getTransfer(R.colorSpace)!==St,(u!==R||E!==R.version||m!==n.toneMapping)&&(h.material.needsUpdate=!0,u=R,E=R.version,m=n.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null)):R&&R.isTexture&&(c===void 0&&(c=new M(new ft(2,2),new Yt({name:"BackgroundMaterial",uniforms:Gi(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:zn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=R,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Mt.getTransfer(R.colorSpace)!==St,R.matrixAutoUpdate===!0&&R.updateMatrix(),c.material.uniforms.uvTransform.value.copy(R.matrix),(u!==R||E!==R.version||m!==n.toneMapping)&&(c.material.needsUpdate=!0,u=R,E=R.version,m=n.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null))}function p(w,y){w.getRGB(aa,xl(n)),i.buffers.color.setClear(aa.r,aa.g,aa.b,y,o)}function x(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(w,y=1){a.set(w),l=y,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,p(a,l)},render:d,addToRenderList:g,dispose:x}}function Dp(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=E(null),r=s,o=!1;function a(T,L,G,U,k){let X=!1,V=u(U,G,L);r!==V&&(r=V,c(r.object)),X=m(T,U,G,k),X&&f(T,U,G,k),k!==null&&e.update(k,n.ELEMENT_ARRAY_BUFFER),(X||o)&&(o=!1,y(T,L,G,U),k!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function l(){return n.createVertexArray()}function c(T){return n.bindVertexArray(T)}function h(T){return n.deleteVertexArray(T)}function u(T,L,G){let U=G.wireframe===!0,k=i[T.id];k===void 0&&(k={},i[T.id]=k);let X=k[L.id];X===void 0&&(X={},k[L.id]=X);let V=X[U];return V===void 0&&(V=E(l()),X[U]=V),V}function E(T){let L=[],G=[],U=[];for(let k=0;k<t;k++)L[k]=0,G[k]=0,U[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:G,attributeDivisors:U,object:T,attributes:{},index:null}}function m(T,L,G,U){let k=r.attributes,X=L.attributes,V=0,te=G.getAttributes();for(let F in te)if(te[F].location>=0){let J=k[F],xe=X[F];if(xe===void 0&&(F==="instanceMatrix"&&T.instanceMatrix&&(xe=T.instanceMatrix),F==="instanceColor"&&T.instanceColor&&(xe=T.instanceColor)),J===void 0||J.attribute!==xe||xe&&J.data!==xe.data)return!0;V++}return r.attributesNum!==V||r.index!==U}function f(T,L,G,U){let k={},X=L.attributes,V=0,te=G.getAttributes();for(let F in te)if(te[F].location>=0){let J=X[F];J===void 0&&(F==="instanceMatrix"&&T.instanceMatrix&&(J=T.instanceMatrix),F==="instanceColor"&&T.instanceColor&&(J=T.instanceColor));let xe={};xe.attribute=J,J&&J.data&&(xe.data=J.data),k[F]=xe,V++}r.attributes=k,r.attributesNum=V,r.index=U}function d(){let T=r.newAttributes;for(let L=0,G=T.length;L<G;L++)T[L]=0}function g(T){p(T,0)}function p(T,L){let G=r.newAttributes,U=r.enabledAttributes,k=r.attributeDivisors;G[T]=1,U[T]===0&&(n.enableVertexAttribArray(T),U[T]=1),k[T]!==L&&(n.vertexAttribDivisor(T,L),k[T]=L)}function x(){let T=r.newAttributes,L=r.enabledAttributes;for(let G=0,U=L.length;G<U;G++)L[G]!==T[G]&&(n.disableVertexAttribArray(G),L[G]=0)}function w(T,L,G,U,k,X,V){V===!0?n.vertexAttribIPointer(T,L,G,k,X):n.vertexAttribPointer(T,L,G,U,k,X)}function y(T,L,G,U){d();let k=U.attributes,X=G.getAttributes(),V=L.defaultAttributeValues;for(let te in X){let F=X[te];if(F.location>=0){let q=k[te];if(q===void 0&&(te==="instanceMatrix"&&T.instanceMatrix&&(q=T.instanceMatrix),te==="instanceColor"&&T.instanceColor&&(q=T.instanceColor)),q!==void 0){let J=q.normalized,xe=q.itemSize,Ie=e.get(q);if(Ie===void 0)continue;let Ue=Ie.buffer,K=Ie.type,pe=Ie.bytesPerElement,Q=K===n.INT||K===n.UNSIGNED_INT||q.gpuType===Ao;if(q.isInterleavedBufferAttribute){let re=q.data,ce=re.stride,ne=q.offset;if(re.isInstancedInterleavedBuffer){for(let $=0;$<F.locationSize;$++)p(F.location+$,re.meshPerAttribute);T.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let $=0;$<F.locationSize;$++)g(F.location+$);n.bindBuffer(n.ARRAY_BUFFER,Ue);for(let $=0;$<F.locationSize;$++)w(F.location+$,xe/F.locationSize,K,J,ce*pe,(ne+xe/F.locationSize*$)*pe,Q)}else{if(q.isInstancedBufferAttribute){for(let re=0;re<F.locationSize;re++)p(F.location+re,q.meshPerAttribute);T.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let re=0;re<F.locationSize;re++)g(F.location+re);n.bindBuffer(n.ARRAY_BUFFER,Ue);for(let re=0;re<F.locationSize;re++)w(F.location+re,xe/F.locationSize,K,J,xe*pe,xe/F.locationSize*re*pe,Q)}}else if(V!==void 0){let J=V[te];if(J!==void 0)switch(J.length){case 2:n.vertexAttrib2fv(F.location,J);break;case 3:n.vertexAttrib3fv(F.location,J);break;case 4:n.vertexAttrib4fv(F.location,J);break;default:n.vertexAttrib1fv(F.location,J)}}}}x()}function R(){C();for(let T in i){let L=i[T];for(let G in L){let U=L[G];for(let k in U)h(U[k].object),delete U[k];delete L[G]}delete i[T]}}function S(T){if(i[T.id]===void 0)return;let L=i[T.id];for(let G in L){let U=L[G];for(let k in U)h(U[k].object),delete U[k];delete L[G]}delete i[T.id]}function A(T){for(let L in i){let G=i[L];if(G[T.id]===void 0)continue;let U=G[T.id];for(let k in U)h(U[k].object),delete U[k];delete G[T.id]}}function C(){_(),o=!0,r!==s&&(r=s,c(r.object))}function _(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:C,resetDefaultState:_,dispose:R,releaseStatesOfGeometry:S,releaseStatesOfProgram:A,initAttributes:d,enableAttribute:g,disableUnusedAttributes:x}}function Lp(n,e,t){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function o(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),t.update(h,i,u))}function a(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let m=0;for(let f=0;f<u;f++)m+=h[f];t.update(m,i,1)}function l(c,h,u,E){if(u===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<c.length;f++)o(c[f],h[f],E[f]);else{m.multiDrawArraysInstancedWEBGL(i,c,0,h,0,E,0,u);let f=0;for(let d=0;d<u;d++)f+=h[d]*E[d];t.update(f,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Bp(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==rn&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let C=A===gi&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Pn&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==In&&!C)}function l(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,E=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),f=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),x=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),w=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),R=f>0,S=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:E,maxTextures:m,maxVertexTextures:f,maxTextureSize:d,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:x,maxVaryings:w,maxFragmentUniforms:y,vertexTextures:R,maxSamples:S}}function Gp(n){let e=this,t=null,i=0,s=!1,r=!1,o=new pn,a=new ot,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,E){let m=u.length!==0||E||i!==0||s;return s=E,i=u.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,E){t=h(u,E,0)},this.setState=function(u,E,m){let f=u.clippingPlanes,d=u.clipIntersection,g=u.clipShadows,p=n.get(u);if(!s||f===null||f.length===0||r&&!g)r?h(null):c();else{let x=r?0:i,w=x*4,y=p.clippingState||null;l.value=y,y=h(f,E,w,m);for(let R=0;R!==w;++R)y[R]=t[R];p.clippingState=y,this.numIntersection=d?this.numPlanes:0,this.numPlanes+=x}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(u,E,m,f){let d=u!==null?u.length:0,g=null;if(d!==0){if(g=l.value,f!==!0||g===null){let p=m+d*4,x=E.matrixWorldInverse;a.getNormalMatrix(x),(g===null||g.length<p)&&(g=new Float32Array(p));for(let w=0,y=m;w!==d;++w,y+=4)o.copy(u[w]).applyMatrix4(x,a),o.normal.toArray(g,y),g[y+3]=o.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=d,e.numIntersection=0,g}}function Up(n){let e=new WeakMap;function t(o,a){return a===So?o.mapping=Li:a===bo&&(o.mapping=Bi),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===So||a===bo)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new qr(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var gs=4,hh=[.125,.215,.35,.446,.526,.582],ki=20,Sl=new Di,uh=new Ve,bl=null,Rl=0,Al=0,Cl=!1,Ni=(1+Math.sqrt(5))/2,Es=1/Ni,dh=[new B(-Ni,Es,0),new B(Ni,Es,0),new B(-Es,0,Ni),new B(Es,0,Ni),new B(0,Ni,-Es),new B(0,Ni,Es),new B(-1,1,-1),new B(1,1,-1),new B(-1,1,1),new B(1,1,1)],Fp=new B,ha=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=Fp}=r;bl=this._renderer.getRenderTarget(),Rl=this._renderer.getActiveCubeFace(),Al=this._renderer.getActiveMipmapLevel(),Cl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=mh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ph(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(bl,Rl,Al),this._renderer.xr.enabled=Cl,e.scissorTest=!1,la(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Li||e.mapping===Bi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),bl=this._renderer.getRenderTarget(),Rl=this._renderer.getActiveCubeFace(),Al=this._renderer.getActiveMipmapLevel(),Cl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:wn,minFilter:wn,generateMipmaps:!1,type:gi,format:rn,colorSpace:Ri,depthBuffer:!1},s=fh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=fh(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Np(r)),this._blurMaterial=kp(r,e,t)}return s}_compileMaterial(e){let t=new M(this._lodPlanes[0],e);this._renderer.compile(t,Sl)}_sceneToCubeUV(e,t,i,s,r){let l=new Ft(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,E=u.autoClear,m=u.toneMapping;u.getClearColor(uh),u.toneMapping=Yn,u.autoClear=!1;let f=new Le({name:"PMREM.Background",side:qt,depthWrite:!1,depthTest:!1}),d=new M(new Z,f),g=!1,p=e.background;p?p.isColor&&(f.color.copy(p),e.background=null,g=!0):(f.color.copy(uh),g=!0);for(let x=0;x<6;x++){let w=x%3;w===0?(l.up.set(0,c[x],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[x],r.y,r.z)):w===1?(l.up.set(0,0,c[x]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[x],r.z)):(l.up.set(0,c[x],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[x]));let y=this._cubeSize;la(s,w*y,x>2?y:0,y,y),u.setRenderTarget(s),g&&u.render(d,l),u.render(e,l)}d.geometry.dispose(),d.material.dispose(),u.toneMapping=m,u.autoClear=E,e.background=p}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Li||e.mapping===Bi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=mh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ph());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new M(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;la(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Sl)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=dh[(s-r-1)%dh.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new M(this._lodPlanes[s],c),E=c.uniforms,m=this._sizeLods[i]-1,f=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*ki-1),d=r/f,g=isFinite(r)?1+Math.floor(h*d):ki;g>ki&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${ki}`);let p=[],x=0;for(let A=0;A<ki;++A){let C=A/d,_=Math.exp(-C*C/2);p.push(_),A===0?x+=_:A<g&&(x+=2*_)}for(let A=0;A<p.length;A++)p[A]=p[A]/x;E.envMap.value=e.texture,E.samples.value=g,E.weights.value=p,E.latitudinal.value=o==="latitudinal",a&&(E.poleAxis.value=a);let{_lodMax:w}=this;E.dTheta.value=f,E.mipInt.value=w-i;let y=this._sizeLods[s],R=3*y*(s>w-gs?s-w+gs:0),S=4*(this._cubeSize-y);la(t,R,S,3*y,2*y),l.setRenderTarget(t),l.render(u,Sl)}};function Np(n){let e=[],t=[],i=[],s=n,r=n-gs+1+hh.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>n-gs?l=hh[o-n+gs-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,u=1+c,E=[h,h,u,h,u,u,h,h,u,u,h,u],m=6,f=6,d=3,g=2,p=1,x=new Float32Array(d*f*m),w=new Float32Array(g*f*m),y=new Float32Array(p*f*m);for(let S=0;S<m;S++){let A=S%3*2/3-1,C=S>2?0:-1,_=[A,C,0,A+2/3,C,0,A+2/3,C+1,0,A,C,0,A+2/3,C+1,0,A,C+1,0];x.set(_,d*f*S),w.set(E,g*f*S);let T=[S,S,S,S,S,S];y.set(T,p*f*S)}let R=new It;R.setAttribute("position",new Xt(x,d)),R.setAttribute("uv",new Xt(w,g)),R.setAttribute("faceIndex",new Xt(y,p)),e.push(R),s>gs&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function fh(n,e,t){let i=new mn(n,e,t);return i.texture.mapping=er,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function la(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function kp(n,e,t){let i=new Float32Array(ki),s=new B(0,1,0);return new Yt({name:"SphericalGaussianBlur",defines:{n:ki,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function ph(){return new Yt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function mh(){return new Yt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function Nl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Op(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===So||l===bo,h=l===Li||l===Bi;if(c||h){let u=e.get(a),E=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==E)return t===null&&(t=new ha(n)),u=c?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let m=a.image;return c&&m&&m.height>0||h&&m&&s(m)?(t===null&&(t=new ha(n)),u=c?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function zp(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&lr("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function Vp(n,e,t,i){let s={},r=new WeakMap;function o(u){let E=u.target;E.index!==null&&e.remove(E.index);for(let f in E.attributes)e.remove(E.attributes[f]);E.removeEventListener("dispose",o),delete s[E.id];let m=r.get(E);m&&(e.remove(m),r.delete(E)),i.releaseStatesOfGeometry(E),E.isInstancedBufferGeometry===!0&&delete E._maxInstanceCount,t.memory.geometries--}function a(u,E){return s[E.id]===!0||(E.addEventListener("dispose",o),s[E.id]=!0,t.memory.geometries++),E}function l(u){let E=u.attributes;for(let m in E)e.update(E[m],n.ARRAY_BUFFER)}function c(u){let E=[],m=u.index,f=u.attributes.position,d=0;if(m!==null){let x=m.array;d=m.version;for(let w=0,y=x.length;w<y;w+=3){let R=x[w+0],S=x[w+1],A=x[w+2];E.push(R,S,S,A,A,R)}}else if(f!==void 0){let x=f.array;d=f.version;for(let w=0,y=x.length/3-1;w<y;w+=3){let R=w+0,S=w+1,A=w+2;E.push(R,S,S,A,A,R)}}else return;let g=new(yl(E)?Us:Gs)(E,1);g.version=d;let p=r.get(u);p&&e.remove(p),r.set(u,g)}function h(u){let E=r.get(u);if(E){let m=u.index;m!==null&&E.version<m.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function Wp(n,e,t){let i;function s(E){i=E}let r,o;function a(E){r=E.type,o=E.bytesPerElement}function l(E,m){n.drawElements(i,m,r,E*o),t.update(m,i,1)}function c(E,m,f){f!==0&&(n.drawElementsInstanced(i,m,r,E*o,f),t.update(m,i,f))}function h(E,m,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,m,0,r,E,0,f);let g=0;for(let p=0;p<f;p++)g+=m[p];t.update(g,i,1)}function u(E,m,f,d){if(f===0)return;let g=e.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<E.length;p++)c(E[p]/o,m[p],d[p]);else{g.multiDrawElementsInstancedWEBGL(i,m,0,r,E,0,d,0,f);let p=0;for(let x=0;x<f;x++)p+=m[x]*d[x];t.update(p,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Xp(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Yp(n,e,t){let i=new WeakMap,s=new xt;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,E=i.get(a);if(E===void 0||E.count!==u){let _=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",_)};E!==void 0&&E.texture.dispose();let m=a.morphAttributes.position!==void 0,f=a.morphAttributes.normal!==void 0,d=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],x=a.morphAttributes.color||[],w=0;m===!0&&(w=1),f===!0&&(w=2),d===!0&&(w=3);let y=a.attributes.position.count*w,R=1;y>e.maxTextureSize&&(R=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let S=new Float32Array(y*R*4*u),A=new Ls(S,y,R,u);A.type=In,A.needsUpdate=!0;let C=w*4;for(let T=0;T<u;T++){let L=g[T],G=p[T],U=x[T],k=y*R*4*T;for(let X=0;X<L.count;X++){let V=X*C;m===!0&&(s.fromBufferAttribute(L,X),S[k+V+0]=s.x,S[k+V+1]=s.y,S[k+V+2]=s.z,S[k+V+3]=0),f===!0&&(s.fromBufferAttribute(G,X),S[k+V+4]=s.x,S[k+V+5]=s.y,S[k+V+6]=s.z,S[k+V+7]=0),d===!0&&(s.fromBufferAttribute(U,X),S[k+V+8]=s.x,S[k+V+9]=s.y,S[k+V+10]=s.z,S[k+V+11]=U.itemSize===4?s.w:1)}}E={count:u,texture:A,size:new Ge(y,R)},i.set(a,E),a.addEventListener("dispose",_)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let m=0;for(let d=0;d<c.length;d++)m+=c[d];let f=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(n,"morphTargetBaseInfluence",f),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",E.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",E.size)}return{update:r}}function qp(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let E=l.skeleton;s.get(E)!==c&&(E.update(),s.set(E,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var Lh=new Qt,Eh=new Vs(1,1),Bh=new Ls,Gh=new Xr,Uh=new Ns,gh=[],Mh=[],yh=new Float32Array(16),xh=new Float32Array(9),Th=new Float32Array(4);function ys(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=gh[s];if(r===void 0&&(r=new Float32Array(s),gh[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Ot(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function zt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function da(n,e){let t=Mh[e];t===void 0&&(t=new Int32Array(e),Mh[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Zp(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Jp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ot(t,e))return;n.uniform2fv(this.addr,e),zt(t,e)}}function Kp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ot(t,e))return;n.uniform3fv(this.addr,e),zt(t,e)}}function $p(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ot(t,e))return;n.uniform4fv(this.addr,e),zt(t,e)}}function Qp(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ot(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),zt(t,e)}else{if(Ot(t,i))return;Th.set(i),n.uniformMatrix2fv(this.addr,!1,Th),zt(t,i)}}function jp(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ot(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),zt(t,e)}else{if(Ot(t,i))return;xh.set(i),n.uniformMatrix3fv(this.addr,!1,xh),zt(t,i)}}function e0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ot(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),zt(t,e)}else{if(Ot(t,i))return;yh.set(i),n.uniformMatrix4fv(this.addr,!1,yh),zt(t,i)}}function t0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function n0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ot(t,e))return;n.uniform2iv(this.addr,e),zt(t,e)}}function i0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ot(t,e))return;n.uniform3iv(this.addr,e),zt(t,e)}}function s0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ot(t,e))return;n.uniform4iv(this.addr,e),zt(t,e)}}function r0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function o0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ot(t,e))return;n.uniform2uiv(this.addr,e),zt(t,e)}}function a0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ot(t,e))return;n.uniform3uiv(this.addr,e),zt(t,e)}}function l0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ot(t,e))return;n.uniform4uiv(this.addr,e),zt(t,e)}}function c0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Eh.compareFunction=gl,r=Eh):r=Lh,t.setTexture2D(e||r,s)}function h0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||Gh,s)}function u0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Uh,s)}function d0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Bh,s)}function f0(n){switch(n){case 5126:return Zp;case 35664:return Jp;case 35665:return Kp;case 35666:return $p;case 35674:return Qp;case 35675:return jp;case 35676:return e0;case 5124:case 35670:return t0;case 35667:case 35671:return n0;case 35668:case 35672:return i0;case 35669:case 35673:return s0;case 5125:return r0;case 36294:return o0;case 36295:return a0;case 36296:return l0;case 35678:case 36198:case 36298:case 36306:case 35682:return c0;case 35679:case 36299:case 36307:return h0;case 35680:case 36300:case 36308:case 36293:return u0;case 36289:case 36303:case 36311:case 36292:return d0}}function p0(n,e){n.uniform1fv(this.addr,e)}function m0(n,e){let t=ys(e,this.size,2);n.uniform2fv(this.addr,t)}function E0(n,e){let t=ys(e,this.size,3);n.uniform3fv(this.addr,t)}function g0(n,e){let t=ys(e,this.size,4);n.uniform4fv(this.addr,t)}function M0(n,e){let t=ys(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function y0(n,e){let t=ys(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function x0(n,e){let t=ys(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function T0(n,e){n.uniform1iv(this.addr,e)}function w0(n,e){n.uniform2iv(this.addr,e)}function _0(n,e){n.uniform3iv(this.addr,e)}function v0(n,e){n.uniform4iv(this.addr,e)}function S0(n,e){n.uniform1uiv(this.addr,e)}function b0(n,e){n.uniform2uiv(this.addr,e)}function R0(n,e){n.uniform3uiv(this.addr,e)}function A0(n,e){n.uniform4uiv(this.addr,e)}function C0(n,e,t){let i=this.cache,s=e.length,r=da(t,s);Ot(i,r)||(n.uniform1iv(this.addr,r),zt(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||Lh,r[o])}function H0(n,e,t){let i=this.cache,s=e.length,r=da(t,s);Ot(i,r)||(n.uniform1iv(this.addr,r),zt(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Gh,r[o])}function P0(n,e,t){let i=this.cache,s=e.length,r=da(t,s);Ot(i,r)||(n.uniform1iv(this.addr,r),zt(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Uh,r[o])}function I0(n,e,t){let i=this.cache,s=e.length,r=da(t,s);Ot(i,r)||(n.uniform1iv(this.addr,r),zt(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Bh,r[o])}function D0(n){switch(n){case 5126:return p0;case 35664:return m0;case 35665:return E0;case 35666:return g0;case 35674:return M0;case 35675:return y0;case 35676:return x0;case 5124:case 35670:return T0;case 35667:case 35671:return w0;case 35668:case 35672:return _0;case 35669:case 35673:return v0;case 5125:return S0;case 36294:return b0;case 36295:return R0;case 36296:return A0;case 35678:case 36198:case 36298:case 36306:case 35682:return C0;case 35679:case 36299:case 36307:return H0;case 35680:case 36300:case 36308:case 36293:return P0;case 36289:case 36303:case 36311:case 36292:return I0}}var Pl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=f0(t.type)}},Il=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=D0(t.type)}},Dl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Hl=/(\w+)(\])?(\[|\.)?/g;function wh(n,e){n.seq.push(e),n.map[e.id]=e}function L0(n,e,t){let i=n.name,s=i.length;for(Hl.lastIndex=0;;){let r=Hl.exec(i),o=Hl.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){wh(t,c===void 0?new Pl(a,n,e):new Il(a,n,e));break}else{let u=t.map[a];u===void 0&&(u=new Dl(a),wh(t,u)),t=u}}}var Ms=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);L0(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function _h(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var B0=37297,G0=0;function U0(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var vh=new ot;function F0(n){Mt._getMatrix(vh,Mt.workingColorSpace,n);let e=`mat3( ${vh.elements.map(t=>t.toFixed(4))} )`;switch(Mt.getTransfer(n)){case Hs:return[e,"LinearTransferOETF"];case St:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Sh(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+U0(n.getShaderSource(e),o)}else return s}function N0(n,e){let t=F0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function k0(n,e){let t;switch(e){case Oc:t="Linear";break;case zc:t="Reinhard";break;case Vc:t="Cineon";break;case vo:t="ACESFilmic";break;case Xc:t="AgX";break;case Yc:t="Neutral";break;case Wc:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var ca=new B;function O0(){Mt.getLuminanceCoefficients(ca);let n=ca.x.toFixed(4),e=ca.y.toFixed(4),t=ca.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function z0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(cr).join(`
`)}function V0(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function W0(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function cr(n){return n!==""}function bh(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Rh(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var X0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ll(n){return n.replace(X0,q0)}var Y0=new Map;function q0(n,e){let t=ct[e];if(t===void 0){let i=Y0.get(e);if(i!==void 0)t=ct[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Ll(t)}var Z0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ah(n){return n.replace(Z0,J0)}function J0(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Ch(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function K0(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===tl?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Eo?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Cn&&(e="SHADOWMAP_TYPE_VSM"),e}function $0(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Li:case Bi:e="ENVMAP_TYPE_CUBE";break;case er:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Q0(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Bi:e="ENVMAP_MODE_REFRACTION";break}return e}function j0(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case sl:e="ENVMAP_BLENDING_MULTIPLY";break;case Nc:e="ENVMAP_BLENDING_MIX";break;case kc:e="ENVMAP_BLENDING_ADD";break}return e}function em(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function tm(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=K0(t),c=$0(t),h=Q0(t),u=j0(t),E=em(t),m=z0(t),f=V0(r),d=s.createProgram(),g,p,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(cr).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(cr).join(`
`),p.length>0&&(p+=`
`)):(g=[Ch(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(cr).join(`
`),p=[Ch(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",E?"#define CUBEUV_TEXEL_WIDTH "+E.texelWidth:"",E?"#define CUBEUV_TEXEL_HEIGHT "+E.texelHeight:"",E?"#define CUBEUV_MAX_MIP "+E.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Yn?"#define TONE_MAPPING":"",t.toneMapping!==Yn?ct.tonemapping_pars_fragment:"",t.toneMapping!==Yn?k0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ct.colorspace_pars_fragment,N0("linearToOutputTexel",t.outputColorSpace),O0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(cr).join(`
`)),o=Ll(o),o=bh(o,t),o=Rh(o,t),a=Ll(a),a=bh(a,t),a=Rh(a,t),o=Ah(o),a=Ah(a),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,g=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",t.glslVersion===Ml?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ml?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let w=x+g+o,y=x+p+a,R=_h(s,s.VERTEX_SHADER,w),S=_h(s,s.FRAGMENT_SHADER,y);s.attachShader(d,R),s.attachShader(d,S),t.index0AttributeName!==void 0?s.bindAttribLocation(d,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(d,0,"position"),s.linkProgram(d);function A(L){if(n.debug.checkShaderErrors){let G=s.getProgramInfoLog(d).trim(),U=s.getShaderInfoLog(R).trim(),k=s.getShaderInfoLog(S).trim(),X=!0,V=!0;if(s.getProgramParameter(d,s.LINK_STATUS)===!1)if(X=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,d,R,S);else{let te=Sh(s,R,"vertex"),F=Sh(s,S,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(d,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+G+`
`+te+`
`+F)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(U===""||k==="")&&(V=!1);V&&(L.diagnostics={runnable:X,programLog:G,vertexShader:{log:U,prefix:g},fragmentShader:{log:k,prefix:p}})}s.deleteShader(R),s.deleteShader(S),C=new Ms(s,d),_=W0(s,d)}let C;this.getUniforms=function(){return C===void 0&&A(this),C};let _;this.getAttributes=function(){return _===void 0&&A(this),_};let T=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=s.getProgramParameter(d,B0)),T},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(d),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=G0++,this.cacheKey=e,this.usedTimes=1,this.program=d,this.vertexShader=R,this.fragmentShader=S,this}var nm=0,Bl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Gl(e),t.set(e,i)),i}},Gl=class{constructor(e){this.id=nm++,this.code=e,this.usedTimes=0}};function im(n,e,t,i,s,r,o){let a=new Bs,l=new Bl,c=new Set,h=[],u=s.logarithmicDepthBuffer,E=s.vertexTextures,m=s.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(_){return c.add(_),_===0?"uv":`uv${_}`}function g(_,T,L,G,U){let k=G.fog,X=U.geometry,V=_.isMeshStandardMaterial?G.environment:null,te=(_.isMeshStandardMaterial?t:e).get(_.envMap||V),F=te&&te.mapping===er?te.image.height:null,q=f[_.type];_.precision!==null&&(m=s.getMaxPrecision(_.precision),m!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",m,"instead."));let J=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,xe=J!==void 0?J.length:0,Ie=0;X.morphAttributes.position!==void 0&&(Ie=1),X.morphAttributes.normal!==void 0&&(Ie=2),X.morphAttributes.color!==void 0&&(Ie=3);let Ue,K,pe,Q;if(q){let at=Dn[q];Ue=at.vertexShader,K=at.fragmentShader}else Ue=_.vertexShader,K=_.fragmentShader,l.update(_),pe=l.getVertexShaderID(_),Q=l.getFragmentShaderID(_);let re=n.getRenderTarget(),ce=n.state.buffers.depth.getReversed(),ne=U.isInstancedMesh===!0,$=U.isBatchedMesh===!0,Me=!!_.map,ye=!!_.matcap,ve=!!te,b=!!_.aoMap,me=!!_.lightMap,oe=!!_.bumpMap,Ae=!!_.normalMap,P=!!_.displacementMap,se=!!_.emissiveMap,be=!!_.metalnessMap,I=!!_.roughnessMap,v=_.anisotropy>0,O=_.clearcoat>0,j=_.dispersion>0,Ee=_.iridescence>0,ae=_.sheen>0,He=_.transmission>0,Re=v&&!!_.anisotropyMap,Be=O&&!!_.clearcoatMap,rt=O&&!!_.clearcoatNormalMap,Se=O&&!!_.clearcoatRoughnessMap,De=Ee&&!!_.iridescenceMap,ke=Ee&&!!_.iridescenceThicknessMap,ge=ae&&!!_.sheenColorMap,de=ae&&!!_.sheenRoughnessMap,Ke=!!_.specularMap,Fe=!!_.specularColorMap,$e=!!_.specularIntensityMap,N=He&&!!_.transmissionMap,Te=He&&!!_.thicknessMap,ee=!!_.gradientMap,le=!!_.alphaMap,Pe=_.alphaTest>0,Ce=!!_.alphaHash,Ze=!!_.extensions,ht=Yn;_.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(ht=n.toneMapping);let Rt={shaderID:q,shaderType:_.type,shaderName:_.name,vertexShader:Ue,fragmentShader:K,defines:_.defines,customVertexShaderID:pe,customFragmentShaderID:Q,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:m,batching:$,batchingColor:$&&U._colorsTexture!==null,instancing:ne,instancingColor:ne&&U.instanceColor!==null,instancingMorph:ne&&U.morphTexture!==null,supportsVertexTextures:E,outputColorSpace:re===null?n.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:Ri,alphaToCoverage:!!_.alphaToCoverage,map:Me,matcap:ye,envMap:ve,envMapMode:ve&&te.mapping,envMapCubeUVHeight:F,aoMap:b,lightMap:me,bumpMap:oe,normalMap:Ae,displacementMap:E&&P,emissiveMap:se,normalMapObjectSpace:Ae&&_.normalMapType===Kc,normalMapTangentSpace:Ae&&_.normalMapType===El,metalnessMap:be,roughnessMap:I,anisotropy:v,anisotropyMap:Re,clearcoat:O,clearcoatMap:Be,clearcoatNormalMap:rt,clearcoatRoughnessMap:Se,dispersion:j,iridescence:Ee,iridescenceMap:De,iridescenceThicknessMap:ke,sheen:ae,sheenColorMap:ge,sheenRoughnessMap:de,specularMap:Ke,specularColorMap:Fe,specularIntensityMap:$e,transmission:He,transmissionMap:N,thicknessMap:Te,gradientMap:ee,opaque:_.transparent===!1&&_.blending===Si&&_.alphaToCoverage===!1,alphaMap:le,alphaTest:Pe,alphaHash:Ce,combine:_.combine,mapUv:Me&&d(_.map.channel),aoMapUv:b&&d(_.aoMap.channel),lightMapUv:me&&d(_.lightMap.channel),bumpMapUv:oe&&d(_.bumpMap.channel),normalMapUv:Ae&&d(_.normalMap.channel),displacementMapUv:P&&d(_.displacementMap.channel),emissiveMapUv:se&&d(_.emissiveMap.channel),metalnessMapUv:be&&d(_.metalnessMap.channel),roughnessMapUv:I&&d(_.roughnessMap.channel),anisotropyMapUv:Re&&d(_.anisotropyMap.channel),clearcoatMapUv:Be&&d(_.clearcoatMap.channel),clearcoatNormalMapUv:rt&&d(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Se&&d(_.clearcoatRoughnessMap.channel),iridescenceMapUv:De&&d(_.iridescenceMap.channel),iridescenceThicknessMapUv:ke&&d(_.iridescenceThicknessMap.channel),sheenColorMapUv:ge&&d(_.sheenColorMap.channel),sheenRoughnessMapUv:de&&d(_.sheenRoughnessMap.channel),specularMapUv:Ke&&d(_.specularMap.channel),specularColorMapUv:Fe&&d(_.specularColorMap.channel),specularIntensityMapUv:$e&&d(_.specularIntensityMap.channel),transmissionMapUv:N&&d(_.transmissionMap.channel),thicknessMapUv:Te&&d(_.thicknessMap.channel),alphaMapUv:le&&d(_.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(Ae||v),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!X.attributes.uv&&(Me||le),fog:!!k,useFog:_.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:ce,skinning:U.isSkinnedMesh===!0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:Ie,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:ht,decodeVideoTexture:Me&&_.map.isVideoTexture===!0&&Mt.getTransfer(_.map.colorSpace)===St,decodeVideoTextureEmissive:se&&_.emissiveMap.isVideoTexture===!0&&Mt.getTransfer(_.emissiveMap.colorSpace)===St,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===gt,flipSided:_.side===qt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:Ze&&_.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ze&&_.extensions.multiDraw===!0||$)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Rt.vertexUv1s=c.has(1),Rt.vertexUv2s=c.has(2),Rt.vertexUv3s=c.has(3),c.clear(),Rt}function p(_){let T=[];if(_.shaderID?T.push(_.shaderID):(T.push(_.customVertexShaderID),T.push(_.customFragmentShaderID)),_.defines!==void 0)for(let L in _.defines)T.push(L),T.push(_.defines[L]);return _.isRawShaderMaterial===!1&&(x(T,_),w(T,_),T.push(n.outputColorSpace)),T.push(_.customProgramCacheKey),T.join()}function x(_,T){_.push(T.precision),_.push(T.outputColorSpace),_.push(T.envMapMode),_.push(T.envMapCubeUVHeight),_.push(T.mapUv),_.push(T.alphaMapUv),_.push(T.lightMapUv),_.push(T.aoMapUv),_.push(T.bumpMapUv),_.push(T.normalMapUv),_.push(T.displacementMapUv),_.push(T.emissiveMapUv),_.push(T.metalnessMapUv),_.push(T.roughnessMapUv),_.push(T.anisotropyMapUv),_.push(T.clearcoatMapUv),_.push(T.clearcoatNormalMapUv),_.push(T.clearcoatRoughnessMapUv),_.push(T.iridescenceMapUv),_.push(T.iridescenceThicknessMapUv),_.push(T.sheenColorMapUv),_.push(T.sheenRoughnessMapUv),_.push(T.specularMapUv),_.push(T.specularColorMapUv),_.push(T.specularIntensityMapUv),_.push(T.transmissionMapUv),_.push(T.thicknessMapUv),_.push(T.combine),_.push(T.fogExp2),_.push(T.sizeAttenuation),_.push(T.morphTargetsCount),_.push(T.morphAttributeCount),_.push(T.numDirLights),_.push(T.numPointLights),_.push(T.numSpotLights),_.push(T.numSpotLightMaps),_.push(T.numHemiLights),_.push(T.numRectAreaLights),_.push(T.numDirLightShadows),_.push(T.numPointLightShadows),_.push(T.numSpotLightShadows),_.push(T.numSpotLightShadowsWithMaps),_.push(T.numLightProbes),_.push(T.shadowMapType),_.push(T.toneMapping),_.push(T.numClippingPlanes),_.push(T.numClipIntersection),_.push(T.depthPacking)}function w(_,T){a.disableAll(),T.supportsVertexTextures&&a.enable(0),T.instancing&&a.enable(1),T.instancingColor&&a.enable(2),T.instancingMorph&&a.enable(3),T.matcap&&a.enable(4),T.envMap&&a.enable(5),T.normalMapObjectSpace&&a.enable(6),T.normalMapTangentSpace&&a.enable(7),T.clearcoat&&a.enable(8),T.iridescence&&a.enable(9),T.alphaTest&&a.enable(10),T.vertexColors&&a.enable(11),T.vertexAlphas&&a.enable(12),T.vertexUv1s&&a.enable(13),T.vertexUv2s&&a.enable(14),T.vertexUv3s&&a.enable(15),T.vertexTangents&&a.enable(16),T.anisotropy&&a.enable(17),T.alphaHash&&a.enable(18),T.batching&&a.enable(19),T.dispersion&&a.enable(20),T.batchingColor&&a.enable(21),_.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reverseDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),_.push(a.mask)}function y(_){let T=f[_.type],L;if(T){let G=Dn[T];L=oa.clone(G.uniforms)}else L=_.uniforms;return L}function R(_,T){let L;for(let G=0,U=h.length;G<U;G++){let k=h[G];if(k.cacheKey===T){L=k,++L.usedTimes;break}}return L===void 0&&(L=new tm(n,T,_,r),h.push(L)),L}function S(_){if(--_.usedTimes===0){let T=h.indexOf(_);h[T]=h[h.length-1],h.pop(),_.destroy()}}function A(_){l.remove(_)}function C(){l.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:y,acquireProgram:R,releaseProgram:S,releaseShaderCache:A,programs:h,dispose:C}}function sm(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function rm(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Hh(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ph(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(u,E,m,f,d,g){let p=n[e];return p===void 0?(p={id:u.id,object:u,geometry:E,material:m,groupOrder:f,renderOrder:u.renderOrder,z:d,group:g},n[e]=p):(p.id=u.id,p.object=u,p.geometry=E,p.material=m,p.groupOrder=f,p.renderOrder=u.renderOrder,p.z=d,p.group=g),e++,p}function a(u,E,m,f,d,g){let p=o(u,E,m,f,d,g);m.transmission>0?i.push(p):m.transparent===!0?s.push(p):t.push(p)}function l(u,E,m,f,d,g){let p=o(u,E,m,f,d,g);m.transmission>0?i.unshift(p):m.transparent===!0?s.unshift(p):t.unshift(p)}function c(u,E){t.length>1&&t.sort(u||rm),i.length>1&&i.sort(E||Hh),s.length>1&&s.sort(E||Hh)}function h(){for(let u=e,E=n.length;u<E;u++){let m=n[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function om(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new Ph,n.set(i,[o])):s>=r.length?(o=new Ph,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function am(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new B,color:new Ve};break;case"SpotLight":t={position:new B,direction:new B,color:new Ve,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new B,color:new Ve,distance:0,decay:0};break;case"HemisphereLight":t={direction:new B,skyColor:new Ve,groundColor:new Ve};break;case"RectAreaLight":t={color:new Ve,position:new B,halfWidth:new B,halfHeight:new B};break}return n[e.id]=t,t}}}function lm(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var cm=0;function hm(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function um(n){let e=new am,t=lm(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new B);let s=new B,r=new _t,o=new _t;function a(c){let h=0,u=0,E=0;for(let _=0;_<9;_++)i.probe[_].set(0,0,0);let m=0,f=0,d=0,g=0,p=0,x=0,w=0,y=0,R=0,S=0,A=0;c.sort(hm);for(let _=0,T=c.length;_<T;_++){let L=c[_],G=L.color,U=L.intensity,k=L.distance,X=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)h+=G.r*U,u+=G.g*U,E+=G.b*U;else if(L.isLightProbe){for(let V=0;V<9;V++)i.probe[V].addScaledVector(L.sh.coefficients[V],U);A++}else if(L.isDirectionalLight){let V=e.get(L);if(V.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let te=L.shadow,F=t.get(L);F.shadowIntensity=te.intensity,F.shadowBias=te.bias,F.shadowNormalBias=te.normalBias,F.shadowRadius=te.radius,F.shadowMapSize=te.mapSize,i.directionalShadow[m]=F,i.directionalShadowMap[m]=X,i.directionalShadowMatrix[m]=L.shadow.matrix,x++}i.directional[m]=V,m++}else if(L.isSpotLight){let V=e.get(L);V.position.setFromMatrixPosition(L.matrixWorld),V.color.copy(G).multiplyScalar(U),V.distance=k,V.coneCos=Math.cos(L.angle),V.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),V.decay=L.decay,i.spot[d]=V;let te=L.shadow;if(L.map&&(i.spotLightMap[R]=L.map,R++,te.updateMatrices(L),L.castShadow&&S++),i.spotLightMatrix[d]=te.matrix,L.castShadow){let F=t.get(L);F.shadowIntensity=te.intensity,F.shadowBias=te.bias,F.shadowNormalBias=te.normalBias,F.shadowRadius=te.radius,F.shadowMapSize=te.mapSize,i.spotShadow[d]=F,i.spotShadowMap[d]=X,y++}d++}else if(L.isRectAreaLight){let V=e.get(L);V.color.copy(G).multiplyScalar(U),V.halfWidth.set(L.width*.5,0,0),V.halfHeight.set(0,L.height*.5,0),i.rectArea[g]=V,g++}else if(L.isPointLight){let V=e.get(L);if(V.color.copy(L.color).multiplyScalar(L.intensity),V.distance=L.distance,V.decay=L.decay,L.castShadow){let te=L.shadow,F=t.get(L);F.shadowIntensity=te.intensity,F.shadowBias=te.bias,F.shadowNormalBias=te.normalBias,F.shadowRadius=te.radius,F.shadowMapSize=te.mapSize,F.shadowCameraNear=te.camera.near,F.shadowCameraFar=te.camera.far,i.pointShadow[f]=F,i.pointShadowMap[f]=X,i.pointShadowMatrix[f]=L.shadow.matrix,w++}i.point[f]=V,f++}else if(L.isHemisphereLight){let V=e.get(L);V.skyColor.copy(L.color).multiplyScalar(U),V.groundColor.copy(L.groundColor).multiplyScalar(U),i.hemi[p]=V,p++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ze.LTC_FLOAT_1,i.rectAreaLTC2=ze.LTC_FLOAT_2):(i.rectAreaLTC1=ze.LTC_HALF_1,i.rectAreaLTC2=ze.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=E;let C=i.hash;(C.directionalLength!==m||C.pointLength!==f||C.spotLength!==d||C.rectAreaLength!==g||C.hemiLength!==p||C.numDirectionalShadows!==x||C.numPointShadows!==w||C.numSpotShadows!==y||C.numSpotMaps!==R||C.numLightProbes!==A)&&(i.directional.length=m,i.spot.length=d,i.rectArea.length=g,i.point.length=f,i.hemi.length=p,i.directionalShadow.length=x,i.directionalShadowMap.length=x,i.pointShadow.length=w,i.pointShadowMap.length=w,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=x,i.pointShadowMatrix.length=w,i.spotLightMatrix.length=y+R-S,i.spotLightMap.length=R,i.numSpotLightShadowsWithMaps=S,i.numLightProbes=A,C.directionalLength=m,C.pointLength=f,C.spotLength=d,C.rectAreaLength=g,C.hemiLength=p,C.numDirectionalShadows=x,C.numPointShadows=w,C.numSpotShadows=y,C.numSpotMaps=R,C.numLightProbes=A,i.version=cm++)}function l(c,h){let u=0,E=0,m=0,f=0,d=0,g=h.matrixWorldInverse;for(let p=0,x=c.length;p<x;p++){let w=c[p];if(w.isDirectionalLight){let y=i.directional[u];y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(g),u++}else if(w.isSpotLight){let y=i.spot[m];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(g),y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(g),m++}else if(w.isRectAreaLight){let y=i.rectArea[f];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(g),o.identity(),r.copy(w.matrixWorld),r.premultiply(g),o.extractRotation(r),y.halfWidth.set(w.width*.5,0,0),y.halfHeight.set(0,w.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),f++}else if(w.isPointLight){let y=i.point[E];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(g),E++}else if(w.isHemisphereLight){let y=i.hemi[d];y.direction.setFromMatrixPosition(w.matrixWorld),y.direction.transformDirection(g),d++}}}return{setup:a,setupView:l,state:i}}function Ih(n){let e=new um(n),t=[],i=[];function s(h){c.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function o(h){i.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function dm(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Ih(n),e.set(s,[a])):r>=o.length?(a=new Ih(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var fm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,pm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function mm(n,e,t){let i=new as,s=new Ge,r=new Ge,o=new xt,a=new io({depthPacking:Jc}),l=new so,c={},h=t.maxTextureSize,u={[zn]:qt,[qt]:zn,[gt]:gt},E=new Yt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ge},radius:{value:4}},vertexShader:fm,fragmentShader:pm}),m=E.clone();m.defines.HORIZONTAL_PASS=1;let f=new It;f.setAttribute("position",new Xt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let d=new M(f,E),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=tl;let p=this.type;this.render=function(S,A,C){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||S.length===0)return;let _=n.getRenderTarget(),T=n.getActiveCubeFace(),L=n.getActiveMipmapLevel(),G=n.state;G.setBlending(Xn),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);let U=p!==Cn&&this.type===Cn,k=p===Cn&&this.type!==Cn;for(let X=0,V=S.length;X<V;X++){let te=S[X],F=te.shadow;if(F===void 0){console.warn("THREE.WebGLShadowMap:",te,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;s.copy(F.mapSize);let q=F.getFrameExtents();if(s.multiply(q),r.copy(F.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/q.x),s.x=r.x*q.x,F.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/q.y),s.y=r.y*q.y,F.mapSize.y=r.y)),F.map===null||U===!0||k===!0){let xe=this.type!==Cn?{minFilter:nn,magFilter:nn}:{};F.map!==null&&F.map.dispose(),F.map=new mn(s.x,s.y,xe),F.map.texture.name=te.name+".shadowMap",F.camera.updateProjectionMatrix()}n.setRenderTarget(F.map),n.clear();let J=F.getViewportCount();for(let xe=0;xe<J;xe++){let Ie=F.getViewport(xe);o.set(r.x*Ie.x,r.y*Ie.y,r.x*Ie.z,r.y*Ie.w),G.viewport(o),F.updateMatrices(te,xe),i=F.getFrustum(),y(A,C,F.camera,te,this.type)}F.isPointLightShadow!==!0&&this.type===Cn&&x(F,C),F.needsUpdate=!1}p=this.type,g.needsUpdate=!1,n.setRenderTarget(_,T,L)};function x(S,A){let C=e.update(d);E.defines.VSM_SAMPLES!==S.blurSamples&&(E.defines.VSM_SAMPLES=S.blurSamples,m.defines.VSM_SAMPLES=S.blurSamples,E.needsUpdate=!0,m.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new mn(s.x,s.y)),E.uniforms.shadow_pass.value=S.map.texture,E.uniforms.resolution.value=S.mapSize,E.uniforms.radius.value=S.radius,n.setRenderTarget(S.mapPass),n.clear(),n.renderBufferDirect(A,null,C,E,d,null),m.uniforms.shadow_pass.value=S.mapPass.texture,m.uniforms.resolution.value=S.mapSize,m.uniforms.radius.value=S.radius,n.setRenderTarget(S.map),n.clear(),n.renderBufferDirect(A,null,C,m,d,null)}function w(S,A,C,_){let T=null,L=C.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(L!==void 0)T=L;else if(T=C.isPointLight===!0?l:a,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let G=T.uuid,U=A.uuid,k=c[G];k===void 0&&(k={},c[G]=k);let X=k[U];X===void 0&&(X=T.clone(),k[U]=X,A.addEventListener("dispose",R)),T=X}if(T.visible=A.visible,T.wireframe=A.wireframe,_===Cn?T.side=A.shadowSide!==null?A.shadowSide:A.side:T.side=A.shadowSide!==null?A.shadowSide:u[A.side],T.alphaMap=A.alphaMap,T.alphaTest=A.alphaTest,T.map=A.map,T.clipShadows=A.clipShadows,T.clippingPlanes=A.clippingPlanes,T.clipIntersection=A.clipIntersection,T.displacementMap=A.displacementMap,T.displacementScale=A.displacementScale,T.displacementBias=A.displacementBias,T.wireframeLinewidth=A.wireframeLinewidth,T.linewidth=A.linewidth,C.isPointLight===!0&&T.isMeshDistanceMaterial===!0){let G=n.properties.get(T);G.light=C}return T}function y(S,A,C,_,T){if(S.visible===!1)return;if(S.layers.test(A.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&T===Cn)&&(!S.frustumCulled||i.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,S.matrixWorld);let U=e.update(S),k=S.material;if(Array.isArray(k)){let X=U.groups;for(let V=0,te=X.length;V<te;V++){let F=X[V],q=k[F.materialIndex];if(q&&q.visible){let J=w(S,q,_,T);S.onBeforeShadow(n,S,A,C,U,J,F),n.renderBufferDirect(C,null,U,J,S,F),S.onAfterShadow(n,S,A,C,U,J,F)}}}else if(k.visible){let X=w(S,k,_,T);S.onBeforeShadow(n,S,A,C,U,X,null),n.renderBufferDirect(C,null,U,X,S,null),S.onAfterShadow(n,S,A,C,U,X,null)}}let G=S.children;for(let U=0,k=G.length;U<k;U++)y(G[U],A,C,_,T)}function R(S){S.target.removeEventListener("dispose",R);for(let C in c){let _=c[C],T=S.target.uuid;T in _&&(_[T].dispose(),delete _[T])}}}var Em={[go]:Mo,[yo]:wo,[xo]:_o,[bi]:To,[Mo]:go,[wo]:yo,[_o]:xo,[To]:bi};function gm(n,e){function t(){let N=!1,Te=new xt,ee=null,le=new xt(0,0,0,0);return{setMask:function(Pe){ee!==Pe&&!N&&(n.colorMask(Pe,Pe,Pe,Pe),ee=Pe)},setLocked:function(Pe){N=Pe},setClear:function(Pe,Ce,Ze,ht,Rt){Rt===!0&&(Pe*=ht,Ce*=ht,Ze*=ht),Te.set(Pe,Ce,Ze,ht),le.equals(Te)===!1&&(n.clearColor(Pe,Ce,Ze,ht),le.copy(Te))},reset:function(){N=!1,ee=null,le.set(-1,0,0,0)}}}function i(){let N=!1,Te=!1,ee=null,le=null,Pe=null;return{setReversed:function(Ce){if(Te!==Ce){let Ze=e.get("EXT_clip_control");Ce?Ze.clipControlEXT(Ze.LOWER_LEFT_EXT,Ze.ZERO_TO_ONE_EXT):Ze.clipControlEXT(Ze.LOWER_LEFT_EXT,Ze.NEGATIVE_ONE_TO_ONE_EXT),Te=Ce;let ht=Pe;Pe=null,this.setClear(ht)}},getReversed:function(){return Te},setTest:function(Ce){Ce?re(n.DEPTH_TEST):ce(n.DEPTH_TEST)},setMask:function(Ce){ee!==Ce&&!N&&(n.depthMask(Ce),ee=Ce)},setFunc:function(Ce){if(Te&&(Ce=Em[Ce]),le!==Ce){switch(Ce){case go:n.depthFunc(n.NEVER);break;case Mo:n.depthFunc(n.ALWAYS);break;case yo:n.depthFunc(n.LESS);break;case bi:n.depthFunc(n.LEQUAL);break;case xo:n.depthFunc(n.EQUAL);break;case To:n.depthFunc(n.GEQUAL);break;case wo:n.depthFunc(n.GREATER);break;case _o:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}le=Ce}},setLocked:function(Ce){N=Ce},setClear:function(Ce){Pe!==Ce&&(Te&&(Ce=1-Ce),n.clearDepth(Ce),Pe=Ce)},reset:function(){N=!1,ee=null,le=null,Pe=null,Te=!1}}}function s(){let N=!1,Te=null,ee=null,le=null,Pe=null,Ce=null,Ze=null,ht=null,Rt=null;return{setTest:function(at){N||(at?re(n.STENCIL_TEST):ce(n.STENCIL_TEST))},setMask:function(at){Te!==at&&!N&&(n.stencilMask(at),Te=at)},setFunc:function(at,Wt,Bt){(ee!==at||le!==Wt||Pe!==Bt)&&(n.stencilFunc(at,Wt,Bt),ee=at,le=Wt,Pe=Bt)},setOp:function(at,Wt,Bt){(Ce!==at||Ze!==Wt||ht!==Bt)&&(n.stencilOp(at,Wt,Bt),Ce=at,Ze=Wt,ht=Bt)},setLocked:function(at){N=at},setClear:function(at){Rt!==at&&(n.clearStencil(at),Rt=at)},reset:function(){N=!1,Te=null,ee=null,le=null,Pe=null,Ce=null,Ze=null,ht=null,Rt=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},E=new WeakMap,m=[],f=null,d=!1,g=null,p=null,x=null,w=null,y=null,R=null,S=null,A=new Ve(0,0,0),C=0,_=!1,T=null,L=null,G=null,U=null,k=null,X=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),V=!1,te=0,F=n.getParameter(n.VERSION);F.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(F)[1]),V=te>=1):F.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(F)[1]),V=te>=2);let q=null,J={},xe=n.getParameter(n.SCISSOR_BOX),Ie=n.getParameter(n.VIEWPORT),Ue=new xt().fromArray(xe),K=new xt().fromArray(Ie);function pe(N,Te,ee,le){let Pe=new Uint8Array(4),Ce=n.createTexture();n.bindTexture(N,Ce),n.texParameteri(N,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(N,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ze=0;Ze<ee;Ze++)N===n.TEXTURE_3D||N===n.TEXTURE_2D_ARRAY?n.texImage3D(Te,0,n.RGBA,1,1,le,0,n.RGBA,n.UNSIGNED_BYTE,Pe):n.texImage2D(Te+Ze,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Pe);return Ce}let Q={};Q[n.TEXTURE_2D]=pe(n.TEXTURE_2D,n.TEXTURE_2D,1),Q[n.TEXTURE_CUBE_MAP]=pe(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q[n.TEXTURE_2D_ARRAY]=pe(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Q[n.TEXTURE_3D]=pe(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),re(n.DEPTH_TEST),o.setFunc(bi),oe(!1),Ae(el),re(n.CULL_FACE),b(Xn);function re(N){h[N]!==!0&&(n.enable(N),h[N]=!0)}function ce(N){h[N]!==!1&&(n.disable(N),h[N]=!1)}function ne(N,Te){return u[N]!==Te?(n.bindFramebuffer(N,Te),u[N]=Te,N===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=Te),N===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=Te),!0):!1}function $(N,Te){let ee=m,le=!1;if(N){ee=E.get(Te),ee===void 0&&(ee=[],E.set(Te,ee));let Pe=N.textures;if(ee.length!==Pe.length||ee[0]!==n.COLOR_ATTACHMENT0){for(let Ce=0,Ze=Pe.length;Ce<Ze;Ce++)ee[Ce]=n.COLOR_ATTACHMENT0+Ce;ee.length=Pe.length,le=!0}}else ee[0]!==n.BACK&&(ee[0]=n.BACK,le=!0);le&&n.drawBuffers(ee)}function Me(N){return f!==N?(n.useProgram(N),f=N,!0):!1}let ye={[li]:n.FUNC_ADD,[wc]:n.FUNC_SUBTRACT,[_c]:n.FUNC_REVERSE_SUBTRACT};ye[vc]=n.MIN,ye[Sc]=n.MAX;let ve={[bc]:n.ZERO,[Rc]:n.ONE,[Ac]:n.SRC_COLOR,[Fr]:n.SRC_ALPHA,[Lc]:n.SRC_ALPHA_SATURATE,[Ic]:n.DST_COLOR,[Hc]:n.DST_ALPHA,[Cc]:n.ONE_MINUS_SRC_COLOR,[Nr]:n.ONE_MINUS_SRC_ALPHA,[Dc]:n.ONE_MINUS_DST_COLOR,[Pc]:n.ONE_MINUS_DST_ALPHA,[Bc]:n.CONSTANT_COLOR,[Gc]:n.ONE_MINUS_CONSTANT_COLOR,[Uc]:n.CONSTANT_ALPHA,[Fc]:n.ONE_MINUS_CONSTANT_ALPHA};function b(N,Te,ee,le,Pe,Ce,Ze,ht,Rt,at){if(N===Xn){d===!0&&(ce(n.BLEND),d=!1);return}if(d===!1&&(re(n.BLEND),d=!0),N!==Tc){if(N!==g||at!==_){if((p!==li||y!==li)&&(n.blendEquation(n.FUNC_ADD),p=li,y=li),at)switch(N){case Si:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Hn:n.blendFunc(n.ONE,n.ONE);break;case nl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case il:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case Si:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Hn:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case nl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case il:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}x=null,w=null,R=null,S=null,A.set(0,0,0),C=0,g=N,_=at}return}Pe=Pe||Te,Ce=Ce||ee,Ze=Ze||le,(Te!==p||Pe!==y)&&(n.blendEquationSeparate(ye[Te],ye[Pe]),p=Te,y=Pe),(ee!==x||le!==w||Ce!==R||Ze!==S)&&(n.blendFuncSeparate(ve[ee],ve[le],ve[Ce],ve[Ze]),x=ee,w=le,R=Ce,S=Ze),(ht.equals(A)===!1||Rt!==C)&&(n.blendColor(ht.r,ht.g,ht.b,Rt),A.copy(ht),C=Rt),g=N,_=!1}function me(N,Te){N.side===gt?ce(n.CULL_FACE):re(n.CULL_FACE);let ee=N.side===qt;Te&&(ee=!ee),oe(ee),N.blending===Si&&N.transparent===!1?b(Xn):b(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),o.setFunc(N.depthFunc),o.setTest(N.depthTest),o.setMask(N.depthWrite),r.setMask(N.colorWrite);let le=N.stencilWrite;a.setTest(le),le&&(a.setMask(N.stencilWriteMask),a.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),a.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),se(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?re(n.SAMPLE_ALPHA_TO_COVERAGE):ce(n.SAMPLE_ALPHA_TO_COVERAGE)}function oe(N){T!==N&&(N?n.frontFace(n.CW):n.frontFace(n.CCW),T=N)}function Ae(N){N!==yc?(re(n.CULL_FACE),N!==L&&(N===el?n.cullFace(n.BACK):N===xc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):ce(n.CULL_FACE),L=N}function P(N){N!==G&&(V&&n.lineWidth(N),G=N)}function se(N,Te,ee){N?(re(n.POLYGON_OFFSET_FILL),(U!==Te||k!==ee)&&(n.polygonOffset(Te,ee),U=Te,k=ee)):ce(n.POLYGON_OFFSET_FILL)}function be(N){N?re(n.SCISSOR_TEST):ce(n.SCISSOR_TEST)}function I(N){N===void 0&&(N=n.TEXTURE0+X-1),q!==N&&(n.activeTexture(N),q=N)}function v(N,Te,ee){ee===void 0&&(q===null?ee=n.TEXTURE0+X-1:ee=q);let le=J[ee];le===void 0&&(le={type:void 0,texture:void 0},J[ee]=le),(le.type!==N||le.texture!==Te)&&(q!==ee&&(n.activeTexture(ee),q=ee),n.bindTexture(N,Te||Q[N]),le.type=N,le.texture=Te)}function O(){let N=J[q];N!==void 0&&N.type!==void 0&&(n.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function j(){try{n.compressedTexImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Ee(){try{n.compressedTexImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ae(){try{n.texSubImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function He(){try{n.texSubImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Re(){try{n.compressedTexSubImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Be(){try{n.compressedTexSubImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function rt(){try{n.texStorage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Se(){try{n.texStorage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function De(){try{n.texImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ke(){try{n.texImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ge(N){Ue.equals(N)===!1&&(n.scissor(N.x,N.y,N.z,N.w),Ue.copy(N))}function de(N){K.equals(N)===!1&&(n.viewport(N.x,N.y,N.z,N.w),K.copy(N))}function Ke(N,Te){let ee=c.get(Te);ee===void 0&&(ee=new WeakMap,c.set(Te,ee));let le=ee.get(N);le===void 0&&(le=n.getUniformBlockIndex(Te,N.name),ee.set(N,le))}function Fe(N,Te){let le=c.get(Te).get(N);l.get(Te)!==le&&(n.uniformBlockBinding(Te,le,N.__bindingPointIndex),l.set(Te,le))}function $e(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},q=null,J={},u={},E=new WeakMap,m=[],f=null,d=!1,g=null,p=null,x=null,w=null,y=null,R=null,S=null,A=new Ve(0,0,0),C=0,_=!1,T=null,L=null,G=null,U=null,k=null,Ue.set(0,0,n.canvas.width,n.canvas.height),K.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:re,disable:ce,bindFramebuffer:ne,drawBuffers:$,useProgram:Me,setBlending:b,setMaterial:me,setFlipSided:oe,setCullFace:Ae,setLineWidth:P,setPolygonOffset:se,setScissorTest:be,activeTexture:I,bindTexture:v,unbindTexture:O,compressedTexImage2D:j,compressedTexImage3D:Ee,texImage2D:De,texImage3D:ke,updateUBOMapping:Ke,uniformBlockBinding:Fe,texStorage2D:rt,texStorage3D:Se,texSubImage2D:ae,texSubImage3D:He,compressedTexSubImage2D:Re,compressedTexSubImage3D:Be,scissor:ge,viewport:de,reset:$e}}function Mm(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ge,h=new WeakMap,u,E=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(I,v){return m?new OffscreenCanvas(I,v):Ds("canvas")}function d(I,v,O){let j=1,Ee=be(I);if((Ee.width>O||Ee.height>O)&&(j=O/Math.max(Ee.width,Ee.height)),j<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let ae=Math.floor(j*Ee.width),He=Math.floor(j*Ee.height);u===void 0&&(u=f(ae,He));let Re=v?f(ae,He):u;return Re.width=ae,Re.height=He,Re.getContext("2d").drawImage(I,0,0,ae,He),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Ee.width+"x"+Ee.height+") to ("+ae+"x"+He+")."),Re}else return"data"in I&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Ee.width+"x"+Ee.height+")."),I;return I}function g(I){return I.generateMipmaps}function p(I){n.generateMipmap(I)}function x(I){return I.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?n.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function w(I,v,O,j,Ee=!1){if(I!==null){if(n[I]!==void 0)return n[I];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let ae=v;if(v===n.RED&&(O===n.FLOAT&&(ae=n.R32F),O===n.HALF_FLOAT&&(ae=n.R16F),O===n.UNSIGNED_BYTE&&(ae=n.R8)),v===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(ae=n.R8UI),O===n.UNSIGNED_SHORT&&(ae=n.R16UI),O===n.UNSIGNED_INT&&(ae=n.R32UI),O===n.BYTE&&(ae=n.R8I),O===n.SHORT&&(ae=n.R16I),O===n.INT&&(ae=n.R32I)),v===n.RG&&(O===n.FLOAT&&(ae=n.RG32F),O===n.HALF_FLOAT&&(ae=n.RG16F),O===n.UNSIGNED_BYTE&&(ae=n.RG8)),v===n.RG_INTEGER&&(O===n.UNSIGNED_BYTE&&(ae=n.RG8UI),O===n.UNSIGNED_SHORT&&(ae=n.RG16UI),O===n.UNSIGNED_INT&&(ae=n.RG32UI),O===n.BYTE&&(ae=n.RG8I),O===n.SHORT&&(ae=n.RG16I),O===n.INT&&(ae=n.RG32I)),v===n.RGB_INTEGER&&(O===n.UNSIGNED_BYTE&&(ae=n.RGB8UI),O===n.UNSIGNED_SHORT&&(ae=n.RGB16UI),O===n.UNSIGNED_INT&&(ae=n.RGB32UI),O===n.BYTE&&(ae=n.RGB8I),O===n.SHORT&&(ae=n.RGB16I),O===n.INT&&(ae=n.RGB32I)),v===n.RGBA_INTEGER&&(O===n.UNSIGNED_BYTE&&(ae=n.RGBA8UI),O===n.UNSIGNED_SHORT&&(ae=n.RGBA16UI),O===n.UNSIGNED_INT&&(ae=n.RGBA32UI),O===n.BYTE&&(ae=n.RGBA8I),O===n.SHORT&&(ae=n.RGBA16I),O===n.INT&&(ae=n.RGBA32I)),v===n.RGB&&O===n.UNSIGNED_INT_5_9_9_9_REV&&(ae=n.RGB9_E5),v===n.RGBA){let He=Ee?Hs:Mt.getTransfer(j);O===n.FLOAT&&(ae=n.RGBA32F),O===n.HALF_FLOAT&&(ae=n.RGBA16F),O===n.UNSIGNED_BYTE&&(ae=He===St?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT_4_4_4_4&&(ae=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(ae=n.RGB5_A1)}return(ae===n.R16F||ae===n.R32F||ae===n.RG16F||ae===n.RG32F||ae===n.RGBA16F||ae===n.RGBA32F)&&e.get("EXT_color_buffer_float"),ae}function y(I,v){let O;return I?v===null||v===Ei||v===ps?O=n.DEPTH24_STENCIL8:v===In?O=n.DEPTH32F_STENCIL8:v===fs&&(O=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===Ei||v===ps?O=n.DEPTH_COMPONENT24:v===In?O=n.DEPTH_COMPONENT32F:v===fs&&(O=n.DEPTH_COMPONENT16),O}function R(I,v){return g(I)===!0||I.isFramebufferTexture&&I.minFilter!==nn&&I.minFilter!==wn?Math.log2(Math.max(v.width,v.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?v.mipmaps.length:1}function S(I){let v=I.target;v.removeEventListener("dispose",S),C(v),v.isVideoTexture&&h.delete(v)}function A(I){let v=I.target;v.removeEventListener("dispose",A),T(v)}function C(I){let v=i.get(I);if(v.__webglInit===void 0)return;let O=I.source,j=E.get(O);if(j){let Ee=j[v.__cacheKey];Ee.usedTimes--,Ee.usedTimes===0&&_(I),Object.keys(j).length===0&&E.delete(O)}i.remove(I)}function _(I){let v=i.get(I);n.deleteTexture(v.__webglTexture);let O=I.source,j=E.get(O);delete j[v.__cacheKey],o.memory.textures--}function T(I){let v=i.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),i.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(v.__webglFramebuffer[j]))for(let Ee=0;Ee<v.__webglFramebuffer[j].length;Ee++)n.deleteFramebuffer(v.__webglFramebuffer[j][Ee]);else n.deleteFramebuffer(v.__webglFramebuffer[j]);v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer[j])}else{if(Array.isArray(v.__webglFramebuffer))for(let j=0;j<v.__webglFramebuffer.length;j++)n.deleteFramebuffer(v.__webglFramebuffer[j]);else n.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&n.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let j=0;j<v.__webglColorRenderbuffer.length;j++)v.__webglColorRenderbuffer[j]&&n.deleteRenderbuffer(v.__webglColorRenderbuffer[j]);v.__webglDepthRenderbuffer&&n.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let O=I.textures;for(let j=0,Ee=O.length;j<Ee;j++){let ae=i.get(O[j]);ae.__webglTexture&&(n.deleteTexture(ae.__webglTexture),o.memory.textures--),i.remove(O[j])}i.remove(I)}let L=0;function G(){L=0}function U(){let I=L;return I>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+I+" texture units while this GPU supports only "+s.maxTextures),L+=1,I}function k(I){let v=[];return v.push(I.wrapS),v.push(I.wrapT),v.push(I.wrapR||0),v.push(I.magFilter),v.push(I.minFilter),v.push(I.anisotropy),v.push(I.internalFormat),v.push(I.format),v.push(I.type),v.push(I.generateMipmaps),v.push(I.premultiplyAlpha),v.push(I.flipY),v.push(I.unpackAlignment),v.push(I.colorSpace),v.join()}function X(I,v){let O=i.get(I);if(I.isVideoTexture&&P(I),I.isRenderTargetTexture===!1&&I.version>0&&O.__version!==I.version){let j=I.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(O,I,v);return}}t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+v)}function V(I,v){let O=i.get(I);if(I.version>0&&O.__version!==I.version){K(O,I,v);return}t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+v)}function te(I,v){let O=i.get(I);if(I.version>0&&O.__version!==I.version){K(O,I,v);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+v)}function F(I,v){let O=i.get(I);if(I.version>0&&O.__version!==I.version){pe(O,I,v);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+v)}let q={[kr]:n.REPEAT,[ai]:n.CLAMP_TO_EDGE,[Or]:n.MIRRORED_REPEAT},J={[nn]:n.NEAREST,[qc]:n.NEAREST_MIPMAP_NEAREST,[tr]:n.NEAREST_MIPMAP_LINEAR,[wn]:n.LINEAR,[Ro]:n.LINEAR_MIPMAP_NEAREST,[mi]:n.LINEAR_MIPMAP_LINEAR},xe={[$c]:n.NEVER,[ih]:n.ALWAYS,[Qc]:n.LESS,[gl]:n.LEQUAL,[jc]:n.EQUAL,[nh]:n.GEQUAL,[eh]:n.GREATER,[th]:n.NOTEQUAL};function Ie(I,v){if(v.type===In&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===wn||v.magFilter===Ro||v.magFilter===tr||v.magFilter===mi||v.minFilter===wn||v.minFilter===Ro||v.minFilter===tr||v.minFilter===mi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(I,n.TEXTURE_WRAP_S,q[v.wrapS]),n.texParameteri(I,n.TEXTURE_WRAP_T,q[v.wrapT]),(I===n.TEXTURE_3D||I===n.TEXTURE_2D_ARRAY)&&n.texParameteri(I,n.TEXTURE_WRAP_R,q[v.wrapR]),n.texParameteri(I,n.TEXTURE_MAG_FILTER,J[v.magFilter]),n.texParameteri(I,n.TEXTURE_MIN_FILTER,J[v.minFilter]),v.compareFunction&&(n.texParameteri(I,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(I,n.TEXTURE_COMPARE_FUNC,xe[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===nn||v.minFilter!==tr&&v.minFilter!==mi||v.type===In&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");n.texParameterf(I,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function Ue(I,v){let O=!1;I.__webglInit===void 0&&(I.__webglInit=!0,v.addEventListener("dispose",S));let j=v.source,Ee=E.get(j);Ee===void 0&&(Ee={},E.set(j,Ee));let ae=k(v);if(ae!==I.__cacheKey){Ee[ae]===void 0&&(Ee[ae]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,O=!0),Ee[ae].usedTimes++;let He=Ee[I.__cacheKey];He!==void 0&&(Ee[I.__cacheKey].usedTimes--,He.usedTimes===0&&_(v)),I.__cacheKey=ae,I.__webglTexture=Ee[ae].texture}return O}function K(I,v,O){let j=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(j=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(j=n.TEXTURE_3D);let Ee=Ue(I,v),ae=v.source;t.bindTexture(j,I.__webglTexture,n.TEXTURE0+O);let He=i.get(ae);if(ae.version!==He.__version||Ee===!0){t.activeTexture(n.TEXTURE0+O);let Re=Mt.getPrimaries(Mt.workingColorSpace),Be=v.colorSpace===qn?null:Mt.getPrimaries(v.colorSpace),rt=v.colorSpace===qn||Re===Be?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,rt);let Se=d(v.image,!1,s.maxTextureSize);Se=se(v,Se);let De=r.convert(v.format,v.colorSpace),ke=r.convert(v.type),ge=w(v.internalFormat,De,ke,v.colorSpace,v.isVideoTexture);Ie(j,v);let de,Ke=v.mipmaps,Fe=v.isVideoTexture!==!0,$e=He.__version===void 0||Ee===!0,N=ae.dataReady,Te=R(v,Se);if(v.isDepthTexture)ge=y(v.format===ms,v.type),$e&&(Fe?t.texStorage2D(n.TEXTURE_2D,1,ge,Se.width,Se.height):t.texImage2D(n.TEXTURE_2D,0,ge,Se.width,Se.height,0,De,ke,null));else if(v.isDataTexture)if(Ke.length>0){Fe&&$e&&t.texStorage2D(n.TEXTURE_2D,Te,ge,Ke[0].width,Ke[0].height);for(let ee=0,le=Ke.length;ee<le;ee++)de=Ke[ee],Fe?N&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,de.width,de.height,De,ke,de.data):t.texImage2D(n.TEXTURE_2D,ee,ge,de.width,de.height,0,De,ke,de.data);v.generateMipmaps=!1}else Fe?($e&&t.texStorage2D(n.TEXTURE_2D,Te,ge,Se.width,Se.height),N&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Se.width,Se.height,De,ke,Se.data)):t.texImage2D(n.TEXTURE_2D,0,ge,Se.width,Se.height,0,De,ke,Se.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Fe&&$e&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Te,ge,Ke[0].width,Ke[0].height,Se.depth);for(let ee=0,le=Ke.length;ee<le;ee++)if(de=Ke[ee],v.format!==rn)if(De!==null)if(Fe){if(N)if(v.layerUpdates.size>0){let Pe=vl(de.width,de.height,v.format,v.type);for(let Ce of v.layerUpdates){let Ze=de.data.subarray(Ce*Pe/de.data.BYTES_PER_ELEMENT,(Ce+1)*Pe/de.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,Ce,de.width,de.height,1,De,Ze)}v.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,de.width,de.height,Se.depth,De,de.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ee,ge,de.width,de.height,Se.depth,0,de.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Fe?N&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,de.width,de.height,Se.depth,De,ke,de.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ee,ge,de.width,de.height,Se.depth,0,De,ke,de.data)}else{Fe&&$e&&t.texStorage2D(n.TEXTURE_2D,Te,ge,Ke[0].width,Ke[0].height);for(let ee=0,le=Ke.length;ee<le;ee++)de=Ke[ee],v.format!==rn?De!==null?Fe?N&&t.compressedTexSubImage2D(n.TEXTURE_2D,ee,0,0,de.width,de.height,De,de.data):t.compressedTexImage2D(n.TEXTURE_2D,ee,ge,de.width,de.height,0,de.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Fe?N&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,de.width,de.height,De,ke,de.data):t.texImage2D(n.TEXTURE_2D,ee,ge,de.width,de.height,0,De,ke,de.data)}else if(v.isDataArrayTexture)if(Fe){if($e&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Te,ge,Se.width,Se.height,Se.depth),N)if(v.layerUpdates.size>0){let ee=vl(Se.width,Se.height,v.format,v.type);for(let le of v.layerUpdates){let Pe=Se.data.subarray(le*ee/Se.data.BYTES_PER_ELEMENT,(le+1)*ee/Se.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,le,Se.width,Se.height,1,De,ke,Pe)}v.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,Se.width,Se.height,Se.depth,De,ke,Se.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,ge,Se.width,Se.height,Se.depth,0,De,ke,Se.data);else if(v.isData3DTexture)Fe?($e&&t.texStorage3D(n.TEXTURE_3D,Te,ge,Se.width,Se.height,Se.depth),N&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,Se.width,Se.height,Se.depth,De,ke,Se.data)):t.texImage3D(n.TEXTURE_3D,0,ge,Se.width,Se.height,Se.depth,0,De,ke,Se.data);else if(v.isFramebufferTexture){if($e)if(Fe)t.texStorage2D(n.TEXTURE_2D,Te,ge,Se.width,Se.height);else{let ee=Se.width,le=Se.height;for(let Pe=0;Pe<Te;Pe++)t.texImage2D(n.TEXTURE_2D,Pe,ge,ee,le,0,De,ke,null),ee>>=1,le>>=1}}else if(Ke.length>0){if(Fe&&$e){let ee=be(Ke[0]);t.texStorage2D(n.TEXTURE_2D,Te,ge,ee.width,ee.height)}for(let ee=0,le=Ke.length;ee<le;ee++)de=Ke[ee],Fe?N&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,De,ke,de):t.texImage2D(n.TEXTURE_2D,ee,ge,De,ke,de);v.generateMipmaps=!1}else if(Fe){if($e){let ee=be(Se);t.texStorage2D(n.TEXTURE_2D,Te,ge,ee.width,ee.height)}N&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,De,ke,Se)}else t.texImage2D(n.TEXTURE_2D,0,ge,De,ke,Se);g(v)&&p(j),He.__version=ae.version,v.onUpdate&&v.onUpdate(v)}I.__version=v.version}function pe(I,v,O){if(v.image.length!==6)return;let j=Ue(I,v),Ee=v.source;t.bindTexture(n.TEXTURE_CUBE_MAP,I.__webglTexture,n.TEXTURE0+O);let ae=i.get(Ee);if(Ee.version!==ae.__version||j===!0){t.activeTexture(n.TEXTURE0+O);let He=Mt.getPrimaries(Mt.workingColorSpace),Re=v.colorSpace===qn?null:Mt.getPrimaries(v.colorSpace),Be=v.colorSpace===qn||He===Re?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Be);let rt=v.isCompressedTexture||v.image[0].isCompressedTexture,Se=v.image[0]&&v.image[0].isDataTexture,De=[];for(let le=0;le<6;le++)!rt&&!Se?De[le]=d(v.image[le],!0,s.maxCubemapSize):De[le]=Se?v.image[le].image:v.image[le],De[le]=se(v,De[le]);let ke=De[0],ge=r.convert(v.format,v.colorSpace),de=r.convert(v.type),Ke=w(v.internalFormat,ge,de,v.colorSpace),Fe=v.isVideoTexture!==!0,$e=ae.__version===void 0||j===!0,N=Ee.dataReady,Te=R(v,ke);Ie(n.TEXTURE_CUBE_MAP,v);let ee;if(rt){Fe&&$e&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Te,Ke,ke.width,ke.height);for(let le=0;le<6;le++){ee=De[le].mipmaps;for(let Pe=0;Pe<ee.length;Pe++){let Ce=ee[Pe];v.format!==rn?ge!==null?Fe?N&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe,0,0,Ce.width,Ce.height,ge,Ce.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe,Ke,Ce.width,Ce.height,0,Ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Fe?N&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe,0,0,Ce.width,Ce.height,ge,de,Ce.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe,Ke,Ce.width,Ce.height,0,ge,de,Ce.data)}}}else{if(ee=v.mipmaps,Fe&&$e){ee.length>0&&Te++;let le=be(De[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Te,Ke,le.width,le.height)}for(let le=0;le<6;le++)if(Se){Fe?N&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,De[le].width,De[le].height,ge,de,De[le].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,Ke,De[le].width,De[le].height,0,ge,de,De[le].data);for(let Pe=0;Pe<ee.length;Pe++){let Ze=ee[Pe].image[le].image;Fe?N&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe+1,0,0,Ze.width,Ze.height,ge,de,Ze.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe+1,Ke,Ze.width,Ze.height,0,ge,de,Ze.data)}}else{Fe?N&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,0,0,ge,de,De[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,Ke,ge,de,De[le]);for(let Pe=0;Pe<ee.length;Pe++){let Ce=ee[Pe];Fe?N&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe+1,0,0,ge,de,Ce.image[le]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+le,Pe+1,Ke,ge,de,Ce.image[le])}}}g(v)&&p(n.TEXTURE_CUBE_MAP),ae.__version=Ee.version,v.onUpdate&&v.onUpdate(v)}I.__version=v.version}function Q(I,v,O,j,Ee,ae){let He=r.convert(O.format,O.colorSpace),Re=r.convert(O.type),Be=w(O.internalFormat,He,Re,O.colorSpace),rt=i.get(v),Se=i.get(O);if(Se.__renderTarget=v,!rt.__hasExternalTextures){let De=Math.max(1,v.width>>ae),ke=Math.max(1,v.height>>ae);Ee===n.TEXTURE_3D||Ee===n.TEXTURE_2D_ARRAY?t.texImage3D(Ee,ae,Be,De,ke,v.depth,0,He,Re,null):t.texImage2D(Ee,ae,Be,De,ke,0,He,Re,null)}t.bindFramebuffer(n.FRAMEBUFFER,I),Ae(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,j,Ee,Se.__webglTexture,0,oe(v)):(Ee===n.TEXTURE_2D||Ee>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Ee<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,j,Ee,Se.__webglTexture,ae),t.bindFramebuffer(n.FRAMEBUFFER,null)}function re(I,v,O){if(n.bindRenderbuffer(n.RENDERBUFFER,I),v.depthBuffer){let j=v.depthTexture,Ee=j&&j.isDepthTexture?j.type:null,ae=y(v.stencilBuffer,Ee),He=v.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Re=oe(v);Ae(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Re,ae,v.width,v.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,Re,ae,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,ae,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,He,n.RENDERBUFFER,I)}else{let j=v.textures;for(let Ee=0;Ee<j.length;Ee++){let ae=j[Ee],He=r.convert(ae.format,ae.colorSpace),Re=r.convert(ae.type),Be=w(ae.internalFormat,He,Re,ae.colorSpace),rt=oe(v);O&&Ae(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,rt,Be,v.width,v.height):Ae(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,rt,Be,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,Be,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function ce(I,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,I),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let j=i.get(v.depthTexture);j.__renderTarget=v,(!j.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),X(v.depthTexture,0);let Ee=j.__webglTexture,ae=oe(v);if(v.depthTexture.format===is)Ae(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Ee,0);else if(v.depthTexture.format===ms)Ae(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Ee,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Ee,0);else throw new Error("Unknown depthTexture format")}function ne(I){let v=i.get(I),O=I.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==I.depthTexture){let j=I.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),j){let Ee=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,j.removeEventListener("dispose",Ee)};j.addEventListener("dispose",Ee),v.__depthDisposeCallback=Ee}v.__boundDepthTexture=j}if(I.depthTexture&&!v.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");ce(v.__webglFramebuffer,I)}else if(O){v.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[j]),v.__webglDepthbuffer[j]===void 0)v.__webglDepthbuffer[j]=n.createRenderbuffer(),re(v.__webglDepthbuffer[j],I,!1);else{let Ee=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=v.__webglDepthbuffer[j];n.bindRenderbuffer(n.RENDERBUFFER,ae),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ee,n.RENDERBUFFER,ae)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=n.createRenderbuffer(),re(v.__webglDepthbuffer,I,!1);else{let j=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ee=v.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,Ee),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,Ee)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function $(I,v,O){let j=i.get(I);v!==void 0&&Q(j.__webglFramebuffer,I,I.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&ne(I)}function Me(I){let v=I.texture,O=i.get(I),j=i.get(v);I.addEventListener("dispose",A);let Ee=I.textures,ae=I.isWebGLCubeRenderTarget===!0,He=Ee.length>1;if(He||(j.__webglTexture===void 0&&(j.__webglTexture=n.createTexture()),j.__version=v.version,o.memory.textures++),ae){O.__webglFramebuffer=[];for(let Re=0;Re<6;Re++)if(v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer[Re]=[];for(let Be=0;Be<v.mipmaps.length;Be++)O.__webglFramebuffer[Re][Be]=n.createFramebuffer()}else O.__webglFramebuffer[Re]=n.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer=[];for(let Re=0;Re<v.mipmaps.length;Re++)O.__webglFramebuffer[Re]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(He)for(let Re=0,Be=Ee.length;Re<Be;Re++){let rt=i.get(Ee[Re]);rt.__webglTexture===void 0&&(rt.__webglTexture=n.createTexture(),o.memory.textures++)}if(I.samples>0&&Ae(I)===!1){O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let Re=0;Re<Ee.length;Re++){let Be=Ee[Re];O.__webglColorRenderbuffer[Re]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[Re]);let rt=r.convert(Be.format,Be.colorSpace),Se=r.convert(Be.type),De=w(Be.internalFormat,rt,Se,Be.colorSpace,I.isXRRenderTarget===!0),ke=oe(I);n.renderbufferStorageMultisample(n.RENDERBUFFER,ke,De,I.width,I.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Re,n.RENDERBUFFER,O.__webglColorRenderbuffer[Re])}n.bindRenderbuffer(n.RENDERBUFFER,null),I.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),re(O.__webglDepthRenderbuffer,I,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ae){t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),Ie(n.TEXTURE_CUBE_MAP,v);for(let Re=0;Re<6;Re++)if(v.mipmaps&&v.mipmaps.length>0)for(let Be=0;Be<v.mipmaps.length;Be++)Q(O.__webglFramebuffer[Re][Be],I,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Re,Be);else Q(O.__webglFramebuffer[Re],I,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Re,0);g(v)&&p(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(He){for(let Re=0,Be=Ee.length;Re<Be;Re++){let rt=Ee[Re],Se=i.get(rt);t.bindTexture(n.TEXTURE_2D,Se.__webglTexture),Ie(n.TEXTURE_2D,rt),Q(O.__webglFramebuffer,I,rt,n.COLOR_ATTACHMENT0+Re,n.TEXTURE_2D,0),g(rt)&&p(n.TEXTURE_2D)}t.unbindTexture()}else{let Re=n.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(Re=I.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Re,j.__webglTexture),Ie(Re,v),v.mipmaps&&v.mipmaps.length>0)for(let Be=0;Be<v.mipmaps.length;Be++)Q(O.__webglFramebuffer[Be],I,v,n.COLOR_ATTACHMENT0,Re,Be);else Q(O.__webglFramebuffer,I,v,n.COLOR_ATTACHMENT0,Re,0);g(v)&&p(Re),t.unbindTexture()}I.depthBuffer&&ne(I)}function ye(I){let v=I.textures;for(let O=0,j=v.length;O<j;O++){let Ee=v[O];if(g(Ee)){let ae=x(I),He=i.get(Ee).__webglTexture;t.bindTexture(ae,He),p(ae),t.unbindTexture()}}}let ve=[],b=[];function me(I){if(I.samples>0){if(Ae(I)===!1){let v=I.textures,O=I.width,j=I.height,Ee=n.COLOR_BUFFER_BIT,ae=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,He=i.get(I),Re=v.length>1;if(Re)for(let Be=0;Be<v.length;Be++)t.bindFramebuffer(n.FRAMEBUFFER,He.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,He.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,He.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,He.__webglFramebuffer);for(let Be=0;Be<v.length;Be++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(Ee|=n.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(Ee|=n.STENCIL_BUFFER_BIT)),Re){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,He.__webglColorRenderbuffer[Be]);let rt=i.get(v[Be]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,rt,0)}n.blitFramebuffer(0,0,O,j,0,0,O,j,Ee,n.NEAREST),l===!0&&(ve.length=0,b.length=0,ve.push(n.COLOR_ATTACHMENT0+Be),I.depthBuffer&&I.resolveDepthBuffer===!1&&(ve.push(ae),b.push(ae),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,b)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ve))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Re)for(let Be=0;Be<v.length;Be++){t.bindFramebuffer(n.FRAMEBUFFER,He.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.RENDERBUFFER,He.__webglColorRenderbuffer[Be]);let rt=i.get(v[Be]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,He.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.TEXTURE_2D,rt,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,He.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.resolveDepthBuffer===!1&&l){let v=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[v])}}}function oe(I){return Math.min(s.maxSamples,I.samples)}function Ae(I){let v=i.get(I);return I.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function P(I){let v=o.render.frame;h.get(I)!==v&&(h.set(I,v),I.update())}function se(I,v){let O=I.colorSpace,j=I.format,Ee=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||O!==Ri&&O!==qn&&(Mt.getTransfer(O)===St?(j!==rn||Ee!==Pn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),v}function be(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(c.width=I.naturalWidth||I.width,c.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(c.width=I.displayWidth,c.height=I.displayHeight):(c.width=I.width,c.height=I.height),c}this.allocateTextureUnit=U,this.resetTextureUnits=G,this.setTexture2D=X,this.setTexture2DArray=V,this.setTexture3D=te,this.setTextureCube=F,this.rebindTextures=$,this.setupRenderTarget=Me,this.updateRenderTargetMipmap=ye,this.updateMultisampleRenderTarget=me,this.setupDepthRenderbuffer=ne,this.setupFrameBufferTexture=Q,this.useMultisampledRTT=Ae}function ym(n,e){function t(i,s=qn){let r,o=Mt.getTransfer(s);if(i===Pn)return n.UNSIGNED_BYTE;if(i===Co)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Ho)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ll)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===ol)return n.BYTE;if(i===al)return n.SHORT;if(i===fs)return n.UNSIGNED_SHORT;if(i===Ao)return n.INT;if(i===Ei)return n.UNSIGNED_INT;if(i===In)return n.FLOAT;if(i===gi)return n.HALF_FLOAT;if(i===cl)return n.ALPHA;if(i===hl)return n.RGB;if(i===rn)return n.RGBA;if(i===ul)return n.LUMINANCE;if(i===dl)return n.LUMINANCE_ALPHA;if(i===is)return n.DEPTH_COMPONENT;if(i===ms)return n.DEPTH_STENCIL;if(i===fl)return n.RED;if(i===Po)return n.RED_INTEGER;if(i===pl)return n.RG;if(i===Io)return n.RG_INTEGER;if(i===Do)return n.RGBA_INTEGER;if(i===nr||i===ir||i===sr||i===rr)if(o===St)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===nr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ir)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===sr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===rr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===nr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ir)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===sr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===rr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Lo||i===Bo||i===Go||i===Uo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===Lo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Bo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Go)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Uo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Fo||i===No||i===ko)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Fo||i===No)return o===St?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===ko)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Oo||i===zo||i===Vo||i===Wo||i===Xo||i===Yo||i===qo||i===Zo||i===Jo||i===Ko||i===$o||i===Qo||i===jo||i===ea)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===Oo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===zo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Vo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Wo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Xo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Yo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===qo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Zo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Jo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ko)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===$o)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Qo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===jo)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===ea)return o===St?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===or||i===ta||i===na)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===or)return o===St?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ta)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===na)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===ml||i===ia||i===sa||i===ra)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===or)return r.COMPRESSED_RED_RGTC1_EXT;if(i===ia)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===sa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===ra)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ps?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var xm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Tm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Ul=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let s=new Qt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==i.depthNear||t.depthFar!==i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Yt({vertexShader:xm,fragmentShader:Tm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new M(new ft(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Fl=class extends Vn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,E=null,m=null,f=null,d=new Ul,g=t.getContextAttributes(),p=null,x=null,w=[],y=[],R=new Ge,S=null,A=new Ft;A.viewport=new xt;let C=new Ft;C.viewport=new xt;let _=[A,C],T=new mo,L=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let pe=w[K];return pe===void 0&&(pe=new os,w[K]=pe),pe.getTargetRaySpace()},this.getControllerGrip=function(K){let pe=w[K];return pe===void 0&&(pe=new os,w[K]=pe),pe.getGripSpace()},this.getHand=function(K){let pe=w[K];return pe===void 0&&(pe=new os,w[K]=pe),pe.getHandSpace()};function U(K){let pe=y.indexOf(K.inputSource);if(pe===-1)return;let Q=w[pe];Q!==void 0&&(Q.update(K.inputSource,K.frame,c||o),Q.dispatchEvent({type:K.type,data:K.inputSource}))}function k(){s.removeEventListener("select",U),s.removeEventListener("selectstart",U),s.removeEventListener("selectend",U),s.removeEventListener("squeeze",U),s.removeEventListener("squeezestart",U),s.removeEventListener("squeezeend",U),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",X);for(let K=0;K<w.length;K++){let pe=y[K];pe!==null&&(y[K]=null,w[K].disconnect(pe))}L=null,G=null,d.reset(),e.setRenderTarget(p),m=null,E=null,u=null,s=null,x=null,Ue.stop(),i.isPresenting=!1,e.setPixelRatio(S),e.setSize(R.width,R.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return E!==null?E:m},this.getBinding=function(){return u},this.getFrame=function(){return f},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=e.getRenderTarget(),s.addEventListener("select",U),s.addEventListener("selectstart",U),s.addEventListener("selectend",U),s.addEventListener("squeeze",U),s.addEventListener("squeezestart",U),s.addEventListener("squeezeend",U),s.addEventListener("end",k),s.addEventListener("inputsourceschange",X),g.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(R),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let Q=null,re=null,ce=null;g.depth&&(ce=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=g.stencil?ms:is,re=g.stencil?ps:Ei);let ne={colorFormat:t.RGBA8,depthFormat:ce,scaleFactor:r};u=new XRWebGLBinding(s,t),E=u.createProjectionLayer(ne),s.updateRenderState({layers:[E]}),e.setPixelRatio(1),e.setSize(E.textureWidth,E.textureHeight,!1),x=new mn(E.textureWidth,E.textureHeight,{format:rn,type:Pn,depthTexture:new Vs(E.textureWidth,E.textureHeight,re,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:E.ignoreDepthValues===!1,resolveStencilBuffer:E.ignoreDepthValues===!1})}else{let Q={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,Q),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),x=new mn(m.framebufferWidth,m.framebufferHeight,{format:rn,type:Pn,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Ue.setContext(s),Ue.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return d.getDepthTexture()};function X(K){for(let pe=0;pe<K.removed.length;pe++){let Q=K.removed[pe],re=y.indexOf(Q);re>=0&&(y[re]=null,w[re].disconnect(Q))}for(let pe=0;pe<K.added.length;pe++){let Q=K.added[pe],re=y.indexOf(Q);if(re===-1){for(let ne=0;ne<w.length;ne++)if(ne>=y.length){y.push(Q),re=ne;break}else if(y[ne]===null){y[ne]=Q,re=ne;break}if(re===-1)break}let ce=w[re];ce&&ce.connect(Q)}}let V=new B,te=new B;function F(K,pe,Q){V.setFromMatrixPosition(pe.matrixWorld),te.setFromMatrixPosition(Q.matrixWorld);let re=V.distanceTo(te),ce=pe.projectionMatrix.elements,ne=Q.projectionMatrix.elements,$=ce[14]/(ce[10]-1),Me=ce[14]/(ce[10]+1),ye=(ce[9]+1)/ce[5],ve=(ce[9]-1)/ce[5],b=(ce[8]-1)/ce[0],me=(ne[8]+1)/ne[0],oe=$*b,Ae=$*me,P=re/(-b+me),se=P*-b;if(pe.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(se),K.translateZ(P),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),ce[10]===-1)K.projectionMatrix.copy(pe.projectionMatrix),K.projectionMatrixInverse.copy(pe.projectionMatrixInverse);else{let be=$+P,I=Me+P,v=oe-se,O=Ae+(re-se),j=ye*Me/I*be,Ee=ve*Me/I*be;K.projectionMatrix.makePerspective(v,O,j,Ee,be,I),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function q(K,pe){pe===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(pe.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let pe=K.near,Q=K.far;d.texture!==null&&(d.depthNear>0&&(pe=d.depthNear),d.depthFar>0&&(Q=d.depthFar)),T.near=C.near=A.near=pe,T.far=C.far=A.far=Q,(L!==T.near||G!==T.far)&&(s.updateRenderState({depthNear:T.near,depthFar:T.far}),L=T.near,G=T.far),A.layers.mask=K.layers.mask|2,C.layers.mask=K.layers.mask|4,T.layers.mask=A.layers.mask|C.layers.mask;let re=K.parent,ce=T.cameras;q(T,re);for(let ne=0;ne<ce.length;ne++)q(ce[ne],re);ce.length===2?F(T,A,C):T.projectionMatrix.copy(A.projectionMatrix),J(K,T,re)};function J(K,pe,Q){Q===null?K.matrix.copy(pe.matrixWorld):(K.matrix.copy(Q.matrixWorld),K.matrix.invert(),K.matrix.multiply(pe.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(pe.projectionMatrix),K.projectionMatrixInverse.copy(pe.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Is*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return T},this.getFoveation=function(){if(!(E===null&&m===null))return l},this.setFoveation=function(K){l=K,E!==null&&(E.fixedFoveation=K),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=K)},this.hasDepthSensing=function(){return d.texture!==null},this.getDepthSensingMesh=function(){return d.getMesh(T)};let xe=null;function Ie(K,pe){if(h=pe.getViewerPose(c||o),f=pe,h!==null){let Q=h.views;m!==null&&(e.setRenderTargetFramebuffer(x,m.framebuffer),e.setRenderTarget(x));let re=!1;Q.length!==T.cameras.length&&(T.cameras.length=0,re=!0);for(let $=0;$<Q.length;$++){let Me=Q[$],ye=null;if(m!==null)ye=m.getViewport(Me);else{let b=u.getViewSubImage(E,Me);ye=b.viewport,$===0&&(e.setRenderTargetTextures(x,b.colorTexture,b.depthStencilTexture),e.setRenderTarget(x))}let ve=_[$];ve===void 0&&(ve=new Ft,ve.layers.enable($),ve.viewport=new xt,_[$]=ve),ve.matrix.fromArray(Me.transform.matrix),ve.matrix.decompose(ve.position,ve.quaternion,ve.scale),ve.projectionMatrix.fromArray(Me.projectionMatrix),ve.projectionMatrixInverse.copy(ve.projectionMatrix).invert(),ve.viewport.set(ye.x,ye.y,ye.width,ye.height),$===0&&(T.matrix.copy(ve.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale)),re===!0&&T.cameras.push(ve)}let ce=s.enabledFeatures;if(ce&&ce.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&u){let $=u.getDepthInformation(Q[0]);$&&$.isValid&&$.texture&&d.init(e,$,s.renderState)}}for(let Q=0;Q<w.length;Q++){let re=y[Q],ce=w[Q];re!==null&&ce!==void 0&&ce.update(re,pe,c||o)}xe&&xe(K,pe),pe.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:pe}),f=null}let Ue=new Dh;Ue.setAnimationLoop(Ie),this.setAnimationLoop=function(K){xe=K},this.dispose=function(){}}},Fi=new jt,wm=new _t;function _m(n,e){function t(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function i(g,p){p.color.getRGB(g.fogColor.value,xl(n)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,x,w,y){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),u(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p)):p.isMeshStandardMaterial?(r(g,p),E(g,p),p.isMeshPhysicalMaterial&&m(g,p,y)):p.isMeshMatcapMaterial?(r(g,p),f(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),d(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?l(g,p,x,w):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,t(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===qt&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,t(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===qt&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,t(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,t(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let x=e.get(p),w=x.envMap,y=x.envMapRotation;w&&(g.envMap.value=w,Fi.copy(y),Fi.x*=-1,Fi.y*=-1,Fi.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Fi.y*=-1,Fi.z*=-1),g.envMapRotation.value.setFromMatrix4(wm.makeRotationFromEuler(Fi)),g.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,x,w){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*x,g.scale.value=w*.5,p.map&&(g.map.value=p.map,t(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function u(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function E(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function m(g,p,x){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===qt&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=x.texture,g.transmissionSamplerSize.value.set(x.width,x.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,g.specularIntensityMapTransform))}function f(g,p){p.matcap&&(g.matcap.value=p.matcap)}function d(g,p){let x=e.get(p).light;g.referencePosition.value.setFromMatrixPosition(x.matrixWorld),g.nearDistance.value=x.shadow.camera.near,g.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function vm(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,w){let y=w.program;i.uniformBlockBinding(x,y)}function c(x,w){let y=s[x.id];y===void 0&&(f(x),y=h(x),s[x.id]=y,x.addEventListener("dispose",g));let R=w.program;i.updateUBOMapping(x,R);let S=e.render.frame;r[x.id]!==S&&(E(x),r[x.id]=S)}function h(x){let w=u();x.__bindingPointIndex=w;let y=n.createBuffer(),R=x.__size,S=x.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,R,S),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,w,y),y}function u(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function E(x){let w=s[x.id],y=x.uniforms,R=x.__cache;n.bindBuffer(n.UNIFORM_BUFFER,w);for(let S=0,A=y.length;S<A;S++){let C=Array.isArray(y[S])?y[S]:[y[S]];for(let _=0,T=C.length;_<T;_++){let L=C[_];if(m(L,S,_,R)===!0){let G=L.__offset,U=Array.isArray(L.value)?L.value:[L.value],k=0;for(let X=0;X<U.length;X++){let V=U[X],te=d(V);typeof V=="number"||typeof V=="boolean"?(L.__data[0]=V,n.bufferSubData(n.UNIFORM_BUFFER,G+k,L.__data)):V.isMatrix3?(L.__data[0]=V.elements[0],L.__data[1]=V.elements[1],L.__data[2]=V.elements[2],L.__data[3]=0,L.__data[4]=V.elements[3],L.__data[5]=V.elements[4],L.__data[6]=V.elements[5],L.__data[7]=0,L.__data[8]=V.elements[6],L.__data[9]=V.elements[7],L.__data[10]=V.elements[8],L.__data[11]=0):(V.toArray(L.__data,k),k+=te.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,G,L.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(x,w,y,R){let S=x.value,A=w+"_"+y;if(R[A]===void 0)return typeof S=="number"||typeof S=="boolean"?R[A]=S:R[A]=S.clone(),!0;{let C=R[A];if(typeof S=="number"||typeof S=="boolean"){if(C!==S)return R[A]=S,!0}else if(C.equals(S)===!1)return C.copy(S),!0}return!1}function f(x){let w=x.uniforms,y=0,R=16;for(let A=0,C=w.length;A<C;A++){let _=Array.isArray(w[A])?w[A]:[w[A]];for(let T=0,L=_.length;T<L;T++){let G=_[T],U=Array.isArray(G.value)?G.value:[G.value];for(let k=0,X=U.length;k<X;k++){let V=U[k],te=d(V),F=y%R,q=F%te.boundary,J=F+q;y+=q,J!==0&&R-J<te.storage&&(y+=R-J),G.__data=new Float32Array(te.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=y,y+=te.storage}}}let S=y%R;return S>0&&(y+=R-S),x.__size=y,x.__cache={},this}function d(x){let w={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(w.boundary=4,w.storage=4):x.isVector2?(w.boundary=8,w.storage=8):x.isVector3||x.isColor?(w.boundary=16,w.storage=12):x.isVector4?(w.boundary=16,w.storage=16):x.isMatrix3?(w.boundary=48,w.storage=48):x.isMatrix4?(w.boundary=64,w.storage=64):x.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",x),w}function g(x){let w=x.target;w.removeEventListener("dispose",g);let y=o.indexOf(w.__bindingPointIndex);o.splice(y,1),n.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function p(){for(let x in s)n.deleteBuffer(s[x]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var ua=class{constructor(e={}){let{canvas:t=sh(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:E=!1}=e;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=o;let f=new Uint32Array(4),d=new Int32Array(4),g=null,p=null,x=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Yn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let y=this,R=!1;this._outputColorSpace=kt;let S=0,A=0,C=null,_=-1,T=null,L=new xt,G=new xt,U=null,k=new Ve(0),X=0,V=t.width,te=t.height,F=1,q=null,J=null,xe=new xt(0,0,V,te),Ie=new xt(0,0,V,te),Ue=!1,K=new as,pe=!1,Q=!1,re=new _t,ce=new _t,ne=new B,$=new xt,Me={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ye=!1;function ve(){return C===null?F:1}let b=i;function me(H,W){return t.getContext(H,W)}try{let H={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"175"}`),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",Pe,!1),t.addEventListener("webglcontextcreationerror",Ce,!1),b===null){let W="webgl2";if(b=me(W,H),b===null)throw me(W)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(H){throw console.error("THREE.WebGLRenderer: "+H.message),H}let oe,Ae,P,se,be,I,v,O,j,Ee,ae,He,Re,Be,rt,Se,De,ke,ge,de,Ke,Fe,$e,N;function Te(){oe=new zp(b),oe.init(),Fe=new ym(b,oe),Ae=new Bp(b,oe,e,Fe),P=new gm(b,oe),Ae.reverseDepthBuffer&&E&&P.buffers.depth.setReversed(!0),se=new Xp(b),be=new sm,I=new Mm(b,oe,P,be,Ae,Fe,se),v=new Up(y),O=new Op(y),j=new Ku(b),$e=new Dp(b,j),Ee=new Vp(b,j,se,$e),ae=new qp(b,Ee,j,se),ge=new Yp(b,Ae,I),Se=new Gp(be),He=new im(y,v,O,oe,Ae,$e,Se),Re=new _m(y,be),Be=new om,rt=new dm(oe),ke=new Ip(y,v,O,P,ae,m,l),De=new mm(y,ae,Ae),N=new vm(b,se,Ae,P),de=new Lp(b,oe,se),Ke=new Wp(b,oe,se),se.programs=He.programs,y.capabilities=Ae,y.extensions=oe,y.properties=be,y.renderLists=Be,y.shadowMap=De,y.state=P,y.info=se}Te();let ee=new Fl(y,b);this.xr=ee,this.getContext=function(){return b},this.getContextAttributes=function(){return b.getContextAttributes()},this.forceContextLoss=function(){let H=oe.get("WEBGL_lose_context");H&&H.loseContext()},this.forceContextRestore=function(){let H=oe.get("WEBGL_lose_context");H&&H.restoreContext()},this.getPixelRatio=function(){return F},this.setPixelRatio=function(H){H!==void 0&&(F=H,this.setSize(V,te,!1))},this.getSize=function(H){return H.set(V,te)},this.setSize=function(H,W,ie=!0){if(ee.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}V=H,te=W,t.width=Math.floor(H*F),t.height=Math.floor(W*F),ie===!0&&(t.style.width=H+"px",t.style.height=W+"px"),this.setViewport(0,0,H,W)},this.getDrawingBufferSize=function(H){return H.set(V*F,te*F).floor()},this.setDrawingBufferSize=function(H,W,ie){V=H,te=W,F=ie,t.width=Math.floor(H*ie),t.height=Math.floor(W*ie),this.setViewport(0,0,H,W)},this.getCurrentViewport=function(H){return H.copy(L)},this.getViewport=function(H){return H.copy(xe)},this.setViewport=function(H,W,ie,Y){H.isVector4?xe.set(H.x,H.y,H.z,H.w):xe.set(H,W,ie,Y),P.viewport(L.copy(xe).multiplyScalar(F).round())},this.getScissor=function(H){return H.copy(Ie)},this.setScissor=function(H,W,ie,Y){H.isVector4?Ie.set(H.x,H.y,H.z,H.w):Ie.set(H,W,ie,Y),P.scissor(G.copy(Ie).multiplyScalar(F).round())},this.getScissorTest=function(){return Ue},this.setScissorTest=function(H){P.setScissorTest(Ue=H)},this.setOpaqueSort=function(H){q=H},this.setTransparentSort=function(H){J=H},this.getClearColor=function(H){return H.copy(ke.getClearColor())},this.setClearColor=function(){ke.setClearColor(...arguments)},this.getClearAlpha=function(){return ke.getClearAlpha()},this.setClearAlpha=function(){ke.setClearAlpha(...arguments)},this.clear=function(H=!0,W=!0,ie=!0){let Y=0;if(H){let z=!1;if(C!==null){let we=C.texture.format;z=we===Do||we===Io||we===Po}if(z){let we=C.texture.type,Ne=we===Pn||we===Ei||we===fs||we===ps||we===Co||we===Ho,Ye=ke.getClearColor(),Je=ke.getClearAlpha(),nt=Ye.r,it=Ye.g,je=Ye.b;Ne?(f[0]=nt,f[1]=it,f[2]=je,f[3]=Je,b.clearBufferuiv(b.COLOR,0,f)):(d[0]=nt,d[1]=it,d[2]=je,d[3]=Je,b.clearBufferiv(b.COLOR,0,d))}else Y|=b.COLOR_BUFFER_BIT}W&&(Y|=b.DEPTH_BUFFER_BIT),ie&&(Y|=b.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),b.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",Pe,!1),t.removeEventListener("webglcontextcreationerror",Ce,!1),ke.dispose(),Be.dispose(),rt.dispose(),be.dispose(),v.dispose(),O.dispose(),ae.dispose(),$e.dispose(),N.dispose(),He.dispose(),ee.dispose(),ee.removeEventListener("sessionstart",gn),ee.removeEventListener("sessionend",Kn),on.stop()};function le(H){H.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),R=!0}function Pe(){console.log("THREE.WebGLRenderer: Context Restored."),R=!1;let H=se.autoReset,W=De.enabled,ie=De.autoUpdate,Y=De.needsUpdate,z=De.type;Te(),se.autoReset=H,De.enabled=W,De.autoUpdate=ie,De.needsUpdate=Y,De.type=z}function Ce(H){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",H.statusMessage)}function Ze(H){let W=H.target;W.removeEventListener("dispose",Ze),ht(W)}function ht(H){Rt(H),be.remove(H)}function Rt(H){let W=be.get(H).programs;W!==void 0&&(W.forEach(function(ie){He.releaseProgram(ie)}),H.isShaderMaterial&&He.releaseShaderCache(H))}this.renderBufferDirect=function(H,W,ie,Y,z,we){W===null&&(W=Me);let Ne=z.isMesh&&z.matrixWorld.determinant()<0,Ye=dn(H,W,ie,Y,z);P.setMaterial(Y,Ne);let Je=ie.index,nt=1;if(Y.wireframe===!0){if(Je=Ee.getWireframeAttribute(ie),Je===void 0)return;nt=2}let it=ie.drawRange,je=ie.attributes.position,ue=it.start*nt,Oe=(it.start+it.count)*nt;we!==null&&(ue=Math.max(ue,we.start*nt),Oe=Math.min(Oe,(we.start+we.count)*nt)),Je!==null?(ue=Math.max(ue,0),Oe=Math.min(Oe,Je.count)):je!=null&&(ue=Math.max(ue,0),Oe=Math.min(Oe,je.count));let lt=Oe-ue;if(lt<0||lt===1/0)return;$e.setup(z,Y,Ye,ie,Je);let mt,st=de;if(Je!==null&&(mt=j.get(Je),st=Ke,st.setIndex(mt)),z.isMesh)Y.wireframe===!0?(P.setLineWidth(Y.wireframeLinewidth*ve()),st.setMode(b.LINES)):st.setMode(b.TRIANGLES);else if(z.isLine){let We=Y.linewidth;We===void 0&&(We=1),P.setLineWidth(We*ve()),z.isLineSegments?st.setMode(b.LINES):z.isLineLoop?st.setMode(b.LINE_LOOP):st.setMode(b.LINE_STRIP)}else z.isPoints?st.setMode(b.POINTS):z.isSprite&&st.setMode(b.TRIANGLES);if(z.isBatchedMesh)if(z._multiDrawInstances!==null)lr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),st.renderMultiDrawInstances(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount,z._multiDrawInstances);else if(oe.get("WEBGL_multi_draw"))st.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{let We=z._multiDrawStarts,Xe=z._multiDrawCounts,tt=z._multiDrawCount,et=Je?j.get(Je).bytesPerElement:1,Tt=be.get(Y).currentProgram.getUniforms();for(let yt=0;yt<tt;yt++)Tt.setValue(b,"_gl_DrawID",yt),st.render(We[yt]/et,Xe[yt])}else if(z.isInstancedMesh)st.renderInstances(ue,lt,z.count);else if(ie.isInstancedBufferGeometry){let We=ie._maxInstanceCount!==void 0?ie._maxInstanceCount:1/0,Xe=Math.min(ie.instanceCount,We);st.renderInstances(ue,lt,Xe)}else st.render(ue,lt)};function at(H,W,ie){H.transparent===!0&&H.side===gt&&H.forceSinglePass===!1?(H.side=qt,H.needsUpdate=!0,en(H,W,ie),H.side=zn,H.needsUpdate=!0,en(H,W,ie),H.side=gt):en(H,W,ie)}this.compile=function(H,W,ie=null){ie===null&&(ie=H),p=rt.get(ie),p.init(W),w.push(p),ie.traverseVisible(function(z){z.isLight&&z.layers.test(W.layers)&&(p.pushLight(z),z.castShadow&&p.pushShadow(z))}),H!==ie&&H.traverseVisible(function(z){z.isLight&&z.layers.test(W.layers)&&(p.pushLight(z),z.castShadow&&p.pushShadow(z))}),p.setupLights();let Y=new Set;return H.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;let we=z.material;if(we)if(Array.isArray(we))for(let Ne=0;Ne<we.length;Ne++){let Ye=we[Ne];at(Ye,ie,z),Y.add(Ye)}else at(we,ie,z),Y.add(we)}),p=w.pop(),Y},this.compileAsync=function(H,W,ie=null){let Y=this.compile(H,W,ie);return new Promise(z=>{function we(){if(Y.forEach(function(Ne){be.get(Ne).currentProgram.isReady()&&Y.delete(Ne)}),Y.size===0){z(H);return}setTimeout(we,10)}oe.get("KHR_parallel_shader_compile")!==null?we():setTimeout(we,10)})};let Wt=null;function Bt(H){Wt&&Wt(H)}function gn(){on.stop()}function Kn(){on.start()}let on=new Dh;on.setAnimationLoop(Bt),typeof self<"u"&&on.setContext(self),this.setAnimationLoop=function(H){Wt=H,ee.setAnimationLoop(H),H===null?on.stop():on.start()},ee.addEventListener("sessionstart",gn),ee.addEventListener("sessionend",Kn),this.render=function(H,W){if(W!==void 0&&W.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;if(H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),W.parent===null&&W.matrixWorldAutoUpdate===!0&&W.updateMatrixWorld(),ee.enabled===!0&&ee.isPresenting===!0&&(ee.cameraAutoUpdate===!0&&ee.updateCamera(W),W=ee.getCamera()),H.isScene===!0&&H.onBeforeRender(y,H,W,C),p=rt.get(H,w.length),p.init(W),w.push(p),ce.multiplyMatrices(W.projectionMatrix,W.matrixWorldInverse),K.setFromProjectionMatrix(ce),Q=this.localClippingEnabled,pe=Se.init(this.clippingPlanes,Q),g=Be.get(H,x.length),g.init(),x.push(g),ee.enabled===!0&&ee.isPresenting===!0){let we=y.xr.getDepthSensingMesh();we!==null&&un(we,W,-1/0,y.sortObjects)}un(H,W,0,y.sortObjects),g.finish(),y.sortObjects===!0&&g.sort(q,J),ye=ee.enabled===!1||ee.isPresenting===!1||ee.hasDepthSensing()===!1,ye&&ke.addToRenderList(g,H),this.info.render.frame++,pe===!0&&Se.beginShadows();let ie=p.state.shadowsArray;De.render(ie,H,W),pe===!0&&Se.endShadows(),this.info.autoReset===!0&&this.info.reset();let Y=g.opaque,z=g.transmissive;if(p.setupLights(),W.isArrayCamera){let we=W.cameras;if(z.length>0)for(let Ne=0,Ye=we.length;Ne<Ye;Ne++){let Je=we[Ne];vn(Y,z,H,Je)}ye&&ke.render(H);for(let Ne=0,Ye=we.length;Ne<Ye;Ne++){let Je=we[Ne];yi(g,H,Je,Je.viewport)}}else z.length>0&&vn(Y,z,H,W),ye&&ke.render(H),yi(g,H,W);C!==null&&A===0&&(I.updateMultisampleRenderTarget(C),I.updateRenderTargetMipmap(C)),H.isScene===!0&&H.onAfterRender(y,H,W),$e.resetDefaultState(),_=-1,T=null,w.pop(),w.length>0?(p=w[w.length-1],pe===!0&&Se.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,x.pop(),x.length>0?g=x[x.length-1]:g=null};function un(H,W,ie,Y){if(H.visible===!1)return;if(H.layers.test(W.layers)){if(H.isGroup)ie=H.renderOrder;else if(H.isLOD)H.autoUpdate===!0&&H.update(W);else if(H.isLight)p.pushLight(H),H.castShadow&&p.pushShadow(H);else if(H.isSprite){if(!H.frustumCulled||K.intersectsSprite(H)){Y&&$.setFromMatrixPosition(H.matrixWorld).applyMatrix4(ce);let Ne=ae.update(H),Ye=H.material;Ye.visible&&g.push(H,Ne,Ye,ie,$.z,null)}}else if((H.isMesh||H.isLine||H.isPoints)&&(!H.frustumCulled||K.intersectsObject(H))){let Ne=ae.update(H),Ye=H.material;if(Y&&(H.boundingSphere!==void 0?(H.boundingSphere===null&&H.computeBoundingSphere(),$.copy(H.boundingSphere.center)):(Ne.boundingSphere===null&&Ne.computeBoundingSphere(),$.copy(Ne.boundingSphere.center)),$.applyMatrix4(H.matrixWorld).applyMatrix4(ce)),Array.isArray(Ye)){let Je=Ne.groups;for(let nt=0,it=Je.length;nt<it;nt++){let je=Je[nt],ue=Ye[je.materialIndex];ue&&ue.visible&&g.push(H,Ne,ue,ie,$.z,je)}}else Ye.visible&&g.push(H,Ne,Ye,ie,$.z,null)}}let we=H.children;for(let Ne=0,Ye=we.length;Ne<Ye;Ne++)un(we[Ne],W,ie,Y)}function yi(H,W,ie,Y){let z=H.opaque,we=H.transmissive,Ne=H.transparent;p.setupLightsView(ie),pe===!0&&Se.setGlobalState(y.clippingPlanes,ie),Y&&P.viewport(L.copy(Y)),z.length>0&&Mn(z,W,ie),we.length>0&&Mn(we,W,ie),Ne.length>0&&Mn(Ne,W,ie),P.buffers.depth.setTest(!0),P.buffers.depth.setMask(!0),P.buffers.color.setMask(!0),P.setPolygonOffset(!1)}function vn(H,W,ie,Y){if((ie.isScene===!0?ie.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[Y.id]===void 0&&(p.state.transmissionRenderTarget[Y.id]=new mn(1,1,{generateMipmaps:!0,type:oe.has("EXT_color_buffer_half_float")||oe.has("EXT_color_buffer_float")?gi:Pn,minFilter:mi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Mt.workingColorSpace}));let we=p.state.transmissionRenderTarget[Y.id],Ne=Y.viewport||L;we.setSize(Ne.z*y.transmissionResolutionScale,Ne.w*y.transmissionResolutionScale);let Ye=y.getRenderTarget();y.setRenderTarget(we),y.getClearColor(k),X=y.getClearAlpha(),X<1&&y.setClearColor(16777215,.5),y.clear(),ye&&ke.render(ie);let Je=y.toneMapping;y.toneMapping=Yn;let nt=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),p.setupLightsView(Y),pe===!0&&Se.setGlobalState(y.clippingPlanes,Y),Mn(H,ie,Y),I.updateMultisampleRenderTarget(we),I.updateRenderTargetMipmap(we),oe.has("WEBGL_multisampled_render_to_texture")===!1){let it=!1;for(let je=0,ue=W.length;je<ue;je++){let Oe=W[je],lt=Oe.object,mt=Oe.geometry,st=Oe.material,We=Oe.group;if(st.side===gt&&lt.layers.test(Y.layers)){let Xe=st.side;st.side=qt,st.needsUpdate=!0,Ln(lt,ie,Y,mt,st,We),st.side=Xe,st.needsUpdate=!0,it=!0}}it===!0&&(I.updateMultisampleRenderTarget(we),I.updateRenderTargetMipmap(we))}y.setRenderTarget(Ye),y.setClearColor(k,X),nt!==void 0&&(Y.viewport=nt),y.toneMapping=Je}function Mn(H,W,ie){let Y=W.isScene===!0?W.overrideMaterial:null;for(let z=0,we=H.length;z<we;z++){let Ne=H[z],Ye=Ne.object,Je=Ne.geometry,nt=Ne.group,it=Ne.material;it.allowOverride===!0&&Y!==null&&(it=Y),Ye.layers.test(ie.layers)&&Ln(Ye,W,ie,Je,it,nt)}}function Ln(H,W,ie,Y,z,we){H.onBeforeRender(y,W,ie,Y,z,we),H.modelViewMatrix.multiplyMatrices(ie.matrixWorldInverse,H.matrixWorld),H.normalMatrix.getNormalMatrix(H.modelViewMatrix),z.onBeforeRender(y,W,ie,Y,H,we),z.transparent===!0&&z.side===gt&&z.forceSinglePass===!1?(z.side=qt,z.needsUpdate=!0,y.renderBufferDirect(ie,W,Y,z,H,we),z.side=zn,z.needsUpdate=!0,y.renderBufferDirect(ie,W,Y,z,H,we),z.side=gt):y.renderBufferDirect(ie,W,Y,z,H,we),H.onAfterRender(y,W,ie,Y,z,we)}function en(H,W,ie){W.isScene!==!0&&(W=Me);let Y=be.get(H),z=p.state.lights,we=p.state.shadowsArray,Ne=z.state.version,Ye=He.getParameters(H,z.state,we,W,ie),Je=He.getProgramCacheKey(Ye),nt=Y.programs;Y.environment=H.isMeshStandardMaterial?W.environment:null,Y.fog=W.fog,Y.envMap=(H.isMeshStandardMaterial?O:v).get(H.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&H.envMap===null?W.environmentRotation:H.envMapRotation,nt===void 0&&(H.addEventListener("dispose",Ze),nt=new Map,Y.programs=nt);let it=nt.get(Je);if(it!==void 0){if(Y.currentProgram===it&&Y.lightsStateVersion===Ne)return Qn(H,Ye),it}else Ye.uniforms=He.getUniforms(H),H.onBeforeCompile(Ye,y),it=He.acquireProgram(Ye,Je),nt.set(Je,it),Y.uniforms=Ye.uniforms;let je=Y.uniforms;return(!H.isShaderMaterial&&!H.isRawShaderMaterial||H.clipping===!0)&&(je.clippingPlanes=Se.uniform),Qn(H,Ye),Y.needsLights=Sn(H),Y.lightsStateVersion=Ne,Y.needsLights&&(je.ambientLightColor.value=z.state.ambient,je.lightProbe.value=z.state.probe,je.directionalLights.value=z.state.directional,je.directionalLightShadows.value=z.state.directionalShadow,je.spotLights.value=z.state.spot,je.spotLightShadows.value=z.state.spotShadow,je.rectAreaLights.value=z.state.rectArea,je.ltc_1.value=z.state.rectAreaLTC1,je.ltc_2.value=z.state.rectAreaLTC2,je.pointLights.value=z.state.point,je.pointLightShadows.value=z.state.pointShadow,je.hemisphereLights.value=z.state.hemi,je.directionalShadowMap.value=z.state.directionalShadowMap,je.directionalShadowMatrix.value=z.state.directionalShadowMatrix,je.spotShadowMap.value=z.state.spotShadowMap,je.spotLightMatrix.value=z.state.spotLightMatrix,je.spotLightMap.value=z.state.spotLightMap,je.pointShadowMap.value=z.state.pointShadowMap,je.pointShadowMatrix.value=z.state.pointShadowMatrix),Y.currentProgram=it,Y.uniformsList=null,it}function $n(H){if(H.uniformsList===null){let W=H.currentProgram.getUniforms();H.uniformsList=Ms.seqWithValue(W.seq,H.uniforms)}return H.uniformsList}function Qn(H,W){let ie=be.get(H);ie.outputColorSpace=W.outputColorSpace,ie.batching=W.batching,ie.batchingColor=W.batchingColor,ie.instancing=W.instancing,ie.instancingColor=W.instancingColor,ie.instancingMorph=W.instancingMorph,ie.skinning=W.skinning,ie.morphTargets=W.morphTargets,ie.morphNormals=W.morphNormals,ie.morphColors=W.morphColors,ie.morphTargetsCount=W.morphTargetsCount,ie.numClippingPlanes=W.numClippingPlanes,ie.numIntersection=W.numClipIntersection,ie.vertexAlphas=W.vertexAlphas,ie.vertexTangents=W.vertexTangents,ie.toneMapping=W.toneMapping}function dn(H,W,ie,Y,z){W.isScene!==!0&&(W=Me),I.resetTextureUnits();let we=W.fog,Ne=Y.isMeshStandardMaterial?W.environment:null,Ye=C===null?y.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:Ri,Je=(Y.isMeshStandardMaterial?O:v).get(Y.envMap||Ne),nt=Y.vertexColors===!0&&!!ie.attributes.color&&ie.attributes.color.itemSize===4,it=!!ie.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),je=!!ie.morphAttributes.position,ue=!!ie.morphAttributes.normal,Oe=!!ie.morphAttributes.color,lt=Yn;Y.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(lt=y.toneMapping);let mt=ie.morphAttributes.position||ie.morphAttributes.normal||ie.morphAttributes.color,st=mt!==void 0?mt.length:0,We=be.get(Y),Xe=p.state.lights;if(pe===!0&&(Q===!0||H!==T)){let Ht=H===T&&Y.id===_;Se.setState(Y,H,Ht)}let tt=!1;Y.version===We.__version?(We.needsLights&&We.lightsStateVersion!==Xe.state.version||We.outputColorSpace!==Ye||z.isBatchedMesh&&We.batching===!1||!z.isBatchedMesh&&We.batching===!0||z.isBatchedMesh&&We.batchingColor===!0&&z.colorTexture===null||z.isBatchedMesh&&We.batchingColor===!1&&z.colorTexture!==null||z.isInstancedMesh&&We.instancing===!1||!z.isInstancedMesh&&We.instancing===!0||z.isSkinnedMesh&&We.skinning===!1||!z.isSkinnedMesh&&We.skinning===!0||z.isInstancedMesh&&We.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&We.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&We.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&We.instancingMorph===!1&&z.morphTexture!==null||We.envMap!==Je||Y.fog===!0&&We.fog!==we||We.numClippingPlanes!==void 0&&(We.numClippingPlanes!==Se.numPlanes||We.numIntersection!==Se.numIntersection)||We.vertexAlphas!==nt||We.vertexTangents!==it||We.morphTargets!==je||We.morphNormals!==ue||We.morphColors!==Oe||We.toneMapping!==lt||We.morphTargetsCount!==st)&&(tt=!0):(tt=!0,We.__version=Y.version);let et=We.currentProgram;tt===!0&&(et=en(Y,W,z));let Tt=!1,yt=!1,wt=!1,pt=et.getUniforms(),Et=We.uniforms;if(P.useProgram(et.program)&&(Tt=!0,yt=!0,wt=!0),Y.id!==_&&(_=Y.id,yt=!0),Tt||T!==H){P.buffers.depth.getReversed()?(re.copy(H.projectionMatrix),oh(re),ah(re),pt.setValue(b,"projectionMatrix",re)):pt.setValue(b,"projectionMatrix",H.projectionMatrix),pt.setValue(b,"viewMatrix",H.matrixWorldInverse);let Gt=pt.map.cameraPosition;Gt!==void 0&&Gt.setValue(b,ne.setFromMatrixPosition(H.matrixWorld)),Ae.logarithmicDepthBuffer&&pt.setValue(b,"logDepthBufFC",2/(Math.log(H.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&pt.setValue(b,"isOrthographic",H.isOrthographicCamera===!0),T!==H&&(T=H,yt=!0,wt=!0)}if(z.isSkinnedMesh){pt.setOptional(b,z,"bindMatrix"),pt.setOptional(b,z,"bindMatrixInverse");let Ht=z.skeleton;Ht&&(Ht.boneTexture===null&&Ht.computeBoneTexture(),pt.setValue(b,"boneTexture",Ht.boneTexture,I))}z.isBatchedMesh&&(pt.setOptional(b,z,"batchingTexture"),pt.setValue(b,"batchingTexture",z._matricesTexture,I),pt.setOptional(b,z,"batchingIdTexture"),pt.setValue(b,"batchingIdTexture",z._indirectTexture,I),pt.setOptional(b,z,"batchingColorTexture"),z._colorsTexture!==null&&pt.setValue(b,"batchingColorTexture",z._colorsTexture,I));let bt=ie.morphAttributes;if((bt.position!==void 0||bt.normal!==void 0||bt.color!==void 0)&&ge.update(z,ie,et),(yt||We.receiveShadow!==z.receiveShadow)&&(We.receiveShadow=z.receiveShadow,pt.setValue(b,"receiveShadow",z.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(Et.envMap.value=Je,Et.flipEnvMap.value=Je.isCubeTexture&&Je.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&W.environment!==null&&(Et.envMapIntensity.value=W.environmentIntensity),yt&&(pt.setValue(b,"toneMappingExposure",y.toneMappingExposure),We.needsLights&&Oi(Et,wt),we&&Y.fog===!0&&Re.refreshFogUniforms(Et,we),Re.refreshMaterialUniforms(Et,Y,F,te,p.state.transmissionRenderTarget[H.id]),Ms.upload(b,$n(We),Et,I)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(Ms.upload(b,$n(We),Et,I),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&pt.setValue(b,"center",z.center),pt.setValue(b,"modelViewMatrix",z.modelViewMatrix),pt.setValue(b,"normalMatrix",z.normalMatrix),pt.setValue(b,"modelMatrix",z.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){let Ht=Y.uniformsGroups;for(let Gt=0,Vi=Ht.length;Gt<Vi;Gt++){let Bn=Ht[Gt];N.update(Bn,et),N.bind(Bn,et)}}return et}function Oi(H,W){H.ambientLightColor.needsUpdate=W,H.lightProbe.needsUpdate=W,H.directionalLights.needsUpdate=W,H.directionalLightShadows.needsUpdate=W,H.pointLights.needsUpdate=W,H.pointLightShadows.needsUpdate=W,H.spotLights.needsUpdate=W,H.spotLightShadows.needsUpdate=W,H.rectAreaLights.needsUpdate=W,H.hemisphereLights.needsUpdate=W}function Sn(H){return H.isMeshLambertMaterial||H.isMeshToonMaterial||H.isMeshPhongMaterial||H.isMeshStandardMaterial||H.isShadowMaterial||H.isShaderMaterial&&H.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(H,W,ie){let Y=be.get(H);Y.__autoAllocateDepthBuffer=H.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),be.get(H.texture).__webglTexture=W,be.get(H.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:ie,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(H,W){let ie=be.get(H);ie.__webglFramebuffer=W,ie.__useDefaultFramebuffer=W===void 0};let jn=b.createFramebuffer();this.setRenderTarget=function(H,W=0,ie=0){C=H,S=W,A=ie;let Y=!0,z=null,we=!1,Ne=!1;if(H){let Je=be.get(H);if(Je.__useDefaultFramebuffer!==void 0)P.bindFramebuffer(b.FRAMEBUFFER,null),Y=!1;else if(Je.__webglFramebuffer===void 0)I.setupRenderTarget(H);else if(Je.__hasExternalTextures)I.rebindTextures(H,be.get(H.texture).__webglTexture,be.get(H.depthTexture).__webglTexture);else if(H.depthBuffer){let je=H.depthTexture;if(Je.__boundDepthTexture!==je){if(je!==null&&be.has(je)&&(H.width!==je.image.width||H.height!==je.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");I.setupDepthRenderbuffer(H)}}let nt=H.texture;(nt.isData3DTexture||nt.isDataArrayTexture||nt.isCompressedArrayTexture)&&(Ne=!0);let it=be.get(H).__webglFramebuffer;H.isWebGLCubeRenderTarget?(Array.isArray(it[W])?z=it[W][ie]:z=it[W],we=!0):H.samples>0&&I.useMultisampledRTT(H)===!1?z=be.get(H).__webglMultisampledFramebuffer:Array.isArray(it)?z=it[ie]:z=it,L.copy(H.viewport),G.copy(H.scissor),U=H.scissorTest}else L.copy(xe).multiplyScalar(F).floor(),G.copy(Ie).multiplyScalar(F).floor(),U=Ue;if(ie!==0&&(z=jn),P.bindFramebuffer(b.FRAMEBUFFER,z)&&Y&&P.drawBuffers(H,z),P.viewport(L),P.scissor(G),P.setScissorTest(U),we){let Je=be.get(H.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_CUBE_MAP_POSITIVE_X+W,Je.__webglTexture,ie)}else if(Ne){let Je=be.get(H.texture),nt=W;b.framebufferTextureLayer(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,Je.__webglTexture,ie,nt)}else if(H!==null&&ie!==0){let Je=be.get(H.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,Je.__webglTexture,ie)}_=-1},this.readRenderTargetPixels=function(H,W,ie,Y,z,we,Ne){if(!(H&&H.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ye=be.get(H).__webglFramebuffer;if(H.isWebGLCubeRenderTarget&&Ne!==void 0&&(Ye=Ye[Ne]),Ye){P.bindFramebuffer(b.FRAMEBUFFER,Ye);try{let Je=H.texture,nt=Je.format,it=Je.type;if(!Ae.textureFormatReadable(nt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ae.textureTypeReadable(it)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}W>=0&&W<=H.width-Y&&ie>=0&&ie<=H.height-z&&b.readPixels(W,ie,Y,z,Fe.convert(nt),Fe.convert(it),we)}finally{let Je=C!==null?be.get(C).__webglFramebuffer:null;P.bindFramebuffer(b.FRAMEBUFFER,Je)}}},this.readRenderTargetPixelsAsync=async function(H,W,ie,Y,z,we,Ne){if(!(H&&H.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ye=be.get(H).__webglFramebuffer;if(H.isWebGLCubeRenderTarget&&Ne!==void 0&&(Ye=Ye[Ne]),Ye)if(W>=0&&W<=H.width-Y&&ie>=0&&ie<=H.height-z){P.bindFramebuffer(b.FRAMEBUFFER,Ye);let Je=H.texture,nt=Je.format,it=Je.type;if(!Ae.textureFormatReadable(nt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ae.textureTypeReadable(it))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let je=b.createBuffer();b.bindBuffer(b.PIXEL_PACK_BUFFER,je),b.bufferData(b.PIXEL_PACK_BUFFER,we.byteLength,b.STREAM_READ),b.readPixels(W,ie,Y,z,Fe.convert(nt),Fe.convert(it),0);let ue=C!==null?be.get(C).__webglFramebuffer:null;P.bindFramebuffer(b.FRAMEBUFFER,ue);let Oe=b.fenceSync(b.SYNC_GPU_COMMANDS_COMPLETE,0);return b.flush(),await rh(b,Oe,4),b.bindBuffer(b.PIXEL_PACK_BUFFER,je),b.getBufferSubData(b.PIXEL_PACK_BUFFER,0,we),b.deleteBuffer(je),b.deleteSync(Oe),we}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(H,W=null,ie=0){let Y=Math.pow(2,-ie),z=Math.floor(H.image.width*Y),we=Math.floor(H.image.height*Y),Ne=W!==null?W.x:0,Ye=W!==null?W.y:0;I.setTexture2D(H,0),b.copyTexSubImage2D(b.TEXTURE_2D,ie,0,0,Ne,Ye,z,we),P.unbindTexture()};let zi=b.createFramebuffer(),bn=b.createFramebuffer();this.copyTextureToTexture=function(H,W,ie=null,Y=null,z=0,we=null){we===null&&(z!==0?(lr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),we=z,z=0):we=0);let Ne,Ye,Je,nt,it,je,ue,Oe,lt,mt=H.isCompressedTexture?H.mipmaps[we]:H.image;if(ie!==null)Ne=ie.max.x-ie.min.x,Ye=ie.max.y-ie.min.y,Je=ie.isBox3?ie.max.z-ie.min.z:1,nt=ie.min.x,it=ie.min.y,je=ie.isBox3?ie.min.z:0;else{let bt=Math.pow(2,-z);Ne=Math.floor(mt.width*bt),Ye=Math.floor(mt.height*bt),H.isDataArrayTexture?Je=mt.depth:H.isData3DTexture?Je=Math.floor(mt.depth*bt):Je=1,nt=0,it=0,je=0}Y!==null?(ue=Y.x,Oe=Y.y,lt=Y.z):(ue=0,Oe=0,lt=0);let st=Fe.convert(W.format),We=Fe.convert(W.type),Xe;W.isData3DTexture?(I.setTexture3D(W,0),Xe=b.TEXTURE_3D):W.isDataArrayTexture||W.isCompressedArrayTexture?(I.setTexture2DArray(W,0),Xe=b.TEXTURE_2D_ARRAY):(I.setTexture2D(W,0),Xe=b.TEXTURE_2D),b.pixelStorei(b.UNPACK_FLIP_Y_WEBGL,W.flipY),b.pixelStorei(b.UNPACK_PREMULTIPLY_ALPHA_WEBGL,W.premultiplyAlpha),b.pixelStorei(b.UNPACK_ALIGNMENT,W.unpackAlignment);let tt=b.getParameter(b.UNPACK_ROW_LENGTH),et=b.getParameter(b.UNPACK_IMAGE_HEIGHT),Tt=b.getParameter(b.UNPACK_SKIP_PIXELS),yt=b.getParameter(b.UNPACK_SKIP_ROWS),wt=b.getParameter(b.UNPACK_SKIP_IMAGES);b.pixelStorei(b.UNPACK_ROW_LENGTH,mt.width),b.pixelStorei(b.UNPACK_IMAGE_HEIGHT,mt.height),b.pixelStorei(b.UNPACK_SKIP_PIXELS,nt),b.pixelStorei(b.UNPACK_SKIP_ROWS,it),b.pixelStorei(b.UNPACK_SKIP_IMAGES,je);let pt=H.isDataArrayTexture||H.isData3DTexture,Et=W.isDataArrayTexture||W.isData3DTexture;if(H.isDepthTexture){let bt=be.get(H),Ht=be.get(W),Gt=be.get(bt.__renderTarget),Vi=be.get(Ht.__renderTarget);P.bindFramebuffer(b.READ_FRAMEBUFFER,Gt.__webglFramebuffer),P.bindFramebuffer(b.DRAW_FRAMEBUFFER,Vi.__webglFramebuffer);for(let Bn=0;Bn<Je;Bn++)pt&&(b.framebufferTextureLayer(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,be.get(H).__webglTexture,z,je+Bn),b.framebufferTextureLayer(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,be.get(W).__webglTexture,we,lt+Bn)),b.blitFramebuffer(nt,it,Ne,Ye,ue,Oe,Ne,Ye,b.DEPTH_BUFFER_BIT,b.NEAREST);P.bindFramebuffer(b.READ_FRAMEBUFFER,null),P.bindFramebuffer(b.DRAW_FRAMEBUFFER,null)}else if(z!==0||H.isRenderTargetTexture||be.has(H)){let bt=be.get(H),Ht=be.get(W);P.bindFramebuffer(b.READ_FRAMEBUFFER,zi),P.bindFramebuffer(b.DRAW_FRAMEBUFFER,bn);for(let Gt=0;Gt<Je;Gt++)pt?b.framebufferTextureLayer(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,bt.__webglTexture,z,je+Gt):b.framebufferTexture2D(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,bt.__webglTexture,z),Et?b.framebufferTextureLayer(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,Ht.__webglTexture,we,lt+Gt):b.framebufferTexture2D(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,Ht.__webglTexture,we),z!==0?b.blitFramebuffer(nt,it,Ne,Ye,ue,Oe,Ne,Ye,b.COLOR_BUFFER_BIT,b.NEAREST):Et?b.copyTexSubImage3D(Xe,we,ue,Oe,lt+Gt,nt,it,Ne,Ye):b.copyTexSubImage2D(Xe,we,ue,Oe,nt,it,Ne,Ye);P.bindFramebuffer(b.READ_FRAMEBUFFER,null),P.bindFramebuffer(b.DRAW_FRAMEBUFFER,null)}else Et?H.isDataTexture||H.isData3DTexture?b.texSubImage3D(Xe,we,ue,Oe,lt,Ne,Ye,Je,st,We,mt.data):W.isCompressedArrayTexture?b.compressedTexSubImage3D(Xe,we,ue,Oe,lt,Ne,Ye,Je,st,mt.data):b.texSubImage3D(Xe,we,ue,Oe,lt,Ne,Ye,Je,st,We,mt):H.isDataTexture?b.texSubImage2D(b.TEXTURE_2D,we,ue,Oe,Ne,Ye,st,We,mt.data):H.isCompressedTexture?b.compressedTexSubImage2D(b.TEXTURE_2D,we,ue,Oe,mt.width,mt.height,st,mt.data):b.texSubImage2D(b.TEXTURE_2D,we,ue,Oe,Ne,Ye,st,We,mt);b.pixelStorei(b.UNPACK_ROW_LENGTH,tt),b.pixelStorei(b.UNPACK_IMAGE_HEIGHT,et),b.pixelStorei(b.UNPACK_SKIP_PIXELS,Tt),b.pixelStorei(b.UNPACK_SKIP_ROWS,yt),b.pixelStorei(b.UNPACK_SKIP_IMAGES,wt),we===0&&W.generateMipmaps&&b.generateMipmap(Xe),P.unbindTexture()},this.copyTextureToTexture3D=function(H,W,ie=null,Y=null,z=0){return lr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(H,W,ie,Y,z)},this.initRenderTarget=function(H){be.get(H).__webglFramebuffer===void 0&&I.setupRenderTarget(H)},this.initTexture=function(H){H.isCubeTexture?I.setTextureCube(H,0):H.isData3DTexture?I.setTexture3D(H,0):H.isDataArrayTexture||H.isCompressedArrayTexture?I.setTexture2DArray(H,0):I.setTexture2D(H,0),P.unbindTexture()},this.resetState=function(){S=0,A=0,C=null,P.reset(),$e.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Mt._getDrawingBufferColorSpace(e),t.unpackColorSpace=Mt._getUnpackColorSpace()}};function kl(n){switch(n){case"hazardWire":return"wireSpark";case"hazardTruck":return"truckRickshaw";case"hazardTank":return"waterTank";case"hazardPit":return"roadPit";case"hazardSnake":return"giantSnake";case"hazardFood":return"chokeFood";case"hazardPhone":return"nightPhone";default:return"none"}}var Ol={punching:{rate:2.2,impact:.35},kicking:{rate:1.6,impact:.4}};function Jn(n,e){let{rate:t,impact:i}=Ol[e],s=(n*t%1+1)%1,r=s<i?1-Math.pow(1-s/i,3):Math.max(0,1-(s-i)/(1-i))**2,o=s>=i?Math.exp(-(s-i)*9):0;return{extend:r,recoil:o}}function zl(n,e,t){let i=new he;i.position.set(0,-.24,.05),n.add(i);let s=new he;s.position.set(0,-.24,.05),e.add(s);let r=new he;r.visible=!1;let o=new D({color:16317180,roughness:.65,side:gt}),a=new D({color:14427686,roughness:.55}),l=new M(new _e(.18,.34,.44,18,1,!1,-Math.PI*.65,Math.PI*1.3),o);l.position.set(0,.36,.03),l.castShadow=!0,r.add(l);let c=new M(new qe(.165,.025,8,20),a);c.rotation.x=Math.PI/2+.14,c.position.set(0,.57,.02),r.add(c),t.add(r);let h=new he;h.visible=!1;let u=new D({color:16708551,roughness:.88}),E=new D({color:165063,roughness:.72}),m=new M(new qe(.142,.022,8,20),u);m.rotation.x=Math.PI/2+.22,m.position.set(0,.505,-.01),h.add(m);let f=new M(new _e(.165,.255,.34,14,1,!1,-Math.PI*.45,Math.PI*.9),u);f.position.set(0,.35,.03),f.rotation.y=Math.PI*.02,h.add(f);for(let Y of[-.095,.095]){let z=new M(new Z(.072,.19,.014),u);z.position.set(Y,.34,.145),z.rotation.x=-.16,z.rotation.z=Y<0?.18:-.18,h.add(z);let we=new M(new Z(.074,.024,.016),E);we.position.set(Y*1.06,.245,.16),we.rotation.x=-.16,we.rotation.z=Y<0?.18:-.18,h.add(we)}t.add(h);let d=new D({color:14870768,metalness:.9,roughness:.14}),g=new D({color:7877903,roughness:.52}),p=new D({color:16096779,metalness:.85,roughness:.22}),x=new D({color:14427686,roughness:.38}),w=new D({color:959977,roughness:.35}),y=new D({color:1976635,roughness:.45}),R={},S=new D({color:16317180,metalness:.72,roughness:.16,emissive:3359061,emissiveIntensity:.35}),A=new he,C=new he,_=new M(new Z(.042,.32,.016),S);_.position.set(0,.16,0),C.add(_);let T=new M(new qe(.048,.014,8,16),x);T.position.set(-.028,-.06,0),C.add(T),A.add(C);let L=new he,G=new M(new Z(.042,.32,.016),S);G.position.set(0,.16,.008),L.add(G);let U=new M(new qe(.048,.014,8,16),x);U.position.set(.028,-.06,.008),L.add(U),A.add(L);let k=new M(new _e(.018,.018,.032,10),p);k.rotation.x=Math.PI/2,k.position.set(0,.02,.004),A.add(k),A.rotation.x=Math.PI*1.16,A.visible=!1,i.add(A),R.scissors=A;let X=()=>{let Y=new he,z=new M(new Z(.028,.22,.016),w);z.position.set(0,.1,0),Y.add(z);for(let we=-3;we<=3;we++){let Ne=new M(new Z(.042,.012,.012),w);Ne.position.set(.024,.1+we*.026,0),Y.add(Ne)}return Y},V=X();V.rotation.x=Math.PI*1.12,V.visible=!1,i.add(V),R.comb=V;let te=X();te.rotation.x=Math.PI*1.12,te.visible=!1,s.add(te);let F=new he,q=new M(new qe(.055,.014,8,16),p);q.position.y=.03,F.add(q);let J=new M(new _e(.014,.014,.22,8),p);J.position.y=.16,F.add(J);let xe=new M(new Z(.055,.045,.016),p);xe.position.set(.032,.24,0),F.add(xe),F.rotation.x=Math.PI*.35,F.visible=!1,i.add(F),R.key=F;let Ie=new he,Ue=new M(new Z(.11,.2,.018),y);Ue.position.set(0,.08,.02),Ie.add(Ue);let K=new Le({color:3718648}),pe=new M(new ft(.09,.16),K);pe.position.set(0,.08,.03),Ie.add(pe),Ie.visible=!1,i.add(Ie),R.phone=Ie;let Q=new he,re=new M(new _e(.018,.02,.28,10),g);re.position.y=.14,Q.add(re);let ce=new M(new _e(.052,.052,.16,12),g);ce.rotation.z=Math.PI/2,ce.position.y=.26,Q.add(ce);let ne=new M(new _e(.055,.055,.03,12),p);ne.rotation.z=Math.PI/2,ne.position.y=.26,Q.add(ne),Q.rotation.x=Math.PI*.42,Q.visible=!1,i.add(Q),R.gavel=Q;let $=new he,Me=new M(new _e(.02,.016,.22,10),y);Me.position.y=.11,$.add(Me);let ye=new M(new fe(.048,12,10),d);ye.position.y=.23,$.add(ye),$.rotation.x=Math.PI*.25,$.visible=!1,i.add($),R.mic=$;let ve=new he,b=new M(new _e(.068,.048,.11,14),new D({color:14251782,roughness:.72}));b.position.y=.06,ve.add(b);let me=new M(new Ct(.058,12),new D({color:11817737,roughness:.25}));me.rotation.x=-Math.PI/2,me.position.y=.112,ve.add(me),ve.visible=!1,i.add(ve),R.teacup=ve;let oe=new he,Ae=new M(new _e(.014,.014,.36,8),d);Ae.position.y=.18,oe.add(Ae);let P=new M(new fe(.065,12,8,0,Math.PI*2,0,Math.PI*.55),d);P.rotation.x=Math.PI,P.position.set(0,.36,.03),oe.add(P),oe.rotation.x=Math.PI*.35,oe.visible=!1,i.add(oe),R.ladle=oe;let se=new he,be=new M(new qe(.08,.012,8,16,Math.PI*1.4),y);be.position.y=.12,se.add(be);let I=new M(new _e(.045,.045,.025,12),d);I.rotation.x=Math.PI/2,I.position.set(0,.22,.03),se.add(I),se.visible=!1,i.add(se),R.stethoscope=se;let v=new he,O=new M(new _e(.038,.038,.22,12),w);O.position.y=.14,v.add(O);let j=new M(new Qe(.012,.12,8),d);j.position.y=.31,v.add(j),v.rotation.x=Math.PI*.45,v.visible=!1,i.add(v),R.syringe=v;let Ee=new he,ae=new M(new Qe(.085,.055,14),p);ae.rotation.x=Math.PI,ae.position.y=.04,Ee.add(ae);let He=new M(new Qe(.025,.08,10),new Le({color:16707722}));He.position.y=.1,Ee.add(He),Ee.visible=!1,i.add(Ee),R.diya=Ee;let Re=new he,Be=new M(new _e(.018,.018,.46,10),p);Be.rotation.z=Math.PI/2,Be.position.set(.14,.04,.04),Re.add(Be),Re.visible=!1,i.add(Re),R.flute=Re;let rt=new he,Se=new M(new Z(.18,.24,.045),x);Se.position.set(0,.1,.04),rt.add(Se);let De=new M(new Z(.16,.22,.036),new D({color:16710888}));De.position.set(.01,.1,.04),rt.add(De),rt.visible=!1,i.add(rt),R.book=rt;let ke=new he,ge=new M(new _e(.018,.022,.56,10),g);ge.position.y=.28,ke.add(ge),ke.rotation.x=Math.PI*.25,ke.visible=!1,i.add(ke),R.baton=ke;let de=new he,Ke=new M(new _e(.012,.012,.11,8),new D({color:16777215}));Ke.position.y=.06,de.add(Ke),de.rotation.x=Math.PI*.35,de.visible=!1,i.add(de),R.chalk=de;let Fe=new he,$e=new M(new _e(.016,.016,.92,10),p);$e.position.y=.36,Fe.add($e);let N=new M(new Qe(.032,.16,8),p);N.position.y=.88,Fe.add(N);for(let Y of[-1,1]){let z=new M(new Qe(.022,.14,8),p);z.position.set(Y*.065,.82,0),z.rotation.z=-Y*.25,Fe.add(z)}Fe.visible=!1,i.add(Fe),R.trishul=Fe;let Te=new he,ee=new M(new qe(.32,.02,8,22,Math.PI),p);ee.rotation.z=-Math.PI/2,ee.position.set(0,.18,.05),Te.add(ee),Te.visible=!1,i.add(Te),R.bow=Te;let le=new he,Pe=new M(new _e(.02,.028,.56,10),p);Pe.position.y=.24,le.add(Pe);let Ce=new M(new fe(.115,14,12),p);Ce.scale.set(1,1.18,1),Ce.position.y=.56,le.add(Ce);let Ze=new M(new qe(.112,.016,6,14),p);Ze.rotation.x=Math.PI/2,Ze.position.y=.56,le.add(Ze),le.rotation.x=Math.PI*.28,le.visible=!1,i.add(le),R.gada=le;let ht=new he,Rt=new M(new Z(.14,.08,.025),new D({color:2278750,roughness:.45}));Rt.position.set(0,.05,.04),ht.add(Rt),ht.visible=!1,i.add(ht),R.money=ht;let at=new he,Wt=new M(new _e(.016,.016,.65,8),g);Wt.position.y=.22,at.add(Wt);let Bt=new M(new Qe(.09,.22,10),new D({color:16638023,roughness:.9}));Bt.position.y=-.14,at.add(Bt),at.visible=!1,i.add(at),R.broom=at;let gn=new he,Kn=new M(new _e(.014,.014,.55,8),y);Kn.position.y=.26,gn.add(Kn);let on=new M(new Qe(.32,.14,14),x);on.position.y=.52,gn.add(on),gn.visible=!1,i.add(gn),R.umbrella=gn;let un=new he,yi=new M(new _e(.12,.09,.022,14),d);yi.position.y=.02,un.add(yi);for(let Y of[-.04,.04,0]){let z=new M(new fe(.036,10,8),new D({color:16096779,roughness:.45}));z.position.set(Y,.055,Y===0?.035:-.02),un.add(z)}un.visible=!1,i.add(un),R.sweetplate=un;let vn=new he,Mn=new M(new Z(.11,.22,.02),u);Mn.position.set(.01,-.15,.015),Mn.rotation.x=.04,vn.add(Mn);let Ln=new M(new Z(.114,.035,.023),E);Ln.position.set(.01,-.23,.018),Ln.rotation.x=.04,vn.add(Ln),vn.visible=!1,i.add(vn),R.towel=vn;let en=new he,$n=new M(new _e(.055,.068,.18,12),w);$n.position.y=.09,en.add($n);let Qn=new M(new Z(.09,.04,.035),S);Qn.position.set(.025,.2,0),en.add(Qn),en.rotation.x=Math.PI*.42,en.visible=!1,i.add(en),R.sprayBottle=en;let dn=new he,Oi=new M(new _e(.014,.018,.24,8),new D({color:1409085,roughness:.65}));Oi.position.y=.08,dn.add(Oi);let Sn=new D({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.28}),jn=new D({color:16020150,emissive:14362487,emissiveIntensity:.25,roughness:.34});for(let Y=0;Y<8;Y++){let z=Y/8*Math.PI*2,we=new M(new Qe(.042,.13,6),Y%2===0?jn:Sn);we.position.set(Math.cos(z)*.068,.22,Math.sin(z)*.068),we.rotation.z=-Math.cos(z)*.62,we.rotation.x=Math.sin(z)*.62,dn.add(we)}let zi=new M(new fe(.048,10,8),Sn);zi.position.y=.22,dn.add(zi),dn.rotation.x=Math.PI*.18,dn.visible=!1,i.add(dn),R.lotus=dn;let bn=new he,H=new D({color:16498468,emissive:16096779,emissiveIntensity:.78,metalness:.85,roughness:.14}),W=new M(new qe(.14,.022,8,22),H);W.position.y=.2,bn.add(W);let ie=new M(new Lt(.055,0),H);ie.position.y=.2,bn.add(ie);for(let Y=0;Y<10;Y++){let z=Y/10*Math.PI*2,we=new M(new Qe(.022,.065,4),H);we.position.set(Math.cos(z)*.165,.2+Math.sin(z)*.165,0),we.rotation.z=z-Math.PI/2,bn.add(we)}return bn.visible=!1,i.add(bn),R.chakra=bn,{rightGroup:i,leftGroup:s,capeGroup:r,towelNeckGroup:h,rightMeshes:R,leftComb:te,scissorUpper:C,scissorLower:L,phoneScreen:K,diyaFlame:He}}function Fh(n,e,t,i,s,r){if(!n)return;let o=t==="removingTowel"?"towel":e&&e!=="none"?e:null;for(let a of Object.keys(n.rightMeshes))n.rightMeshes[a].visible=a===o;if(n.leftComb.visible=o==="scissors"||o==="comb",n.capeGroup.visible=r&&o!=="scissors",n.towelNeckGroup.visible=r&&o!=="scissors"&&t!=="removingTowel",o==="scissors"&&n.scissorUpper&&n.scissorLower){let l=.05+Math.pow(.5+.5*Math.sin(i*(t==="cutting"||s?18:8.5)),2)*.42;n.scissorUpper.rotation.z=l,n.scissorLower.rotation.z=-l}if(o==="phone"&&n.phoneScreen&&n.phoneScreen.color.setHex(Math.sin(i*9)>0?3718648:8246268),o==="diya"&&n.diyaFlame){let a=.85+.25*Math.sin(i*14);n.diyaFlame.scale.set(a,.9+.3*Math.cos(i*11),a)}o==="chakra"&&n.rightMeshes.chakra&&(n.rightMeshes.chakra.rotation.z=i*5.2)}function Nh(n,e,t,i){if(i||n==="BrainrotLog"||n==="CupDancer"||n==="CartoonTank"||n==="ComicBobble")return null;let s=(e||"").toLowerCase();return/narasimha|narsimha|narsingh|नरसिंह|नृसिंह/.test(s)?"narasimha":/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/.test(s)?"asuraKing":/hanuman|maruti|bajrang|pavanputra|हनुमान|मारुति|बजरंग/.test(s)?"hanuman":/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/.test(s)?"shiv":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/.test(s)?"krishna":/ram|raghav|raghunath|राम|राघव/.test(s)?"ram":/vishnu|hari|narayan|vasudev|विष्णु|हरि|नारायण|वासुदेव/.test(s)?"vishnu":n==="NobleWoman"?"devi":n==="ChildDevotee"?"prahladChild":n==="SageRishi"?"rishi":(t==="Temple"||t==="ForestAshram"||t==="RiverGhat"||t==="Himalaya"||t==="PalaceCourt"||t==="Cosmos")&&(n==="KingCrown"||n==="Divine"||n==="Warrior")?"genericSacred":null}function kh(n,e){switch(n){case"narasimha":return{skin:14261851,robe:14251782,sash:12131356,scale:1.18};case"asuraKing":return{skin:8867380,robe:8330525,sash:16096779,scale:1.07};case"hanuman":return{skin:14711612,robe:15357964,sash:16436245,scale:1.08};case"shiv":return{skin:13358561,robe:9584654,sash:16347926,scale:1.1};case"krishna":return{skin:6000370,robe:15381256,sash:14427686,scale:1.04};case"ram":return{skin:8234216,robe:14251782,sash:12131356,scale:1.05};case"vishnu":return{skin:6788331,robe:16096779,sash:14427686,scale:1.12};case"prahladChild":return{skin:15250056,robe:15357964,sash:16498468,scale:.78};case"rishi":return{skin:e.skin,robe:12735506,sash:16638082,scale:.98};default:return{skin:e.skin,robe:e.robe,sash:e.sash,scale:1}}}function Oh(n,e,t){let i=new D({color:t,roughness:.44,metalness:.04}),s=new D({color:15119740,roughness:.48}),r=new D({color:5972257,roughness:.35}),o=new D({color:8138002,roughness:.62}),a=new D({color:14251782,emissive:7877903,emissiveIntensity:.18,roughness:.52}),l=new D({color:16498468,emissive:11817737,emissiveIntensity:.25,roughness:.42}),c=new D({color:16776693,roughness:.18,metalness:.05}),h=new D({color:16236088,metalness:.88,roughness:.2}),u=new M(new fe(e*1.04,24,18),i);u.scale.set(1.06,1.04,1.04),u.castShadow=!0,n.add(u);for(let te of[-1,1]){let F=new M(new fe(e*.42,12,10),s);F.scale.set(1.05,.82,.95),F.position.set(te*e*.54,-e*.12,e*.68),n.add(F);let q=new M(new Qe(e*.24,e*.44,8),i);q.position.set(te*e*.88,e*.72,-e*.04),q.rotation.z=-te*.48,q.rotation.x=.12,n.add(q)}let E=new M(new Z(e*.52,e*.54,e*.62),s);E.position.set(0,-e*.04,e*.86),E.rotation.x=.22,n.add(E);for(let te of[-1,1]){let F=new M(new fe(e*.27,14,10),s);F.scale.set(1.1,.78,1.15),F.position.set(te*e*.24,-e*.25,e*1.08),n.add(F);for(let q=0;q<3;q++){let J=new M(new _e(.004,.0015,e*.65,4),c);J.rotation.z=te*(Math.PI*.44+(q-1)*.16),J.rotation.y=te*-.22,J.position.set(te*e*.58,-e*(.2+q*.06),e*1.12),n.add(J)}}let m=new M(new Qe(e*.22,e*.24,4),r);m.rotation.x=Math.PI*.52,m.rotation.z=Math.PI*.25,m.position.set(0,-e*.11,e*1.26),n.add(m);let f=-e*.46,d=new M(new fe(e*.34,14,10),new Le({color:7016218}));d.scale.set(1.05,.48,.85),d.position.set(0,f+e*.04,e*.96),n.add(d);let g=new M(new vt(e*.052,e*.42,4,8),s);g.rotation.z=Math.PI/2,g.position.set(0,f+e*.14,e*1.16),n.add(g);let p=new he;p.position.set(0,f+e*.02,e*.72),n.add(p);let x=new M(new fe(e*.32,14,10),s);x.scale.set(1.06,.65,1.18),x.position.set(0,-e*.14,e*.34),p.add(x);let w=new M(new vt(e*.052,e*.38,4,8),s);w.rotation.z=Math.PI/2,w.position.set(0,-e*.04,e*.46),p.add(w);for(let te of[-1,1]){let F=new M(new Qe(e*.068,e*.3,8),c);F.rotation.x=Math.PI,F.position.set(te*e*.24,f+e*.02,e*1.22),n.add(F);let q=new M(new Qe(e*.056,e*.24,8),c);q.position.set(te*e*.2,e*.02,e*.48),p.add(q)}let y=new D({color:16707722,emissive:16096779,emissiveIntensity:.72,roughness:.15}),R=new D({color:1705218,emissive:8133904,emissiveIntensity:.25,roughness:.1}),S=new D({color:t,roughness:.46}),A=new D({color:8138002,roughness:.55}),C=te=>{let F=te*e*.4,q=e*.14,J=e*.92,xe=new M(new fe(e*.175,14,12),y);xe.scale.set(1.05,.92,.65),xe.position.set(F,q,J),n.add(xe);let Ie=new M(new fe(e*.095,12,10),R);Ie.scale.set(.68,1.15,.7),Ie.position.set(F,q,J+e*.125),n.add(Ie);let Ue=new M(new fe(e*.185,12,10,0,Math.PI*2,0,Math.PI*.52),S);Ue.scale.set(1.05,.95,.68),Ue.position.set(F,q,J),Ue.rotation.x=-Math.PI*.56,n.add(Ue);let K=new M(new vt(e*.06,e*.28,5,8),A);return K.rotation.z=Math.PI/2-te*.38,K.position.set(F,q+e*.24,J+e*.1),n.add(K),{sclera:xe,pupil:Ie,eyelid:Ue,brow:K}},_=C(-1),T=C(1),L=new D({color:16776171,emissive:16639626,emissiveIntensity:.45}),G=new D({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let te of[-1,1]){let F=new M(new Z(e*.055,e*.44,e*.05),L);F.position.set(te*e*.095,e*.48,e*.96),F.rotation.z=-te*.1,n.add(F)}let U=new M(new Z(e*.22,e*.07,e*.05),L);U.position.set(0,e*.27,e*.98),n.add(U);let k=new M(new vt(e*.032,e*.32,4,8),G);k.position.set(0,e*.48,e*.99),n.add(k);let X=new he;for(let te=0;te<2;te++){let F=te===0?16:14,q=e*(te===0?1.18:1.02),J=te===0?-e*.08:-e*.34;for(let xe=0;xe<F;xe++){let Ie=xe/F*Math.PI*2;if(Math.sin(Ie)<-.78&&Math.abs(Math.cos(Ie))<.38&&te===0)continue;let Ue=(xe+te)%3===0?l:xe%2===0?a:o,K=new M(new Qe(e*(te===0?.32:.36),e*(te===0?.88:1.04),7),Ue);K.position.set(Math.cos(Ie)*q,Math.sin(Ie)*q*1.04,J),K.rotation.z=Ie-Math.PI/2,K.rotation.x=te===0?-.18:-.35,K.castShadow=!0,X.add(K)}}let V=new M(new fe(e*1.16,16,12),o);return V.scale.set(1.22,1.26,.82),V.position.set(0,-e*.12,-e*.48),X.add(V),n.add(X),Vl(n,e*.96,h,"narasimha"),{leftEye:_,rightEye:T,mouthCavity:d,upperLip:g,lowerLip:w,mouthBaseY:f,lowerJawPivot:p}}function Vl(n,e,t,i){let s=new he;s.position.y=i==="narasimha"?e*.84:e*.86;let r=i==="asuraKing",o=r?new D({color:11817737,metalness:.88,roughness:.24}):t,a=new M(new _e(e*.78,e*.86,e*.3,20),o);a.castShadow=!0,s.add(a);let l=r?7:5;for(let f=0;f<l;f++){let d=(f-(l-1)/2)/l*Math.PI*.85,g=r?e*(.45+f%2*.22):e*(.42-Math.abs(f-2)*.08),p=new M(new Qe(e*.13,g,8),t);p.position.set(Math.sin(d)*e*.76,e*.22,Math.cos(d)*e*.76),p.rotation.z=-Math.sin(d)*(r?.42:.16),s.add(p)}if(r){let f=new D({color:16096779,metalness:.9,roughness:.18});for(let d of[-1,1]){let g=new M(new Qe(e*.16,e*.92,10),f);g.position.set(d*e*.88,e*.48,0),g.rotation.z=-d*.62,g.rotation.x=-.18,s.add(g)}}let c=new M(new _e(e*.46,e*.68,e*.34,16),o);c.position.y=e*.3,s.add(c);let h=new M(new Qe(e*.42,e*.56,16),t);h.position.y=e*.7,s.add(h);let u=new M(new fe(e*.11,10,8),t);u.position.y=e*1,s.add(u);let E=r?14427686:i==="narasimha"?16096779:i==="krishna"?1096065:2282478,m=new M(new Lt(e*.16,0),new D({color:E,emissive:E,emissiveIntensity:.65,metalness:.25,roughness:.1}));if(m.position.set(0,e*.06,e*.84),s.add(m),i==="krishna"){let f=new M(new _e(.012,.012,e*1.1,6),t);f.position.set(e*.28,e*.85,e*.12),f.rotation.z=-.35,s.add(f);let d=new M(new fe(e*.2,12,10),new D({color:366185,emissive:959977,emissiveIntensity:.45}));d.scale.set(.85,1.3,.35),d.position.set(e*.46,e*1.32,e*.14),d.rotation.z=-.35,s.add(d)}n.add(s)}function zh(n,e,t,i){let s=new D({color:1315098,roughness:.68}),r=new D({color:16776171,roughness:.22}),o=new D({color:4528669,metalness:.65,roughness:.32});for(let h of[-1,1]){let u=new M(new Qe(t*.14,t*.36,8),o);u.position.set(h*t*1.02,t*.04,0),u.rotation.z=-h*.95,n.add(u)}for(let h of[-1,1]){let u=new M(new vt(t*.055,t*.26,4,8),s);u.rotation.z=Math.PI*.5+h*.38,u.position.set(h*t*.19,-t*.2,t*.94),n.add(u);let E=new M(new Qe(t*.045,t*.19,8),r);E.position.set(h*t*.24,-t*.29,t*.92),E.rotation.z=-h*.22,n.add(E)}let a=new M(new Qe(t*.28,t*.54,10),s);a.rotation.x=Math.PI,a.position.set(0,-t*.72,t*.58),n.add(a);let l=new M(new Z(t*.42,t*.075,t*.04),new D({color:14427686,emissive:8330525,emissiveIntensity:.4}));l.position.set(0,t*.26,t*.95),n.add(l);for(let h of[-1,1]){let u=new M(new fe(.145,14,10,0,Math.PI*2,0,Math.PI*.58),i);u.scale.set(1.15,.82,1.05),u.position.set(h*.26,.57,.02),u.rotation.z=-h*.32,e.add(u)}let c=new M(new _e(.275,.225,.34,16),o);c.position.set(0,.4,.015),e.add(c)}function Vh(n,e,t,i,s,r,o,a,l,c,h){let u={pattaEnds:[]};if(!o)return u;let E=o==="narasimha"?12131356:o==="prahladChild"?16498468:l,m=o==="narasimha"||o==="vishnu"||o==="krishna"?16096779:a,f=new D({color:E,roughness:.46,metalness:.14,side:gt}),d=new D({color:m,roughness:.5,metalness:.12});if(h&&t&&i){for(let S of[t,i]){let A=new M(new _e(.122,.114,.28,14),d);A.position.y=-.14,A.castShadow=!0,S.add(A);let C=new M(new qe(.114,.015,6,16),c);C.rotation.x=Math.PI/2,C.position.y=-.27,S.add(C)}let y=new M(new _e(.06,.135,.42,12,1,!1,-Math.PI*.35,Math.PI*.7),d);y.position.set(0,.02,.16),e.add(y);let R=new M(new Z(.055,.42,.02),c);R.position.set(0,.02,.21),e.add(R)}let g=new sn([new B(-.28,.05,.18),new B(-.25,.48,.08),new B(0,.62,-.18),new B(.25,.48,.08),new B(.28,.05,.18)]),p=new M(new En(g,24,.036,8,!1),f);p.castShadow=!0,e.add(p);for(let y of[-1,1]){let R=new M(new Z(.08,.36,.015),f);R.position.set(y*.26,.16,.15),R.rotation.z=y*.12;let S=new M(new Z(.085,.045,.018),c);S.position.y=-.16,R.add(S),e.add(R),u.pattaEnds.push(R)}let x=new M(new fe(.055,10,8),new D({color:14427686,emissive:8330525,emissiveIntensity:.45}));x.scale.set(1.2,1,.55),x.position.set(0,.24,.235),e.add(x);let w=new M(new qe(.17,.019,8,22),c);w.rotation.x=Math.PI/2+.38,w.position.set(0,.46,.08),e.add(w);for(let y of[s,r]){let R=new M(new qe(.068,.016,8,16),c);R.rotation.x=Math.PI/2,R.position.y=-.18,y.add(R)}if(o==="vishnu"||o==="narasimha"){let y=new M(new Lt(.056,0),new D({color:14753096,emissive:10424889,emissiveIntensity:.65,metalness:.35,roughness:.14}));y.scale.set(1,1.25,.55),y.position.set(0,.44,.255),e.add(y)}if(o==="shiv"){let y=new M(new qe(.098,.022,8,20),new D({color:2450411,emissive:1920728,emissiveIntensity:.72,roughness:.28}));y.rotation.x=Math.PI/2+.15,y.position.set(0,.64,.02),e.add(y);let R=new D({color:1976635,metalness:.35,roughness:.32}),S=new M(new qe(.165,.026,8,22,Math.PI*1.48),R);S.rotation.x=Math.PI/2+.22,S.rotation.z=-.35,S.position.set(0,.59,.02),e.add(S);let A=new M(new fe(.055,10,8),R);A.scale.set(.95,1.35,.55),A.position.set(.165,.68,.08),e.add(A);for(let T of[-.016,.016]){let L=new M(new fe(.009,6,6),c);L.position.set(.165+T,.695,.11),e.add(L)}let C=new D({color:8138002,roughness:.62});for(let T=0;T<14;T++){let L=T/14*Math.PI*2,G=new M(new fe(.022,8,6),C);G.position.set(Math.sin(L)*.155,.5-Math.cos(L)*.06,Math.cos(L)*.18),e.add(G)}let _=new D({color:2694420,roughness:.78});for(let[T,L,G]of[[-.14,.14,.22],[.12,.1,.23],[-.04,.02,.24],[.16,-.02,.18]]){let U=new M(new fe(.036,8,6),_);U.scale.set(1.2,.7,.35),U.position.set(T,L,G),e.add(U)}}if(o==="narasimha"||o==="vishnu"||o==="krishna"||o==="ram"||o==="hanuman"){let R=new sn([new B(-.18,.58,.11),new B(-.22,.22,.24),new B(0,-.02,.27),new B(.22,.22,.24),new B(.18,.58,.11)]).getPoints(18),S=new D({color:16710888,roughness:.55}),A=new D({color:16007006,roughness:.45});R.forEach((C,_)=>{let T=new M(new fe(_%3===0?.038:.026,8,6),_%3===0?A:S);T.position.copy(C),e.add(T)})}if(o==="narasimha"||o==="vishnu"){let y=o==="vishnu"?6788331:14261851,R=new D({color:y,roughness:.44}),S=new D({color:16776693,emissive:16708551,emissiveIntensity:.2,metalness:.25,roughness:.2});if(o==="narasimha")for(let A of[s,r])for(let C=-2;C<=2;C++){let _=new M(new Qe(.012,.095,6),S);_.position.set(C*.022,-.31,.035),_.rotation.x=Math.PI+.35,A.add(_)}for(let A of[-1,1]){let C=new he;C.position.set(A*.27,.54,-.1),C.rotation.set(-.22,0,-A*.48),e.add(C);let _=new M(new vt(.056,.28,6,8),R);_.position.y=.22,C.add(_);let T=new he;if(T.position.set(0,.44,.02),C.add(T),A===1){let L=new he,G=new M(new qe(.18,.025,8,24),new D({color:16498468,emissive:16096779,emissiveIntensity:.72,metalness:.85,roughness:.15}));L.add(G);for(let U=0;U<12;U++){let k=U/12*Math.PI*2,X=new M(new Qe(.026,.07,4),c);X.position.set(Math.cos(k)*.21,Math.sin(k)*.21,0),X.rotation.z=k-Math.PI/2,L.add(X)}T.add(L),u.chakraWheel=L}else{let L=new he,G=new D({color:16710888,emissive:16708551,emissiveIntensity:.18,roughness:.28}),U=new M(new Qe(.095,.26,14),G);U.rotation.x=.35,L.add(U);let k=new M(new qe(.088,.015,6,14),c);k.rotation.x=Math.PI/2,L.add(k),T.add(L)}}}return u}var Zh=["devi","mata","durga","lakshmi","laxmi","saraswati","parvati","sita","radha","\u0926\u0947\u0935\u0940","\u092E\u093E\u0924\u093E","\u0926\u0941\u0930\u094D\u0917\u093E","\u0932\u0915\u094D\u0937\u094D\u092E\u0940","\u0938\u0930\u0938\u094D\u0935\u0924\u0940","\u092A\u093E\u0930\u094D\u0935\u0924\u0940","\u0938\u0940\u0924\u093E","\u0930\u093E\u0927\u093E"];function Sm(n,e){return e==="Warrior"||e==="KingCrown"||e==="BrainrotLog"||e==="CupDancer"||e==="CartoonTank"||e==="ComicBobble"||e!=="Narrator"&&(n==="Temple"||n==="ForestAshram"||n==="RiverGhat"||n==="Himalaya")?!0:n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="Battlefield"||n==="PalaceCourt"||n==="ModernCity"||n==="Village"||n==="Archive"}function Xl(n){return n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="ModernCity"}function bm(n,e,t){let i=2907274,s=new Ve(t).getHex(),r=15250056,o=!1;switch(n){case"KingCrown":i=10036282,s=16105016;break;case"SageRishi":i=14247960,s=16638082;break;case"Divine":i=2974425,s=16767040,r=6000111,o=!0;break;case"ChildDevotee":i=15376156,s=14239782;break;case"NobleWoman":i=12725078,s=16303174;break;case"Warrior":i=7557683,s=12962774;break;case"BrainrotLog":i=10115880,s=16436245,r=12088894;break;case"CupDancer":i=16317180,s=16020150,r=16777215;break;case"CartoonTank":i=5078079,s=16436245,r=3560212;break;case"ComicBobble":i=16347926,s=3718648,r=15843995;break;default:i=3104660;break}return e&&/^#?[0-9a-fA-F]{6}$/.test(e.trim())&&(i=new Ve(e.startsWith("#")?e:`#${e}`).getHex()),{robe:i,sash:s,skin:r,isDivine:o}}function Rm(n,e,t,i){let s=[new Ge(n*.68,-.05),new Ge(n,.02),new Ge(n*.98,i*.22),new Ge(e,i*.48),new Ge(t,i*.82),new Ge(t*.62,i*.98),new Ge(.01,i)];return new ui(s,24)}function Am(n){let e=new he,t=new D({color:3876421,roughness:.45,metalness:.3}),i=new M(new _e(.42,.48,.08,24),t);i.position.y=.04,i.receiveShadow=!0,i.castShadow=!0,e.add(i);let s=new D({color:16020150,emissive:n,emissiveIntensity:.22,roughness:.35});for(let a=0;a<12;a++){let l=a/12*Math.PI*2,c=new M(new fe(.11,10,8),s);c.scale.set(1.2,.45,2),c.position.set(Math.cos(l)*.36,.08,Math.sin(l)*.36),c.rotation.y=-l+Math.PI*.5,c.rotation.x=.22,e.add(c)}let r=new Le({color:n,transparent:!0,opacity:.35,side:gt,depthWrite:!1}),o=new M(new An(.32,.52,32),r);return o.rotation.x=-Math.PI/2,o.position.y=.015,e.add(o),{group:e,glowMesh:o}}function Cm(n,e,t,i,s,r,o){let a=new D({color:1972516,roughness:.72}),l=new D({color:14277862,roughness:.6}),c=new D({color:16103470,metalness:.85,roughness:.22}),h=t.toLowerCase(),u=e==="SageRishi"&&(h.includes("narad")||h.includes("\u0928\u093E\u0930\u0926")),E=e==="NobleWoman"&&Zh.some(d=>h.includes(d)),m=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|harishchandra|dashrath|yudhishthir|duryodhan|bali|bhasmasur|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य|हरिश्चंद्र|दशरथ|युधिष्ठिर|दुर्योधन|बलि/i.test(h);if(e==="KingCrown"&&!m&&(o==="turban"||i==="PalaceCourt"||/sartaaj|sufi|shayar|prince|dulha|singer/i.test(h))&&!/maharaj|raja|samrat|emperor/i.test(h)){let d=new M(new fe(s*1.02,20,14,0,Math.PI*2,0,Math.PI*.42),a);d.rotation.x=-.32,n.add(d);let g=new he,p=i==="PalaceCourt"?16117734:r??10036282,x=new D({color:p,roughness:.62}),w=new M(new fe(s*1.08,22,16,0,Math.PI*2,0,Math.PI*.52),x);w.scale.set(1.04,.78,1.06),w.position.set(0,s*.48,-s*.06),w.castShadow=!0,g.add(w);for(let C=0;C<3;C++){let _=new M(new qe(s*(.94+(C===1?.04:0)),s*.105,10,24),C===1?x:new D({color:p,roughness:.55}));_.rotation.x=Math.PI/2-.28+C*.1,_.rotation.z=(C-1)*.14,_.position.set(0,s*(.6+C*.14),-s*.02),_.castShadow=!0,g.add(_)}let y=new M(new Lt(s*.15,0),c);y.position.set(s*.16,s*1.02,s*.74),g.add(y);let R=new M(new Qe(s*.12,s*.44,8),new D({color:16708551,emissive:14251782,emissiveIntensity:.25,roughness:.45}));R.position.set(s*.19,s*1.26,s*.64),R.rotation.z=-.2,R.rotation.x=-.16,g.add(R),n.add(g);let S=new M(new fe(s*.46,14,10),a);S.scale.set(1.22,.65,.78),S.position.set(0,-s*.72,s*.54),n.add(S);let A=new M(new vt(s*.036,s*.28,4,8),a);A.rotation.z=Math.PI/2,A.position.set(0,-s*.2,s*.94),n.add(A);return}if(e==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(h)){let d=new D({color:3875604,roughness:.72}),g=new M(new fe(s*1.04,20,14,0,Math.PI*2,0,Math.PI*.48),d);g.scale.set(1.02,1.12,1),g.rotation.x=-.34,n.add(g);let p=new M(new fe(s*.46,16,14),d);p.scale.set(.88,1.32,.88),p.position.set(0,s*1.24,-s*.12),p.castShadow=!0,n.add(p);let x=new D({color:16317180,emissive:14742270,emissiveIntensity:.85,metalness:.45,roughness:.15}),w=new M(new qe(s*.25,s*.048,8,20,Math.PI*1.22),x);w.position.set(-s*.36,s*1.12,s*.26),w.rotation.z=Math.PI*.68,w.rotation.y=.22,n.add(w);let y=new D({color:3718648,emissive:8246268,emissiveIntensity:.65,roughness:.18}),R=new sn([new B(.02,s*1.62,-s*.08),new B(s*.22,s*1.78,-s*.16),new B(s*.42,s*1.48,-s*.34),new B(s*.48,s*.96,-s*.56)]);n.add(new M(new En(R,16,s*.055,8,!1),y));let S=new M(new qe(s*.42,s*.042,8,16),c);S.rotation.x=Math.PI/2,S.position.set(0,s*.96,-s*.12),n.add(S);return}if(e==="KingCrown"||e==="Divine"||e==="NobleWoman"&&(E||i!=="PalaceCourt"&&(h.includes("rani")||h.includes("\u0930\u093E\u0928\u0940")))){let d=new M(new fe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);d.scale.set(1.01,1.11,.99),d.rotation.x=-.34,n.add(d);let p=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/i.test(h)?"asuraKing":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/i.test(h)?"krishna":/ram|raghav|raghunath|राम|राघव/i.test(h)?"ram":e==="Divine"?"vishnu":"sacred";if(Vl(n,s,c,p),e==="NobleWoman"){let x=new M(new vt(s*.22,s*1.4,8,12),a);x.position.set(0,-s*.85,-s*.82),x.rotation.x=.24,n.add(x)}return}if(e==="SageRishi"){let d=u?new D({color:2892339,roughness:.7}):l,g=new M(new fe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),d);g.scale.set(1.01,1.11,.99),g.rotation.x=-.36,n.add(g);let p=new M(new fe(s*.42,14,12),d);if(p.scale.set(.9,1.15,.9),p.position.set(0,s*1.24,-s*.16),p.castShadow=!0,n.add(p),!u){let x=new M(new Qe(s*.52,s*.95,14),d);x.rotation.x=Math.PI,x.position.set(0,-s*.88,s*.48),n.add(x)}return}if(e==="ChildDevotee"){let d=new M(new fe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),a);d.scale.set(1.01,1.11,.99),d.rotation.x=-.36,n.add(d);let g=new M(new fe(s*.22,10,8),a);if(g.scale.set(1.3,.65,.85),g.position.set(-s*.12,s*.78,s*.68),n.add(g),!Xl(i)){let p=new M(new qe(s*.9,s*.065,10,24),c);p.rotation.x=Math.PI/2-.34,p.position.set(0,s*.55,s*.06),n.add(p);let x=new M(new Lt(s*.13,0),new D({color:1096065,emissive:366185,emissiveIntensity:.6}));x.position.set(0,s*.62,s*.92),n.add(x)}return}if(e==="NobleWoman"){let d=new M(new fe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);d.scale.set(1.01,1.11,.99),d.rotation.x=-.34,n.add(d);let g=new M(new vt(s*.24,s*1.45,8,12),a);g.position.set(0,-s*.85,-s*.85),g.rotation.x=.25,n.add(g);let p=new M(new fe(s*.1,10,8),c);p.position.set(0,s*.5,s*.94),n.add(p);return}if(e==="Warrior"){let d=new D({color:10594485,metalness:.78,roughness:.28}),g=new M(new fe(s*1.05,20,14,0,Math.PI*2,0,Math.PI*.47),d);g.scale.set(1.02,1.12,1),g.rotation.x=-.32,n.add(g);let p=new M(new qe(s*.7,s*.12,8,16,Math.PI),new D({color:14427686,roughness:.6}));p.rotation.y=Math.PI/2,p.position.y=s*.86,n.add(p);return}if(e==="ComicBobble"||Xl(i)){let d=new he,g=new M(new fe(s*1.06,20,14,0,Math.PI*2,0,Math.PI*.5),a);if(g.scale.set(1.04,1.15,1.05),g.position.set(0,s*.06,-s*.02),g.rotation.x=-.15,d.add(g),e==="ComicBobble"){for(let A of[-.35,0,.35]){let C=new M(new Qe(s*.15,s*.4,8),a);C.position.set(A*s*.85,s*1.14,s*.2),C.rotation.z=-A*.65,C.rotation.x=.24,d.add(C)}let S=new M(new fe(s*.38,12,10),a);S.scale.set(1.38,.56,.98),S.position.set(0,s*.92,s*.52),d.add(S)}else{let S=new M(new fe(s*.46,14,12),a);S.scale.set(1.48,.78,1.38),S.position.set(0,s*1.1,s*.36),d.add(S);let A=new M(new fe(s*.36,12,10),a);A.scale.set(1.42,.54,.96),A.position.set(0,s*.92,s*.56),d.add(A);for(let C of[-1,1]){let _=new M(new Qe(s*.14,s*.34,8),a);_.position.set(C*s*.42,s*1.16,s*.26),_.rotation.z=-C*.48,_.rotation.x=.28,d.add(_)}}n.add(d);let p=new he;p.visible=!1;let x=new M(new qe(s*.88,s*.11,8,22,Math.PI*1.15),a);x.rotation.x=Math.PI/2+.18,x.rotation.z=-Math.PI*.075,x.position.set(0,s*.16,-s*.1),p.add(x);let w=new M(new Qe(s*.06,s*.16,6),a);w.position.set(0,s*1.08,-s*.12),p.add(w);let y=new D({color:16775399,emissive:16770229,emissiveIntensity:.48,roughness:.1}),R=new M(new fe(s*.25,12,10),y);return R.scale.set(1.3,.32,.92),R.position.set(.08*s,s*.92,s*.34),R.rotation.z=-.18,R.rotation.x=.28,p.add(R),n.add(p),{hairFullGroup:d,hairShavedGroup:p}}else{let d=new M(new fe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);d.scale.set(1.01,1.11,.99),d.rotation.x=-.35,n.add(d)}}function Jh(n,e,t,i,s,r){let o=new D({color:16317180,roughness:.18}),a=new D({color:1971218,roughness:.12}),l=new D({color:t,roughness:.48}),c=new D({color:i,roughness:.55}),h=r?1.38:1,u=A=>{let C=A*e*(r?.38:.36),_=e*.09,T=s,L=new M(new fe(e*.165*h,14,12),o);L.scale.set(1.06,.9,.56),L.position.set(C,_,T),n.add(L);let G=new M(new fe(e*.098*(r?1.15:1),12,10),a);G.scale.set(1,.95,.62),G.position.set(C,_,T+e*.068*h),n.add(G);let U=new M(new fe(e*.036*h,8,6),new Le({color:16777215}));U.position.set(C+e*.032,_+e*.035,T+e*.115*h),n.add(U);let k=new M(new fe(e*.18*h,12,10,0,Math.PI*2,0,Math.PI*.52),l);k.scale.set(1.02,1.05,.65),k.position.set(C,_,T),k.rotation.x=-Math.PI*.48,n.add(k);let X=new M(new vt(e*.034*h,e*.22*h,4,8),c);return X.rotation.z=Math.PI/2,X.position.set(C,_+e*.25*h,T+e*.08*h),n.add(X),{sclera:L,pupil:G,eyelid:k,brow:X}},E=u(-1),m=u(1),f=new D({color:t,roughness:.45}),d=new M(new fe(e*.085,10,8),f);d.scale.set(.8,1.15,.9),d.position.set(0,-e*.08,s+e*.065),n.add(d);let g=new D({color:16172100,metalness:.85,roughness:.22});for(let A of[-1,1]){let C=new M(new qe(e*.085,e*.025,8,14),g);C.position.set(A*e*.94,-e*.14,e*.04),C.rotation.y=A*Math.PI*.42,n.add(C)}let p=-e*.36,x=s+e*.02,w=new M(new fe(e*(r?.22:.16),12,10),new Le({color:5509406}));w.scale.set(1.1,.2,.45),w.position.set(0,p,x-.01),n.add(w);let y=new D({color:10896452,roughness:.42}),R=new M(new vt(e*.032,e*.22,4,8),y);R.rotation.z=Math.PI/2,R.position.set(0,p+e*.03,x+.03),n.add(R);let S=new M(new vt(e*.034,e*.19,4,8),y);return S.rotation.z=Math.PI/2,S.position.set(0,p-e*.03,x+.03),n.add(S),{leftEye:E,rightEye:m,mouthCavity:w,upperLip:R,lowerLip:S,mouthBaseY:p}}function Hm(n,e,t,i,s,r,o,a){let l=new he,c=new he;l.add(c);let h=new M(new An(.46,.58,36),new Le({color:a,transparent:!0,opacity:.22,side:gt,depthWrite:!1}));h.rotation.x=-Math.PI/2,h.position.y=.012,l.add(h);let u=new M(new Ct(.45,32),new Le({color:a,transparent:!0,opacity:.08,side:gt,depthWrite:!1}));u.rotation.x=-Math.PI/2,u.position.y=.01,l.add(u);let E=new D({color:s,roughness:.48,metalness:n==="CartoonTank"?.35:.06}),m=new D({color:r,roughness:.35,metalness:.35}),f=new D({color:2042167,roughness:.72}),d=new he,g=n==="CartoonTank"?.26:.44;d.position.y=g,c.add(d);let p=new he,x,w,y,R,S;if(n==="CartoonTank"){for(let Ue of[-.36,.36]){let K=new M(new Z(.22,.26,.92),f);K.position.set(Ue,-.1,0),K.castShadow=!0,d.add(K);for(let pe of[-.3,0,.3]){let Q=new M(new _e(.11,.11,.25,12),m);Q.rotation.z=Math.PI/2,Q.position.set(Ue,-.12,pe),d.add(Q)}}let J=new M(new Z(.68,.3,.84),E);J.position.set(0,.14,0),J.castShadow=!0,d.add(J),x=new he,x.position.set(0,.42,-.02),d.add(x);let xe=new M(new Z(.56,.34,.56),E);xe.castShadow=!0,x.add(xe);let Ie=new M(new Z(.58,.07,.58),m);Ie.position.y=-.1,x.add(Ie),w=new M(new _e(.065,.08,.66,14),f),w.rotation.x=Math.PI/2,w.position.set(0,.04,.5),w.castShadow=!0,x.add(w),p.position.set(0,.1,0),x.add(p)}else if(n==="BrainrotLog"){let J=K=>{let pe=new he;pe.position.set(K*.14,-.05,0),d.add(pe);let Q=new M(new vt(.065,.28,6,8),E);Q.position.set(0,-.17,0),pe.add(Q);let re=new M(new fe(.1,10,8),m);return re.scale.set(.9,.5,1.5),re.position.set(0,-.34,.05),pe.add(re),pe};R=J(-1),S=J(1);let xe=new M(new _e(.21,.25,.96,18),E);xe.position.y=.44,xe.castShadow=!0,d.add(xe);let Ie=new M(new _e(.18,.18,.04,16),new D({color:16639626}));Ie.position.y=.93,d.add(Ie);let Ue=new M(new _e(.025,.04,.18,8),E);Ue.position.set(.06,1,0),Ue.rotation.z=-.35,d.add(Ue),p.position.set(0,.72,0),d.add(p)}else{let J=pe=>{let Q=new he;Q.position.set(pe*.13,-.05,0),d.add(Q);let re=new M(new vt(.055,.3,6,8),f);re.position.set(0,-.17,0),Q.add(re);let ce=new M(new fe(.095,10,8),m);return ce.scale.set(.95,.5,1.45),ce.position.set(0,-.34,.05),Q.add(ce),Q};R=J(-1),S=J(1);let xe=new M(new _e(.32,.22,.62,24),E);xe.position.y=.34,xe.castShadow=!0,d.add(xe);let Ie=new M(new qe(.315,.025,10,24),m);Ie.rotation.x=Math.PI/2,Ie.position.y=.65,d.add(Ie);let Ue=new M(new Ct(.295,24),new D({color:4137748,roughness:.2}));Ue.rotation.x=-Math.PI/2,Ue.position.y=.62,d.add(Ue);let K=new M(new qe(.14,.034,8,16,Math.PI),E);K.rotation.z=-Math.PI/2,K.position.set(-.3,.36,0),d.add(K),p.position.set(0,.42,0),d.add(p)}let _=Jh(p,n==="CartoonTank"?.26:.24,o,1120295,n==="CartoonTank"?.29:n==="CupDancer"?.28:.21,!0),T=n==="CupDancer"?new D({color:16777215,roughness:.4}):E,L=new vt(.048,.2,6,8),G=new vt(.042,.18,6,8),U=J=>{let xe=new he;xe.position.set(J*(n==="CartoonTank"?.33:.27),n==="CartoonTank"?.24:.45,0),d.add(xe);let Ie=new M(L,T);Ie.position.y=-.11,xe.add(Ie);let Ue=new he;Ue.position.y=-.22,xe.add(Ue);let K=new M(G,T);K.position.y=-.1,Ue.add(K);let pe=new M(new fe(.068,10,8),m);return pe.position.y=-.22,Ue.add(pe),{shoulder:xe,elbow:Ue,glove:pe}},k=U(-1),X=U(1),V=new he;V.position.set(0,-.25,.06);let te=new M(new _e(.11,.07,.08,14),new D({color:16317180,roughness:.35}));V.add(te);let F=new M(new fe(.075,10,8),new D({color:16707722,roughness:.45}));F.scale.set(1.1,.55,1.1),F.position.y=.035,V.add(F),V.visible=!1,X.elbow.add(V);let q=zl(X.elbow,k.elbow,d);if(n==="BrainrotLog"){y=new he,y.position.set(0,-.22,.04);let J=new M(new _e(.065,.025,.65,10),new D({color:14251782,roughness:.45}));J.position.y=-.28,J.castShadow=!0,y.add(J),X.elbow.add(y)}return l.rotation.y=t*.36,{root:l,bodyPivot:c,torsoGroup:d,headPivot:p,leftShoulder:k.shoulder,leftElbow:k.elbow,rightShoulder:X.shoulder,rightElbow:X.elbow,leftHip:R,rightHip:S,snackProp:V,handProps:q,headY:n==="CartoonTank"?.78:n==="CupDancer"?.86:1.16,leftEyelid:_.leftEye.eyelid,rightEyelid:_.rightEye.eyelid,leftBrow:_.leftEye.brow,rightBrow:_.rightEye.brow,leftSclera:_.leftEye.sclera,rightSclera:_.rightEye.sclera,leftPupil:_.leftEye.pupil,rightPupil:_.rightEye.pupil,mouthCavity:_.mouthCavity,upperLip:_.upperLip,lowerLip:_.lowerLip,auraRing:h,auraDisc:u,turretGroup:x,cannonBarrel:w,propPivot:y,mouthBaseY:_.mouthBaseY,baseTorsoY:g,restScale:1,topY:n==="CartoonTank"?1.05:n==="CupDancer"?1.14:1.54,role:n,name:e,facingSign:t,standing:!0,seedOffset:i}}function fa(n,e,t,i,s){let r=n.role,o=Sm(t,r),a=bm(r,n.robeHex,e),{isDivine:l}=a,c=new Ve(e);if(r==="BrainrotLog"||r==="CupDancer"||r==="CartoonTank")return Hm(r,n.name,i,s,a.robe,a.sash,a.skin,c);let h=new he,u=new he;h.add(u);let m=Xl(t),f=Nh(r,n.name,t,m),d=kh(f,a),g=d.robe,p=d.sash,x=d.skin,w=f?d.scale:r==="ChildDevotee"?.82:1;u.scale.setScalar(w);let y=new D({color:g,roughness:.58,metalness:.08}),R=new D({color:new Ve(g).multiplyScalar(.75),roughness:.65}),S=new D({color:p,roughness:.42,metalness:.25}),A=new D({color:x,roughness:.48,metalness:.02}),C=new D({color:16236088,metalness:.85,roughness:.22}),_=new M(new An(.46,.58,36),new Le({color:c,transparent:!0,opacity:m?0:.22,side:gt,depthWrite:!1}));_.rotation.x=-Math.PI/2,_.position.y=.012,_.visible=!m,h.add(_);let T=new M(new Ct(.45,32),new Le({color:c,transparent:!0,opacity:m?0:.08,side:gt,depthWrite:!1}));T.rotation.x=-Math.PI/2,T.position.y=.01,T.visible=!m,h.add(T);let L,G,U,k,X,V=.14,te=m?new D({color:i>0?1976635:3223169,roughness:.72}):R;if(o){V=.66;let ge=new M(new fe(.245,16,12),te);ge.scale.set(1.06,.65,.88),ge.position.set(0,V-.01,0),ge.castShadow=!0,u.add(ge);let de=new vt(.104,.2,6,10),Ke=new vt(.092,.18,6,10),Fe=new D({color:m?16317180:3875862,roughness:.45}),$e=ee=>{let le=new he;le.position.set(ee*.13,V-.04,0),u.add(le);let Pe=new M(de,te);Pe.position.set(0,-.15,0),Pe.castShadow=!0,Pe.receiveShadow=!0,le.add(Pe);let Ce=new he;Ce.position.set(0,-.3,0),le.add(Ce);let Ze=new M(Ke,te);Ze.position.set(0,-.14,0),Ze.castShadow=!0,Ze.receiveShadow=!0,Ce.add(Ze);let ht=new M(new fe(.105,12,8),Fe);return ht.scale.set(.95,.55,1.55),ht.position.set(0,-.265,.05),ht.castShadow=!0,Ce.add(ht),{hip:le,knee:Ce}},N=$e(-1),Te=$e(1);G=N.hip,k=N.knee,U=Te.hip,X=Te.knee}else{let ge=Am(c);L=ge.glowMesh,u.add(ge.group),V=.15;let de=new M(new fe(.36,20,12),R);de.scale.set(1.15,.45,.92),de.position.set(0,V+.06,.03),de.castShadow=!0,de.receiveShadow=!0,u.add(de)}let F=new he;F.position.y=V,u.add(F);let q=Rm(.28,.21,.27,.62),J=f==="narasimha"||f==="hanuman"||f==="shiv"||f==="vishnu"||f==="krishna"||f==="ram",xe=new M(q,J?A:y);if(xe.castShadow=!0,xe.receiveShadow=!0,F.add(xe),m){let ge=new M(new qe(.132,.026,8,20),S);ge.rotation.x=Math.PI/2+.2,ge.position.set(0,.58,.03),F.add(ge);let de=new M(new qe(.255,.022,8,22),new D({color:988970,roughness:.65}));de.rotation.x=Math.PI/2,de.position.y=.04,F.add(de)}else{if(t!=="PalaceCourt"){let Ke=new sn([new B(-.16,.55,.1),new B(-.02,.39,.21),new B(.18,.22,.14),new B(.14,.18,-.16)]),Fe=new M(new En(Ke,18,.024,8,!1),S);Fe.castShadow=!0,F.add(Fe)}let ge=new M(new qe(.22,.022,8,22),C);ge.rotation.x=Math.PI/2,ge.position.y=.24,F.add(ge);let de=new M(new qe(.142,.018,8,20),C);if(de.rotation.x=Math.PI/2+.25,de.position.set(0,.57,.04),F.add(de),o&&r==="NobleWoman"){let Ke=[new Ge(.18,.25),new Ge(.24,.08),new Ge(.36,-.18),new Ge(.45,-.44),new Ge(.42,-.46)],Fe=new ui(Ke,28),$e=new D({color:g,roughness:.45,metalness:.14,side:gt}),N=new M(Fe,$e);N.castShadow=!0,N.receiveShadow=!0,F.add(N);let Te=new M(new qe(.44,.024,8,32),C);Te.rotation.x=Math.PI/2,Te.position.y=-.44,F.add(Te)}else if(o&&r==="KingCrown"&&(!f||f==="genericSacred")&&(t==="PalaceCourt"||n.attire==="turban")){let Ke=[new Ge(.22,.24),new Ge(.27,.02),new Ge(.31,-.26),new Ge(.32,-.34)],Fe=new M(new ui(Ke,24),new D({color:g,roughness:.5,metalness:.12,side:gt}));Fe.castShadow=!0,F.add(Fe);for(let $e=0;$e<4;$e++){let N=new M(new fe(.022,8,8),C);N.position.set(0,.5-$e*.075,$e<2?.248:.225),F.add(N)}}}let Ie=n.name.toLowerCase();if(r==="SageRishi"&&(Ie.includes("narad")||Ie.includes("\u0928\u093E\u0930\u0926"))){let ge=new he,de=new D({color:9584654,roughness:.42}),Ke=new M(new _e(.025,.025,.85,10),de);Ke.rotation.z=-.68,ge.add(Ke);let Fe=new M(new fe(.11,14,10),de);Fe.position.set(-.26,-.32,.04),ge.add(Fe);let $e=new M(new fe(.08,12,10),de);$e.position.set(.24,.3,.04),ge.add($e),ge.position.set(0,.34,.28),F.add(ge)}else if(r==="Warrior"){let ge=new M(new _e(.22,.22,.04,20),C);ge.rotation.x=Math.PI/2,ge.position.set(-.34,.28,.08),F.add(ge);let de=new M(new _e(.016,.016,1.45,8),new D({color:7029795}));de.position.set(.36,.55,.02),F.add(de);let Ke=new M(new Qe(.04,.14,8),new D({color:14870768,metalness:.85}));Ke.position.set(.36,1.32,.02),F.add(Ke)}let Ue=new vt(.072,.21,6,10),K=new vt(.06,.19,6,10),pe=J||f==="asuraKing"?A:y,Q=ge=>{let de=new he;de.position.set(ge*.245,.52,0),F.add(de);let Ke=new M(new fe(.088,12,10),pe);Ke.castShadow=!0,de.add(Ke);let Fe=new M(Ue,pe);Fe.position.y=-.13,Fe.castShadow=!0,de.add(Fe);let $e=new he;$e.position.y=-.26,de.add($e);let N=new M(new fe(.062,10,8),pe);N.castShadow=!0,$e.add(N);let Te=new M(K,pe);Te.position.y=-.115,Te.castShadow=!0,$e.add(Te);let ee=new M(new fe(.066,12,10),A);return ee.scale.set(.95,1.15,.8),ee.position.y=-.24,ee.castShadow=!0,$e.add(ee),{shoulder:de,elbow:$e}},re=Q(-1),ce=Q(1),ne=Vh(u,F,G,U,re.elbow,ce.elbow,f,g,p,C,o),$=new he;$.position.set(0,-.25,.06);let Me=new M(new _e(.11,.07,.08,14),new D({color:16317180,roughness:.35}));$.add(Me);let ye=new M(new fe(.075,10,8),new D({color:16707722,roughness:.45}));ye.scale.set(1.1,.55,1.1),ye.position.y=.035,$.add(ye),$.visible=!1,ce.elbow.add($);let ve=zl(ce.elbow,re.elbow,F),b=r==="ComicBobble"?.345:r==="ChildDevotee"?.265:.245,me=new M(new _e(.075,.095,.14,14),A);me.position.y=.65,F.add(me);let oe=new he;oe.position.y=.68+b*.92,F.add(oe);let Ae,P=b*.08,se,be,I,v,O,j,Ee,ae,He;if(f==="narasimha"){let ge=Oh(oe,b,x);He=ge,ae=ge.lowerJawPivot}else{let ge=new M(new fe(b,26,20),A);ge.scale.set(.98,1.08,.95),ge.castShadow=!0,ge.receiveShadow=!0,oe.add(ge);let de=new M(new fe(b*.14,10,8),A);de.scale.set(.85,1.05,1.2),de.position.set(0,-b*.04,b*.94),oe.add(de);for(let N of[-1,1]){let Te=new M(new fe(b*.18,10,8),A);if(Te.scale.set(.5,1.2,.8),Te.position.set(N*b*.96,-b*.04,0),oe.add(Te),!m){let ee=new M(new qe(b*.1,b*.025,8,14),C);ee.rotation.y=Math.PI/2,ee.position.set(N*b*.98,-b*.2,.01),oe.add(ee)}}let Ke=N=>{let Te=new M(new fe(b*.19,10,8),new Le({color:15680580,transparent:!0,opacity:0,depthWrite:!1}));return Te.scale.set(1.2,.75,.35),Te.position.set(N*b*.56,-b*.16,b*.84),oe.add(Te),Te};if(se=m?Ke(-1):void 0,be=m?Ke(1):void 0,m){let N=new Le({color:3718648,transparent:!0,opacity:.92,depthWrite:!1}),Te=Ce=>{let Ze=new M(new fe(b*.056,8,8),N);return Ze.scale.set(.75,1.38,.46),Ze.position.set(Ce*b*.34,-b*.02,b*.93),Ze.visible=!1,oe.add(Ze),Ze};I=Te(-1),v=Te(1),O=new he;let ee=new M(new fe(b*.075,8,8),N);ee.scale.set(.85,1.05,.55);let le=new M(new Qe(b*.068,b*.14,8),N);le.position.y=b*.085,O.add(ee,le),O.position.set(b*.58,b*.42,b*.8),O.visible=!1,oe.add(O),j=new he;let Pe=new Le({color:15680580});for(let[Ce,Ze,ht]of[[.45,-b*.055,b*.045],[-.45,b*.055,b*.045],[-.45,-b*.055,-b*.045],[.45,b*.055,-b*.045]]){let Rt=new M(new Z(b*.11,b*.032,b*.03),Pe);Rt.rotation.z=Ce,Rt.position.set(Ze,ht,0),j.add(Rt)}j.position.set(-b*.46,b*.44,b*.86),j.visible=!1,oe.add(j)}if(m){Ae=new he,Ae.position.set(0,P,b*.97);let N=new D({color:988970,metalness:.45,roughness:.25}),Te=new Le({color:12248829,transparent:!0,opacity:.24}),ee=new M(new Z(b*1.18,b*.09,b*.05),N);ee.position.set(0,b*.16,.01),Ae.add(ee);for(let Pe of[-1,1]){let Ce=new M(new qe(b*.19,b*.028,8,18),N);Ce.position.set(Pe*b*.36,0,0),Ae.add(Ce);let Ze=new M(new Ct(b*.175,16),Te);Ze.position.set(Pe*b*.36,0,-.005),Ae.add(Ze);let ht=new M(new Z(b*.03,b*.035,b*.92),N);ht.position.set(Pe*b*.56,b*.11,-b*.44),Ae.add(ht)}let le=new M(new _e(b*.022,b*.022,b*.36,6),N);le.rotation.z=Math.PI/2,le.position.set(0,b*.02,0),Ae.add(le),Ae.visible=n.hasGlasses!==void 0&&n.hasGlasses!==null?!!n.hasGlasses:i>0,oe.add(Ae)}if(r==="NobleWoman"){let N=new M(new fe(b*.08,10,8),new D({color:14427686,roughness:.4}));N.scale.z=.4,N.position.set(0,b*.24,b*.96),oe.add(N)}else if(r==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(Ie)){let N=new D({color:16317180,emissive:14870768,emissiveIntensity:.45,roughness:.6});for(let le of[-.045,0,.045]){let Pe=new M(new Z(b*.36,b*.025,b*.04),N);Pe.position.set(0,b*(.28+le),b*.95),oe.add(Pe)}let Te=new M(new vt(b*.028,b*.09,4,8),new D({color:16096779,emissive:14427686,emissiveIntensity:.65}));Te.position.set(0,b*.42,b*.965),oe.add(Te);let ee=new M(new fe(b*.045,8,8),new D({color:14427686}));ee.position.set(0,b*.28,b*.975),oe.add(ee)}else if(f==="vishnu"||f==="krishna"||f==="ram"){let N=new D({color:16710888,emissive:16708551,emissiveIntensity:.25}),Te=new D({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let le of[-1,1]){let Pe=new M(new Z(b*.042,b*.28,b*.04),N);Pe.position.set(le*b*.072,b*.36,b*.955),Pe.rotation.z=-le*.09,oe.add(Pe)}let ee=new M(new vt(b*.022,b*.2,4,8),Te);ee.position.set(0,b*.36,b*.97),oe.add(ee)}else if(r!=="Warrior"&&!m&&f!=="asuraKing"){let N=new M(new vt(b*.036,b*.16,4,8),new D({color:r==="Divine"?16498468:15357964,emissive:8138002,emissiveIntensity:.2}));N.position.set(0,b*.28,b*.95),oe.add(N)}Ee=Cm(oe,r,n.name,t,b,g,n.attire),f==="asuraKing"&&zh(oe,F,b,C);let Fe=r==="SageRishi"?14277862:1840930,$e=r==="ComicBobble"||t==="DoorwaySet"||t==="SkyGauntlet";He=Jh(oe,b,x,Fe,b*.85,$e)}let Re,Be,rt=r==="NobleWoman"&&Zh.some(ge=>Ie.includes(ge));if(l||r==="SageRishi"||rt||f==="narasimha"){Re=new he,Re.position.set(0,.04,-b*(f==="narasimha"?.92:.72)),Be=new Le({color:l||f==="narasimha"?16769126:c,transparent:!0,opacity:l||f==="narasimha"?.65:.28,side:gt,depthWrite:!1});let ge=new M(new An(b*1.45,b*1.62,32),Be);Re.add(ge);for(let de=0;de<8;de++){let Ke=new M(new ft(b*.08,b*.45),Be),Fe=de/8*Math.PI*2;Ke.position.set(Math.cos(Fe)*b*1.54,Math.sin(Fe)*b*1.54,0),Ke.rotation.z=Fe+Math.PI/2,Re.add(Ke)}oe.add(Re)}h.rotation.y=i*.42;let Se=V+.68+b*.92,De=(o?Se:1.04)*w,ke=(o?Se+b*1.48:1.4)*w;return{root:h,bodyPivot:u,torsoGroup:F,headPivot:oe,leftShoulder:re.shoulder,leftElbow:re.elbow,rightShoulder:ce.shoulder,rightElbow:ce.elbow,leftHip:G,rightHip:U,leftKnee:k,rightKnee:X,snackProp:$,handProps:ve,headY:De,leftEyelid:He.leftEye.eyelid,rightEyelid:He.rightEye.eyelid,leftBrow:He.leftEye.brow,rightBrow:He.rightEye.brow,leftSclera:He.leftEye.sclera,rightSclera:He.rightEye.sclera,leftPupil:He.leftEye.pupil,rightPupil:He.rightEye.pupil,mouthCavity:He.mouthCavity,upperLip:He.upperLip,lowerLip:He.lowerLip,glassesGroup:Ae,glassesBaseY:P,hairFullGroup:Ee?.hairFullGroup,hairShavedGroup:Ee?.hairShavedGroup,leftCheekFlush:se,rightCheekFlush:be,leftTearBead:I,rightTearBead:v,sweatDropGroup:O,angerMarkGroup:j,haloGroup:Re,haloMaterial:Be,auraRing:_,auraDisc:T,pedestalGlow:L,chakraWheel:ne.chakraWheel,lowerJawPivot:ae,pattaEnds:ne.pattaEnds,isNarasimha:f==="narasimha",isAsuraKing:f==="asuraKing",isHolika:/holika|होलिका/i.test(n.name),mouthBaseY:He.mouthBaseY,baseTorsoY:o?.66:.15,restScale:w,topY:ke,role:r,name:n.name,facingSign:i,standing:o,hasFloorAura:!m,seedOffset:s}}function pa(n,e,t,i,s,r,o="none",a=.5,l=!1,c=null,h=!1,u=!1,E=null,m=0){let f=e+n.seedOffset,d=o||"none",g=n.role==="BrainrotLog"||n.role==="CupDancer"||n.role==="CartoonTank"||n.role==="ComicBobble";if(n.snackProp&&(n.snackProp.visible=d==="eating"&&(!c||c==="none")),Fh(n.handProps,c,d,f,t,u),n.hairFullGroup&&n.hairShavedGroup&&(n.hairFullGroup.visible=m<2,n.hairShavedGroup.visible=m>=2,m===1?(n.hairFullGroup.scale.set(.96,.95,.96),n.hairFullGroup.position.set(.015,.01,0),n.hairFullGroup.rotation.z=.22):(n.hairFullGroup.scale.setScalar(1),n.hairFullGroup.position.set(0,0,0),n.hairFullGroup.rotation.z=0)),n.glassesGroup){let P=(E??"normal").trim().toLowerCase();if(P==="none")n.glassesGroup.visible=!1;else{n.glassesGroup.visible=!0;let se=n.glassesBaseY??.028,be=0,I=0,v=se;if(P==="ulta")be=Math.PI,v=se-.012;else if(P==="flipping"){let O=Math.max(0,Math.min(1,(a-.35)/.25)),j=O*O*(3-2*O);be=Math.PI*(1-j),v=se-.012*(1-j)+Math.sin(j*Math.PI)*.04}else P==="crooked"?(be=.28+Math.sin(f*9)*.04,v=se-.01):P==="forehead"&&(I=-.35,v=se+.105);n.glassesGroup.rotation.z=be,n.glassesGroup.rotation.x=I,n.glassesGroup.position.y=v}}if(n.leftCheekFlush&&n.rightCheekFlush){let P=s==="angry"||d==="corpseSnapUp",se=s==="scared"||d==="brakeStop"||d==="lapSubdued",be=P?.78:s==="laughing"||d==="celebrate"?.44:s==="surprised"||d==="shockedFall"||se?.3:s==="proud"||s==="happy"||s==="smug"?.22:0,I=P?14427686:s==="laughing"||d==="celebrate"||s==="proud"?16478597:se?6333946:16281969;[n.leftCheekFlush,n.rightCheekFlush].forEach(v=>{let O=v.material;O.opacity=be,O.color.setHex(I)})}let p=n.role==="ComicBobble"?.345:n.role==="ChildDevotee"?.265:.245;if(n.leftTearBead&&n.rightTearBead){let P=s==="sad";if(n.leftTearBead.visible=P,n.rightTearBead.visible=P,P){let se=f*1.65%1,be=(f*1.65+.42)%1;n.leftTearBead.position.y=-p*(.02+se*.24),n.rightTearBead.position.y=-p*(.02+be*.24),n.leftTearBead.scale.setScalar(.65+Math.sin(se*Math.PI)*.65),n.rightTearBead.scale.setScalar(.65+Math.sin(be*Math.PI)*.65)}}if(n.sweatDropGroup){let P=s==="scared"||d==="brakeStop"||d==="lapSubdued";if(n.sweatDropGroup.visible=P,P){let se=f*2.15%1;n.sweatDropGroup.position.y=p*(.44-se*.16),n.sweatDropGroup.scale.setScalar(.82+Math.sin(se*Math.PI)*.42)}}if(n.angerMarkGroup){let P=s==="angry"||d==="corpseSnapUp";if(n.angerMarkGroup.visible=P,P){let se=.86+.34*Math.abs(Math.sin(f*11.5));n.angerMarkGroup.scale.setScalar(se)}}let x=0,w=0,y=0,R=0,S=0,A=0,C=0,_=0,T=0,L=0,G=0,U=0,k=0,X=Math.sin(f*2.1)*(t?.018:.008);n.torsoGroup.position.y=n.baseTorsoY+X;let V=n.hasFloorAura!==!1;if(d==="sleeping"||d==="lyingShroud")x=-Math.PI*.48,S=d==="lyingShroud"?.14:n.standing?.06:.16,_=d==="lyingShroud"?.04:.14,T=d==="lyingShroud"?.04:.08,U=d==="lyingShroud"?.06:.28,k=d==="lyingShroud"?.06:.16,n.auraRing.visible=!1,n.auraDisc.visible=!1;else if(n.auraRing.visible=V,n.auraDisc.visible=V,d==="corpseSnapUp"){let P=Math.max(0,Math.min(1,a/.24)),se=1-Math.pow(1-P,3);x=-Math.PI*.48*(1-se)+.08*Math.sin(P*Math.PI),S=.14*(1-se)+Math.sin(P*Math.PI)*.18,A=.1*se}else if(d==="wakingUp"){let P=Math.max(0,Math.min(1,(a-.04)/.36)),se=1-Math.pow(1-P,3);x=-Math.PI*.48*(1-se)-.1*Math.sin(P*Math.PI),S=(n.standing?.06:.16)*(1-se)+Math.sin(P*Math.PI)*.12,A=-.14*Math.sin(P*Math.PI)}else if(d==="sitting"||h)S=n.standing?-.26:0,_=-Math.PI*.46,T=-Math.PI*.46,U=Math.PI*.46,k=Math.PI*.46,A=t?Math.sin(f*3.8)*.08:-.05;else if(d==="walking"||d==="running"){let P=d==="running"?14:7.5,se=Math.sin(e*P),be=d==="running"?.85:.52,I=d==="running"?1.05:.55;_=se*be,T=-se*be,U=Math.max(0,-se)*I,k=Math.max(0,se)*I,S=Math.abs(Math.cos(e*P))*(d==="running"?.095:.045),A=d==="running"?.24:.1,C=se*.06}else if(d==="praying")A=.16+Math.sin(f*2.2)*.035,S=0;else if(d==="shockedFall"){let P=Math.max(0,Math.min(1,a/.35));x=.18*Math.sin(P*Math.PI*.7),w=n.facingSign*-.05*P,S=P<.35?Math.sin(P/.35*Math.PI)*.12:-.04*P,_=-.18*P,T=.14*P,U=.24*P}else if(d==="jumping"||d==="dancing"||d==="adaab"||d==="sufiSpin")if(d==="jumping"){let P=Math.abs(Math.sin(f*6.2));S=P*.22,_=-P*.35,T=-P*.35,U=P*.55,k=P*.55}else{let se=Yh(f,g?"viralBounce":"sufiKathak",d,n.facingSign<0,0);S=se.liftY,w=se.bodyRotZ,A=se.torsoRotX,C=se.torsoRotZ,_=se.leftHipX,T=se.rightHipX,U=se.leftKneeX,k=se.rightKneeX,n.bodyPivot.rotation.y+=(se.bodyRotY-n.bodyPivot.rotation.y)*(l?1:.35)}else if(d==="punching"){let{extend:P}=Jn(e,"punching");A=.1+P*.2,w=n.facingSign*-.05*P,S=-.03+P*.02,_=-.22,T=.16,U=.3,k=.22}else if(d==="kicking"){let{extend:P}=Jn(e,"kicking");T=-1.25*P,k=1.1*(1-P)*Math.min(1,P*3),U=.18,A=-.16*P,S=.02*P}else if(d==="hitReact"){let{recoil:P}=Jn(e,"punching");x=-.24*P,A=-.2*P,w=n.facingSign*.1*P+Math.sin(f*11)*.03,S=-.02*P,U=.22*P,k=.18*P}else if(d==="lapSubdue")S=-.22,_=-1.36,T=-1.36,L=-.44,G=.44,U=1.42,k=1.42,A=.14+Math.sin(f*7.5)*.03;else if(d==="lapSubdued"){let P=Math.sin(f*9)*.04;w=Math.PI*.48+P*.45,x=-.26,y=.92,R=.25,S=.7+Math.sin(f*11)*.015,_=.25+P*2.2,T=-.15-P*2.2,U=.85,k=1.05,A=-.1}else if(d==="pillarBurst")S=.02,_=-.28,T=.22,L=-.18,G=.18,U=.36,k=.18,A=-.06;else if(d==="clubStrike"){let P=Math.sin(a*Math.PI);S=-.04*P,_=-.24*P,T=.2*P,U=.28*P,A=.24*P}else if(d==="cliffRescue")n.role==="ChildDevotee"?(S=.32+Math.sin(f*3.4)*.08,A=.06):A=.14;else if(d==="fireTrial")(n.role==="ChildDevotee"||n.isHolika)&&(S=n.standing?-.24:0,_=-Math.PI*.46,T=-Math.PI*.46,U=Math.PI*.46,k=Math.PI*.46,A=n.isHolika&&s!=="proud"?-.18+Math.sin(f*16)*.06:.08);else if(d==="blessing")S=t?Math.abs(Math.sin(f*4.5))*.02:0,A=.04;else if(d==="brakeStop"){let P=a<.34?Math.sin(a/.34*Math.PI):0;A=a<.34?.26*P:-.14*Math.exp(-(a-.34)*3.5),C=Math.sin(f*26)*.045,R=a<.34?.12*P:-.14,S=-.05,U=.34,k=.24}else d==="celebrate"?(S=Math.abs(Math.sin(f*8.4))*.16,A=-.09,C=Math.sin(f*4.2)*.07):d==="pointing"||d==="hazardWire"||d==="hazardTruck"||d==="hazardTank"||d==="hazardPit"||d==="hazardSnake"||d==="hazardFood"||d==="hazardPhone"?d==="hazardPit"?(S=Math.abs(Math.sin(f*5.6))*.16,A=.12):d==="hazardWire"?(A=.08,C=Math.sin(f*26)*.06,S=t?Math.abs(Math.sin(f*8.5))*.04:0):(A=.1+Math.sin(f*5.8)*.04,S=t?Math.abs(Math.sin(f*7.5))*.038:0):s==="scared"?(S=n.standing?-.04:0,A=.07,C=Math.sin(f*28)*.045):s==="smug"?(A=-.06,C=n.facingSign*.07,S=t?Math.abs(Math.sin(f*6))*.03:0):s==="proud"?(A=-.09,S=t?Math.abs(Math.sin(f*7.2))*.045:.02):S=t&&n.standing?Math.abs(Math.sin(f*(g?9.2:7.2)))*(g?.055:.035):0;let F=l?1:d==="punching"||d==="kicking"||d==="hitReact"||d==="lapSubdue"||d==="lapSubdued"||d==="pillarBurst"||d==="corpseSnapUp"?.68:d==="wakingUp"||d==="shockedFall"||d==="walking"||d==="running"?.45:.28;if(n.bodyPivot.rotation.x+=(x-n.bodyPivot.rotation.x)*F,n.bodyPivot.rotation.z+=(w-n.bodyPivot.rotation.z)*F,n.bodyPivot.position.x+=(y-n.bodyPivot.position.x)*F,n.bodyPivot.position.z+=(R-n.bodyPivot.position.z)*F,n.bodyPivot.position.y+=(S-n.bodyPivot.position.y)*F,n.torsoGroup.rotation.x+=(A-n.torsoGroup.rotation.x)*F,n.torsoGroup.rotation.z+=(C-n.torsoGroup.rotation.z)*F,n.leftHip&&(n.leftHip.rotation.x+=(_-n.leftHip.rotation.x)*F,n.leftHip.rotation.z+=(L-n.leftHip.rotation.z)*F),n.rightHip&&(n.rightHip.rotation.x+=(T-n.rightHip.rotation.x)*F,n.rightHip.rotation.z+=(G-n.rightHip.rotation.z)*F),n.leftKnee&&(n.leftKnee.rotation.x+=(U-n.leftKnee.rotation.x)*F),n.rightKnee&&(n.rightKnee.rotation.x+=(k-n.rightKnee.rotation.x)*F),d!=="dancing"&&d!=="adaab"&&d!=="sufiSpin"&&(n.bodyPivot.rotation.y+=(0-n.bodyPivot.rotation.y)*F),d==="sleeping"){let P=1+Math.sin(f*2.2)*.025;n.bodyPivot.scale.set(n.restScale,n.restScale*P,n.restScale)}else if(d==="fireTrial"&&n.isHolika&&s!=="proud"){let P=Math.max(.28,1-Math.max(0,a-.25)*.85);n.bodyPivot.scale.setScalar(n.restScale*P)}else if(g&&t){let P=1+Math.max(0,S)*.85,se=1-Math.max(0,S)*.35;n.bodyPivot.scale.set(n.restScale*se,n.restScale*P,n.restScale*se)}else n.bodyPivot.scale.setScalar(n.restScale);let q=d==="fireTrial"&&(n.role==="ChildDevotee"||n.isHolika),J=d==="corpseSnapUp"&&a<.24;if(n.standing&&d!=="sleeping"&&d!=="lyingShroud"&&!J&&d!=="wakingUp"&&d!=="sitting"&&d!=="lapSubdued"&&!h&&!q&&Pm(n,Math.max(0,S)),n.turretGroup&&(n.turretGroup.rotation.y=t?Math.sin(f*2.4)*.18:n.facingSign*-.15,n.turretGroup.rotation.x=d==="sleeping"?.28:0),n.cannonBarrel){let P=t&&(s==="angry"||s==="proud")?Math.max(0,Math.sin(f*10.5))*.14:0;n.cannonBarrel.position.z=.5-P}n.propPivot&&(n.propPivot.rotation.x=t?Math.sin(f*8.5)*.65:Math.sin(f*2)*.12);let xe=s==="surprised"||s==="scared"||d==="brakeStop"||d==="shockedFall"||d==="hitReact"||d==="corpseSnapUp"||d==="wakingUp"&&a>.25,Ie=s==="scared"||d==="brakeStop"?1.44:xe?1.4:s==="angry"||d==="punching"||d==="kicking"?1.24:1;n.leftSclera.scale.set(Ie,Ie*1.08,.5),n.rightSclera.scale.set(Ie,Ie*1.08,.5);let Ue=s==="confused"||s==="scared"||d==="slapForehead"?Math.sin(f*(s==="scared"?16:9))*.02:s==="smug"?n.facingSign*.012:0,K=s==="scared"||d==="brakeStop"?.58:xe?.86:s==="angry"?.88:s==="smug"?.94:1;if(n.leftPupil.scale.set(K,K,.92),n.rightPupil.scale.set(K,K,.92),n.leftPupil.rotation.y=Ue*8,n.rightPupil.rotation.y=-Ue*8,d==="sleeping")n.headPivot.rotation.set(.18,n.facingSign*.28,.24);else if(d==="lyingShroud"){let P=s==="angry"?Math.sin(f*8)*.08:0;n.headPivot.rotation.set(.14,.52+P,Math.sin(f*1.2)*.04)}else if(d==="corpseSnapUp")n.headPivot.rotation.set(.12+Math.sin(f*20)*.04,0,Math.sin(f*24)*.05);else if(d==="brakeStop")n.headPivot.rotation.set(-.22+Math.sin(f*24)*.05,n.facingSign*-.14,Math.sin(f*30)*.06);else if(d==="celebrate")n.headPivot.rotation.set(-.1+Math.sin(f*8.4)*.09,n.facingSign*-.06,Math.sin(f*4.2)*.09);else if(d==="lookInMirror"){let P=Math.sin(a*Math.PI*1.4);n.headPivot.rotation.set(.06,-n.facingSign*(.68+P*.28),P*.08)}else if(d==="eating")n.headPivot.rotation.set(.14+Math.sin(f*5.4)*.12,0,Math.sin(f*2.7)*.08);else if(d==="slapForehead")n.headPivot.rotation.set(.18,n.facingSign*-.1,-.22+Math.sin(f*6.5)*.06);else if(d==="lapSubdue"||d==="pillarBurst"){let P=Math.sin(f*10.5)*.05;n.headPivot.rotation.set(d==="lapSubdue"?.24+P:-.1+P,0,Math.sin(f*7.2)*.04)}else if(d==="lapSubdued"){let P=Math.sin(f*13)*.14;n.headPivot.rotation.set(-.22+P,-.35+P*.5,.12)}else if(d==="hitReact"){let{recoil:P}=Jn(e,"punching");n.headPivot.rotation.set(-.3*P,n.facingSign*.35*P,n.facingSign*.18*P)}else if(d==="punching"||d==="kicking")n.headPivot.rotation.set(.1,n.facingSign*-.12,0);else if(s==="laughing")n.headPivot.rotation.set(-.18+Math.abs(Math.sin(f*13.5))*.16,n.facingSign*-.06,Math.sin(f*6.8)*.11);else if(s==="angry")n.headPivot.rotation.set(.14+Math.sin(f*22)*.04,n.facingSign*-.14,Math.sin(f*28)*.05);else if(s==="scared")n.headPivot.rotation.set(-.08+Math.sin(f*20)*.04,n.facingSign*-.18+Math.sin(f*14)*.06,Math.sin(f*26)*.05);else if(s==="smug")n.headPivot.rotation.set(-.08+(t?Math.sin(f*4.5)*.04:0),n.facingSign*-.08,n.facingSign*.13);else if(s==="proud")n.headPivot.rotation.set(-.07+(t?Math.sin(f*5)*.06:0),n.facingSign*(t?-.1:.06),0);else{let P=t?Math.sin(f*5.2)*.085:Math.sin(f*1.4)*.025,se=s==="confused"?.16:t?Math.sin(f*2.6)*.065:0;n.headPivot.rotation.x=P,n.headPivot.rotation.z=se,n.headPivot.rotation.y=d==="walking"||d==="running"?Math.sin(f*3)*.08:n.facingSign*(t?-.14:.1)}let Q=f*.28%1>.955,re=-Math.PI*.48;d==="sleeping"||d==="praying"?re=.26:d==="lyingShroud"?re=s==="angry"?-.18:.28:d==="corpseSnapUp"?re=-Math.PI*.66:d==="wakingUp"&&a<.2?re=.24:d==="lapSubdue"||d==="pillarBurst"?re=-Math.PI*.64:Q?re=.15:s==="laughing"?re=.12:s==="sad"?re=-Math.PI*.28:s==="smug"?re=-.1:s==="scared"||d==="brakeStop"?re=-Math.PI*.68:(xe||s==="angry")&&(re=-Math.PI*.64),n.leftEyelid.rotation.x=s==="smug"?-.06:re,n.rightEyelid.rotation.x=s==="smug"?-.16:re;let ce=.085,ne=t?.014:0,$=ne,Me=0,ye=0;s==="angry"||d==="corpseSnapUp"?(ne=$=-.032,Me=ye=.62):s==="scared"||d==="brakeStop"?(ne=$=.062,Me=ye=-.34):xe?(ne=$=.054,Me=ye=-.1):s==="smug"?(ne=.052,$=-.012,Me=-.2,ye=.26):s==="sad"||d==="slapForehead"?(ne=$=.012,Me=ye=-.34):(s==="laughing"||s==="happy"||s==="proud")&&(ne=$=.042,Me=ye=-.08),n.leftBrow.position.y=ce+ne,n.rightBrow.position.y=ce+$,n.leftBrow.rotation.z=Math.PI/2-Me,n.rightBrow.rotation.z=Math.PI/2+ye;let ve=t&&i>.028,b=ve?Math.min(1,i*1.5):0,me=.5+.5*Math.sin(e*24+n.seedOffset),oe=ve?.16+b*(.7+.3*me):.02;d==="sleeping"&&!ve?oe=.04+.14*Math.max(0,Math.sin(f*2.1)):d==="eating"&&!ve?oe=.08+.32*Math.max(0,Math.sin(f*5.2)):d==="corpseSnapUp"||s==="angry"&&t?oe=Math.max(oe,d==="corpseSnapUp"?.88:.52):xe&&!t&&a<.78||s==="scared"&&!t||d==="brakeStop"?oe=Math.max(oe,s==="scared"?.42+.08*Math.sin(f*22):.84):s==="laughing"||d==="celebrate"?oe=Math.max(oe,.44+.18*Math.abs(Math.sin(f*11))):s==="proud"&&!t?oe=Math.max(oe,.22):s==="smug"&&!t?oe=.08:s==="sad"&&t&&(oe=Math.max(oe,.12));let Ae=ve?.9+.36*(1-me):s==="happy"||s==="laughing"||s==="proud"||d==="celebrate"?1.44:s==="smug"?1.24:s==="scared"||d==="brakeStop"?.74:s==="angry"||d==="corpseSnapUp"?1.22:.96;if(n.mouthCavity.scale.set(1.16*Ae,oe*1.22,.58),n.mouthCavity.rotation.z=s==="smug"?n.facingSign*.1:0,n.upperLip.position.y=n.mouthBaseY+oe*.028,n.lowerLip.position.y=n.mouthBaseY-oe*.056,d==="sleeping")n.leftShoulder.rotation.set(-.2,0,.25),n.leftElbow.rotation.set(-.6,0,-.35),n.rightShoulder.rotation.set(-.2,0,-.25),n.rightElbow.rotation.set(-.6,0,.35);else if(d==="lyingShroud")n.leftShoulder.rotation.set(-.52,.24,.34),n.leftElbow.rotation.set(-.88,0,-.26),n.rightShoulder.rotation.set(-.52,-.24,-.34),n.rightElbow.rotation.set(-.88,0,.26);else if(d==="corpseSnapUp"){let P=Math.sin(f*16)*.26;n.leftShoulder.rotation.set(-1.45+P,.22,.55),n.leftElbow.rotation.set(-.62,0,-.12),n.rightShoulder.rotation.set(-1.45-P,-.22,-.55),n.rightElbow.rotation.set(-.62,0,.12)}else if(d==="wakingUp"||d==="shockedFall"){let P=Math.sin(f*14)*.22;n.leftShoulder.rotation.set(-1.38+P,.25,.62),n.leftElbow.rotation.set(-.55,0,0),n.rightShoulder.rotation.set(-1.38-P,-.25,-.62),n.rightElbow.rotation.set(-.55,0,0)}else if(d==="praying"||r&&!n.standing)n.leftShoulder.rotation.set(-.95,.25,-.42),n.leftElbow.rotation.set(-1.35,0,-.5),n.rightShoulder.rotation.set(-.95,-.25,.42),n.rightElbow.rotation.set(-1.35,0,.5);else if(d==="slapForehead")n.rightShoulder.rotation.set(-1.85,-.35,.32),n.rightElbow.rotation.set(-1.45,0,.45),n.leftShoulder.rotation.set(-.25,.2,.42),n.leftElbow.rotation.set(-.9,0,-.55);else if(d==="eating"){let P=.5+.5*Math.sin(f*5.2);n.rightShoulder.rotation.set(-.55-P*.78,-.22,.22),n.rightElbow.rotation.set(-.85-P*.72,0,.24),n.leftShoulder.rotation.set(-.32,.15,.22),n.leftElbow.rotation.set(-.85,0,-.2)}else if(d==="walking"||d==="running"){let se=Math.sin(e*(d==="running"?14:7.5))*(d==="running"?.95:.55);n.leftShoulder.rotation.set(-se,.1,.16),n.leftElbow.rotation.set(d==="running"?-1.45:-.45,0,0),n.rightShoulder.rotation.set(se,-.1,-.16),n.rightElbow.rotation.set(d==="running"?-1.45:-.45,0,0)}else if(d==="pointing"){let P=Math.sin(f*8.5)*.14;n.rightShoulder.rotation.set(-1.42+P,-.15*n.facingSign,-.22),n.rightElbow.rotation.set(-.22,0,0),n.leftShoulder.rotation.set(-.25,.18,.42),n.leftElbow.rotation.set(-.95,0,-.48)}else if(d==="punching"){let P=Math.floor(e*Ol.punching.rate),{extend:se}=Jn(e,"punching"),be=P%2===0,I=be?n.rightShoulder:n.leftShoulder,v=be?n.rightElbow:n.leftElbow,O=be?n.leftShoulder:n.rightShoulder,j=be?n.leftElbow:n.rightElbow,Ee=be?-1:1;I.rotation.set(-.9-se*.68,Ee*.18*(1-se),Ee*-.12),v.rotation.set(-1.55*(1-se)-.08,0,0),O.rotation.set(-1.05,-Ee*.3,-Ee*.3),j.rotation.set(-1.75,0,-Ee*.25)}else if(d==="kicking")n.leftShoulder.rotation.set(-1,.3,.38),n.leftElbow.rotation.set(-1.7,0,.25),n.rightShoulder.rotation.set(-.95,-.3,-.38),n.rightElbow.rotation.set(-1.7,0,-.25);else if(d==="hitReact"){let{recoil:P}=Jn(e,"punching"),se=Math.sin(f*15)*.18*P;n.leftShoulder.rotation.set(-.55-P*.75+se,.25,.55+P*.35),n.leftElbow.rotation.set(-.5,0,0),n.rightShoulder.rotation.set(-.55-P*.75-se,-.25,-.55-P*.35),n.rightElbow.rotation.set(-.5,0,0)}else if(d==="cutting"||c==="scissors"){let P=Math.sin(f*8)*.11;n.rightShoulder.rotation.set(-2.06+P,.1,.14),n.rightElbow.rotation.set(-.24+Math.cos(f*16)*.08,0,-.06),n.leftShoulder.rotation.set(-1.76,.18,.18),n.leftElbow.rotation.set(-.42+Math.sin(f*4.8)*.1,0,-.1)}else if(d==="combing"||c==="comb"){let P=Math.sin(f*6.5)*.24;n.rightShoulder.rotation.set(-1.82+P,.12,.18),n.rightElbow.rotation.set(-.48-P*.35,0,-.08),n.leftShoulder.rotation.set(-.4,.12,.2),n.leftElbow.rotation.set(-.85,0,-.2)}else if(d==="removingTowel"){let P=Math.sin(Math.min(1,a*1.35)*Math.PI*.82);n.leftShoulder.rotation.set(-.62-P*.22,.25,.55),n.leftElbow.rotation.set(-.72,0,-.22),n.rightShoulder.rotation.set(-.92-P*.26,-.36,-.68-P*.34),n.rightElbow.rotation.set(-.56,0,.24)}else if(d==="adjustingGlasses"){let P=Math.sin(a*Math.PI);n.rightShoulder.rotation.set(-1.72-P*.25,.18,.38),n.rightElbow.rotation.set(-1.42,0,.28),n.leftShoulder.rotation.set(-.42,.14,.22),n.leftElbow.rotation.set(-.9,0,-.22)}else if(d==="spraying"||c==="sprayBottle"){let P=Math.sin(f*14)*.12;n.rightShoulder.rotation.set(-1.58+P,.14,.18),n.rightElbow.rotation.set(-.46,0,-.1),n.leftShoulder.rotation.set(-.85,.18,.25),n.leftElbow.rotation.set(-.85,0,-.15)}else if(d==="lookInMirror"){let P=Math.sin(f*6)*.12;n.leftShoulder.rotation.set(-1.78+P,.25,.28),n.leftElbow.rotation.set(-1.55,0,-.2),n.rightShoulder.rotation.set(-1.78-P,-.25,-.28),n.rightElbow.rotation.set(-1.55,0,.2)}else if(d==="callingPhone"||c==="phone")n.rightShoulder.rotation.set(-1.08,-.22,.25),n.rightElbow.rotation.set(-1.95,0,.25),n.leftShoulder.rotation.set(-.38,.14,.2),n.leftElbow.rotation.set(-.88,0,-.22);else if(d==="showingKey"||c==="key"){let P=Math.sin(f*6.5)*.18;n.rightShoulder.rotation.set(-1.28,-.15,-.18+P),n.rightElbow.rotation.set(-.42,0,0),n.leftShoulder.rotation.set(-.32,.12,.2),n.leftElbow.rotation.set(-.85,0,-.22)}else if(d==="bangingGavel"||c==="gavel"){let P=Math.pow(Math.max(0,Math.sin(f*7.2)),3);n.rightShoulder.rotation.set(-.65-P*.85,-.15,-.18),n.rightElbow.rotation.set(-.85+P*.45,0,0),n.leftShoulder.rotation.set(-.35,.14,.22),n.leftElbow.rotation.set(-.85,0,-.22)}else if(d==="holdingMic"||c==="mic"){let P=t?Math.sin(f*5.2)*.08:0;n.rightShoulder.rotation.set(-.92+P,-.25,.28),n.rightElbow.rotation.set(-1.62,0,.22),n.leftShoulder.rotation.set(-.42,.18,.22),n.leftElbow.rotation.set(-.9,0,-.22)}else if(d==="examining"||c==="stethoscope"||c==="syringe"){let P=Math.sin(f*4.5)*.16;n.rightShoulder.rotation.set(-1.18+P,-.16,-.22),n.rightElbow.rotation.set(-.55-P*.4,0,0),n.leftShoulder.rotation.set(-.38,.15,.2),n.leftElbow.rotation.set(-.88,0,-.2)}else if(d==="stirring"||c==="ladle"){let P=Math.sin(f*7)*.26,se=Math.cos(f*7)*.18;n.rightShoulder.rotation.set(-.95+se,-.18+P,-.24),n.rightElbow.rotation.set(-.78-se*.5,0,P*.5),n.leftShoulder.rotation.set(-.35,.15,.24),n.leftElbow.rotation.set(-.88,0,-.2)}else if(d==="sipping"||c==="teacup"){let P=.5+.5*Math.sin(f*3.8);n.rightShoulder.rotation.set(-.68-P*.52,-.18,.22),n.rightElbow.rotation.set(-1.05-P*.65,0,.18),n.leftShoulder.rotation.set(-.34,.12,.2),n.leftElbow.rotation.set(-.85,0,-.22)}else if(d==="aarti"||c==="diya"){let P=Math.cos(f*3.6)*.26,se=Math.sin(f*3.6)*.28;n.rightShoulder.rotation.set(-1.15+se,-.15,-.18+P),n.rightElbow.rotation.set(-.65,0,0),n.leftShoulder.rotation.set(-.52,.2,.3),n.leftElbow.rotation.set(-1.1,0,-.35)}else if(d==="playingFlute"||c==="flute")n.rightShoulder.rotation.set(-1.15,-.28,.35),n.rightElbow.rotation.set(-1.75,0,.28),n.leftShoulder.rotation.set(-1.08,.28,-.15),n.leftElbow.rotation.set(-1.65,0,.22);else if(d==="sweeping"||c==="broom"){let P=Math.sin(f*6)*.38;n.rightShoulder.rotation.set(-.65,-.15,-.22+P),n.rightElbow.rotation.set(-.8,0,P*.4),n.leftShoulder.rotation.set(-.55,.15,.22+P*.5),n.leftElbow.rotation.set(-.85,0,0)}else if(d==="lapSubdue"){let P=Math.sin(f*7.5)*.08;n.leftShoulder.rotation.set(-1.12+P,.12,.1),n.leftElbow.rotation.set(-.75,0,-.14),n.rightShoulder.rotation.set(-1.12-P,-.12,-.1),n.rightElbow.rotation.set(-.75,0,.14)}else if(d==="lapSubdued"){let P=Math.sin(f*14.5)*.28;n.leftShoulder.rotation.set(-1.45+P,.25,.65),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.45-P,-.25,-.65),n.rightElbow.rotation.set(-.65,0,0)}else if(d==="pillarBurst"){let P=Math.sin(f*5.5)*.1;n.leftShoulder.rotation.set(-.85,.22,.92+P),n.leftElbow.rotation.set(-.55,0,-.18),n.rightShoulder.rotation.set(-.85,-.22,-.92-P),n.rightElbow.rotation.set(-.55,0,.18)}else if(d==="clubStrike"){let P=Math.sin(Math.min(1,a*1.45)*Math.PI);n.rightShoulder.rotation.set(-2.15+P*1.55,-.14,-.22),n.rightElbow.rotation.set(-.35,0,0),n.leftShoulder.rotation.set(-.65,.2,.35),n.leftElbow.rotation.set(-.85,0,-.22)}else if(d==="fireTrial"||d==="serpentAttack"||d==="elephantCharge"||d==="cliffRescue")if(n.isHolika&&s!=="proud"){let P=Math.sin(f*15)*.26;n.leftShoulder.rotation.set(-1.55+P,.22,.52),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.55-P,-.22,-.52),n.rightElbow.rotation.set(-.65,0,0)}else if(n.role==="ChildDevotee")n.leftShoulder.rotation.set(-.95,.25,-.42),n.leftElbow.rotation.set(-1.35,0,-.5),n.rightShoulder.rotation.set(-.95,-.25,.42),n.rightElbow.rotation.set(-1.35,0,.5);else{let P=Math.sin(f*7.5)*.14;n.rightShoulder.rotation.set(-1.38+P,-.15*n.facingSign,-.22),n.rightElbow.rotation.set(-.22,0,0),n.leftShoulder.rotation.set(-.28,.18,.38),n.leftElbow.rotation.set(-.9,0,-.45)}else if(d==="blessing")n.rightShoulder.rotation.set(-1.35,-.14,-.16),n.rightElbow.rotation.set(-1.05,0,.14),n.leftShoulder.rotation.set(-.32,.12,.18),n.leftElbow.rotation.set(-.85,0,-.2);else if(d==="dancing"||d==="adaab"||d==="sufiSpin"){let se=Yh(f,g?"viralBounce":"sufiKathak",d,n.facingSign<0,0);n.leftShoulder.rotation.set(se.leftShoulder[0],se.leftShoulder[1],se.leftShoulder[2]),n.leftElbow.rotation.set(se.leftElbow[0],se.leftElbow[1],se.leftElbow[2]),n.rightShoulder.rotation.set(se.rightShoulder[0],se.rightShoulder[1],se.rightShoulder[2]),n.rightElbow.rotation.set(se.rightElbow[0],se.rightElbow[1],se.rightElbow[2]),n.torsoGroup.rotation.y+=(se.torsoRotY-n.torsoGroup.rotation.y)*.35,n.headPivot.rotation.z+=(se.headRotZ-n.headPivot.rotation.z)*.35}else if(d==="celebrate"){let P=Math.sin(f*9)*.3;n.leftShoulder.rotation.set(-2.42+P,.18,.3),n.leftElbow.rotation.set(-.38,0,-.1),n.rightShoulder.rotation.set(-2.42-P,-.18,-.3),n.rightElbow.rotation.set(-.38,0,.1)}else if(d==="brakeStop"){let P=Math.sin(f*22)*.07;n.leftShoulder.rotation.set(-1.32+P,.18,.26),n.leftElbow.rotation.set(-.26,0,-.12),n.rightShoulder.rotation.set(-1.32-P,-.18,-.26),n.rightElbow.rotation.set(-.26,0,.12)}else if(d==="jumping"){let P=Math.sin(f*8.5)*.48;n.leftShoulder.rotation.set(-1.4+P,.2,.48),n.leftElbow.rotation.set(-.6,0,.2),n.rightShoulder.rotation.set(-1.4-P,-.2,-.48),n.rightElbow.rotation.set(-.6,0,-.2)}else if(t)if(s==="surprised"||s==="scared"){let P=s==="scared"?Math.sin(f*19)*.12:0;n.leftShoulder.rotation.set(-1.3+P,.2,.55),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.35-P,-.2,-.55),n.rightElbow.rotation.set(-.65,0,0)}else if(s==="angry"){let P=Math.sin(f*16)*.26;n.leftShoulder.rotation.set(-1.25+P,.25,.38),n.leftElbow.rotation.set(-1.28,0,-.24),n.rightShoulder.rotation.set(-1.25-P,-.25,-.38),n.rightElbow.rotation.set(-1.28,0,.24)}else if(s==="laughing"){let P=Math.sin(f*14)*.24;n.leftShoulder.rotation.set(-1.05+P*.5,.22,.32),n.leftElbow.rotation.set(-.52,0,-.12),n.rightShoulder.rotation.set(-.58+P,-.22,-.28),n.rightElbow.rotation.set(-1.25-P*.4,0,-.32)}else if(s==="smug")n.leftShoulder.rotation.set(-.48,.22,-.25),n.leftElbow.rotation.set(-1.28,0,-.45),n.rightShoulder.rotation.set(-.92+Math.sin(f*4.2)*.16,-.18,-.28),n.rightElbow.rotation.set(-.85,0,.12);else if(s==="proud")n.leftShoulder.rotation.set(-.42,.22,.36),n.leftElbow.rotation.set(-1.05,0,-.45),n.rightShoulder.rotation.set(-1.22+Math.sin(f*5)*.15,-.18,-.3),n.rightElbow.rotation.set(-.62,0,.18);else{let P=Math.sin(f*4.8)*.32,se=Math.cos(f*3.9)*.24;n.rightShoulder.rotation.set(-.85+P,-.2,-.26),n.rightElbow.rotation.set(-.95+se,0,0),n.leftShoulder.rotation.set(-.42+se*.4,.15,.18),n.leftElbow.rotation.set(-.85,0,-.15)}else if(s==="scared"||s==="surprised"){let P=Math.sin(f*18)*.08;n.leftShoulder.rotation.set(-.95+P,.2,.38),n.leftElbow.rotation.set(-1.12,0,-.18),n.rightShoulder.rotation.set(-.95-P,-.2,-.38),n.rightElbow.rotation.set(-1.12,0,.18)}else s==="angry"?(n.leftShoulder.rotation.set(-.42,.2,.42),n.leftElbow.rotation.set(-1.08,0,-.46),n.rightShoulder.rotation.set(-.42,-.2,-.42),n.rightElbow.rotation.set(-1.08,0,.46)):s==="smug"?(n.leftShoulder.rotation.set(-.48,.24,-.32),n.leftElbow.rotation.set(-1.35,0,-.52),n.rightShoulder.rotation.set(-.48,-.24,.32),n.rightElbow.rotation.set(-1.35,0,.52)):s==="sad"?(n.leftShoulder.rotation.set(-.18,.06,.14),n.leftElbow.rotation.set(-.55,0,-.15),n.rightShoulder.rotation.set(-.18,-.06,-.14),n.rightElbow.rotation.set(-.55,0,.15)):(n.leftShoulder.rotation.set(-.32,.12,.18),n.leftElbow.rotation.set(-.85,0,-.25),n.rightShoulder.rotation.set(-.32,-.12,-.18),n.rightElbow.rotation.set(-.85,0,.25));if(V){let P=n.auraRing.material,se=n.auraDisc.material;P.opacity=t?.55+.15*Math.sin(f*5):.18,se.opacity=t?.22:.06;let be=t?1.08+.06*Math.sin(f*4.5):.92;n.auraRing.scale.setScalar(be)}if(n.haloGroup&&n.haloMaterial&&(n.haloGroup.visible=n.hasFloorAura!==!1,n.haloGroup.rotation.z=e*.45,n.haloMaterial.opacity=n.role==="Divine"?.72:t?.42:.18),n.pedestalGlow){let P=n.pedestalGlow.material;P.opacity=t?.48:.22}if(n.chakraWheel&&(n.chakraWheel.rotation.z=e*(d==="lapSubdue"||d==="pillarBurst"?6.5:2.8)),n.lowerJawPivot){let P=d==="lapSubdue"||d==="pillarBurst"?Math.max(.26,oe*.42):oe*.36;n.lowerJawPivot.rotation.x=P}n.pattaEnds&&n.pattaEnds.length>0&&n.pattaEnds.forEach((P,se)=>{if(d==="lapSubdued"){P.visible=!1;return}P.visible=!0;let be=se===0?-1:1,I=d==="pillarBurst"||d==="lapSubdue"?.14:.05;P.rotation.z=be*(.14+Math.sin(f*3.4+se)*I),P.rotation.x=Math.cos(f*2.8+se)*I*.7})}var Wh=(n,e,t)=>n+(e-n)*t,Xh=n=>{let e=Math.max(0,Math.min(1,n));return e*e*(3-2*e)};function Yh(n,e,t="dancing",i=!1,s=0){let r=i?-1:1;if(e==="viralBounce"){let f=Math.abs(Math.sin(n*7.2)),d=Math.sin(n*3.6);return{hipOffsetX:d*.14*r,liftY:Math.pow(f,2.4)*.06,bodyRotY:Math.sin(n*1.8)*.24*r,bodyRotZ:d*.08*r,torsoRotX:.06+f*.06,torsoRotY:-d*.14*r,torsoRotZ:-d*.07*r,headRotZ:d*.1*r,leftHipX:-f*.24+d*.16,rightHipX:-f*.24-d*.16,leftKneeX:f*.44,rightKneeX:f*.44,leftShoulder:[-.95+d*.55,.22*r,.52*r],leftElbow:[-.85+f*.35,0,.22*r],rightShoulder:[-.95-d*.55,-.22*r,-.52*r],rightElbow:[-.85+f*.35,0,-.22*r]}}let o=e==="bhangra"?1.32:.92,a=n*o%4,l=t==="adaab"?0:t==="sufiSpin"?3:Math.floor(a),c=t==="dancing"?a-Math.floor(a):n*o%1,h=s>0?Math.pow(1-s,2)*.16:Math.abs(Math.sin(n*Math.PI*o*2))*.14,u=Math.sin(c*Math.PI*2);if(l===0){let f=Xh(Math.sin(c*Math.PI));return{hipOffsetX:-.09*r*f,liftY:0,bodyRotY:.16*r*f,bodyRotZ:.04*r*f,torsoRotX:.09*f,torsoRotY:-.12*r*f,torsoRotZ:-.07*r*f,headRotZ:.1*r*f,leftHipX:-.14-h*.25,rightHipX:-.06-h*.15,leftKneeX:.24+h*.55,rightKneeX:.12+h*.35,leftShoulder:[-.78*f-.24,.28*r,(.42+.18*f)*r],leftElbow:[-.48-.28*f,0,-.18*r],rightShoulder:[Wh(-.45,-1.42,f),-.32*r,(-.36-.16*f)*r],rightElbow:[Wh(-.55,-1.28,f),0,.24*f*r]}}if(l===1){let f=Math.sin(c*Math.PI*2);return{hipOffsetX:f*.15*r,liftY:0,bodyRotY:f*.22*r,bodyRotZ:f*.05*r,torsoRotX:.05,torsoRotY:-f*.22*r,torsoRotZ:-f*.09*r,headRotZ:f*.14*r,leftHipX:-.16+Math.max(0,f)*.18,rightHipX:-.16+Math.max(0,-f)*.18,leftKneeX:.26+Math.abs(f)*.24+h,rightKneeX:.26+Math.abs(f)*.24+h,leftShoulder:[-1.18+f*.52,.32*r,(.58+f*.32)*r],leftElbow:[-.72+Math.cos(c*Math.PI*2)*.35,0,.26*r],rightShoulder:[-1.18-f*.52,-.32*r,(-.58+f*.32)*r],rightElbow:[-.72-Math.cos(c*Math.PI*2)*.35,0,-.26*r]}}if(l===2){let f=u,d=e==="bhangra"?.35:0;return{hipOffsetX:f*.16*r,liftY:e==="bhangra"?Math.max(0,Math.abs(f)-.6)*.12:0,bodyRotY:f*.2*r,bodyRotZ:f*.06*r,torsoRotX:.08+h*.25,torsoRotY:-f*.18*r,torsoRotZ:-f*.07*r,headRotZ:f*.11*r,leftHipX:-.12+f*.28,rightHipX:-.12-f*.28,leftKneeX:.2+Math.max(0,-f)*.48+h,rightKneeX:.2+Math.max(0,f)*.48+h,leftShoulder:[-1.45-d+f*.38,.24*r,(.64+f*.24)*r],leftElbow:[-.88+f*.24,0,.18*r],rightShoulder:[-1.05-d-f*.42,-.24*r,(-.52+f*.24)*r],rightElbow:[-.88-f*.24,0,-.18*r]}}let E=Xh(c),m=Math.sin(E*Math.PI);return{hipOffsetX:Math.sin(E*Math.PI)*.08*r,liftY:e==="bhangra"?m*.08:0,bodyRotY:E*Math.PI*2*r,bodyRotZ:.04*r*m,torsoRotX:-.05*m,torsoRotY:0,torsoRotZ:0,headRotZ:-.08*r*m,leftHipX:-.12,rightHipX:-.12,leftKneeX:.22+h*.4,rightKneeX:.22+h*.4,leftShoulder:[-1.55-.35*m,.28*r,(.68+.32*m)*r],leftElbow:[-.42-.22*m,0,.24*r],rightShoulder:[-1.55-.35*m,-.28*r,(-.68-.32*m)*r],rightElbow:[-.42-.22*m,0,-.24*r]}}function Pm(n,e=0){let t=Dm(n);n.bodyPivot.position.y=0,n.bodyPivot.updateMatrixWorld(!0);let i=1/0;for(let r of[t.left,t.right])r&&(r.getWorldPosition(Wl),n.root.worldToLocal(Wl),i=Math.min(i,Wl.y));let s=Number.isFinite(i)?Math.max(-.55,Math.min(.45,-i)):0;n.bodyPivot.position.y=s+Math.max(0,Math.min(.6,e))}var Ey=new B(0,-1,0),gy=new B(0,1,0),Im=new B(1,0,0),My=new Dt,yy=new Dt().setFromAxisAngle(Im,-.3),xy=new Dt().setFromEuler(new jt(-.1,0,-.18)),Ty=new Dt().setFromEuler(new jt(-.1,0,.18)),wy=new Dt().setFromEuler(new jt(-.25,0,0)),_y=new Dt,vy=new Dt,Sy=new Dt,by=new Dt,Ry=new Dt,Ay=new Dt,Cy=new B,Hy=new B,Py=new B,Iy=new B,Dy=new B,Wl=new B,Ly=new _t,qh=new WeakMap;function Dm(n){let e=qh.get(n);if(!e){let t=(i,s)=>{let r=s??i;if(!r)return null;let o=new Pt;return o.position.set(0,s?-.323:-.39,.04),r.add(o),o};e={left:t(n.leftHip,n.leftKnee),right:t(n.rightHip,n.rightKnee)},qh.set(n,e)}return e}function Kh(n){let e=n.width/n.height,t=n.height>n.width,i=t?37:36,s=new Ft(i,e,.1,100),r=t?4.65:4.8,o=t?1.24:1.05,a=t?1.04:.92;return s.position.set(0,o,r),s.lookAt(0,a,0),{camera:s,currentPos:new B(0,o,r),currentLook:new B(0,a,0),baseFov:i}}function $h(n,e,t,i,s,r,o,a,l,c="auto",h="none",u=!1,E=.5,m=1.38,f="Auto"){let d=e.height>e.width,g=f==="PalaceCourt",p=g?d?5.95:5.45:d?4.65:4.8,x=g?d?1.32:1.18:d?1.24:1.05,w=g?d?1.04:.96:d?1.04:.92;if(e.stageLayout?.templateBackdrop){n.camera.position.set(0,x,p),n.camera.lookAt(0,w,0);return}let y=(r+o)*.45,R=x,S=p,A=(r+o)*.48,C=w,_=(r+o)*.5;if(!e.enableDynamicCamera||l){let q=l?Math.min(1,t/2.6)*.45:0;S=p-q,R=x+(l?(1-Math.min(1,t/2.6))*.25:0)}else i>.88?(S=p+.35,R=x+.12):s==="Left"?(y=_*.72+r*.28,S=p*.92,R=x+.03,A=_*.65+r*.35,C=w+.05):s==="Right"&&(y=_*.72+o*.28,S=p*.92,R=x+.03,A=_*.65+o*.35,C=w+.05);let T=!!e.isComedyMode,L=Math.sin(t*(T?1.8:.9))*(T?.045:.03),G=Math.cos(t*(T?1.4:.7))*(T?.032:.02),U=0;if(a==="surprised"||a==="angry"){let q=T&&c==="auto"&&!l&&s!=="Narrator"&&h!=="cutting"&&h!=="lookInMirror";if(S*=T?a==="angry"&&q?.66:.72:.93,T){let J=s==="Left"?r:s==="Right"?o:_;q&&a==="angry"?(y=_*.4+J*.6,A=_*.25+J*.75,C=Math.max(d?1.08:1.18,m*.94)):(y=_*.65+J*.35,A=_*.55+J*.45,C=d?1.08:1.18),R=d?1.24:1.25,U=Math.sin(t*5.2)*(a==="angry"?.045:-.035)}L+=Math.sin(t*28)*(T?.042:.02),G+=Math.cos(t*33)*(T?.032:.015)}else T&&a==="laughing"&&(S*=.82,G+=Math.abs(Math.sin(t*9.5))*.035,U=Math.sin(t*7.5)*.024);let k=h==="lapSubdue"||h==="lapSubdued"||h==="pillarBurst",X=h==="serpentAttack"||h==="elephantCharge"||h==="fireTrial"||h==="cliffRescue";(g||X)&&!k&&(S=Math.max(S,d?5.65:5.05),R=Math.max(R,x),C=Math.min(C,1.04),X&&(y=0,A=0));let V=!!e.stageLayout?.templateBackdrop;if(!V&&!l&&(!g&&!X||k)){let q=s==="Left"?r:s==="Right"?o:(r+o)*.5;if(h==="corpseSnapUp"){let J=Math.max(0,1-Math.min(1,E/.28));y=0,R=Math.max(d?1.18:1.06,m*.96),S=(d?2.48:2.32)-J*.24,A=0,C=Math.max(.88,m*.88),U+=Math.sin(t*28)*.024*J,L+=Math.cos(t*42)*.026*J,G+=Math.sin(t*36)*.02*J}else if(T&&f==="LivingRoom"&&h.startsWith("hazard"))y=_*.12,R=d?1.8:1.62,S=d?5.35:4.25,A=_*.12,C=d?1.18:1.04;else if(T&&f==="LivingRoom"&&d&&(c==="twoShot"||c==="wideEstablishing"))y=_*.12,R=1.66,S=5.1,A=_*.12,C=1.06;else if(k)y=0,R=d?1.16:1.04,S=d?5.2:4.45,A=0,C=1.06;else if(c==="closeUpSpeaker"&&s!=="Narrator"){let J=f==="Temple"||f==="RiverGhat"||f==="PalaceCourt";y=J?q*.65:q,R=J?1.16:Math.max(d?1.08:.92,m*.98),S=J?d?3.25:3.15:d?2.68:2.55,A=J?q*.55:q,C=J?.92:Math.max(.76,m*.88)}else if(c==="crashPunch"&&s!=="Narrator"){let J=Math.max(0,1-Math.min(1,E/.28));y=q,R=Math.max(d?1.08:.92,m*.98),S=(d?2.48:2.35)-J*.28,A=q,C=Math.max(.78,m*.88),U+=Math.sin(t*28)*.025*J,L+=Math.cos(t*42)*.028*J,G+=Math.sin(t*36)*.022*J}else if(c==="twoShot")y=_,R=d?1.2:1.18,S=d?3.35:3.05,A=_,C=d?1.05:1;else if(c==="reactionZoom"){let J=q*.65+_*.35;y=J*.9,R=d?1.22:1.26,S=d?2.85:2.45,A=J,C=Math.max(d?1.06:1.14,m*.94)}else if(c==="wideEstablishing")y=(r+o)*.25,R=d?1.32:1.44,S=d?4.85:4.45,A=(r+o)*.35,C=d?1.02:.92;else if(c==="lowDramatic")y=q*.45,R=d?.92:.68,S=d?2.85:2.95,A=q*.8,C=Math.max(1.12,m*.9);else if(c==="overShoulder"&&s!=="Narrator"){let J=s==="Left"?o:r;y=d?(r+o)*.45:J*.9,R=d?1.24:1.38,S=d?3.25:2.75,A=d?q*.68+J*.32:q,C=Math.max(d?1.04:.9,m*.92)}(h==="walking"||h==="running")&&(y=q*.65,A=q*.85)}l&&T&&f==="LivingRoom"&&d&&(y=0,R=1.62,S=5.15,A=0,C=1.04);let te=new B(y+L,R+G,S),F=new B(A,C,0);if(e.isSeamlessLoop){let q=new B(0,x,p),J=new B(0,w,0);if(i>.86){let xe=Math.min(1,(i-.86)/.14);te.lerp(q,xe),F.lerp(J,xe),U*=1-xe}else if(i<.06){let xe=1-i/.06;te.lerp(q,xe),F.lerp(J,xe),U*=1-xe}}if(u&&!V&&(T||c==="crashPunch"||c==="closeUpSpeaker"))n.currentPos.lerp(te,.94),n.currentLook.lerp(F,.94);else{let J=1-Math.exp(-(T?13:c==="wideEstablishing"?4.2:6.4)/Math.max(1,e.fps));n.currentPos.lerp(te,J),n.currentLook.lerp(F,J)}n.camera.position.copy(n.currentPos),n.camera.lookAt(n.currentLook),n.camera.rotation.z+=U}var hr=class n extends M{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new Ft;let i=this,s=t.color!==void 0?new Ve(t.color):new Ve(8355711),r=t.textureWidth||512,o=t.textureHeight||512,a=t.clipBias||0,l=t.shader||n.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new pn,u=new B,E=new B,m=new B,f=new _t,d=new B(0,0,-1),g=new xt,p=new B,x=new B,w=new xt,y=new _t,R=this.camera,S=new mn(r,o,{samples:c,type:gi}),A=new Yt({name:l.name!==void 0?l.name:"unspecified",uniforms:oa.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});A.uniforms.tDiffuse.value=S.texture,A.uniforms.color.value=s,A.uniforms.textureMatrix.value=y,this.material=A,this.onBeforeRender=function(C,_,T){if(E.setFromMatrixPosition(i.matrixWorld),m.setFromMatrixPosition(T.matrixWorld),f.extractRotation(i.matrixWorld),u.set(0,0,1),u.applyMatrix4(f),p.subVectors(E,m),p.dot(u)>0===!0&&this.forceUpdate===!1)return;p.reflect(u).negate(),p.add(E),f.extractRotation(T.matrixWorld),d.set(0,0,-1),d.applyMatrix4(f),d.add(m),x.subVectors(E,d),x.reflect(u).negate(),x.add(E),R.position.copy(p),R.up.set(0,1,0),R.up.applyMatrix4(f),R.up.reflect(u),R.lookAt(x),R.far=T.far,R.updateMatrixWorld(),R.projectionMatrix.copy(T.projectionMatrix),y.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),y.multiply(R.projectionMatrix),y.multiply(R.matrixWorldInverse),y.multiply(i.matrixWorld),h.setFromNormalAndCoplanarPoint(u,E),h.applyMatrix4(R.matrixWorldInverse),g.set(h.normal.x,h.normal.y,h.normal.z,h.constant);let G=R.projectionMatrix;w.x=(Math.sign(g.x)+G.elements[8])/G.elements[0],w.y=(Math.sign(g.y)+G.elements[9])/G.elements[5],w.z=-1,w.w=(1+G.elements[10])/G.elements[14],g.multiplyScalar(2/g.dot(w)),G.elements[2]=g.x,G.elements[6]=g.y,G.elements[10]=g.z+1-a,G.elements[14]=g.w,i.visible=!1;let U=C.getRenderTarget(),k=C.xr.enabled,X=C.shadowMap.autoUpdate;C.xr.enabled=!1,C.shadowMap.autoUpdate=!1,C.setRenderTarget(S),C.state.buffers.depth.setMask(!0),C.autoClear===!1&&C.clear(),C.render(_,R),C.xr.enabled=k,C.shadowMap.autoUpdate=X,C.setRenderTarget(U);let V=T.viewport;V!==void 0&&C.state.viewport(V),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return S},this.dispose=function(){S.dispose(),i.material.dispose()}}};hr.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,fragmentShader:`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};function Qh(n){let e=new D({color:16236088,metalness:.85,roughness:.2}),t=new he;t.visible=!1;let i=new D({color:1976635,roughness:.35,metalness:.25}),s=new D({color:14251782,emissive:7877903,emissiveIntensity:.35}),r=new Le({color:16707722}),o=new Le({color:16777215}),a=new Le({color:15680580}),l=[],c=[{side:-1,z:.36,scale:1.05,phase:0},{side:1,z:.28,scale:.96,phase:1.9},{side:-1,z:-.18,scale:1.15,phase:3.4}];for(let ce of c){let ne=new he;ne.position.set(ce.side*1.15,0,ce.z),ne.scale.setScalar(ce.scale);let $=new sn([new B(-ce.side*.26,.05,-.1),new B(0,.07,.16),new B(ce.side*.22,.08,-.08),new B(0,.16,-.12),new B(0,.42,.02)]),Me=new M(new En($,22,.052,10,!1),i);Me.castShadow=!0,ne.add(Me);let ye=new he;ye.position.set(0,.42,.02);let ve=new M(new _e(.048,.062,.44,10),i);ve.position.y=.2,ye.add(ve);let b=new M(new fe(.16,14,10),i);b.scale.set(1.28,1.48,.38),b.position.set(0,.44,.02),b.castShadow=!0,ye.add(b);let me=new M(new qe(.08,.015,6,14),s);me.position.set(0,.44,-.04),ye.add(me);let oe=new M(new fe(.082,12,10),i);oe.scale.set(1.05,.72,1.45),oe.position.set(0,.56,.11),ye.add(oe);for(let P of[-1,1]){let se=new M(new fe(.022,8,6),r);se.position.set(P*.048,.58,.19),ye.add(se);let be=new M(new Qe(.01,.045,5),o);be.rotation.x=Math.PI,be.position.set(P*.028,.5,.21),ye.add(be)}let Ae=new M(new Z(.016,.008,.12),a);Ae.position.set(0,.52,.27),ye.add(Ae),ne.add(ye),ne.rotation.y=-ce.side*.95,t.add(ne),l.push({root:ne,neckPivot:ye,sideSign:ce.side,phase:ce.phase})}n.add(t);let h=new he;h.visible=!1;let u=new D({color:5396582,roughness:.78}),E=new D({color:3883085,roughness:.84}),m=new D({color:12131356,roughness:.52}),f=new D({color:16776171,roughness:.22}),d=new M(new fe(.56,20,16),u);d.scale.set(1.38,1.05,.96),d.position.set(0,.96,0),d.castShadow=!0,h.add(d);let g=new M(new _e(.58,.62,.65,16,1,!1,-Math.PI*.45,Math.PI*.9),m);g.rotation.z=Math.PI/2,g.position.set(0,1.02,0),h.add(g);let p=new M(new Z(.76,.08,1.12),e);p.position.set(0,.74,0),h.add(p);let x=[];for(let[ce,ne]of[[-.44,-.28],[-.44,.28],[.42,-.28],[.42,.28]]){let $=new M(new _e(.145,.165,.74,12),E);$.position.set(ce,.37,ne),$.castShadow=!0;let Me=new M(new qe(.165,.022,6,14),e);Me.rotation.x=Math.PI/2,Me.position.y=-.28,$.add(Me),h.add($),x.push($)}let w=new he;w.position.set(.78,1.18,0),h.add(w);let y=new M(new fe(.38,18,14),u);y.scale.set(1.06,1.15,.96),y.castShadow=!0,w.add(y);let R=new M(new Z(.28,.42,.42),e);R.position.set(.24,.06,0),R.rotation.z=-.22,w.add(R);let S=new M(new Qe(.12,.28,12),e);S.position.set(.06,.46,0),w.add(S);for(let ce of[-1,1]){let ne=new M(new fe(.042,8,6),r);ne.position.set(.28,.08,ce*.24),w.add(ne)}let A=[];for(let ce of[-1,1]){let ne=new M(new fe(.32,12,10),E);ne.scale.set(.18,1.12,.92),ne.position.set(-.08,.02,ce*.42),ne.rotation.y=ce*.35,w.add(ne),A.push(ne);let $=new sn([new B(.24,-.18,ce*.16),new B(.56,-.26,ce*.2),new B(.76,-.05,ce*.18)]),Me=new M(new En($,14,.036,8,!1),f);Me.castShadow=!0,w.add(Me)}let C=new he;C.position.set(.34,-.1,0);let _=new sn([new B(0,0,0),new B(.24,-.28,0),new B(.36,-.62,0),new B(.52,-.58,0)]),T=new M(new En(_,18,.085,10,!1),u);T.castShadow=!0,C.add(T),w.add(C);let L=new M(new _e(.022,.015,.55,6),E);L.position.set(-.76,.72,0),L.rotation.z=-.35,h.add(L),h.position.set(-1.35,0,.12),n.add(h);let G=new he;G.visible=!1,G.position.set(0,0,.16);let U=new D({color:7893356,roughness:.85}),k=new D({color:16347926,emissive:14427686,emissiveIntensity:1.4,roughness:.4}),X=new M(new qe(.95,.12,8,28),U);X.rotation.x=Math.PI/2,X.position.y=.08,X.castShadow=!0,G.add(X);let V=new M(new _e(.9,.94,.1,24),k);V.position.y=.05,G.add(V);let te=[];for(let ce=0;ce<16;ce++){let ne=ce/16*Math.PI*2,$=Math.sin(ne)>.2,Me=$?1.02:ce%2===0?.88:1.08,ye=$?.28+ce%3*.08:.95+ce%4*.25,ve=new Le({color:ce%3===0?16707722:ce%2===0?16347926:15680580,transparent:!0,opacity:$?.65:.84,depthWrite:!1}),b=new M(new Qe($?.14:.2+ce%3*.05,ye,7),ve);b.position.set(Math.cos(ne)*Me,ye*.5+.06,Math.sin(ne)*Me),G.add(b),te.push({mesh:b,baseH:ye,phase:ce*.85,radius:Me,angle:ne})}let F=new Nt(16743196,0,8.5,1.5);F.position.set(0,1.45,.45),G.add(F),n.add(G);let q=new he;q.visible=!1;let J=new D({color:4674921,roughness:.92});for(let[ce,ne,$,Me]of[[-1.3,.22,-.35,1.1],[1.25,.16,-.25,.95],[0,.1,-.65,1.35]]){let ye=new M(new di(.45*Me,0),J);ye.position.set(ce,ne,$),ye.scale.set(1.4,.75,1.1),q.add(ye)}let xe=[],Ie=new Le({color:14742270,transparent:!0,opacity:.32,depthWrite:!1});for(let ce=0;ce<6;ce++){let ne=new M(new fe(.48,12,10),Ie);ne.scale.set(1.9,.42,1.3),ne.position.set((ce-2.5)*.85,.14+ce%2*.12,.25-ce%3*.35),q.add(ne),xe.push(ne)}n.add(q);let Ue=new he;Ue.visible=!1;let K=new Le({color:16638023,transparent:!0,opacity:.2,side:gt,depthWrite:!1}),pe=new M(new fe(.58,24,18),K);pe.scale.set(1,1.35,1),pe.position.y=.78,Ue.add(pe);let Q=new Le({color:16498468,transparent:!0,opacity:.72,side:gt,depthWrite:!1}),re=new M(new qe(.62,.024,8,36),Q);re.rotation.x=Math.PI/2,re.position.y=.1,Ue.add(re);for(let ce=0;ce<8;ce++){let ne=ce/8*Math.PI*2,$=new M(new fe(.14,10,8),new D({color:16020150,emissive:16498468,emissiveIntensity:.4}));$.scale.set(1.1,.38,1.8),$.position.set(Math.cos(ne)*.42,.08,Math.sin(ne)*.42),$.rotation.y=-ne+Math.PI/2,Ue.add($)}return n.add(Ue),{serpentGroup:t,cobras:l,elephantGroup:h,elephantTrunk:C,elephantHead:w,elephantEars:A,elephantLegs:x,fireTrialGroup:G,flames:te,fireLight:F,cliffGroup:q,cliffClouds:xe,devoteeShieldGroup:Ue,shieldDome:pe,shieldRing:re}}function jh(n,e,t,i,s){let r=t!=="none";if(n.devoteeShieldGroup.visible=r,r){n.devoteeShieldGroup.position.set(i,0,.16),n.shieldRing.rotation.z=e*1.4;let o=.96+Math.sin(e*5)*.05;n.shieldDome.scale.setScalar(o)}if(n.serpentGroup.visible=t==="serpentAttack",t==="serpentAttack"&&n.cobras.forEach(o=>{let a=Math.max(0,Math.sin(e*4.2+o.phase)),l=Math.exp(-Math.pow(a-.85,2)*8)*.24;o.root.position.x=i+o.sideSign*(.98-a*.16+l),o.neckPivot.rotation.x=.38*a-.18,o.neckPivot.rotation.z=Math.sin(e*7.5+o.phase)*.14}),n.elephantGroup.visible=t==="elephantCharge",t==="elephantCharge"){let o=i>=0?1:-1,a=i-o*(1.75-Math.min(1,s*1.6)*.65);n.elephantGroup.position.x=a,n.elephantGroup.rotation.y=o>=0?0:Math.PI;let l=Math.sin(e*8.5)*(s<.65?.25:.05);n.elephantLegs.forEach((h,u)=>{h.rotation.z=(u%2===0?1:-1)*l}),n.elephantEars.forEach((h,u)=>{h.rotation.y=(u===0?-1:1)*(.35+Math.sin(e*6)*.25)});let c=s>.45?Math.min(1,(s-.45)*2.4)*.65:Math.sin(e*4.5)*.18;n.elephantTrunk.rotation.z=c,n.elephantHead.rotation.z=Math.sin(e*3.5)*.08}n.fireTrialGroup.visible=t==="fireTrial",n.fireLight.intensity=t==="fireTrial"?3.2+Math.sin(e*14)*.7:0,t==="fireTrial"&&(n.fireTrialGroup.position.x=0,n.flames.forEach(o=>{let a=.8+.32*Math.sin(e*13.5+o.phase);o.mesh.scale.set(.92+.12*Math.cos(e*9+o.phase),a,1),o.mesh.position.y=o.baseH*a*.5+.05,o.mesh.position.x=Math.cos(o.angle)*o.radius,o.mesh.position.z=Math.sin(o.angle)*o.radius})),n.cliffGroup.visible=t==="cliffRescue",t==="cliffRescue"&&n.cliffClouds.forEach((o,a)=>{o.position.x=(a-2.5)*.85+Math.sin(e*1.4+a)*.22})}function eu(n){let e=new he;e.visible=!1;let t=new D({color:16317180,roughness:.78}),i=new D({color:16708551,roughness:.72}),s=new D({color:16096779,roughness:.55}),r=new D({color:15357964,roughness:.58}),o=new D({color:14251782,metalness:.75,roughness:.25}),a=new M(new Z(1.56,.12,.86),t);a.position.set(.08,.06,.25),a.receiveShadow=!0,e.add(a);let l=new M(new Z(.36,.14,.62),i);l.position.set(-.44,.18,.25),l.castShadow=!0,e.add(l);let c=new M(new _e(.08,.1,.05,12),o);c.position.set(-.68,.025,.56),e.add(c);let h=new M(new _e(.008,.008,.24,6),new D({color:4140577}));h.position.set(-.68,.15,.56),h.rotation.z=-.15,e.add(h);let u=new M(new fe(.016,8,6),new Le({color:16347926}));u.position.set(-.66,.265,.56),e.add(u);let E=new he,m=new M(new _e(.3,.27,1.04,18,1,!1,-Math.PI*.5,Math.PI),t);m.rotation.z=-Math.PI/2,m.scale.set(.92,1,1.15),m.position.set(.24,.26,.25),m.castShadow=!0,E.add(m);let f=new M(new Z(1.06,.24,.64),t);f.position.set(.24,.22,.25),E.add(f);let d=new he;for(let v=0;v<9;v++){let O=(v-4)/4,j=new M(new fe(.044,8,6),v%2===0?s:r);j.position.set(.14+Math.abs(O)*.14,.54-Math.abs(O)*.1,.25+O*.22),d.add(j)}E.add(d),e.add(E),n.add(e);let g=new he;g.position.set(0,2.22,-1.16),g.visible=!1;let p=new M(new Ct(.72,32),new Le({color:988970,transparent:!0,opacity:.84}));p.position.z=-.18,g.add(p);let x=new M(new qe(.74,.04,12,40),new Le({color:16436245}));x.position.z=-.16,g.add(x);let w=()=>{let v=new he;return v.visible=!1,g.add(v),v},y=w(),R=new D({color:4674921,metalness:.4,roughness:.5});for(let v of[-.36,.36]){let O=new M(new _e(.032,.036,.65,8),R);O.position.set(v,-.05,0),y.add(O)}let S=new M(new qe(.36,.025,8,20,Math.PI*.72),new D({color:1120295,roughness:.7}));S.position.set(0,.25,0),S.rotation.z=Math.PI*1.14,y.add(S);let A=new M(new _e(.024,.024,.16,8),new D({color:14251782,metalness:.85,roughness:.2}));A.rotation.z=Math.PI/2,A.position.set(0,-.08,.04),y.add(A);let C=[],_=new Le({color:3718648}),T=new Le({color:16707722});for(let v=0;v<6;v++){let O=new M(new Lt(.058,0),v%2===0?T:_);y.add(O),C.push(O)}let L=w(),G=new he;G.position.set(-.22,-.08,0);let U=new M(new Z(.36,.34,.32),new D({color:16347926,roughness:.45}));U.position.y=.08,G.add(U);let k=new M(new Z(.3,.13,.34),new Le({color:12248829}));k.position.set(0,.15,.01),G.add(k);for(let v of[-.11,.11]){let O=new M(new fe(.036,8,6),T);O.position.set(v,-.02,.17),G.add(O)}let X=new M(new Z(.4,.4,.32),new D({color:15381256,roughness:.55}));X.position.set(-.18,.12,-.18),G.add(X),L.add(G);let V=new he;V.position.set(.28,-.12,.14);let te=new M(new Z(.24,.16,.24),new D({color:1483594,roughness:.45}));V.add(te);let F=new M(new Qe(.18,.18,4),new D({color:16436245,roughness:.5}));F.rotation.y=Math.PI/4,F.position.y=.16,V.add(F),L.add(V);let q=w(),J=new D({color:165063,roughness:.4}),xe=new M(new _e(.24,.24,.48,18),J);xe.position.set(.06,.04,0),q.add(xe);for(let v of[-.08,.04,.16]){let O=new M(new qe(.245,.014,8,20),J);O.rotation.x=Math.PI/2,O.position.set(.06,v,0),q.add(O)}let Ie=new M(new _e(.12,.12,.05,12),new D({color:988970}));Ie.position.set(.06,.3,0),q.add(Ie);let Ue=new M(new Ct(.4,20),new Le({color:8246268,transparent:!0,opacity:.85}));Ue.rotation.x=-Math.PI/2,Ue.position.set(0,-.24,0),q.add(Ue);for(let v of[-.3,-.18]){let O=new M(new _e(.015,.015,.56,8),R);O.position.set(v,-.02,.08),O.rotation.z=-.24,q.add(O)}let K=w(),pe=new M(new _e(.46,.46,.06,20),new D({color:3359061,roughness:.8}));pe.position.set(0,-.22,0),K.add(pe);let Q=new M(new Ct(.28,20),new Le({color:132631}));Q.rotation.x=-Math.PI/2,Q.position.set(0,-.185,0),K.add(Q);for(let v of[-.32,.32]){let O=new M(new Qe(.085,.24,12),r);O.position.set(v,-.06,.12),K.add(O);let j=new M(new qe(.055,.012,6,12),new Le({color:16777215}));j.rotation.x=Math.PI/2,j.position.set(v,-.06,.12),K.add(j)}let re=w(),ce=new D({color:1483594,roughness:.35}),ne=new D({color:16638023,roughness:.45}),$=[];for(let v=0;v<8;v++){let O=.075-v*.0055,j=new M(new fe(Math.max(.025,O),10,8),v%2===0?ce:ne);re.add(j),$.push(j)}let Me=new M(new fe(.11,12,10),ce);Me.scale.set(1.25,1.35,.65),Me.position.set(-.24,.16,.08),re.add(Me);for(let v of[-.048,.048]){let O=new M(new fe(.032,8,6),new Le({color:16777215}));O.position.set(v,.04,.09),Me.add(O);let j=new M(new fe(.016,6,6),new Le({color:593174}));j.position.set(v,.04,.115),Me.add(j)}let ye=new M(new Z(.018,.01,.14),new Le({color:15680580}));ye.position.set(-.24,.12,.22),re.add(ye),$.push(Me);let ve=w(),b=new M(new _e(.32,.26,.04,24),new D({color:14870768,metalness:.85,roughness:.2}));b.position.set(-.08,-.14,.04),ve.add(b);let me=new M(new fe(.11,14,10),s);me.position.set(-.08,-.02,.06),ve.add(me);let oe=new M(new _e(.09,.065,.28,16),new D({color:3718648,transparent:!0,opacity:.78,roughness:.15}));oe.position.set(.28,-.02,.08),ve.add(oe);let Ae=w(),P=new M(new Z(.28,.48,.045),new D({color:988970,roughness:.3}));P.rotation.z=-.12,Ae.add(P);let se=new Le({color:3718648}),be=new M(new ft(.24,.42),se);be.position.set(0,0,.026),be.rotation.z=-.12,Ae.add(be);let I=new M(new fe(.11,12,10),T);return I.position.set(-.32,.24,-.05),Ae.add(I),n.add(g),{funeralGroup:e,shroudMesh:E,shroudGarland:d,bubbleGroup:g,hazards:{wireSpark:y,truckRickshaw:L,waterTank:q,roadPit:K,giantSnake:re,chokeFood:ve,nightPhone:Ae},wireSparks:C,truckGroup:G,rickshawGroup:V,snakeBody:$,snakeTongue:ye,phoneGlowMat:se}}function tu(n,e,t,i,s,r){if(n.funeralGroup.visible=t,n.shroudMesh.visible=t&&!i,s==="none"){n.bubbleGroup.visible=!1;return}n.bubbleGroup.visible=!0,n.bubbleGroup.position.y=2.22+Math.sin(e*3.2)*.045;let o=r<.16?.65+r/.16*.38:1+Math.sin(e*5)*.025;n.bubbleGroup.scale.setScalar(o);for(let[a,l]of Object.entries(n.hazards))l.visible=a===s;s==="wireSpark"?n.wireSparks.forEach((a,l)=>{let c=e*9+l/n.wireSparks.length*Math.PI*2,h=.08+(e*3.2+l*.2)%.22;a.position.set(Math.cos(c)*h,-.08+Math.sin(c)*h,.06),a.scale.setScalar(.65+.55*Math.abs(Math.sin(e*22+l)))}):s==="truckRickshaw"&&n.truckGroup&&n.rickshawGroup?(n.truckGroup.position.y=-.08+Math.abs(Math.sin(e*14))*.022,n.rickshawGroup.position.y=-.12+Math.abs(Math.sin(e*16+.8))*.028,n.truckGroup.rotation.y=Math.sin(e*2.5)*.15,n.rickshawGroup.rotation.y=Math.sin(e*2.5)*.15):s==="giantSnake"?(n.snakeBody.forEach((a,l)=>{if(l===n.snakeBody.length-1)a.position.set(-.22,.14+Math.sin(e*5.2)*.04,.08),a.rotation.z=Math.sin(e*4.2)*.14;else{let c=-.14+l*.068,h=-.12+Math.sin(e*6-l*.7)*.075,u=Math.cos(e*6-l*.7)*.1;a.position.set(c,h,u)}}),n.snakeTongue&&(n.snakeTongue.visible=Math.sin(e*14)>0,n.snakeTongue.position.y=.1+Math.sin(e*5.2)*.04)):s==="nightPhone"&&n.phoneGlowMat&&n.phoneGlowMat.color.setHex(Math.sin(e*8)>0?3718648:8246268)}function Lm(n,e){let t=new Ve(e.topBackdropHex),i=new Ve(e.midBackdropHex),s=new Ve(e.botBackdropHex);return n==="Night"?(t.lerp(new Ve(1448251),.58),i.lerp(new Ve(3482974),.58),s.lerp(new Ve(2495785),.58),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:15127807,sunIntensity:1.48,fogDensity:.024}):n==="Sunset"?(t.lerp(new Ve(2756672),.68),i.lerp(new Ve(14242598),.68),s.lerp(new Ve(3805978),.62),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16752196,sunIntensity:1.92,fogDensity:.036}):n==="Day"?(t.lerp(new Ve(3718648),.55),i.lerp(new Ve(9684477),.55),s.lerp(new Ve(1981023),.55),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16774624,sunIntensity:2,fogDensity:.025}):(t.lerp(new Ve(1970486),.48),i.lerp(new Ve(12076580),.42),s.lerp(new Ve(1707800),.48),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16764807,sunIntensity:1.85,fogDensity:.036})}function Zt(n,e,t,i,s,r,o){let a=new D({color:14251782,metalness:.8,roughness:.25}),l=new M(new Qe(.11,.07,14),a);l.rotation.x=Math.PI,l.position.set(e,t+.035,i),n.add(l);let c=new M(new Qe(.032,.1,10),new Le({color:16768875}));c.position.set(e,t+.11,i),n.add(c);let h=new M(new fe(.11,10,8),new Le({color:16752412,transparent:!0,opacity:.3,depthWrite:!1}));if(h.position.set(e,t+.11,i),n.add(h),r.animatedProps.push({object:c,kind:"diya",baseY:t+.11,phase:s,speed:7.5}),o){let u=new Nt(16752440,1.4,5.5,1.6);u.position.set(e,t+.22,i),n.add(u),r.ambientFireLights.push({light:u,baseIntensity:1.4,phase:s})}}function ur(n,e,t,i,s,r,o){let a=new he;a.position.set(e,0,t);let l=new D({color:4861725,roughness:.85}),c=new M(new _e(.08*i,.15*i,1.5*i,10),l);c.position.y=.75*i,c.castShadow=!0,a.add(c);let h=new D({color:s,roughness:.72}),u=[[0,1.65,0,.65],[-.36,1.42,.15,.48],[.38,1.45,-.1,.48],[0,1.95,.08,.44]];for(let[E,m,f,d]of u){let g=new M(new Js(d*i,1),h);g.position.set(E*i,m*i,f*i),g.castShadow=!0,g.receiveShadow=!0,a.add(g)}n.add(a),o.animatedProps.push({object:a,kind:"sway",baseRotZ:0,phase:r,speed:1.1})}function Bm(n,e){let t=new D({color:10380100,roughness:.68}),i=new D({color:15261649,roughness:.42,metalness:.08}),s=new D({color:16172100,metalness:.85,roughness:.22}),r=new D({color:2278750,roughness:.45}),o=new M(new _e(5.6,5.9,.26,36),t);o.position.y=-.13,o.receiveShadow=!0,n.add(o);let a=new M(new An(1.38,1.56,48),new Le({color:16172100,transparent:!0,opacity:.58,side:gt}));a.rotation.x=-Math.PI/2,a.position.y=.012,n.add(a);for(let G of[-2.45,-1.68,1.68,2.45]){let U=Math.abs(G)>2?-1.45:-2.45,k=new M(new Z(.42,.26,.42),s);k.position.set(G,.13,U),n.add(k);let X=new M(new _e(.15,.19,3.55,14),t);X.position.set(G,1.88,U),X.castShadow=!0,X.receiveShadow=!0,n.add(X);let V=new M(new _e(.27,.18,.22,14),s);V.position.set(G,3.56,U),n.add(V)}let l=new M(new qe(1.75,.085,10,32,Math.PI),s);l.position.set(0,2.55,-2.35),n.add(l);let c=new M(new Z(1.75,.95,1.55),t);c.position.set(0,.48,-4.45),n.add(c);for(let G=0;G<3;G++){let U=1.42-G*.28,k=new M(new Z(U,.48,U),G===2?s:t);k.position.set(0,1.15+G*.46,-4.45),n.add(k)}let h=new M(new fe(.19,12,10),s);h.position.set(0,2.48,-4.45),n.add(h);let u=new M(new Qe(.09,.28,12),s);u.position.set(0,2.74,-4.45),n.add(u);for(let G of[-1.42,1.42]){let U=new M(new _e(.032,.075,1.05,10),s);U.position.set(G,.52,-.88),n.add(U),Zt(n,G,1.04,-.88,G>0?1.4:.3,e,!0)}for(let[G,U]of[[-1.35,0],[1.35,1.3]]){let k=new he;k.position.set(G,3.35,-.6);let X=new M(new _e(.014,.014,.65,8),s);X.position.y=-.32,k.add(X);let V=new M(new Qe(.16,.25,16,1,!0),s);V.position.y=-.72,V.castShadow=!0,k.add(V),n.add(k),e.animatedProps.push({object:k,kind:"bell",baseRotZ:0,phase:U,speed:1.5})}let E=new he;E.position.set(0,1.92,-3.05);let m=new M(new qe(1.18,.028,10,48),s),f=new M(new qe(.84,.024,10,36),s);E.add(m,f),n.add(E),e.animatedProps.push({object:m,kind:"ring",phase:0,speed:.35}),e.animatedProps.push({object:f,kind:"ring",phase:1.4,speed:-.52}),Zt(n,-1.12,0,-.45,.2,e,!0),Zt(n,1.12,0,-.45,1.9,e,!0),Zt(n,-.52,0,-1.05,3.1,e,!1),Zt(n,.52,0,-1.05,4.4,e,!1);let d=new he;d.position.set(0,.14,-1.32);let g=new D({color:2500922,metalness:.42,roughness:.18}),p=new M(new _e(.56,.64,.14,24),i);p.position.y=-.07,d.add(p);let x=new M(new _e(.4,.48,.26,24),i);x.position.y=.13,x.castShadow=!0,x.receiveShadow=!0,d.add(x);let w=new M(new qe(.32,.055,10,24),s);w.rotation.x=Math.PI/2,w.position.y=.27,d.add(w);let y=new M(new vt(.17,.4,12,20),g);y.position.y=.54,y.castShadow=!0,d.add(y);let R=new M(new _e(.025,.032,.88,10),s);R.position.set(0,.54,-.22),d.add(R);let S=new M(new fe(.2,14,10),s);S.scale.set(1.25,.72,.42),S.position.set(0,.98,-.1),S.rotation.x=.35,d.add(S);for(let G of[.58,.62,.66]){let U=new M(new Z(.16,.016,.022),new Le({color:16708551}));U.position.set(0,G,.165),d.add(U)}let A=new D({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.26}),C=new D({color:16020150,emissive:14362487,emissiveIntensity:.3,roughness:.32});for(let G=0;G<14;G++){let U=G/14*Math.PI*2,k=new M(new fe(G%2===0?.068:.06,8,6),G%2===0?A:C);k.position.set(Math.cos(U)*.3,.31,Math.sin(U)*.3),d.add(k)}let _=new M(new Lt(.09,1),A);_.scale.set(1.25,.55,1.25),_.position.set(0,.77,0),d.add(_);let T=new M(new fe(.055,8,6),r);T.scale.set(1.2,.35,1.2),T.position.set(.08,.76,.06),d.add(T);for(let G of[-.58,.58]){let U=new M(new _e(.24,.18,.045,20),s);U.position.set(G,-.1,.24),d.add(U);for(let k=0;k<7;k++){let X=k/7*Math.PI*2,V=k===0?0:.12,te=k===0?.04:0,F=new M(new Lt(.068,1),k%2===0?A:C);F.scale.set(1.2,.62,1.2),F.position.set(G+Math.cos(X)*V,-.04+te,.24+Math.sin(X)*V),d.add(F)}}let L=new Nt(16763750,2.35,6.2,1.4);L.position.set(0,1.25,.45),d.add(L),n.add(d)}function Gm(n,e){let t=new D({color:2507300,roughness:.92}),i=new M(new Ct(9,40),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new he;s.position.set(.1,0,-3.2);let r=new M(new _e(.95,1,1.05,18),new D({color:10251846,roughness:.85}));r.position.y=.52,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new M(new Qe(1.38,.95,20),new D({color:12558414,roughness:.9}));o.position.y=1.42,o.castShadow=!0,s.add(o);let a=new M(new ft(.42,.65),new Le({color:16758605}));a.position.set(0,.34,.96),s.add(a),n.add(s),ur(n,-2.1,-1.8,1.45,3108407,.3,e),ur(n,2.2,-1.9,1.38,3635775,1.6,e),ur(n,-1.65,-3.9,1.65,2314793,2.8,e),ur(n,1.75,-4.1,1.55,2711344,4.1,e),Zt(n,0,0,-1.4,.5,e,!0)}function Um(n,e){let t=new D({color:10186830,roughness:.72}),i=new D({color:16096779,metalness:.78,roughness:.28}),s=new M(new Z(8.5,.3,2.2),t);s.position.set(0,-.15,.1),s.receiveShadow=!0,n.add(s);let r=new M(new Z(8.5,.16,.6),t);r.position.set(0,-.16,-1.25),n.add(r);let o=new M(new Z(8.5,.12,.55),t);o.position.set(0,-.22,-1.75),n.add(o);for(let c of[-2.4,2.4]){let h=new M(new _e(.14,.17,2.45,12),t);h.position.set(c,1.15,-2.1),n.add(h);let u=new M(new Qe(.42,.55,12),i);u.position.set(c,2.55,-2.1),n.add(u)}let a=new D({color:1994655,emissive:799826,emissiveIntensity:.45,metalness:.72,roughness:.18}),l=new M(new ft(20,11,24,16),a);l.rotation.x=-Math.PI/2,l.position.set(0,-.09,-7.2),l.receiveShadow=!0,n.add(l),e.animatedProps.push({object:l,kind:"water",phase:0,speed:1.8}),Zt(n,-1.2,0,-.65,.4,e,!0),Zt(n,1.2,0,-.65,2.1,e,!0),Zt(n,-.75,-.07,-2.4,3.4,e,!1),Zt(n,.85,-.07,-3.1,4.9,e,!1),Zt(n,-.15,-.07,-3.8,1.5,e,!1),Zt(n,1.45,-.07,-4.4,5.2,e,!1)}function Fm(n,e,t){let i=new D({color:1053482,metalness:.7,roughness:.24}),s=new M(new _e(5.5,5.5,.2,48),i);s.position.y=-.1,s.receiveShadow=!0,n.add(s);let r=new Le({color:t,transparent:!0,opacity:.75}),o=new D({color:16498468,metalness:.85,roughness:.2}),a=new he;a.position.set(0,2.05,-3.3);let l=new M(new qe(1.58,.032,10,64),o),c=new M(new qe(1.16,.026,10,48),r),h=new M(new qe(.76,.022,10,48),o);c.rotation.x=.7,h.rotation.y=.55;let u=new M(new fe(.28,20,16),new Le({color:16638023}));a.add(l,c,h,u),n.add(a);let E=new Nt(16498468,3,9,1.4);E.position.set(0,2.1,-2.5),n.add(E),e.ambientFireLights.push({light:E,baseIntensity:3,phase:.3}),e.animatedProps.push({object:l,kind:"ring",phase:.2,speed:.35}),e.animatedProps.push({object:c,kind:"ring",phase:1.5,speed:-.55}),e.animatedProps.push({object:h,kind:"ring",phase:.9,speed:.48});let m=new he;m.position.set(0,2.75,-2.8);let f=new Le({color:16774589,transparent:!0,opacity:0}),d=new M(new Lt(.18,0),f),g=new M(new Qe(.95,3.6,24,1,!0),new Le({color:16770180,transparent:!0,opacity:0,side:gt,depthWrite:!1,blending:Hn}));g.position.y=-1.6,m.add(d,g),n.add(m),e.poleStarGroup=m,e.poleStarMat=g.material}function Nm(n,e){let t=new D({color:6371360,roughness:.45,metalness:.1}),i=new M(new _e(5.2,5.4,.25,40),t);i.position.y=-.125,i.receiveShadow=!0,n.add(i);let s=new M(new Z(8.5,4.5,.25),new D({color:4528676,roughness:.85}));s.position.set(0,2.1,-3.5),s.receiveShadow=!0,n.add(s);let r=new D({color:10033947,roughness:.8});for(let m of[-1,1])for(let f=0;f<3;f++){let d=new M(new _e(.24,.28,4.4,12),r);d.position.set(m*(2.2+f*.36),2.1,-2.8+f*.12),d.castShadow=!0,n.add(d)}let o=new D({color:14870768,metalness:.92,roughness:.15}),a=new M(new _e(.016,.024,1.18,8),o);a.position.set(0,.59,.58),a.castShadow=!0,n.add(a);let l=new M(new _e(.14,.15,.04,16),o);l.position.set(0,.02,.58),n.add(l);let c=new M(new fe(.055,12,10),o);c.position.set(0,1.21,.58),n.add(c);let h=new M(new qe(.65,.028,10,40),new Le({color:16486972}));h.position.set(0,2.25,-3.3),n.add(h);let u=new Ii(16638023,4.2,12,.42,.55,1.2);u.position.set(-1.6,4.2,2.2),n.add(u,u.target),e.animatedProps.push({object:u,kind:"spotlight",phase:0,speed:1.3});let E=new Ii(16020150,3.6,12,.42,.55,1.2);E.position.set(1.6,4.2,2.2),n.add(E,E.target),e.animatedProps.push({object:E,kind:"spotlight",phase:1.7,speed:1.5})}function km(n,e){let t=new D({color:2959666,roughness:.9}),i=new M(new ft(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new D({color:8145446,roughness:.72}),r=new he;r.position.set(0,0,-2);let o=new M(new Z(2.1,.85,.7),s);o.position.y=.425,o.castShadow=!0,o.receiveShadow=!0,r.add(o);for(let E of[-.98,.98]){let m=new M(new Z(.08,2.15,.08),s);m.position.set(E,1.075,-.25),r.add(m)}let a=new M(new Z(2.4,.08,1.1),new D({color:14251782,roughness:.75}));a.position.set(0,2.15,.05),a.rotation.x=.2,a.castShadow=!0,r.add(a);let l=new D({color:16096779,metalness:.75,roughness:.25}),c=new M(new fe(.14,14,12),l);c.position.set(-.35,.98,.05),r.add(c);let h=new D({color:11817737,roughness:.85});for(let E of[.1,.28,.46]){let m=new M(new _e(.05,.035,.09,12),h);m.position.set(E,.9,.08),r.add(m)}for(let E=0;E<4;E++){let m=new M(new fe(.06,8,8),new Le({color:16708551,transparent:!0,opacity:.28,depthWrite:!1}));m.position.set(-.35+E%2*.06,1.18+E*.14,.05),r.add(m),e.animatedProps.push({object:m,kind:"steam",baseY:1.16,phase:E*1.4,speed:1.8})}e.spots.counter={x:.25,y:0,z:-.9,rotY:.12};let u=new Nt(16758605,2.6,7,1.5);u.position.set(0,1.88,.25),r.add(u),e.ambientFireLights.push({light:u,baseIntensity:2.6,phase:.4}),n.add(r)}function Om(n,e){let t=new M(new Ct(9,32),new D({color:13358561,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new D({color:3359061,roughness:.82}),s=new D({color:15857145,roughness:.55}),r=[[-2.4,-4.5,2.6,1.8],[0,-5.6,3.8,2.3],[2.5,-4.4,2.4,1.7]];for(let[o,a,l,c]of r){let h=new M(new Qe(c,l,7),i);h.position.set(o,l*.5-.1,a),n.add(h);let u=new M(new Qe(c*.45,l*.42,7),s);u.position.set(o,l*.78-.1,a),n.add(u)}Zt(n,0,0,-1.1,.8,e,!0)}function zm(n,e,t=!1){let i=new D({color:15127221,roughness:.72}),s=new D({color:13284758,roughness:.58}),r=new D({color:16041038,metalness:.85,roughness:.22}),o=new D({color:7017510,roughness:.8}),a=new D({color:2822922,emissive:14251782,emissiveIntensity:.42,roughness:.6}),l=new M(new Ct(10.5,48),s);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new M(new Z(8.8,.06,5.2),i);c.position.set(0,-.02,-.6),c.receiveShadow=!0,n.add(c);let h=new M(new Z(3.75,.016,2.35),r);h.position.set(0,.012,.15),h.receiveShadow=!0,n.add(h);let u=new M(new Z(3.45,.022,2.08),o);u.position.set(0,.015,.15),u.receiveShadow=!0,n.add(u);let E=new M(new Z(10.8,4.4,.28),s);E.position.set(0,2.2,-3.55),E.receiveShadow=!0,n.add(E);let m=new M(new Z(10.4,.24,.72),i);m.position.set(0,.12,-2.55),m.receiveShadow=!0,n.add(m);let f=[-3.6,-1.25,1.25,3.6];for(let p of f){let x=new M(new Z(.42,.34,.42),i);x.position.set(p,.26,-2.55),x.castShadow=!0,n.add(x);let w=new M(new _e(.15,.17,2.75,14),i);w.position.set(p,1.78,-2.55),w.castShadow=!0,n.add(w);let y=new M(new Z(.46,.22,.46),r);y.position.set(p,3.2,-2.55),n.add(y)}let d=[-2.42,0,2.42];for(let p=0;p<d.length;p++){let x=d[p],w=p===1?2.42:2.28,y=new M(new Z(w,.65,.26),i);y.position.set(x,3.55,-2.55),y.castShadow=!0,n.add(y);let R=new M(new qe(.88,.065,8,20,Math.PI),i);R.position.set(x,2.52,-2.52),n.add(R);let S=new M(new Z(1.18,1.72,.08),r);S.position.set(x,1.56,-3.38),n.add(S);let A=new M(new Z(1.02,1.56,.1),a);A.position.set(x,1.56,-3.35),n.add(A);for(let _ of[-1,1]){let T=new M(new _e(.09,.14,1.95,10),o);T.position.set(x+_*.54,1.55,-3.28),T.rotation.z=_*.06,n.add(T)}let C=new M(new Z(1.22,.56,.12),a);C.position.set(x,3.12,-3.32),n.add(C)}let g=[-2.18,2.18];for(let p=0;p<g.length;p++){let x=g[p],w=-.35,y=new he;y.position.set(x,0,w);let R=new M(new _e(.1,.22,.16,14),r);R.position.y=.08,y.add(R);let S=new M(new _e(.025,.036,1.18,10),r);S.position.y=.74,S.castShadow=!0,y.add(S);for(let[C,_]of[[-.14,0],[.14,0],[0,.12],[0,-.1]]){let T=new M(new _e(.042,.024,.05,8),r);T.position.set(C,1.34,_),y.add(T);let L=new M(new Qe(.022,.09,8),new Le({color:16707722}));L.position.set(C,1.4,_),y.add(L),e.animatedProps.push({object:L,kind:"diya",phase:p*1.4+C*3,speed:12.5})}let A=new Nt(16757844,1.9,6.2,1.6);A.position.set(0,1.48,0),y.add(A),e.ambientFireLights.push({light:A,baseIntensity:1.9,phase:p*1.7}),n.add(y)}if(Zt(n,-1.65,.24,-2.2,.3,e,!1),Zt(n,1.65,.24,-2.2,1.9,e,!0),t){let p=new M(new Z(3.2,.042,.62),i);p.position.set(0,.021,.08),p.receiveShadow=!0,n.add(p);let x=new M(new Z(3.08,.014,.06),r);x.position.set(0,.045,.34),n.add(x);for(let U of[-2.95,2.95]){let k=new M(new Z(.3,3.2,.34),i);k.position.set(U,1.6,-1.45),k.castShadow=!0,n.add(k);let X=new M(new Z(.38,.16,.42),r);X.position.set(U,3.22,-1.45),n.add(X)}let w=new he;w.position.set(0,0,-.78);let y=new M(new Z(.68,.38,.68),i);y.position.y=.19,y.castShadow=!0,w.add(y);let R=new M(new _e(.24,.28,2.75,10),i);R.position.y=1.72,R.castShadow=!0,w.add(R);for(let U of[.85,1.72,2.58]){let k=new M(new qe(.27,.032,8,16),r);k.rotation.x=Math.PI/2,k.position.y=U,w.add(k)}let S=new M(new Z(.64,.28,.64),r);S.position.y=3.16,w.add(S),n.add(w),e.stambhaWholeGroup=w;let A=new he;A.position.set(0,0,-.78),A.visible=!1;let C=new M(new Z(.72,.38,.72),i);C.position.y=.19,A.add(C);let _=new M(new _e(.2,.28,.72,9),i);_.position.y=.72,A.add(_);let T=new D({color:16707722,emissive:16347926,emissiveIntensity:1.55,roughness:.2}),L=new M(new di(.32,1),T);L.position.y=1.06,L.scale.set(1.2,1.5,.85),A.add(L);for(let U of[-1,1]){let k=new M(new di(.24,0),i);k.position.set(U*.78,.14,.18),k.scale.set(1.25,.65,.95),k.rotation.set(.18,.55*U,U*.35),A.add(k);let X=new M(new Z(.26,.16,.22),i);X.position.set(U*1.12,.09,-.1),X.rotation.y=U*.48,A.add(X)}let G=new Nt(16758578,0,7.5,1.4);G.position.set(0,1.35,.35),A.add(G),e.stambhaFireLights=[G],n.add(A),e.stambhaBrokenGroup=A}}function Vm(n,e,t,i){if(e==="ModernCity"){let l=new M(new ft(24,24),new D({color:593183,roughness:.35,metalness:.6}));l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new ds(20,28,new Ve(i),1976635);c.position.y=.01,n.add(c);let h=new M(new Lt(.55,0),new D({color:i,wireframe:!0,emissive:i,emissiveIntensity:.6}));h.position.set(0,1.9,-2.5),n.add(h),t.animatedProps.push({object:h,kind:"ring",phase:0,speed:.6});return}let s=e==="PalaceCourt"?6038067:e==="Battlefield"?4140322:4535592,r=new M(new Ct(8.5,36),new D({color:s,roughness:.78}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,n.add(r);let o=e==="PalaceCourt"?14264170:e==="Archive"?6898214:7033664,a=new D({color:o,roughness:.72});for(let l of[-2.1,2.1]){let c=new M(new Z(.35,3.4,.35),a);c.position.set(l,1.7,-2.4),c.castShadow=!0,n.add(c)}Zt(n,-1.5,0,-1.2,.4,t,!0),Zt(n,1.5,0,-1.2,2,t,!0)}function Wm(n,e,t){let i=new D({color:1976635,roughness:.35,metalness:.55}),s=new D({color:t%2===0?2282478:11032055,emissive:959977,emissiveIntensity:.55}),r=new M(new Z(3.8,.22,9.5),i);r.position.set(0,-.11,-1.5),r.receiveShadow=!0,n.add(r);for(let c of[-1.85,1.85]){let h=new M(new Z(.12,.25,9.5),s);h.position.set(c,-.09,-1.5),n.add(h)}let o=[[-1.08,2282478],[1.08,16007006]];for(let c=0;c<o.length;c++){let[h,u]=o[c],E=new he;E.position.set(h,1.15,-2.5);let m=new M(new qe(.75,.08,12,32),new D({color:u,emissive:u,emissiveIntensity:.85,roughness:.2}));E.add(m);let f=new M(new Ct(.7,24),new Le({color:u,transparent:!0,opacity:.24,side:gt}));E.add(f),n.add(E),e.animatedProps.push({object:m,kind:"portal",phase:c*1.4,speed:1.6})}let a=new D({color:16317180,roughness:.9});for(let c=0;c<6;c++){let h=(c-2.5)*2.1,u=-1.2+c%2*.45,E=new M(new fe(.95+c%3*.25,12,10),a);E.scale.set(1.8,.55,1.1),E.position.set(h,u,-5.2-c%2*1.2),n.add(E)}let l=new M(new _e(.14,.14,1.6,12),new D({color:16436245,roughness:.35}));l.rotation.z=Math.PI/2,l.position.set(0,.35,-1),n.add(l),e.animatedProps.push({object:l,kind:"hazard",phase:0,speed:1.9})}function Xm(n,e){let t=new D({color:10576438,roughness:.92}),i=new M(new Ct(11,36),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new D({color:8142627,roughness:.88});for(let[l,c,h,u]of[[-3.4,-4.6,2.2,1.4],[.4,-5.8,2.8,1.9],[3.5,-4.3,2,1.3]]){let E=new M(new _e(u*.72,u,h,8),s);E.position.set(l,h*.5-.1,c),E.castShadow=!0,n.add(E)}let r=new D({color:12753761,roughness:.85});for(let l=-2;l<=2;l++){let c=new M(new vt(.18,.34,6,8),r);c.rotation.z=Math.PI/2,c.position.set(l*.56,.18,-2.3),c.castShadow=!0,n.add(c)}let o=new D({color:16436245,roughness:.5});for(let l of[-2.2,2.2]){let c=new M(new Qe(.22,.58,12),o);c.position.set(l,.29,-1.6),c.castShadow=!0,n.add(c)}let a=new Nt(16347926,2.4,8,1.5);a.position.set(0,1.4,-2.6),n.add(a),e.ambientFireLights.push({light:a,baseIntensity:2.4,phase:.6})}function Ym(n,e,t){let i=new D({color:15857145,roughness:.55}),s=new D({color:t%2===0?3359061:4988309,roughness:.55});for(let E=-4;E<=4;E++)for(let m=-3;m<=3;m++){let f=new M(new Z(.98,.06,.98),(E+m)%2===0?i:s);f.position.set(E,-.03,m),f.receiveShadow=!0,n.add(f)}let r=new D({color:t%3===0?5195493:t%3===1?1013358:11817737,roughness:.78});for(let E of[-2.45,2.45]){let m=new M(new Z(3.4,4.2,.25),r);m.position.set(E,2.1,-2.8),m.receiveShadow=!0,n.add(m)}let o=new M(new Z(1.7,1.4,.25),r);o.position.set(0,3.5,-2.8),n.add(o);let a=new D({color:8138002,roughness:.6});for(let E of[-.78,.78]){let m=new M(new Z(.14,2.85,.34),a);m.position.set(E,1.425,-2.8),n.add(m)}let l=new M(new Z(1.72,.16,.36),a);l.position.set(0,2.86,-2.8),n.add(l);let c=new he;c.position.set(-.7,0,-2.76);let h=new M(new Z(1.38,2.75,.08),new D({color:14251782,roughness:.5}));h.position.set(.69,1.375,0),h.castShadow=!0,c.add(h);let u=new M(new fe(.08,12,10),new D({color:16436245,metalness:.85,roughness:.2}));u.position.set(1.22,1.25,.07),c.add(u),n.add(c),e.animatedProps.push({object:c,kind:"door",phase:.3,speed:2.2})}function Mi(n,e){let t=e.width??12.6,i=e.height??5.4,s=e.backZ??-2.9,r=e.depth??10.5,o=new D({color:e.backColor,roughness:.82}),a=new D({color:e.sideColor??e.backColor,roughness:.84}),l=new M(new Z(t,i,.18),o);l.position.set(0,i*.5,s),l.receiveShadow=!0,n.add(l);let c=new M(new Z(.18,i,r),a);c.position.set(-t*.5+.09,i*.5,s+r*.5-.1),c.receiveShadow=!0,n.add(c);let h=new M(new Z(.18,i,r),a);h.position.set(t*.5-.09,i*.5,s+r*.5-.1),h.receiveShadow=!0,n.add(h);let u=e.trimColor??4674921,E=new D({color:u,roughness:.65}),m=new M(new Z(t,.16,.22),E);m.position.set(0,.08,s+.04),n.add(m);let f=new M(new Z(t,.35,r),E);f.position.set(0,i+.1,s+r*.5-.1),n.add(f);let d=new M(new Z(t,i,.2),o);d.position.set(0,i*.5,s+r-.15),n.add(d);let g=new M(new Z(t,.72,.22),E);return g.position.set(0,.36,s+r-.16),n.add(g),o}function qm(n,e){let t=new D({color:6044968,roughness:.78}),i=new M(new ft(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new M(new Z(3.6,.02,2.6),new D({color:10424889,roughness:.88}));s.position.set(0,.01,-.4),s.receiveShadow=!0,n.add(s),Mi(n,{backColor:3878738,sideColor:3221063,trimColor:6044968,backZ:-2.9});let r=new Nt(14412542,2.2,9.5,1.3);r.position.set(.75,2.65,.65),n.add(r),e.ambientFireLights.push({light:r,baseIntensity:2.2,phase:.1});let o=new M(new Z(1.5,1.55,.08),new D({color:8145446,roughness:.65}));o.position.set(1.15,2.25,-2.78),n.add(o);let a=new M(new ft(1.28,1.32),new Le({color:12248829}));a.position.set(1.15,2.25,-2.73),n.add(a);let l=new D({color:7877903,roughness:.62}),c=new he;c.position.set(-.88,0,-.58);let h=new M(new Z(1.52,.14,2.1),l);h.position.y=.24,h.castShadow=!0,h.receiveShadow=!0,c.add(h);for(let[x,w]of[[-.68,-.95],[.68,-.95],[-.68,.95],[.68,.95]]){let y=new M(new _e(.055,.045,.26,8),l);y.position.set(x,.13,w),y.castShadow=!0,c.add(y)}let u=new M(new Z(1.54,.72,.1),l);u.position.set(0,.56,-1),u.castShadow=!0,c.add(u);let E=new M(new Z(1.42,.16,1.94),new D({color:16708551,roughness:.8}));E.position.set(0,.38,.02),E.receiveShadow=!0,c.add(E);let m=new M(new Z(1.44,.18,1.24),new D({color:15357964,roughness:.75}));m.position.set(0,.39,.34),m.castShadow=!0,c.add(m);let f=new M(new Z(1.04,.14,.42),new D({color:16777215,roughness:.68}));f.position.set(0,.51,-.72),c.add(f),n.add(c);let d=new M(new Z(.55,.52,.52),l);d.position.set(-1.98,.26,-.82),d.castShadow=!0,n.add(d);let g=new M(new Qe(.18,.24,16,1,!0),new D({color:16638023,emissive:16096779,emissiveIntensity:.55,side:gt}));g.position.set(-1.98,.72,-.82),n.add(g);let p=new Nt(16758605,2.4,6.5,1.5);p.position.set(-1.98,.66,-.82),n.add(p),e.ambientFireLights.push({light:p,baseIntensity:2.4,phase:.7}),e.spots.bed={x:-.88,y:.47,z:.16,rotY:.16},e.spots.door={x:1.45,y:0,z:-1.35,rotY:-.35}}function Zm(n,e){let t=new M(new ft(14,14),new D({color:4141901,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new M(new Z(4,.02,2.8),new D({color:1013358,roughness:.86}));i.position.set(0,.01,-.2),i.receiveShadow=!0,n.add(i),Mi(n,{backColor:3359061,sideColor:2503236,trimColor:7027230,backZ:-2.95});let s=new D({color:14251782,roughness:.7}),r=new D({color:16707722,roughness:.68}),o=new he;o.position.set(-.78,0,-1.28);let a=new M(new Z(1.9,.36,.85),s);a.position.y=.22,a.castShadow=!0,a.receiveShadow=!0,o.add(a);let l=new M(new Z(1.9,.68,.22),s);l.position.set(0,.56,-.34),l.castShadow=!0,o.add(l);for(let x of[-.92,.92]){let w=new M(new Z(.18,.48,.86),s);w.position.set(x,.38,0),o.add(w)}let c=new M(new Z(.32,.28,.14),r);c.position.set(-.55,.48,-.14),c.rotation.z=.18,o.add(c),n.add(o);let h=new D({color:7027230,roughness:.55}),u=new he,E=new M(new Z(1.15,.08,.65),h);E.position.set(.08,.34,.12),E.castShadow=!0,u.add(E);let m=new M(new _e(.14,.09,.08,16),new D({color:16317180,roughness:.35}));m.position.set(.08,.42,.12),u.add(m),n.add(u),e.livingRoomTableGroup=u;let f=new M(new Z(1.1,.78,.06),h);f.position.set(-.7,2.15,-2.84),n.add(f);let d=new M(new ft(.92,.62),new D({color:16498468,roughness:.5}));d.position.set(-.7,2.15,-2.8),n.add(d);let g=new he;g.position.set(1.25,0,-2.7);let p=new M(new Z(.95,2.25,.08),h);p.position.set(.475,1.125,0),p.castShadow=!0,g.add(p),n.add(g),e.animatedProps.push({object:g,kind:"door",phase:.4,speed:.85}),e.spots.sofa={x:-.78,y:.38,z:-.74,rotY:.25},e.spots.door={x:1.45,y:0,z:-1.4,rotY:-.4}}function Jm(n,e){let t=new M(new ft(14,14),new D({color:3359061,roughness:.6}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new ds(12,16,9741240,4674921);i.position.y=.01,n.add(i),Mi(n,{backColor:10105874,sideColor:8138002,trimColor:16639626,backZ:-2.85});let s=new M(new Z(6.8,.92,.05),new D({color:16708551,roughness:.55}));s.position.set(0,1.32,-2.74),n.add(s);let r=new D({color:4674921,roughness:.55}),o=new D({color:14870768,roughness:.3}),a=new M(new Z(3.2,.88,.9),r);a.position.set(0,.44,-1.45),a.castShadow=!0,a.receiveShadow=!0,n.add(a);let l=new M(new Z(3.28,.07,.96),o);l.position.set(0,.91,-1.45),n.add(l);let c=new Le({color:3718648}),h=new M(new qe(.18,.025,8,20),c);h.rotation.x=Math.PI/2,h.position.set(-.22,.96,-1.4),n.add(h),e.animatedProps.push({object:h,kind:"diya",phase:0,speed:9});let u=new D({color:14251782,metalness:.72,roughness:.25}),E=new M(new _e(.32,.22,.26,20),u);E.position.set(-.22,1.1,-1.4),E.castShadow=!0,n.add(E);let m=new M(new Ct(.3,20),new D({color:16708551,roughness:.28}));m.rotation.x=-Math.PI/2,m.position.set(-.22,1.22,-1.4),n.add(m);for(let g=0;g<5;g++){let p=new M(new fe(.075,8,8),new Le({color:16777215,transparent:!0,opacity:.3,depthWrite:!1}));p.position.set(-.22+(g%3-1)*.08,1.32+g*.14,-1.4),n.add(p),e.animatedProps.push({object:p,kind:"steam",baseY:1.28,phase:g*1.1,speed:1.7})}let f=new M(new Z(2.6,.08,.32),new D({color:7877903,roughness:.65}));f.position.set(0,1.85,-2.6),n.add(f);for(let g=-2;g<=2;g++){let p=[15680580,16096779,2278750,3900150,15381256][g+2],x=new M(new _e(.075,.075,.22,12),new D({color:p,roughness:.35}));x.position.set(g*.42,2,-2.58),n.add(x)}let d=new Nt(16775149,3.3,9.5,1.25);d.position.set(0,2.75,.45),n.add(d),e.ambientFireLights.push({light:d,baseIntensity:3.3,phase:.2}),e.spots.counter={x:-.42,y:0,z:-.68,rotY:.3},e.spots.door={x:1.35,y:0,z:-1.15,rotY:-.45}}function dr(n,e,t,i,s,r,o="#0f172a",a="#f59e0b"){let l=document.createElement("canvas");l.width=512,l.height=192;let c=l.getContext("2d");c.fillStyle=o,c.fillRect(0,0,512,192),c.strokeStyle=a,c.lineWidth=10,c.strokeRect(10,10,492,172),c.fillStyle=a,c.font="bold 42px sans-serif",c.textAlign="center",c.fillText(e,256,86),c.fillStyle="#e2e8f0",c.font="600 24px sans-serif",c.fillText(t,256,138);let h=new Wn(l);h.colorSpace=kt;let u=new M(new Z(1.48,.56,.05),new D({color:1976635,roughness:.45,metalness:.4}));u.position.set(i,s,r-.02),n.add(u);let E=new M(new ft(1.38,.48),new Le({map:h}));E.position.set(i,s,r+.01),n.add(E)}function Km(n,e){let t=new M(new ft(14,14),new D({color:4860970,roughness:.75}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),Mi(n,{backColor:8138002,sideColor:6037518,trimColor:16096779,backZ:-2.9}),dr(n,"MITHAI & KESHAV","FRESH SHAHI HALWAI",0,2.75,-2.76,"#431407","#fbbf24");let i=new D({color:8138002,roughness:.58}),s=new M(new Z(2.8,.92,.85),i);s.position.set(0,.46,-1.45),s.castShadow=!0,s.receiveShadow=!0,n.add(s);let r=new D({color:14870768,metalness:.85,roughness:.2}),o=new D({color:16096779,roughness:.45}),a=new D({color:16708551,roughness:.38});for(let h of[-.65,0,.65]){let u=new M(new Z(.52,.04,.48),r);u.position.set(h,.94,-1.42),n.add(u);for(let E=-.14;E<=.15;E+=.14)for(let m=-.1;m<=.12;m+=.14){let f=h===0?new M(new Z(.11,.08,.11),a):new M(new fe(.06,10,8),o);f.position.set(h+E,1,-1.42+m),n.add(f)}}let l=new M(new Z(3.2,.1,1.2),new D({color:15357964,roughness:.65}));l.position.set(0,2.35,-1.35),l.rotation.x=.18,n.add(l);for(let h=-5;h<=5;h++){let u=new M(new fe(.075,10,8),new D({color:h%2===0?16096779:16436245,roughness:.6}));u.position.set(h*.28,2.15-Math.cos(h*.35)*.14,-.82),n.add(u)}let c=new Nt(16758605,3,8,1.4);c.position.set(0,2.15,-1),n.add(c),e.ambientFireLights.push({light:c,baseIntensity:3,phase:.5}),e.spots.counter={x:.38,y:0,z:-.62,rotY:.22}}function nu(n,e,t,i,s,r,o,a,l=512,c=256){let h=new he;h.position.set(i,s,r),h.rotation.y=o;let u=new M(new Z(e+.2,t+.2,.08),a);u.position.z=-.045,h.add(u);let E=new hr(new ft(e,t),{clipBias:.003,textureWidth:l,textureHeight:c,color:14412542,multisample:0});E.position.z=.002,h.add(E);let m=new M(new ft(.07,t*.92),new Le({color:16777215,transparent:!0,opacity:.16}));m.position.set(-e*.34,0,.006),m.rotation.z=-.35,h.add(m),n.add(h)}function $m(n,e){let t=new D({color:3359061,roughness:.42,metalness:.12}),i=new D({color:6583435,roughness:.45,metalness:.08}),s=new M(new ft(14,14),t);s.rotation.x=-Math.PI/2,s.receiveShadow=!0,n.add(s);for(let F=-4;F<=4;F++)for(let q=-4;q<=3;q++){if((F+q)%2!==0)continue;let J=new M(new ft(.95,.95),i);J.rotation.x=-Math.PI/2,J.position.set(F*1,.004,q*1),J.receiveShadow=!0,n.add(J)}Mi(n,{backColor:16051425,sideColor:15129288,trimColor:1013358,backZ:-2.9});let r=new M(new Z(12.6,1.02,.21),new D({color:1013358,roughness:.45}));r.position.set(0,.51,-2.86),n.add(r),dr(n,"SHAHI SALON","KESHAV STUDIO \u2022 VIP CUTS",2.34,2.26,-2.75,"#0f172a","#f59e0b"),dr(n,"STYLE CHART","1. BAHUBALI  2. FADE  3. KATORA",2.34,1.64,-2.75,"#1e293b","#38bdf8");let o=new D({color:14870768,metalness:.88,roughness:.16});nu(n,3.25,1.38,-.25,1.92,-2.7,0,o,512,256);let a=new M(new _e(.032,.032,.65,10),o);a.rotation.z=Math.PI/2,a.position.set(-2.5,1.62,-.88),n.add(a),nu(n,1.42,1.18,-2.14,1.62,-.78,1.04,o,384,320);let l=new M(new Z(2.8,.08,.14),new Le({color:16776171}));l.position.set(-.25,2.78,-2.7),n.add(l);let c=new Nt(16776171,3.2,9.5,1.3);c.position.set(-.25,2.65,-1.25),n.add(c);let h=new M(new Z(3.6,.08,.22),new Le({color:16708551}));h.position.set(0,3.85,1.2),n.add(h);let u=new D({color:1013358,roughness:.48}),E=new M(new Z(6.4,1.2,.12),u);E.position.set(0,1.85,7.25),n.add(E);let m=new M(new Z(2.6,.015,2.2),new D({color:1013358,roughness:.9}));m.position.set(-.55,.008,-.78),m.receiveShadow=!0,n.add(m);let f=new he;f.position.set(3.48,1.68,-2.55);let d=new M(new _e(.11,.11,.92,16),new D({color:16317180,roughness:.25}));f.add(d),[14427686,2450411,14427686].forEach((F,q)=>{let J=new M(new qe(.112,.028,8,18),new D({color:F,roughness:.3}));J.rotation.x=Math.PI/2+.42,J.position.y=-.26+q*.26,f.add(J)});let g=new D({color:13948120,metalness:.85,roughness:.2});for(let F of[-.5,.5]){let q=new M(new fe(.125,12,10),g);q.position.y=F,f.add(q)}n.add(f),e.animatedProps.push({object:f,kind:"hazard",phase:0,speed:3.2});let p=new M(new Z(.75,.72,.56),new D({color:16317180,roughness:.32}));p.position.set(-2.98,.36,-2.42),n.add(p);let x=new M(new _e(.28,.2,.18,16),new D({color:16777215,roughness:.22}));x.position.set(-2.98,.78,-2.38),n.add(x);let w=new M(new _e(.02,.02,.24,8),o);w.position.set(-2.98,.92,-2.58),n.add(w);let y=new M(new Z(3.3,.08,.36),new D({color:7029795,roughness:.6}));y.position.set(-.25,1.02,-2.6),n.add(y),[14753096,959977,16096779,1096065,9133302].forEach((F,q)=>{let J=new M(new _e(.055,.055,.22,10),new D({color:F,roughness:.3}));J.position.set(-1.2+q*.48,1.17,-2.55),n.add(J)});let R=new he;R.position.set(.96,0,-1.26);let S=new M(new Z(.46,.8,.36),new D({color:1976635,roughness:.5}));S.position.y=.42,R.add(S);let A=new M(new Z(.5,.05,.4),o);A.position.y=.84,R.add(A);let C=new M(new _e(.04,.052,.16,10),new D({color:959977,roughness:.3}));C.position.set(-.14,.94,.04),R.add(C);let _=new M(new Z(.05,.05,.14),o);_.position.set(0,.89,.06),R.add(_),[16708551,14742270].forEach((F,q)=>{let J=new M(new Z(.2,.055,.22),new D({color:F,roughness:.85}));J.position.set(.11,.895+q*.056,-.02),R.add(J)}),n.add(R);let T=new he;T.position.set(-.44,0,-.78),T.rotation.y=.2;let L=new D({color:12131356,roughness:.42}),G=new M(new _e(.36,.4,.08,18),o);G.position.y=.04,T.add(G);let U=new M(new _e(.08,.1,.42,12),o);U.position.y=.25,T.add(U);let k=new M(new Z(.76,.16,.72),L);k.position.y=.46,k.castShadow=!0,T.add(k);let X=new M(new Z(.74,.76,.14),L);X.position.set(0,.84,-.32),X.rotation.x=-.14,X.castShadow=!0,T.add(X);for(let F of[-.41,.41]){let q=new M(new Z(.08,.08,.62),o);q.position.set(F,.68,0),T.add(q)}let V=new M(new Z(.46,.05,.22),o);V.position.set(0,.22,.48),T.add(V),n.add(T);let te=new M(new Z(1.9,.42,.68),new D({color:2450411,roughness:.6}));te.position.set(1.76,.21,-1.68),te.castShadow=!0,n.add(te),e.spots.sofa={x:-.44,y:.28,z:-.66,rotY:.18},e.spots.counter={x:.34,y:0,z:-.96,rotY:-.36},e.spots.door={x:1.76,y:0,z:-1.45,rotY:-.35}}function Qm(n,e){let t=new M(new ft(14,14),new D({color:4927003,roughness:.68}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new D({color:7029795,roughness:.62});Mi(n,{backColor:7029795,sideColor:5715482,trimColor:9584654,backZ:-2.9}),dr(n,"SATYAMEVA JAYATE","KESHAV DISTRICT COURT",0,3.05,-2.76,"#451a03","#f59e0b");let s=new M(new Z(3.4,1.25,1),i);s.position.set(0,.62,-1.9),s.castShadow=!0,n.add(s);let r=new M(new qe(.32,.04,10,24),new D({color:16096779,metalness:.85,roughness:.2}));r.position.set(0,2.4,-2.76),n.add(r);let o=new M(new Z(1.1,.92,.9),i);o.position.set(-.95,.46,-.55),o.castShadow=!0,n.add(o),e.spots.sofa={x:0,y:.42,z:-1.45,rotY:.08},e.spots.counter={x:-.95,y:.1,z:-.35,rotY:.38}}function jm(n,e){let t=new M(new ft(14,14),new D({color:14412542,roughness:.52}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),Mi(n,{backColor:16317180,sideColor:14870768,trimColor:165063,backZ:-2.9}),dr(n,"CITY CLINIC","DR. DIAGNOSTICS \u2022 OPD 1",2.25,2.35,-2.75,"#0c4a6e","#38bdf8");let i=new Le({color:15680580}),s=new M(new Z(.22,.72,.05),i);s.position.set(0,2.35,-2.78),n.add(s);let r=new M(new Z(.72,.22,.05),i);r.position.set(0,2.35,-2.78),n.add(r);let o=new M(new Z(1.8,.52,.88),new D({color:959977,roughness:.6}));o.position.set(-.95,.26,-.88),o.castShadow=!0,n.add(o);let a=new M(new Z(1.4,.75,.72),new D({color:6583435,roughness:.5}));a.position.set(.85,.38,-.85),a.castShadow=!0,n.add(a),e.spots.bed={x:-.95,y:.52,z:-.82,rotY:.32},e.spots.sofa={x:.85,y:0,z:-.45,rotY:-.35}}function eE(n,e){let t=new M(new ft(14,14),new D({color:7887420,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),Mi(n,{backColor:16708551,sideColor:16639626,trimColor:7877903,backZ:-2.9});let i=new M(new Z(4.2,1.55,.08),new D({color:7877903,roughness:.6}));i.position.set(0,1.95,-2.78),n.add(i);let s=new M(new ft(3.95,1.32),new D({color:1332013,roughness:.9}));s.position.set(0,1.95,-2.73),n.add(s);let r=[16750899,16777215,1280008];for(let a=-5;a<=5;a++){let l=new M(new Qe(.11,.22,4),new D({color:r[(a+5)%3],roughness:.5}));l.rotation.x=Math.PI,l.position.set(a*.42,3.05-Math.cos(a*.28)*.16,-1.6),n.add(l),e.animatedProps.push({object:l,kind:"sway",phase:a*.4,speed:2.1})}let o=new M(new Z(.9,.85,.65),new D({color:7877903,roughness:.6}));o.position.set(-.85,.42,-.75),n.add(o),e.spots.sofa={x:.8,y:0,z:-.45,rotY:-.4},e.spots.counter={x:-.85,y:0,z:-.45,rotY:.35}}function tE(n,e){let t=new M(new ft(14,14),new D({color:593188,roughness:.35,metalness:.3}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new Le({color:3718648}),s=new M(new qe(2.15,.06,12,48),i);s.rotation.x=Math.PI/2,s.position.set(0,.04,0),n.add(s),e.animatedProps.push({object:s,kind:"ring",phase:0,speed:.4});let r=new M(new qe(2.7,.08,12,48),new Le({color:11032055}));r.position.set(0,1.9,-2.5),n.add(r),e.animatedProps.push({object:r,kind:"portal",phase:.4,speed:.8});let o=new D({color:1976635,metalness:.55,roughness:.3});[-.95,.95].forEach(l=>{let c=new M(new _e(.38,.44,.82,16),o);c.position.set(l,.41,-.35),c.castShadow=!0,n.add(c)});let a=new Ii(3718648,8.5,16,Math.PI/5,.4);a.position.set(0,4.6,1.5),n.add(a),n.add(a.target),e.animatedProps.push({object:a,kind:"spotlight",phase:0,speed:1.5})}function nE(n,e){let t=new M(new ft(14,14),new D({color:7041664,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new D({color:10105874,roughness:.82}),s=new D({color:16708551,roughness:.55}),r=new Le({color:16638023});[-2.6,2.6].forEach(h=>{let u=new M(new Z(3,2.2,.28),i);u.position.set(h,1.1,-2.4),u.castShadow=!0,n.add(u)}),[-1.08,1.08].forEach(h=>{let u=new M(new Z(.38,2.55,.38),i);u.position.set(h,1.28,-2.35),u.castShadow=!0,n.add(u);let E=new M(new Z(.46,.12,.46),s);E.position.set(h,2.58,-2.35),n.add(E);let m=new M(new fe(.11,10,8),r);m.position.set(h,2.74,-2.35),n.add(m)});let o=new he;o.position.set(-.92,0,-2.35);let a=new D({color:1976635,metalness:.65,roughness:.35});for(let h of[.35,1.85]){let u=new M(new Z(1.84,.08,.08),a);u.position.set(.92,h,0),o.add(u)}for(let h=0;h<=7;h++){let u=new M(new _e(.025,.025,2.05,8),a);u.position.set(.08+h*.24,1.05,0),u.castShadow=!0,o.add(u)}let l=new M(new Z(.14,.16,.08),new D({color:16096779,metalness:.85,roughness:.2}));l.position.set(1.72,1.12,.08),o.add(l),n.add(o),e.animatedProps.push({object:o,kind:"door",phase:.1,speed:.7});let c=new M(new _e(.09,.11,3.8,12),new D({color:4674921,metalness:.5,roughness:.5}));c.position.set(2.15,1.9,-1.6),n.add(c),ur(n,-2.75,-1.25,1.05,1409085,.3,e),e.spots.door={x:0,y:0,z:-1.35,rotY:.1}}function iE(n,e){let t=new D({color:3875606,roughness:.72}),i=new D({color:6042653,roughness:.65}),s=new D({color:16041038,metalness:.85,roughness:.25}),r=new D({color:1920728,roughness:.45,metalness:.2}),o=new D({color:8330525,roughness:.82}),a=new M(new Ct(10,44),t);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,n.add(a);let l=new M(new Z(3.6,.02,2.2),o);l.position.set(0,.015,.1),l.receiveShadow=!0,n.add(l);for(let d of[-2.4,2.4]){let g=new M(new Z(2,3.1,.45),i);g.position.set(d,1.55,-2.9),g.castShadow=!0,n.add(g);for(let p of[.85,1.65,2.45]){let x=new M(new Z(1.75,.22,.48),s);x.position.set(d,p,-2.9),n.add(x)}}let c=new M(new _e(.42,.56,1.05,20),i);c.position.set(0,.525,-2.35),c.castShadow=!0,n.add(c);let h=new he;h.position.set(0,1.55,-2.35);let u=new M(new fe(.46,24,18),r);h.add(u);let E=new M(new qe(.55,.032,10,42),s);h.add(E);let m=new M(new qe(.51,.024,10,42),s);m.rotation.x=Math.PI/2,h.add(m),n.add(h),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.45});let f=new Nt(16639626,3.2,8,1.4);f.position.set(0,2.65,-1.65),n.add(f),e.ambientFireLights.push({light:f,baseIntensity:3.2,phase:.4})}function sE(n,e,t){let i=new D({color:988970,roughness:.5,metalness:.25}),s=new D({color:1976635,roughness:.45,metalness:.35}),r=new Le({color:t||"#38bdf8"}),o=new M(new Ct(10,44),i);o.rotation.x=-Math.PI/2,o.receiveShadow=!0,n.add(o);let a=new M(new qe(2.3,.04,10,48),r);a.rotation.x=Math.PI/2,a.position.y=.02,n.add(a);let l=[[-3.6,-4.2,1.1,4.2],[-2.1,-4.6,1,5.1],[-.4,-5,1.25,5.8],[1.4,-4.6,1,4.8],[3.1,-4.2,1.15,4]];for(let[u,E,m,f]of l){let d=new M(new Z(m,f,.9),s);d.position.set(u,f*.5,E),n.add(d);for(let g=1;g<f-.5;g+=.95){let p=new M(new Z(m*.72,.14,.94),r);p.position.set(u,g,E),n.add(p)}}let c=new M(new qe(1.8,.035,10,48),r);c.position.set(0,2.6,-3.1),n.add(c),e.animatedProps.push({object:c,kind:"ring",phase:.4,speed:.35});let h=new Nt(t||"#38bdf8",2.8,9,1.4);h.position.set(0,2.8,-1.8),n.add(h),e.ambientFireLights.push({light:h,baseIntensity:2.8,phase:.6})}function iu(n,e,t,i,s){let{top:r,mid:o,bot:a,sunColor:l,sunIntensity:c,fogDensity:h}=Lm(i,e.palette);n.fog=new ks(o,h);let u=new fe(28,32,20),E=new Yt({side:qt,depthWrite:!1,uniforms:{uTop:{value:new Ve(r)},uMid:{value:new Ve(o)},uBot:{value:new Ve(a)}},vertexShader:`
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uBot;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y * 1.4 + 0.35, 0.0, 1.0);
        vec3 col = h < 0.5 ? mix(uBot, uMid, h * 2.0) : mix(uMid, uTop, (h - 0.5) * 2.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `}),m=new M(u,E);n.add(m);let f=new Qs(l,a,.85);n.add(f);let d=new us(l,c);d.position.set(2.8,5.2,3.8),d.castShadow=!0,d.shadow.mapSize.set(1024,1024),d.shadow.camera.near=.5,d.shadow.camera.far=16,d.shadow.camera.left=-4,d.shadow.camera.right=4,d.shadow.camera.top=4,d.shadow.camera.bottom=-4,d.shadow.bias=-8e-4,n.add(d);let g=new us(e.palette.secondaryHex,.65);g.position.set(-3,3.4,-3.5),n.add(g);let p=new he;n.add(p);let x={group:p,skyMaterial:E,keyLight:d,hemiLight:f,ambientFireLights:[],animatedProps:[],backdropTextures:s,spots:{}};if(s.length>0&&e.stageLayout?.templateBackdrop){let w=new M(new ft(14,14),new Ks({opacity:.42}));w.rotation.x=-Math.PI/2,w.receiveShadow=!0,p.add(w);let y=e.width/e.height,R=6.2,S=R*y,A=new M(new ft(S,R),new Le({map:s[0],depthWrite:!1}));return A.position.set(0,1.32,-2.1),p.add(A),x.backdropMesh=A,x}if(s.length>0){let w=e.width/e.height,y=11.2,R=y*w,S=new M(new ft(R,y),new Le({map:s[0],depthWrite:!1,fog:!1}));S.position.set(0,2.75,-6.5),p.add(S),x.backdropMesh=S}switch(t){case"Temple":Bm(p,x);break;case"ForestAshram":Gm(p,x);break;case"RiverGhat":Um(p,x);break;case"Cosmos":Fm(p,x,e.palette.primaryHex);break;case"ComedyStage":Nm(p,x);break;case"ChaiStall":km(p,x);break;case"SkyGauntlet":Wm(p,x,e.uniqueVariant??e.seed??0);break;case"TankArena":Xm(p,x);break;case"DoorwaySet":Ym(p,x,e.uniqueVariant??e.seed??0);break;case"Himalaya":Om(p,x);break;case"PalaceCourt":{let w=[e.title,e.leftCharacter?.name,e.rightCharacter?.name,...e.supportingCast.map(R=>R.name)].join(" "),y=/narasimha|narsimha|hiranyakashipu|prahlad|नरसिंह|नृसिंह|हिरण्यकशिपु|प्रह्लाद|खंभ|स्तंभ/i.test(w);zm(p,x,y);break}case"Bedroom":qm(p,x);break;case"LivingRoom":Zm(p,x);break;case"Kitchen":Jm(p,x);break;case"SweetShop":Km(p,x);break;case"BarberShop":$m(p,x);break;case"Courtroom":Qm(p,x);break;case"DoctorClinic":jm(p,x);break;case"Classroom":eE(p,x);break;case"QuizStudio":tE(p,x);break;case"Archive":iE(p,x);break;case"ModernCity":sE(p,x,e.palette.primaryHex);break;case"NeighborhoodGate":nE(p,x);break;default:Vm(p,t,x,e.palette.primaryHex);break}return(t==="Temple"||t==="PalaceCourt"||t==="Himalaya"||t==="ForestAshram"||t==="RiverGhat"||t==="Cosmos")&&(x.trialProps=Qh(p)),t==="LivingRoom"&&(x.comedyGags=eu(p)),x}function su(n,e,t,i,s,r,o=!1,a="none",l=0,c=.5,h){for(let u of n.ambientFireLights)u.light.intensity=u.baseIntensity*(.86+.14*Math.sin(e*9.5+u.phase));for(let u of n.animatedProps)if(u.kind==="bell")u.object.rotation.z=Math.sin(e*u.speed+u.phase)*.16;else if(u.kind==="sway")u.object.rotation.z=Math.sin(e*u.speed+u.phase)*.035;else if(u.kind==="ring")u.object.rotation.z=e*u.speed+u.phase,u.object.rotation.y=Math.sin(e*.4+u.phase)*.25;else if(u.kind==="diya")u.object.scale.y=.85+.22*Math.sin(e*u.speed+u.phase),u.object.scale.x=.92+.12*Math.cos(e*u.speed*1.1+u.phase);else if(u.kind==="steam"){let E=(e*.55+u.phase)%1;u.object.position.y=(u.baseY??1.16)+E*.65,u.object.scale.setScalar(.75+E*1.15);let m=u.object.material;m.opacity=Math.sin(E*Math.PI)*.28}else if(u.kind==="spotlight"){let E=u.object;E.target.position.set(Math.sin(e*u.speed+u.phase)*1.1,.8,0),E.target.updateMatrixWorld()}else if(u.kind==="portal"){u.object.rotation.z=e*u.speed+u.phase;let E=.94+.08*Math.sin(e*3.8+u.phase);u.object.scale.setScalar(E)}else u.kind==="door"?u.object.rotation.y=.35+Math.sin(e*u.speed+u.phase)*.48:u.kind==="hazard"&&(u.object.rotation.y=e*u.speed+u.phase);if(n.poleStarGroup&&n.poleStarMat){let u=Math.max(0,Math.min(1,(t-.55)/.35));n.poleStarGroup.visible=u>.02,n.poleStarGroup.rotation.y=e*.8,n.poleStarMat.opacity=u*.28}if(n.stambhaWholeGroup&&n.stambhaBrokenGroup&&(n.stambhaWholeGroup.visible=!o,n.stambhaBrokenGroup.visible=o),n.stambhaFireLights){let u=o?3.8+Math.sin(e*14)*.55:0;n.stambhaFireLights.forEach(E=>{E.intensity=u})}if(n.trialProps&&jh(n.trialProps,e,a,l,c),n.livingRoomTableGroup&&(n.livingRoomTableGroup.visible=!h?.hasFuneralShroud),n.comedyGags&&tu(n.comedyGags,e,h?.hasFuneralShroud??!1,h?.shroudOpen??!1,h?.hazardMode??"none",c),n.backdropMesh&&n.backdropTextures.length>0){let u=Math.max(0,i)%n.backdropTextures.length,E=n.backdropMesh.material;if(E.map!==n.backdropTextures[u]&&(E.map=n.backdropTextures[u],E.needsUpdate=!0),r?.templateBackdrop){let m=r.templateMotion==="AutoSmooth"?["GentleZoom","OrbitRound","ZoomOut","SlowPan","GentleRotate"][Math.max(0,i>=0?i:Math.floor(e/5.5))%5]:r.templateMotion;if(n.backdropMesh.rotation.z=0,n.backdropMesh.position.y=1.32,m==="GentleZoom"){let f=1+.06*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(f),n.backdropMesh.position.x=0}else if(m==="ZoomOut"){let f=1.1-.09*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(f),n.backdropMesh.position.x=0}else if(m==="SlowPan")n.backdropMesh.scale.setScalar(1.08),n.backdropMesh.position.x=Math.sin(e*Math.PI*2/32)*.16;else if(m==="OrbitRound"){let f=e*Math.PI*2/22;n.backdropMesh.scale.setScalar(1.1),n.backdropMesh.position.x=Math.sin(f)*.13,n.backdropMesh.position.y=1.32+(Math.sin(f+1.25)-Math.sin(1.25))*.055}else if(m==="GentleRotate"){let f=1.08+.03*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(f),n.backdropMesh.position.x=0,n.backdropMesh.rotation.z=.032*Math.sin(e*Math.PI*2/18)}else n.backdropMesh.scale.setScalar(1),n.backdropMesh.position.x=0}else{let m=s*s*(3-2*s);n.backdropMesh.scale.setScalar(1.04+.09*m),n.backdropMesh.position.x=(u%2===0?1:-1)*.14*(m-.5)}}}function ru(n,e,t,i,s,r){let o=new he;n.add(o);let a=document.createElement("canvas");a.width=64,a.height=64;let l=a.getContext("2d"),c=l.createRadialGradient(32,32,2,32,32,30);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.35,"rgba(255,255,255,0.75)"),c.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);let h=new Wn(a),u="upward";t==="ComedyBurst"||e==="ComedyStage"?u="star":e==="ForestAshram"?u="firefly":e==="Himalaya"?u="snow":(t==="DivineAura"||e==="PalaceCourt")&&(u="petal");let E=110,m=new Float32Array(E*3),f=new Float32Array(E*3),d=new Float32Array(E*3),g=new Ve(i),p=new Ve(s),x=new Ve(16775126),w=(r^2654435769)>>>0,y=()=>(w=Math.imul(1664525,w)+1013904223>>>0,w/4294967296);for(let me=0;me<E;me++){let oe=(y()-.5)*6.2,Ae=y()*4.2,P=(y()-.5)*4.5-.4;m[me*3]=oe,m[me*3+1]=Ae,m[me*3+2]=P,d[me*3]=y()*6.283,d[me*3+1]=.4+y()*.9,d[me*3+2]=oe;let se=me%3===0?g:me%3===1?p:x;f[me*3]=se.r,f[me*3+1]=se.g,f[me*3+2]=se.b}let R=new It;R.setAttribute("position",new Xt(m,3)),R.setAttribute("color",new Xt(f,3));let S=new Ci({size:u==="star"?.065:.12,map:h,vertexColors:!0,transparent:!0,opacity:u==="star"?.16:.78,blending:Hn,depthWrite:!1}),A=new ls(R,S);u==="star"&&(A.visible=!1),o.add(A);let C=36,_=new Float32Array(C*3),T=new It;T.setAttribute("position",new Xt(_,3));let L=new Ci({size:.16,map:h,color:16638023,transparent:!0,opacity:0,blending:Hn,depthWrite:!1}),G=new ls(T,L);o.add(G);let U=[];if(e!=="ModernCity"&&u!=="star")for(let me=0;me<4;me++){let oe=new Yt({transparent:!0,depthWrite:!1,side:gt,blending:Hn,uniforms:{uColor:{value:new Ve(i)},uOpacity:{value:.08}},vertexShader:`
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float rim = pow(abs(dot(normalize(vNormal), normalize(vViewDir))), 2.2);
            float vertFade = smoothstep(0.0, 0.55, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
            gl_FragColor = vec4(uColor, uOpacity * rim * vertFade);
          }
        `}),Ae=new M(new Qe(.85,7.2,20,1,!0),oe);Ae.position.set(-1.6+me*1.05,2.6,-1.9),Ae.rotation.z=-.32+me*.1,o.add(Ae),U.push(Ae)}let k=[];for(let me=0;me<7;me++){let oe=new M(new fe(.036,10,8),new Le({color:s,transparent:!0,opacity:0,blending:Hn,depthWrite:!1}));o.add(oe),k.push(oe)}let X=new he,V=new Le({color:8246268,transparent:!0,opacity:.85});for(let me=0;me<3;me++){let oe=new he,Ae=.06+me*.028,P=new M(new Z(Ae*1.6,Ae*.35,Ae*.35),V);P.position.y=Ae*.7;let se=new M(new Z(Ae*1.8,Ae*.32,Ae*.35),V);se.rotation.z=.72;let be=new M(new Z(Ae*1.6,Ae*.35,Ae*.35),V);be.position.y=-Ae*.7,oe.add(P,se,be),X.add(oe)}X.visible=!1,o.add(X);let te=new he,F=new Le({color:16436245,side:gt});for(let me=0;me<6;me++){let oe=me/6*Math.PI*2,Ae=new M(new Qe(.036,.16,4),F);Ae.position.set(Math.cos(oe)*.22,Math.sin(oe)*.22,0),Ae.rotation.z=oe-Math.PI/2,te.add(Ae)}te.visible=!1,o.add(te);let q=new he,J=new Le({color:16638023});for(let me=0;me<3;me++){let oe=new M(new Lt(.068,0),J);q.add(oe)}q.visible=!1,o.add(q);let xe=new he,Ie=new Le({color:14870768,transparent:!0,opacity:.55});for(let me=0;me<4;me++){let oe=new M(new fe(.085,8,6),Ie);xe.add(oe)}xe.visible=!1,o.add(xe);let Ue=new he,K=new Le({color:1120295,transparent:!0,opacity:.94});for(let me=0;me<12;me++){let oe=new M(new Z(.068,.022,.024),K);Ue.add(oe)}Ue.visible=!1,o.add(Ue);let pe=new he,Q=new Le({color:16708338,transparent:!0,opacity:.85}),re=new Le({color:15680580,transparent:!0,opacity:.92});for(let me=0;me<6;me++){let oe=new M(new fe(.065+me%2*.022,8,6),me%3===2?re:Q);pe.add(oe)}pe.visible=!1,o.add(pe);let ce=new he,ne=new Le({color:8246268,transparent:!0,opacity:.82});for(let me=0;me<10;me++){let oe=new M(new fe(.024,6,5),ne);ce.add(oe)}ce.visible=!1,o.add(ce);let $=new he,Me=[16436245,16638023,3718648,16020150,4906624];for(let me=0;me<10;me++){let oe=new M(new Lt(.062+me%2*.025,0),new Le({color:Me[me%Me.length],transparent:!0,opacity:.94}));$.add(oe)}$.visible=!1,o.add($);let ye=new he,ve=new Le({color:13358561,transparent:!0,opacity:.72}),b=new Le({color:15857145,transparent:!0,opacity:.78});for(let me=0;me<8;me++){let oe=new M(new fe(.095+me%3*.028,8,6),me%2===0?ve:b);ye.add(oe)}return ye.visible=!1,o.add(ye),{group:o,ambientPoints:A,ambientPositions:m,ambientSeeds:d,burstPoints:G,burstPositions:_,burstMat:L,streamDots:k,godRays:U,particleMode:u,sleepZGroup:X,shockBurstGroup:te,dizzyStarsGroup:q,dustGroup:xe,hairCutGroup:Ue,angrySteamGroup:pe,sprayMistGroup:ce,celebrateStarsGroup:$,brakeSmokeGroup:ye}}function ou(n,e,t,i,s,r,o,a,l,c,h="none",u="none",E=0,m=0,f=!1,d="calm",g="calm",p=!1,x=null){let w=n.ambientPositions.length/3,y=n.particleMode==="snow"||n.particleMode==="petal"&&t>.6;for(let $=0;$<w;$++){let Me=n.ambientSeeds[$*3],ye=n.ambientSeeds[$*3+1],ve=n.ambientSeeds[$*3+2];if(n.particleMode==="firefly")n.ambientPositions[$*3]=ve+Math.sin(e*.9*ye+Me)*.45,n.ambientPositions[$*3+1]=.4+(($*.17+Math.sin(e*.65+Me)*.6)%2.8+2.8)%2.8;else{let b=((e*.14*ye+Me*.15)%1+1)%1;n.ambientPositions[$*3]=ve+Math.sin(e*1.1+Me)*.25,n.ambientPositions[$*3+1]=y?3.9-b*3.8:.15+b*3.8}}n.ambientPoints.geometry.attributes.position.needsUpdate=!0;for(let $=0;$<n.godRays.length;$++){let ye=n.godRays[$].material;ye.uniforms.uOpacity.value=.075+.04*Math.sin(e*.8+$*1.1)}let R=n.particleMode==="star",S=i==="Left"||i==="Right",A=i==="Left"?l:c;for(let $=0;$<n.streamDots.length;$++){let Me=n.streamDots[$],ye=Me.material;if(!S||R){ye.opacity=0;continue}let ve=i==="Left"?s+.2:r-.2,b=i==="Left"?r-.2:s+.2,me=(e*1.35+$/n.streamDots.length)%1;Me.position.set(ve+(b-ve)*me,1.38+Math.sin(me*Math.PI)*.42+Math.sin(e*7+$)*.03,-.38+Math.cos(e*6+$)*.06),ye.color.set(A),ye.opacity=Math.sin(me*Math.PI)*.22}if(S&&(R?f:(o==="laughing"||o==="surprised"||o==="proud"||f)&&(a<.4||f))){let $=Math.min(1,a/.4),Me=i==="Left"?s:r;n.burstMat.color.setHex(o==="angry"?16347926:16638023);let ye=n.burstPositions.length/3;for(let ve=0;ve<ye;ve++){let b=ve/ye*Math.PI*2,me=.68+$*.92;n.burstPositions[ve*3]=Me+Math.cos(b)*me,n.burstPositions[ve*3+1]=1.55+Math.sin(b)*me*.85-$*.16,n.burstPositions[ve*3+2]=R?-1.08:-.42}n.burstPoints.geometry.attributes.position.needsUpdate=!0,n.burstMat.opacity=(1-$*.82)*(R?.36:.45)}else n.burstMat.opacity=0;let _=h==="sleeping";if(_||u==="sleeping"){n.sleepZGroup.visible=!0;let $=_?s:r,Me=(_?E:m)+.62,ye=_&&E>.25?-.78:-.35;n.sleepZGroup.children.forEach((ve,b)=>{let me=(e*.55+b*.33)%1;ve.position.set($+Math.sin(e*2.2+b)*.12+me*.14,Me+me*.65,ye),ve.rotation.z=Math.sin(e*1.8+b)*.22;let oe=Math.sin(me*Math.PI)*.85;ve.scale.setScalar(Math.max(.01,oe))})}else n.sleepZGroup.visible=!1;let L=p?0:i==="Right"?r:s,G=p?.04:i==="Right"?m:E,U=p?"corpseSnapUp":i==="Right"?u:h,k=R&&(p||f||(U==="shockedFall"||U==="wakingUp"||o==="surprised")&&a<.42),X=R&&(h==="punching"||h==="kicking"),V=R&&(u==="punching"||u==="kicking"),te=X?h:u,F=X||V?Jn(e,te).recoil:0;if(F>.08){let $=X?r:s,Me=X?m:E;n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set($+(X?-.28:.28),Me+(te==="kicking"?.95:1.45),-.05),n.shockBurstGroup.rotation.z=e*3.1,n.shockBurstGroup.scale.setScalar(.45+F*.85)}else if(k){n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(L,G+2.08,-.18),n.shockBurstGroup.rotation.z=e*2.2;let $=.88+.18*Math.sin(e*16);n.shockBurstGroup.scale.setScalar($)}else n.shockBurstGroup.visible=!1;if(h==="slapForehead"||u==="slapForehead"||o==="confused"){n.dizzyStarsGroup.visible=!0;let $=u==="slapForehead"?r:h==="slapForehead"?s:L,Me=(u==="slapForehead"?m:h==="slapForehead"?E:G)+1.82;n.dizzyStarsGroup.children.forEach((ye,ve)=>{let b=e*4.5+ve/3*Math.PI*2;ye.position.set($+Math.cos(b)*.28,Me+Math.sin(b*2)*.04,Math.sin(b)*.24),ye.rotation.y=e*5})}else n.dizzyStarsGroup.visible=!1;let J=h==="walking"||h==="running";if(J||(u==="walking"||u==="running")){n.dustGroup.visible=!0;let $=J?s:r,Me=(J?E:m)+.06;n.dustGroup.children.forEach((ye,ve)=>{let b=(e*(h==="running"||u==="running"?3.2:1.8)+ve*.25)%1;ye.position.set($-b*.35+(ve%2===0?-.1:.1),Me+b*.28,-.05),ye.scale.setScalar(Math.max(.01,Math.sin(b*Math.PI)*1.25))})}else n.dustGroup.visible=!1;let Ie=h==="cutting";if(Ie||u==="cutting"){n.hairCutGroup.visible=!0;let $=Ie?r:s,Me=(Ie?m:E)+1.44,ye=-.6;n.hairCutGroup.children.forEach((ve,b)=>{let me=(e*2.25+b*.13)%1,oe=(b%2===0?1:-1)*(.09+me*.28);ve.position.set($+oe+Math.sin(e*7+b)*.04,Me-me*1.12,ye+.08),ve.rotation.set(e*6+b,b*.9,e*8),ve.scale.setScalar(Math.max(.08,Math.sin(me*Math.PI)*1.25))})}else n.hairCutGroup.visible=!1;let K=d==="angry",pe=g==="angry";if(K||pe||p){n.angrySteamGroup.visible=!0;let $=p?0:pe?r:s,Me=(p?.06:pe?m:E)+1.54,ye=p?-.06:pe?-.68:-.58;n.angrySteamGroup.children.forEach((ve,b)=>{let me=b%2===0?-1:1,oe=(e*2.4+Math.floor(b/2)*.34)%1;ve.position.set($+me*(.24+oe*.22),Me+oe*.36,ye),ve.scale.setScalar(Math.max(.05,Math.sin(oe*Math.PI)*.68))})}else n.angrySteamGroup.visible=!1;let Q=h==="spraying";if(Q||u==="spraying"){n.sprayMistGroup.visible=!0;let $=Q?r:s,Me=(Q?m:E)+1.48,ye=Q?s:r;n.sprayMistGroup.children.forEach((ve,b)=>{let me=(e*3.6+b*.1)%1,oe=(b%5-2)*.055;ve.position.set(ye+($-ye)*(.35+me*.65),Me+oe+Math.sin(me*3)*.04,-.62),ve.scale.setScalar(Math.max(.1,(1-me*.4)*1.15))})}else n.sprayMistGroup.visible=!1;if(h==="celebrate"||u==="celebrate"||d==="proud"||g==="proud"||x==="tada"||x==="coin"){n.celebrateStarsGroup.visible=!0;let $=u==="celebrate"||g==="proud"?r:h==="celebrate"||d==="proud"?s:L,Me=(u==="celebrate"||g==="proud"?m:h==="celebrate"||d==="proud"?E:G)+1.55;n.celebrateStarsGroup.children.forEach((ye,ve)=>{let b=(e*1.9+ve*.12)%1,me=ve/10*Math.PI*2+e*2.2,oe=.24+b*.46;ye.position.set($+Math.cos(me)*oe,Me+Math.sin(me)*.22+b*.44,-.46+Math.sin(me)*.16),ye.rotation.set(e*4+ve,e*5,ve),ye.scale.setScalar(Math.max(.05,Math.sin(b*Math.PI)*1.25))})}else n.celebrateStarsGroup.visible=!1;if(h==="brakeStop"||u==="brakeStop"||h==="hazardTruck"||u==="hazardTruck"||x==="brake"){n.brakeSmokeGroup.visible=!0;let $=u==="brakeStop"||u==="hazardTruck"?r:h==="brakeStop"||h==="hazardTruck"?s:L,Me=(u==="brakeStop"||u==="hazardTruck"?m:h==="brakeStop"||h==="hazardTruck"?E:G)+.12;n.brakeSmokeGroup.children.forEach((ye,ve)=>{let b=(e*2.8+ve*.14)%1,me=ve%2===0?-1:1;ye.position.set($+me*(.14+b*.62),Me+b*.42,-.45+ve%3*.08),ye.scale.setScalar(Math.max(.08,Math.sin(b*Math.PI)*1.55))})}else n.brakeSmokeGroup.visible=!1}function au(n){let e=(n??"calm").trim().toLowerCase();return e==="laugh"||e==="laughing"||e==="excited"?"laughing":e==="smug"||e==="sarcastic"||e==="mischievous"||e==="deadpan"||e==="playful"?"smug":e==="scared"||e==="panicked"||e==="panic"||e==="nervous"||e==="terrified"?"scared":e==="surprised"||e==="shocked"||e==="gasp"?"surprised":e==="angry"||e==="shouting"||e==="determined"?"angry":e==="sad"||e==="worried"?"sad":e==="happy"||e==="loving"||e==="hopeful"||e==="relieved"?"happy":e==="proud"||e==="dramatic"?"proud":e==="confused"||e==="shy"?"confused":"calm"}function lu(n){switch(n){case"CosmosSacred3D":return"Cosmos";case"HistoryChronicle3D":return"Archive";case"NeonCyberGrid3D":return"ModernCity";case"SereneNatureGlow":return"ForestAshram";case"ComedyStage3D":return"ComedyStage";default:return"Temple"}}function rE(n,e){let t=n.sceneRuns??[];if(t.length===0){let l=Math.max(0,Math.min(1,e/Math.max(1,n.durationSeconds))),c=lu(n.theme);return n.hasCharacters&&n.turns.length>=5&&n.theme==="VedicTempleSunrise3D"&&(c=l<.34?"Temple":l<.68?"ForestAshram":"Cosmos"),{setting:c,timeOfDay:"Dawn",sceneIndex:0,startSeconds:0,localProgress:l}}let i=0;for(;i+1<t.length&&e>=t[i+1].startSeconds;)i++;let s=t[i],r=s.endSeconds>0?s.endSeconds:n.durationSeconds,o=Math.max(0,Math.min(1,(e-s.startSeconds)/Math.max(.5,r-s.startSeconds)));return{setting:s.setting==="Auto"?lu(n.theme):s.setting,timeOfDay:s.timeOfDay==="Auto"?"Dawn":s.timeOfDay,sceneIndex:Math.max(0,s.sceneIndex),startSeconds:s.startSeconds,localProgress:o,activeCharacters:s.activeCharacters,characterEntryAt:s.characterEntryAt}}async function oE(n){let e=[];for(let t=0;t<n.backdropCount;t++){let i=await fetch(`/backdrop/${t}.rgba`);if(!i.ok)continue;let s=new Uint8Array(await i.arrayBuffer());if(s.byteLength!==n.width*n.height*4)continue;let r=new Os(s,n.width,n.height,rn);r.flipY=!0,r.colorSpace=kt,r.needsUpdate=!0,e.push(r)}return e}function aE(n,e){let t=n.speechEnvelope;if(!t||t.length===0)return .35;let i=Math.max(0,Math.min(t.length-1,e));return t[i]??0}function lE(n,e){return n.turns.find(t=>!t.isTitleHook&&e>=t.startSeconds-.005&&e<=t.endSeconds+.005)}function cE(n,e,t,i){if(t)return t;let s=n.turns.filter(r=>!r.isTitleHook);if(s.length!==0){if(e<s[0].startSeconds)return s[0].action==="sleeping"||s[0].action==="sitting"?s[0]:void 0;for(let r=s.length-1;r>=0;r--)if(s[r].endSeconds<=e){let o=s[r],a=r+1<s.length?s[r+1]:void 0;return a&&a.sceneBackdropCue!==o.sceneBackdropCue&&e>=a.startSeconds-.1?a:!o.sceneBackdropCue||o.sceneBackdropCue.startsWith(i)?o:void 0}}}function cu(n,e){let t=e?1.55:2.55,i=(n.x-.5)*2*t,s=Math.max(0,(.72-n.y)*2.2);return{x:i,y:s,scale:Math.max(.5,Math.min(1.8,n.scale||1))}}function hE(n){n.traverse(e=>{let t=e;t.isReflector&&t.dispose&&t.dispose();let i=e;i.geometry&&i.geometry.dispose();let s=i.material;Array.isArray(s)?s.forEach(r=>r?.dispose()):s&&s.dispose()})}async function uE(){try{let n=await fetch("/job.json");if(!n.ok)throw new Error(`Failed to load /job.json: ${n.status}`);let e=await n.json(),t=document.getElementById("stage");t.width=e.width,t.height=e.height;let i=new ua({canvas:t,antialias:!0,preserveDrawingBuffer:!0,powerPreference:"high-performance"});i.setSize(e.width,e.height,!1),i.setPixelRatio(1),i.shadowMap.enabled=!0,i.shadowMap.type=Eo,i.toneMapping=vo,i.toneMappingExposure=1.08,i.outputColorSpace=kt;let s=await oE(e),r=i.getContext(),o=e.width*e.height*4,a=new Uint8Array(o),l=e.height>e.width,c=Kh(e),h=null,u=null;if(e.showWatermark!==!1&&(e.footerLabel||e.isComedyMode)){let Q=Math.round(Math.max(158,Math.min(212,e.width*.17))),re=Math.round(Q*.26),ce=document.createElement("canvas");ce.width=512,ce.height=132;let ne=ce.getContext("2d");ne.fillStyle="rgba(15, 23, 42, 0.78)",ne.beginPath(),ne.roundRect(6,6,500,120,26),ne.fill(),ne.strokeStyle="#f59e0b",ne.lineWidth=4,ne.stroke(),ne.fillStyle="#f59e0b",ne.beginPath(),ne.arc(64,66,36,0,Math.PI*2),ne.fill(),ne.fillStyle="#0f172a",ne.font="bold 34px sans-serif",ne.textAlign="center",ne.textBaseline="middle",ne.fillText("KS",64,68);let $=(e.footerLabel&&e.footerLabel.trim().length>0?e.footerLabel.trim():"KESHAV STUDIO").toUpperCase().slice(0,18);ne.fillStyle="#f8fafc",ne.font="bold 28px sans-serif",ne.textAlign="left",ne.fillText($,118,54),ne.fillStyle="#fbbf24",ne.font="600 18px sans-serif",ne.fillText("ANIMSTUDIO 3D",118,90);let Me=new Wn(ce);Me.colorSpace=kt;let ye=new Le({map:Me,transparent:!0,depthTest:!1,depthWrite:!1}),ve=new M(new ft(Q,re),ye),b=l?18:22,me=l?62:16;ve.position.set(e.width-Q*.5-b,e.height-re*.5-me,0),h=new Ai,h.add(ve),u=new Di(0,e.width,e.height,0,-10,10),i.autoClear=!1}let E=null,m=null,f=new Ai,d=null,g=null,p=null,x=null,w=[],y=l?-.6:-1.05,R=l?.6:1.05,S=0,A=(Q,re)=>{f&&hE(f);let ce=new Ai,ne=iu(ce,e,Q,re,s),$=ru(ce,Q,e.vfxStyle,e.palette.primaryHex,e.palette.secondaryHex,e.seed),Me=null,ye=null,ve=[];if(e.hasCharacters&&e.leftCharacter&&e.rightCharacter){let b=e.stageLayout?.left,me=e.stageLayout?.right,oe=b?cu(b,l):{x:y,y:S,scale:1},Ae=me?cu(me,l):{x:R,y:S,scale:1},P=.12,se=.12,be=.42,I=-.42;if(Q==="BarberShop"&&!e.stageLayout?.templateBackdrop&&ne.spots.sofa&&ne.spots.counter){let Ee=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(e.leftCharacter.name??""),ae=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(e.rightCharacter.name??""),He=Ee&&!ae,Re=ne.spots.counter,Be=ne.spots.sofa;oe=He?{x:Re.x,y:Re.y,scale:1}:{x:Be.x,y:Be.y,scale:1},Ae=He?{x:Be.x,y:Be.y,scale:1}:{x:Re.x,y:Re.y,scale:1},P=He?Re.z:Be.z,se=He?Be.z:Re.z,be=He?Re.rotY??-.92:Be.rotY??.22,I=He?Be.rotY??.22:Re.rotY??-.92}let v=oe.x<=Ae.x?1:-1;Me=fa(e.leftCharacter,e.palette.speakerAHex,Q,v,0),Me.root.position.set(oe.x,oe.y,P),Me.root.rotation.y=be,Me.root.scale.setScalar(oe.scale),ce.add(Me.root),ye=fa(e.rightCharacter,e.palette.speakerBHex,Q,-v,1.7),ye.root.position.set(Ae.x,Ae.y,se),ye.root.rotation.y=I,ye.root.scale.setScalar(Ae.scale),ce.add(ye.root);let O=Q==="BarberShop"?l?e.supportingCast.length===1?[.78]:e.supportingCast.length===2?[.68,-1.22]:[.68,-1.22,1.08,-1.48,.34]:e.supportingCast.length===1?[1.76]:e.supportingCast.length===2?[1.38,2.12]:e.supportingCast.length===3?[1.14,1.72,2.3]:[.92,1.4,1.88,2.36,.48]:e.supportingCast.length===1?[0]:e.supportingCast.length===2?[-.48,.48]:e.supportingCast.length===3?[0,-.68,.68]:[-.36,.36,-.96,.96,0],j=Q==="BarberShop"?l?-1.62:-1.48:-.86;ve=e.supportingCast.slice(0,5).map((Ee,ae)=>{let He=fa(Ee,e.palette.secondaryHex,Q,O[ae]<=0?1:-1,3.1+ae*1.4),Re=ae>=3?-.34:0;return He.root.position.set(O[ae],S+(Q==="BarberShop"?.36:.05),j+Re),He.root.scale.setScalar(ae>=3?.72:.76),ce.add(He.root),He})}f=ce,d=ne,g=$,p=Me,x=ye,w=ve,E=Q,m=re},C=e.turns.find(Q=>!Q.isTitleHook&&Q.action==="cutting")??e.turns.find(Q=>!Q.isTitleHook&&Q.listenerAction==="cutting"),_=e.turns.find(Q=>!Q.isTitleHook&&(Q.action==="removingTowel"||/तौलिया तो हटा|तौलिया हटा|remove towel/i.test(Q.text??""))),T=e.turns.find(Q=>!Q.isTitleHook&&(Q.action==="lookInMirror"||Q.action==="removingTowel"||/टकला|कटोरा|मैदान साफ़|चाँद|चांद|शीशे में|mirror/i.test(Q.text??""))),L=C?C.endSeconds:9999,G=_?_.startSeconds:9999,U=T?T.startSeconds+.08:Math.max(L+2.5,e.durationSeconds*.56),k=e.turns.find(Q=>!Q.isTitleHook&&(Q.action==="pillarBurst"||Q.action==="lapSubdue"||Q.action==="lapSubdued"||Q.listenerAction==="lapSubdue"||Q.listenerAction==="lapSubdued")),X=k?k.startSeconds:Number.POSITIVE_INFINITY,V=e.turns.filter(Q=>!Q.isTitleHook&&(Q.action==="lapSubdue"||Q.action==="lapSubdued"||Q.listenerAction==="lapSubdue"||Q.listenerAction==="lapSubdued")),te=V.length>0?V[0].startSeconds:Number.POSITIVE_INFINITY,F=V.length>0?V[V.length-1].endSeconds:-1,q=e.turns.some(Q=>Q.action==="lyingShroud"||Q.listenerAction==="lyingShroud"||Q.action==="corpseSnapUp"||Q.listenerAction==="corpseSnapUp"),J=e.turns.find(Q=>Q.action==="corpseSnapUp"||Q.listenerAction==="corpseSnapUp"),xe=J?J.startSeconds:Number.POSITIVE_INFINITY,Ie=-1,Ue=Math.max(1,e.totalFrames),K=Math.max(0,Math.min(Ue,e.startFrame??0)),pe=Math.max(K,Math.min(Ue,e.endFrame??Ue));for(let Q=K;Q<pe;Q++){let re=Q/e.fps,ce=Math.max(0,Math.min(1,re/Math.max(1,e.durationSeconds))),ne=rE(e,re),$=ne.setting!==E||ne.timeOfDay!==m;$&&A(ne.setting,ne.timeOfDay);let Me=lE(e,re),ye=cE(e,re,Me,ne.setting),ve=!Me&&e.turns.some(ue=>ue.isTitleHook&&re>=ue.startSeconds&&re<=ue.endSeconds)&&re<(e.turns.find(ue=>!ue.isTitleHook)?.startSeconds??99),b=Me?Me.index:-1,me=b!==Ie;Ie=b;let oe=aE(e,Q),Ae=au((Me??ye)?.emotion),P=(Me??ye)?.action||"none",se=(Me??ye)?.listenerAction||"none",be=(Me??ye)?.speakerProp??null,I=(Me??ye)?.listenerProp??null,v=(Me??ye)?.cameraShot||"auto",O=(Me??ye)?.stageTarget||"default",j=Me??ye,Ee=j?Math.max(.2,j.endSeconds-j.startSeconds):1,ae=j?Math.max(0,Math.min(1,(re-j.startSeconds)/Ee)):0,He=j?w.findIndex(ue=>ue.name.toLowerCase()===j.speakerName.toLowerCase()):-1,Re=He<0&&!!Me&&Me.slot==="Left",Be=He<0&&!!Me&&Me.slot==="Right",rt=He<0&&j?.slot==="Left"?"Left":He<0&&j?.slot==="Right"?"Right":"Narrator",Se=j?.slot,De=p,ke=x,ge=Se==="Left"?P:Se==="Right"?se:"none",de=Se==="Right"?P:Se==="Left"?se:"none";if(ne.setting==="PalaceCourt"&&(ge==="dancing"||de==="dancing"||ge==="sufiSpin"||de==="sufiSpin"||ge==="adaab"||de==="adaab")){let Oe=ge==="dancing"||ge==="adaab"||ge==="sufiSpin"?ge:de;ge==="none"&&(ge=Oe),de==="none"&&(de=Oe)}let Ke=re>=X-.04,Fe=P==="pillarBurst"||se==="pillarBurst",$e=P==="lapSubdue"||P==="lapSubdued"||se==="lapSubdue"||se==="lapSubdued"||!Fe&&P!=="blessing"&&re>=te-.04&&re<=F+.04,N=P==="serpentAttack"||se==="serpentAttack"?"serpentAttack":P==="elephantCharge"||se==="elephantCharge"?"elephantCharge":P==="fireTrial"||se==="fireTrial"?"fireTrial":P==="cliffRescue"||se==="cliffRescue"?"cliffRescue":"none",Te=re>=xe-.04,ee=kl(P),le=ee!=="none"?ee:kl(se),Pe=(ue,Oe)=>{if(!ue)return Oe;if($e){if(ue.isNarasimha)return"lapSubdue";if(ue.isAsuraKing)return"lapSubdued";if(ue.role==="ChildDevotee")return"praying"}else if(Fe){if(ue.isNarasimha)return"pillarBurst";if(ue.isAsuraKing)return"shockedFall";if(ue.role==="ChildDevotee")return"praying"}else if(Ke&&!$e&&!Fe){if(ue.isNarasimha)return"blessing";if(ue.role==="ChildDevotee"&&(Oe==="none"||Oe==="praying"))return"praying"}else{if(N==="fireTrial"&&ue.role==="ChildDevotee")return"fireTrial";if(N==="cliffRescue"&&ue.role==="ChildDevotee")return"cliffRescue"}return Oe};ge=Pe(De,ge),de=Pe(ke,de);let Ce=Se==="Left"?be:Se==="Right"?I:null,Ze=Se==="Right"?be:Se==="Left"?I:null,ht=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(De?.name??""),Rt=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(ke?.name??""),at=ht&&!Rt?"Left":Rt?"Right":O==="barberStand"&&Se==="Left"?"Left":"Right";ne.setting==="BarberShop"&&(at==="Left"?(Ce||(Ce="scissors"),(Ze==="scissors"||Ze==="comb")&&(Ze="cape"),(ge==="lookInMirror"||de==="lookInMirror")&&(de="lookInMirror",ge==="lookInMirror"&&(ge="pointing"))):(Ze||(Ze="scissors"),(Ce==="scissors"||Ce==="comb")&&(Ce="cape"),(ge==="lookInMirror"||de==="lookInMirror")&&(ge="lookInMirror",de==="lookInMirror"&&(de="pointing"))));let Wt=(ue,Oe,lt,mt,st)=>{let We=S;if(e.stageLayout?.templateBackdrop)return{x:mt,y:We,z:.12,rotY:st,seated:!1,showCape:!1};let Xe=d?.spots??{},tt=lt?O:"default";if(ne.setting==="BarberShop"){if(ue===at)return{x:Xe.counter?.x??-.22,y:We,z:Xe.counter?.z??-.92,rotY:Xe.counter?.rotY??-.92,seated:!1,showCape:!1};if(Xe.sofa){let Tt=Oe!=="removingTowel"&&re<G-.1,yt=Oe==="lookInMirror"||P==="lookInMirror"||se==="lookInMirror",wt=ae<.45?-.64+Math.sin(ae*Math.PI*2.2)*.22:.28;return{x:Xe.sofa.x,y:Xe.sofa.y,z:Xe.sofa.z,rotY:yt?wt:Xe.sofa.rotY??.22,seated:!0,showCape:Tt}}}if(ne.setting==="Courtroom"){if(tt==="judgeBench"&&Xe.sofa)return{x:Xe.sofa.x,y:Xe.sofa.y,z:Xe.sofa.z,rotY:Xe.sofa.rotY??.08,seated:!0,showCape:!1};if(tt==="witnessStand"&&Xe.counter)return{x:Xe.counter.x,y:Xe.counter.y,z:Xe.counter.z,rotY:Xe.counter.rotY??.38,seated:!1,showCape:!1}}if(ne.setting==="DoctorClinic"){if(tt==="doctorDesk"&&Xe.sofa)return{x:Xe.sofa.x,y:Xe.sofa.y,z:Xe.sofa.z,rotY:Xe.sofa.rotY??-.35,seated:!1,showCape:!1};if(tt==="patientBed"&&Xe.bed)return{x:Xe.bed.x+.15,y:.32,z:-.32,rotY:.32,seated:!0,showCape:!1}}if(Oe==="sleeping"&&Xe.bed)return{x:Xe.bed.x,y:Xe.bed.y,z:Xe.bed.z,rotY:Xe.bed.rotY??st,seated:!1,showCape:!1};if(tt==="bed"&&(Oe==="wakingUp"||Oe==="sitting")&&Xe.bed)return{x:Xe.bed.x+.28,y:.34,z:-.05,rotY:.35,seated:!0,showCape:!1};if((Oe==="sitting"||tt==="sofa")&&Xe.sofa)return{x:Xe.sofa.x,y:Xe.sofa.y,z:Xe.sofa.z,rotY:Xe.sofa.rotY??st,seated:!0,showCape:!1};if((tt==="counter"||Oe==="eating"||Oe==="stirring")&&Xe.counter)return ue==="Left"?{x:Xe.counter.x,y:Xe.counter.y,z:Xe.counter.z,rotY:Xe.counter.rotY??.3,seated:!1,showCape:!1}:{x:Math.max(.55,Xe.counter.x+.96),y:Xe.counter.y,z:-.22,rotY:-.48,seated:!1,showCape:!1};if(ne.setting==="Kitchen"||ne.setting==="SweetShop")return ue==="Left"?{x:Xe.counter?.x??-.45,y:We,z:-.52,rotY:.34,seated:!1,showCape:!1}:{x:.6,y:We,z:-.18,rotY:-.46,seated:!1,showCape:!1};if(Oe==="walking"||Oe==="running"){let et=ae<.85?Math.min(1,ae/.85):1,Tt=et*et*(3-2*et),yt=tt==="door"&&Xe.door?Xe.door.x:mt*1.45,wt=tt==="door"&&Xe.door?Xe.door.z:-.35,pt=tt==="center"?mt*.45:mt,Et=.22,bt=yt+(pt-yt)*Tt,Ht=wt+(Et-wt)*Tt,Gt=pt-yt,Vi=Math.abs(Gt)>.05?Math.atan2(Gt,Et-wt)*.65:st;return{x:bt,y:We,z:Ht,rotY:Vi,seated:!1,showCape:!1}}return Oe==="lapSubdue"?{x:-.04,y:.04,z:.08,rotY:.06,seated:!1,showCape:!1}:Oe==="lapSubdued"?{x:-.04,y:.04,z:.08,rotY:0,seated:!1,showCape:!1}:Oe==="pillarBurst"?{x:0,y:.04,z:-.04,rotY:.04,seated:!1,showCape:!1}:$e?{x:l?.72:1.18,y:We,z:.16,rotY:-.58,seated:!1,showCape:!1}:ne.setting==="LivingRoom"&&q?{x:ue==="Left"?l?-.78:-1.16:l?.78:1.16,y:We,z:-.36,rotY:ue==="Left"?.44:-.44,seated:!1,showCape:!1}:tt==="center"||lt&&Oe==="pointing"?{x:mt*.84,y:We,z:.18,rotY:st*.78,seated:!1,showCape:!1}:{x:mt,y:We,z:.12,rotY:st,seated:!1,showCape:!1}},Bt=1-Math.exp(-(e.isComedyMode?13.5:8.5)/Math.max(1,e.fps)),gn=!1,Kn=!1;if(De&&!e.stageLayout?.templateBackdrop){let ue=Wt("Left",ge,Se==="Left",y,.42);gn=ue.seated,Kn=ue.showCape;let Oe=$||me&&(ge==="sleeping"||ge==="sitting"||ue.seated)?1:Bt;De.root.position.x+=(ue.x-De.root.position.x)*Oe,De.root.position.y+=(ue.y-De.root.position.y)*Oe,De.root.position.z+=(ue.z-De.root.position.z)*Oe,De.root.rotation.y+=(ue.rotY-De.root.rotation.y)*Oe}let on=!1,un=!1;if(ke&&!e.stageLayout?.templateBackdrop){let ue=Wt("Right",de,Se==="Right",R,-.42);on=ue.seated,un=ue.showCape;let Oe=$||me&&(de==="sleeping"||de==="sitting"||ue.seated)?1:Bt;ke.root.position.x+=(ue.x-ke.root.position.x)*Oe,ke.root.position.y+=(ue.y-ke.root.position.y)*Oe,ke.root.position.z+=(ue.z-ke.root.position.z)*Oe,ke.root.rotation.y+=(ue.rotY-ke.root.rotation.y)*Oe}let yi=De?De.root.position.x:y,vn=ke?ke.root.position.x:R,Mn=De?De.root.position.y:S,Ln=ke?ke.root.position.y:S,en=j?.listenerEmotion?au(j.listenerEmotion):"calm",$n=(ue,Oe,lt)=>ue==="lapSubdue"||ue==="pillarBurst"?"angry":ue==="lapSubdued"?"surprised":Oe?Ae:ue==="brakeStop"?"scared":ue==="celebrate"?"proud":ue==="lookInMirror"||ue==="shockedFall"?"surprised":lt&&en!=="calm"?en:"calm",Qn=$n(ge,Re,Be),dn=$n(de,Be,Re),Oi=e.turns.find(ue=>!ue.isTitleHook),Sn=j&&!j.isTitleHook?j:Oi,jn=Sn?.slot,zi=jn==="Left"?Sn?.speakerGlasses??null:jn==="Right"?Sn?.listenerGlasses??null:null,bn=jn==="Right"?Sn?.speakerGlasses??null:jn==="Left"?Sn?.listenerGlasses??null:null,H=ne.setting!=="BarberShop"?0:re>=U||ge==="lookInMirror"||de==="lookInMirror"?2:C&&re>=C.startSeconds?1:0,W=at==="Left"?0:H,ie=at==="Right"?0:H,Y=!e.isComedyMode&&!e.stageLayout?.templateBackdrop&&(e.sceneRuns?.length??0)>1;De&&pa(De,re,Re,oe,Qn,ve,ge,ae,$,Ce,gn,Kn,zi,W),ke&&pa(ke,re,Be,oe,dn,ve,de,ae,$,Ze,on,un,bn,ie),w.forEach((ue,Oe)=>{let lt=Oe===He,mt=!Y&&ne.setting==="LivingRoom"&&q&&Oe===0,st=!Y&&ne.setting==="LivingRoom"&&q&&Oe===1;if(mt)Te?(ue.root.position.x+=(0-ue.root.position.x)*Math.max(Bt,.55),ue.root.position.y+=(.02-ue.root.position.y)*Math.max(Bt,.55),ue.root.position.z=.25,ue.root.rotation.y+=(0-ue.root.rotation.y)*Math.max(Bt,.55)):(ue.root.position.set(.68,.14,.25),ue.root.rotation.y=Math.PI*.5),ue.root.scale.setScalar(.92);else if(st)ue.root.position.set(.02,.38,-1.24),ue.root.rotation.y=.05,ue.root.scale.setScalar(.84);else if($e&&ue.isNarasimha)ue.root.position.set(-.04,.04,.08),ue.root.rotation.y=.06,ue.root.scale.setScalar(1);else if($e&&ue.isAsuraKing)ue.root.position.set(-.04,.04,.08),ue.root.rotation.y=0,ue.root.scale.setScalar(1);else if(Fe&&ue.isNarasimha)ue.root.position.set(0,.04,-.04),ue.root.rotation.y=.04,ue.root.scale.setScalar(1);else if(!Y)if(ne.setting==="BarberShop")ue.root.position.z=-1.52,ue.root.position.y=lt?.34:.3,ue.root.scale.setScalar(lt?.8:.76);else if(ne.setting==="PalaceCourt"){let wt=Oe%2===0?-1:1,pt=Math.floor(Oe/2);ue.root.position.x=wt*(1.82+pt*.72),ue.root.position.z=-.68-pt*.44,ue.root.position.y=0,ue.root.scale.setScalar(.94)}else ue.root.position.z=lt?-.35:-.82,ue.root.scale.setScalar(lt?.94:.88);let Xe=mt?Te?"corpseSnapUp":"lyingShroud":st?Te?"shockedFall":"sitting":lt?P:(ge==="dancing"||de==="dancing"||ge==="adaab"||ge==="sufiSpin")&&ne.setting==="PalaceCourt"?ge==="dancing"||ge==="adaab"||ge==="sufiSpin"?ge:de:P==="punching"||P==="kicking"?"shockedFall":"none",tt=Pe(ue,Xe),et=mt?Te||ce>.54?"angry":"happy":st?Te?"surprised":lt?Ae:"sad":tt==="lapSubdue"||tt==="pillarBurst"?"angry":tt==="lapSubdued"?"surprised":tt==="blessing"?"proud":lt?Ae:Ae==="angry"||Ae==="surprised"?"surprised":Ae==="laughing"?"laughing":"calm",Tt=lt&&ne.setting!=="BarberShop"?be:null,yt=ne.setting==="BarberShop"||st&&!Te;pa(ue,re,lt,oe,et,!1,tt,ae,$,Tt,yt,!1,"none",0)});let z=yi,we=vn,Ne=rt,Ye=rt==="Left"?Mn+(De?.headY??1.4):rt==="Right"?Ln+(ke?.headY??1.4):1.38;if(Y){let ue=e.sceneRuns?.[1]?.activeCharacters?.slice(0,2)??[De?.name,ke?.name].filter(et=>!!et),Oe=(ne.activeCharacters?.length??0)>0?ne.activeCharacters:ue,lt=ne.characterEntryAt??{},mt=et=>{let Tt=et.name;if((Fe||$e)&&(et.isNarasimha||et.isAsuraKing))return X;if(N!=="none"&&(et.role==="ChildDevotee"||N==="fireTrial"&&et.isHolika)||Ke&&!$e&&!Fe&&(et.isNarasimha||et.role==="ChildDevotee")&&Oe.some(Et=>/प्रह्लाद|prahlad|नरसिंह|नृसिंह|narasimha|narsimha/i.test(Et)))return ne.startSeconds;let yt=Oe.find(Et=>Et.toLowerCase()===Tt.toLowerCase()),wt=!!Me&&Me.speakerName.toLowerCase()===Tt.toLowerCase();return!yt&&!wt?null:Object.entries(lt).find(([Et])=>Et.toLowerCase()===Tt.toLowerCase())?.[1]??ne.startSeconds},st=[...De?[De]:[],...ke?[ke]:[],...w],We=[];for(let et of st){let Tt=mt(et),yt=Tt!==null&&re>=Tt-.04;et.root.visible=yt,yt&&Tt!==null&&We.push({rig:et,entryAt:Tt})}let Xe=We.length,tt=l?.56:.88;if(We.forEach(({rig:et,entryAt:Tt},yt)=>{let wt=0,pt=0,Et=.14,bt=0;$e?et.isNarasimha?(wt=-.04,pt=.04,Et=.08,bt=.06):et.isAsuraKing?(wt=-.04,pt=.04,Et=.08,bt=0):(wt=l?.72:1.18,pt=0,Et=.16,bt=-.58):Fe&&et.isNarasimha?(wt=0,pt=.04,Et=-.04,bt=.04):N==="elephantCharge"?et.role==="ChildDevotee"?(wt=l?.62:.96,Et=.16,bt=-.35):(wt=l?-.78:-1.52,Et=-.24,bt=.45):N==="fireTrial"?et.role==="ChildDevotee"?(wt=.42,Et=.24,bt=-.25):et.isHolika?(wt=-.42,Et=.2,bt=.25):(wt=-1.38,Et=.05,bt=.48):Xe===1?(wt=0,Et=.16,bt=.12):Xe===2?(wt=yt===0?-tt:tt,Et=.16,bt=yt===0?.42:-.42):(wt=[-tt*1.15,.04,tt*1.15][yt]??(yt-1)*.65,Et=yt===1?-.18:.16,bt=wt<-.1?.44:wt>.1?-.44:.08);let Ht=Math.max(0,re-Tt),Gt=Ht<.72?Math.sin(Ht/.72*Math.PI*.5):1,Bn=!$e&&!Fe&&et.role==="Divine"&&Tt>ne.startSeconds+.25&&Ht<.9?(1-Gt)*.85:0,fr=$||Ht<.06?1:$e?Math.max(Bt,.55):Bt;et.root.position.x+=(wt-et.root.position.x)*fr,et.root.position.y+=(pt+Bn-et.root.position.y)*fr,et.root.position.z+=(Et-et.root.position.z)*fr,et.root.rotation.y+=(bt-et.root.rotation.y)*fr;let hu=Ht<.55?.78+.22*Gt:1;et.root.scale.setScalar(hu)}),$e||Fe)z=-.55,we=.55,Ne="Narrator",Ye=1.48;else if(We.length>0){z=Math.min(...We.map(Tt=>Tt.rig.root.position.x)),we=Math.max(...We.map(Tt=>Tt.rig.root.position.x));let et=j?We.find(Tt=>Tt.rig.name.toLowerCase()===j.speakerName.toLowerCase())?.rig:void 0;et?(Ne=et.root.position.x<=.05?"Left":"Right",Ye=et.root.position.y+et.headY):(Ne="Narrator",Ye=We[0].rig.root.position.y+We[0].rig.headY)}}let Je=q&&(P==="corpseSnapUp"||Te&&He===0);if(Je&&w[0]&&(Ye=w[0].root.position.y+w[0].headY),d){let ue=[De,ke,...w].find(lt=>!!lt&&lt.role==="ChildDevotee"),Oe=ue?ue.root.position.x:0;su(d,re,ce,ne.sceneIndex,ne.localProgress,e.stageLayout,Ke,N,Oe,ae,{hasFuneralShroud:q,shroudOpen:Te,hazardMode:le})}let nt=!!e.memeCues?.some(ue=>re>=ue.startSeconds-.05&&re<=ue.startSeconds+Math.min(.75,ue.seconds));g&&ou(g,re,ce,Ne,z,we,Ae,ae,e.palette.primaryHex,e.palette.secondaryHex,ge,de,Mn,Ln,nt,Qn,dn,Je,j?.sfxCue??null),$h(c,e,re,ce,Ne,z,we,Ae,ve,nt?"crashPunch":v,$e?"lapSubdue":Fe?"pillarBurst":Je?"corpseSnapUp":N!=="none"?N:P,me||$,ae,Ye,ne.setting),h&&u?(i.clear(),i.render(f,c.camera),i.clearDepth(),i.render(h,u)):i.render(f,c.camera),r.readPixels(0,0,e.width,e.height,r.RGBA,r.UNSIGNED_BYTE,a);let je=await fetch(`/frame/${Q}`,{method:"POST",headers:{"Content-Type":"application/octet-stream"},body:a});if(!je.ok)throw new Error(`Frame ${Q} upload failed: ${je.status}`)}await fetch("/done",{method:"POST"}),document.title="DONE"}catch(n){let e=n instanceof Error?n.stack||n.message:String(n);await fetch("/error",{method:"POST",body:e}).catch(()=>{}),document.title="ERROR"}}uE();})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
