var bc=0,cl=1,Rc=2;var hl=1,xo=2,vn=3,Bn=0,Ft=1,ft=2,Nn=0,mi=1,wn=2,ul=3,dl=4,Ac=5,$n=100,Cc=101,Pc=102,Ic=103,Hc=104,Dc=200,Lc=201,Uc=202,Bc=203,Gr=204,kr=205,Fc=206,Nc=207,Oc=208,Gc=209,kc=210,zc=211,Vc=212,Wc=213,Xc=214,yo=0,Mo=1,_o=2,gi=3,vo=4,wo=5,To=6,So=7,fl=0,Yc=1,qc=2,On=0,Zc=1,Jc=2,Kc=3,bo=4,$c=5,Qc=6,jc=7;var pl=300,Ti=301,Si=302,Ro=303,Ao=304,js=306,zr=1e3,Kn=1001,Vr=1002,ln=1003,eh=1004;var er=1005;var xn=1006,Co=1007;var ii=1008;var Tn=1009,ml=1010,gl=1011,is=1012,Po=1013,si=1014,Sn=1015,ri=1016,Io=1017,Ho=1018,ss=1020,El=35902,xl=1021,yl=1022,un=1023,Ml=1024,_l=1025,Xi=1026,rs=1027,vl=1028,Do=1029,wl=1030,Lo=1031;var Uo=1033,tr=33776,nr=33777,ir=33778,sr=33779,Bo=35840,Fo=35841,No=35842,Oo=35843,Go=36196,ko=37492,zo=37496,Vo=37808,Wo=37809,Xo=37810,Yo=37811,qo=37812,Zo=37813,Jo=37814,Ko=37815,$o=37816,Qo=37817,jo=37818,ea=37819,ta=37820,na=37821,rr=36492,ia=36494,sa=36495,Tl=36283,ra=36284,oa=36285,aa=36286;var bs=2300,Wr=2301,Or=2302,$a=2400,Qa=2401,ja=2402;var th=3200,nh=3201;var Sl=0,ih=1,Gn="",Lt="srgb",Ei="srgb-linear",Rs="linear",dt="srgb";var pi=7680;var el=519,sh=512,rh=513,oh=514,bl=515,ah=516,lh=517,ch=518,hh=519,tl=35044;var Rl="300 es",Mn=2e3,As=2001;var Fn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var wa=Math.PI/180,Cs=180/Math.PI;function or(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]).toLowerCase()}function Qe(i,e,t){return Math.max(e,Math.min(t,i))}function gu(i,e){return(i%e+e)%e}function Ta(i,e,t){return(1-t)*i+t*e}function Es(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function qt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var ge=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Qe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ze=class i{constructor(e,t,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,c)}set(e,t,n,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],m=n[8],E=s[0],g=s[3],p=s[6],_=s[1],v=s[4],x=s[7],b=s[2],R=s[5],A=s[8];return r[0]=o*E+a*_+l*b,r[3]=o*g+a*v+l*R,r[6]=o*p+a*x+l*A,r[1]=c*E+h*_+u*b,r[4]=c*g+h*v+u*R,r[7]=c*p+h*x+u*A,r[2]=f*E+d*_+m*b,r[5]=f*g+d*v+m*R,r[8]=f*p+d*x+m*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-n*r*h+n*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=h*o-a*c,f=a*l-h*r,d=c*r-o*l,m=t*u+n*f+s*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let E=1/m;return e[0]=u*E,e[1]=(s*c-h*n)*E,e[2]=(a*n-s*o)*E,e[3]=f*E,e[4]=(h*t-s*l)*E,e[5]=(s*r-a*t)*E,e[6]=d*E,e[7]=(n*l-c*t)*E,e[8]=(o*t-n*r)*E,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Sa.makeScale(e,t)),this}rotate(e){return this.premultiply(Sa.makeRotation(-e)),this}translate(e,t){return this.premultiply(Sa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Sa=new Ze;function Al(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Yi(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function uh(){let i=Yi("canvas");return i.style.display="block",i}var jl={};function ar(i){i in jl||(jl[i]=!0,console.warn(i))}function dh(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function fh(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function ph(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var ec=new Ze().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),tc=new Ze().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Eu(){let i={enabled:!0,workingColorSpace:Ei,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===dt&&(s.r=Un(s.r),s.g=Un(s.g),s.b=Un(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===dt&&(s.r=Wi(s.r),s.g=Wi(s.g),s.b=Wi(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Gn?Rs:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ei]:{primaries:e,whitePoint:n,transfer:Rs,toXYZ:ec,fromXYZ:tc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Lt},outputColorSpaceConfig:{drawingBufferColorSpace:Lt}},[Lt]:{primaries:e,whitePoint:n,transfer:dt,toXYZ:ec,fromXYZ:tc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Lt}}}),i}var rt=Eu();function Un(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Wi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Hi,Xr=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Hi===void 0&&(Hi=Yi("canvas")),Hi.width=e.width,Hi.height=e.height;let s=Hi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=Hi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Yi("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Un(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Un(t[n]/255)*255):t[n]=Un(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},xu=0,qi=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:xu++}),this.uuid=or(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ba(s[o].image)):r.push(ba(s[o]))}else r=ba(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function ba(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Xr.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var yu=0,Vt=class i extends Fn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Kn,s=Kn,r=xn,o=ii,a=un,l=Tn,c=i.DEFAULT_ANISOTROPY,h=Gn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:yu++}),this.uuid=or(),this.name="",this.source=new qi(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ge(0,0),this.repeat=new ge(1,1),this.center=new ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ze,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==pl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case zr:e.x=e.x-Math.floor(e.x);break;case Kn:e.x=e.x<0?0:1;break;case Vr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case zr:e.y=e.y-Math.floor(e.y);break;case Kn:e.y=e.y<0?0:1;break;case Vr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Vt.DEFAULT_IMAGE=null;Vt.DEFAULT_MAPPING=pl;Vt.DEFAULT_ANISOTROPY=1;var lt=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],m=l[9],E=l[2],g=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-E)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+E)<.1&&Math.abs(m+g)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,x=(d+1)/2,b=(p+1)/2,R=(h+f)/4,A=(u+E)/4,P=(m+g)/4;return v>x&&v>b?v<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(v),s=R/n,r=A/n):x>b?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=R/s,r=P/s):b<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),n=A/r,s=P/r),this.set(n,s,r,t),this}let _=Math.sqrt((g-m)*(g-m)+(u-E)*(u-E)+(f-h)*(f-h));return Math.abs(_)<.001&&(_=1),this.x=(g-m)/_,this.y=(u-E)/_,this.z=(f-h)/_,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this.w=Qe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this.w=Qe(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Yr=class extends Fn{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new lt(0,0,e,t),this.scissorTest=!1,this.viewport=new lt(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:xn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Vt(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new qi(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},cn=class extends Yr{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ps=class extends Vt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=Kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var qr=class extends Vt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=Kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var vt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],f=r[o+0],d=r[o+1],m=r[o+2],E=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=f,e[t+1]=d,e[t+2]=m,e[t+3]=E;return}if(u!==E||l!==f||c!==d||h!==m){let g=1-a,p=l*f+c*d+h*m+u*E,_=p>=0?1:-1,v=1-p*p;if(v>Number.EPSILON){let b=Math.sqrt(v),R=Math.atan2(b,p*_);g=Math.sin(g*R)/b,a=Math.sin(a*R)/b}let x=a*_;if(l=l*g+f*x,c=c*g+d*x,h=h*g+m*x,u=u*g+E*x,g===1-a){let b=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=b,c*=b,h*=b,u*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[o],f=r[o+1],d=r[o+2],m=r[o+3];return e[t]=a*m+h*u+l*d-c*f,e[t+1]=l*m+h*f+c*u-a*d,e[t+2]=c*m+h*d+a*f-l*u,e[t+3]=h*m-a*u-l*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),u=a(r/2),f=l(n/2),d=l(s/2),m=l(r/2);switch(o){case"XYZ":this._x=f*h*u+c*d*m,this._y=c*d*u-f*h*m,this._z=c*h*m+f*d*u,this._w=c*h*u-f*d*m;break;case"YXZ":this._x=f*h*u+c*d*m,this._y=c*d*u-f*h*m,this._z=c*h*m-f*d*u,this._w=c*h*u+f*d*m;break;case"ZXY":this._x=f*h*u-c*d*m,this._y=c*d*u+f*h*m,this._z=c*h*m+f*d*u,this._w=c*h*u-f*d*m;break;case"ZYX":this._x=f*h*u-c*d*m,this._y=c*d*u+f*h*m,this._z=c*h*m-f*d*u,this._w=c*h*u+f*d*m;break;case"YZX":this._x=f*h*u+c*d*m,this._y=c*d*u+f*h*m,this._z=c*h*m-f*d*u,this._w=c*h*u-f*d*m;break;case"XZY":this._x=f*h*u-c*d*m,this._y=c*d*u-f*h*m,this._z=c*h*m+f*d*u,this._w=c*h*u+f*d*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],u=t[10],f=n+a+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(o-s)*d}else if(n>a&&n>u){let d=2*Math.sqrt(1+n-a-u);this._w=(h-l)/d,this._x=.25*d,this._y=(s+o)/d,this._z=(r+c)/d}else if(a>u){let d=2*Math.sqrt(1+a-n-u);this._w=(r-c)/d,this._x=(s+o)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-a);this._w=(o-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Qe(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-n*c,this._z=r*h+o*c+n*l-s*a,this._w=o*h-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let d=1-t;return this._w=d*o+t*this._w,this._x=d*n+t*this._x,this._y=d*s+t*this._y,this._z=d*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-t)*h)/c,f=Math.sin(t*h)/c;return this._w=o*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},I=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(nc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(nc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*n),h=2*(a*t-r*s),u=2*(r*n-o*t);return this.x=t+l*c+o*u-a*h,this.y=n+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ra.copy(this).projectOnVector(e),this.sub(Ra)}reflect(e){return this.sub(Ra.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Qe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ra=new I,nc=new vt,Qn=class{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(mn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(mn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=mn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,mn):mn.fromBufferAttribute(r,o),mn.applyMatrix4(e.matrixWorld),this.expandByPoint(mn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),gr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),gr.copy(n.boundingBox)),gr.applyMatrix4(e.matrixWorld),this.union(gr)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,mn),mn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(xs),Er.subVectors(this.max,xs),Di.subVectors(e.a,xs),Li.subVectors(e.b,xs),Ui.subVectors(e.c,xs),Vn.subVectors(Li,Di),Wn.subVectors(Ui,Li),hi.subVectors(Di,Ui);let t=[0,-Vn.z,Vn.y,0,-Wn.z,Wn.y,0,-hi.z,hi.y,Vn.z,0,-Vn.x,Wn.z,0,-Wn.x,hi.z,0,-hi.x,-Vn.y,Vn.x,0,-Wn.y,Wn.x,0,-hi.y,hi.x,0];return!Aa(t,Di,Li,Ui,Er)||(t=[1,0,0,0,1,0,0,0,1],!Aa(t,Di,Li,Ui,Er))?!1:(xr.crossVectors(Vn,Wn),t=[xr.x,xr.y,xr.z],Aa(t,Di,Li,Ui,Er))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,mn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(mn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Pn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Pn=[new I,new I,new I,new I,new I,new I,new I,new I],mn=new I,gr=new Qn,Di=new I,Li=new I,Ui=new I,Vn=new I,Wn=new I,hi=new I,xs=new I,Er=new I,xr=new I,ui=new I;function Aa(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){ui.fromArray(i,r);let a=s.x*Math.abs(ui.x)+s.y*Math.abs(ui.y)+s.z*Math.abs(ui.z),l=e.dot(ui),c=t.dot(ui),h=n.dot(ui);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Mu=new Qn,ys=new I,Ca=new I,jn=class{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Mu.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ys.subVectors(e,this.center);let t=ys.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(ys,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ca.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ys.copy(e.center).add(Ca)),this.expandByPoint(ys.copy(e.center).sub(Ca))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},In=new I,Pa=new I,yr=new I,Xn=new I,Ia=new I,Mr=new I,Ha=new I,Zi=class{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,In)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=In.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(In.copy(this.origin).addScaledVector(this.direction,t),In.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Pa.copy(e).add(t).multiplyScalar(.5),yr.copy(t).sub(e).normalize(),Xn.copy(this.origin).sub(Pa);let r=e.distanceTo(t)*.5,o=-this.direction.dot(yr),a=Xn.dot(this.direction),l=-Xn.dot(yr),c=Xn.lengthSq(),h=Math.abs(1-o*o),u,f,d,m;if(h>0)if(u=o*l-a,f=o*a-l,m=r*h,u>=0)if(f>=-m)if(f<=m){let E=1/h;u*=E,f*=E,d=u*(u+o*f+2*a)+f*(o*u+f+2*l)+c}else f=r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;else f<=-m?(u=Math.max(0,-(-o*r+a)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=m?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(o*r+a)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=o>0?-r:r,u=Math.max(0,-(o*f+a)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Pa).addScaledVector(yr,f),d}intersectSphere(e,t){In.subVectors(e.center,this.origin);let n=In.dot(this.direction),s=In.dot(In)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(e.min.x-f.x)*c,s=(e.max.x-f.x)*c):(n=(e.max.x-f.x)*c,s=(e.min.x-f.x)*c),h>=0?(r=(e.min.y-f.y)*h,o=(e.max.y-f.y)*h):(r=(e.max.y-f.y)*h,o=(e.min.y-f.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-f.z)*u,l=(e.max.z-f.z)*u):(a=(e.max.z-f.z)*u,l=(e.min.z-f.z)*u),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,In)!==null}intersectTriangle(e,t,n,s,r){Ia.subVectors(t,e),Mr.subVectors(n,e),Ha.crossVectors(Ia,Mr);let o=this.direction.dot(Ha),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Xn.subVectors(this.origin,e);let l=a*this.direction.dot(Mr.crossVectors(Xn,Mr));if(l<0)return null;let c=a*this.direction.dot(Ia.cross(Xn));if(c<0||l+c>o)return null;let h=-a*Xn.dot(Ha);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ct=class i{constructor(e,t,n,s,r,o,a,l,c,h,u,f,d,m,E,g){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,l,c,h,u,f,d,m,E,g)}set(e,t,n,s,r,o,a,l,c,h,u,f,d,m,E,g){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=m,p[11]=E,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Bi.setFromMatrixColumn(e,0).length(),r=1/Bi.setFromMatrixColumn(e,1).length(),o=1/Bi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let f=o*h,d=o*u,m=a*h,E=a*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=d+m*c,t[5]=f-E*c,t[9]=-a*l,t[2]=E-f*c,t[6]=m+d*c,t[10]=o*l}else if(e.order==="YXZ"){let f=l*h,d=l*u,m=c*h,E=c*u;t[0]=f+E*a,t[4]=m*a-d,t[8]=o*c,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=d*a-m,t[6]=E+f*a,t[10]=o*l}else if(e.order==="ZXY"){let f=l*h,d=l*u,m=c*h,E=c*u;t[0]=f-E*a,t[4]=-o*u,t[8]=m+d*a,t[1]=d+m*a,t[5]=o*h,t[9]=E-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let f=o*h,d=o*u,m=a*h,E=a*u;t[0]=l*h,t[4]=m*c-d,t[8]=f*c+E,t[1]=l*u,t[5]=E*c+f,t[9]=d*c-m,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let f=o*l,d=o*c,m=a*l,E=a*c;t[0]=l*h,t[4]=E-f*u,t[8]=m*u+d,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=d*u+m,t[10]=f-E*u}else if(e.order==="XZY"){let f=o*l,d=o*c,m=a*l,E=a*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=f*u+E,t[5]=o*h,t[9]=d*u-m,t[2]=m*u-d,t[6]=a*h,t[10]=E*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(_u,e,vu)}lookAt(e,t,n){let s=this.elements;return $t.subVectors(e,t),$t.lengthSq()===0&&($t.z=1),$t.normalize(),Yn.crossVectors(n,$t),Yn.lengthSq()===0&&(Math.abs(n.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),Yn.crossVectors(n,$t)),Yn.normalize(),_r.crossVectors($t,Yn),s[0]=Yn.x,s[4]=_r.x,s[8]=$t.x,s[1]=Yn.y,s[5]=_r.y,s[9]=$t.y,s[2]=Yn.z,s[6]=_r.z,s[10]=$t.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],m=n[2],E=n[6],g=n[10],p=n[14],_=n[3],v=n[7],x=n[11],b=n[15],R=s[0],A=s[4],P=s[8],T=s[12],M=s[1],H=s[5],B=s[9],F=s[13],k=s[2],V=s[6],W=s[10],le=s[14],O=s[3],he=s[7],re=s[11],me=s[15];return r[0]=o*R+a*M+l*k+c*O,r[4]=o*A+a*H+l*V+c*he,r[8]=o*P+a*B+l*W+c*re,r[12]=o*T+a*F+l*le+c*me,r[1]=h*R+u*M+f*k+d*O,r[5]=h*A+u*H+f*V+d*he,r[9]=h*P+u*B+f*W+d*re,r[13]=h*T+u*F+f*le+d*me,r[2]=m*R+E*M+g*k+p*O,r[6]=m*A+E*H+g*V+p*he,r[10]=m*P+E*B+g*W+p*re,r[14]=m*T+E*F+g*le+p*me,r[3]=_*R+v*M+x*k+b*O,r[7]=_*A+v*H+x*V+b*he,r[11]=_*P+v*B+x*W+b*re,r[15]=_*T+v*F+x*le+b*me,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],u=e[6],f=e[10],d=e[14],m=e[3],E=e[7],g=e[11],p=e[15];return m*(+r*l*u-s*c*u-r*a*f+n*c*f+s*a*d-n*l*d)+E*(+t*l*d-t*c*f+r*o*f-s*o*d+s*c*h-r*l*h)+g*(+t*c*u-t*a*d-r*o*u+n*o*d+r*a*h-n*c*h)+p*(-s*a*h-t*l*u+t*a*f+s*o*u-n*o*f+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=e[9],f=e[10],d=e[11],m=e[12],E=e[13],g=e[14],p=e[15],_=u*g*c-E*f*c+E*l*d-a*g*d-u*l*p+a*f*p,v=m*f*c-h*g*c-m*l*d+o*g*d+h*l*p-o*f*p,x=h*E*c-m*u*c+m*a*d-o*E*d-h*a*p+o*u*p,b=m*u*l-h*E*l-m*a*f+o*E*f+h*a*g-o*u*g,R=t*_+n*v+s*x+r*b;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/R;return e[0]=_*A,e[1]=(E*f*r-u*g*r-E*s*d+n*g*d+u*s*p-n*f*p)*A,e[2]=(a*g*r-E*l*r+E*s*c-n*g*c-a*s*p+n*l*p)*A,e[3]=(u*l*r-a*f*r-u*s*c+n*f*c+a*s*d-n*l*d)*A,e[4]=v*A,e[5]=(h*g*r-m*f*r+m*s*d-t*g*d-h*s*p+t*f*p)*A,e[6]=(m*l*r-o*g*r-m*s*c+t*g*c+o*s*p-t*l*p)*A,e[7]=(o*f*r-h*l*r+h*s*c-t*f*c-o*s*d+t*l*d)*A,e[8]=x*A,e[9]=(m*u*r-h*E*r-m*n*d+t*E*d+h*n*p-t*u*p)*A,e[10]=(o*E*r-m*a*r+m*n*c-t*E*c-o*n*p+t*a*p)*A,e[11]=(h*a*r-o*u*r-h*n*c+t*u*c+o*n*d-t*a*d)*A,e[12]=b*A,e[13]=(h*E*s-m*u*s+m*n*f-t*E*f-h*n*g+t*u*g)*A,e[14]=(m*a*s-o*E*s-m*n*l+t*E*l+o*n*g-t*a*g)*A,e[15]=(o*u*s-h*a*s+h*n*l-t*u*l-o*n*f+t*a*f)*A,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,u=a+a,f=r*c,d=r*h,m=r*u,E=o*h,g=o*u,p=a*u,_=l*c,v=l*h,x=l*u,b=n.x,R=n.y,A=n.z;return s[0]=(1-(E+p))*b,s[1]=(d+x)*b,s[2]=(m-v)*b,s[3]=0,s[4]=(d-x)*R,s[5]=(1-(f+p))*R,s[6]=(g+_)*R,s[7]=0,s[8]=(m+v)*A,s[9]=(g-_)*A,s[10]=(1-(f+E))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Bi.set(s[0],s[1],s[2]).length(),o=Bi.set(s[4],s[5],s[6]).length(),a=Bi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],gn.copy(this);let c=1/r,h=1/o,u=1/a;return gn.elements[0]*=c,gn.elements[1]*=c,gn.elements[2]*=c,gn.elements[4]*=h,gn.elements[5]*=h,gn.elements[6]*=h,gn.elements[8]*=u,gn.elements[9]*=u,gn.elements[10]*=u,t.setFromRotationMatrix(gn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=Mn){let l=this.elements,c=2*r/(t-e),h=2*r/(n-s),u=(t+e)/(t-e),f=(n+s)/(n-s),d,m;if(a===Mn)d=-(o+r)/(o-r),m=-2*o*r/(o-r);else if(a===As)d=-o/(o-r),m=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=Mn){let l=this.elements,c=1/(t-e),h=1/(n-s),u=1/(o-r),f=(t+e)*c,d=(n+s)*h,m,E;if(a===Mn)m=(o+r)*u,E=-2*u;else if(a===As)m=r*u,E=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=E,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Bi=new I,gn=new ct,_u=new I(0,0,0),vu=new I(1,1,1),Yn=new I,_r=new I,$t=new I,ic=new ct,sc=new vt,Wt=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(t){case"XYZ":this._y=Math.asin(Qe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Qe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qe(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Qe(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Qe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,d));break;case"XZY":this._z=Math.asin(-Qe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ic.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ic,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sc.setFromEuler(this),this.setFromQuaternion(sc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Wt.DEFAULT_ORDER="XYZ";var Is=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},wu=0,rc=new I,Fi=new vt,Hn=new ct,vr=new I,Ms=new I,Tu=new I,Su=new vt,oc=new I(1,0,0),ac=new I(0,1,0),lc=new I(0,0,1),cc={type:"added"},bu={type:"removed"},Ni={type:"childadded",child:null},Da={type:"childremoved",child:null},yt=class i extends Fn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:wu++}),this.uuid=or(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new I,t=new Wt,n=new vt,s=new I(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ct},normalMatrix:{value:new Ze}}),this.matrix=new ct,this.matrixWorld=new ct,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Is,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Fi.setFromAxisAngle(e,t),this.quaternion.multiply(Fi),this}rotateOnWorldAxis(e,t){return Fi.setFromAxisAngle(e,t),this.quaternion.premultiply(Fi),this}rotateX(e){return this.rotateOnAxis(oc,e)}rotateY(e){return this.rotateOnAxis(ac,e)}rotateZ(e){return this.rotateOnAxis(lc,e)}translateOnAxis(e,t){return rc.copy(e).applyQuaternion(this.quaternion),this.position.add(rc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(oc,e)}translateY(e){return this.translateOnAxis(ac,e)}translateZ(e){return this.translateOnAxis(lc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Hn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?vr.copy(e):vr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ms.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Hn.lookAt(Ms,vr,this.up):Hn.lookAt(vr,Ms,this.up),this.quaternion.setFromRotationMatrix(Hn),s&&(Hn.extractRotation(s.matrixWorld),Fi.setFromRotationMatrix(Hn),this.quaternion.premultiply(Fi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(cc),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(bu),Da.child=e,this.dispatchEvent(Da),Da.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Hn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Hn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Hn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(cc),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ms,e,Tu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ms,Su,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),u=o(e.shapes),f=o(e.skeletons),d=o(e.animations),m=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=s,n;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};yt.DEFAULT_UP=new I(0,1,0);yt.DEFAULT_MATRIX_AUTO_UPDATE=!0;yt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var En=new I,Dn=new I,La=new I,Ln=new I,Oi=new I,Gi=new I,hc=new I,Ua=new I,Ba=new I,Fa=new I,Na=new lt,Oa=new lt,Ga=new lt,Jn=class i{constructor(e=new I,t=new I,n=new I){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),En.subVectors(e,t),s.cross(En);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){En.subVectors(s,t),Dn.subVectors(n,t),La.subVectors(e,t);let o=En.dot(En),a=En.dot(Dn),l=En.dot(La),c=Dn.dot(Dn),h=Dn.dot(La),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-a*h)*f,m=(o*h-a*l)*f;return r.set(1-d-m,m,d)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Ln)===null?!1:Ln.x>=0&&Ln.y>=0&&Ln.x+Ln.y<=1}static getInterpolation(e,t,n,s,r,o,a,l){return this.getBarycoord(e,t,n,s,Ln)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ln.x),l.addScaledVector(o,Ln.y),l.addScaledVector(a,Ln.z),l)}static getInterpolatedAttribute(e,t,n,s,r,o){return Na.setScalar(0),Oa.setScalar(0),Ga.setScalar(0),Na.fromBufferAttribute(e,t),Oa.fromBufferAttribute(e,n),Ga.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Na,r.x),o.addScaledVector(Oa,r.y),o.addScaledVector(Ga,r.z),o}static isFrontFacing(e,t,n,s){return En.subVectors(n,t),Dn.subVectors(e,t),En.cross(Dn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return En.subVectors(this.c,this.b),Dn.subVectors(this.a,this.b),En.cross(Dn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;Oi.subVectors(s,n),Gi.subVectors(r,n),Ua.subVectors(e,n);let l=Oi.dot(Ua),c=Gi.dot(Ua);if(l<=0&&c<=0)return t.copy(n);Ba.subVectors(e,s);let h=Oi.dot(Ba),u=Gi.dot(Ba);if(h>=0&&u<=h)return t.copy(s);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(n).addScaledVector(Oi,o);Fa.subVectors(e,r);let d=Oi.dot(Fa),m=Gi.dot(Fa);if(m>=0&&d<=m)return t.copy(r);let E=d*c-l*m;if(E<=0&&c>=0&&m<=0)return a=c/(c-m),t.copy(n).addScaledVector(Gi,a);let g=h*m-d*u;if(g<=0&&u-h>=0&&d-m>=0)return hc.subVectors(r,s),a=(u-h)/(u-h+(d-m)),t.copy(s).addScaledVector(hc,a);let p=1/(g+E+f);return o=E*p,a=f*p,t.copy(n).addScaledVector(Oi,o).addScaledVector(Gi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},mh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},qn={h:0,s:0,l:0},wr={h:0,s:0,l:0};function ka(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var _e=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Lt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,rt.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=rt.workingColorSpace){return this.r=e,this.g=t,this.b=n,rt.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=rt.workingColorSpace){if(e=gu(e,1),t=Qe(t,0,1),n=Qe(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=ka(o,r,e+1/3),this.g=ka(o,r,e),this.b=ka(o,r,e-1/3)}return rt.toWorkingColorSpace(this,s),this}setStyle(e,t=Lt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Lt){let n=mh[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Un(e.r),this.g=Un(e.g),this.b=Un(e.b),this}copyLinearToSRGB(e){return this.r=Wi(e.r),this.g=Wi(e.g),this.b=Wi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Lt){return rt.fromWorkingColorSpace(Ot.copy(this),e),Math.round(Qe(Ot.r*255,0,255))*65536+Math.round(Qe(Ot.g*255,0,255))*256+Math.round(Qe(Ot.b*255,0,255))}getHexString(e=Lt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=rt.workingColorSpace){rt.fromWorkingColorSpace(Ot.copy(this),t);let n=Ot.r,s=Ot.g,r=Ot.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=rt.workingColorSpace){return rt.fromWorkingColorSpace(Ot.copy(this),t),e.r=Ot.r,e.g=Ot.g,e.b=Ot.b,e}getStyle(e=Lt){rt.fromWorkingColorSpace(Ot.copy(this),e);let t=Ot.r,n=Ot.g,s=Ot.b;return e!==Lt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(qn),this.setHSL(qn.h+e,qn.s+t,qn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(qn),e.getHSL(wr);let n=Ta(qn.h,wr.h,t),s=Ta(qn.s,wr.s,t),r=Ta(qn.l,wr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ot=new _e;_e.NAMES=mh;var Ru=0,yn=class extends Fn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ru++}),this.uuid=or(),this.name="",this.type="Material",this.blending=mi,this.side=Bn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Gr,this.blendDst=kr,this.blendEquation=$n,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new _e(0,0,0),this.blendAlpha=0,this.depthFunc=gi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=el,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=pi,this.stencilZFail=pi,this.stencilZPass=pi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==mi&&(n.blending=this.blending),this.side!==Bn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Gr&&(n.blendSrc=this.blendSrc),this.blendDst!==kr&&(n.blendDst=this.blendDst),this.blendEquation!==$n&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==gi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==el&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==pi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==pi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==pi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Ne=class extends yn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new _e(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.combine=fl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var St=new I,Tr=new ge,Au=0,Ut=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Au++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=tl,this.updateRanges=[],this.gpuType=Sn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Tr.fromBufferAttribute(this,t),Tr.applyMatrix3(e),this.setXY(t,Tr.x,Tr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix3(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix4(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyNormalMatrix(e),this.setXYZ(t,St.x,St.y,St.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.transformDirection(e),this.setXYZ(t,St.x,St.y,St.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Es(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=qt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Es(t,this.array)),t}setX(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Es(t,this.array)),t}setY(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Es(t,this.array)),t}setZ(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Es(t,this.array)),t}setW(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),n=qt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),n=qt(n,this.array),s=qt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),n=qt(n,this.array),s=qt(s,this.array),r=qt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==tl&&(e.usage=this.usage),e}};var Hs=class extends Ut{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Ds=class extends Ut{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var je=class extends Ut{constructor(e,t,n){super(new Float32Array(e),t,n)}},Cu=0,on=new ct,za=new yt,ki=new I,Qt=new Qn,_s=new Qn,Pt=new I,Mt=class i extends Fn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Cu++}),this.uuid=or(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Al(e)?Ds:Hs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ze().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return on.makeRotationFromQuaternion(e),this.applyMatrix4(on),this}rotateX(e){return on.makeRotationX(e),this.applyMatrix4(on),this}rotateY(e){return on.makeRotationY(e),this.applyMatrix4(on),this}rotateZ(e){return on.makeRotationZ(e),this.applyMatrix4(on),this}translate(e,t,n){return on.makeTranslation(e,t,n),this.applyMatrix4(on),this}scale(e,t,n){return on.makeScale(e,t,n),this.applyMatrix4(on),this}lookAt(e){return za.lookAt(e),za.updateMatrix(),this.applyMatrix4(za.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ki).negate(),this.translate(ki.x,ki.y,ki.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new je(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Qn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];Qt.setFromBufferAttribute(r),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new jn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){let n=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];_s.setFromBufferAttribute(a),this.morphTargetsRelative?(Pt.addVectors(Qt.min,_s.min),Qt.expandByPoint(Pt),Pt.addVectors(Qt.max,_s.max),Qt.expandByPoint(Pt)):(Qt.expandByPoint(_s.min),Qt.expandByPoint(_s.max))}Qt.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Pt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Pt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Pt.fromBufferAttribute(a,c),l&&(ki.fromBufferAttribute(e,c),Pt.add(ki)),s=Math.max(s,n.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ut(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let P=0;P<n.count;P++)a[P]=new I,l[P]=new I;let c=new I,h=new I,u=new I,f=new ge,d=new ge,m=new ge,E=new I,g=new I;function p(P,T,M){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,T),u.fromBufferAttribute(n,M),f.fromBufferAttribute(r,P),d.fromBufferAttribute(r,T),m.fromBufferAttribute(r,M),h.sub(c),u.sub(c),d.sub(f),m.sub(f);let H=1/(d.x*m.y-m.x*d.y);isFinite(H)&&(E.copy(h).multiplyScalar(m.y).addScaledVector(u,-d.y).multiplyScalar(H),g.copy(u).multiplyScalar(d.x).addScaledVector(h,-m.x).multiplyScalar(H),a[P].add(E),a[T].add(E),a[M].add(E),l[P].add(g),l[T].add(g),l[M].add(g))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let P=0,T=_.length;P<T;++P){let M=_[P],H=M.start,B=M.count;for(let F=H,k=H+B;F<k;F+=3)p(e.getX(F+0),e.getX(F+1),e.getX(F+2))}let v=new I,x=new I,b=new I,R=new I;function A(P){b.fromBufferAttribute(s,P),R.copy(b);let T=a[P];v.copy(T),v.sub(b.multiplyScalar(b.dot(T))).normalize(),x.crossVectors(R,T);let H=x.dot(l[P])<0?-1:1;o.setXYZW(P,v.x,v.y,v.z,H)}for(let P=0,T=_.length;P<T;++P){let M=_[P],H=M.start,B=M.count;for(let F=H,k=H+B;F<k;F+=3)A(e.getX(F+0)),A(e.getX(F+1)),A(e.getX(F+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ut(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let s=new I,r=new I,o=new I,a=new I,l=new I,c=new I,h=new I,u=new I;if(e)for(let f=0,d=e.count;f<d;f+=3){let m=e.getX(f+0),E=e.getX(f+1),g=e.getX(f+2);s.fromBufferAttribute(t,m),r.fromBufferAttribute(t,E),o.fromBufferAttribute(t,g),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,m),l.fromBufferAttribute(n,E),c.fromBufferAttribute(n,g),a.add(h),l.add(h),c.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(E,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,u=a.normalized,f=new c.constructor(l.length*h),d=0,m=0;for(let E=0,g=l.length;E<g;E++){a.isInterleavedBufferAttribute?d=l[E]*a.data.stride+a.offset:d=l[E]*h;for(let p=0;p<h;p++)f[m++]=c[d++]}return new Ut(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,n);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=e(f,n);l.push(d)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},uc=new ct,di=new Zi,Sr=new jn,dc=new I,br=new I,Rr=new I,Ar=new I,Va=new I,Cr=new I,fc=new I,Pr=new I,y=class extends yt{constructor(e=new Mt,t=new Ne){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Cr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Va.fromBufferAttribute(u,e),o?Cr.addScaledVector(Va,h):Cr.addScaledVector(Va.sub(t),h))}t.add(Cr)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Sr.copy(n.boundingSphere),Sr.applyMatrix4(r),di.copy(e.ray).recast(e.near),!(Sr.containsPoint(di.origin)===!1&&(di.intersectSphere(Sr,dc)===null||di.origin.distanceToSquared(dc)>(e.far-e.near)**2))&&(uc.copy(r).invert(),di.copy(e.ray).applyMatrix4(uc),!(n.boundingBox!==null&&di.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,di)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,E=f.length;m<E;m++){let g=f[m],p=o[g.materialIndex],_=Math.max(g.start,d.start),v=Math.min(a.count,Math.min(g.start+g.count,d.start+d.count));for(let x=_,b=v;x<b;x+=3){let R=a.getX(x),A=a.getX(x+1),P=a.getX(x+2);s=Ir(this,p,e,n,c,h,u,R,A,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let m=Math.max(0,d.start),E=Math.min(a.count,d.start+d.count);for(let g=m,p=E;g<p;g+=3){let _=a.getX(g),v=a.getX(g+1),x=a.getX(g+2);s=Ir(this,o,e,n,c,h,u,_,v,x),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let m=0,E=f.length;m<E;m++){let g=f[m],p=o[g.materialIndex],_=Math.max(g.start,d.start),v=Math.min(l.count,Math.min(g.start+g.count,d.start+d.count));for(let x=_,b=v;x<b;x+=3){let R=x,A=x+1,P=x+2;s=Ir(this,p,e,n,c,h,u,R,A,P),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let m=Math.max(0,d.start),E=Math.min(l.count,d.start+d.count);for(let g=m,p=E;g<p;g+=3){let _=g,v=g+1,x=g+2;s=Ir(this,o,e,n,c,h,u,_,v,x),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function Pu(i,e,t,n,s,r,o,a){let l;if(e.side===Ft?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,e.side===Bn,a),l===null)return null;Pr.copy(a),Pr.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Pr);return c<t.near||c>t.far?null:{distance:c,point:Pr.clone(),object:i}}function Ir(i,e,t,n,s,r,o,a,l,c){i.getVertexPosition(a,br),i.getVertexPosition(l,Rr),i.getVertexPosition(c,Ar);let h=Pu(i,e,t,n,br,Rr,Ar,fc);if(h){let u=new I;Jn.getBarycoord(fc,br,Rr,Ar,u),s&&(h.uv=Jn.getInterpolatedAttribute(s,a,l,c,u,new ge)),r&&(h.uv1=Jn.getInterpolatedAttribute(r,a,l,c,u,new ge)),o&&(h.normal=Jn.getInterpolatedAttribute(o,a,l,c,u,new I),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:l,c,normal:new I,materialIndex:0};Jn.getNormal(br,Rr,Ar,f.normal),h.face=f,h.barycoord=u}return h}var j=class i extends Mt{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],f=0,d=0;m("z","y","x",-1,-1,n,t,e,o,r,0),m("z","y","x",1,-1,n,t,-e,o,r,1),m("x","z","y",1,1,e,n,t,s,o,2),m("x","z","y",1,-1,e,n,-t,s,o,3),m("x","y","z",1,-1,e,t,n,s,r,4),m("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new je(c,3)),this.setAttribute("normal",new je(h,3)),this.setAttribute("uv",new je(u,2));function m(E,g,p,_,v,x,b,R,A,P,T){let M=x/A,H=b/P,B=x/2,F=b/2,k=R/2,V=A+1,W=P+1,le=0,O=0,he=new I;for(let re=0;re<W;re++){let me=re*H-F;for(let Re=0;Re<V;Re++){let Ae=Re*M-B;he[E]=Ae*_,he[g]=me*v,he[p]=k,c.push(he.x,he.y,he.z),he[E]=0,he[g]=0,he[p]=R>0?1:-1,h.push(he.x,he.y,he.z),u.push(Re/A),u.push(1-re/P),le+=1}}for(let re=0;re<P;re++)for(let me=0;me<A;me++){let Re=f+me+V*re,Ae=f+me+V*(re+1),q=f+(me+1)+V*(re+1),ae=f+(me+1)+V*re;l.push(Re,Ae,ae),l.push(Ae,q,ae),O+=6}a.addGroup(d,O,T),d+=O,f+=le}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function bi(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Gt(i){let e={};for(let t=0;t<i.length;t++){let n=bi(i[t]);for(let s in n)e[s]=n[s]}return e}function Iu(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Cl(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:rt.workingColorSpace}var la={clone:bi,merge:Gt},Hu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Du=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Bt=class extends yn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hu,this.fragmentShader=Du,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=bi(e.uniforms),this.uniformsGroups=Iu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Ls=class extends yt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ct,this.projectionMatrix=new ct,this.projectionMatrixInverse=new ct,this.coordinateSystem=Mn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Zn=new I,pc=new ge,mc=new ge,bt=class extends Ls{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Cs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(wa*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Cs*2*Math.atan(Math.tan(wa*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Zn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Zn.x,Zn.y).multiplyScalar(-e/Zn.z),Zn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Zn.x,Zn.y).multiplyScalar(-e/Zn.z)}getViewSize(e,t){return this.getViewBounds(e,pc,mc),t.subVectors(mc,pc)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(wa*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},zi=-90,Vi=1,Zr=class extends yt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new bt(zi,Vi,e,t);s.layers=this.layers,this.add(s);let r=new bt(zi,Vi,e,t);r.layers=this.layers,this.add(r);let o=new bt(zi,Vi,e,t);o.layers=this.layers,this.add(o);let a=new bt(zi,Vi,e,t);a.layers=this.layers,this.add(a);let l=new bt(zi,Vi,e,t);l.layers=this.layers,this.add(l);let c=new bt(zi,Vi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===Mn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===As)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let E=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,l),e.setRenderTarget(n,4,s),e.render(t,c),n.texture.generateMipmaps=E,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(u,f,d),e.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},Us=class extends Vt{constructor(e=[],t=Ti,n,s,r,o,a,l,c,h){super(e,t,n,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Jr=class extends cn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Us(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:xn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new j(5,5,5),r=new Bt({name:"CubemapFromEquirect",uniforms:bi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ft,blending:Nn});r.uniforms.tEquirect.value=t;let o=new y(s,r),a=t.minFilter;return t.minFilter===ii&&(t.minFilter=xn),new Zr(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}},ue=class extends yt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Lu={type:"move"},Ji=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ue,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ue,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ue,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let E of e.hand.values()){let g=t.getJointPose(E,n),p=this._getHandJoint(c,E);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,m=.005;c.inputState.pinching&&f>d+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Lu)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new ue;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Bs=class i{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new _e(e),this.density=t}clone(){return new i(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Fs=class extends yt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wt,this.environmentIntensity=1,this.environmentRotation=new Wt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Wa=new I,Uu=new I,Bu=new Ze,an=class{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Wa.subVectors(n,t).cross(Uu.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Wa),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Bu.getNormalMatrix(e),s=this.coplanarPoint(Wa).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},fi=new jn,Hr=new I,Ki=class{constructor(e=new an,t=new an,n=new an,s=new an,r=new an,o=new an){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Mn){let n=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],f=s[7],d=s[8],m=s[9],E=s[10],g=s[11],p=s[12],_=s[13],v=s[14],x=s[15];if(n[0].setComponents(l-r,f-c,g-d,x-p).normalize(),n[1].setComponents(l+r,f+c,g+d,x+p).normalize(),n[2].setComponents(l+o,f+h,g+m,x+_).normalize(),n[3].setComponents(l-o,f-h,g-m,x-_).normalize(),n[4].setComponents(l-a,f-u,g-E,x-v).normalize(),t===Mn)n[5].setComponents(l+a,f+u,g+E,x+v).normalize();else if(t===As)n[5].setComponents(a,u,E,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),fi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),fi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(fi)}intersectsSprite(e){return fi.center.set(0,0,0),fi.radius=.7071067811865476,fi.applyMatrix4(e.matrixWorld),this.intersectsSphere(fi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Hr.x=s.normal.x>0?e.max.x:e.min.x,Hr.y=s.normal.y>0?e.max.y:e.min.y,Hr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Hr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ns=class extends yn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new _e(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Kr=new I,$r=new I,gc=new ct,vs=new Zi,Dr=new jn,Xa=new I,Ec=new I,Qr=class extends yt{constructor(e=new Mt,t=new Ns){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)Kr.fromBufferAttribute(t,s-1),$r.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=Kr.distanceTo($r);e.setAttribute("lineDistance",new je(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Dr.copy(n.boundingSphere),Dr.applyMatrix4(s),Dr.radius+=r,e.ray.intersectsSphere(Dr)===!1)return;gc.copy(s).invert(),vs.copy(e.ray).applyMatrix4(gc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){let d=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let E=d,g=m-1;E<g;E+=c){let p=h.getX(E),_=h.getX(E+1),v=Lr(this,e,vs,l,p,_,E);v&&t.push(v)}if(this.isLineLoop){let E=h.getX(m-1),g=h.getX(d),p=Lr(this,e,vs,l,E,g,m-1);p&&t.push(p)}}else{let d=Math.max(0,o.start),m=Math.min(f.count,o.start+o.count);for(let E=d,g=m-1;E<g;E+=c){let p=Lr(this,e,vs,l,E,E+1,E);p&&t.push(p)}if(this.isLineLoop){let E=Lr(this,e,vs,l,m-1,d,m-1);E&&t.push(E)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Lr(i,e,t,n,s,r,o){let a=i.geometry.attributes.position;if(Kr.fromBufferAttribute(a,s),$r.fromBufferAttribute(a,r),t.distanceSqToSegment(Kr,$r,Xa,Ec)>n)return;Xa.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Xa);if(!(c<e.near||c>e.far))return{distance:c,point:Ec.clone().applyMatrix4(i.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:i}}var xc=new I,yc=new I,jr=class extends Qr{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)xc.fromBufferAttribute(t,s),yc.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+xc.distanceTo(yc);e.setAttribute("lineDistance",new je(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var xi=class extends yn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new _e(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Mc=new ct,nl=new Zi,Ur=new jn,Br=new I,$i=class extends yt{constructor(e=new Mt,t=new xi){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ur.copy(n.boundingSphere),Ur.applyMatrix4(s),Ur.radius+=r,e.ray.intersectsSphere(Ur)===!1)return;Mc.copy(s).invert(),nl.copy(e.ray).applyMatrix4(Mc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,o.start),d=Math.min(c.count,o.start+o.count);for(let m=f,E=d;m<E;m++){let g=c.getX(m);Br.fromBufferAttribute(u,g),_c(Br,g,l,s,e,t,this)}}else{let f=Math.max(0,o.start),d=Math.min(u.count,o.start+o.count);for(let m=f,E=d;m<E;m++)Br.fromBufferAttribute(u,m),_c(Br,m,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function _c(i,e,t,n,s,r,o){let a=nl.distanceSqToPoint(i);if(a<t){let l=new I;nl.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var yi=class extends Vt{constructor(e,t,n,s,r,o,a,l,c){super(e,t,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Os=class extends Vt{constructor(e,t,n=si,s,r,o,a=ln,l=ln,c,h=Xi){if(h!==Xi&&h!==rs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,o,a,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new qi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},jt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),s=0,r=n.length,o;t?o=t:o=e*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);let h=n[s],f=n[s+1]-h,d=(o-h)/f;return(s+d)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new ge:new I);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new I,s=[],r=[],o=[],a=new I,l=new ct;for(let d=0;d<=e;d++){let m=d/e;s[d]=this.getTangentAt(m,new I)}r[0]=new I,o[0]=new I;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),f=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),f<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let d=1;d<=e;d++){if(r[d]=r[d-1].clone(),o[d]=o[d-1].clone(),a.crossVectors(s[d-1],s[d]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(Qe(s[d-1].dot(s[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(a,m))}o[d].crossVectors(s[d],r[d])}if(t===!0){let d=Math.acos(Qe(r[0].dot(r[e]),-1,1));d/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(d=-d);for(let m=1;m<=e;m++)r[m].applyMatrix4(l.makeRotationAxis(s[m],d*m)),o[m].crossVectors(s[m],r[m])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Qi=class extends jt{constructor(e=0,t=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new ge){let n=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},eo=class extends Qi{constructor(e,t,n,s,r,o){super(e,t,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Pl(){let i=0,e=0,t=0,n=0;function s(r,o,a,l){i=r,e=a,t=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let f=(o-r)/c-(a-r)/(c+h)+(a-o)/h,d=(a-o)/h-(l-o)/(h+u)+(l-a)/u;f*=h,d*=h,s(o,a,f,d)},calc:function(r){let o=r*r,a=o*r;return i+e*r+t*o+n*a}}}var Fr=new I,Ya=new Pl,qa=new Pl,Za=new Pl,ji=class extends jt{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new I){let n=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Fr.subVectors(s[0],s[1]).add(s[0]),c=Fr);let u=s[a%r],f=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Fr.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Fr),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,m=Math.pow(c.distanceToSquared(u),d),E=Math.pow(u.distanceToSquared(f),d),g=Math.pow(f.distanceToSquared(h),d);E<1e-4&&(E=1),m<1e-4&&(m=E),g<1e-4&&(g=E),Ya.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,m,E,g),qa.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,m,E,g),Za.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,m,E,g)}else this.curveType==="catmullrom"&&(Ya.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),qa.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),Za.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return n.set(Ya.calc(l),qa.calc(l),Za.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new I().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function vc(i,e,t,n,s){let r=(n-e)*.5,o=(s-t)*.5,a=i*i,l=i*a;return(2*t-2*n+r+o)*l+(-3*t+3*n-2*r-o)*a+r*i+t}function Fu(i,e){let t=1-i;return t*t*e}function Nu(i,e){return 2*(1-i)*i*e}function Ou(i,e){return i*i*e}function Ts(i,e,t,n){return Fu(i,e)+Nu(i,t)+Ou(i,n)}function Gu(i,e){let t=1-i;return t*t*t*e}function ku(i,e){let t=1-i;return 3*t*t*i*e}function zu(i,e){return 3*(1-i)*i*i*e}function Vu(i,e){return i*i*i*e}function Ss(i,e,t,n,s){return Gu(i,e)+ku(i,t)+zu(i,n)+Vu(i,s)}var Gs=class extends jt{constructor(e=new ge,t=new ge,n=new ge,s=new ge){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new ge){let n=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Ss(e,s.x,r.x,o.x,a.x),Ss(e,s.y,r.y,o.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},to=class extends jt{constructor(e=new I,t=new I,n=new I,s=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new I){let n=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(Ss(e,s.x,r.x,o.x,a.x),Ss(e,s.y,r.y,o.y,a.y),Ss(e,s.z,r.z,o.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ks=class extends jt{constructor(e=new ge,t=new ge){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ge){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ge){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},no=class extends jt{constructor(e=new I,t=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new I){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new I){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},zs=class extends jt{constructor(e=new ge,t=new ge,n=new ge){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ge){let n=t,s=this.v0,r=this.v1,o=this.v2;return n.set(Ts(e,s.x,r.x,o.x),Ts(e,s.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Vs=class extends jt{constructor(e=new I,t=new I,n=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new I){let n=t,s=this.v0,r=this.v1,o=this.v2;return n.set(Ts(e,s.x,r.x,o.x),Ts(e,s.y,r.y,o.y),Ts(e,s.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ws=class extends jt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ge){let n=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return n.set(vc(a,l.x,c.x,h.x,u.x),vc(a,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new ge().fromArray(s))}return this}},il=Object.freeze({__proto__:null,ArcCurve:eo,CatmullRomCurve3:ji,CubicBezierCurve:Gs,CubicBezierCurve3:to,EllipseCurve:Qi,LineCurve:ks,LineCurve3:no,QuadraticBezierCurve:zs,QuadraticBezierCurve3:Vs,SplineCurve:Ws}),io=class extends jt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new il[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let o=s[r]-n,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(new il[s.type]().fromJSON(s))}return this}},so=class extends io{constructor(e){super(),this.type="Path",this.currentPoint=new ge,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new ks(this.currentPoint.clone(),new ge(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,s){let r=new zs(this.currentPoint.clone(),new ge(e,t),new ge(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(e,t,n,s,r,o){let a=new Gs(this.currentPoint.clone(),new ge(e,t),new ge(n,s),new ge(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new Ws(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,n,s,r,o),this}absarc(e,t,n,s,r,o){return this.absellipse(e,t,n,n,s,r,o),this}ellipse(e,t,n,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,s,r,o,a,l),this}absellipse(e,t,n,s,r,o,a,l){let c=new Qi(e,t,n,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},ei=class i extends Mt{constructor(e=[new ge(0,-.5),new ge(.5,0),new ge(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=Qe(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,u=new I,f=new ge,d=new I,m=new I,E=new I,g=0,p=0;for(let _=0;_<=e.length-1;_++)switch(_){case 0:g=e[_+1].x-e[_].x,p=e[_+1].y-e[_].y,d.x=p*1,d.y=-g,d.z=p*0,E.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(E.x,E.y,E.z);break;default:g=e[_+1].x-e[_].x,p=e[_+1].y-e[_].y,d.x=p*1,d.y=-g,d.z=p*0,m.copy(d),d.x+=E.x,d.y+=E.y,d.z+=E.z,d.normalize(),l.push(d.x,d.y,d.z),E.copy(m)}for(let _=0;_<=t;_++){let v=n+_*h*s,x=Math.sin(v),b=Math.cos(v);for(let R=0;R<=e.length-1;R++){u.x=e[R].x*x,u.y=e[R].y,u.z=e[R].x*b,o.push(u.x,u.y,u.z),f.x=_/t,f.y=R/(e.length-1),a.push(f.x,f.y);let A=l[3*R+0]*x,P=l[3*R+1],T=l[3*R+0]*b;c.push(A,P,T)}}for(let _=0;_<t;_++)for(let v=0;v<e.length-1;v++){let x=v+_*e.length,b=x,R=x+e.length,A=x+e.length+1,P=x+1;r.push(b,R,P),r.push(A,P,R)}this.setIndex(r),this.setAttribute("position",new je(o,3)),this.setAttribute("uv",new je(a,2)),this.setAttribute("normal",new je(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}},wt=class i extends ei{constructor(e=1,t=1,n=4,s=8){let r=new so;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:n,radialSegments:s}}static fromJSON(e){return new i(e.radius,e.length,e.capSegments,e.radialSegments)}},It=class i extends Mt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new I,h=new ge;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=t;u++,f+=3){let d=n+u/t*s;c.x=e*Math.cos(d),c.y=e*Math.sin(d),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[f]/e+1)/2,h.y=(o[f+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new je(o,3)),this.setAttribute("normal",new je(a,3)),this.setAttribute("uv",new je(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Me=class i extends Mt{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],f=[],d=[],m=0,E=[],g=n/2,p=0;_(),o===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new je(u,3)),this.setAttribute("normal",new je(f,3)),this.setAttribute("uv",new je(d,2));function _(){let x=new I,b=new I,R=0,A=(t-e)/n;for(let P=0;P<=r;P++){let T=[],M=P/r,H=M*(t-e)+e;for(let B=0;B<=s;B++){let F=B/s,k=F*l+a,V=Math.sin(k),W=Math.cos(k);b.x=H*V,b.y=-M*n+g,b.z=H*W,u.push(b.x,b.y,b.z),x.set(V,A,W).normalize(),f.push(x.x,x.y,x.z),d.push(F,1-M),T.push(m++)}E.push(T)}for(let P=0;P<s;P++)for(let T=0;T<r;T++){let M=E[T][P],H=E[T+1][P],B=E[T+1][P+1],F=E[T][P+1];(e>0||T!==0)&&(h.push(M,H,F),R+=3),(t>0||T!==r-1)&&(h.push(H,B,F),R+=3)}c.addGroup(p,R,0),p+=R}function v(x){let b=m,R=new ge,A=new I,P=0,T=x===!0?e:t,M=x===!0?1:-1;for(let B=1;B<=s;B++)u.push(0,g*M,0),f.push(0,M,0),d.push(.5,.5),m++;let H=m;for(let B=0;B<=s;B++){let k=B/s*l+a,V=Math.cos(k),W=Math.sin(k);A.x=T*W,A.y=g*M,A.z=T*V,u.push(A.x,A.y,A.z),f.push(0,M,0),R.x=V*.5+.5,R.y=W*.5*M+.5,d.push(R.x,R.y),m++}for(let B=0;B<s;B++){let F=b+B,k=H+B;x===!0?h.push(k,k+1,F):h.push(k+1,k,F),P+=3}c.addGroup(p,P,x===!0?1:2),p+=P}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},it=class i extends Me{constructor(e=1,t=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Xs=class i extends Mt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],o=[];a(s),c(n),h(),this.setAttribute("position",new je(r,3)),this.setAttribute("normal",new je(r.slice(),3)),this.setAttribute("uv",new je(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(_){let v=new I,x=new I,b=new I;for(let R=0;R<t.length;R+=3)d(t[R+0],v),d(t[R+1],x),d(t[R+2],b),l(v,x,b,_)}function l(_,v,x,b){let R=b+1,A=[];for(let P=0;P<=R;P++){A[P]=[];let T=_.clone().lerp(x,P/R),M=v.clone().lerp(x,P/R),H=R-P;for(let B=0;B<=H;B++)B===0&&P===R?A[P][B]=T:A[P][B]=T.clone().lerp(M,B/H)}for(let P=0;P<R;P++)for(let T=0;T<2*(R-P)-1;T++){let M=Math.floor(T/2);T%2===0?(f(A[P][M+1]),f(A[P+1][M]),f(A[P][M])):(f(A[P][M+1]),f(A[P+1][M+1]),f(A[P+1][M]))}}function c(_){let v=new I;for(let x=0;x<r.length;x+=3)v.x=r[x+0],v.y=r[x+1],v.z=r[x+2],v.normalize().multiplyScalar(_),r[x+0]=v.x,r[x+1]=v.y,r[x+2]=v.z}function h(){let _=new I;for(let v=0;v<r.length;v+=3){_.x=r[v+0],_.y=r[v+1],_.z=r[v+2];let x=g(_)/2/Math.PI+.5,b=p(_)/Math.PI+.5;o.push(x,1-b)}m(),u()}function u(){for(let _=0;_<o.length;_+=6){let v=o[_+0],x=o[_+2],b=o[_+4],R=Math.max(v,x,b),A=Math.min(v,x,b);R>.9&&A<.1&&(v<.2&&(o[_+0]+=1),x<.2&&(o[_+2]+=1),b<.2&&(o[_+4]+=1))}}function f(_){r.push(_.x,_.y,_.z)}function d(_,v){let x=_*3;v.x=e[x+0],v.y=e[x+1],v.z=e[x+2]}function m(){let _=new I,v=new I,x=new I,b=new I,R=new ge,A=new ge,P=new ge;for(let T=0,M=0;T<r.length;T+=9,M+=6){_.set(r[T+0],r[T+1],r[T+2]),v.set(r[T+3],r[T+4],r[T+5]),x.set(r[T+6],r[T+7],r[T+8]),R.set(o[M+0],o[M+1]),A.set(o[M+2],o[M+3]),P.set(o[M+4],o[M+5]),b.copy(_).add(v).add(x).divideScalar(3);let H=g(b);E(R,M+0,_,H),E(A,M+2,v,H),E(P,M+4,x,H)}}function E(_,v,x,b){b<0&&_.x===1&&(o[v]=_.x-1),x.x===0&&x.z===0&&(o[v]=b/2/Math.PI+.5)}function g(_){return Math.atan2(_.z,-_.x)}function p(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.details)}};var Ys=class i extends Xs{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},hn=class i extends Xs{constructor(e=1,t=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},tt=class i extends Mt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,u=e/a,f=t/l,d=[],m=[],E=[],g=[];for(let p=0;p<h;p++){let _=p*f-o;for(let v=0;v<c;v++){let x=v*u-r;m.push(x,-_,0),E.push(0,0,1),g.push(v/a),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let _=0;_<a;_++){let v=_+c*p,x=_+c*(p+1),b=_+1+c*(p+1),R=_+1+c*p;d.push(v,x,R),d.push(x,b,R)}this.setIndex(d),this.setAttribute("position",new je(m,3)),this.setAttribute("normal",new je(E,3)),this.setAttribute("uv",new je(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},_n=class i extends Mt{constructor(e=.5,t=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=e,f=(t-e)/s,d=new I,m=new ge;for(let E=0;E<=s;E++){for(let g=0;g<=n;g++){let p=r+g/n*o;d.x=u*Math.cos(p),d.y=u*Math.sin(p),l.push(d.x,d.y,d.z),c.push(0,0,1),m.x=(d.x/t+1)/2,m.y=(d.y/t+1)/2,h.push(m.x,m.y)}u+=f}for(let E=0;E<s;E++){let g=E*(n+1);for(let p=0;p<n;p++){let _=p+g,v=_,x=_+n+1,b=_+n+2,R=_+1;a.push(v,x,R),a.push(x,b,R)}}this.setIndex(a),this.setAttribute("position",new je(l,3)),this.setAttribute("normal",new je(c,3)),this.setAttribute("uv",new je(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Pe=class i extends Mt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new I,f=new I,d=[],m=[],E=[],g=[];for(let p=0;p<=n;p++){let _=[],v=p/n,x=0;p===0&&o===0?x=.5/t:p===n&&l===Math.PI&&(x=-.5/t);for(let b=0;b<=t;b++){let R=b/t;u.x=-e*Math.cos(s+R*r)*Math.sin(o+v*a),u.y=e*Math.cos(o+v*a),u.z=e*Math.sin(s+R*r)*Math.sin(o+v*a),m.push(u.x,u.y,u.z),f.copy(u).normalize(),E.push(f.x,f.y,f.z),g.push(R+x,1-v),_.push(c++)}h.push(_)}for(let p=0;p<n;p++)for(let _=0;_<t;_++){let v=h[p][_+1],x=h[p][_],b=h[p+1][_],R=h[p+1][_+1];(p!==0||o>0)&&d.push(v,x,R),(p!==n-1||l<Math.PI)&&d.push(x,b,R)}this.setIndex(d),this.setAttribute("position",new je(m,3)),this.setAttribute("normal",new je(E,3)),this.setAttribute("uv",new je(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var et=class i extends Mt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r},n=Math.floor(n),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new I,u=new I,f=new I;for(let d=0;d<=n;d++)for(let m=0;m<=s;m++){let E=m/s*r,g=d/n*Math.PI*2;u.x=(e+t*Math.cos(g))*Math.cos(E),u.y=(e+t*Math.cos(g))*Math.sin(E),u.z=t*Math.sin(g),a.push(u.x,u.y,u.z),h.x=e*Math.cos(E),h.y=e*Math.sin(E),f.subVectors(u,h).normalize(),l.push(f.x,f.y,f.z),c.push(m/s),c.push(d/n)}for(let d=1;d<=n;d++)for(let m=1;m<=s;m++){let E=(s+1)*d+m-1,g=(s+1)*(d-1)+m-1,p=(s+1)*(d-1)+m,_=(s+1)*d+m;o.push(E,g,_),o.push(g,p,_)}this.setIndex(o),this.setAttribute("position",new je(a,3)),this.setAttribute("normal",new je(l,3)),this.setAttribute("uv",new je(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var qs=class i extends Mt{constructor(e=new Vs(new I(-1,-1,0),new I(-1,1,0),new I(1,1,0)),t=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new I,l=new I,c=new ge,h=new I,u=[],f=[],d=[],m=[];E(),this.setIndex(m),this.setAttribute("position",new je(u,3)),this.setAttribute("normal",new je(f,3)),this.setAttribute("uv",new je(d,2));function E(){for(let v=0;v<t;v++)g(v);g(r===!1?t:0),_(),p()}function g(v){h=e.getPointAt(v/t,h);let x=o.normals[v],b=o.binormals[v];for(let R=0;R<=s;R++){let A=R/s*Math.PI*2,P=Math.sin(A),T=-Math.cos(A);l.x=T*x.x+P*b.x,l.y=T*x.y+P*b.y,l.z=T*x.z+P*b.z,l.normalize(),f.push(l.x,l.y,l.z),a.x=h.x+n*l.x,a.y=h.y+n*l.y,a.z=h.z+n*l.z,u.push(a.x,a.y,a.z)}}function p(){for(let v=1;v<=t;v++)for(let x=1;x<=s;x++){let b=(s+1)*(v-1)+(x-1),R=(s+1)*v+(x-1),A=(s+1)*v+x,P=(s+1)*(v-1)+x;m.push(b,R,P),m.push(R,A,P)}}function _(){for(let v=0;v<=t;v++)for(let x=0;x<=s;x++)c.x=v/t,c.y=x/s,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new i(new il[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Mi=class extends yn{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new _e(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var U=class extends yn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new _e(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new _e(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Sl,this.normalScale=new ge(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var ro=class extends yn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=th,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},oo=class extends yn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Nr(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Wu(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var _i=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ao=class extends _i{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:$a,endingEnd:$a}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Qa:r=e,a=2*t-n;break;case ja:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Qa:o=e,l=2*n-t;break;case ja:o=1,l=n+s[1]-s[0];break;default:o=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,m=(n-t)/(s-t),E=m*m,g=E*m,p=-f*g+2*f*E-f*m,_=(1+f)*g+(-1.5-2*f)*E+(-.5+f)*m+1,v=(-1-d)*g+(1.5+d)*E+.5*m,x=d*g-d*E;for(let b=0;b!==a;++b)r[b]=p*o[h+b]+_*o[c+b]+v*o[l+b]+x*o[u+b];return r}},lo=class extends _i{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(n-t)/(s-t),u=1-h;for(let f=0;f!==a;++f)r[f]=o[c+f]*u+o[l+f]*h;return r}},co=class extends _i{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},en=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Nr(t,this.TimeBufferType),this.values=Nr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Nr(e.times,Array),values:Nr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new co(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new lo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ao(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case bs:t=this.InterpolantFactoryMethodDiscrete;break;case Wr:t=this.InterpolantFactoryMethodLinear;break;case Or:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return bs;case this.InterpolantFactoryMethodLinear:return Wr;case this.InterpolantFactoryMethodSmooth:return Or}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Wu(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Or,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let u=a*n,f=u-n,d=u+n;for(let m=0;m!==n;++m){let E=t[u+m];if(E!==t[f+m]||E!==t[d+m]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*n,f=o*n;for(let d=0;d!==n;++d)t[f+d]=t[u+d]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};en.prototype.ValueTypeName="";en.prototype.TimeBufferType=Float32Array;en.prototype.ValueBufferType=Float32Array;en.prototype.DefaultInterpolation=Wr;var ti=class extends en{constructor(e,t,n){super(e,t,n)}};ti.prototype.ValueTypeName="bool";ti.prototype.ValueBufferType=Array;ti.prototype.DefaultInterpolation=bs;ti.prototype.InterpolantFactoryMethodLinear=void 0;ti.prototype.InterpolantFactoryMethodSmooth=void 0;var ho=class extends en{constructor(e,t,n,s){super(e,t,n,s)}};ho.prototype.ValueTypeName="color";var uo=class extends en{constructor(e,t,n,s){super(e,t,n,s)}};uo.prototype.ValueTypeName="number";var fo=class extends _i{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)vt.slerpFlat(r,0,o,c-a,o,c,l);return r}},Zs=class extends en{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new fo(this.times,this.values,this.getValueSize(),e)}};Zs.prototype.ValueTypeName="quaternion";Zs.prototype.InterpolantFactoryMethodSmooth=void 0;var ni=class extends en{constructor(e,t,n){super(e,t,n)}};ni.prototype.ValueTypeName="string";ni.prototype.ValueBufferType=Array;ni.prototype.DefaultInterpolation=bs;ni.prototype.InterpolantFactoryMethodLinear=void 0;ni.prototype.InterpolantFactoryMethodSmooth=void 0;var po=class extends en{constructor(e,t,n,s){super(e,t,n,s)}};po.prototype.ValueTypeName="vector";var sl={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(this.files[i]=e)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}},mo=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],m=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return m}return null}}},gh=new mo,es=class{constructor(e){this.manager=e!==void 0?e:gh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};es.DEFAULT_MATERIAL_NAME="__DEFAULT";var go=class extends es{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=sl.get(e);if(o!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o;let a=Yi("img");function l(){h(),sl.add(e,this),t&&t(this),r.manager.itemEnd(e)}function c(u){h(),s&&s(u),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(e),a.src=e,a}};var Js=class extends es{constructor(e){super(e)}load(e,t,n,s){let r=new Vt,o=new go(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},vi=class extends yt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new _e(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Ks=class extends vi{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new _e(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Ja=new ct,wc=new I,Tc=new I,$s=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ge(512,512),this.map=null,this.mapPass=null,this.matrix=new ct,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ki,this._frameExtents=new ge(1,1),this._viewportCount=1,this._viewports=[new lt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;wc.setFromMatrixPosition(e.matrixWorld),t.position.copy(wc),Tc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Tc),t.updateMatrixWorld(),Ja.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ja),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ja)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},rl=class extends $s{constructor(){super(new bt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,n=Cs*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},wi=class extends vi{constructor(e,t,n=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.distance=n,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new rl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Sc=new ct,ws=new I,Ka=new I,ol=class extends $s{constructor(){super(new bt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ge(4,2),this._viewportCount=6,this._viewports=[new lt(2,1,1,1),new lt(0,1,1,1),new lt(3,1,1,1),new lt(1,1,1,1),new lt(3,0,1,1),new lt(1,0,1,1)],this._cubeDirections=[new I(1,0,0),new I(-1,0,0),new I(0,0,1),new I(0,0,-1),new I(0,1,0),new I(0,-1,0)],this._cubeUps=[new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,0,1),new I(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),ws.setFromMatrixPosition(e.matrixWorld),n.position.copy(ws),Ka.copy(n.position),Ka.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(Ka),n.updateMatrixWorld(),s.makeTranslation(-ws.x,-ws.y,-ws.z),Sc.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Sc)}},tn=class extends vi{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new ol}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Qs=class extends Ls{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},al=class extends $s{constructor(){super(new Qs(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ts=class extends vi{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.shadow=new al}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Eo=class extends bt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e,this.index=0}};var Il="\\[\\]\\.:\\/",Xu=new RegExp("["+Il+"]","g"),Hl="[^"+Il+"]",Yu="[^"+Il.replace("\\.","")+"]",qu=/((?:WC+[\/:])*)/.source.replace("WC",Hl),Zu=/(WCOD+)?/.source.replace("WCOD",Yu),Ju=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Hl),Ku=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Hl),$u=new RegExp("^"+qu+Zu+Ju+Ku+"$"),Qu=["material","materials","bones","map"],ll=class{constructor(e,t,n){let s=n||mt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},mt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Xu,"")}static parseTrackName(e){let t=$u.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Qu.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=n(a.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};mt.Composite=ll;mt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};mt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};mt.prototype.GetterByBindingType=[mt.prototype._getValue_direct,mt.prototype._getValue_array,mt.prototype._getValue_arrayElement,mt.prototype._getValue_toArray];mt.prototype.SetterByBindingTypeAndVersioning=[[mt.prototype._setValue_direct,mt.prototype._setValue_direct_setNeedsUpdate,mt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[mt.prototype._setValue_array,mt.prototype._setValue_array_setNeedsUpdate,mt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[mt.prototype._setValue_arrayElement,mt.prototype._setValue_arrayElement_setNeedsUpdate,mt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[mt.prototype._setValue_fromArray,mt.prototype._setValue_fromArray_setNeedsUpdate,mt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var gg=new Float32Array(1);var ns=class extends jr{constructor(e=10,t=10,n=4473924,s=8947848){n=new _e(n),s=new _e(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let f=0,d=0,m=-a;f<=t;f++,m+=o){l.push(-a,0,m,a,0,m),l.push(m,0,-a,m,0,a);let E=f===r?n:s;E.toArray(c,d),d+=3,E.toArray(c,d),d+=3,E.toArray(c,d),d+=3,E.toArray(c,d),d+=3}let h=new Mt;h.setAttribute("position",new je(l,3)),h.setAttribute("color",new je(c,3));let u=new Ns({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};function Dl(i,e,t,n){let s=ju(n);switch(t){case xl:return i*e;case Ml:return i*e;case _l:return i*e*2;case vl:return i*e/s.components*s.byteLength;case Do:return i*e/s.components*s.byteLength;case wl:return i*e*2/s.components*s.byteLength;case Lo:return i*e*2/s.components*s.byteLength;case yl:return i*e*3/s.components*s.byteLength;case un:return i*e*4/s.components*s.byteLength;case Uo:return i*e*4/s.components*s.byteLength;case tr:case nr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ir:case sr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Fo:case Oo:return Math.max(i,16)*Math.max(e,8)/4;case Bo:case No:return Math.max(i,8)*Math.max(e,8)/2;case Go:case ko:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case zo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Vo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Wo:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Xo:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Yo:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case qo:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Zo:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Jo:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Ko:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case $o:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case jo:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case ea:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ta:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case na:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case rr:case ia:case sa:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Tl:case ra:return Math.ceil(i/4)*Math.ceil(e/4)*8;case oa:case aa:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function ju(i){switch(i){case Tn:case ml:return{byteLength:1,components:1};case is:case gl:case ri:return{byteLength:2,components:1};case Io:case Ho:return{byteLength:2,components:4};case si:case Po:case Sn:return{byteLength:4,components:1};case El:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"175"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="175");function Gh(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function td(i){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,u=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),a.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,a),u.length===0)i.bufferSubData(c,0,h);else{u.sort((d,m)=>d.start-m.start);let f=0;for(let d=1;d<u.length;d++){let m=u[f],E=u[d];E.start<=m.start+m.count+1?m.count=Math.max(m.count,E.start+E.count-m.start):(++f,u[f]=E)}u.length=f+1;for(let d=0,m=u.length;d<m;d++){let E=u[d];i.bufferSubData(c,E.start*h.BYTES_PER_ELEMENT,h,E.start,E.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(i.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var nd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,id=`#ifdef USE_ALPHAHASH
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
#endif`,sd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,rd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,od=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ad=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ld=`#ifdef USE_AOMAP
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
#endif`,cd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hd=`#ifdef USE_BATCHING
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
#endif`,ud=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,dd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,fd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pd=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,md=`#ifdef USE_IRIDESCENCE
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
#endif`,gd=`#ifdef USE_BUMPMAP
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
#endif`,Ed=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,xd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Md=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_d=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,vd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,wd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Td=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Sd=`#define PI 3.141592653589793
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
} // validated`,bd=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Rd=`vec3 transformedNormal = objectNormal;
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
#endif`,Ad=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Cd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Pd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Id=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Hd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Dd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ld=`#ifdef USE_ENVMAP
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
#endif`,Ud=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Bd=`#ifdef USE_ENVMAP
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
#endif`,Fd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Nd=`#ifdef USE_ENVMAP
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
#endif`,Od=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Gd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,kd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Vd=`#ifdef USE_GRADIENTMAP
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
}`,Wd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Yd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,qd=`uniform bool receiveShadow;
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
#endif`,Zd=`#ifdef USE_ENVMAP
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
#endif`,Jd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Kd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,$d=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Qd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,jd=`PhysicalMaterial material;
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
#endif`,ef=`struct PhysicalMaterial {
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
}`,tf=`
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
#endif`,nf=`#if defined( RE_IndirectDiffuse )
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
#endif`,sf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,rf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,of=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,af=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,lf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,cf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,hf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,uf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,df=`#if defined( USE_POINTS_UV )
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
#endif`,ff=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,pf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,mf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,gf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ef=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xf=`#ifdef USE_MORPHTARGETS
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
#endif`,yf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Mf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,_f=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,vf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Tf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Sf=`#ifdef USE_NORMALMAP
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
#endif`,bf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Rf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Af=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Cf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Pf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,If=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Hf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Df=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Lf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Uf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Bf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ff=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Nf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Of=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Gf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,kf=`float getShadowMask() {
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
}`,zf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Vf=`#ifdef USE_SKINNING
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
#endif`,Wf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Xf=`#ifdef USE_SKINNING
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
#endif`,Yf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,qf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Zf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Jf=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Kf=`#ifdef USE_TRANSMISSION
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
#endif`,$f=`#ifdef USE_TRANSMISSION
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
#endif`,Qf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,jf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ep=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,tp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,np=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,ip=`uniform sampler2D t2D;
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
}`,sp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,rp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,op=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ap=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lp=`#include <common>
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
}`,cp=`#if DEPTH_PACKING == 3200
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
}`,hp=`#define DISTANCE
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
}`,up=`#define DISTANCE
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
}`,dp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,fp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pp=`uniform float scale;
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
}`,mp=`uniform vec3 diffuse;
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
}`,gp=`#include <common>
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
}`,Ep=`uniform vec3 diffuse;
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
}`,xp=`#define LAMBERT
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
}`,yp=`#define LAMBERT
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
}`,Mp=`#define MATCAP
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
}`,_p=`#define MATCAP
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
}`,vp=`#define NORMAL
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
}`,wp=`#define NORMAL
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
}`,Tp=`#define PHONG
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
}`,Sp=`#define PHONG
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
}`,bp=`#define STANDARD
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
}`,Rp=`#define STANDARD
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
}`,Ap=`#define TOON
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
}`,Cp=`#define TOON
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
}`,Pp=`uniform float size;
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
}`,Ip=`uniform vec3 diffuse;
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
}`,Hp=`#include <common>
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
}`,Dp=`uniform vec3 color;
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
}`,Lp=`uniform float rotation;
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
}`,Up=`uniform vec3 diffuse;
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
}`,Ke={alphahash_fragment:nd,alphahash_pars_fragment:id,alphamap_fragment:sd,alphamap_pars_fragment:rd,alphatest_fragment:od,alphatest_pars_fragment:ad,aomap_fragment:ld,aomap_pars_fragment:cd,batching_pars_vertex:hd,batching_vertex:ud,begin_vertex:dd,beginnormal_vertex:fd,bsdfs:pd,iridescence_fragment:md,bumpmap_pars_fragment:gd,clipping_planes_fragment:Ed,clipping_planes_pars_fragment:xd,clipping_planes_pars_vertex:yd,clipping_planes_vertex:Md,color_fragment:_d,color_pars_fragment:vd,color_pars_vertex:wd,color_vertex:Td,common:Sd,cube_uv_reflection_fragment:bd,defaultnormal_vertex:Rd,displacementmap_pars_vertex:Ad,displacementmap_vertex:Cd,emissivemap_fragment:Pd,emissivemap_pars_fragment:Id,colorspace_fragment:Hd,colorspace_pars_fragment:Dd,envmap_fragment:Ld,envmap_common_pars_fragment:Ud,envmap_pars_fragment:Bd,envmap_pars_vertex:Fd,envmap_physical_pars_fragment:Zd,envmap_vertex:Nd,fog_vertex:Od,fog_pars_vertex:Gd,fog_fragment:kd,fog_pars_fragment:zd,gradientmap_pars_fragment:Vd,lightmap_pars_fragment:Wd,lights_lambert_fragment:Xd,lights_lambert_pars_fragment:Yd,lights_pars_begin:qd,lights_toon_fragment:Jd,lights_toon_pars_fragment:Kd,lights_phong_fragment:$d,lights_phong_pars_fragment:Qd,lights_physical_fragment:jd,lights_physical_pars_fragment:ef,lights_fragment_begin:tf,lights_fragment_maps:nf,lights_fragment_end:sf,logdepthbuf_fragment:rf,logdepthbuf_pars_fragment:of,logdepthbuf_pars_vertex:af,logdepthbuf_vertex:lf,map_fragment:cf,map_pars_fragment:hf,map_particle_fragment:uf,map_particle_pars_fragment:df,metalnessmap_fragment:ff,metalnessmap_pars_fragment:pf,morphinstance_vertex:mf,morphcolor_vertex:gf,morphnormal_vertex:Ef,morphtarget_pars_vertex:xf,morphtarget_vertex:yf,normal_fragment_begin:Mf,normal_fragment_maps:_f,normal_pars_fragment:vf,normal_pars_vertex:wf,normal_vertex:Tf,normalmap_pars_fragment:Sf,clearcoat_normal_fragment_begin:bf,clearcoat_normal_fragment_maps:Rf,clearcoat_pars_fragment:Af,iridescence_pars_fragment:Cf,opaque_fragment:Pf,packing:If,premultiplied_alpha_fragment:Hf,project_vertex:Df,dithering_fragment:Lf,dithering_pars_fragment:Uf,roughnessmap_fragment:Bf,roughnessmap_pars_fragment:Ff,shadowmap_pars_fragment:Nf,shadowmap_pars_vertex:Of,shadowmap_vertex:Gf,shadowmask_pars_fragment:kf,skinbase_vertex:zf,skinning_pars_vertex:Vf,skinning_vertex:Wf,skinnormal_vertex:Xf,specularmap_fragment:Yf,specularmap_pars_fragment:qf,tonemapping_fragment:Zf,tonemapping_pars_fragment:Jf,transmission_fragment:Kf,transmission_pars_fragment:$f,uv_pars_fragment:Qf,uv_pars_vertex:jf,uv_vertex:ep,worldpos_vertex:tp,background_vert:np,background_frag:ip,backgroundCube_vert:sp,backgroundCube_frag:rp,cube_vert:op,cube_frag:ap,depth_vert:lp,depth_frag:cp,distanceRGBA_vert:hp,distanceRGBA_frag:up,equirect_vert:dp,equirect_frag:fp,linedashed_vert:pp,linedashed_frag:mp,meshbasic_vert:gp,meshbasic_frag:Ep,meshlambert_vert:xp,meshlambert_frag:yp,meshmatcap_vert:Mp,meshmatcap_frag:_p,meshnormal_vert:vp,meshnormal_frag:wp,meshphong_vert:Tp,meshphong_frag:Sp,meshphysical_vert:bp,meshphysical_frag:Rp,meshtoon_vert:Ap,meshtoon_frag:Cp,points_vert:Pp,points_frag:Ip,shadow_vert:Hp,shadow_frag:Dp,sprite_vert:Lp,sprite_frag:Up},ve={common:{diffuse:{value:new _e(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ze},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ze}},envmap:{envMap:{value:null},envMapRotation:{value:new Ze},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ze},normalScale:{value:new ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new _e(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new _e(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0},uvTransform:{value:new Ze}},sprite:{diffuse:{value:new _e(16777215)},opacity:{value:1},center:{value:new ge(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ze},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0}}},bn={basic:{uniforms:Gt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.fog]),vertexShader:Ke.meshbasic_vert,fragmentShader:Ke.meshbasic_frag},lambert:{uniforms:Gt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,ve.lights,{emissive:{value:new _e(0)}}]),vertexShader:Ke.meshlambert_vert,fragmentShader:Ke.meshlambert_frag},phong:{uniforms:Gt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,ve.lights,{emissive:{value:new _e(0)},specular:{value:new _e(1118481)},shininess:{value:30}}]),vertexShader:Ke.meshphong_vert,fragmentShader:Ke.meshphong_frag},standard:{uniforms:Gt([ve.common,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.roughnessmap,ve.metalnessmap,ve.fog,ve.lights,{emissive:{value:new _e(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ke.meshphysical_vert,fragmentShader:Ke.meshphysical_frag},toon:{uniforms:Gt([ve.common,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.gradientmap,ve.fog,ve.lights,{emissive:{value:new _e(0)}}]),vertexShader:Ke.meshtoon_vert,fragmentShader:Ke.meshtoon_frag},matcap:{uniforms:Gt([ve.common,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,{matcap:{value:null}}]),vertexShader:Ke.meshmatcap_vert,fragmentShader:Ke.meshmatcap_frag},points:{uniforms:Gt([ve.points,ve.fog]),vertexShader:Ke.points_vert,fragmentShader:Ke.points_frag},dashed:{uniforms:Gt([ve.common,ve.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ke.linedashed_vert,fragmentShader:Ke.linedashed_frag},depth:{uniforms:Gt([ve.common,ve.displacementmap]),vertexShader:Ke.depth_vert,fragmentShader:Ke.depth_frag},normal:{uniforms:Gt([ve.common,ve.bumpmap,ve.normalmap,ve.displacementmap,{opacity:{value:1}}]),vertexShader:Ke.meshnormal_vert,fragmentShader:Ke.meshnormal_frag},sprite:{uniforms:Gt([ve.sprite,ve.fog]),vertexShader:Ke.sprite_vert,fragmentShader:Ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ke.background_vert,fragmentShader:Ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ze}},vertexShader:Ke.backgroundCube_vert,fragmentShader:Ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ke.cube_vert,fragmentShader:Ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ke.equirect_vert,fragmentShader:Ke.equirect_frag},distanceRGBA:{uniforms:Gt([ve.common,ve.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ke.distanceRGBA_vert,fragmentShader:Ke.distanceRGBA_frag},shadow:{uniforms:Gt([ve.lights,ve.fog,{color:{value:new _e(0)},opacity:{value:1}}]),vertexShader:Ke.shadow_vert,fragmentShader:Ke.shadow_frag}};bn.physical={uniforms:Gt([bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ze},clearcoatNormalScale:{value:new ge(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ze},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ze},sheen:{value:0},sheenColor:{value:new _e(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ze},transmissionSamplerSize:{value:new ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ze},attenuationDistance:{value:0},attenuationColor:{value:new _e(0)},specularColor:{value:new _e(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ze},anisotropyVector:{value:new ge},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ze}}]),vertexShader:Ke.meshphysical_vert,fragmentShader:Ke.meshphysical_frag};var ca={r:0,b:0,g:0},Ri=new Wt,Bp=new ct;function Fp(i,e,t,n,s,r,o){let a=new _e(0),l=r===!0?0:1,c,h,u=null,f=0,d=null;function m(v){let x=v.isScene===!0?v.background:null;return x&&x.isTexture&&(x=(v.backgroundBlurriness>0?t:e).get(x)),x}function E(v){let x=!1,b=m(v);b===null?p(a,l):b&&b.isColor&&(p(b,1),x=!0);let R=i.xr.getEnvironmentBlendMode();R==="additive"?n.buffers.color.setClear(0,0,0,1,o):R==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||x)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(v,x){let b=m(x);b&&(b.isCubeTexture||b.mapping===js)?(h===void 0&&(h=new y(new j(1,1,1),new Bt({name:"BackgroundCubeMaterial",uniforms:bi(bn.backgroundCube.uniforms),vertexShader:bn.backgroundCube.vertexShader,fragmentShader:bn.backgroundCube.fragmentShader,side:Ft,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,A,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Ri.copy(x.backgroundRotation),Ri.x*=-1,Ri.y*=-1,Ri.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(Ri.y*=-1,Ri.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Bp.makeRotationFromEuler(Ri)),h.material.toneMapped=rt.getTransfer(b.colorSpace)!==dt,(u!==b||f!==b.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=b,f=b.version,d=i.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new y(new tt(2,2),new Bt({name:"BackgroundMaterial",uniforms:bi(bn.background.uniforms),vertexShader:bn.background.vertexShader,fragmentShader:bn.background.fragmentShader,side:Bn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=rt.getTransfer(b.colorSpace)!==dt,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||f!==b.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=b,f=b.version,d=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function p(v,x){v.getRGB(ca,Cl(i)),n.buffers.color.setClear(ca.r,ca.g,ca.b,x,o)}function _(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,x=1){a.set(v),l=x,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(v){l=v,p(a,l)},render:E,addToRenderList:g,dispose:_}}function Np(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,o=!1;function a(M,H,B,F,k){let V=!1,W=u(F,B,H);r!==W&&(r=W,c(r.object)),V=d(M,F,B,k),V&&m(M,F,B,k),k!==null&&e.update(k,i.ELEMENT_ARRAY_BUFFER),(V||o)&&(o=!1,x(M,H,B,F),k!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function l(){return i.createVertexArray()}function c(M){return i.bindVertexArray(M)}function h(M){return i.deleteVertexArray(M)}function u(M,H,B){let F=B.wireframe===!0,k=n[M.id];k===void 0&&(k={},n[M.id]=k);let V=k[H.id];V===void 0&&(V={},k[H.id]=V);let W=V[F];return W===void 0&&(W=f(l()),V[F]=W),W}function f(M){let H=[],B=[],F=[];for(let k=0;k<t;k++)H[k]=0,B[k]=0,F[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:H,enabledAttributes:B,attributeDivisors:F,object:M,attributes:{},index:null}}function d(M,H,B,F){let k=r.attributes,V=H.attributes,W=0,le=B.getAttributes();for(let O in le)if(le[O].location>=0){let re=k[O],me=V[O];if(me===void 0&&(O==="instanceMatrix"&&M.instanceMatrix&&(me=M.instanceMatrix),O==="instanceColor"&&M.instanceColor&&(me=M.instanceColor)),re===void 0||re.attribute!==me||me&&re.data!==me.data)return!0;W++}return r.attributesNum!==W||r.index!==F}function m(M,H,B,F){let k={},V=H.attributes,W=0,le=B.getAttributes();for(let O in le)if(le[O].location>=0){let re=V[O];re===void 0&&(O==="instanceMatrix"&&M.instanceMatrix&&(re=M.instanceMatrix),O==="instanceColor"&&M.instanceColor&&(re=M.instanceColor));let me={};me.attribute=re,re&&re.data&&(me.data=re.data),k[O]=me,W++}r.attributes=k,r.attributesNum=W,r.index=F}function E(){let M=r.newAttributes;for(let H=0,B=M.length;H<B;H++)M[H]=0}function g(M){p(M,0)}function p(M,H){let B=r.newAttributes,F=r.enabledAttributes,k=r.attributeDivisors;B[M]=1,F[M]===0&&(i.enableVertexAttribArray(M),F[M]=1),k[M]!==H&&(i.vertexAttribDivisor(M,H),k[M]=H)}function _(){let M=r.newAttributes,H=r.enabledAttributes;for(let B=0,F=H.length;B<F;B++)H[B]!==M[B]&&(i.disableVertexAttribArray(B),H[B]=0)}function v(M,H,B,F,k,V,W){W===!0?i.vertexAttribIPointer(M,H,B,k,V):i.vertexAttribPointer(M,H,B,F,k,V)}function x(M,H,B,F){E();let k=F.attributes,V=B.getAttributes(),W=H.defaultAttributeValues;for(let le in V){let O=V[le];if(O.location>=0){let he=k[le];if(he===void 0&&(le==="instanceMatrix"&&M.instanceMatrix&&(he=M.instanceMatrix),le==="instanceColor"&&M.instanceColor&&(he=M.instanceColor)),he!==void 0){let re=he.normalized,me=he.itemSize,Re=e.get(he);if(Re===void 0)continue;let Ae=Re.buffer,q=Re.type,ae=Re.bytesPerElement,K=q===i.INT||q===i.UNSIGNED_INT||he.gpuType===Po;if(he.isInterleavedBufferAttribute){let ie=he.data,Y=ie.stride,we=he.offset;if(ie.isInstancedInterleavedBuffer){for(let X=0;X<O.locationSize;X++)p(O.location+X,ie.meshPerAttribute);M.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let X=0;X<O.locationSize;X++)g(O.location+X);i.bindBuffer(i.ARRAY_BUFFER,Ae);for(let X=0;X<O.locationSize;X++)v(O.location+X,me/O.locationSize,q,re,Y*ae,(we+me/O.locationSize*X)*ae,K)}else{if(he.isInstancedBufferAttribute){for(let ie=0;ie<O.locationSize;ie++)p(O.location+ie,he.meshPerAttribute);M.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let ie=0;ie<O.locationSize;ie++)g(O.location+ie);i.bindBuffer(i.ARRAY_BUFFER,Ae);for(let ie=0;ie<O.locationSize;ie++)v(O.location+ie,me/O.locationSize,q,re,me*ae,me/O.locationSize*ie*ae,K)}}else if(W!==void 0){let re=W[le];if(re!==void 0)switch(re.length){case 2:i.vertexAttrib2fv(O.location,re);break;case 3:i.vertexAttrib3fv(O.location,re);break;case 4:i.vertexAttrib4fv(O.location,re);break;default:i.vertexAttrib1fv(O.location,re)}}}}_()}function b(){P();for(let M in n){let H=n[M];for(let B in H){let F=H[B];for(let k in F)h(F[k].object),delete F[k];delete H[B]}delete n[M]}}function R(M){if(n[M.id]===void 0)return;let H=n[M.id];for(let B in H){let F=H[B];for(let k in F)h(F[k].object),delete F[k];delete H[B]}delete n[M.id]}function A(M){for(let H in n){let B=n[H];if(B[M.id]===void 0)continue;let F=B[M.id];for(let k in F)h(F[k].object),delete F[k];delete B[M.id]}}function P(){T(),o=!0,r!==s&&(r=s,c(r.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:T,dispose:b,releaseStatesOfGeometry:R,releaseStatesOfProgram:A,initAttributes:E,enableAttribute:g,disableUnusedAttributes:_}}function Op(i,e,t){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),t.update(h,n,1)}function o(c,h,u){u!==0&&(i.drawArraysInstanced(n,c,h,u),t.update(h,n,u))}function a(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let d=0;for(let m=0;m<u;m++)d+=h[m];t.update(d,n,1)}function l(c,h,u,f){if(u===0)return;let d=e.get("WEBGL_multi_draw");if(d===null)for(let m=0;m<c.length;m++)o(c[m],h[m],f[m]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,h,0,f,0,u);let m=0;for(let E=0;E<u;E++)m+=h[E]*f[E];t.update(m,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Gp(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==un&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let P=A===ri&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Tn&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Sn&&!P)}function l(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,f=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),E=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),_=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),v=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=m>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:f,maxTextures:d,maxVertexTextures:m,maxTextureSize:E,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:_,maxVaryings:v,maxFragmentUniforms:x,vertexTextures:b,maxSamples:R}}function kp(i){let e=this,t=null,n=0,s=!1,r=!1,o=new an,a=new Ze,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){t=h(u,f,0)},this.setState=function(u,f,d){let m=u.clippingPlanes,E=u.clipIntersection,g=u.clipShadows,p=i.get(u);if(!s||m===null||m.length===0||r&&!g)r?h(null):c();else{let _=r?0:n,v=_*4,x=p.clippingState||null;l.value=x,x=h(m,f,v,d);for(let b=0;b!==v;++b)x[b]=t[b];p.clippingState=x,this.numIntersection=E?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,f,d,m){let E=u!==null?u.length:0,g=null;if(E!==0){if(g=l.value,m!==!0||g===null){let p=d+E*4,_=f.matrixWorldInverse;a.getNormalMatrix(_),(g===null||g.length<p)&&(g=new Float32Array(p));for(let v=0,x=d;v!==E;++v,x+=4)o.copy(u[v]).applyMatrix4(_,a),o.normal.toArray(g,x),g[x+3]=o.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=E,e.numIntersection=0,g}}function zp(i){let e=new WeakMap;function t(o,a){return a===Ro?o.mapping=Ti:a===Ao&&(o.mapping=Si),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ro||a===Ao)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Jr(l.height);return c.fromEquirectangularTexture(i,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var as=4,Eh=[.125,.215,.35,.446,.526,.582],Pi=20,Ll=new Qs,xh=new _e,Ul=null,Bl=0,Fl=0,Nl=!1,Ci=(1+Math.sqrt(5))/2,os=1/Ci,yh=[new I(-Ci,os,0),new I(Ci,os,0),new I(-os,0,Ci),new I(os,0,Ci),new I(0,Ci,-os),new I(0,Ci,os),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)],Vp=new I,da=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100,r={}){let{size:o=256,position:a=Vp}=r;Ul=this._renderer.getRenderTarget(),Bl=this._renderer.getActiveCubeFace(),Fl=this._renderer.getActiveMipmapLevel(),Nl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=vh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=_h(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Ul,Bl,Fl),this._renderer.xr.enabled=Nl,e.scissorTest=!1,ha(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ti||e.mapping===Si?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ul=this._renderer.getRenderTarget(),Bl=this._renderer.getActiveCubeFace(),Fl=this._renderer.getActiveMipmapLevel(),Nl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:xn,minFilter:xn,generateMipmaps:!1,type:ri,format:un,colorSpace:Ei,depthBuffer:!1},s=Mh(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Mh(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Wp(r)),this._blurMaterial=Xp(r,e,t)}return s}_compileMaterial(e){let t=new y(this._lodPlanes[0],e);this._renderer.compile(t,Ll)}_sceneToCubeUV(e,t,n,s,r){let l=new bt(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(xh),u.toneMapping=On,u.autoClear=!1;let m=new Ne({name:"PMREM.Background",side:Ft,depthWrite:!1,depthTest:!1}),E=new y(new j,m),g=!1,p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,g=!0):(m.color.copy(xh),g=!0);for(let _=0;_<6;_++){let v=_%3;v===0?(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[_],r.y,r.z)):v===1?(l.up.set(0,0,c[_]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[_],r.z)):(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[_]));let x=this._cubeSize;ha(s,v*x,_>2?x:0,x,x),u.setRenderTarget(s),g&&u.render(E,l),u.render(e,l)}E.geometry.dispose(),E.material.dispose(),u.toneMapping=d,u.autoClear=f,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Ti||e.mapping===Si;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=vh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=_h());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new y(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;ha(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,Ll)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=yh[(s-r-1)%yh.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new y(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*Pi-1),E=r/m,g=isFinite(r)?1+Math.floor(h*E):Pi;g>Pi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Pi}`);let p=[],_=0;for(let A=0;A<Pi;++A){let P=A/E,T=Math.exp(-P*P/2);p.push(T),A===0?_+=T:A<g&&(_+=2*T)}for(let A=0;A<p.length;A++)p[A]=p[A]/_;f.envMap.value=e.texture,f.samples.value=g,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:v}=this;f.dTheta.value=m,f.mipInt.value=v-n;let x=this._sizeLods[s],b=3*x*(s>v-as?s-v+as:0),R=4*(this._cubeSize-x);ha(t,b,R,3*x,2*x),l.setRenderTarget(t),l.render(u,Ll)}};function Wp(i){let e=[],t=[],n=[],s=i,r=i-as+1+Eh.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>i-as?l=Eh[o-i+as-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,m=6,E=3,g=2,p=1,_=new Float32Array(E*m*d),v=new Float32Array(g*m*d),x=new Float32Array(p*m*d);for(let R=0;R<d;R++){let A=R%3*2/3-1,P=R>2?0:-1,T=[A,P,0,A+2/3,P,0,A+2/3,P+1,0,A,P,0,A+2/3,P+1,0,A,P+1,0];_.set(T,E*m*R),v.set(f,g*m*R);let M=[R,R,R,R,R,R];x.set(M,p*m*R)}let b=new Mt;b.setAttribute("position",new Ut(_,E)),b.setAttribute("uv",new Ut(v,g)),b.setAttribute("faceIndex",new Ut(x,p)),e.push(b),s>as&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Mh(i,e,t){let n=new cn(i,e,t);return n.texture.mapping=js,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ha(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function Xp(i,e,t){let n=new Float32Array(Pi),s=new I(0,1,0);return new Bt({name:"SphericalGaussianBlur",defines:{n:Pi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Zl(),fragmentShader:`

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
		`,blending:Nn,depthTest:!1,depthWrite:!1})}function _h(){return new Bt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Zl(),fragmentShader:`

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
		`,blending:Nn,depthTest:!1,depthWrite:!1})}function vh(){return new Bt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Zl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Nn,depthTest:!1,depthWrite:!1})}function Zl(){return`

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
	`}function Yp(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===Ro||l===Ao,h=l===Ti||l===Si;if(c||h){let u=e.get(a),f=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return t===null&&(t=new da(i)),u=c?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let d=a.image;return c&&d&&d.height>0||h&&d&&s(d)?(t===null&&(t=new da(i)),u=c?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function qp(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&ar("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Zp(i,e,t,n){let s={},r=new WeakMap;function o(u){let f=u.target;f.index!==null&&e.remove(f.index);for(let m in f.attributes)e.remove(f.attributes[m]);f.removeEventListener("dispose",o),delete s[f.id];let d=r.get(f);d&&(e.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(u,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,t.memory.geometries++),f}function l(u){let f=u.attributes;for(let d in f)e.update(f[d],i.ARRAY_BUFFER)}function c(u){let f=[],d=u.index,m=u.attributes.position,E=0;if(d!==null){let _=d.array;E=d.version;for(let v=0,x=_.length;v<x;v+=3){let b=_[v+0],R=_[v+1],A=_[v+2];f.push(b,R,R,A,A,b)}}else if(m!==void 0){let _=m.array;E=m.version;for(let v=0,x=_.length/3-1;v<x;v+=3){let b=v+0,R=v+1,A=v+2;f.push(b,R,R,A,A,b)}}else return;let g=new(Al(f)?Ds:Hs)(f,1);g.version=E;let p=r.get(u);p&&e.remove(p),r.set(u,g)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function Jp(i,e,t){let n;function s(f){n=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,d){i.drawElements(n,d,r,f*o),t.update(d,n,1)}function c(f,d,m){m!==0&&(i.drawElementsInstanced(n,d,r,f*o,m),t.update(d,n,m))}function h(f,d,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,m);let g=0;for(let p=0;p<m;p++)g+=d[p];t.update(g,n,1)}function u(f,d,m,E){if(m===0)return;let g=e.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<f.length;p++)c(f[p]/o,d[p],E[p]);else{g.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,E,0,m);let p=0;for(let _=0;_<m;_++)p+=d[_]*E[_];t.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Kp(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function $p(i,e,t){let n=new WeakMap,s=new lt;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(a);if(f===void 0||f.count!==u){let T=function(){A.dispose(),n.delete(a),a.removeEventListener("dispose",T)};f!==void 0&&f.texture.dispose();let d=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,E=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],_=a.morphAttributes.color||[],v=0;d===!0&&(v=1),m===!0&&(v=2),E===!0&&(v=3);let x=a.attributes.position.count*v,b=1;x>e.maxTextureSize&&(b=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let R=new Float32Array(x*b*4*u),A=new Ps(R,x,b,u);A.type=Sn,A.needsUpdate=!0;let P=v*4;for(let M=0;M<u;M++){let H=g[M],B=p[M],F=_[M],k=x*b*4*M;for(let V=0;V<H.count;V++){let W=V*P;d===!0&&(s.fromBufferAttribute(H,V),R[k+W+0]=s.x,R[k+W+1]=s.y,R[k+W+2]=s.z,R[k+W+3]=0),m===!0&&(s.fromBufferAttribute(B,V),R[k+W+4]=s.x,R[k+W+5]=s.y,R[k+W+6]=s.z,R[k+W+7]=0),E===!0&&(s.fromBufferAttribute(F,V),R[k+W+8]=s.x,R[k+W+9]=s.y,R[k+W+10]=s.z,R[k+W+11]=F.itemSize===4?s.w:1)}}f={count:u,texture:A,size:new ge(x,b)},n.set(a,f),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let d=0;for(let E=0;E<c.length;E++)d+=c[E];let m=a.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",m),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Qp(i,e,t,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var kh=new Vt,wh=new Os(1,1),zh=new Ps,Vh=new qr,Wh=new Us,Th=[],Sh=[],bh=new Float32Array(16),Rh=new Float32Array(9),Ah=new Float32Array(4);function cs(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Th[s];if(r===void 0&&(r=new Float32Array(s),Th[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function At(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Ct(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function pa(i,e){let t=Sh[e];t===void 0&&(t=new Int32Array(e),Sh[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function jp(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function em(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;i.uniform2fv(this.addr,e),Ct(t,e)}}function tm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(At(t,e))return;i.uniform3fv(this.addr,e),Ct(t,e)}}function nm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;i.uniform4fv(this.addr,e),Ct(t,e)}}function im(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(At(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Ct(t,e)}else{if(At(t,n))return;Ah.set(n),i.uniformMatrix2fv(this.addr,!1,Ah),Ct(t,n)}}function sm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(At(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Ct(t,e)}else{if(At(t,n))return;Rh.set(n),i.uniformMatrix3fv(this.addr,!1,Rh),Ct(t,n)}}function rm(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(At(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Ct(t,e)}else{if(At(t,n))return;bh.set(n),i.uniformMatrix4fv(this.addr,!1,bh),Ct(t,n)}}function om(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function am(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;i.uniform2iv(this.addr,e),Ct(t,e)}}function lm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;i.uniform3iv(this.addr,e),Ct(t,e)}}function cm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;i.uniform4iv(this.addr,e),Ct(t,e)}}function hm(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function um(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;i.uniform2uiv(this.addr,e),Ct(t,e)}}function dm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;i.uniform3uiv(this.addr,e),Ct(t,e)}}function fm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;i.uniform4uiv(this.addr,e),Ct(t,e)}}function pm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(wh.compareFunction=bl,r=wh):r=kh,t.setTexture2D(e||r,s)}function mm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Vh,s)}function gm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Wh,s)}function Em(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||zh,s)}function xm(i){switch(i){case 5126:return jp;case 35664:return em;case 35665:return tm;case 35666:return nm;case 35674:return im;case 35675:return sm;case 35676:return rm;case 5124:case 35670:return om;case 35667:case 35671:return am;case 35668:case 35672:return lm;case 35669:case 35673:return cm;case 5125:return hm;case 36294:return um;case 36295:return dm;case 36296:return fm;case 35678:case 36198:case 36298:case 36306:case 35682:return pm;case 35679:case 36299:case 36307:return mm;case 35680:case 36300:case 36308:case 36293:return gm;case 36289:case 36303:case 36311:case 36292:return Em}}function ym(i,e){i.uniform1fv(this.addr,e)}function Mm(i,e){let t=cs(e,this.size,2);i.uniform2fv(this.addr,t)}function _m(i,e){let t=cs(e,this.size,3);i.uniform3fv(this.addr,t)}function vm(i,e){let t=cs(e,this.size,4);i.uniform4fv(this.addr,t)}function wm(i,e){let t=cs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Tm(i,e){let t=cs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Sm(i,e){let t=cs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function bm(i,e){i.uniform1iv(this.addr,e)}function Rm(i,e){i.uniform2iv(this.addr,e)}function Am(i,e){i.uniform3iv(this.addr,e)}function Cm(i,e){i.uniform4iv(this.addr,e)}function Pm(i,e){i.uniform1uiv(this.addr,e)}function Im(i,e){i.uniform2uiv(this.addr,e)}function Hm(i,e){i.uniform3uiv(this.addr,e)}function Dm(i,e){i.uniform4uiv(this.addr,e)}function Lm(i,e,t){let n=this.cache,s=e.length,r=pa(t,s);At(n,r)||(i.uniform1iv(this.addr,r),Ct(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||kh,r[o])}function Um(i,e,t){let n=this.cache,s=e.length,r=pa(t,s);At(n,r)||(i.uniform1iv(this.addr,r),Ct(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Vh,r[o])}function Bm(i,e,t){let n=this.cache,s=e.length,r=pa(t,s);At(n,r)||(i.uniform1iv(this.addr,r),Ct(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Wh,r[o])}function Fm(i,e,t){let n=this.cache,s=e.length,r=pa(t,s);At(n,r)||(i.uniform1iv(this.addr,r),Ct(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||zh,r[o])}function Nm(i){switch(i){case 5126:return ym;case 35664:return Mm;case 35665:return _m;case 35666:return vm;case 35674:return wm;case 35675:return Tm;case 35676:return Sm;case 5124:case 35670:return bm;case 35667:case 35671:return Rm;case 35668:case 35672:return Am;case 35669:case 35673:return Cm;case 5125:return Pm;case 36294:return Im;case 36295:return Hm;case 36296:return Dm;case 35678:case 36198:case 36298:case 36306:case 35682:return Lm;case 35679:case 36299:case 36307:return Um;case 35680:case 36300:case 36308:case 36293:return Bm;case 36289:case 36303:case 36311:case 36292:return Fm}}var Gl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=xm(t.type)}},kl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Nm(t.type)}},zl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},Ol=/(\w+)(\])?(\[|\.)?/g;function Ch(i,e){i.seq.push(e),i.map[e.id]=e}function Om(i,e,t){let n=i.name,s=n.length;for(Ol.lastIndex=0;;){let r=Ol.exec(n),o=Ol.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Ch(t,c===void 0?new Gl(a,i,e):new kl(a,i,e));break}else{let u=t.map[a];u===void 0&&(u=new zl(a),Ch(t,u)),t=u}}}var ls=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Om(r,o,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function Ph(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Gm=37297,km=0;function zm(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var Ih=new Ze;function Vm(i){rt._getMatrix(Ih,rt.workingColorSpace,i);let e=`mat3( ${Ih.elements.map(t=>t.toFixed(4))} )`;switch(rt.getTransfer(i)){case Rs:return[e,"LinearTransferOETF"];case dt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Hh(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+zm(i.getShaderSource(e),o)}else return s}function Wm(i,e){let t=Vm(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Xm(i,e){let t;switch(e){case Zc:t="Linear";break;case Jc:t="Reinhard";break;case Kc:t="Cineon";break;case bo:t="ACESFilmic";break;case Qc:t="AgX";break;case jc:t="Neutral";break;case $c:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var ua=new I;function Ym(){rt.getLuminanceCoefficients(ua);let i=ua.x.toFixed(4),e=ua.y.toFixed(4),t=ua.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function qm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(lr).join(`
`)}function Zm(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Jm(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function lr(i){return i!==""}function Dh(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Lh(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Km=/^[ \t]*#include +<([\w\d./]+)>/gm;function Vl(i){return i.replace(Km,Qm)}var $m=new Map;function Qm(i,e){let t=Ke[e];if(t===void 0){let n=$m.get(e);if(n!==void 0)t=Ke[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Vl(t)}var jm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Uh(i){return i.replace(jm,e0)}function e0(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Bh(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function t0(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===hl?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===xo?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===vn&&(e="SHADOWMAP_TYPE_VSM"),e}function n0(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ti:case Si:e="ENVMAP_TYPE_CUBE";break;case js:e="ENVMAP_TYPE_CUBE_UV";break}return e}function i0(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Si:e="ENVMAP_MODE_REFRACTION";break}return e}function s0(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case fl:e="ENVMAP_BLENDING_MULTIPLY";break;case Yc:e="ENVMAP_BLENDING_MIX";break;case qc:e="ENVMAP_BLENDING_ADD";break}return e}function r0(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function o0(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=t0(t),c=n0(t),h=i0(t),u=s0(t),f=r0(t),d=qm(t),m=Zm(r),E=s.createProgram(),g,p,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(lr).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(lr).join(`
`),p.length>0&&(p+=`
`)):(g=[Bh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(lr).join(`
`),p=[Bh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==On?"#define TONE_MAPPING":"",t.toneMapping!==On?Ke.tonemapping_pars_fragment:"",t.toneMapping!==On?Xm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ke.colorspace_pars_fragment,Wm("linearToOutputTexel",t.outputColorSpace),Ym(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(lr).join(`
`)),o=Vl(o),o=Dh(o,t),o=Lh(o,t),a=Vl(a),a=Dh(a,t),a=Lh(a,t),o=Uh(o),a=Uh(a),t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,g=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",t.glslVersion===Rl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Rl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let v=_+g+o,x=_+p+a,b=Ph(s,s.VERTEX_SHADER,v),R=Ph(s,s.FRAGMENT_SHADER,x);s.attachShader(E,b),s.attachShader(E,R),t.index0AttributeName!==void 0?s.bindAttribLocation(E,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(E,0,"position"),s.linkProgram(E);function A(H){if(i.debug.checkShaderErrors){let B=s.getProgramInfoLog(E).trim(),F=s.getShaderInfoLog(b).trim(),k=s.getShaderInfoLog(R).trim(),V=!0,W=!0;if(s.getProgramParameter(E,s.LINK_STATUS)===!1)if(V=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,E,b,R);else{let le=Hh(s,b,"vertex"),O=Hh(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(E,s.VALIDATE_STATUS)+`

Material Name: `+H.name+`
Material Type: `+H.type+`

Program Info Log: `+B+`
`+le+`
`+O)}else B!==""?console.warn("THREE.WebGLProgram: Program Info Log:",B):(F===""||k==="")&&(W=!1);W&&(H.diagnostics={runnable:V,programLog:B,vertexShader:{log:F,prefix:g},fragmentShader:{log:k,prefix:p}})}s.deleteShader(b),s.deleteShader(R),P=new ls(s,E),T=Jm(s,E)}let P;this.getUniforms=function(){return P===void 0&&A(this),P};let T;this.getAttributes=function(){return T===void 0&&A(this),T};let M=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(E,Gm)),M},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(E),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=km++,this.cacheKey=e,this.usedTimes=1,this.program=E,this.vertexShader=b,this.fragmentShader=R,this}var a0=0,Wl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Xl(e),t.set(e,n)),n}},Xl=class{constructor(e){this.id=a0++,this.code=e,this.usedTimes=0}};function l0(i,e,t,n,s,r,o){let a=new Is,l=new Wl,c=new Set,h=[],u=s.logarithmicDepthBuffer,f=s.vertexTextures,d=s.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function E(T){return c.add(T),T===0?"uv":`uv${T}`}function g(T,M,H,B,F){let k=B.fog,V=F.geometry,W=T.isMeshStandardMaterial?B.environment:null,le=(T.isMeshStandardMaterial?t:e).get(T.envMap||W),O=le&&le.mapping===js?le.image.height:null,he=m[T.type];T.precision!==null&&(d=s.getMaxPrecision(T.precision),d!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",d,"instead."));let re=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,me=re!==void 0?re.length:0,Re=0;V.morphAttributes.position!==void 0&&(Re=1),V.morphAttributes.normal!==void 0&&(Re=2),V.morphAttributes.color!==void 0&&(Re=3);let Ae,q,ae,K;if(he){let ot=bn[he];Ae=ot.vertexShader,q=ot.fragmentShader}else Ae=T.vertexShader,q=T.fragmentShader,l.update(T),ae=l.getVertexShaderID(T),K=l.getFragmentShaderID(T);let ie=i.getRenderTarget(),Y=i.state.buffers.depth.getReversed(),we=F.isInstancedMesh===!0,X=F.isBatchedMesh===!0,de=!!T.map,be=!!T.matcap,Ve=!!le,D=!!T.aoMap,_t=!!T.lightMap,ke=!!T.bumpMap,Je=!!T.normalMap,Fe=!!T.displacementMap,$e=!!T.emissiveMap,Le=!!T.metalnessMap,C=!!T.roughnessMap,w=T.anisotropy>0,z=T.clearcoat>0,ee=T.dispersion>0,ce=T.iridescence>0,te=T.sheen>0,Ue=T.transmission>0,Q=w&&!!T.anisotropyMap,se=z&&!!T.clearcoatMap,Ie=z&&!!T.clearcoatNormalMap,ne=z&&!!T.clearcoatRoughnessMap,fe=ce&&!!T.iridescenceMap,Ce=ce&&!!T.iridescenceThicknessMap,Be=te&&!!T.sheenColorMap,xe=te&&!!T.sheenRoughnessMap,qe=!!T.specularMap,Oe=!!T.specularColorMap,nt=!!T.specularIntensityMap,L=Ue&&!!T.transmissionMap,Ee=Ue&&!!T.thicknessMap,$=!!T.gradientMap,oe=!!T.alphaMap,Te=T.alphaTest>0,ye=!!T.alphaHash,Ye=!!T.extensions,pt=On;T.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(pt=i.toneMapping);let Et={shaderID:he,shaderType:T.type,shaderName:T.name,vertexShader:Ae,fragmentShader:q,defines:T.defines,customVertexShaderID:ae,customFragmentShaderID:K,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:d,batching:X,batchingColor:X&&F._colorsTexture!==null,instancing:we,instancingColor:we&&F.instanceColor!==null,instancingMorph:we&&F.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:ie===null?i.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:Ei,alphaToCoverage:!!T.alphaToCoverage,map:de,matcap:be,envMap:Ve,envMapMode:Ve&&le.mapping,envMapCubeUVHeight:O,aoMap:D,lightMap:_t,bumpMap:ke,normalMap:Je,displacementMap:f&&Fe,emissiveMap:$e,normalMapObjectSpace:Je&&T.normalMapType===ih,normalMapTangentSpace:Je&&T.normalMapType===Sl,metalnessMap:Le,roughnessMap:C,anisotropy:w,anisotropyMap:Q,clearcoat:z,clearcoatMap:se,clearcoatNormalMap:Ie,clearcoatRoughnessMap:ne,dispersion:ee,iridescence:ce,iridescenceMap:fe,iridescenceThicknessMap:Ce,sheen:te,sheenColorMap:Be,sheenRoughnessMap:xe,specularMap:qe,specularColorMap:Oe,specularIntensityMap:nt,transmission:Ue,transmissionMap:L,thicknessMap:Ee,gradientMap:$,opaque:T.transparent===!1&&T.blending===mi&&T.alphaToCoverage===!1,alphaMap:oe,alphaTest:Te,alphaHash:ye,combine:T.combine,mapUv:de&&E(T.map.channel),aoMapUv:D&&E(T.aoMap.channel),lightMapUv:_t&&E(T.lightMap.channel),bumpMapUv:ke&&E(T.bumpMap.channel),normalMapUv:Je&&E(T.normalMap.channel),displacementMapUv:Fe&&E(T.displacementMap.channel),emissiveMapUv:$e&&E(T.emissiveMap.channel),metalnessMapUv:Le&&E(T.metalnessMap.channel),roughnessMapUv:C&&E(T.roughnessMap.channel),anisotropyMapUv:Q&&E(T.anisotropyMap.channel),clearcoatMapUv:se&&E(T.clearcoatMap.channel),clearcoatNormalMapUv:Ie&&E(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ne&&E(T.clearcoatRoughnessMap.channel),iridescenceMapUv:fe&&E(T.iridescenceMap.channel),iridescenceThicknessMapUv:Ce&&E(T.iridescenceThicknessMap.channel),sheenColorMapUv:Be&&E(T.sheenColorMap.channel),sheenRoughnessMapUv:xe&&E(T.sheenRoughnessMap.channel),specularMapUv:qe&&E(T.specularMap.channel),specularColorMapUv:Oe&&E(T.specularColorMap.channel),specularIntensityMapUv:nt&&E(T.specularIntensityMap.channel),transmissionMapUv:L&&E(T.transmissionMap.channel),thicknessMapUv:Ee&&E(T.thicknessMap.channel),alphaMapUv:oe&&E(T.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(Je||w),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!V.attributes.uv&&(de||oe),fog:!!k,useFog:T.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Y,skinning:F.isSkinnedMesh===!0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:me,morphTextureStride:Re,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:T.dithering,shadowMapEnabled:i.shadowMap.enabled&&H.length>0,shadowMapType:i.shadowMap.type,toneMapping:pt,decodeVideoTexture:de&&T.map.isVideoTexture===!0&&rt.getTransfer(T.map.colorSpace)===dt,decodeVideoTextureEmissive:$e&&T.emissiveMap.isVideoTexture===!0&&rt.getTransfer(T.emissiveMap.colorSpace)===dt,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===ft,flipSided:T.side===Ft,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Ye&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ye&&T.extensions.multiDraw===!0||X)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Et.vertexUv1s=c.has(1),Et.vertexUv2s=c.has(2),Et.vertexUv3s=c.has(3),c.clear(),Et}function p(T){let M=[];if(T.shaderID?M.push(T.shaderID):(M.push(T.customVertexShaderID),M.push(T.customFragmentShaderID)),T.defines!==void 0)for(let H in T.defines)M.push(H),M.push(T.defines[H]);return T.isRawShaderMaterial===!1&&(_(M,T),v(M,T),M.push(i.outputColorSpace)),M.push(T.customProgramCacheKey),M.join()}function _(T,M){T.push(M.precision),T.push(M.outputColorSpace),T.push(M.envMapMode),T.push(M.envMapCubeUVHeight),T.push(M.mapUv),T.push(M.alphaMapUv),T.push(M.lightMapUv),T.push(M.aoMapUv),T.push(M.bumpMapUv),T.push(M.normalMapUv),T.push(M.displacementMapUv),T.push(M.emissiveMapUv),T.push(M.metalnessMapUv),T.push(M.roughnessMapUv),T.push(M.anisotropyMapUv),T.push(M.clearcoatMapUv),T.push(M.clearcoatNormalMapUv),T.push(M.clearcoatRoughnessMapUv),T.push(M.iridescenceMapUv),T.push(M.iridescenceThicknessMapUv),T.push(M.sheenColorMapUv),T.push(M.sheenRoughnessMapUv),T.push(M.specularMapUv),T.push(M.specularColorMapUv),T.push(M.specularIntensityMapUv),T.push(M.transmissionMapUv),T.push(M.thicknessMapUv),T.push(M.combine),T.push(M.fogExp2),T.push(M.sizeAttenuation),T.push(M.morphTargetsCount),T.push(M.morphAttributeCount),T.push(M.numDirLights),T.push(M.numPointLights),T.push(M.numSpotLights),T.push(M.numSpotLightMaps),T.push(M.numHemiLights),T.push(M.numRectAreaLights),T.push(M.numDirLightShadows),T.push(M.numPointLightShadows),T.push(M.numSpotLightShadows),T.push(M.numSpotLightShadowsWithMaps),T.push(M.numLightProbes),T.push(M.shadowMapType),T.push(M.toneMapping),T.push(M.numClippingPlanes),T.push(M.numClipIntersection),T.push(M.depthPacking)}function v(T,M){a.disableAll(),M.supportsVertexTextures&&a.enable(0),M.instancing&&a.enable(1),M.instancingColor&&a.enable(2),M.instancingMorph&&a.enable(3),M.matcap&&a.enable(4),M.envMap&&a.enable(5),M.normalMapObjectSpace&&a.enable(6),M.normalMapTangentSpace&&a.enable(7),M.clearcoat&&a.enable(8),M.iridescence&&a.enable(9),M.alphaTest&&a.enable(10),M.vertexColors&&a.enable(11),M.vertexAlphas&&a.enable(12),M.vertexUv1s&&a.enable(13),M.vertexUv2s&&a.enable(14),M.vertexUv3s&&a.enable(15),M.vertexTangents&&a.enable(16),M.anisotropy&&a.enable(17),M.alphaHash&&a.enable(18),M.batching&&a.enable(19),M.dispersion&&a.enable(20),M.batchingColor&&a.enable(21),T.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reverseDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),T.push(a.mask)}function x(T){let M=m[T.type],H;if(M){let B=bn[M];H=la.clone(B.uniforms)}else H=T.uniforms;return H}function b(T,M){let H;for(let B=0,F=h.length;B<F;B++){let k=h[B];if(k.cacheKey===M){H=k,++H.usedTimes;break}}return H===void 0&&(H=new o0(i,M,T,r),h.push(H)),H}function R(T){if(--T.usedTimes===0){let M=h.indexOf(T);h[M]=h[h.length-1],h.pop(),T.destroy()}}function A(T){l.remove(T)}function P(){l.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:x,acquireProgram:b,releaseProgram:R,releaseShaderCache:A,programs:h,dispose:P}}function c0(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function h0(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Fh(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Nh(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(u,f,d,m,E,g){let p=i[e];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:m,renderOrder:u.renderOrder,z:E,group:g},i[e]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=m,p.renderOrder=u.renderOrder,p.z=E,p.group=g),e++,p}function a(u,f,d,m,E,g){let p=o(u,f,d,m,E,g);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):t.push(p)}function l(u,f,d,m,E,g){let p=o(u,f,d,m,E,g);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):t.unshift(p)}function c(u,f){t.length>1&&t.sort(u||h0),n.length>1&&n.sort(f||Fh),s.length>1&&s.sort(f||Fh)}function h(){for(let u=e,f=i.length;u<f;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function u0(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new Nh,i.set(n,[o])):s>=r.length?(o=new Nh,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function d0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new _e};break;case"SpotLight":t={position:new I,direction:new I,color:new _e,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new _e,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new _e,groundColor:new _e};break;case"RectAreaLight":t={color:new _e,position:new I,halfWidth:new I,halfHeight:new I};break}return i[e.id]=t,t}}}function f0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var p0=0;function m0(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function g0(i){let e=new d0,t=f0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new I);let s=new I,r=new ct,o=new ct;function a(c){let h=0,u=0,f=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let d=0,m=0,E=0,g=0,p=0,_=0,v=0,x=0,b=0,R=0,A=0;c.sort(m0);for(let T=0,M=c.length;T<M;T++){let H=c[T],B=H.color,F=H.intensity,k=H.distance,V=H.shadow&&H.shadow.map?H.shadow.map.texture:null;if(H.isAmbientLight)h+=B.r*F,u+=B.g*F,f+=B.b*F;else if(H.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(H.sh.coefficients[W],F);A++}else if(H.isDirectionalLight){let W=e.get(H);if(W.color.copy(H.color).multiplyScalar(H.intensity),H.castShadow){let le=H.shadow,O=t.get(H);O.shadowIntensity=le.intensity,O.shadowBias=le.bias,O.shadowNormalBias=le.normalBias,O.shadowRadius=le.radius,O.shadowMapSize=le.mapSize,n.directionalShadow[d]=O,n.directionalShadowMap[d]=V,n.directionalShadowMatrix[d]=H.shadow.matrix,_++}n.directional[d]=W,d++}else if(H.isSpotLight){let W=e.get(H);W.position.setFromMatrixPosition(H.matrixWorld),W.color.copy(B).multiplyScalar(F),W.distance=k,W.coneCos=Math.cos(H.angle),W.penumbraCos=Math.cos(H.angle*(1-H.penumbra)),W.decay=H.decay,n.spot[E]=W;let le=H.shadow;if(H.map&&(n.spotLightMap[b]=H.map,b++,le.updateMatrices(H),H.castShadow&&R++),n.spotLightMatrix[E]=le.matrix,H.castShadow){let O=t.get(H);O.shadowIntensity=le.intensity,O.shadowBias=le.bias,O.shadowNormalBias=le.normalBias,O.shadowRadius=le.radius,O.shadowMapSize=le.mapSize,n.spotShadow[E]=O,n.spotShadowMap[E]=V,x++}E++}else if(H.isRectAreaLight){let W=e.get(H);W.color.copy(B).multiplyScalar(F),W.halfWidth.set(H.width*.5,0,0),W.halfHeight.set(0,H.height*.5,0),n.rectArea[g]=W,g++}else if(H.isPointLight){let W=e.get(H);if(W.color.copy(H.color).multiplyScalar(H.intensity),W.distance=H.distance,W.decay=H.decay,H.castShadow){let le=H.shadow,O=t.get(H);O.shadowIntensity=le.intensity,O.shadowBias=le.bias,O.shadowNormalBias=le.normalBias,O.shadowRadius=le.radius,O.shadowMapSize=le.mapSize,O.shadowCameraNear=le.camera.near,O.shadowCameraFar=le.camera.far,n.pointShadow[m]=O,n.pointShadowMap[m]=V,n.pointShadowMatrix[m]=H.shadow.matrix,v++}n.point[m]=W,m++}else if(H.isHemisphereLight){let W=e.get(H);W.skyColor.copy(H.color).multiplyScalar(F),W.groundColor.copy(H.groundColor).multiplyScalar(F),n.hemi[p]=W,p++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ve.LTC_FLOAT_1,n.rectAreaLTC2=ve.LTC_FLOAT_2):(n.rectAreaLTC1=ve.LTC_HALF_1,n.rectAreaLTC2=ve.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let P=n.hash;(P.directionalLength!==d||P.pointLength!==m||P.spotLength!==E||P.rectAreaLength!==g||P.hemiLength!==p||P.numDirectionalShadows!==_||P.numPointShadows!==v||P.numSpotShadows!==x||P.numSpotMaps!==b||P.numLightProbes!==A)&&(n.directional.length=d,n.spot.length=E,n.rectArea.length=g,n.point.length=m,n.hemi.length=p,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=x+b-R,n.spotLightMap.length=b,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=A,P.directionalLength=d,P.pointLength=m,P.spotLength=E,P.rectAreaLength=g,P.hemiLength=p,P.numDirectionalShadows=_,P.numPointShadows=v,P.numSpotShadows=x,P.numSpotMaps=b,P.numLightProbes=A,n.version=p0++)}function l(c,h){let u=0,f=0,d=0,m=0,E=0,g=h.matrixWorldInverse;for(let p=0,_=c.length;p<_;p++){let v=c[p];if(v.isDirectionalLight){let x=n.directional[u];x.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),u++}else if(v.isSpotLight){let x=n.spot[d];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(g),x.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),d++}else if(v.isRectAreaLight){let x=n.rectArea[m];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(g),o.identity(),r.copy(v.matrixWorld),r.premultiply(g),o.extractRotation(r),x.halfWidth.set(v.width*.5,0,0),x.halfHeight.set(0,v.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),m++}else if(v.isPointLight){let x=n.point[f];x.position.setFromMatrixPosition(v.matrixWorld),x.position.applyMatrix4(g),f++}else if(v.isHemisphereLight){let x=n.hemi[E];x.direction.setFromMatrixPosition(v.matrixWorld),x.direction.transformDirection(g),E++}}}return{setup:a,setupView:l,state:n}}function Oh(i){let e=new g0(i),t=[],n=[];function s(h){c.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function o(h){n.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function E0(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Oh(i),e.set(s,[a])):r>=o.length?(a=new Oh(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var x0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,y0=`uniform sampler2D shadow_pass;
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
}`;function M0(i,e,t){let n=new Ki,s=new ge,r=new ge,o=new lt,a=new ro({depthPacking:nh}),l=new oo,c={},h=t.maxTextureSize,u={[Bn]:Ft,[Ft]:Bn,[ft]:ft},f=new Bt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ge},radius:{value:4}},vertexShader:x0,fragmentShader:y0}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let m=new Mt;m.setAttribute("position",new Ut(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let E=new y(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=hl;let p=this.type;this.render=function(R,A,P){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||R.length===0)return;let T=i.getRenderTarget(),M=i.getActiveCubeFace(),H=i.getActiveMipmapLevel(),B=i.state;B.setBlending(Nn),B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let F=p!==vn&&this.type===vn,k=p===vn&&this.type!==vn;for(let V=0,W=R.length;V<W;V++){let le=R[V],O=le.shadow;if(O===void 0){console.warn("THREE.WebGLShadowMap:",le,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;s.copy(O.mapSize);let he=O.getFrameExtents();if(s.multiply(he),r.copy(O.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/he.x),s.x=r.x*he.x,O.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/he.y),s.y=r.y*he.y,O.mapSize.y=r.y)),O.map===null||F===!0||k===!0){let me=this.type!==vn?{minFilter:ln,magFilter:ln}:{};O.map!==null&&O.map.dispose(),O.map=new cn(s.x,s.y,me),O.map.texture.name=le.name+".shadowMap",O.camera.updateProjectionMatrix()}i.setRenderTarget(O.map),i.clear();let re=O.getViewportCount();for(let me=0;me<re;me++){let Re=O.getViewport(me);o.set(r.x*Re.x,r.y*Re.y,r.x*Re.z,r.y*Re.w),B.viewport(o),O.updateMatrices(le,me),n=O.getFrustum(),x(A,P,O.camera,le,this.type)}O.isPointLightShadow!==!0&&this.type===vn&&_(O,P),O.needsUpdate=!1}p=this.type,g.needsUpdate=!1,i.setRenderTarget(T,M,H)};function _(R,A){let P=e.update(E);f.defines.VSM_SAMPLES!==R.blurSamples&&(f.defines.VSM_SAMPLES=R.blurSamples,d.defines.VSM_SAMPLES=R.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new cn(s.x,s.y)),f.uniforms.shadow_pass.value=R.map.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(A,null,P,f,E,null),d.uniforms.shadow_pass.value=R.mapPass.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(A,null,P,d,E,null)}function v(R,A,P,T){let M=null,H=P.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(H!==void 0)M=H;else if(M=P.isPointLight===!0?l:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let B=M.uuid,F=A.uuid,k=c[B];k===void 0&&(k={},c[B]=k);let V=k[F];V===void 0&&(V=M.clone(),k[F]=V,A.addEventListener("dispose",b)),M=V}if(M.visible=A.visible,M.wireframe=A.wireframe,T===vn?M.side=A.shadowSide!==null?A.shadowSide:A.side:M.side=A.shadowSide!==null?A.shadowSide:u[A.side],M.alphaMap=A.alphaMap,M.alphaTest=A.alphaTest,M.map=A.map,M.clipShadows=A.clipShadows,M.clippingPlanes=A.clippingPlanes,M.clipIntersection=A.clipIntersection,M.displacementMap=A.displacementMap,M.displacementScale=A.displacementScale,M.displacementBias=A.displacementBias,M.wireframeLinewidth=A.wireframeLinewidth,M.linewidth=A.linewidth,P.isPointLight===!0&&M.isMeshDistanceMaterial===!0){let B=i.properties.get(M);B.light=P}return M}function x(R,A,P,T,M){if(R.visible===!1)return;if(R.layers.test(A.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&M===vn)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,R.matrixWorld);let F=e.update(R),k=R.material;if(Array.isArray(k)){let V=F.groups;for(let W=0,le=V.length;W<le;W++){let O=V[W],he=k[O.materialIndex];if(he&&he.visible){let re=v(R,he,T,M);R.onBeforeShadow(i,R,A,P,F,re,O),i.renderBufferDirect(P,null,F,re,R,O),R.onAfterShadow(i,R,A,P,F,re,O)}}}else if(k.visible){let V=v(R,k,T,M);R.onBeforeShadow(i,R,A,P,F,V,null),i.renderBufferDirect(P,null,F,V,R,null),R.onAfterShadow(i,R,A,P,F,V,null)}}let B=R.children;for(let F=0,k=B.length;F<k;F++)x(B[F],A,P,T,M)}function b(R){R.target.removeEventListener("dispose",b);for(let P in c){let T=c[P],M=R.target.uuid;M in T&&(T[M].dispose(),delete T[M])}}}var _0={[yo]:Mo,[_o]:To,[vo]:So,[gi]:wo,[Mo]:yo,[To]:_o,[So]:vo,[wo]:gi};function v0(i,e){function t(){let L=!1,Ee=new lt,$=null,oe=new lt(0,0,0,0);return{setMask:function(Te){$!==Te&&!L&&(i.colorMask(Te,Te,Te,Te),$=Te)},setLocked:function(Te){L=Te},setClear:function(Te,ye,Ye,pt,Et){Et===!0&&(Te*=pt,ye*=pt,Ye*=pt),Ee.set(Te,ye,Ye,pt),oe.equals(Ee)===!1&&(i.clearColor(Te,ye,Ye,pt),oe.copy(Ee))},reset:function(){L=!1,$=null,oe.set(-1,0,0,0)}}}function n(){let L=!1,Ee=!1,$=null,oe=null,Te=null;return{setReversed:function(ye){if(Ee!==ye){let Ye=e.get("EXT_clip_control");ye?Ye.clipControlEXT(Ye.LOWER_LEFT_EXT,Ye.ZERO_TO_ONE_EXT):Ye.clipControlEXT(Ye.LOWER_LEFT_EXT,Ye.NEGATIVE_ONE_TO_ONE_EXT),Ee=ye;let pt=Te;Te=null,this.setClear(pt)}},getReversed:function(){return Ee},setTest:function(ye){ye?ie(i.DEPTH_TEST):Y(i.DEPTH_TEST)},setMask:function(ye){$!==ye&&!L&&(i.depthMask(ye),$=ye)},setFunc:function(ye){if(Ee&&(ye=_0[ye]),oe!==ye){switch(ye){case yo:i.depthFunc(i.NEVER);break;case Mo:i.depthFunc(i.ALWAYS);break;case _o:i.depthFunc(i.LESS);break;case gi:i.depthFunc(i.LEQUAL);break;case vo:i.depthFunc(i.EQUAL);break;case wo:i.depthFunc(i.GEQUAL);break;case To:i.depthFunc(i.GREATER);break;case So:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}oe=ye}},setLocked:function(ye){L=ye},setClear:function(ye){Te!==ye&&(Ee&&(ye=1-ye),i.clearDepth(ye),Te=ye)},reset:function(){L=!1,$=null,oe=null,Te=null,Ee=!1}}}function s(){let L=!1,Ee=null,$=null,oe=null,Te=null,ye=null,Ye=null,pt=null,Et=null;return{setTest:function(ot){L||(ot?ie(i.STENCIL_TEST):Y(i.STENCIL_TEST))},setMask:function(ot){Ee!==ot&&!L&&(i.stencilMask(ot),Ee=ot)},setFunc:function(ot,Xt,kt){($!==ot||oe!==Xt||Te!==kt)&&(i.stencilFunc(ot,Xt,kt),$=ot,oe=Xt,Te=kt)},setOp:function(ot,Xt,kt){(ye!==ot||Ye!==Xt||pt!==kt)&&(i.stencilOp(ot,Xt,kt),ye=ot,Ye=Xt,pt=kt)},setLocked:function(ot){L=ot},setClear:function(ot){Et!==ot&&(i.clearStencil(ot),Et=ot)},reset:function(){L=!1,Ee=null,$=null,oe=null,Te=null,ye=null,Ye=null,pt=null,Et=null}}}let r=new t,o=new n,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},f=new WeakMap,d=[],m=null,E=!1,g=null,p=null,_=null,v=null,x=null,b=null,R=null,A=new _e(0,0,0),P=0,T=!1,M=null,H=null,B=null,F=null,k=null,V=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,le=0,O=i.getParameter(i.VERSION);O.indexOf("WebGL")!==-1?(le=parseFloat(/^WebGL (\d)/.exec(O)[1]),W=le>=1):O.indexOf("OpenGL ES")!==-1&&(le=parseFloat(/^OpenGL ES (\d)/.exec(O)[1]),W=le>=2);let he=null,re={},me=i.getParameter(i.SCISSOR_BOX),Re=i.getParameter(i.VIEWPORT),Ae=new lt().fromArray(me),q=new lt().fromArray(Re);function ae(L,Ee,$,oe){let Te=new Uint8Array(4),ye=i.createTexture();i.bindTexture(L,ye),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ye=0;Ye<$;Ye++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(Ee,0,i.RGBA,1,1,oe,0,i.RGBA,i.UNSIGNED_BYTE,Te):i.texImage2D(Ee+Ye,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Te);return ye}let K={};K[i.TEXTURE_2D]=ae(i.TEXTURE_2D,i.TEXTURE_2D,1),K[i.TEXTURE_CUBE_MAP]=ae(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[i.TEXTURE_2D_ARRAY]=ae(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),K[i.TEXTURE_3D]=ae(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ie(i.DEPTH_TEST),o.setFunc(gi),ke(!1),Je(cl),ie(i.CULL_FACE),D(Nn);function ie(L){h[L]!==!0&&(i.enable(L),h[L]=!0)}function Y(L){h[L]!==!1&&(i.disable(L),h[L]=!1)}function we(L,Ee){return u[L]!==Ee?(i.bindFramebuffer(L,Ee),u[L]=Ee,L===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=Ee),L===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=Ee),!0):!1}function X(L,Ee){let $=d,oe=!1;if(L){$=f.get(Ee),$===void 0&&($=[],f.set(Ee,$));let Te=L.textures;if($.length!==Te.length||$[0]!==i.COLOR_ATTACHMENT0){for(let ye=0,Ye=Te.length;ye<Ye;ye++)$[ye]=i.COLOR_ATTACHMENT0+ye;$.length=Te.length,oe=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,oe=!0);oe&&i.drawBuffers($)}function de(L){return m!==L?(i.useProgram(L),m=L,!0):!1}let be={[$n]:i.FUNC_ADD,[Cc]:i.FUNC_SUBTRACT,[Pc]:i.FUNC_REVERSE_SUBTRACT};be[Ic]=i.MIN,be[Hc]=i.MAX;let Ve={[Dc]:i.ZERO,[Lc]:i.ONE,[Uc]:i.SRC_COLOR,[Gr]:i.SRC_ALPHA,[kc]:i.SRC_ALPHA_SATURATE,[Oc]:i.DST_COLOR,[Fc]:i.DST_ALPHA,[Bc]:i.ONE_MINUS_SRC_COLOR,[kr]:i.ONE_MINUS_SRC_ALPHA,[Gc]:i.ONE_MINUS_DST_COLOR,[Nc]:i.ONE_MINUS_DST_ALPHA,[zc]:i.CONSTANT_COLOR,[Vc]:i.ONE_MINUS_CONSTANT_COLOR,[Wc]:i.CONSTANT_ALPHA,[Xc]:i.ONE_MINUS_CONSTANT_ALPHA};function D(L,Ee,$,oe,Te,ye,Ye,pt,Et,ot){if(L===Nn){E===!0&&(Y(i.BLEND),E=!1);return}if(E===!1&&(ie(i.BLEND),E=!0),L!==Ac){if(L!==g||ot!==T){if((p!==$n||x!==$n)&&(i.blendEquation(i.FUNC_ADD),p=$n,x=$n),ot)switch(L){case mi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case wn:i.blendFunc(i.ONE,i.ONE);break;case ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case dl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case mi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case wn:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case dl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}_=null,v=null,b=null,R=null,A.set(0,0,0),P=0,g=L,T=ot}return}Te=Te||Ee,ye=ye||$,Ye=Ye||oe,(Ee!==p||Te!==x)&&(i.blendEquationSeparate(be[Ee],be[Te]),p=Ee,x=Te),($!==_||oe!==v||ye!==b||Ye!==R)&&(i.blendFuncSeparate(Ve[$],Ve[oe],Ve[ye],Ve[Ye]),_=$,v=oe,b=ye,R=Ye),(pt.equals(A)===!1||Et!==P)&&(i.blendColor(pt.r,pt.g,pt.b,Et),A.copy(pt),P=Et),g=L,T=!1}function _t(L,Ee){L.side===ft?Y(i.CULL_FACE):ie(i.CULL_FACE);let $=L.side===Ft;Ee&&($=!$),ke($),L.blending===mi&&L.transparent===!1?D(Nn):D(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),o.setFunc(L.depthFunc),o.setTest(L.depthTest),o.setMask(L.depthWrite),r.setMask(L.colorWrite);let oe=L.stencilWrite;a.setTest(oe),oe&&(a.setMask(L.stencilWriteMask),a.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),a.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),$e(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?ie(i.SAMPLE_ALPHA_TO_COVERAGE):Y(i.SAMPLE_ALPHA_TO_COVERAGE)}function ke(L){M!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),M=L)}function Je(L){L!==bc?(ie(i.CULL_FACE),L!==H&&(L===cl?i.cullFace(i.BACK):L===Rc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Y(i.CULL_FACE),H=L}function Fe(L){L!==B&&(W&&i.lineWidth(L),B=L)}function $e(L,Ee,$){L?(ie(i.POLYGON_OFFSET_FILL),(F!==Ee||k!==$)&&(i.polygonOffset(Ee,$),F=Ee,k=$)):Y(i.POLYGON_OFFSET_FILL)}function Le(L){L?ie(i.SCISSOR_TEST):Y(i.SCISSOR_TEST)}function C(L){L===void 0&&(L=i.TEXTURE0+V-1),he!==L&&(i.activeTexture(L),he=L)}function w(L,Ee,$){$===void 0&&(he===null?$=i.TEXTURE0+V-1:$=he);let oe=re[$];oe===void 0&&(oe={type:void 0,texture:void 0},re[$]=oe),(oe.type!==L||oe.texture!==Ee)&&(he!==$&&(i.activeTexture($),he=$),i.bindTexture(L,Ee||K[L]),oe.type=L,oe.texture=Ee)}function z(){let L=re[he];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function ee(){try{i.compressedTexImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ce(){try{i.compressedTexImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function te(){try{i.texSubImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ue(){try{i.texSubImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Q(){try{i.compressedTexSubImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function se(){try{i.compressedTexSubImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ie(){try{i.texStorage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ne(){try{i.texStorage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function fe(){try{i.texImage2D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ce(){try{i.texImage3D(...arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Be(L){Ae.equals(L)===!1&&(i.scissor(L.x,L.y,L.z,L.w),Ae.copy(L))}function xe(L){q.equals(L)===!1&&(i.viewport(L.x,L.y,L.z,L.w),q.copy(L))}function qe(L,Ee){let $=c.get(Ee);$===void 0&&($=new WeakMap,c.set(Ee,$));let oe=$.get(L);oe===void 0&&(oe=i.getUniformBlockIndex(Ee,L.name),$.set(L,oe))}function Oe(L,Ee){let oe=c.get(Ee).get(L);l.get(Ee)!==oe&&(i.uniformBlockBinding(Ee,oe,L.__bindingPointIndex),l.set(Ee,oe))}function nt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},he=null,re={},u={},f=new WeakMap,d=[],m=null,E=!1,g=null,p=null,_=null,v=null,x=null,b=null,R=null,A=new _e(0,0,0),P=0,T=!1,M=null,H=null,B=null,F=null,k=null,Ae.set(0,0,i.canvas.width,i.canvas.height),q.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ie,disable:Y,bindFramebuffer:we,drawBuffers:X,useProgram:de,setBlending:D,setMaterial:_t,setFlipSided:ke,setCullFace:Je,setLineWidth:Fe,setPolygonOffset:$e,setScissorTest:Le,activeTexture:C,bindTexture:w,unbindTexture:z,compressedTexImage2D:ee,compressedTexImage3D:ce,texImage2D:fe,texImage3D:Ce,updateUBOMapping:qe,uniformBlockBinding:Oe,texStorage2D:Ie,texStorage3D:ne,texSubImage2D:te,texSubImage3D:Ue,compressedTexSubImage2D:Q,compressedTexSubImage3D:se,scissor:Be,viewport:xe,reset:nt}}function w0(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ge,h=new WeakMap,u,f=new WeakMap,d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(C,w){return d?new OffscreenCanvas(C,w):Yi("canvas")}function E(C,w,z){let ee=1,ce=Le(C);if((ce.width>z||ce.height>z)&&(ee=z/Math.max(ce.width,ce.height)),ee<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let te=Math.floor(ee*ce.width),Ue=Math.floor(ee*ce.height);u===void 0&&(u=m(te,Ue));let Q=w?m(te,Ue):u;return Q.width=te,Q.height=Ue,Q.getContext("2d").drawImage(C,0,0,te,Ue),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ce.width+"x"+ce.height+") to ("+te+"x"+Ue+")."),Q}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ce.width+"x"+ce.height+")."),C;return C}function g(C){return C.generateMipmaps}function p(C){i.generateMipmap(C)}function _(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(C,w,z,ee,ce=!1){if(C!==null){if(i[C]!==void 0)return i[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let te=w;if(w===i.RED&&(z===i.FLOAT&&(te=i.R32F),z===i.HALF_FLOAT&&(te=i.R16F),z===i.UNSIGNED_BYTE&&(te=i.R8)),w===i.RED_INTEGER&&(z===i.UNSIGNED_BYTE&&(te=i.R8UI),z===i.UNSIGNED_SHORT&&(te=i.R16UI),z===i.UNSIGNED_INT&&(te=i.R32UI),z===i.BYTE&&(te=i.R8I),z===i.SHORT&&(te=i.R16I),z===i.INT&&(te=i.R32I)),w===i.RG&&(z===i.FLOAT&&(te=i.RG32F),z===i.HALF_FLOAT&&(te=i.RG16F),z===i.UNSIGNED_BYTE&&(te=i.RG8)),w===i.RG_INTEGER&&(z===i.UNSIGNED_BYTE&&(te=i.RG8UI),z===i.UNSIGNED_SHORT&&(te=i.RG16UI),z===i.UNSIGNED_INT&&(te=i.RG32UI),z===i.BYTE&&(te=i.RG8I),z===i.SHORT&&(te=i.RG16I),z===i.INT&&(te=i.RG32I)),w===i.RGB_INTEGER&&(z===i.UNSIGNED_BYTE&&(te=i.RGB8UI),z===i.UNSIGNED_SHORT&&(te=i.RGB16UI),z===i.UNSIGNED_INT&&(te=i.RGB32UI),z===i.BYTE&&(te=i.RGB8I),z===i.SHORT&&(te=i.RGB16I),z===i.INT&&(te=i.RGB32I)),w===i.RGBA_INTEGER&&(z===i.UNSIGNED_BYTE&&(te=i.RGBA8UI),z===i.UNSIGNED_SHORT&&(te=i.RGBA16UI),z===i.UNSIGNED_INT&&(te=i.RGBA32UI),z===i.BYTE&&(te=i.RGBA8I),z===i.SHORT&&(te=i.RGBA16I),z===i.INT&&(te=i.RGBA32I)),w===i.RGB&&z===i.UNSIGNED_INT_5_9_9_9_REV&&(te=i.RGB9_E5),w===i.RGBA){let Ue=ce?Rs:rt.getTransfer(ee);z===i.FLOAT&&(te=i.RGBA32F),z===i.HALF_FLOAT&&(te=i.RGBA16F),z===i.UNSIGNED_BYTE&&(te=Ue===dt?i.SRGB8_ALPHA8:i.RGBA8),z===i.UNSIGNED_SHORT_4_4_4_4&&(te=i.RGBA4),z===i.UNSIGNED_SHORT_5_5_5_1&&(te=i.RGB5_A1)}return(te===i.R16F||te===i.R32F||te===i.RG16F||te===i.RG32F||te===i.RGBA16F||te===i.RGBA32F)&&e.get("EXT_color_buffer_float"),te}function x(C,w){let z;return C?w===null||w===si||w===ss?z=i.DEPTH24_STENCIL8:w===Sn?z=i.DEPTH32F_STENCIL8:w===is&&(z=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===si||w===ss?z=i.DEPTH_COMPONENT24:w===Sn?z=i.DEPTH_COMPONENT32F:w===is&&(z=i.DEPTH_COMPONENT16),z}function b(C,w){return g(C)===!0||C.isFramebufferTexture&&C.minFilter!==ln&&C.minFilter!==xn?Math.log2(Math.max(w.width,w.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?w.mipmaps.length:1}function R(C){let w=C.target;w.removeEventListener("dispose",R),P(w),w.isVideoTexture&&h.delete(w)}function A(C){let w=C.target;w.removeEventListener("dispose",A),M(w)}function P(C){let w=n.get(C);if(w.__webglInit===void 0)return;let z=C.source,ee=f.get(z);if(ee){let ce=ee[w.__cacheKey];ce.usedTimes--,ce.usedTimes===0&&T(C),Object.keys(ee).length===0&&f.delete(z)}n.remove(C)}function T(C){let w=n.get(C);i.deleteTexture(w.__webglTexture);let z=C.source,ee=f.get(z);delete ee[w.__cacheKey],o.memory.textures--}function M(C){let w=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(w.__webglFramebuffer[ee]))for(let ce=0;ce<w.__webglFramebuffer[ee].length;ce++)i.deleteFramebuffer(w.__webglFramebuffer[ee][ce]);else i.deleteFramebuffer(w.__webglFramebuffer[ee]);w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer[ee])}else{if(Array.isArray(w.__webglFramebuffer))for(let ee=0;ee<w.__webglFramebuffer.length;ee++)i.deleteFramebuffer(w.__webglFramebuffer[ee]);else i.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&i.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&i.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let ee=0;ee<w.__webglColorRenderbuffer.length;ee++)w.__webglColorRenderbuffer[ee]&&i.deleteRenderbuffer(w.__webglColorRenderbuffer[ee]);w.__webglDepthRenderbuffer&&i.deleteRenderbuffer(w.__webglDepthRenderbuffer)}let z=C.textures;for(let ee=0,ce=z.length;ee<ce;ee++){let te=n.get(z[ee]);te.__webglTexture&&(i.deleteTexture(te.__webglTexture),o.memory.textures--),n.remove(z[ee])}n.remove(C)}let H=0;function B(){H=0}function F(){let C=H;return C>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),H+=1,C}function k(C){let w=[];return w.push(C.wrapS),w.push(C.wrapT),w.push(C.wrapR||0),w.push(C.magFilter),w.push(C.minFilter),w.push(C.anisotropy),w.push(C.internalFormat),w.push(C.format),w.push(C.type),w.push(C.generateMipmaps),w.push(C.premultiplyAlpha),w.push(C.flipY),w.push(C.unpackAlignment),w.push(C.colorSpace),w.join()}function V(C,w){let z=n.get(C);if(C.isVideoTexture&&Fe(C),C.isRenderTargetTexture===!1&&C.version>0&&z.__version!==C.version){let ee=C.image;if(ee===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ee.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(z,C,w);return}}t.bindTexture(i.TEXTURE_2D,z.__webglTexture,i.TEXTURE0+w)}function W(C,w){let z=n.get(C);if(C.version>0&&z.__version!==C.version){q(z,C,w);return}t.bindTexture(i.TEXTURE_2D_ARRAY,z.__webglTexture,i.TEXTURE0+w)}function le(C,w){let z=n.get(C);if(C.version>0&&z.__version!==C.version){q(z,C,w);return}t.bindTexture(i.TEXTURE_3D,z.__webglTexture,i.TEXTURE0+w)}function O(C,w){let z=n.get(C);if(C.version>0&&z.__version!==C.version){ae(z,C,w);return}t.bindTexture(i.TEXTURE_CUBE_MAP,z.__webglTexture,i.TEXTURE0+w)}let he={[zr]:i.REPEAT,[Kn]:i.CLAMP_TO_EDGE,[Vr]:i.MIRRORED_REPEAT},re={[ln]:i.NEAREST,[eh]:i.NEAREST_MIPMAP_NEAREST,[er]:i.NEAREST_MIPMAP_LINEAR,[xn]:i.LINEAR,[Co]:i.LINEAR_MIPMAP_NEAREST,[ii]:i.LINEAR_MIPMAP_LINEAR},me={[sh]:i.NEVER,[hh]:i.ALWAYS,[rh]:i.LESS,[bl]:i.LEQUAL,[oh]:i.EQUAL,[ch]:i.GEQUAL,[ah]:i.GREATER,[lh]:i.NOTEQUAL};function Re(C,w){if(w.type===Sn&&e.has("OES_texture_float_linear")===!1&&(w.magFilter===xn||w.magFilter===Co||w.magFilter===er||w.magFilter===ii||w.minFilter===xn||w.minFilter===Co||w.minFilter===er||w.minFilter===ii)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,he[w.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,he[w.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,he[w.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,re[w.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,re[w.minFilter]),w.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,me[w.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===ln||w.minFilter!==er&&w.minFilter!==ii||w.type===Sn&&e.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){let z=e.get("EXT_texture_filter_anisotropic");i.texParameterf(C,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function Ae(C,w){let z=!1;C.__webglInit===void 0&&(C.__webglInit=!0,w.addEventListener("dispose",R));let ee=w.source,ce=f.get(ee);ce===void 0&&(ce={},f.set(ee,ce));let te=k(w);if(te!==C.__cacheKey){ce[te]===void 0&&(ce[te]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,z=!0),ce[te].usedTimes++;let Ue=ce[C.__cacheKey];Ue!==void 0&&(ce[C.__cacheKey].usedTimes--,Ue.usedTimes===0&&T(w)),C.__cacheKey=te,C.__webglTexture=ce[te].texture}return z}function q(C,w,z){let ee=i.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(ee=i.TEXTURE_2D_ARRAY),w.isData3DTexture&&(ee=i.TEXTURE_3D);let ce=Ae(C,w),te=w.source;t.bindTexture(ee,C.__webglTexture,i.TEXTURE0+z);let Ue=n.get(te);if(te.version!==Ue.__version||ce===!0){t.activeTexture(i.TEXTURE0+z);let Q=rt.getPrimaries(rt.workingColorSpace),se=w.colorSpace===Gn?null:rt.getPrimaries(w.colorSpace),Ie=w.colorSpace===Gn||Q===se?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ie);let ne=E(w.image,!1,s.maxTextureSize);ne=$e(w,ne);let fe=r.convert(w.format,w.colorSpace),Ce=r.convert(w.type),Be=v(w.internalFormat,fe,Ce,w.colorSpace,w.isVideoTexture);Re(ee,w);let xe,qe=w.mipmaps,Oe=w.isVideoTexture!==!0,nt=Ue.__version===void 0||ce===!0,L=te.dataReady,Ee=b(w,ne);if(w.isDepthTexture)Be=x(w.format===rs,w.type),nt&&(Oe?t.texStorage2D(i.TEXTURE_2D,1,Be,ne.width,ne.height):t.texImage2D(i.TEXTURE_2D,0,Be,ne.width,ne.height,0,fe,Ce,null));else if(w.isDataTexture)if(qe.length>0){Oe&&nt&&t.texStorage2D(i.TEXTURE_2D,Ee,Be,qe[0].width,qe[0].height);for(let $=0,oe=qe.length;$<oe;$++)xe=qe[$],Oe?L&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,xe.width,xe.height,fe,Ce,xe.data):t.texImage2D(i.TEXTURE_2D,$,Be,xe.width,xe.height,0,fe,Ce,xe.data);w.generateMipmaps=!1}else Oe?(nt&&t.texStorage2D(i.TEXTURE_2D,Ee,Be,ne.width,ne.height),L&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ne.width,ne.height,fe,Ce,ne.data)):t.texImage2D(i.TEXTURE_2D,0,Be,ne.width,ne.height,0,fe,Ce,ne.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){Oe&&nt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ee,Be,qe[0].width,qe[0].height,ne.depth);for(let $=0,oe=qe.length;$<oe;$++)if(xe=qe[$],w.format!==un)if(fe!==null)if(Oe){if(L)if(w.layerUpdates.size>0){let Te=Dl(xe.width,xe.height,w.format,w.type);for(let ye of w.layerUpdates){let Ye=xe.data.subarray(ye*Te/xe.data.BYTES_PER_ELEMENT,(ye+1)*Te/xe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,ye,xe.width,xe.height,1,fe,Ye)}w.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,xe.width,xe.height,ne.depth,fe,xe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,$,Be,xe.width,xe.height,ne.depth,0,xe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Oe?L&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,xe.width,xe.height,ne.depth,fe,Ce,xe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,$,Be,xe.width,xe.height,ne.depth,0,fe,Ce,xe.data)}else{Oe&&nt&&t.texStorage2D(i.TEXTURE_2D,Ee,Be,qe[0].width,qe[0].height);for(let $=0,oe=qe.length;$<oe;$++)xe=qe[$],w.format!==un?fe!==null?Oe?L&&t.compressedTexSubImage2D(i.TEXTURE_2D,$,0,0,xe.width,xe.height,fe,xe.data):t.compressedTexImage2D(i.TEXTURE_2D,$,Be,xe.width,xe.height,0,xe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Oe?L&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,xe.width,xe.height,fe,Ce,xe.data):t.texImage2D(i.TEXTURE_2D,$,Be,xe.width,xe.height,0,fe,Ce,xe.data)}else if(w.isDataArrayTexture)if(Oe){if(nt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ee,Be,ne.width,ne.height,ne.depth),L)if(w.layerUpdates.size>0){let $=Dl(ne.width,ne.height,w.format,w.type);for(let oe of w.layerUpdates){let Te=ne.data.subarray(oe*$/ne.data.BYTES_PER_ELEMENT,(oe+1)*$/ne.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,oe,ne.width,ne.height,1,fe,Ce,Te)}w.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,fe,Ce,ne.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Be,ne.width,ne.height,ne.depth,0,fe,Ce,ne.data);else if(w.isData3DTexture)Oe?(nt&&t.texStorage3D(i.TEXTURE_3D,Ee,Be,ne.width,ne.height,ne.depth),L&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,fe,Ce,ne.data)):t.texImage3D(i.TEXTURE_3D,0,Be,ne.width,ne.height,ne.depth,0,fe,Ce,ne.data);else if(w.isFramebufferTexture){if(nt)if(Oe)t.texStorage2D(i.TEXTURE_2D,Ee,Be,ne.width,ne.height);else{let $=ne.width,oe=ne.height;for(let Te=0;Te<Ee;Te++)t.texImage2D(i.TEXTURE_2D,Te,Be,$,oe,0,fe,Ce,null),$>>=1,oe>>=1}}else if(qe.length>0){if(Oe&&nt){let $=Le(qe[0]);t.texStorage2D(i.TEXTURE_2D,Ee,Be,$.width,$.height)}for(let $=0,oe=qe.length;$<oe;$++)xe=qe[$],Oe?L&&t.texSubImage2D(i.TEXTURE_2D,$,0,0,fe,Ce,xe):t.texImage2D(i.TEXTURE_2D,$,Be,fe,Ce,xe);w.generateMipmaps=!1}else if(Oe){if(nt){let $=Le(ne);t.texStorage2D(i.TEXTURE_2D,Ee,Be,$.width,$.height)}L&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,fe,Ce,ne)}else t.texImage2D(i.TEXTURE_2D,0,Be,fe,Ce,ne);g(w)&&p(ee),Ue.__version=te.version,w.onUpdate&&w.onUpdate(w)}C.__version=w.version}function ae(C,w,z){if(w.image.length!==6)return;let ee=Ae(C,w),ce=w.source;t.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+z);let te=n.get(ce);if(ce.version!==te.__version||ee===!0){t.activeTexture(i.TEXTURE0+z);let Ue=rt.getPrimaries(rt.workingColorSpace),Q=w.colorSpace===Gn?null:rt.getPrimaries(w.colorSpace),se=w.colorSpace===Gn||Ue===Q?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,w.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,w.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,se);let Ie=w.isCompressedTexture||w.image[0].isCompressedTexture,ne=w.image[0]&&w.image[0].isDataTexture,fe=[];for(let oe=0;oe<6;oe++)!Ie&&!ne?fe[oe]=E(w.image[oe],!0,s.maxCubemapSize):fe[oe]=ne?w.image[oe].image:w.image[oe],fe[oe]=$e(w,fe[oe]);let Ce=fe[0],Be=r.convert(w.format,w.colorSpace),xe=r.convert(w.type),qe=v(w.internalFormat,Be,xe,w.colorSpace),Oe=w.isVideoTexture!==!0,nt=te.__version===void 0||ee===!0,L=ce.dataReady,Ee=b(w,Ce);Re(i.TEXTURE_CUBE_MAP,w);let $;if(Ie){Oe&&nt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ee,qe,Ce.width,Ce.height);for(let oe=0;oe<6;oe++){$=fe[oe].mipmaps;for(let Te=0;Te<$.length;Te++){let ye=$[Te];w.format!==un?Be!==null?Oe?L&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te,0,0,ye.width,ye.height,Be,ye.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te,qe,ye.width,ye.height,0,ye.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Oe?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te,0,0,ye.width,ye.height,Be,xe,ye.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te,qe,ye.width,ye.height,0,Be,xe,ye.data)}}}else{if($=w.mipmaps,Oe&&nt){$.length>0&&Ee++;let oe=Le(fe[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ee,qe,oe.width,oe.height)}for(let oe=0;oe<6;oe++)if(ne){Oe?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,fe[oe].width,fe[oe].height,Be,xe,fe[oe].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,qe,fe[oe].width,fe[oe].height,0,Be,xe,fe[oe].data);for(let Te=0;Te<$.length;Te++){let Ye=$[Te].image[oe].image;Oe?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te+1,0,0,Ye.width,Ye.height,Be,xe,Ye.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te+1,qe,Ye.width,Ye.height,0,Be,xe,Ye.data)}}else{Oe?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,Be,xe,fe[oe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,qe,Be,xe,fe[oe]);for(let Te=0;Te<$.length;Te++){let ye=$[Te];Oe?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te+1,0,0,Be,xe,ye.image[oe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te+1,qe,Be,xe,ye.image[oe])}}}g(w)&&p(i.TEXTURE_CUBE_MAP),te.__version=ce.version,w.onUpdate&&w.onUpdate(w)}C.__version=w.version}function K(C,w,z,ee,ce,te){let Ue=r.convert(z.format,z.colorSpace),Q=r.convert(z.type),se=v(z.internalFormat,Ue,Q,z.colorSpace),Ie=n.get(w),ne=n.get(z);if(ne.__renderTarget=w,!Ie.__hasExternalTextures){let fe=Math.max(1,w.width>>te),Ce=Math.max(1,w.height>>te);ce===i.TEXTURE_3D||ce===i.TEXTURE_2D_ARRAY?t.texImage3D(ce,te,se,fe,Ce,w.depth,0,Ue,Q,null):t.texImage2D(ce,te,se,fe,Ce,0,Ue,Q,null)}t.bindFramebuffer(i.FRAMEBUFFER,C),Je(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,ce,ne.__webglTexture,0,ke(w)):(ce===i.TEXTURE_2D||ce>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ce<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ee,ce,ne.__webglTexture,te),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ie(C,w,z){if(i.bindRenderbuffer(i.RENDERBUFFER,C),w.depthBuffer){let ee=w.depthTexture,ce=ee&&ee.isDepthTexture?ee.type:null,te=x(w.stencilBuffer,ce),Ue=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=ke(w);Je(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Q,te,w.width,w.height):z?i.renderbufferStorageMultisample(i.RENDERBUFFER,Q,te,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,te,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Ue,i.RENDERBUFFER,C)}else{let ee=w.textures;for(let ce=0;ce<ee.length;ce++){let te=ee[ce],Ue=r.convert(te.format,te.colorSpace),Q=r.convert(te.type),se=v(te.internalFormat,Ue,Q,te.colorSpace),Ie=ke(w);z&&Je(w)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ie,se,w.width,w.height):Je(w)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ie,se,w.width,w.height):i.renderbufferStorage(i.RENDERBUFFER,se,w.width,w.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Y(C,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,C),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let ee=n.get(w.depthTexture);ee.__renderTarget=w,(!ee.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),V(w.depthTexture,0);let ce=ee.__webglTexture,te=ke(w);if(w.depthTexture.format===Xi)Je(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ce,0,te):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ce,0);else if(w.depthTexture.format===rs)Je(w)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ce,0,te):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ce,0);else throw new Error("Unknown depthTexture format")}function we(C){let w=n.get(C),z=C.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==C.depthTexture){let ee=C.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),ee){let ce=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,ee.removeEventListener("dispose",ce)};ee.addEventListener("dispose",ce),w.__depthDisposeCallback=ce}w.__boundDepthTexture=ee}if(C.depthTexture&&!w.__autoAllocateDepthBuffer){if(z)throw new Error("target.depthTexture not supported in Cube render targets");Y(w.__webglFramebuffer,C)}else if(z){w.__webglDepthbuffer=[];for(let ee=0;ee<6;ee++)if(t.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer[ee]),w.__webglDepthbuffer[ee]===void 0)w.__webglDepthbuffer[ee]=i.createRenderbuffer(),ie(w.__webglDepthbuffer[ee],C,!1);else{let ce=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,te=w.__webglDepthbuffer[ee];i.bindRenderbuffer(i.RENDERBUFFER,te),i.framebufferRenderbuffer(i.FRAMEBUFFER,ce,i.RENDERBUFFER,te)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=i.createRenderbuffer(),ie(w.__webglDepthbuffer,C,!1);else{let ee=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=w.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ce),i.framebufferRenderbuffer(i.FRAMEBUFFER,ee,i.RENDERBUFFER,ce)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function X(C,w,z){let ee=n.get(C);w!==void 0&&K(ee.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),z!==void 0&&we(C)}function de(C){let w=C.texture,z=n.get(C),ee=n.get(w);C.addEventListener("dispose",A);let ce=C.textures,te=C.isWebGLCubeRenderTarget===!0,Ue=ce.length>1;if(Ue||(ee.__webglTexture===void 0&&(ee.__webglTexture=i.createTexture()),ee.__version=w.version,o.memory.textures++),te){z.__webglFramebuffer=[];for(let Q=0;Q<6;Q++)if(w.mipmaps&&w.mipmaps.length>0){z.__webglFramebuffer[Q]=[];for(let se=0;se<w.mipmaps.length;se++)z.__webglFramebuffer[Q][se]=i.createFramebuffer()}else z.__webglFramebuffer[Q]=i.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){z.__webglFramebuffer=[];for(let Q=0;Q<w.mipmaps.length;Q++)z.__webglFramebuffer[Q]=i.createFramebuffer()}else z.__webglFramebuffer=i.createFramebuffer();if(Ue)for(let Q=0,se=ce.length;Q<se;Q++){let Ie=n.get(ce[Q]);Ie.__webglTexture===void 0&&(Ie.__webglTexture=i.createTexture(),o.memory.textures++)}if(C.samples>0&&Je(C)===!1){z.__webglMultisampledFramebuffer=i.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let Q=0;Q<ce.length;Q++){let se=ce[Q];z.__webglColorRenderbuffer[Q]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,z.__webglColorRenderbuffer[Q]);let Ie=r.convert(se.format,se.colorSpace),ne=r.convert(se.type),fe=v(se.internalFormat,Ie,ne,se.colorSpace,C.isXRRenderTarget===!0),Ce=ke(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ce,fe,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Q,i.RENDERBUFFER,z.__webglColorRenderbuffer[Q])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(z.__webglDepthRenderbuffer=i.createRenderbuffer(),ie(z.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(te){t.bindTexture(i.TEXTURE_CUBE_MAP,ee.__webglTexture),Re(i.TEXTURE_CUBE_MAP,w);for(let Q=0;Q<6;Q++)if(w.mipmaps&&w.mipmaps.length>0)for(let se=0;se<w.mipmaps.length;se++)K(z.__webglFramebuffer[Q][se],C,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,se);else K(z.__webglFramebuffer[Q],C,w,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0);g(w)&&p(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ue){for(let Q=0,se=ce.length;Q<se;Q++){let Ie=ce[Q],ne=n.get(Ie);t.bindTexture(i.TEXTURE_2D,ne.__webglTexture),Re(i.TEXTURE_2D,Ie),K(z.__webglFramebuffer,C,Ie,i.COLOR_ATTACHMENT0+Q,i.TEXTURE_2D,0),g(Ie)&&p(i.TEXTURE_2D)}t.unbindTexture()}else{let Q=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Q=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Q,ee.__webglTexture),Re(Q,w),w.mipmaps&&w.mipmaps.length>0)for(let se=0;se<w.mipmaps.length;se++)K(z.__webglFramebuffer[se],C,w,i.COLOR_ATTACHMENT0,Q,se);else K(z.__webglFramebuffer,C,w,i.COLOR_ATTACHMENT0,Q,0);g(w)&&p(Q),t.unbindTexture()}C.depthBuffer&&we(C)}function be(C){let w=C.textures;for(let z=0,ee=w.length;z<ee;z++){let ce=w[z];if(g(ce)){let te=_(C),Ue=n.get(ce).__webglTexture;t.bindTexture(te,Ue),p(te),t.unbindTexture()}}}let Ve=[],D=[];function _t(C){if(C.samples>0){if(Je(C)===!1){let w=C.textures,z=C.width,ee=C.height,ce=i.COLOR_BUFFER_BIT,te=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Ue=n.get(C),Q=w.length>1;if(Q)for(let se=0;se<w.length;se++)t.bindFramebuffer(i.FRAMEBUFFER,Ue.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+se,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Ue.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+se,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Ue.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ue.__webglFramebuffer);for(let se=0;se<w.length;se++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(ce|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(ce|=i.STENCIL_BUFFER_BIT)),Q){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Ue.__webglColorRenderbuffer[se]);let Ie=n.get(w[se]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ie,0)}i.blitFramebuffer(0,0,z,ee,0,0,z,ee,ce,i.NEAREST),l===!0&&(Ve.length=0,D.length=0,Ve.push(i.COLOR_ATTACHMENT0+se),C.depthBuffer&&C.resolveDepthBuffer===!1&&(Ve.push(te),D.push(te),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,D)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ve))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Q)for(let se=0;se<w.length;se++){t.bindFramebuffer(i.FRAMEBUFFER,Ue.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+se,i.RENDERBUFFER,Ue.__webglColorRenderbuffer[se]);let Ie=n.get(w[se]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Ue.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+se,i.TEXTURE_2D,Ie,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Ue.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){let w=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[w])}}}function ke(C){return Math.min(s.maxSamples,C.samples)}function Je(C){let w=n.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function Fe(C){let w=o.render.frame;h.get(C)!==w&&(h.set(C,w),C.update())}function $e(C,w){let z=C.colorSpace,ee=C.format,ce=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||z!==Ei&&z!==Gn&&(rt.getTransfer(z)===dt?(ee!==un||ce!==Tn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",z)),w}function Le(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=F,this.resetTextureUnits=B,this.setTexture2D=V,this.setTexture2DArray=W,this.setTexture3D=le,this.setTextureCube=O,this.rebindTextures=X,this.setupRenderTarget=de,this.updateRenderTargetMipmap=be,this.updateMultisampleRenderTarget=_t,this.setupDepthRenderbuffer=we,this.setupFrameBufferTexture=K,this.useMultisampledRTT=Je}function T0(i,e){function t(n,s=Gn){let r,o=rt.getTransfer(s);if(n===Tn)return i.UNSIGNED_BYTE;if(n===Io)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ho)return i.UNSIGNED_SHORT_5_5_5_1;if(n===El)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===ml)return i.BYTE;if(n===gl)return i.SHORT;if(n===is)return i.UNSIGNED_SHORT;if(n===Po)return i.INT;if(n===si)return i.UNSIGNED_INT;if(n===Sn)return i.FLOAT;if(n===ri)return i.HALF_FLOAT;if(n===xl)return i.ALPHA;if(n===yl)return i.RGB;if(n===un)return i.RGBA;if(n===Ml)return i.LUMINANCE;if(n===_l)return i.LUMINANCE_ALPHA;if(n===Xi)return i.DEPTH_COMPONENT;if(n===rs)return i.DEPTH_STENCIL;if(n===vl)return i.RED;if(n===Do)return i.RED_INTEGER;if(n===wl)return i.RG;if(n===Lo)return i.RG_INTEGER;if(n===Uo)return i.RGBA_INTEGER;if(n===tr||n===nr||n===ir||n===sr)if(o===dt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===tr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===nr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ir)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===sr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===tr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===nr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ir)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===sr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Bo||n===Fo||n===No||n===Oo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Bo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Fo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===No)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Oo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Go||n===ko||n===zo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Go||n===ko)return o===dt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===zo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Vo||n===Wo||n===Xo||n===Yo||n===qo||n===Zo||n===Jo||n===Ko||n===$o||n===Qo||n===jo||n===ea||n===ta||n===na)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Vo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Wo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Xo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Yo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===qo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Zo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Jo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ko)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===$o)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Qo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===jo)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ea)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ta)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===na)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===rr||n===ia||n===sa)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===rr)return o===dt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ia)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===sa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Tl||n===ra||n===oa||n===aa)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===rr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ra)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===oa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===aa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ss?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var S0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,b0=`
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

}`,Yl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new Vt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Bt({vertexShader:S0,fragmentShader:b0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new y(new tt(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ql=class extends Fn{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,m=null,E=new Yl,g=t.getContextAttributes(),p=null,_=null,v=[],x=[],b=new ge,R=null,A=new bt;A.viewport=new lt;let P=new bt;P.viewport=new lt;let T=[A,P],M=new Eo,H=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let ae=v[q];return ae===void 0&&(ae=new Ji,v[q]=ae),ae.getTargetRaySpace()},this.getControllerGrip=function(q){let ae=v[q];return ae===void 0&&(ae=new Ji,v[q]=ae),ae.getGripSpace()},this.getHand=function(q){let ae=v[q];return ae===void 0&&(ae=new Ji,v[q]=ae),ae.getHandSpace()};function F(q){let ae=x.indexOf(q.inputSource);if(ae===-1)return;let K=v[ae];K!==void 0&&(K.update(q.inputSource,q.frame,c||o),K.dispatchEvent({type:q.type,data:q.inputSource}))}function k(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",V);for(let q=0;q<v.length;q++){let ae=x[q];ae!==null&&(x[q]=null,v[q].disconnect(ae))}H=null,B=null,E.reset(),e.setRenderTarget(p),d=null,f=null,u=null,s=null,_=null,Ae.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(b.width,b.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(p=e.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",k),s.addEventListener("inputsourceschange",V),g.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(b),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let K=null,ie=null,Y=null;g.depth&&(Y=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,K=g.stencil?rs:Xi,ie=g.stencil?ss:si);let we={colorFormat:t.RGBA8,depthFormat:Y,scaleFactor:r};u=new XRWebGLBinding(s,t),f=u.createProjectionLayer(we),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),_=new cn(f.textureWidth,f.textureHeight,{format:un,type:Tn,depthTexture:new Os(f.textureWidth,f.textureHeight,ie,void 0,void 0,void 0,void 0,void 0,void 0,K),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let K={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,t,K),s.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),_=new cn(d.framebufferWidth,d.framebufferHeight,{format:un,type:Tn,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Ae.setContext(s),Ae.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return E.getDepthTexture()};function V(q){for(let ae=0;ae<q.removed.length;ae++){let K=q.removed[ae],ie=x.indexOf(K);ie>=0&&(x[ie]=null,v[ie].disconnect(K))}for(let ae=0;ae<q.added.length;ae++){let K=q.added[ae],ie=x.indexOf(K);if(ie===-1){for(let we=0;we<v.length;we++)if(we>=x.length){x.push(K),ie=we;break}else if(x[we]===null){x[we]=K,ie=we;break}if(ie===-1)break}let Y=v[ie];Y&&Y.connect(K)}}let W=new I,le=new I;function O(q,ae,K){W.setFromMatrixPosition(ae.matrixWorld),le.setFromMatrixPosition(K.matrixWorld);let ie=W.distanceTo(le),Y=ae.projectionMatrix.elements,we=K.projectionMatrix.elements,X=Y[14]/(Y[10]-1),de=Y[14]/(Y[10]+1),be=(Y[9]+1)/Y[5],Ve=(Y[9]-1)/Y[5],D=(Y[8]-1)/Y[0],_t=(we[8]+1)/we[0],ke=X*D,Je=X*_t,Fe=ie/(-D+_t),$e=Fe*-D;if(ae.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX($e),q.translateZ(Fe),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),Y[10]===-1)q.projectionMatrix.copy(ae.projectionMatrix),q.projectionMatrixInverse.copy(ae.projectionMatrixInverse);else{let Le=X+Fe,C=de+Fe,w=ke-$e,z=Je+(ie-$e),ee=be*de/C*Le,ce=Ve*de/C*Le;q.projectionMatrix.makePerspective(w,z,ee,ce,Le,C),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function he(q,ae){ae===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(ae.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let ae=q.near,K=q.far;E.texture!==null&&(E.depthNear>0&&(ae=E.depthNear),E.depthFar>0&&(K=E.depthFar)),M.near=P.near=A.near=ae,M.far=P.far=A.far=K,(H!==M.near||B!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),H=M.near,B=M.far),A.layers.mask=q.layers.mask|2,P.layers.mask=q.layers.mask|4,M.layers.mask=A.layers.mask|P.layers.mask;let ie=q.parent,Y=M.cameras;he(M,ie);for(let we=0;we<Y.length;we++)he(Y[we],ie);Y.length===2?O(M,A,P):M.projectionMatrix.copy(A.projectionMatrix),re(q,M,ie)};function re(q,ae,K){K===null?q.matrix.copy(ae.matrixWorld):(q.matrix.copy(K.matrixWorld),q.matrix.invert(),q.matrix.multiply(ae.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(ae.projectionMatrix),q.projectionMatrixInverse.copy(ae.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Cs*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(q){l=q,f!==null&&(f.fixedFoveation=q),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=q)},this.hasDepthSensing=function(){return E.texture!==null},this.getDepthSensingMesh=function(){return E.getMesh(M)};let me=null;function Re(q,ae){if(h=ae.getViewerPose(c||o),m=ae,h!==null){let K=h.views;d!==null&&(e.setRenderTargetFramebuffer(_,d.framebuffer),e.setRenderTarget(_));let ie=!1;K.length!==M.cameras.length&&(M.cameras.length=0,ie=!0);for(let X=0;X<K.length;X++){let de=K[X],be=null;if(d!==null)be=d.getViewport(de);else{let D=u.getViewSubImage(f,de);be=D.viewport,X===0&&(e.setRenderTargetTextures(_,D.colorTexture,D.depthStencilTexture),e.setRenderTarget(_))}let Ve=T[X];Ve===void 0&&(Ve=new bt,Ve.layers.enable(X),Ve.viewport=new lt,T[X]=Ve),Ve.matrix.fromArray(de.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(de.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(be.x,be.y,be.width,be.height),X===0&&(M.matrix.copy(Ve.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),ie===!0&&M.cameras.push(Ve)}let Y=s.enabledFeatures;if(Y&&Y.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&u){let X=u.getDepthInformation(K[0]);X&&X.isValid&&X.texture&&E.init(e,X,s.renderState)}}for(let K=0;K<v.length;K++){let ie=x[K],Y=v[K];ie!==null&&Y!==void 0&&Y.update(ie,ae,c||o)}me&&me(q,ae),ae.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ae}),m=null}let Ae=new Gh;Ae.setAnimationLoop(Re),this.setAnimationLoop=function(q){me=q},this.dispose=function(){}}},Ai=new Wt,R0=new ct;function A0(i,e){function t(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,Cl(i)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,_,v,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),u(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p)):p.isMeshStandardMaterial?(r(g,p),f(g,p),p.isMeshPhysicalMaterial&&d(g,p,x)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),E(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?l(g,p,_,v):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,t(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===Ft&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,t(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===Ft&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,t(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,t(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let _=e.get(p),v=_.envMap,x=_.envMapRotation;v&&(g.envMap.value=v,Ai.copy(x),Ai.x*=-1,Ai.y*=-1,Ai.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Ai.y*=-1,Ai.z*=-1),g.envMapRotation.value.setFromMatrix4(R0.makeRotationFromEuler(Ai)),g.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,_,v){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*_,g.scale.value=v*.5,p.map&&(g.map.value=p.map,t(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function u(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function f(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function d(g,p,_){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ft&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=_.texture,g.transmissionSamplerSize.value.set(_.width,_.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function E(g,p){let _=e.get(p).light;g.referencePosition.value.setFromMatrixPosition(_.matrixWorld),g.nearDistance.value=_.shadow.camera.near,g.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function C0(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,v){let x=v.program;n.uniformBlockBinding(_,x)}function c(_,v){let x=s[_.id];x===void 0&&(m(_),x=h(_),s[_.id]=x,_.addEventListener("dispose",g));let b=v.program;n.updateUBOMapping(_,b);let R=e.render.frame;r[_.id]!==R&&(f(_),r[_.id]=R)}function h(_){let v=u();_.__bindingPointIndex=v;let x=i.createBuffer(),b=_.__size,R=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,x),i.bufferData(i.UNIFORM_BUFFER,b,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,x),x}function u(){for(let _=0;_<a;_++)if(o.indexOf(_)===-1)return o.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(_){let v=s[_.id],x=_.uniforms,b=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let R=0,A=x.length;R<A;R++){let P=Array.isArray(x[R])?x[R]:[x[R]];for(let T=0,M=P.length;T<M;T++){let H=P[T];if(d(H,R,T,b)===!0){let B=H.__offset,F=Array.isArray(H.value)?H.value:[H.value],k=0;for(let V=0;V<F.length;V++){let W=F[V],le=E(W);typeof W=="number"||typeof W=="boolean"?(H.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,B+k,H.__data)):W.isMatrix3?(H.__data[0]=W.elements[0],H.__data[1]=W.elements[1],H.__data[2]=W.elements[2],H.__data[3]=0,H.__data[4]=W.elements[3],H.__data[5]=W.elements[4],H.__data[6]=W.elements[5],H.__data[7]=0,H.__data[8]=W.elements[6],H.__data[9]=W.elements[7],H.__data[10]=W.elements[8],H.__data[11]=0):(W.toArray(H.__data,k),k+=le.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,B,H.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(_,v,x,b){let R=_.value,A=v+"_"+x;if(b[A]===void 0)return typeof R=="number"||typeof R=="boolean"?b[A]=R:b[A]=R.clone(),!0;{let P=b[A];if(typeof R=="number"||typeof R=="boolean"){if(P!==R)return b[A]=R,!0}else if(P.equals(R)===!1)return P.copy(R),!0}return!1}function m(_){let v=_.uniforms,x=0,b=16;for(let A=0,P=v.length;A<P;A++){let T=Array.isArray(v[A])?v[A]:[v[A]];for(let M=0,H=T.length;M<H;M++){let B=T[M],F=Array.isArray(B.value)?B.value:[B.value];for(let k=0,V=F.length;k<V;k++){let W=F[k],le=E(W),O=x%b,he=O%le.boundary,re=O+he;x+=he,re!==0&&b-re<le.storage&&(x+=b-re),B.__data=new Float32Array(le.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=x,x+=le.storage}}}let R=x%b;return R>0&&(x+=b-R),_.__size=x,_.__cache={},this}function E(_){let v={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(v.boundary=4,v.storage=4):_.isVector2?(v.boundary=8,v.storage=8):_.isVector3||_.isColor?(v.boundary=16,v.storage=12):_.isVector4?(v.boundary=16,v.storage=16):_.isMatrix3?(v.boundary=48,v.storage=48):_.isMatrix4?(v.boundary=64,v.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),v}function g(_){let v=_.target;v.removeEventListener("dispose",g);let x=o.indexOf(v.__bindingPointIndex);o.splice(x,1),i.deleteBuffer(s[v.id]),delete s[v.id],delete r[v.id]}function p(){for(let _ in s)i.deleteBuffer(s[_]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var fa=class{constructor(e={}){let{canvas:t=uh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=o;let m=new Uint32Array(4),E=new Int32Array(4),g=null,p=null,_=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=On,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let x=this,b=!1;this._outputColorSpace=Lt;let R=0,A=0,P=null,T=-1,M=null,H=new lt,B=new lt,F=null,k=new _e(0),V=0,W=t.width,le=t.height,O=1,he=null,re=null,me=new lt(0,0,W,le),Re=new lt(0,0,W,le),Ae=!1,q=new Ki,ae=!1,K=!1,ie=new ct,Y=new ct,we=new I,X=new lt,de={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},be=!1;function Ve(){return P===null?O:1}let D=n;function _t(S,N){return t.getContext(S,N)}try{let S={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"175"}`),t.addEventListener("webglcontextlost",oe,!1),t.addEventListener("webglcontextrestored",Te,!1),t.addEventListener("webglcontextcreationerror",ye,!1),D===null){let N="webgl2";if(D=_t(N,S),D===null)throw _t(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let ke,Je,Fe,$e,Le,C,w,z,ee,ce,te,Ue,Q,se,Ie,ne,fe,Ce,Be,xe,qe,Oe,nt,L;function Ee(){ke=new qp(D),ke.init(),Oe=new T0(D,ke),Je=new Gp(D,ke,e,Oe),Fe=new v0(D,ke),Je.reverseDepthBuffer&&f&&Fe.buffers.depth.setReversed(!0),$e=new Kp(D),Le=new c0,C=new w0(D,ke,Fe,Le,Je,Oe,$e),w=new zp(x),z=new Yp(x),ee=new td(D),nt=new Np(D,ee),ce=new Zp(D,ee,$e,nt),te=new Qp(D,ce,ee,$e),Be=new $p(D,Je,C),ne=new kp(Le),Ue=new l0(x,w,z,ke,Je,nt,ne),Q=new A0(x,Le),se=new u0,Ie=new E0(ke),Ce=new Fp(x,w,z,Fe,te,d,l),fe=new M0(x,te,Je),L=new C0(D,$e,Je,Fe),xe=new Op(D,ke,$e),qe=new Jp(D,ke,$e),$e.programs=Ue.programs,x.capabilities=Je,x.extensions=ke,x.properties=Le,x.renderLists=se,x.shadowMap=fe,x.state=Fe,x.info=$e}Ee();let $=new ql(x,D);this.xr=$,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let S=ke.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=ke.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return O},this.setPixelRatio=function(S){S!==void 0&&(O=S,this.setSize(W,le,!1))},this.getSize=function(S){return S.set(W,le)},this.setSize=function(S,N,Z=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=S,le=N,t.width=Math.floor(S*O),t.height=Math.floor(N*O),Z===!0&&(t.style.width=S+"px",t.style.height=N+"px"),this.setViewport(0,0,S,N)},this.getDrawingBufferSize=function(S){return S.set(W*O,le*O).floor()},this.setDrawingBufferSize=function(S,N,Z){W=S,le=N,O=Z,t.width=Math.floor(S*Z),t.height=Math.floor(N*Z),this.setViewport(0,0,S,N)},this.getCurrentViewport=function(S){return S.copy(H)},this.getViewport=function(S){return S.copy(me)},this.setViewport=function(S,N,Z,J){S.isVector4?me.set(S.x,S.y,S.z,S.w):me.set(S,N,Z,J),Fe.viewport(H.copy(me).multiplyScalar(O).round())},this.getScissor=function(S){return S.copy(Re)},this.setScissor=function(S,N,Z,J){S.isVector4?Re.set(S.x,S.y,S.z,S.w):Re.set(S,N,Z,J),Fe.scissor(B.copy(Re).multiplyScalar(O).round())},this.getScissorTest=function(){return Ae},this.setScissorTest=function(S){Fe.setScissorTest(Ae=S)},this.setOpaqueSort=function(S){he=S},this.setTransparentSort=function(S){re=S},this.getClearColor=function(S){return S.copy(Ce.getClearColor())},this.setClearColor=function(){Ce.setClearColor(...arguments)},this.getClearAlpha=function(){return Ce.getClearAlpha()},this.setClearAlpha=function(){Ce.setClearAlpha(...arguments)},this.clear=function(S=!0,N=!0,Z=!0){let J=0;if(S){let G=!1;if(P!==null){let pe=P.texture.format;G=pe===Uo||pe===Lo||pe===Do}if(G){let pe=P.texture.type,Se=pe===Tn||pe===si||pe===is||pe===ss||pe===Io||pe===Ho,He=Ce.getClearColor(),De=Ce.getClearAlpha(),Xe=He.r,We=He.g,Ge=He.b;Se?(m[0]=Xe,m[1]=We,m[2]=Ge,m[3]=De,D.clearBufferuiv(D.COLOR,0,m)):(E[0]=Xe,E[1]=We,E[2]=Ge,E[3]=De,D.clearBufferiv(D.COLOR,0,E))}else J|=D.COLOR_BUFFER_BIT}N&&(J|=D.DEPTH_BUFFER_BIT),Z&&(J|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),D.clear(J)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",oe,!1),t.removeEventListener("webglcontextrestored",Te,!1),t.removeEventListener("webglcontextcreationerror",ye,!1),Ce.dispose(),se.dispose(),Ie.dispose(),Le.dispose(),w.dispose(),z.dispose(),te.dispose(),nt.dispose(),L.dispose(),Ue.dispose(),$.dispose(),$.removeEventListener("sessionstart",fs),$.removeEventListener("sessionend",zn),dn.stop()};function oe(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function Te(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let S=$e.autoReset,N=fe.enabled,Z=fe.autoUpdate,J=fe.needsUpdate,G=fe.type;Ee(),$e.autoReset=S,fe.enabled=N,fe.autoUpdate=Z,fe.needsUpdate=J,fe.type=G}function ye(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Ye(S){let N=S.target;N.removeEventListener("dispose",Ye),pt(N)}function pt(S){Et(S),Le.remove(S)}function Et(S){let N=Le.get(S).programs;N!==void 0&&(N.forEach(function(Z){Ue.releaseProgram(Z)}),S.isShaderMaterial&&Ue.releaseShaderCache(S))}this.renderBufferDirect=function(S,N,Z,J,G,pe){N===null&&(N=de);let Se=G.isMesh&&G.matrixWorld.determinant()<0,He=hu(S,N,Z,J,G);Fe.setMaterial(J,Se);let De=Z.index,Xe=1;if(J.wireframe===!0){if(De=ce.getWireframeAttribute(Z),De===void 0)return;Xe=2}let We=Z.drawRange,Ge=Z.attributes.position,st=We.start*Xe,ht=(We.start+We.count)*Xe;pe!==null&&(st=Math.max(st,pe.start*Xe),ht=Math.min(ht,(pe.start+pe.count)*Xe)),De!==null?(st=Math.max(st,0),ht=Math.min(ht,De.count)):Ge!=null&&(st=Math.max(st,0),ht=Math.min(ht,Ge.count));let Tt=ht-st;if(Tt<0||Tt===1/0)return;nt.setup(G,J,He,Z,De);let xt,at=xe;if(De!==null&&(xt=ee.get(De),at=qe,at.setIndex(xt)),G.isMesh)J.wireframe===!0?(Fe.setLineWidth(J.wireframeLinewidth*Ve()),at.setMode(D.LINES)):at.setMode(D.TRIANGLES);else if(G.isLine){let ze=J.linewidth;ze===void 0&&(ze=1),Fe.setLineWidth(ze*Ve()),G.isLineSegments?at.setMode(D.LINES):G.isLineLoop?at.setMode(D.LINE_LOOP):at.setMode(D.LINE_STRIP)}else G.isPoints?at.setMode(D.POINTS):G.isSprite&&at.setMode(D.TRIANGLES);if(G.isBatchedMesh)if(G._multiDrawInstances!==null)ar("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),at.renderMultiDrawInstances(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount,G._multiDrawInstances);else if(ke.get("WEBGL_multi_draw"))at.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{let ze=G._multiDrawStarts,Dt=G._multiDrawCounts,ut=G._multiDrawCount,pn=De?ee.get(De).bytesPerElement:1,Ii=Le.get(J).currentProgram.getUniforms();for(let Kt=0;Kt<ut;Kt++)Ii.setValue(D,"_gl_DrawID",Kt),at.render(ze[Kt]/pn,Dt[Kt])}else if(G.isInstancedMesh)at.renderInstances(st,Tt,G.count);else if(Z.isInstancedBufferGeometry){let ze=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,Dt=Math.min(Z.instanceCount,ze);at.renderInstances(st,Tt,Dt)}else at.render(st,Tt)};function ot(S,N,Z){S.transparent===!0&&S.side===ft&&S.forceSinglePass===!1?(S.side=Ft,S.needsUpdate=!0,Rt(S,N,Z),S.side=Bn,S.needsUpdate=!0,Rt(S,N,Z),S.side=ft):Rt(S,N,Z)}this.compile=function(S,N,Z=null){Z===null&&(Z=S),p=Ie.get(Z),p.init(N),v.push(p),Z.traverseVisible(function(G){G.isLight&&G.layers.test(N.layers)&&(p.pushLight(G),G.castShadow&&p.pushShadow(G))}),S!==Z&&S.traverseVisible(function(G){G.isLight&&G.layers.test(N.layers)&&(p.pushLight(G),G.castShadow&&p.pushShadow(G))}),p.setupLights();let J=new Set;return S.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;let pe=G.material;if(pe)if(Array.isArray(pe))for(let Se=0;Se<pe.length;Se++){let He=pe[Se];ot(He,Z,G),J.add(He)}else ot(pe,Z,G),J.add(pe)}),p=v.pop(),J},this.compileAsync=function(S,N,Z=null){let J=this.compile(S,N,Z);return new Promise(G=>{function pe(){if(J.forEach(function(Se){Le.get(Se).currentProgram.isReady()&&J.delete(Se)}),J.size===0){G(S);return}setTimeout(pe,10)}ke.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let Xt=null;function kt(S){Xt&&Xt(S)}function fs(){dn.stop()}function zn(){dn.start()}let dn=new Gh;dn.setAnimationLoop(kt),typeof self<"u"&&dn.setContext(self),this.setAnimationLoop=function(S){Xt=S,$.setAnimationLoop(S),S===null?dn.stop():dn.start()},$.addEventListener("sessionstart",fs),$.addEventListener("sessionend",zn),this.render=function(S,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(N),N=$.getCamera()),S.isScene===!0&&S.onBeforeRender(x,S,N,P),p=Ie.get(S,v.length),p.init(N),v.push(p),Y.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),q.setFromProjectionMatrix(Y),K=this.localClippingEnabled,ae=ne.init(this.clippingPlanes,K),g=se.get(S,_.length),g.init(),_.push(g),$.enabled===!0&&$.isPresenting===!0){let pe=x.xr.getDepthSensingMesh();pe!==null&&ai(pe,N,-1/0,x.sortObjects)}ai(S,N,0,x.sortObjects),g.finish(),x.sortObjects===!0&&g.sort(he,re),be=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,be&&Ce.addToRenderList(g,S),this.info.render.frame++,ae===!0&&ne.beginShadows();let Z=p.state.shadowsArray;fe.render(Z,S,N),ae===!0&&ne.endShadows(),this.info.autoReset===!0&&this.info.reset();let J=g.opaque,G=g.transmissive;if(p.setupLights(),N.isArrayCamera){let pe=N.cameras;if(G.length>0)for(let Se=0,He=pe.length;Se<He;Se++){let De=pe[Se];ps(J,G,S,De)}be&&Ce.render(S);for(let Se=0,He=pe.length;Se<He;Se++){let De=pe[Se];Cn(g,S,De,De.viewport)}}else G.length>0&&ps(J,G,S,N),be&&Ce.render(S),Cn(g,S,N);P!==null&&A===0&&(C.updateMultisampleRenderTarget(P),C.updateRenderTargetMipmap(P)),S.isScene===!0&&S.onAfterRender(x,S,N),nt.resetDefaultState(),T=-1,M=null,v.pop(),v.length>0?(p=v[v.length-1],ae===!0&&ne.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,_.pop(),_.length>0?g=_[_.length-1]:g=null};function ai(S,N,Z,J){if(S.visible===!1)return;if(S.layers.test(N.layers)){if(S.isGroup)Z=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(N);else if(S.isLight)p.pushLight(S),S.castShadow&&p.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||q.intersectsSprite(S)){J&&X.setFromMatrixPosition(S.matrixWorld).applyMatrix4(Y);let Se=te.update(S),He=S.material;He.visible&&g.push(S,Se,He,Z,X.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||q.intersectsObject(S))){let Se=te.update(S),He=S.material;if(J&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),X.copy(S.boundingSphere.center)):(Se.boundingSphere===null&&Se.computeBoundingSphere(),X.copy(Se.boundingSphere.center)),X.applyMatrix4(S.matrixWorld).applyMatrix4(Y)),Array.isArray(He)){let De=Se.groups;for(let Xe=0,We=De.length;Xe<We;Xe++){let Ge=De[Xe],st=He[Ge.materialIndex];st&&st.visible&&g.push(S,Se,st,Z,X.z,Ge)}}else He.visible&&g.push(S,Se,He,Z,X.z,null)}}let pe=S.children;for(let Se=0,He=pe.length;Se<He;Se++)ai(pe[Se],N,Z,J)}function Cn(S,N,Z,J){let G=S.opaque,pe=S.transmissive,Se=S.transparent;p.setupLightsView(Z),ae===!0&&ne.setGlobalState(x.clippingPlanes,Z),J&&Fe.viewport(H.copy(J)),G.length>0&&li(G,N,Z),pe.length>0&&li(pe,N,Z),Se.length>0&&li(Se,N,Z),Fe.buffers.depth.setTest(!0),Fe.buffers.depth.setMask(!0),Fe.buffers.color.setMask(!0),Fe.setPolygonOffset(!1)}function ps(S,N,Z,J){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[J.id]===void 0&&(p.state.transmissionRenderTarget[J.id]=new cn(1,1,{generateMipmaps:!0,type:ke.has("EXT_color_buffer_half_float")||ke.has("EXT_color_buffer_float")?ri:Tn,minFilter:ii,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:rt.workingColorSpace}));let pe=p.state.transmissionRenderTarget[J.id],Se=J.viewport||H;pe.setSize(Se.z*x.transmissionResolutionScale,Se.w*x.transmissionResolutionScale);let He=x.getRenderTarget();x.setRenderTarget(pe),x.getClearColor(k),V=x.getClearAlpha(),V<1&&x.setClearColor(16777215,.5),x.clear(),be&&Ce.render(Z);let De=x.toneMapping;x.toneMapping=On;let Xe=J.viewport;if(J.viewport!==void 0&&(J.viewport=void 0),p.setupLightsView(J),ae===!0&&ne.setGlobalState(x.clippingPlanes,J),li(S,Z,J),C.updateMultisampleRenderTarget(pe),C.updateRenderTargetMipmap(pe),ke.has("WEBGL_multisampled_render_to_texture")===!1){let We=!1;for(let Ge=0,st=N.length;Ge<st;Ge++){let ht=N[Ge],Tt=ht.object,xt=ht.geometry,at=ht.material,ze=ht.group;if(at.side===ft&&Tt.layers.test(J.layers)){let Dt=at.side;at.side=Ft,at.needsUpdate=!0,Ht(Tt,Z,J,xt,at,ze),at.side=Dt,at.needsUpdate=!0,We=!0}}We===!0&&(C.updateMultisampleRenderTarget(pe),C.updateRenderTargetMipmap(pe))}x.setRenderTarget(He),x.setClearColor(k,V),Xe!==void 0&&(J.viewport=Xe),x.toneMapping=De}function li(S,N,Z){let J=N.isScene===!0?N.overrideMaterial:null;for(let G=0,pe=S.length;G<pe;G++){let Se=S[G],He=Se.object,De=Se.geometry,Xe=Se.group,We=Se.material;We.allowOverride===!0&&J!==null&&(We=J),He.layers.test(Z.layers)&&Ht(He,N,Z,De,We,Xe)}}function Ht(S,N,Z,J,G,pe){S.onBeforeRender(x,N,Z,J,G,pe),S.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),G.onBeforeRender(x,N,Z,J,S,pe),G.transparent===!0&&G.side===ft&&G.forceSinglePass===!1?(G.side=Ft,G.needsUpdate=!0,x.renderBufferDirect(Z,N,J,G,S,pe),G.side=Bn,G.needsUpdate=!0,x.renderBufferDirect(Z,N,J,G,S,pe),G.side=ft):x.renderBufferDirect(Z,N,J,G,S,pe),S.onAfterRender(x,N,Z,J,G,pe)}function Rt(S,N,Z){N.isScene!==!0&&(N=de);let J=Le.get(S),G=p.state.lights,pe=p.state.shadowsArray,Se=G.state.version,He=Ue.getParameters(S,G.state,pe,N,Z),De=Ue.getProgramCacheKey(He),Xe=J.programs;J.environment=S.isMeshStandardMaterial?N.environment:null,J.fog=N.fog,J.envMap=(S.isMeshStandardMaterial?z:w).get(S.envMap||J.environment),J.envMapRotation=J.environment!==null&&S.envMap===null?N.environmentRotation:S.envMapRotation,Xe===void 0&&(S.addEventListener("dispose",Ye),Xe=new Map,J.programs=Xe);let We=Xe.get(De);if(We!==void 0){if(J.currentProgram===We&&J.lightsStateVersion===Se)return ms(S,He),We}else He.uniforms=Ue.getUniforms(S),S.onBeforeCompile(He,x),We=Ue.acquireProgram(He,De),Xe.set(De,We),J.uniforms=He.uniforms;let Ge=J.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Ge.clippingPlanes=ne.uniform),ms(S,He),J.needsLights=du(S),J.lightsStateVersion=Se,J.needsLights&&(Ge.ambientLightColor.value=G.state.ambient,Ge.lightProbe.value=G.state.probe,Ge.directionalLights.value=G.state.directional,Ge.directionalLightShadows.value=G.state.directionalShadow,Ge.spotLights.value=G.state.spot,Ge.spotLightShadows.value=G.state.spotShadow,Ge.rectAreaLights.value=G.state.rectArea,Ge.ltc_1.value=G.state.rectAreaLTC1,Ge.ltc_2.value=G.state.rectAreaLTC2,Ge.pointLights.value=G.state.point,Ge.pointLightShadows.value=G.state.pointShadow,Ge.hemisphereLights.value=G.state.hemi,Ge.directionalShadowMap.value=G.state.directionalShadowMap,Ge.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Ge.spotShadowMap.value=G.state.spotShadowMap,Ge.spotLightMatrix.value=G.state.spotLightMatrix,Ge.spotLightMap.value=G.state.spotLightMap,Ge.pointShadowMap.value=G.state.pointShadowMap,Ge.pointShadowMatrix.value=G.state.pointShadowMatrix),J.currentProgram=We,J.uniformsList=null,We}function fn(S){if(S.uniformsList===null){let N=S.currentProgram.getUniforms();S.uniformsList=ls.seqWithValue(N.seq,S.uniforms)}return S.uniformsList}function ms(S,N){let Z=Le.get(S);Z.outputColorSpace=N.outputColorSpace,Z.batching=N.batching,Z.batchingColor=N.batchingColor,Z.instancing=N.instancing,Z.instancingColor=N.instancingColor,Z.instancingMorph=N.instancingMorph,Z.skinning=N.skinning,Z.morphTargets=N.morphTargets,Z.morphNormals=N.morphNormals,Z.morphColors=N.morphColors,Z.morphTargetsCount=N.morphTargetsCount,Z.numClippingPlanes=N.numClippingPlanes,Z.numIntersection=N.numClipIntersection,Z.vertexAlphas=N.vertexAlphas,Z.vertexTangents=N.vertexTangents,Z.toneMapping=N.toneMapping}function hu(S,N,Z,J,G){N.isScene!==!0&&(N=de),C.resetTextureUnits();let pe=N.fog,Se=J.isMeshStandardMaterial?N.environment:null,He=P===null?x.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Ei,De=(J.isMeshStandardMaterial?z:w).get(J.envMap||Se),Xe=J.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,We=!!Z.attributes.tangent&&(!!J.normalMap||J.anisotropy>0),Ge=!!Z.morphAttributes.position,st=!!Z.morphAttributes.normal,ht=!!Z.morphAttributes.color,Tt=On;J.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(Tt=x.toneMapping);let xt=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,at=xt!==void 0?xt.length:0,ze=Le.get(J),Dt=p.state.lights;if(ae===!0&&(K===!0||S!==M)){let zt=S===M&&J.id===T;ne.setState(J,S,zt)}let ut=!1;J.version===ze.__version?(ze.needsLights&&ze.lightsStateVersion!==Dt.state.version||ze.outputColorSpace!==He||G.isBatchedMesh&&ze.batching===!1||!G.isBatchedMesh&&ze.batching===!0||G.isBatchedMesh&&ze.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&ze.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&ze.instancing===!1||!G.isInstancedMesh&&ze.instancing===!0||G.isSkinnedMesh&&ze.skinning===!1||!G.isSkinnedMesh&&ze.skinning===!0||G.isInstancedMesh&&ze.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&ze.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&ze.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&ze.instancingMorph===!1&&G.morphTexture!==null||ze.envMap!==De||J.fog===!0&&ze.fog!==pe||ze.numClippingPlanes!==void 0&&(ze.numClippingPlanes!==ne.numPlanes||ze.numIntersection!==ne.numIntersection)||ze.vertexAlphas!==Xe||ze.vertexTangents!==We||ze.morphTargets!==Ge||ze.morphNormals!==st||ze.morphColors!==ht||ze.toneMapping!==Tt||ze.morphTargetsCount!==at)&&(ut=!0):(ut=!0,ze.__version=J.version);let pn=ze.currentProgram;ut===!0&&(pn=Rt(J,N,G));let Ii=!1,Kt=!1,gs=!1,gt=pn.getUniforms(),sn=ze.uniforms;if(Fe.useProgram(pn.program)&&(Ii=!0,Kt=!0,gs=!0),J.id!==T&&(T=J.id,Kt=!0),Ii||M!==S){Fe.buffers.depth.getReversed()?(ie.copy(S.projectionMatrix),fh(ie),ph(ie),gt.setValue(D,"projectionMatrix",ie)):gt.setValue(D,"projectionMatrix",S.projectionMatrix),gt.setValue(D,"viewMatrix",S.matrixWorldInverse);let Yt=gt.map.cameraPosition;Yt!==void 0&&Yt.setValue(D,we.setFromMatrixPosition(S.matrixWorld)),Je.logarithmicDepthBuffer&&gt.setValue(D,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(J.isMeshPhongMaterial||J.isMeshToonMaterial||J.isMeshLambertMaterial||J.isMeshBasicMaterial||J.isMeshStandardMaterial||J.isShaderMaterial)&&gt.setValue(D,"isOrthographic",S.isOrthographicCamera===!0),M!==S&&(M=S,Kt=!0,gs=!0)}if(G.isSkinnedMesh){gt.setOptional(D,G,"bindMatrix"),gt.setOptional(D,G,"bindMatrixInverse");let zt=G.skeleton;zt&&(zt.boneTexture===null&&zt.computeBoneTexture(),gt.setValue(D,"boneTexture",zt.boneTexture,C))}G.isBatchedMesh&&(gt.setOptional(D,G,"batchingTexture"),gt.setValue(D,"batchingTexture",G._matricesTexture,C),gt.setOptional(D,G,"batchingIdTexture"),gt.setValue(D,"batchingIdTexture",G._indirectTexture,C),gt.setOptional(D,G,"batchingColorTexture"),G._colorsTexture!==null&&gt.setValue(D,"batchingColorTexture",G._colorsTexture,C));let rn=Z.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&Be.update(G,Z,pn),(Kt||ze.receiveShadow!==G.receiveShadow)&&(ze.receiveShadow=G.receiveShadow,gt.setValue(D,"receiveShadow",G.receiveShadow)),J.isMeshGouraudMaterial&&J.envMap!==null&&(sn.envMap.value=De,sn.flipEnvMap.value=De.isCubeTexture&&De.isRenderTargetTexture===!1?-1:1),J.isMeshStandardMaterial&&J.envMap===null&&N.environment!==null&&(sn.envMapIntensity.value=N.environmentIntensity),Kt&&(gt.setValue(D,"toneMappingExposure",x.toneMappingExposure),ze.needsLights&&uu(sn,gs),pe&&J.fog===!0&&Q.refreshFogUniforms(sn,pe),Q.refreshMaterialUniforms(sn,J,O,le,p.state.transmissionRenderTarget[S.id]),ls.upload(D,fn(ze),sn,C)),J.isShaderMaterial&&J.uniformsNeedUpdate===!0&&(ls.upload(D,fn(ze),sn,C),J.uniformsNeedUpdate=!1),J.isSpriteMaterial&&gt.setValue(D,"center",G.center),gt.setValue(D,"modelViewMatrix",G.modelViewMatrix),gt.setValue(D,"normalMatrix",G.normalMatrix),gt.setValue(D,"modelMatrix",G.matrixWorld),J.isShaderMaterial||J.isRawShaderMaterial){let zt=J.uniformsGroups;for(let Yt=0,va=zt.length;Yt<va;Yt++){let ci=zt[Yt];L.update(ci,pn),L.bind(ci,pn)}}return pn}function uu(S,N){S.ambientLightColor.needsUpdate=N,S.lightProbe.needsUpdate=N,S.directionalLights.needsUpdate=N,S.directionalLightShadows.needsUpdate=N,S.pointLights.needsUpdate=N,S.pointLightShadows.needsUpdate=N,S.spotLights.needsUpdate=N,S.spotLightShadows.needsUpdate=N,S.rectAreaLights.needsUpdate=N,S.hemisphereLights.needsUpdate=N}function du(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(S,N,Z){let J=Le.get(S);J.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,J.__autoAllocateDepthBuffer===!1&&(J.__useRenderToTexture=!1),Le.get(S.texture).__webglTexture=N,Le.get(S.depthTexture).__webglTexture=J.__autoAllocateDepthBuffer?void 0:Z,J.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,N){let Z=Le.get(S);Z.__webglFramebuffer=N,Z.__useDefaultFramebuffer=N===void 0};let fu=D.createFramebuffer();this.setRenderTarget=function(S,N=0,Z=0){P=S,R=N,A=Z;let J=!0,G=null,pe=!1,Se=!1;if(S){let De=Le.get(S);if(De.__useDefaultFramebuffer!==void 0)Fe.bindFramebuffer(D.FRAMEBUFFER,null),J=!1;else if(De.__webglFramebuffer===void 0)C.setupRenderTarget(S);else if(De.__hasExternalTextures)C.rebindTextures(S,Le.get(S.texture).__webglTexture,Le.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Ge=S.depthTexture;if(De.__boundDepthTexture!==Ge){if(Ge!==null&&Le.has(Ge)&&(S.width!==Ge.image.width||S.height!==Ge.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(S)}}let Xe=S.texture;(Xe.isData3DTexture||Xe.isDataArrayTexture||Xe.isCompressedArrayTexture)&&(Se=!0);let We=Le.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(We[N])?G=We[N][Z]:G=We[N],pe=!0):S.samples>0&&C.useMultisampledRTT(S)===!1?G=Le.get(S).__webglMultisampledFramebuffer:Array.isArray(We)?G=We[Z]:G=We,H.copy(S.viewport),B.copy(S.scissor),F=S.scissorTest}else H.copy(me).multiplyScalar(O).floor(),B.copy(Re).multiplyScalar(O).floor(),F=Ae;if(Z!==0&&(G=fu),Fe.bindFramebuffer(D.FRAMEBUFFER,G)&&J&&Fe.drawBuffers(S,G),Fe.viewport(H),Fe.scissor(B),Fe.setScissorTest(F),pe){let De=Le.get(S.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+N,De.__webglTexture,Z)}else if(Se){let De=Le.get(S.texture),Xe=N;D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,De.__webglTexture,Z,Xe)}else if(S!==null&&Z!==0){let De=Le.get(S.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,De.__webglTexture,Z)}T=-1},this.readRenderTargetPixels=function(S,N,Z,J,G,pe,Se){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let He=Le.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Se!==void 0&&(He=He[Se]),He){Fe.bindFramebuffer(D.FRAMEBUFFER,He);try{let De=S.texture,Xe=De.format,We=De.type;if(!Je.textureFormatReadable(Xe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Je.textureTypeReadable(We)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=S.width-J&&Z>=0&&Z<=S.height-G&&D.readPixels(N,Z,J,G,Oe.convert(Xe),Oe.convert(We),pe)}finally{let De=P!==null?Le.get(P).__webglFramebuffer:null;Fe.bindFramebuffer(D.FRAMEBUFFER,De)}}},this.readRenderTargetPixelsAsync=async function(S,N,Z,J,G,pe,Se){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let He=Le.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Se!==void 0&&(He=He[Se]),He)if(N>=0&&N<=S.width-J&&Z>=0&&Z<=S.height-G){Fe.bindFramebuffer(D.FRAMEBUFFER,He);let De=S.texture,Xe=De.format,We=De.type;if(!Je.textureFormatReadable(Xe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Je.textureTypeReadable(We))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ge=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Ge),D.bufferData(D.PIXEL_PACK_BUFFER,pe.byteLength,D.STREAM_READ),D.readPixels(N,Z,J,G,Oe.convert(Xe),Oe.convert(We),0);let st=P!==null?Le.get(P).__webglFramebuffer:null;Fe.bindFramebuffer(D.FRAMEBUFFER,st);let ht=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await dh(D,ht,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Ge),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,pe),D.deleteBuffer(Ge),D.deleteSync(ht),pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,N=null,Z=0){let J=Math.pow(2,-Z),G=Math.floor(S.image.width*J),pe=Math.floor(S.image.height*J),Se=N!==null?N.x:0,He=N!==null?N.y:0;C.setTexture2D(S,0),D.copyTexSubImage2D(D.TEXTURE_2D,Z,0,0,Se,He,G,pe),Fe.unbindTexture()};let pu=D.createFramebuffer(),mu=D.createFramebuffer();this.copyTextureToTexture=function(S,N,Z=null,J=null,G=0,pe=null){pe===null&&(G!==0?(ar("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),pe=G,G=0):pe=0);let Se,He,De,Xe,We,Ge,st,ht,Tt,xt=S.isCompressedTexture?S.mipmaps[pe]:S.image;if(Z!==null)Se=Z.max.x-Z.min.x,He=Z.max.y-Z.min.y,De=Z.isBox3?Z.max.z-Z.min.z:1,Xe=Z.min.x,We=Z.min.y,Ge=Z.isBox3?Z.min.z:0;else{let rn=Math.pow(2,-G);Se=Math.floor(xt.width*rn),He=Math.floor(xt.height*rn),S.isDataArrayTexture?De=xt.depth:S.isData3DTexture?De=Math.floor(xt.depth*rn):De=1,Xe=0,We=0,Ge=0}J!==null?(st=J.x,ht=J.y,Tt=J.z):(st=0,ht=0,Tt=0);let at=Oe.convert(N.format),ze=Oe.convert(N.type),Dt;N.isData3DTexture?(C.setTexture3D(N,0),Dt=D.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(C.setTexture2DArray(N,0),Dt=D.TEXTURE_2D_ARRAY):(C.setTexture2D(N,0),Dt=D.TEXTURE_2D),D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,N.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,N.unpackAlignment);let ut=D.getParameter(D.UNPACK_ROW_LENGTH),pn=D.getParameter(D.UNPACK_IMAGE_HEIGHT),Ii=D.getParameter(D.UNPACK_SKIP_PIXELS),Kt=D.getParameter(D.UNPACK_SKIP_ROWS),gs=D.getParameter(D.UNPACK_SKIP_IMAGES);D.pixelStorei(D.UNPACK_ROW_LENGTH,xt.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,xt.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Xe),D.pixelStorei(D.UNPACK_SKIP_ROWS,We),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Ge);let gt=S.isDataArrayTexture||S.isData3DTexture,sn=N.isDataArrayTexture||N.isData3DTexture;if(S.isDepthTexture){let rn=Le.get(S),zt=Le.get(N),Yt=Le.get(rn.__renderTarget),va=Le.get(zt.__renderTarget);Fe.bindFramebuffer(D.READ_FRAMEBUFFER,Yt.__webglFramebuffer),Fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,va.__webglFramebuffer);for(let ci=0;ci<De;ci++)gt&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Le.get(S).__webglTexture,G,Ge+ci),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Le.get(N).__webglTexture,pe,Tt+ci)),D.blitFramebuffer(Xe,We,Se,He,st,ht,Se,He,D.DEPTH_BUFFER_BIT,D.NEAREST);Fe.bindFramebuffer(D.READ_FRAMEBUFFER,null),Fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(G!==0||S.isRenderTargetTexture||Le.has(S)){let rn=Le.get(S),zt=Le.get(N);Fe.bindFramebuffer(D.READ_FRAMEBUFFER,pu),Fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,mu);for(let Yt=0;Yt<De;Yt++)gt?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,rn.__webglTexture,G,Ge+Yt):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,rn.__webglTexture,G),sn?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,zt.__webglTexture,pe,Tt+Yt):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,zt.__webglTexture,pe),G!==0?D.blitFramebuffer(Xe,We,Se,He,st,ht,Se,He,D.COLOR_BUFFER_BIT,D.NEAREST):sn?D.copyTexSubImage3D(Dt,pe,st,ht,Tt+Yt,Xe,We,Se,He):D.copyTexSubImage2D(Dt,pe,st,ht,Xe,We,Se,He);Fe.bindFramebuffer(D.READ_FRAMEBUFFER,null),Fe.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else sn?S.isDataTexture||S.isData3DTexture?D.texSubImage3D(Dt,pe,st,ht,Tt,Se,He,De,at,ze,xt.data):N.isCompressedArrayTexture?D.compressedTexSubImage3D(Dt,pe,st,ht,Tt,Se,He,De,at,xt.data):D.texSubImage3D(Dt,pe,st,ht,Tt,Se,He,De,at,ze,xt):S.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,pe,st,ht,Se,He,at,ze,xt.data):S.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,pe,st,ht,xt.width,xt.height,at,xt.data):D.texSubImage2D(D.TEXTURE_2D,pe,st,ht,Se,He,at,ze,xt);D.pixelStorei(D.UNPACK_ROW_LENGTH,ut),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,pn),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Ii),D.pixelStorei(D.UNPACK_SKIP_ROWS,Kt),D.pixelStorei(D.UNPACK_SKIP_IMAGES,gs),pe===0&&N.generateMipmaps&&D.generateMipmap(Dt),Fe.unbindTexture()},this.copyTextureToTexture3D=function(S,N,Z=null,J=null,G=0){return ar('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(S,N,Z,J,G)},this.initRenderTarget=function(S){Le.get(S).__webglFramebuffer===void 0&&C.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?C.setTextureCube(S,0):S.isData3DTexture?C.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?C.setTexture2DArray(S,0):C.setTexture2D(S,0),Fe.unbindTexture()},this.resetState=function(){R=0,A=0,P=null,Fe.reset(),nt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Mn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=rt._getDrawingBufferColorSpace(e),t.unpackColorSpace=rt._getUnpackColorSpace()}};var Xh={punching:{rate:2.2,impact:.35},kicking:{rate:1.6,impact:.4}};function Jl(i,e){let{rate:t,impact:n}=Xh[e],s=(i*t%1+1)%1,r=s<n?1-Math.pow(1-s/n,3):Math.max(0,1-(s-n)/(1-n))**2,o=s>=n?Math.exp(-(s-n)*9):0;return{extend:r,recoil:o}}function Kl(i,e,t){let n=new ue;n.position.set(0,-.24,.05),i.add(n);let s=new ue;s.position.set(0,-.24,.05),e.add(s);let r=new ue;r.visible=!1;let o=new U({color:16317180,roughness:.65,side:ft}),a=new U({color:14427686,roughness:.55}),l=new y(new Me(.18,.34,.44,18,1,!1,-Math.PI*.65,Math.PI*1.3),o);l.position.set(0,.36,.03),l.castShadow=!0,r.add(l);let c=new y(new et(.165,.025,8,20),a);c.rotation.x=Math.PI/2+.14,c.position.set(0,.57,.02),r.add(c),t.add(r);let h=new ue;h.visible=!1;let u=new U({color:16708551,roughness:.88}),f=new U({color:165063,roughness:.72}),d=new y(new et(.142,.022,8,20),u);d.rotation.x=Math.PI/2+.22,d.position.set(0,.505,-.01),h.add(d);let m=new y(new Me(.165,.255,.34,14,1,!1,-Math.PI*.45,Math.PI*.9),u);m.position.set(0,.35,.03),m.rotation.y=Math.PI*.02,h.add(m);for(let Ht of[-.095,.095]){let Rt=new y(new j(.072,.19,.014),u);Rt.position.set(Ht,.34,.145),Rt.rotation.x=-.16,Rt.rotation.z=Ht<0?.18:-.18,h.add(Rt);let fn=new y(new j(.074,.024,.016),f);fn.position.set(Ht*1.06,.245,.16),fn.rotation.x=-.16,fn.rotation.z=Ht<0?.18:-.18,h.add(fn)}t.add(h);let E=new U({color:14870768,metalness:.9,roughness:.14}),g=new U({color:7877903,roughness:.52}),p=new U({color:16096779,metalness:.85,roughness:.22}),_=new U({color:14427686,roughness:.38}),v=new U({color:959977,roughness:.35}),x=new U({color:1976635,roughness:.45}),b={},R=new U({color:16317180,metalness:.72,roughness:.16,emissive:3359061,emissiveIntensity:.35}),A=new ue,P=new ue,T=new y(new j(.042,.32,.016),R);T.position.set(0,.16,0),P.add(T);let M=new y(new et(.048,.014,8,16),_);M.position.set(-.028,-.06,0),P.add(M),A.add(P);let H=new ue,B=new y(new j(.042,.32,.016),R);B.position.set(0,.16,.008),H.add(B);let F=new y(new et(.048,.014,8,16),_);F.position.set(.028,-.06,.008),H.add(F),A.add(H);let k=new y(new Me(.018,.018,.032,10),p);k.rotation.x=Math.PI/2,k.position.set(0,.02,.004),A.add(k),A.rotation.x=Math.PI*1.16,A.visible=!1,n.add(A),b.scissors=A;let V=()=>{let Ht=new ue,Rt=new y(new j(.028,.22,.016),v);Rt.position.set(0,.1,0),Ht.add(Rt);for(let fn=-3;fn<=3;fn++){let ms=new y(new j(.042,.012,.012),v);ms.position.set(.024,.1+fn*.026,0),Ht.add(ms)}return Ht},W=V();W.rotation.x=Math.PI*1.12,W.visible=!1,n.add(W),b.comb=W;let le=V();le.rotation.x=Math.PI*1.12,le.visible=!1,s.add(le);let O=new ue,he=new y(new et(.055,.014,8,16),p);he.position.y=.03,O.add(he);let re=new y(new Me(.014,.014,.22,8),p);re.position.y=.16,O.add(re);let me=new y(new j(.055,.045,.016),p);me.position.set(.032,.24,0),O.add(me),O.rotation.x=Math.PI*.35,O.visible=!1,n.add(O),b.key=O;let Re=new ue,Ae=new y(new j(.11,.2,.018),x);Ae.position.set(0,.08,.02),Re.add(Ae);let q=new Ne({color:3718648}),ae=new y(new tt(.09,.16),q);ae.position.set(0,.08,.03),Re.add(ae),Re.visible=!1,n.add(Re),b.phone=Re;let K=new ue,ie=new y(new Me(.018,.02,.28,10),g);ie.position.y=.14,K.add(ie);let Y=new y(new Me(.052,.052,.16,12),g);Y.rotation.z=Math.PI/2,Y.position.y=.26,K.add(Y);let we=new y(new Me(.055,.055,.03,12),p);we.rotation.z=Math.PI/2,we.position.y=.26,K.add(we),K.rotation.x=Math.PI*.42,K.visible=!1,n.add(K),b.gavel=K;let X=new ue,de=new y(new Me(.02,.016,.22,10),x);de.position.y=.11,X.add(de);let be=new y(new Pe(.048,12,10),E);be.position.y=.23,X.add(be),X.rotation.x=Math.PI*.25,X.visible=!1,n.add(X),b.mic=X;let Ve=new ue,D=new y(new Me(.068,.048,.11,14),new U({color:14251782,roughness:.72}));D.position.y=.06,Ve.add(D);let _t=new y(new It(.058,12),new U({color:11817737,roughness:.25}));_t.rotation.x=-Math.PI/2,_t.position.y=.112,Ve.add(_t),Ve.visible=!1,n.add(Ve),b.teacup=Ve;let ke=new ue,Je=new y(new Me(.014,.014,.36,8),E);Je.position.y=.18,ke.add(Je);let Fe=new y(new Pe(.065,12,8,0,Math.PI*2,0,Math.PI*.55),E);Fe.rotation.x=Math.PI,Fe.position.set(0,.36,.03),ke.add(Fe),ke.rotation.x=Math.PI*.35,ke.visible=!1,n.add(ke),b.ladle=ke;let $e=new ue,Le=new y(new et(.08,.012,8,16,Math.PI*1.4),x);Le.position.y=.12,$e.add(Le);let C=new y(new Me(.045,.045,.025,12),E);C.rotation.x=Math.PI/2,C.position.set(0,.22,.03),$e.add(C),$e.visible=!1,n.add($e),b.stethoscope=$e;let w=new ue,z=new y(new Me(.038,.038,.22,12),v);z.position.y=.14,w.add(z);let ee=new y(new it(.012,.12,8),E);ee.position.y=.31,w.add(ee),w.rotation.x=Math.PI*.45,w.visible=!1,n.add(w),b.syringe=w;let ce=new ue,te=new y(new it(.085,.055,14),p);te.rotation.x=Math.PI,te.position.y=.04,ce.add(te);let Ue=new y(new it(.025,.08,10),new Ne({color:16707722}));Ue.position.y=.1,ce.add(Ue),ce.visible=!1,n.add(ce),b.diya=ce;let Q=new ue,se=new y(new Me(.018,.018,.46,10),p);se.rotation.z=Math.PI/2,se.position.set(.14,.04,.04),Q.add(se),Q.visible=!1,n.add(Q),b.flute=Q;let Ie=new ue,ne=new y(new j(.18,.24,.045),_);ne.position.set(0,.1,.04),Ie.add(ne);let fe=new y(new j(.16,.22,.036),new U({color:16710888}));fe.position.set(.01,.1,.04),Ie.add(fe),Ie.visible=!1,n.add(Ie),b.book=Ie;let Ce=new ue,Be=new y(new Me(.018,.022,.56,10),g);Be.position.y=.28,Ce.add(Be),Ce.rotation.x=Math.PI*.25,Ce.visible=!1,n.add(Ce),b.baton=Ce;let xe=new ue,qe=new y(new Me(.012,.012,.11,8),new U({color:16777215}));qe.position.y=.06,xe.add(qe),xe.rotation.x=Math.PI*.35,xe.visible=!1,n.add(xe),b.chalk=xe;let Oe=new ue,nt=new y(new Me(.016,.016,.92,10),p);nt.position.y=.36,Oe.add(nt);let L=new y(new it(.032,.16,8),p);L.position.y=.88,Oe.add(L);for(let Ht of[-1,1]){let Rt=new y(new it(.022,.14,8),p);Rt.position.set(Ht*.065,.82,0),Rt.rotation.z=-Ht*.25,Oe.add(Rt)}Oe.visible=!1,n.add(Oe),b.trishul=Oe;let Ee=new ue,$=new y(new et(.32,.02,8,22,Math.PI),p);$.rotation.z=-Math.PI/2,$.position.set(0,.18,.05),Ee.add($),Ee.visible=!1,n.add(Ee),b.bow=Ee;let oe=new ue,Te=new y(new j(.14,.08,.025),new U({color:2278750,roughness:.45}));Te.position.set(0,.05,.04),oe.add(Te),oe.visible=!1,n.add(oe),b.money=oe;let ye=new ue,Ye=new y(new Me(.016,.016,.65,8),g);Ye.position.y=.22,ye.add(Ye);let pt=new y(new it(.09,.22,10),new U({color:16638023,roughness:.9}));pt.position.y=-.14,ye.add(pt),ye.visible=!1,n.add(ye),b.broom=ye;let Et=new ue,ot=new y(new Me(.014,.014,.55,8),x);ot.position.y=.26,Et.add(ot);let Xt=new y(new it(.32,.14,14),_);Xt.position.y=.52,Et.add(Xt),Et.visible=!1,n.add(Et),b.umbrella=Et;let kt=new ue,fs=new y(new Me(.12,.09,.022,14),E);fs.position.y=.02,kt.add(fs);for(let Ht of[-.04,.04,0]){let Rt=new y(new Pe(.036,10,8),new U({color:16096779,roughness:.45}));Rt.position.set(Ht,.055,Ht===0?.035:-.02),kt.add(Rt)}kt.visible=!1,n.add(kt),b.sweetplate=kt;let zn=new ue,dn=new y(new j(.11,.22,.02),u);dn.position.set(.01,-.15,.015),dn.rotation.x=.04,zn.add(dn);let ai=new y(new j(.114,.035,.023),f);ai.position.set(.01,-.23,.018),ai.rotation.x=.04,zn.add(ai),zn.visible=!1,n.add(zn),b.towel=zn;let Cn=new ue,ps=new y(new Me(.055,.068,.18,12),v);ps.position.y=.09,Cn.add(ps);let li=new y(new j(.09,.04,.035),R);return li.position.set(.025,.2,0),Cn.add(li),Cn.rotation.x=Math.PI*.42,Cn.visible=!1,n.add(Cn),b.sprayBottle=Cn,{rightGroup:n,leftGroup:s,capeGroup:r,towelNeckGroup:h,rightMeshes:b,leftComb:le,scissorUpper:P,scissorLower:H,phoneScreen:q,diyaFlame:Ue}}function jh(i){let e=t=>t?{x:-t.x,y:t.y,z:t.z}:null;return{lShoulder:e(i.rShoulder),rShoulder:e(i.lShoulder),lElbow:e(i.rElbow),rElbow:e(i.lElbow),lWrist:e(i.rWrist),rWrist:e(i.lWrist),lHip:e(i.rHip),rHip:e(i.lHip),lKnee:e(i.rKnee),rKnee:e(i.lKnee),lAnkle:e(i.rAnkle),rAnkle:e(i.lAnkle),nose:e(i.nose),lEar:e(i.rEar),rEar:e(i.lEar)}}var eu=["devi","mata","durga","lakshmi","laxmi","saraswati","parvati","sita","radha","\u0926\u0947\u0935\u0940","\u092E\u093E\u0924\u093E","\u0926\u0941\u0930\u094D\u0917\u093E","\u0932\u0915\u094D\u0937\u094D\u092E\u0940","\u0938\u0930\u0938\u094D\u0935\u0924\u0940","\u092A\u093E\u0930\u094D\u0935\u0924\u0940","\u0938\u0940\u0924\u093E","\u0930\u093E\u0927\u093E"];function P0(i,e){return e==="Warrior"||e==="KingCrown"||e==="BrainrotLog"||e==="CupDancer"||e==="CartoonTank"||e==="ComicBobble"?!0:i==="ComedyStage"||i==="ChaiStall"||i==="SkyGauntlet"||i==="TankArena"||i==="DoorwaySet"||i==="Bedroom"||i==="LivingRoom"||i==="Kitchen"||i==="SweetShop"||i==="BarberShop"||i==="Courtroom"||i==="DoctorClinic"||i==="Classroom"||i==="QuizStudio"||i==="NeighborhoodGate"||i==="Battlefield"||i==="PalaceCourt"||i==="ModernCity"||i==="Village"||i==="Archive"}function Ql(i){return i==="ComedyStage"||i==="ChaiStall"||i==="SkyGauntlet"||i==="TankArena"||i==="DoorwaySet"||i==="Bedroom"||i==="LivingRoom"||i==="Kitchen"||i==="SweetShop"||i==="BarberShop"||i==="Courtroom"||i==="DoctorClinic"||i==="Classroom"||i==="QuizStudio"||i==="NeighborhoodGate"||i==="ModernCity"}function I0(i,e,t){let n=2907274,s=new _e(t).getHex(),r=15250056,o=!1;switch(i){case"KingCrown":n=10036282,s=16105016;break;case"SageRishi":n=14247960,s=16638082;break;case"Divine":n=2974425,s=16767040,r=10405119,o=!0;break;case"ChildDevotee":n=15376156,s=14239782;break;case"NobleWoman":n=12725078,s=16303174;break;case"Warrior":n=7557683,s=12962774;break;case"BrainrotLog":n=10115880,s=16436245,r=12088894;break;case"CupDancer":n=16317180,s=16020150,r=16777215;break;case"CartoonTank":n=5078079,s=16436245,r=3560212;break;case"ComicBobble":n=16347926,s=3718648,r=15843995;break;default:n=3104660;break}return e&&/^#?[0-9a-fA-F]{6}$/.test(e.trim())&&(n=new _e(e.startsWith("#")?e:`#${e}`).getHex()),{robe:n,sash:s,skin:r,isDivine:o}}function H0(i,e,t,n){let s=[new ge(i*.68,-.05),new ge(i,.02),new ge(i*.98,n*.22),new ge(e,n*.48),new ge(t,n*.82),new ge(t*.62,n*.98),new ge(.01,n)];return new ei(s,24)}function D0(i){let e=new ue,t=new U({color:3876421,roughness:.45,metalness:.3}),n=new y(new Me(.42,.48,.08,24),t);n.position.y=.04,n.receiveShadow=!0,n.castShadow=!0,e.add(n);let s=new U({color:16020150,emissive:i,emissiveIntensity:.22,roughness:.35});for(let a=0;a<12;a++){let l=a/12*Math.PI*2,c=new y(new Pe(.11,10,8),s);c.scale.set(1.2,.45,2),c.position.set(Math.cos(l)*.36,.08,Math.sin(l)*.36),c.rotation.y=-l+Math.PI*.5,c.rotation.x=.22,e.add(c)}let r=new Ne({color:i,transparent:!0,opacity:.35,side:ft,depthWrite:!1}),o=new y(new _n(.32,.52,32),r);return o.rotation.x=-Math.PI/2,o.position.y=.015,e.add(o),{group:e,glowMesh:o}}function L0(i,e,t,n,s,r,o){let a=new U({color:1972516,roughness:.72}),l=new U({color:14277862,roughness:.6}),c=new U({color:16103470,metalness:.85,roughness:.22}),h=t.toLowerCase(),u=e==="SageRishi"&&(h.includes("narad")||h.includes("\u0928\u093E\u0930\u0926")),f=e==="NobleWoman"&&eu.some(m=>h.includes(m));if(e==="KingCrown"&&(o==="turban"||n==="PalaceCourt"||/sartaaj|sufi|shayar|prince|dulha|singer/i.test(h))&&!/maharaj|raja|samrat|emperor/i.test(h)){let m=new y(new Pe(s*1.02,20,14,0,Math.PI*2,0,Math.PI*.42),a);m.rotation.x=-.32,i.add(m);let E=new ue,g=n==="PalaceCourt"?16117734:r??10036282,p=new U({color:g,roughness:.62}),_=new y(new Pe(s*1.08,22,16,0,Math.PI*2,0,Math.PI*.52),p);_.scale.set(1.04,.78,1.06),_.position.set(0,s*.48,-s*.06),_.castShadow=!0,E.add(_);for(let A=0;A<3;A++){let P=new y(new et(s*(.94+(A===1?.04:0)),s*.105,10,24),A===1?p:new U({color:g,roughness:.55}));P.rotation.x=Math.PI/2-.28+A*.1,P.rotation.z=(A-1)*.14,P.position.set(0,s*(.6+A*.14),-s*.02),P.castShadow=!0,E.add(P)}let v=new y(new hn(s*.15,0),c);v.position.set(s*.16,s*1.02,s*.74),E.add(v);let x=new y(new it(s*.12,s*.44,8),new U({color:16708551,emissive:14251782,emissiveIntensity:.25,roughness:.45}));x.position.set(s*.19,s*1.26,s*.64),x.rotation.z=-.2,x.rotation.x=-.16,E.add(x),i.add(E);let b=new y(new Pe(s*.46,14,10),a);b.scale.set(1.22,.65,.78),b.position.set(0,-s*.72,s*.54),i.add(b);let R=new y(new wt(s*.036,s*.28,4,8),a);R.rotation.z=Math.PI/2,R.position.set(0,-s*.2,s*.94),i.add(R);return}if(e==="KingCrown"||e==="Divine"||e==="NobleWoman"&&(f||n!=="PalaceCourt"&&(h.includes("rani")||h.includes("\u0930\u093E\u0928\u0940")))){let m=new y(new Pe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);m.scale.set(1.01,1.11,.99),m.rotation.x=-.34,i.add(m);let E=new ue;E.position.y=s*.88;let g=new y(new Me(s*.82,s*.86,s*.35,20),c);g.castShadow=!0,E.add(g);let p=e==="Divine"?3:2;for(let x=0;x<p;x++){let b=new y(new it(s*(.65-x*.16),s*(.55-x*.08),16),c);b.position.y=s*(.32+x*.32),b.castShadow=!0,E.add(b)}let _=new U({color:e==="Divine"?2282478:16007006,emissive:e==="Divine"?959977:14753096,emissiveIntensity:.65,metalness:.2,roughness:.1}),v=new y(new hn(s*.15,0),_);if(v.position.set(0,s*.08,s*.82),E.add(v),i.add(E),e==="NobleWoman"){let x=new y(new wt(s*.22,s*1.4,8,12),a);x.position.set(0,-s*.85,-s*.82),x.rotation.x=.24,i.add(x)}return}if(e==="SageRishi"){let m=u?new U({color:2892339,roughness:.7}):l,E=new y(new Pe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),m);E.scale.set(1.01,1.11,.99),E.rotation.x=-.36,i.add(E);let g=new y(new Pe(s*.42,14,12),m);if(g.scale.set(.9,1.15,.9),g.position.set(0,s*1.24,-s*.16),g.castShadow=!0,i.add(g),!u){let p=new y(new it(s*.52,s*.95,14),m);p.rotation.x=Math.PI,p.position.set(0,-s*.88,s*.48),i.add(p)}return}if(e==="ChildDevotee"){let m=new y(new Pe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),a);m.scale.set(1.01,1.11,.99),m.rotation.x=-.36,i.add(m);let E=new y(new Pe(s*.22,10,8),a);if(E.scale.set(1.3,.65,.85),E.position.set(-s*.12,s*.78,s*.68),i.add(E),!Ql(n)){let g=new y(new et(s*.9,s*.065,10,24),c);g.rotation.x=Math.PI/2-.34,g.position.set(0,s*.55,s*.06),i.add(g);let p=new y(new hn(s*.13,0),new U({color:1096065,emissive:366185,emissiveIntensity:.6}));p.position.set(0,s*.62,s*.92),i.add(p)}return}if(e==="NobleWoman"){let m=new y(new Pe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);m.scale.set(1.01,1.11,.99),m.rotation.x=-.34,i.add(m);let E=new y(new wt(s*.24,s*1.45,8,12),a);E.position.set(0,-s*.85,-s*.85),E.rotation.x=.25,i.add(E);let g=new y(new Pe(s*.1,10,8),c);g.position.set(0,s*.5,s*.94),i.add(g);return}if(e==="Warrior"){let m=new U({color:10594485,metalness:.78,roughness:.28}),E=new y(new Pe(s*1.05,20,14,0,Math.PI*2,0,Math.PI*.47),m);E.scale.set(1.02,1.12,1),E.rotation.x=-.32,i.add(E);let g=new y(new et(s*.7,s*.12,8,16,Math.PI),new U({color:14427686,roughness:.6}));g.rotation.y=Math.PI/2,g.position.y=s*.86,i.add(g);return}if(e==="ComicBobble"||Ql(n)){let m=new ue,E=new y(new Pe(s*1.06,20,14,0,Math.PI*2,0,Math.PI*.5),a);if(E.scale.set(1.04,1.15,1.05),E.position.set(0,s*.06,-s*.02),E.rotation.x=-.15,m.add(E),e==="ComicBobble"){for(let R of[-.35,0,.35]){let A=new y(new it(s*.15,s*.4,8),a);A.position.set(R*s*.85,s*1.14,s*.2),A.rotation.z=-R*.65,A.rotation.x=.24,m.add(A)}let b=new y(new Pe(s*.38,12,10),a);b.scale.set(1.38,.56,.98),b.position.set(0,s*.92,s*.52),m.add(b)}else{let b=new y(new Pe(s*.46,14,12),a);b.scale.set(1.48,.78,1.38),b.position.set(0,s*1.1,s*.36),m.add(b);let R=new y(new Pe(s*.36,12,10),a);R.scale.set(1.42,.54,.96),R.position.set(0,s*.92,s*.56),m.add(R);for(let A of[-1,1]){let P=new y(new it(s*.14,s*.34,8),a);P.position.set(A*s*.42,s*1.16,s*.26),P.rotation.z=-A*.48,P.rotation.x=.28,m.add(P)}}i.add(m);let g=new ue;g.visible=!1;let p=new y(new et(s*.88,s*.11,8,22,Math.PI*1.15),a);p.rotation.x=Math.PI/2+.18,p.rotation.z=-Math.PI*.075,p.position.set(0,s*.16,-s*.1),g.add(p);let _=new y(new it(s*.06,s*.16,6),a);_.position.set(0,s*1.08,-s*.12),g.add(_);let v=new U({color:16775399,emissive:16770229,emissiveIntensity:.48,roughness:.1}),x=new y(new Pe(s*.25,12,10),v);return x.scale.set(1.3,.32,.92),x.position.set(.08*s,s*.92,s*.34),x.rotation.z=-.18,x.rotation.x=.28,g.add(x),i.add(g),{hairFullGroup:m,hairShavedGroup:g}}else{let m=new y(new Pe(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);m.scale.set(1.01,1.11,.99),m.rotation.x=-.35,i.add(m)}}function tu(i,e,t,n,s,r){let o=new U({color:16317180,roughness:.18}),a=new U({color:1971218,roughness:.12}),l=new U({color:t,roughness:.48}),c=new U({color:n,roughness:.55}),h=r?1.38:1,u=x=>{let b=x*e*(r?.38:.36),R=e*.09,A=s,P=new y(new Pe(e*.17*h,14,12),o);P.scale.set(1,1.05,.6),P.position.set(b,R,A),i.add(P);let T=new y(new Pe(e*.105*(r?1.15:1),12,10),a);T.scale.set(1,1,.65),T.position.set(b,R,A+e*.07*h),i.add(T);let M=new y(new Pe(e*.036*h,8,6),new Ne({color:16777215}));M.position.set(b+e*.032,R+e*.035,A+e*.115*h),i.add(M);let H=new y(new Pe(e*.18*h,12,10,0,Math.PI*2,0,Math.PI*.52),l);H.scale.set(1.02,1.05,.65),H.position.set(b,R,A),H.rotation.x=-Math.PI*.48,i.add(H);let B=new y(new wt(e*.034*h,e*.22*h,4,8),c);return B.rotation.z=Math.PI/2,B.position.set(b,R+e*.25*h,A+e*.08*h),i.add(B),{sclera:P,pupil:T,eyelid:H,brow:B}},f=u(-1),d=u(1),m=-e*.36,E=s+e*.02,g=new y(new Pe(e*(r?.22:.16),12,10),new Ne({color:5509406}));g.scale.set(1.1,.2,.45),g.position.set(0,m,E-.01),i.add(g);let p=new U({color:10896452,roughness:.42}),_=new y(new wt(e*.032,e*.22,4,8),p);_.rotation.z=Math.PI/2,_.position.set(0,m+e*.03,E+.03),i.add(_);let v=new y(new wt(e*.034,e*.19,4,8),p);return v.rotation.z=Math.PI/2,v.position.set(0,m-e*.03,E+.03),i.add(v),{leftEye:f,rightEye:d,mouthCavity:g,upperLip:_,lowerLip:v,mouthBaseY:m}}function U0(i,e,t,n,s,r,o,a){let l=new ue,c=new ue;l.add(c);let h=new y(new _n(.46,.58,36),new Ne({color:a,transparent:!0,opacity:.22,side:ft,depthWrite:!1}));h.rotation.x=-Math.PI/2,h.position.y=.012,l.add(h);let u=new y(new It(.45,32),new Ne({color:a,transparent:!0,opacity:.08,side:ft,depthWrite:!1}));u.rotation.x=-Math.PI/2,u.position.y=.01,l.add(u);let f=new U({color:s,roughness:.48,metalness:i==="CartoonTank"?.35:.06}),d=new U({color:r,roughness:.35,metalness:.35}),m=new U({color:2042167,roughness:.72}),E=new ue,g=i==="CartoonTank"?.26:.44;E.position.y=g,c.add(E);let p=new ue,_,v,x,b,R;if(i==="CartoonTank"){for(let Ae of[-.36,.36]){let q=new y(new j(.22,.26,.92),m);q.position.set(Ae,-.1,0),q.castShadow=!0,E.add(q);for(let ae of[-.3,0,.3]){let K=new y(new Me(.11,.11,.25,12),d);K.rotation.z=Math.PI/2,K.position.set(Ae,-.12,ae),E.add(K)}}let re=new y(new j(.68,.3,.84),f);re.position.set(0,.14,0),re.castShadow=!0,E.add(re),_=new ue,_.position.set(0,.42,-.02),E.add(_);let me=new y(new j(.56,.34,.56),f);me.castShadow=!0,_.add(me);let Re=new y(new j(.58,.07,.58),d);Re.position.y=-.1,_.add(Re),v=new y(new Me(.065,.08,.66,14),m),v.rotation.x=Math.PI/2,v.position.set(0,.04,.5),v.castShadow=!0,_.add(v),p.position.set(0,.1,0),_.add(p)}else if(i==="BrainrotLog"){let re=q=>{let ae=new ue;ae.position.set(q*.14,-.05,0),E.add(ae);let K=new y(new wt(.065,.28,6,8),f);K.position.set(0,-.17,0),ae.add(K);let ie=new y(new Pe(.1,10,8),d);return ie.scale.set(.9,.5,1.5),ie.position.set(0,-.34,.05),ae.add(ie),ae};b=re(-1),R=re(1);let me=new y(new Me(.21,.25,.96,18),f);me.position.y=.44,me.castShadow=!0,E.add(me);let Re=new y(new Me(.18,.18,.04,16),new U({color:16639626}));Re.position.y=.93,E.add(Re);let Ae=new y(new Me(.025,.04,.18,8),f);Ae.position.set(.06,1,0),Ae.rotation.z=-.35,E.add(Ae),p.position.set(0,.72,0),E.add(p)}else{let re=ae=>{let K=new ue;K.position.set(ae*.13,-.05,0),E.add(K);let ie=new y(new wt(.055,.3,6,8),m);ie.position.set(0,-.17,0),K.add(ie);let Y=new y(new Pe(.095,10,8),d);return Y.scale.set(.95,.5,1.45),Y.position.set(0,-.34,.05),K.add(Y),K};b=re(-1),R=re(1);let me=new y(new Me(.32,.22,.62,24),f);me.position.y=.34,me.castShadow=!0,E.add(me);let Re=new y(new et(.315,.025,10,24),d);Re.rotation.x=Math.PI/2,Re.position.y=.65,E.add(Re);let Ae=new y(new It(.295,24),new U({color:4137748,roughness:.2}));Ae.rotation.x=-Math.PI/2,Ae.position.y=.62,E.add(Ae);let q=new y(new et(.14,.034,8,16,Math.PI),f);q.rotation.z=-Math.PI/2,q.position.set(-.3,.36,0),E.add(q),p.position.set(0,.42,0),E.add(p)}let T=tu(p,i==="CartoonTank"?.26:.24,o,1120295,i==="CartoonTank"?.29:i==="CupDancer"?.28:.21,!0),M=i==="CupDancer"?new U({color:16777215,roughness:.4}):f,H=new wt(.048,.2,6,8),B=new wt(.042,.18,6,8),F=re=>{let me=new ue;me.position.set(re*(i==="CartoonTank"?.33:.27),i==="CartoonTank"?.24:.45,0),E.add(me);let Re=new y(H,M);Re.position.y=-.11,me.add(Re);let Ae=new ue;Ae.position.y=-.22,me.add(Ae);let q=new y(B,M);q.position.y=-.1,Ae.add(q);let ae=new y(new Pe(.068,10,8),d);return ae.position.y=-.22,Ae.add(ae),{shoulder:me,elbow:Ae,glove:ae}},k=F(-1),V=F(1),W=new ue;W.position.set(0,-.25,.06);let le=new y(new Me(.11,.07,.08,14),new U({color:16317180,roughness:.35}));W.add(le);let O=new y(new Pe(.075,10,8),new U({color:16707722,roughness:.45}));O.scale.set(1.1,.55,1.1),O.position.y=.035,W.add(O),W.visible=!1,V.elbow.add(W);let he=Kl(V.elbow,k.elbow,E);if(i==="BrainrotLog"){x=new ue,x.position.set(0,-.22,.04);let re=new y(new Me(.065,.025,.65,10),new U({color:14251782,roughness:.45}));re.position.y=-.28,re.castShadow=!0,x.add(re),V.elbow.add(x)}return l.rotation.y=t*.36,{root:l,bodyPivot:c,torsoGroup:E,headPivot:p,leftShoulder:k.shoulder,leftElbow:k.elbow,rightShoulder:V.shoulder,rightElbow:V.elbow,leftHip:b,rightHip:R,snackProp:W,handProps:he,headY:i==="CartoonTank"?.78:i==="CupDancer"?.86:1.16,leftEyelid:T.leftEye.eyelid,rightEyelid:T.rightEye.eyelid,leftBrow:T.leftEye.brow,rightBrow:T.rightEye.brow,leftSclera:T.leftEye.sclera,rightSclera:T.rightEye.sclera,leftPupil:T.leftEye.pupil,rightPupil:T.rightEye.pupil,mouthCavity:T.mouthCavity,upperLip:T.upperLip,lowerLip:T.lowerLip,auraRing:h,auraDisc:u,turretGroup:_,cannonBarrel:v,propPivot:x,mouthBaseY:T.mouthBaseY,baseTorsoY:g,restScale:1,topY:i==="CartoonTank"?1.05:i==="CupDancer"?1.14:1.54,role:i,name:e,facingSign:t,standing:!0,seedOffset:n}}function ya(i,e,t,n,s){let r=i.role,o=P0(t,r),{robe:a,sash:l,skin:c,isDivine:h}=I0(r,i.robeHex,e),u=new _e(e);if(r==="BrainrotLog"||r==="CupDancer"||r==="CartoonTank")return U0(r,i.name,n,s,a,l,c,u);let f=new ue,d=new ue;f.add(d);let E=Ql(t),g=r==="ChildDevotee"?.82:1;d.scale.setScalar(g);let p=new U({color:a,roughness:.58,metalness:.08}),_=new U({color:new _e(a).multiplyScalar(.75),roughness:.65}),v=new U({color:l,roughness:.42,metalness:.25}),x=new U({color:c,roughness:.48,metalness:.02}),b=new U({color:16236088,metalness:.85,roughness:.22}),R=new y(new _n(.46,.58,36),new Ne({color:u,transparent:!0,opacity:E?0:.22,side:ft,depthWrite:!1}));R.rotation.x=-Math.PI/2,R.position.y=.012,R.visible=!E,f.add(R);let A=new y(new It(.45,32),new Ne({color:u,transparent:!0,opacity:E?0:.08,side:ft,depthWrite:!1}));A.rotation.x=-Math.PI/2,A.position.y=.01,A.visible=!E,f.add(A);let P,T,M,H,B,F=.14,k=E?new U({color:n>0?1976635:3223169,roughness:.72}):_;if(o){F=.66;let Q=new y(new Pe(.245,16,12),k);Q.scale.set(1.06,.65,.88),Q.position.set(0,F-.01,0),Q.castShadow=!0,d.add(Q);let se=new wt(.104,.2,6,10),Ie=new wt(.092,.18,6,10),ne=new U({color:E?16317180:3875862,roughness:.45}),fe=xe=>{let qe=new ue;qe.position.set(xe*.13,F-.04,0),d.add(qe);let Oe=new y(se,k);Oe.position.set(0,-.15,0),Oe.castShadow=!0,Oe.receiveShadow=!0,qe.add(Oe);let nt=new ue;nt.position.set(0,-.3,0),qe.add(nt);let L=new y(Ie,k);L.position.set(0,-.14,0),L.castShadow=!0,L.receiveShadow=!0,nt.add(L);let Ee=new y(new Pe(.105,12,8),ne);return Ee.scale.set(.95,.55,1.55),Ee.position.set(0,-.265,.05),Ee.castShadow=!0,nt.add(Ee),{hip:qe,knee:nt}},Ce=fe(-1),Be=fe(1);T=Ce.hip,H=Ce.knee,M=Be.hip,B=Be.knee}else{let Q=D0(u);P=Q.glowMesh,d.add(Q.group),F=.15;let se=new y(new Pe(.36,20,12),_);se.scale.set(1.15,.45,.92),se.position.set(0,F+.06,.03),se.castShadow=!0,se.receiveShadow=!0,d.add(se)}let V=new ue;V.position.y=F,d.add(V);let W=H0(.28,.21,.27,.62),le=new y(W,p);if(le.castShadow=!0,le.receiveShadow=!0,V.add(le),E){let Q=new y(new et(.132,.026,8,20),v);Q.rotation.x=Math.PI/2+.2,Q.position.set(0,.58,.03),V.add(Q);let se=new y(new et(.255,.022,8,22),new U({color:988970,roughness:.65}));se.rotation.x=Math.PI/2,se.position.y=.04,V.add(se)}else{if(t!=="PalaceCourt"){let Ie=new ji([new I(-.16,.55,.1),new I(-.02,.39,.21),new I(.18,.22,.14),new I(.14,.18,-.16)]),ne=new y(new qs(Ie,18,.024,8,!1),v);ne.castShadow=!0,V.add(ne)}let Q=new y(new et(.22,.022,8,22),b);Q.rotation.x=Math.PI/2,Q.position.y=.24,V.add(Q);let se=new y(new et(.142,.018,8,20),b);if(se.rotation.x=Math.PI/2+.25,se.position.set(0,.57,.04),V.add(se),o&&r==="NobleWoman"){let Ie=[new ge(.18,.25),new ge(.24,.08),new ge(.36,-.18),new ge(.45,-.44),new ge(.42,-.46)],ne=new ei(Ie,28),fe=new U({color:a,roughness:.45,metalness:.14,side:ft}),Ce=new y(ne,fe);Ce.castShadow=!0,Ce.receiveShadow=!0,V.add(Ce);let Be=new y(new et(.44,.024,8,32),b);Be.rotation.x=Math.PI/2,Be.position.y=-.44,V.add(Be)}else if(o&&r==="KingCrown"&&(t==="PalaceCourt"||i.attire==="turban")){let Ie=[new ge(.22,.24),new ge(.27,.02),new ge(.31,-.26),new ge(.32,-.34)],ne=new y(new ei(Ie,24),new U({color:a,roughness:.5,metalness:.12,side:ft}));ne.castShadow=!0,V.add(ne);for(let fe=0;fe<4;fe++){let Ce=new y(new Pe(.022,8,8),b);Ce.position.set(0,.5-fe*.075,fe<2?.248:.225),V.add(Ce)}}}let O=i.name.toLowerCase();if(r==="SageRishi"&&(O.includes("narad")||O.includes("\u0928\u093E\u0930\u0926"))){let Q=new ue,se=new U({color:9584654,roughness:.42}),Ie=new y(new Me(.025,.025,.85,10),se);Ie.rotation.z=-.68,Q.add(Ie);let ne=new y(new Pe(.11,14,10),se);ne.position.set(-.26,-.32,.04),Q.add(ne);let fe=new y(new Pe(.08,12,10),se);fe.position.set(.24,.3,.04),Q.add(fe),Q.position.set(0,.34,.28),V.add(Q)}else if(r==="Warrior"){let Q=new y(new Me(.22,.22,.04,20),b);Q.rotation.x=Math.PI/2,Q.position.set(-.34,.28,.08),V.add(Q);let se=new y(new Me(.016,.016,1.45,8),new U({color:7029795}));se.position.set(.36,.55,.02),V.add(se);let Ie=new y(new it(.04,.14,8),new U({color:14870768,metalness:.85}));Ie.position.set(.36,1.32,.02),V.add(Ie)}let he=new wt(.072,.21,6,10),re=new wt(.06,.19,6,10),me=Q=>{let se=new ue;se.position.set(Q*.245,.52,0),V.add(se);let Ie=new y(new Pe(.088,12,10),p);Ie.castShadow=!0,se.add(Ie);let ne=new y(he,p);ne.position.y=-.13,ne.castShadow=!0,se.add(ne);let fe=new ue;fe.position.y=-.26,se.add(fe);let Ce=new y(new Pe(.062,10,8),p);Ce.castShadow=!0,fe.add(Ce);let Be=new y(re,p);Be.position.y=-.115,Be.castShadow=!0,fe.add(Be);let xe=new y(new Pe(.066,12,10),x);return xe.scale.set(.95,1.15,.8),xe.position.y=-.24,xe.castShadow=!0,fe.add(xe),{shoulder:se,elbow:fe}},Re=me(-1),Ae=me(1),q=new ue;q.position.set(0,-.25,.06);let ae=new y(new Me(.11,.07,.08,14),new U({color:16317180,roughness:.35}));q.add(ae);let K=new y(new Pe(.075,10,8),new U({color:16707722,roughness:.45}));K.scale.set(1.1,.55,1.1),K.position.y=.035,q.add(K),q.visible=!1,Ae.elbow.add(q);let ie=Kl(Ae.elbow,Re.elbow,V),Y=r==="ComicBobble"?.345:r==="ChildDevotee"?.265:.245,we=new y(new Me(.075,.095,.14,14),x);we.position.y=.65,V.add(we);let X=new ue;X.position.y=.68+Y*.92,V.add(X);let de=new y(new Pe(Y,26,20),x);de.scale.set(.98,1.08,.95),de.castShadow=!0,de.receiveShadow=!0,X.add(de);let be=new y(new Pe(Y*.14,10,8),x);be.scale.set(.85,1.05,1.2),be.position.set(0,-Y*.04,Y*.94),X.add(be);for(let Q of[-1,1]){let se=new y(new Pe(Y*.18,10,8),x);if(se.scale.set(.5,1.2,.8),se.position.set(Q*Y*.96,-Y*.04,0),X.add(se),!E){let Ie=new y(new et(Y*.1,Y*.025,8,14),b);Ie.rotation.y=Math.PI/2,Ie.position.set(Q*Y*.98,-Y*.2,.01),X.add(Ie)}}let Ve=Q=>{let se=new y(new Pe(Y*.19,10,8),new Ne({color:15680580,transparent:!0,opacity:0,depthWrite:!1}));return se.scale.set(1.2,.75,.35),se.position.set(Q*Y*.56,-Y*.16,Y*.84),X.add(se),se},D=E?Ve(-1):void 0,_t=E?Ve(1):void 0,ke,Je=Y*.08;if(E){ke=new ue,ke.position.set(0,Je,Y*.97);let Q=new U({color:988970,metalness:.45,roughness:.25}),se=new Ne({color:12248829,transparent:!0,opacity:.24}),Ie=new y(new j(Y*1.18,Y*.09,Y*.05),Q);Ie.position.set(0,Y*.16,.01),ke.add(Ie);for(let fe of[-1,1]){let Ce=new y(new et(Y*.19,Y*.028,8,18),Q);Ce.position.set(fe*Y*.36,0,0),ke.add(Ce);let Be=new y(new It(Y*.175,16),se);Be.position.set(fe*Y*.36,0,-.005),ke.add(Be);let xe=new y(new j(Y*.03,Y*.035,Y*.92),Q);xe.position.set(fe*Y*.56,Y*.11,-Y*.44),ke.add(xe)}let ne=new y(new Me(Y*.022,Y*.022,Y*.36,6),Q);ne.rotation.z=Math.PI/2,ne.position.set(0,Y*.02,0),ke.add(ne),ke.visible=i.hasGlasses!==void 0&&i.hasGlasses!==null?!!i.hasGlasses:n>0,X.add(ke)}if(r==="NobleWoman"){let Q=new y(new Pe(Y*.08,10,8),new U({color:14427686,roughness:.4}));Q.scale.z=.4,Q.position.set(0,Y*.24,Y*.96),X.add(Q)}else if(r!=="Warrior"&&!E){let Q=new y(new wt(Y*.036,Y*.16,4,8),new U({color:r==="Divine"?16498468:15357964,emissive:8138002,emissiveIntensity:.2}));Q.position.set(0,Y*.28,Y*.95),X.add(Q)}let Fe=L0(X,r,i.name,t,Y,a,i.attire),$e,Le,C=r==="NobleWoman"&&eu.some(Q=>O.includes(Q));if(h||r==="SageRishi"||C){$e=new ue,$e.position.set(0,.04,-Y*.72),Le=new Ne({color:h?16769126:u,transparent:!0,opacity:h?.65:.28,side:ft,depthWrite:!1});let Q=new y(new _n(Y*1.45,Y*1.62,32),Le);$e.add(Q);for(let se=0;se<8;se++){let Ie=new y(new tt(Y*.08,Y*.45),Le),ne=se/8*Math.PI*2;Ie.position.set(Math.cos(ne)*Y*1.54,Math.sin(ne)*Y*1.54,0),Ie.rotation.z=ne+Math.PI/2,$e.add(Ie)}X.add($e)}let w=r==="SageRishi"?14277862:1840930,z=r==="ComicBobble"||t==="DoorwaySet"||t==="SkyGauntlet",ee=tu(X,Y,c,w,Y*.85,z);f.rotation.y=n*.42;let ce=F+.68+Y*.92,te=(o?ce:1.04)*g,Ue=(o?ce+Y*1.48:1.4)*g;return{root:f,bodyPivot:d,torsoGroup:V,headPivot:X,leftShoulder:Re.shoulder,leftElbow:Re.elbow,rightShoulder:Ae.shoulder,rightElbow:Ae.elbow,leftHip:T,rightHip:M,leftKnee:H,rightKnee:B,snackProp:q,handProps:ie,headY:te,leftEyelid:ee.leftEye.eyelid,rightEyelid:ee.rightEye.eyelid,leftBrow:ee.leftEye.brow,rightBrow:ee.rightEye.brow,leftSclera:ee.leftEye.sclera,rightSclera:ee.rightEye.sclera,leftPupil:ee.leftEye.pupil,rightPupil:ee.rightEye.pupil,mouthCavity:ee.mouthCavity,upperLip:ee.upperLip,lowerLip:ee.lowerLip,glassesGroup:ke,glassesBaseY:Je,hairFullGroup:Fe?.hairFullGroup,hairShavedGroup:Fe?.hairShavedGroup,leftCheekFlush:D,rightCheekFlush:_t,haloGroup:$e,haloMaterial:Le,auraRing:R,auraDisc:A,pedestalGlow:P,mouthBaseY:ee.mouthBaseY,baseTorsoY:o?.66:.15,restScale:g,topY:Ue,role:r,name:i.name,facingSign:n,standing:o,hasFloorAura:!E,seedOffset:s}}var Yh=(i,e,t)=>i+(e-i)*t,qh=i=>{let e=Math.max(0,Math.min(1,i));return e*e*(3-2*e)};function B0(i,e,t="dancing",n=!1,s=0){let r=n?-1:1;if(e==="viralBounce"){let m=Math.abs(Math.sin(i*7.2)),E=Math.sin(i*3.6);return{hipOffsetX:E*.14*r,liftY:Math.pow(m,2.4)*.06,bodyRotY:Math.sin(i*1.8)*.24*r,bodyRotZ:E*.08*r,torsoRotX:.06+m*.06,torsoRotY:-E*.14*r,torsoRotZ:-E*.07*r,headRotZ:E*.1*r,leftHipX:-m*.24+E*.16,rightHipX:-m*.24-E*.16,leftKneeX:m*.44,rightKneeX:m*.44,leftShoulder:[-.95+E*.55,.22*r,.52*r],leftElbow:[-.85+m*.35,0,.22*r],rightShoulder:[-.95-E*.55,-.22*r,-.52*r],rightElbow:[-.85+m*.35,0,-.22*r]}}let o=e==="bhangra"?1.32:.92,a=i*o%4,l=t==="adaab"?0:t==="sufiSpin"?3:Math.floor(a),c=t==="dancing"?a-Math.floor(a):i*o%1,h=s>0?Math.pow(1-s,2)*.16:Math.abs(Math.sin(i*Math.PI*o*2))*.14,u=Math.sin(c*Math.PI*2);if(l===0){let m=qh(Math.sin(c*Math.PI));return{hipOffsetX:-.09*r*m,liftY:0,bodyRotY:.16*r*m,bodyRotZ:.04*r*m,torsoRotX:.09*m,torsoRotY:-.12*r*m,torsoRotZ:-.07*r*m,headRotZ:.1*r*m,leftHipX:-.14-h*.25,rightHipX:-.06-h*.15,leftKneeX:.24+h*.55,rightKneeX:.12+h*.35,leftShoulder:[-.78*m-.24,.28*r,(.42+.18*m)*r],leftElbow:[-.48-.28*m,0,-.18*r],rightShoulder:[Yh(-.45,-1.42,m),-.32*r,(-.36-.16*m)*r],rightElbow:[Yh(-.55,-1.28,m),0,.24*m*r]}}if(l===1){let m=Math.sin(c*Math.PI*2);return{hipOffsetX:m*.15*r,liftY:0,bodyRotY:m*.22*r,bodyRotZ:m*.05*r,torsoRotX:.05,torsoRotY:-m*.22*r,torsoRotZ:-m*.09*r,headRotZ:m*.14*r,leftHipX:-.16+Math.max(0,m)*.18,rightHipX:-.16+Math.max(0,-m)*.18,leftKneeX:.26+Math.abs(m)*.24+h,rightKneeX:.26+Math.abs(m)*.24+h,leftShoulder:[-1.18+m*.52,.32*r,(.58+m*.32)*r],leftElbow:[-.72+Math.cos(c*Math.PI*2)*.35,0,.26*r],rightShoulder:[-1.18-m*.52,-.32*r,(-.58+m*.32)*r],rightElbow:[-.72-Math.cos(c*Math.PI*2)*.35,0,-.26*r]}}if(l===2){let m=u,E=e==="bhangra"?.35:0;return{hipOffsetX:m*.16*r,liftY:e==="bhangra"?Math.max(0,Math.abs(m)-.6)*.12:0,bodyRotY:m*.2*r,bodyRotZ:m*.06*r,torsoRotX:.08+h*.25,torsoRotY:-m*.18*r,torsoRotZ:-m*.07*r,headRotZ:m*.11*r,leftHipX:-.12+m*.28,rightHipX:-.12-m*.28,leftKneeX:.2+Math.max(0,-m)*.48+h,rightKneeX:.2+Math.max(0,m)*.48+h,leftShoulder:[-1.45-E+m*.38,.24*r,(.64+m*.24)*r],leftElbow:[-.88+m*.24,0,.18*r],rightShoulder:[-1.05-E-m*.42,-.24*r,(-.52+m*.24)*r],rightElbow:[-.88-m*.24,0,-.18*r]}}let f=qh(c),d=Math.sin(f*Math.PI);return{hipOffsetX:Math.sin(f*Math.PI)*.08*r,liftY:e==="bhangra"?d*.08:0,bodyRotY:f*Math.PI*2*r,bodyRotZ:.04*r*d,torsoRotX:-.05*d,torsoRotY:0,torsoRotZ:0,headRotZ:-.08*r*d,leftHipX:-.12,rightHipX:-.12,leftKneeX:.22+h*.4,rightKneeX:.22+h*.4,leftShoulder:[-1.55-.35*d,.28*r,(.68+.32*d)*r],leftElbow:[-.42-.22*d,0,.24*r],rightShoulder:[-1.55-.35*d,-.28*r,(-.68-.32*d)*r],rightElbow:[-.42-.22*d,0,-.24*r]}}function nu(i,e=0){let t=V0(i);i.bodyPivot.position.y=0,i.bodyPivot.updateMatrixWorld(!0);let n=1/0;for(let r of[t.left,t.right])r&&(r.getWorldPosition($l),i.root.worldToLocal($l),n=Math.min(n,$l.y));let s=Number.isFinite(n)?Math.max(-.55,Math.min(.45,-n)):0;i.bodyPivot.position.y=s+Math.max(0,Math.min(.6,e))}function Ma(i,e,t,n=0,s=!1,r=0,o=.5){let a=e+r,l=B0(a,t,"dancing",s,n);i.bodyPivot.scale.setScalar(i.restScale),i.bodyPivot.position.x=l.hipOffsetX,i.bodyPivot.rotation.set(0,l.bodyRotY,l.bodyRotZ),i.torsoGroup.position.y=i.baseTorsoY+Math.sin(a*3)*.01,i.torsoGroup.rotation.set(l.torsoRotX,l.torsoRotY,l.torsoRotZ),i.headPivot.rotation.set(0,Math.sin(a*1.4)*.08,l.headRotZ),i.leftShoulder.rotation.set(l.leftShoulder[0],l.leftShoulder[1],l.leftShoulder[2]),i.leftElbow.rotation.set(l.leftElbow[0],l.leftElbow[1],l.leftElbow[2]),i.rightShoulder.rotation.set(l.rightShoulder[0],l.rightShoulder[1],l.rightShoulder[2]),i.rightElbow.rotation.set(l.rightElbow[0],l.rightElbow[1],l.rightElbow[2]),i.leftHip&&i.leftHip.rotation.set(l.leftHipX,0,0),i.rightHip&&i.rightHip.rotation.set(l.rightHipX,0,0),i.leftKnee&&i.leftKnee.rotation.set(l.leftKneeX,0,0),i.rightKnee&&i.rightKnee.rotation.set(l.rightKneeX,0,0),nu(i,l.liftY);let c=.22+o*.35,h=a*.31%1>.96;i.leftEyelid.rotation.x=h?.14:-Math.PI*.52,i.rightEyelid.rotation.x=h?.14:-Math.PI*.52,i.mouthCavity.scale.set(1.15,.12+c*.45,.5),i.upperLip.position.y=i.mouthBaseY+c*.02,i.lowerLip.position.y=i.mouthBaseY-c*.04}function dr(i,e,t){let n=t+i.seedOffset;e.joints?W0(i,e,e.joints):(i.bodyPivot.position.x=e.hipOffsetX,i.bodyPivot.position.y=Math.max(0,e.hipBounceY),i.torsoGroup.position.y=i.baseTorsoY+Math.sin(n*3)*.012,i.torsoGroup.rotation.x=e.torsoTiltX,i.torsoGroup.rotation.z=e.torsoTiltZ,i.headPivot.rotation.z=e.headTiltZ,i.headPivot.rotation.y=e.headYawY,i.leftShoulder.rotation.set(-.22,.1,e.leftShoulderZ),i.leftElbow.rotation.set(-.18,0,e.leftElbowZ),i.rightShoulder.rotation.set(-.22,-.1,e.rightShoulderZ),i.rightElbow.rotation.set(-.18,0,e.rightElbowZ),i.turretGroup&&(i.turretGroup.rotation.y=e.headYawY*1.3)),i.propPivot&&(i.propPivot.rotation.z=e.joints?0:e.rightElbowZ*.5);let s=e.emotion??"happy",r=s==="surprised"?1.32:s==="angry"?1.15:1.05;i.leftSclera.scale.set(r,r*1.05,.6*r),i.rightSclera.scale.set(r,r*1.05,.6*r);let o=n*.31%1>.96;i.leftEyelid.rotation.x=o?.14:-Math.PI*.52,i.rightEyelid.rotation.x=o?.14:-Math.PI*.52;let a=e.mouthOpen??.25;i.mouthCavity.scale.set(1.15,.12+a*.45,.5),i.upperLip.position.y=i.mouthBaseY+a*.02,i.lowerLip.position.y=i.mouthBaseY-a*.04;let l=i.auraRing.material,c=i.auraDisc.material;l.opacity=.52+.14*Math.sin(n*5.2),c.opacity=.18}var F0=new I(0,-1,0),N0=new I(0,1,0),iu=new I(1,0,0),ur=new vt,O0=new vt().setFromAxisAngle(iu,-.3),G0=new vt().setFromEuler(new Wt(-.1,0,-.18)),k0=new vt().setFromEuler(new Wt(-.1,0,.18)),z0=new vt().setFromEuler(new Wt(-.25,0,0)),Zh=new vt,xa=new vt,An=new vt,Jh=new vt,ma=new vt,Kh=new vt,Zt=new I,Rn=new I,kn=new I,nn=new I,hr=new I,$l=new I,ga=new ct,$h=new WeakMap;function V0(i){let e=$h.get(i);if(!e){let t=(n,s)=>{let r=s??n;if(!r)return null;let o=new yt;return o.position.set(0,s?-.323:-.39,.04),r.add(o),o};e={left:t(i.leftHip,i.leftKnee),right:t(i.rightHip,i.rightKnee)},$h.set(i,e)}return e}function su(i,e,t){return e.getWorldQuaternion(t),i.root.getWorldQuaternion(Zh).invert(),t.premultiply(Zh)}function Ea(i,e,t){t>=1?i.quaternion.copy(e):i.quaternion.slerp(e,t)}function hs(i,e,t,n,s){su(i,e.parent,xa).invert(),hr.copy(t).applyQuaternion(xa),hr.y>.985&&(hr.x+=.07*n,hr.normalize()),An.setFromUnitVectors(F0,hr),Ea(e,An,s)}function us(i,e,t){if(!i||!e)return!1;t.set(e.x-i.x,e.y-i.y,e.z-i.z);let n=t.length();return n<1e-4?!1:(t.divideScalar(n),!0)}function Qh(i,e){let t=2*Math.acos(Math.min(1,Math.abs(i.w)));t<=e||(Jh.copy(i),i.copy(ur).slerp(Jh,e/t))}function ds(i,e,t){i&&i.quaternion.slerp(e,t)}function W0(i,e,t){let n=i.role==="CartoonTank",s=0;t.lHip&&t.rHip?s=Math.atan2(-(t.rHip.z-t.lHip.z),t.rHip.x-t.lHip.x):t.lShoulder&&t.rShoulder&&(s=Math.atan2(-(t.rShoulder.z-t.lShoulder.z),t.rShoulder.x-t.lShoulder.x)),s=Math.max(-1.3,Math.min(1.3,s))*(n?.6:1),i.bodyPivot.position.set(e.hipOffsetX,0,0),Kh.setFromAxisAngle(N0,s),i.bodyPivot.quaternion.slerp(Kh,.8),i.torsoGroup.position.y=i.baseTorsoY;let r=!1;t.lShoulder&&t.rShoulder&&(Zt.set(t.rShoulder.x-t.lShoulder.x,t.rShoulder.y-t.lShoulder.y,t.rShoulder.z-t.lShoulder.z),t.lHip&&t.rHip?Rn.set((t.lShoulder.x+t.rShoulder.x-t.lHip.x-t.rHip.x)/2,(t.lShoulder.y+t.rShoulder.y-t.lHip.y-t.rHip.y)/2,(t.lShoulder.z+t.rShoulder.z-t.lHip.z-t.rHip.z)/2):Rn.set(0,1,0),Zt.lengthSq()>1e-6&&(Zt.normalize(),Rn.addScaledVector(Zt,-Rn.dot(Zt)),Rn.lengthSq()>1e-6&&(Rn.normalize(),kn.crossVectors(Zt,Rn),ga.makeBasis(Zt,Rn,kn),ma.setFromRotationMatrix(ga),An.copy(i.bodyPivot.quaternion).invert().multiply(ma),Qh(An,n?.25:.8),Ea(i.torsoGroup,An,.85),r=!0))),r||ds(i.torsoGroup,ur,.1);let o=!1;t.lEar&&t.rEar&&t.nose&&(Zt.set(t.rEar.x-t.lEar.x,t.rEar.y-t.lEar.y,t.rEar.z-t.lEar.z),kn.set(t.nose.x-(t.lEar.x+t.rEar.x)/2,t.nose.y-(t.lEar.y+t.rEar.y)/2,t.nose.z-(t.lEar.z+t.rEar.z)/2),Zt.lengthSq()>1e-6&&(Zt.normalize(),kn.addScaledVector(Zt,-kn.dot(Zt)),kn.lengthSq()>1e-6&&(kn.normalize(),Rn.crossVectors(kn,Zt),ga.makeBasis(Zt,Rn,kn),ma.setFromRotationMatrix(ga).multiply(O0),su(i,i.headPivot.parent,xa).invert(),An.copy(xa).multiply(ma),Qh(An,.75),Ea(i.headPivot,An,.75),o=!0))),o||ds(i.headPivot,ur,.1);let a=(h,u,f,d,m,E,g)=>{us(f,d,nn)?(hs(i,h,nn,E,1),us(d,m,nn)?hs(i,u,nn,E,1):ds(u,ur,.15)):(ds(h,g,.12),ds(u,z0,.12))};a(i.leftShoulder,i.leftElbow,t.lShoulder,t.lElbow,t.lWrist,-1,G0),a(i.rightShoulder,i.rightElbow,t.rShoulder,t.rElbow,t.rWrist,1,k0);let l=Math.max(0,Math.min(.9,e.grooveBend??0)),c=(h,u,f,d,m,E)=>{if(h){if(u&&us(f,d,nn)){hs(i,h,nn,E,1),us(d,m,nn)?hs(i,u,nn,E,1):ds(u,ur,.2);return}if(!u&&(us(f,m,nn)||us(f,d,nn))){hs(i,h,nn,E,1);return}nn.set(E*.06,-Math.cos(l*.5),Math.sin(l*.5)).normalize(),hs(i,h,nn,E,.35),u&&(An.setFromAxisAngle(iu,l),Ea(u,An,.35))}};c(i.leftHip,i.leftKnee,t.lHip,t.lKnee,t.lAnkle,-1),c(i.rightHip,i.rightKnee,t.rHip,t.rKnee,t.rAnkle,1),i.bodyPivot.scale.setScalar(i.restScale),nu(i,e.liftY??0)}var fr=class i extends y{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new bt;let n=this,s=t.color!==void 0?new _e(t.color):new _e(8355711),r=t.textureWidth||512,o=t.textureHeight||512,a=t.clipBias||0,l=t.shader||i.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new an,u=new I,f=new I,d=new I,m=new ct,E=new I(0,0,-1),g=new lt,p=new I,_=new I,v=new lt,x=new ct,b=this.camera,R=new cn(r,o,{samples:c,type:ri}),A=new Bt({name:l.name!==void 0?l.name:"unspecified",uniforms:la.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});A.uniforms.tDiffuse.value=R.texture,A.uniforms.color.value=s,A.uniforms.textureMatrix.value=x,this.material=A,this.onBeforeRender=function(P,T,M){if(f.setFromMatrixPosition(n.matrixWorld),d.setFromMatrixPosition(M.matrixWorld),m.extractRotation(n.matrixWorld),u.set(0,0,1),u.applyMatrix4(m),p.subVectors(f,d),p.dot(u)>0===!0&&this.forceUpdate===!1)return;p.reflect(u).negate(),p.add(f),m.extractRotation(M.matrixWorld),E.set(0,0,-1),E.applyMatrix4(m),E.add(d),_.subVectors(f,E),_.reflect(u).negate(),_.add(f),b.position.copy(p),b.up.set(0,1,0),b.up.applyMatrix4(m),b.up.reflect(u),b.lookAt(_),b.far=M.far,b.updateMatrixWorld(),b.projectionMatrix.copy(M.projectionMatrix),x.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),x.multiply(b.projectionMatrix),x.multiply(b.matrixWorldInverse),x.multiply(n.matrixWorld),h.setFromNormalAndCoplanarPoint(u,f),h.applyMatrix4(b.matrixWorldInverse),g.set(h.normal.x,h.normal.y,h.normal.z,h.constant);let B=b.projectionMatrix;v.x=(Math.sign(g.x)+B.elements[8])/B.elements[0],v.y=(Math.sign(g.y)+B.elements[9])/B.elements[5],v.z=-1,v.w=(1+B.elements[10])/B.elements[14],g.multiplyScalar(2/g.dot(v)),B.elements[2]=g.x,B.elements[6]=g.y,B.elements[10]=g.z+1-a,B.elements[14]=g.w,n.visible=!1;let F=P.getRenderTarget(),k=P.xr.enabled,V=P.shadowMap.autoUpdate;P.xr.enabled=!1,P.shadowMap.autoUpdate=!1,P.setRenderTarget(R),P.state.buffers.depth.setMask(!0),P.autoClear===!1&&P.clear(),P.render(T,b),P.xr.enabled=k,P.shadowMap.autoUpdate=V,P.setRenderTarget(F);let W=M.viewport;W!==void 0&&P.state.viewport(W),n.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return R},this.dispose=function(){R.dispose(),n.material.dispose()}}};fr.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function X0(i,e){let t=new _e(e.topBackdropHex),n=new _e(e.midBackdropHex),s=new _e(e.botBackdropHex);return i==="Night"?(t.lerp(new _e(395545),.72),n.lerp(new _e(1252674),.72),s.lerp(new _e(658716),.72),{top:t.getHex(),mid:n.getHex(),bot:s.getHex(),sunColor:10859772,sunIntensity:1.05,fogDensity:.055}):i==="Sunset"?(t.lerp(new _e(3216445),.65),n.lerp(new _e(12732717),.65),s.lerp(new _e(2625560),.65),{top:t.getHex(),mid:n.getHex(),bot:s.getHex(),sunColor:16754268,sunIntensity:1.75,fogDensity:.042}):i==="Day"?(t.lerp(new _e(3718648),.55),n.lerp(new _e(9684477),.55),s.lerp(new _e(1981023),.55),{top:t.getHex(),mid:n.getHex(),bot:s.getHex(),sunColor:16774624,sunIntensity:2,fogDensity:.025}):(t.lerp(new _e(1970486),.48),n.lerp(new _e(12076580),.42),s.lerp(new _e(1707800),.48),{top:t.getHex(),mid:n.getHex(),bot:s.getHex(),sunColor:16764807,sunIntensity:1.85,fogDensity:.036})}function Jt(i,e,t,n,s,r,o){let a=new U({color:14251782,metalness:.8,roughness:.25}),l=new y(new it(.11,.07,14),a);l.rotation.x=Math.PI,l.position.set(e,t+.035,n),i.add(l);let c=new y(new it(.032,.1,10),new Ne({color:16768875}));c.position.set(e,t+.11,n),i.add(c);let h=new y(new Pe(.11,10,8),new Ne({color:16752412,transparent:!0,opacity:.3,depthWrite:!1}));if(h.position.set(e,t+.11,n),i.add(h),r.animatedProps.push({object:c,kind:"diya",baseY:t+.11,phase:s,speed:7.5}),o){let u=new tn(16752440,1.4,5.5,1.6);u.position.set(e,t+.22,n),i.add(u),r.ambientFireLights.push({light:u,baseIntensity:1.4,phase:s})}}function pr(i,e,t,n,s,r,o){let a=new ue;a.position.set(e,0,t);let l=new U({color:4861725,roughness:.85}),c=new y(new Me(.08*n,.15*n,1.5*n,10),l);c.position.y=.75*n,c.castShadow=!0,a.add(c);let h=new U({color:s,roughness:.72}),u=[[0,1.65,0,.65],[-.36,1.42,.15,.48],[.38,1.45,-.1,.48],[0,1.95,.08,.44]];for(let[f,d,m,E]of u){let g=new y(new Ys(E*n,1),h);g.position.set(f*n,d*n,m*n),g.castShadow=!0,g.receiveShadow=!0,a.add(g)}i.add(a),o.animatedProps.push({object:a,kind:"sway",baseRotZ:0,phase:r,speed:1.1})}function Y0(i,e){let t=new U({color:7027244,roughness:.78}),n=new U({color:16103470,metalness:.82,roughness:.25}),s=new y(new Me(5.5,5.8,.25,36),t);s.position.y=-.125,s.receiveShadow=!0,i.add(s);let r=new y(new _n(1.4,1.55,48),new Ne({color:16103470,transparent:!0,opacity:.45,side:ft}));r.rotation.x=-Math.PI/2,r.position.y=.01,i.add(r);for(let f of[-2.4,-1.65,1.65,2.4]){let d=Math.abs(f)>2?-1.4:-2.6,m=new y(new Me(.14,.18,3.6,12),t);m.position.set(f,1.8,d),m.castShadow=!0,m.receiveShadow=!0,i.add(m);let E=new y(new Me(.24,.16,.18,12),n);E.position.set(f,3.5,d),i.add(E)}let o=new y(new j(1.5,.9,1.5),t);o.position.set(0,.45,-4.8),i.add(o);for(let f=0;f<3;f++){let d=1.25-f*.28,m=new y(new j(d,.48,d),t);m.position.set(0,1.1+f*.46,-4.8),i.add(m)}let a=new y(new Pe(.16,12,10),n);a.position.set(0,2.38,-4.8),i.add(a);let l=new y(new it(.08,.24,12),n);l.position.set(0,2.6,-4.8),i.add(l);for(let[f,d]of[[-1.35,0],[1.35,1.3]]){let m=new ue;m.position.set(f,3.35,-.6);let E=new y(new Me(.014,.014,.65,8),n);E.position.y=-.32,m.add(E);let g=new y(new it(.16,.25,16,1,!0),n);g.position.y=-.72,g.castShadow=!0,m.add(g),i.add(m),e.animatedProps.push({object:m,kind:"bell",baseRotZ:0,phase:d,speed:1.5})}let c=new ue;c.position.set(0,1.85,-3.1);let h=new y(new et(1.15,.025,10,48),n),u=new y(new et(.82,.022,10,36),n);c.add(h,u),i.add(c),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.35}),e.animatedProps.push({object:u,kind:"ring",phase:1.4,speed:-.52}),Jt(i,-1.25,0,-.5,.2,e,!0),Jt(i,1.25,0,-.5,1.9,e,!0),Jt(i,-.45,0,-1.4,3.1,e,!1),Jt(i,.45,0,-1.4,4.4,e,!1)}function q0(i,e){let t=new U({color:2507300,roughness:.92}),n=new y(new It(9,40),t);n.rotation.x=-Math.PI/2,n.receiveShadow=!0,i.add(n);let s=new ue;s.position.set(.1,0,-3.2);let r=new y(new Me(.95,1,1.05,18),new U({color:10251846,roughness:.85}));r.position.y=.52,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new y(new it(1.38,.95,20),new U({color:12558414,roughness:.9}));o.position.y=1.42,o.castShadow=!0,s.add(o);let a=new y(new tt(.42,.65),new Ne({color:16758605}));a.position.set(0,.34,.96),s.add(a),i.add(s),pr(i,-2.1,-1.8,1.45,3108407,.3,e),pr(i,2.2,-1.9,1.38,3635775,1.6,e),pr(i,-1.65,-3.9,1.65,2314793,2.8,e),pr(i,1.75,-4.1,1.55,2711344,4.1,e),Jt(i,0,0,-1.4,.5,e,!0)}function Z0(i,e){let t=new U({color:6047544,roughness:.8}),n=new y(new j(8,.3,2.6),t);n.position.set(0,-.15,0),n.receiveShadow=!0,i.add(n);let s=new y(new j(8,.2,.8),t);s.position.set(0,-.25,-1.6),i.add(s);let r=new U({color:1265263,metalness:.68,roughness:.22}),o=new y(new tt(18,10,24,16),r);o.rotation.x=-Math.PI/2,o.position.set(0,-.32,-6.5),o.receiveShadow=!0,i.add(o),e.animatedProps.push({object:o,kind:"water",phase:0,speed:1.8}),Jt(i,-1.1,0,-.9,.4,e,!0),Jt(i,1.1,0,-.9,2.1,e,!0),Jt(i,-.6,-.3,-2.5,3.4,e,!1),Jt(i,.7,-.3,-3.3,4.9,e,!1)}function J0(i,e,t){let n=new U({color:1053482,metalness:.7,roughness:.24}),s=new y(new Me(5.5,5.5,.2,48),n);s.position.y=-.1,s.receiveShadow=!0,i.add(s);let r=new Ne({color:t,transparent:!0,opacity:.75}),o=new U({color:16498468,metalness:.85,roughness:.2}),a=new ue;a.position.set(0,2,-3.4);let l=new y(new et(1.5,.025,10,64),o),c=new y(new et(1.08,.022,10,48),r);c.rotation.x=.7,a.add(l,c),i.add(a),e.animatedProps.push({object:l,kind:"ring",phase:.2,speed:.35}),e.animatedProps.push({object:c,kind:"ring",phase:1.5,speed:-.55});let h=new ue;h.position.set(0,2.75,-2.8);let u=new Ne({color:16774589,transparent:!0,opacity:0}),f=new y(new hn(.18,0),u),d=new y(new it(.95,3.6,24,1,!0),new Ne({color:16770180,transparent:!0,opacity:0,side:ft,depthWrite:!1,blending:wn}));d.position.y=-1.6,h.add(f,d),i.add(h),e.poleStarGroup=h,e.poleStarMat=d.material}function K0(i,e){let t=new U({color:6371360,roughness:.45,metalness:.1}),n=new y(new Me(5.2,5.4,.25,40),t);n.position.y=-.125,n.receiveShadow=!0,i.add(n);let s=new y(new j(8.5,4.5,.25),new U({color:4528676,roughness:.85}));s.position.set(0,2.1,-3.5),s.receiveShadow=!0,i.add(s);let r=new U({color:10033947,roughness:.8});for(let d of[-1,1])for(let m=0;m<3;m++){let E=new y(new Me(.24,.28,4.4,12),r);E.position.set(d*(2.2+m*.36),2.1,-2.8+m*.12),E.castShadow=!0,i.add(E)}let o=new U({color:14870768,metalness:.92,roughness:.15}),a=new y(new Me(.016,.024,1.18,8),o);a.position.set(0,.59,.58),a.castShadow=!0,i.add(a);let l=new y(new Me(.14,.15,.04,16),o);l.position.set(0,.02,.58),i.add(l);let c=new y(new Pe(.055,12,10),o);c.position.set(0,1.21,.58),i.add(c);let h=new y(new et(.65,.028,10,40),new Ne({color:16486972}));h.position.set(0,2.25,-3.3),i.add(h);let u=new wi(16638023,4.2,12,.42,.55,1.2);u.position.set(-1.6,4.2,2.2),i.add(u,u.target),e.animatedProps.push({object:u,kind:"spotlight",phase:0,speed:1.3});let f=new wi(16020150,3.6,12,.42,.55,1.2);f.position.set(1.6,4.2,2.2),i.add(f,f.target),e.animatedProps.push({object:f,kind:"spotlight",phase:1.7,speed:1.5})}function $0(i,e){let t=new U({color:2959666,roughness:.9}),n=new y(new tt(14,14),t);n.rotation.x=-Math.PI/2,n.receiveShadow=!0,i.add(n);let s=new U({color:8145446,roughness:.72}),r=new ue;r.position.set(0,0,-2);let o=new y(new j(2.1,.85,.7),s);o.position.y=.425,o.castShadow=!0,o.receiveShadow=!0,r.add(o);for(let f of[-.98,.98]){let d=new y(new j(.08,2.15,.08),s);d.position.set(f,1.075,-.25),r.add(d)}let a=new y(new j(2.4,.08,1.1),new U({color:14251782,roughness:.75}));a.position.set(0,2.15,.05),a.rotation.x=.2,a.castShadow=!0,r.add(a);let l=new U({color:16096779,metalness:.75,roughness:.25}),c=new y(new Pe(.14,14,12),l);c.position.set(-.35,.98,.05),r.add(c);let h=new U({color:11817737,roughness:.85});for(let f of[.1,.28,.46]){let d=new y(new Me(.05,.035,.09,12),h);d.position.set(f,.9,.08),r.add(d)}for(let f=0;f<4;f++){let d=new y(new Pe(.06,8,8),new Ne({color:16708551,transparent:!0,opacity:.28,depthWrite:!1}));d.position.set(-.35+f%2*.06,1.18+f*.14,.05),r.add(d),e.animatedProps.push({object:d,kind:"steam",baseY:1.16,phase:f*1.4,speed:1.8})}e.spots.counter={x:.25,y:0,z:-.9,rotY:.12};let u=new tn(16758605,2.6,7,1.5);u.position.set(0,1.88,.25),r.add(u),e.ambientFireLights.push({light:u,baseIntensity:2.6,phase:.4}),i.add(r)}function Q0(i,e){let t=new y(new It(9,32),new U({color:13358561,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t);let n=new U({color:3359061,roughness:.82}),s=new U({color:15857145,roughness:.55}),r=[[-2.4,-4.5,2.6,1.8],[0,-5.6,3.8,2.3],[2.5,-4.4,2.4,1.7]];for(let[o,a,l,c]of r){let h=new y(new it(c,l,7),n);h.position.set(o,l*.5-.1,a),i.add(h);let u=new y(new it(c*.45,l*.42,7),s);u.position.set(o,l*.78-.1,a),i.add(u)}Jt(i,0,0,-1.1,.8,e,!0)}function j0(i,e){let t=new U({color:15127221,roughness:.72}),n=new U({color:13284758,roughness:.58}),s=new U({color:16041038,metalness:.85,roughness:.22}),r=new U({color:7017510,roughness:.8}),o=new U({color:2822922,emissive:14251782,emissiveIntensity:.42,roughness:.6}),a=new y(new It(10.5,48),n);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,i.add(a);let l=new y(new j(8.8,.06,5.2),t);l.position.set(0,-.02,-.6),l.receiveShadow=!0,i.add(l);let c=new y(new j(3.75,.016,2.35),s);c.position.set(0,.012,.15),c.receiveShadow=!0,i.add(c);let h=new y(new j(3.45,.022,2.08),r);h.position.set(0,.015,.15),h.receiveShadow=!0,i.add(h);let u=new y(new j(10.8,4.4,.28),n);u.position.set(0,2.2,-3.55),u.receiveShadow=!0,i.add(u);let f=new y(new j(10.4,.24,.72),t);f.position.set(0,.12,-2.55),f.receiveShadow=!0,i.add(f);let d=[-3.6,-1.25,1.25,3.6];for(let g of d){let p=new y(new j(.42,.34,.42),t);p.position.set(g,.26,-2.55),p.castShadow=!0,i.add(p);let _=new y(new Me(.15,.17,2.75,14),t);_.position.set(g,1.78,-2.55),_.castShadow=!0,i.add(_);let v=new y(new j(.46,.22,.46),s);v.position.set(g,3.2,-2.55),i.add(v)}let m=[-2.42,0,2.42];for(let g=0;g<m.length;g++){let p=m[g],_=g===1?2.42:2.28,v=new y(new j(_,.65,.26),t);v.position.set(p,3.55,-2.55),v.castShadow=!0,i.add(v);let x=new y(new et(.88,.065,8,20,Math.PI),t);x.position.set(p,2.52,-2.52),i.add(x);let b=new y(new j(1.18,1.72,.08),s);b.position.set(p,1.56,-3.38),i.add(b);let R=new y(new j(1.02,1.56,.1),o);R.position.set(p,1.56,-3.35),i.add(R);for(let P of[-1,1]){let T=new y(new Me(.09,.14,1.95,10),r);T.position.set(p+P*.54,1.55,-3.28),T.rotation.z=P*.06,i.add(T)}let A=new y(new j(1.22,.56,.12),o);A.position.set(p,3.12,-3.32),i.add(A)}let E=[-2.18,2.18];for(let g=0;g<E.length;g++){let p=E[g],_=-.35,v=new ue;v.position.set(p,0,_);let x=new y(new Me(.1,.22,.16,14),s);x.position.y=.08,v.add(x);let b=new y(new Me(.025,.036,1.18,10),s);b.position.y=.74,b.castShadow=!0,v.add(b);for(let[A,P]of[[-.14,0],[.14,0],[0,.12],[0,-.1]]){let T=new y(new Me(.042,.024,.05,8),s);T.position.set(A,1.34,P),v.add(T);let M=new y(new it(.022,.09,8),new Ne({color:16707722}));M.position.set(A,1.4,P),v.add(M),e.animatedProps.push({object:M,kind:"diya",phase:g*1.4+A*3,speed:12.5})}let R=new tn(16757844,1.9,6.2,1.6);R.position.set(0,1.48,0),v.add(R),e.ambientFireLights.push({light:R,baseIntensity:1.9,phase:g*1.7}),i.add(v)}Jt(i,-1.65,.24,-2.2,.3,e,!1),Jt(i,1.65,.24,-2.2,1.9,e,!0)}function eg(i,e,t,n){if(e==="ModernCity"){let l=new y(new tt(24,24),new U({color:593183,roughness:.35,metalness:.6}));l.rotation.x=-Math.PI/2,l.receiveShadow=!0,i.add(l);let c=new ns(20,28,new _e(n),1976635);c.position.y=.01,i.add(c);let h=new y(new hn(.55,0),new U({color:n,wireframe:!0,emissive:n,emissiveIntensity:.6}));h.position.set(0,1.9,-2.5),i.add(h),t.animatedProps.push({object:h,kind:"ring",phase:0,speed:.6});return}let s=e==="PalaceCourt"?6038067:e==="Battlefield"?4140322:4535592,r=new y(new It(8.5,36),new U({color:s,roughness:.78}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,i.add(r);let o=e==="PalaceCourt"?14264170:e==="Archive"?6898214:7033664,a=new U({color:o,roughness:.72});for(let l of[-2.1,2.1]){let c=new y(new j(.35,3.4,.35),a);c.position.set(l,1.7,-2.4),c.castShadow=!0,i.add(c)}Jt(i,-1.5,0,-1.2,.4,t,!0),Jt(i,1.5,0,-1.2,2,t,!0)}function tg(i,e,t){let n=new U({color:1976635,roughness:.35,metalness:.55}),s=new U({color:t%2===0?2282478:11032055,emissive:959977,emissiveIntensity:.55}),r=new y(new j(3.8,.22,9.5),n);r.position.set(0,-.11,-1.5),r.receiveShadow=!0,i.add(r);for(let c of[-1.85,1.85]){let h=new y(new j(.12,.25,9.5),s);h.position.set(c,-.09,-1.5),i.add(h)}let o=[[-1.08,2282478],[1.08,16007006]];for(let c=0;c<o.length;c++){let[h,u]=o[c],f=new ue;f.position.set(h,1.15,-2.5);let d=new y(new et(.75,.08,12,32),new U({color:u,emissive:u,emissiveIntensity:.85,roughness:.2}));f.add(d);let m=new y(new It(.7,24),new Ne({color:u,transparent:!0,opacity:.24,side:ft}));f.add(m),i.add(f),e.animatedProps.push({object:d,kind:"portal",phase:c*1.4,speed:1.6})}let a=new U({color:16317180,roughness:.9});for(let c=0;c<6;c++){let h=(c-2.5)*2.1,u=-1.2+c%2*.45,f=new y(new Pe(.95+c%3*.25,12,10),a);f.scale.set(1.8,.55,1.1),f.position.set(h,u,-5.2-c%2*1.2),i.add(f)}let l=new y(new Me(.14,.14,1.6,12),new U({color:16436245,roughness:.35}));l.rotation.z=Math.PI/2,l.position.set(0,.35,-1),i.add(l),e.animatedProps.push({object:l,kind:"hazard",phase:0,speed:1.9})}function ng(i,e){let t=new U({color:10576438,roughness:.92}),n=new y(new It(11,36),t);n.rotation.x=-Math.PI/2,n.receiveShadow=!0,i.add(n);let s=new U({color:8142627,roughness:.88});for(let[l,c,h,u]of[[-3.4,-4.6,2.2,1.4],[.4,-5.8,2.8,1.9],[3.5,-4.3,2,1.3]]){let f=new y(new Me(u*.72,u,h,8),s);f.position.set(l,h*.5-.1,c),f.castShadow=!0,i.add(f)}let r=new U({color:12753761,roughness:.85});for(let l=-2;l<=2;l++){let c=new y(new wt(.18,.34,6,8),r);c.rotation.z=Math.PI/2,c.position.set(l*.56,.18,-2.3),c.castShadow=!0,i.add(c)}let o=new U({color:16436245,roughness:.5});for(let l of[-2.2,2.2]){let c=new y(new it(.22,.58,12),o);c.position.set(l,.29,-1.6),c.castShadow=!0,i.add(c)}let a=new tn(16347926,2.4,8,1.5);a.position.set(0,1.4,-2.6),i.add(a),e.ambientFireLights.push({light:a,baseIntensity:2.4,phase:.6})}function ig(i,e,t){let n=new U({color:15857145,roughness:.55}),s=new U({color:t%2===0?3359061:4988309,roughness:.55});for(let f=-4;f<=4;f++)for(let d=-3;d<=3;d++){let m=new y(new j(.98,.06,.98),(f+d)%2===0?n:s);m.position.set(f,-.03,d),m.receiveShadow=!0,i.add(m)}let r=new U({color:t%3===0?5195493:t%3===1?1013358:11817737,roughness:.78});for(let f of[-2.45,2.45]){let d=new y(new j(3.4,4.2,.25),r);d.position.set(f,2.1,-2.8),d.receiveShadow=!0,i.add(d)}let o=new y(new j(1.7,1.4,.25),r);o.position.set(0,3.5,-2.8),i.add(o);let a=new U({color:8138002,roughness:.6});for(let f of[-.78,.78]){let d=new y(new j(.14,2.85,.34),a);d.position.set(f,1.425,-2.8),i.add(d)}let l=new y(new j(1.72,.16,.36),a);l.position.set(0,2.86,-2.8),i.add(l);let c=new ue;c.position.set(-.7,0,-2.76);let h=new y(new j(1.38,2.75,.08),new U({color:14251782,roughness:.5}));h.position.set(.69,1.375,0),h.castShadow=!0,c.add(h);let u=new y(new Pe(.08,12,10),new U({color:16436245,metalness:.85,roughness:.2}));u.position.set(1.22,1.25,.07),c.add(u),i.add(c),e.animatedProps.push({object:c,kind:"door",phase:.3,speed:2.2})}function oi(i,e){let t=e.width??12.6,n=e.height??5.4,s=e.backZ??-2.9,r=e.depth??10.5,o=new U({color:e.backColor,roughness:.82}),a=new U({color:e.sideColor??e.backColor,roughness:.84}),l=new y(new j(t,n,.18),o);l.position.set(0,n*.5,s),l.receiveShadow=!0,i.add(l);let c=new y(new j(.18,n,r),a);c.position.set(-t*.5+.09,n*.5,s+r*.5-.1),c.receiveShadow=!0,i.add(c);let h=new y(new j(.18,n,r),a);h.position.set(t*.5-.09,n*.5,s+r*.5-.1),h.receiveShadow=!0,i.add(h);let u=e.trimColor??4674921,f=new U({color:u,roughness:.65}),d=new y(new j(t,.16,.22),f);d.position.set(0,.08,s+.04),i.add(d);let m=new y(new j(t,.35,r),f);m.position.set(0,n+.1,s+r*.5-.1),i.add(m);let E=new y(new j(t,n,.2),o);E.position.set(0,n*.5,s+r-.15),i.add(E);let g=new y(new j(t,.72,.22),f);return g.position.set(0,.36,s+r-.16),i.add(g),o}function sg(i,e){let t=new U({color:6044968,roughness:.78}),n=new y(new tt(14,14),t);n.rotation.x=-Math.PI/2,n.receiveShadow=!0,i.add(n);let s=new y(new j(3.6,.02,2.6),new U({color:10424889,roughness:.88}));s.position.set(0,.01,-.4),s.receiveShadow=!0,i.add(s),oi(i,{backColor:3878738,sideColor:3221063,trimColor:6044968,backZ:-2.9});let r=new tn(14412542,2.2,9.5,1.3);r.position.set(.75,2.65,.65),i.add(r),e.ambientFireLights.push({light:r,baseIntensity:2.2,phase:.1});let o=new y(new j(1.5,1.55,.08),new U({color:8145446,roughness:.65}));o.position.set(1.15,2.25,-2.78),i.add(o);let a=new y(new tt(1.28,1.32),new Ne({color:12248829}));a.position.set(1.15,2.25,-2.73),i.add(a);let l=new U({color:7877903,roughness:.62}),c=new ue;c.position.set(-.88,0,-.58);let h=new y(new j(1.52,.14,2.1),l);h.position.y=.24,h.castShadow=!0,h.receiveShadow=!0,c.add(h);for(let[_,v]of[[-.68,-.95],[.68,-.95],[-.68,.95],[.68,.95]]){let x=new y(new Me(.055,.045,.26,8),l);x.position.set(_,.13,v),x.castShadow=!0,c.add(x)}let u=new y(new j(1.54,.72,.1),l);u.position.set(0,.56,-1),u.castShadow=!0,c.add(u);let f=new y(new j(1.42,.16,1.94),new U({color:16708551,roughness:.8}));f.position.set(0,.38,.02),f.receiveShadow=!0,c.add(f);let d=new y(new j(1.44,.18,1.24),new U({color:15357964,roughness:.75}));d.position.set(0,.39,.34),d.castShadow=!0,c.add(d);let m=new y(new j(1.04,.14,.42),new U({color:16777215,roughness:.68}));m.position.set(0,.51,-.72),c.add(m),i.add(c);let E=new y(new j(.55,.52,.52),l);E.position.set(-1.98,.26,-.82),E.castShadow=!0,i.add(E);let g=new y(new it(.18,.24,16,1,!0),new U({color:16638023,emissive:16096779,emissiveIntensity:.55,side:ft}));g.position.set(-1.98,.72,-.82),i.add(g);let p=new tn(16758605,2.4,6.5,1.5);p.position.set(-1.98,.66,-.82),i.add(p),e.ambientFireLights.push({light:p,baseIntensity:2.4,phase:.7}),e.spots.bed={x:-.88,y:.47,z:.16,rotY:.16},e.spots.door={x:1.45,y:0,z:-1.35,rotY:-.35}}function rg(i,e){let t=new y(new tt(14,14),new U({color:4141901,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t);let n=new y(new j(4,.02,2.8),new U({color:1013358,roughness:.86}));n.position.set(0,.01,-.2),n.receiveShadow=!0,i.add(n),oi(i,{backColor:3359061,sideColor:2503236,trimColor:7027230,backZ:-2.95});let s=new U({color:14251782,roughness:.7}),r=new U({color:16707722,roughness:.68}),o=new ue;o.position.set(-.78,0,-.95);let a=new y(new j(1.9,.36,.85),s);a.position.y=.22,a.castShadow=!0,a.receiveShadow=!0,o.add(a);let l=new y(new j(1.9,.68,.22),s);l.position.set(0,.56,-.34),l.castShadow=!0,o.add(l);for(let p of[-.92,.92]){let _=new y(new j(.18,.48,.86),s);_.position.set(p,.38,0),o.add(_)}let c=new y(new j(.32,.28,.14),r);c.position.set(-.55,.48,-.14),c.rotation.z=.18,o.add(c),i.add(o);let h=new U({color:7027230,roughness:.55}),u=new y(new j(1.15,.08,.65),h);u.position.set(.08,.34,.12),u.castShadow=!0,i.add(u);let f=new y(new Me(.14,.09,.08,16),new U({color:16317180,roughness:.35}));f.position.set(.08,.42,.12),i.add(f);let d=new y(new j(1.1,.78,.06),h);d.position.set(-.7,2.15,-2.84),i.add(d);let m=new y(new tt(.92,.62),new U({color:16498468,roughness:.5}));m.position.set(-.7,2.15,-2.8),i.add(m);let E=new ue;E.position.set(1.25,0,-2.7);let g=new y(new j(.95,2.25,.08),h);g.position.set(.475,1.125,0),g.castShadow=!0,E.add(g),i.add(E),e.animatedProps.push({object:E,kind:"door",phase:.4,speed:.85}),e.spots.sofa={x:-.78,y:.38,z:-.74,rotY:.25},e.spots.door={x:1.45,y:0,z:-1.4,rotY:-.4}}function og(i,e){let t=new y(new tt(14,14),new U({color:3359061,roughness:.6}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t);let n=new ns(12,16,9741240,4674921);n.position.y=.01,i.add(n),oi(i,{backColor:10105874,sideColor:8138002,trimColor:16639626,backZ:-2.85});let s=new y(new j(6.8,.92,.05),new U({color:16708551,roughness:.55}));s.position.set(0,1.32,-2.74),i.add(s);let r=new U({color:4674921,roughness:.55}),o=new U({color:14870768,roughness:.3}),a=new y(new j(3.2,.88,.9),r);a.position.set(0,.44,-1.45),a.castShadow=!0,a.receiveShadow=!0,i.add(a);let l=new y(new j(3.28,.07,.96),o);l.position.set(0,.91,-1.45),i.add(l);let c=new Ne({color:3718648}),h=new y(new et(.18,.025,8,20),c);h.rotation.x=Math.PI/2,h.position.set(-.22,.96,-1.4),i.add(h),e.animatedProps.push({object:h,kind:"diya",phase:0,speed:9});let u=new U({color:14251782,metalness:.72,roughness:.25}),f=new y(new Me(.32,.22,.26,20),u);f.position.set(-.22,1.1,-1.4),f.castShadow=!0,i.add(f);let d=new y(new It(.3,20),new U({color:16708551,roughness:.28}));d.rotation.x=-Math.PI/2,d.position.set(-.22,1.22,-1.4),i.add(d);for(let g=0;g<5;g++){let p=new y(new Pe(.075,8,8),new Ne({color:16777215,transparent:!0,opacity:.3,depthWrite:!1}));p.position.set(-.22+(g%3-1)*.08,1.32+g*.14,-1.4),i.add(p),e.animatedProps.push({object:p,kind:"steam",baseY:1.28,phase:g*1.1,speed:1.7})}let m=new y(new j(2.6,.08,.32),new U({color:7877903,roughness:.65}));m.position.set(0,1.85,-2.6),i.add(m);for(let g=-2;g<=2;g++){let p=[15680580,16096779,2278750,3900150,15381256][g+2],_=new y(new Me(.075,.075,.22,12),new U({color:p,roughness:.35}));_.position.set(g*.42,2,-2.58),i.add(_)}let E=new tn(16775149,3.3,9.5,1.25);E.position.set(0,2.75,.45),i.add(E),e.ambientFireLights.push({light:E,baseIntensity:3.3,phase:.2}),e.spots.counter={x:-.42,y:0,z:-.68,rotY:.3},e.spots.door={x:1.35,y:0,z:-1.15,rotY:-.45}}function mr(i,e,t,n,s,r,o="#0f172a",a="#f59e0b"){let l=document.createElement("canvas");l.width=512,l.height=192;let c=l.getContext("2d");c.fillStyle=o,c.fillRect(0,0,512,192),c.strokeStyle=a,c.lineWidth=10,c.strokeRect(10,10,492,172),c.fillStyle=a,c.font="bold 42px sans-serif",c.textAlign="center",c.fillText(e,256,86),c.fillStyle="#e2e8f0",c.font="600 24px sans-serif",c.fillText(t,256,138);let h=new yi(l);h.colorSpace=Lt;let u=new y(new j(1.48,.56,.05),new U({color:1976635,roughness:.45,metalness:.4}));u.position.set(n,s,r-.02),i.add(u);let f=new y(new tt(1.38,.48),new Ne({map:h}));f.position.set(n,s,r+.01),i.add(f)}function ag(i,e){let t=new y(new tt(14,14),new U({color:4860970,roughness:.75}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t),oi(i,{backColor:8138002,sideColor:6037518,trimColor:16096779,backZ:-2.9}),mr(i,"MITHAI & KESHAV","FRESH SHAHI HALWAI",0,2.75,-2.76,"#431407","#fbbf24");let n=new U({color:8138002,roughness:.58}),s=new y(new j(2.8,.92,.85),n);s.position.set(0,.46,-1.45),s.castShadow=!0,s.receiveShadow=!0,i.add(s);let r=new U({color:14870768,metalness:.85,roughness:.2}),o=new U({color:16096779,roughness:.45}),a=new U({color:16708551,roughness:.38});for(let h of[-.65,0,.65]){let u=new y(new j(.52,.04,.48),r);u.position.set(h,.94,-1.42),i.add(u);for(let f=-.14;f<=.15;f+=.14)for(let d=-.1;d<=.12;d+=.14){let m=h===0?new y(new j(.11,.08,.11),a):new y(new Pe(.06,10,8),o);m.position.set(h+f,1,-1.42+d),i.add(m)}}let l=new y(new j(3.2,.1,1.2),new U({color:15357964,roughness:.65}));l.position.set(0,2.35,-1.35),l.rotation.x=.18,i.add(l);for(let h=-5;h<=5;h++){let u=new y(new Pe(.075,10,8),new U({color:h%2===0?16096779:16436245,roughness:.6}));u.position.set(h*.28,2.15-Math.cos(h*.35)*.14,-.82),i.add(u)}let c=new tn(16758605,3,8,1.4);c.position.set(0,2.15,-1),i.add(c),e.ambientFireLights.push({light:c,baseIntensity:3,phase:.5}),e.spots.counter={x:.38,y:0,z:-.62,rotY:.22}}function ru(i,e,t,n,s,r,o,a,l=512,c=256){let h=new ue;h.position.set(n,s,r),h.rotation.y=o;let u=new y(new j(e+.2,t+.2,.08),a);u.position.z=-.045,h.add(u);let f=new fr(new tt(e,t),{clipBias:.003,textureWidth:l,textureHeight:c,color:14412542,multisample:0});f.position.z=.002,h.add(f);let d=new y(new tt(.07,t*.92),new Ne({color:16777215,transparent:!0,opacity:.16}));d.position.set(-e*.34,0,.006),d.rotation.z=-.35,h.add(d),i.add(h)}function lg(i,e){let t=new U({color:3359061,roughness:.42,metalness:.12}),n=new U({color:6583435,roughness:.45,metalness:.08}),s=new y(new tt(14,14),t);s.rotation.x=-Math.PI/2,s.receiveShadow=!0,i.add(s);for(let O=-4;O<=4;O++)for(let he=-4;he<=3;he++){if((O+he)%2!==0)continue;let re=new y(new tt(.95,.95),n);re.rotation.x=-Math.PI/2,re.position.set(O*1,.004,he*1),re.receiveShadow=!0,i.add(re)}oi(i,{backColor:16051425,sideColor:15129288,trimColor:1013358,backZ:-2.9});let r=new y(new j(12.6,1.02,.21),new U({color:1013358,roughness:.45}));r.position.set(0,.51,-2.86),i.add(r),mr(i,"SHAHI SALON","KESHAV STUDIO \u2022 VIP CUTS",2.34,2.26,-2.75,"#0f172a","#f59e0b"),mr(i,"STYLE CHART","1. BAHUBALI  2. FADE  3. KATORA",2.34,1.64,-2.75,"#1e293b","#38bdf8");let o=new U({color:14870768,metalness:.88,roughness:.16});ru(i,3.25,1.38,-.25,1.92,-2.7,0,o,512,256);let a=new y(new Me(.032,.032,.65,10),o);a.rotation.z=Math.PI/2,a.position.set(-2.5,1.62,-.88),i.add(a),ru(i,1.42,1.18,-2.14,1.62,-.78,1.04,o,384,320);let l=new y(new j(2.8,.08,.14),new Ne({color:16776171}));l.position.set(-.25,2.78,-2.7),i.add(l);let c=new tn(16776171,3.2,9.5,1.3);c.position.set(-.25,2.65,-1.25),i.add(c);let h=new y(new j(3.6,.08,.22),new Ne({color:16708551}));h.position.set(0,3.85,1.2),i.add(h);let u=new U({color:1013358,roughness:.48}),f=new y(new j(6.4,1.2,.12),u);f.position.set(0,1.85,7.25),i.add(f);let d=new y(new j(2.6,.015,2.2),new U({color:1013358,roughness:.9}));d.position.set(-.55,.008,-.78),d.receiveShadow=!0,i.add(d);let m=new ue;m.position.set(3.48,1.68,-2.55);let E=new y(new Me(.11,.11,.92,16),new U({color:16317180,roughness:.25}));m.add(E),[14427686,2450411,14427686].forEach((O,he)=>{let re=new y(new et(.112,.028,8,18),new U({color:O,roughness:.3}));re.rotation.x=Math.PI/2+.42,re.position.y=-.26+he*.26,m.add(re)});let g=new U({color:13948120,metalness:.85,roughness:.2});for(let O of[-.5,.5]){let he=new y(new Pe(.125,12,10),g);he.position.y=O,m.add(he)}i.add(m),e.animatedProps.push({object:m,kind:"hazard",phase:0,speed:3.2});let p=new y(new j(.75,.72,.56),new U({color:16317180,roughness:.32}));p.position.set(-2.98,.36,-2.42),i.add(p);let _=new y(new Me(.28,.2,.18,16),new U({color:16777215,roughness:.22}));_.position.set(-2.98,.78,-2.38),i.add(_);let v=new y(new Me(.02,.02,.24,8),o);v.position.set(-2.98,.92,-2.58),i.add(v);let x=new y(new j(3.3,.08,.36),new U({color:7029795,roughness:.6}));x.position.set(-.25,1.02,-2.6),i.add(x),[14753096,959977,16096779,1096065,9133302].forEach((O,he)=>{let re=new y(new Me(.055,.055,.22,10),new U({color:O,roughness:.3}));re.position.set(-1.2+he*.48,1.17,-2.55),i.add(re)});let b=new ue;b.position.set(.96,0,-1.26);let R=new y(new j(.46,.8,.36),new U({color:1976635,roughness:.5}));R.position.y=.42,b.add(R);let A=new y(new j(.5,.05,.4),o);A.position.y=.84,b.add(A);let P=new y(new Me(.04,.052,.16,10),new U({color:959977,roughness:.3}));P.position.set(-.14,.94,.04),b.add(P);let T=new y(new j(.05,.05,.14),o);T.position.set(0,.89,.06),b.add(T),[16708551,14742270].forEach((O,he)=>{let re=new y(new j(.2,.055,.22),new U({color:O,roughness:.85}));re.position.set(.11,.895+he*.056,-.02),b.add(re)}),i.add(b);let M=new ue;M.position.set(-.44,0,-.78),M.rotation.y=.2;let H=new U({color:12131356,roughness:.42}),B=new y(new Me(.36,.4,.08,18),o);B.position.y=.04,M.add(B);let F=new y(new Me(.08,.1,.42,12),o);F.position.y=.25,M.add(F);let k=new y(new j(.76,.16,.72),H);k.position.y=.46,k.castShadow=!0,M.add(k);let V=new y(new j(.74,.76,.14),H);V.position.set(0,.84,-.32),V.rotation.x=-.14,V.castShadow=!0,M.add(V);for(let O of[-.41,.41]){let he=new y(new j(.08,.08,.62),o);he.position.set(O,.68,0),M.add(he)}let W=new y(new j(.46,.05,.22),o);W.position.set(0,.22,.48),M.add(W),i.add(M);let le=new y(new j(1.9,.42,.68),new U({color:2450411,roughness:.6}));le.position.set(1.76,.21,-1.68),le.castShadow=!0,i.add(le),e.spots.sofa={x:-.44,y:.28,z:-.66,rotY:.18},e.spots.counter={x:.34,y:0,z:-.96,rotY:-.36},e.spots.door={x:1.76,y:0,z:-1.45,rotY:-.35}}function cg(i,e){let t=new y(new tt(14,14),new U({color:4927003,roughness:.68}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t);let n=new U({color:7029795,roughness:.62});oi(i,{backColor:7029795,sideColor:5715482,trimColor:9584654,backZ:-2.9}),mr(i,"SATYAMEVA JAYATE","KESHAV DISTRICT COURT",0,3.05,-2.76,"#451a03","#f59e0b");let s=new y(new j(3.4,1.25,1),n);s.position.set(0,.62,-1.9),s.castShadow=!0,i.add(s);let r=new y(new et(.32,.04,10,24),new U({color:16096779,metalness:.85,roughness:.2}));r.position.set(0,2.4,-2.76),i.add(r);let o=new y(new j(1.1,.92,.9),n);o.position.set(-.95,.46,-.55),o.castShadow=!0,i.add(o),e.spots.sofa={x:0,y:.42,z:-1.45,rotY:.08},e.spots.counter={x:-.95,y:.1,z:-.35,rotY:.38}}function hg(i,e){let t=new y(new tt(14,14),new U({color:14412542,roughness:.52}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t),oi(i,{backColor:16317180,sideColor:14870768,trimColor:165063,backZ:-2.9}),mr(i,"CITY CLINIC","DR. DIAGNOSTICS \u2022 OPD 1",2.25,2.35,-2.75,"#0c4a6e","#38bdf8");let n=new Ne({color:15680580}),s=new y(new j(.22,.72,.05),n);s.position.set(0,2.35,-2.78),i.add(s);let r=new y(new j(.72,.22,.05),n);r.position.set(0,2.35,-2.78),i.add(r);let o=new y(new j(1.8,.52,.88),new U({color:959977,roughness:.6}));o.position.set(-.95,.26,-.88),o.castShadow=!0,i.add(o);let a=new y(new j(1.4,.75,.72),new U({color:6583435,roughness:.5}));a.position.set(.85,.38,-.85),a.castShadow=!0,i.add(a),e.spots.bed={x:-.95,y:.52,z:-.82,rotY:.32},e.spots.sofa={x:.85,y:0,z:-.45,rotY:-.35}}function ug(i,e){let t=new y(new tt(14,14),new U({color:7887420,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t),oi(i,{backColor:16708551,sideColor:16639626,trimColor:7877903,backZ:-2.9});let n=new y(new j(4.2,1.55,.08),new U({color:7877903,roughness:.6}));n.position.set(0,1.95,-2.78),i.add(n);let s=new y(new tt(3.95,1.32),new U({color:1332013,roughness:.9}));s.position.set(0,1.95,-2.73),i.add(s);let r=[16750899,16777215,1280008];for(let a=-5;a<=5;a++){let l=new y(new it(.11,.22,4),new U({color:r[(a+5)%3],roughness:.5}));l.rotation.x=Math.PI,l.position.set(a*.42,3.05-Math.cos(a*.28)*.16,-1.6),i.add(l),e.animatedProps.push({object:l,kind:"sway",phase:a*.4,speed:2.1})}let o=new y(new j(.9,.85,.65),new U({color:7877903,roughness:.6}));o.position.set(-.85,.42,-.75),i.add(o),e.spots.sofa={x:.8,y:0,z:-.45,rotY:-.4},e.spots.counter={x:-.85,y:0,z:-.45,rotY:.35}}function dg(i,e){let t=new y(new tt(14,14),new U({color:593188,roughness:.35,metalness:.3}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t);let n=new Ne({color:3718648}),s=new y(new et(2.15,.06,12,48),n);s.rotation.x=Math.PI/2,s.position.set(0,.04,0),i.add(s),e.animatedProps.push({object:s,kind:"ring",phase:0,speed:.4});let r=new y(new et(2.7,.08,12,48),new Ne({color:11032055}));r.position.set(0,1.9,-2.5),i.add(r),e.animatedProps.push({object:r,kind:"portal",phase:.4,speed:.8});let o=new U({color:1976635,metalness:.55,roughness:.3});[-.95,.95].forEach(l=>{let c=new y(new Me(.38,.44,.82,16),o);c.position.set(l,.41,-.35),c.castShadow=!0,i.add(c)});let a=new wi(3718648,8.5,16,Math.PI/5,.4);a.position.set(0,4.6,1.5),i.add(a),i.add(a.target),e.animatedProps.push({object:a,kind:"spotlight",phase:0,speed:1.5})}function fg(i,e){let t=new y(new tt(14,14),new U({color:7041664,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,i.add(t);let n=new U({color:10105874,roughness:.82}),s=new U({color:16708551,roughness:.55}),r=new Ne({color:16638023});[-2.6,2.6].forEach(h=>{let u=new y(new j(3,2.2,.28),n);u.position.set(h,1.1,-2.4),u.castShadow=!0,i.add(u)}),[-1.08,1.08].forEach(h=>{let u=new y(new j(.38,2.55,.38),n);u.position.set(h,1.28,-2.35),u.castShadow=!0,i.add(u);let f=new y(new j(.46,.12,.46),s);f.position.set(h,2.58,-2.35),i.add(f);let d=new y(new Pe(.11,10,8),r);d.position.set(h,2.74,-2.35),i.add(d)});let o=new ue;o.position.set(-.92,0,-2.35);let a=new U({color:1976635,metalness:.65,roughness:.35});for(let h of[.35,1.85]){let u=new y(new j(1.84,.08,.08),a);u.position.set(.92,h,0),o.add(u)}for(let h=0;h<=7;h++){let u=new y(new Me(.025,.025,2.05,8),a);u.position.set(.08+h*.24,1.05,0),u.castShadow=!0,o.add(u)}let l=new y(new j(.14,.16,.08),new U({color:16096779,metalness:.85,roughness:.2}));l.position.set(1.72,1.12,.08),o.add(l),i.add(o),e.animatedProps.push({object:o,kind:"door",phase:.1,speed:.7});let c=new y(new Me(.09,.11,3.8,12),new U({color:4674921,metalness:.5,roughness:.5}));c.position.set(2.15,1.9,-1.6),i.add(c),pr(i,-2.75,-1.25,1.05,1409085,.3,e),e.spots.door={x:0,y:0,z:-1.35,rotY:.1}}function ou(i,e,t,n,s){let{top:r,mid:o,bot:a,sunColor:l,sunIntensity:c,fogDensity:h}=X0(n,e.palette);i.fog=new Bs(o,h);let u=new Pe(28,32,20),f=new Bt({side:Ft,depthWrite:!1,uniforms:{uTop:{value:new _e(r)},uMid:{value:new _e(o)},uBot:{value:new _e(a)}},vertexShader:`
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
    `}),d=new y(u,f);i.add(d);let m=new Ks(l,a,.85);i.add(m);let E=new ts(l,c);E.position.set(2.8,5.2,3.8),E.castShadow=!0,E.shadow.mapSize.set(1024,1024),E.shadow.camera.near=.5,E.shadow.camera.far=16,E.shadow.camera.left=-4,E.shadow.camera.right=4,E.shadow.camera.top=4,E.shadow.camera.bottom=-4,E.shadow.bias=-8e-4,i.add(E);let g=new ts(e.palette.secondaryHex,.65);g.position.set(-3,3.4,-3.5),i.add(g);let p=new ue;i.add(p);let _={group:p,skyMaterial:f,keyLight:E,hemiLight:m,ambientFireLights:[],animatedProps:[],backdropTextures:s,spots:{}};if(s.length>0){let v=new y(new tt(14,14),new Mi({opacity:.42}));v.rotation.x=-Math.PI/2,v.receiveShadow=!0,p.add(v);let x=e.width/e.height,b=6.2,R=b*x,A=new y(new tt(R,b),new Ne({map:s[0],depthWrite:!1}));return A.position.set(0,1.32,-2.1),p.add(A),_.backdropMesh=A,_}switch(t){case"Temple":Y0(p,_);break;case"ForestAshram":q0(p,_);break;case"RiverGhat":Z0(p,_);break;case"Cosmos":J0(p,_,e.palette.primaryHex);break;case"ComedyStage":K0(p,_);break;case"ChaiStall":$0(p,_);break;case"SkyGauntlet":tg(p,_,e.uniqueVariant??e.seed??0);break;case"TankArena":ng(p,_);break;case"DoorwaySet":ig(p,_,e.uniqueVariant??e.seed??0);break;case"Himalaya":Q0(p,_);break;case"PalaceCourt":j0(p,_);break;case"Bedroom":sg(p,_);break;case"LivingRoom":rg(p,_);break;case"Kitchen":og(p,_);break;case"SweetShop":ag(p,_);break;case"BarberShop":lg(p,_);break;case"Courtroom":cg(p,_);break;case"DoctorClinic":hg(p,_);break;case"Classroom":ug(p,_);break;case"QuizStudio":dg(p,_);break;case"NeighborhoodGate":fg(p,_);break;default:eg(p,t,_,e.palette.primaryHex);break}return _}function au(i,e,t,n,s,r){for(let o of i.ambientFireLights)o.light.intensity=o.baseIntensity*(.86+.14*Math.sin(e*9.5+o.phase));for(let o of i.animatedProps)if(o.kind==="bell")o.object.rotation.z=Math.sin(e*o.speed+o.phase)*.16;else if(o.kind==="sway")o.object.rotation.z=Math.sin(e*o.speed+o.phase)*.035;else if(o.kind==="ring")o.object.rotation.z=e*o.speed+o.phase,o.object.rotation.y=Math.sin(e*.4+o.phase)*.25;else if(o.kind==="diya")o.object.scale.y=.85+.22*Math.sin(e*o.speed+o.phase),o.object.scale.x=.92+.12*Math.cos(e*o.speed*1.1+o.phase);else if(o.kind==="steam"){let a=(e*.55+o.phase)%1;o.object.position.y=(o.baseY??1.16)+a*.65,o.object.scale.setScalar(.75+a*1.15);let l=o.object.material;l.opacity=Math.sin(a*Math.PI)*.28}else if(o.kind==="spotlight"){let a=o.object;a.target.position.set(Math.sin(e*o.speed+o.phase)*1.1,.8,0),a.target.updateMatrixWorld()}else if(o.kind==="portal"){o.object.rotation.z=e*o.speed+o.phase;let a=.94+.08*Math.sin(e*3.8+o.phase);o.object.scale.setScalar(a)}else o.kind==="door"?o.object.rotation.y=.35+Math.sin(e*o.speed+o.phase)*.48:o.kind==="hazard"&&(o.object.rotation.y=e*o.speed+o.phase);if(i.poleStarGroup&&i.poleStarMat){let o=Math.max(0,Math.min(1,(t-.55)/.35));i.poleStarGroup.visible=o>.02,i.poleStarGroup.rotation.y=e*.8,i.poleStarMat.opacity=o*.28}if(i.backdropMesh&&i.backdropTextures.length>0){let o=Math.max(0,n)%i.backdropTextures.length,a=i.backdropMesh.material;if(a.map!==i.backdropTextures[o]&&(a.map=i.backdropTextures[o],a.needsUpdate=!0),r?.templateBackdrop)if(r.templateMotion==="GentleZoom"){let l=1+.06*(.5-.5*Math.cos(e*Math.PI*2/20));i.backdropMesh.scale.setScalar(l),i.backdropMesh.position.x=0}else r.templateMotion==="SlowPan"?(i.backdropMesh.scale.setScalar(1.08),i.backdropMesh.position.x=Math.sin(e*Math.PI*2/32)*.16):(i.backdropMesh.scale.setScalar(1),i.backdropMesh.position.x=0);else{let l=s*s*(3-2*s);i.backdropMesh.scale.setScalar(1.04+.09*l),i.backdropMesh.position.x=(o%2===0?1:-1)*.14*(l-.5)}}}function lu(i,e,t,n,s,r){let o=new ue;i.add(o);let a=document.createElement("canvas");a.width=64,a.height=64;let l=a.getContext("2d"),c=l.createRadialGradient(32,32,2,32,32,30);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.35,"rgba(255,255,255,0.75)"),c.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);let h=new yi(a),u="upward";t==="ComedyBurst"||e==="ComedyStage"?u="star":e==="ForestAshram"?u="firefly":e==="Himalaya"?u="snow":(t==="DivineAura"||e==="PalaceCourt")&&(u="petal");let f=110,d=new Float32Array(f*3),m=new Float32Array(f*3),E=new Float32Array(f*3),g=new _e(n),p=new _e(s),_=new _e(16775126),v=(r^2654435769)>>>0,x=()=>(v=Math.imul(1664525,v)+1013904223>>>0,v/4294967296);for(let X=0;X<f;X++){let de=(x()-.5)*6.2,be=x()*4.2,Ve=(x()-.5)*4.5-.4;d[X*3]=de,d[X*3+1]=be,d[X*3+2]=Ve,E[X*3]=x()*6.283,E[X*3+1]=.4+x()*.9,E[X*3+2]=de;let D=X%3===0?g:X%3===1?p:_;m[X*3]=D.r,m[X*3+1]=D.g,m[X*3+2]=D.b}let b=new Mt;b.setAttribute("position",new Ut(d,3)),b.setAttribute("color",new Ut(m,3));let R=new xi({size:u==="star"?.065:.12,map:h,vertexColors:!0,transparent:!0,opacity:u==="star"?.16:.78,blending:wn,depthWrite:!1}),A=new $i(b,R);u==="star"&&(A.visible=!1),o.add(A);let P=36,T=new Float32Array(P*3),M=new Mt;M.setAttribute("position",new Ut(T,3));let H=new xi({size:.16,map:h,color:16638023,transparent:!0,opacity:0,blending:wn,depthWrite:!1}),B=new $i(M,H);o.add(B);let F=[];if(e!=="ModernCity"&&u!=="star")for(let X=0;X<4;X++){let de=new Bt({transparent:!0,depthWrite:!1,side:ft,blending:wn,uniforms:{uColor:{value:new _e(n)},uOpacity:{value:.08}},vertexShader:`
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
        `}),be=new y(new it(.85,7.2,20,1,!0),de);be.position.set(-1.6+X*1.05,2.6,-1.9),be.rotation.z=-.32+X*.1,o.add(be),F.push(be)}let k=[];for(let X=0;X<7;X++){let de=new y(new Pe(.036,10,8),new Ne({color:s,transparent:!0,opacity:0,blending:wn,depthWrite:!1}));o.add(de),k.push(de)}let V=new ue,W=new Ne({color:8246268,transparent:!0,opacity:.85});for(let X=0;X<3;X++){let de=new ue,be=.06+X*.028,Ve=new y(new j(be*1.6,be*.35,be*.35),W);Ve.position.y=be*.7;let D=new y(new j(be*1.8,be*.32,be*.35),W);D.rotation.z=.72;let _t=new y(new j(be*1.6,be*.35,be*.35),W);_t.position.y=-be*.7,de.add(Ve,D,_t),V.add(de)}V.visible=!1,o.add(V);let le=new ue,O=new Ne({color:16436245,side:ft});for(let X=0;X<6;X++){let de=X/6*Math.PI*2,be=new y(new it(.036,.16,4),O);be.position.set(Math.cos(de)*.22,Math.sin(de)*.22,0),be.rotation.z=de-Math.PI/2,le.add(be)}le.visible=!1,o.add(le);let he=new ue,re=new Ne({color:16638023});for(let X=0;X<3;X++){let de=new y(new hn(.068,0),re);he.add(de)}he.visible=!1,o.add(he);let me=new ue,Re=new Ne({color:14870768,transparent:!0,opacity:.55});for(let X=0;X<4;X++){let de=new y(new Pe(.085,8,6),Re);me.add(de)}me.visible=!1,o.add(me);let Ae=new ue,q=new Ne({color:1120295,transparent:!0,opacity:.94});for(let X=0;X<12;X++){let de=new y(new j(.068,.022,.024),q);Ae.add(de)}Ae.visible=!1,o.add(Ae);let ae=new ue,K=new Ne({color:16708338,transparent:!0,opacity:.85}),ie=new Ne({color:15680580,transparent:!0,opacity:.92});for(let X=0;X<6;X++){let de=new y(new Pe(.065+X%2*.022,8,6),X%3===2?ie:K);ae.add(de)}ae.visible=!1,o.add(ae);let Y=new ue,we=new Ne({color:8246268,transparent:!0,opacity:.82});for(let X=0;X<10;X++){let de=new y(new Pe(.024,6,5),we);Y.add(de)}return Y.visible=!1,o.add(Y),{group:o,ambientPoints:A,ambientPositions:d,ambientSeeds:E,burstPoints:B,burstPositions:T,burstMat:H,streamDots:k,godRays:F,particleMode:u,sleepZGroup:V,shockBurstGroup:le,dizzyStarsGroup:he,dustGroup:me,hairCutGroup:Ae,angrySteamGroup:ae,sprayMistGroup:Y}}function cu(i,e,t,n,s,r,o,a,l,c,h="none",u="none",f=0,d=0,m=!1,E="calm",g="calm"){let p=i.ambientPositions.length/3,_=i.particleMode==="snow"||i.particleMode==="petal"&&t>.6;for(let K=0;K<p;K++){let ie=i.ambientSeeds[K*3],Y=i.ambientSeeds[K*3+1],we=i.ambientSeeds[K*3+2];if(i.particleMode==="firefly")i.ambientPositions[K*3]=we+Math.sin(e*.9*Y+ie)*.45,i.ambientPositions[K*3+1]=.4+((K*.17+Math.sin(e*.65+ie)*.6)%2.8+2.8)%2.8;else{let X=((e*.14*Y+ie*.15)%1+1)%1;i.ambientPositions[K*3]=we+Math.sin(e*1.1+ie)*.25,i.ambientPositions[K*3+1]=_?3.9-X*3.8:.15+X*3.8}}i.ambientPoints.geometry.attributes.position.needsUpdate=!0;for(let K=0;K<i.godRays.length;K++){let Y=i.godRays[K].material;Y.uniforms.uOpacity.value=.075+.04*Math.sin(e*.8+K*1.1)}let v=i.particleMode==="star",x=n==="Left"||n==="Right",b=n==="Left"?l:c;for(let K=0;K<i.streamDots.length;K++){let ie=i.streamDots[K],Y=ie.material;if(!x||v){Y.opacity=0;continue}let we=n==="Left"?s+.2:r-.2,X=n==="Left"?r-.2:s+.2,de=(e*1.35+K/i.streamDots.length)%1;ie.position.set(we+(X-we)*de,1.38+Math.sin(de*Math.PI)*.42+Math.sin(e*7+K)*.03,-.38+Math.cos(e*6+K)*.06),Y.color.set(b),Y.opacity=Math.sin(de*Math.PI)*.22}if(x&&(v?m:(o==="laughing"||o==="surprised"||o==="proud"||m)&&(a<.4||m))){let K=Math.min(1,a/.4),ie=n==="Left"?s:r;i.burstMat.color.setHex(o==="angry"?16347926:16638023);let Y=i.burstPositions.length/3;for(let we=0;we<Y;we++){let X=we/Y*Math.PI*2,de=.68+K*.92;i.burstPositions[we*3]=ie+Math.cos(X)*de,i.burstPositions[we*3+1]=1.55+Math.sin(X)*de*.85-K*.16,i.burstPositions[we*3+2]=v?-1.08:-.42}i.burstPoints.geometry.attributes.position.needsUpdate=!0,i.burstMat.opacity=(1-K*.82)*(v?.36:.45)}else i.burstMat.opacity=0;let A=h==="sleeping";if(A||u==="sleeping"){i.sleepZGroup.visible=!0;let K=A?s:r,ie=(A?f:d)+.62,Y=A&&f>.25?-.78:-.35;i.sleepZGroup.children.forEach((we,X)=>{let de=(e*.55+X*.33)%1;we.position.set(K+Math.sin(e*2.2+X)*.12+de*.14,ie+de*.65,Y),we.rotation.z=Math.sin(e*1.8+X)*.22;let be=Math.sin(de*Math.PI)*.85;we.scale.setScalar(Math.max(.01,be))})}else i.sleepZGroup.visible=!1;let T=n==="Right"?r:s,M=n==="Right"?d:f,H=n==="Right"?u:h,B=m||(H==="shockedFall"||H==="wakingUp"||o==="surprised")&&a<.42,F=h==="punching"||h==="kicking",k=u==="punching"||u==="kicking",V=F?h:u,W=F||k?Jl(e,V).recoil:0;if(W>.08){let K=F?r:s,ie=F?d:f;i.shockBurstGroup.visible=!0,i.shockBurstGroup.position.set(K+(F?-.28:.28),ie+(V==="kicking"?.95:1.45),-.05),i.shockBurstGroup.rotation.z=e*3.1,i.shockBurstGroup.scale.setScalar(.45+W*.85)}else if(B){i.shockBurstGroup.visible=!0,i.shockBurstGroup.position.set(T,M+2.08,-.18),i.shockBurstGroup.rotation.z=e*2.2;let K=.88+.18*Math.sin(e*16);i.shockBurstGroup.scale.setScalar(K)}else i.shockBurstGroup.visible=!1;if(h==="slapForehead"||u==="slapForehead"||o==="confused"){i.dizzyStarsGroup.visible=!0;let K=u==="slapForehead"?r:h==="slapForehead"?s:T,ie=(u==="slapForehead"?d:h==="slapForehead"?f:M)+1.82;i.dizzyStarsGroup.children.forEach((Y,we)=>{let X=e*4.5+we/3*Math.PI*2;Y.position.set(K+Math.cos(X)*.28,ie+Math.sin(X*2)*.04,Math.sin(X)*.24),Y.rotation.y=e*5})}else i.dizzyStarsGroup.visible=!1;let O=h==="walking"||h==="running";if(O||(u==="walking"||u==="running")){i.dustGroup.visible=!0;let K=O?s:r,ie=(O?f:d)+.06;i.dustGroup.children.forEach((Y,we)=>{let X=(e*(h==="running"||u==="running"?3.2:1.8)+we*.25)%1;Y.position.set(K-X*.35+(we%2===0?-.1:.1),ie+X*.28,-.05),Y.scale.setScalar(Math.max(.01,Math.sin(X*Math.PI)*1.25))})}else i.dustGroup.visible=!1;let re=h==="cutting";if(re||u==="cutting"){i.hairCutGroup.visible=!0;let K=re?r:s,ie=(re?d:f)+1.44,Y=-.6;i.hairCutGroup.children.forEach((we,X)=>{let de=(e*2.25+X*.13)%1,be=(X%2===0?1:-1)*(.09+de*.28);we.position.set(K+be+Math.sin(e*7+X)*.04,ie-de*1.12,Y+.08),we.rotation.set(e*6+X,X*.9,e*8),we.scale.setScalar(Math.max(.08,Math.sin(de*Math.PI)*1.25))})}else i.hairCutGroup.visible=!1;let Re=E==="angry",Ae=g==="angry";if(Re||Ae){i.angrySteamGroup.visible=!0;let K=Ae?r:s,ie=(Ae?d:f)+1.56,Y=Ae?-.68:-.58;i.angrySteamGroup.children.forEach((we,X)=>{let de=X%2===0?-1:1,be=(e*2.4+Math.floor(X/2)*.34)%1;we.position.set(K+de*(.28+be*.36),ie+be*.45,Y),we.scale.setScalar(Math.max(.05,Math.sin(be*Math.PI)*1.35))})}else i.angrySteamGroup.visible=!1;let q=h==="spraying";if(q||u==="spraying"){i.sprayMistGroup.visible=!0;let K=q?r:s,ie=(q?d:f)+1.48,Y=q?s:r;i.sprayMistGroup.children.forEach((we,X)=>{let de=(e*3.6+X*.1)%1,be=(X%5-2)*.055;we.position.set(Y+(K-Y)*(.35+de*.65),ie+be+Math.sin(de*3)*.04,-.62),we.scale.setScalar(Math.max(.1,(1-de*.4)*1.15))})}else i.sprayMistGroup.visible=!1}function _a(i){return{...i,leftShoulderZ:-i.rightShoulderZ,leftElbowZ:-i.rightElbowZ,rightShoulderZ:-i.leftShoulderZ,rightElbowZ:-i.leftElbowZ,torsoTiltZ:-i.torsoTiltZ,headTiltZ:-i.headTiltZ,headYawY:-i.headYawY,hipOffsetX:-i.hipOffsetX,joints:i.joints?jh(i.joints):i.joints}}function pg(i,e,t){let n=.18+.32*Math.min(1,t*1.4);return i?n*Math.pow(1-i.phase,2.2):n*.5*(1+Math.cos(e*Math.PI*4))}function mg(i){return{width:i.width,height:i.height,fps:30,durationSeconds:60,totalFrames:1800,seed:i.seed??42,theme:"ComedyStage3D",vfxStyle:i.vfxStyle,enableDynamicCamera:i.dynamicZoom!==!1,isSeamlessLoop:!1,isComedyMode:!0,uniqueVariant:i.seed??42,title:"Motion Remix",palette:{primaryHex:i.primaryColor||"#F97316",secondaryHex:i.secondaryColor||"#38BDF8",speakerAHex:i.primaryColor||"#F97316",speakerBHex:i.secondaryColor||"#38BDF8",topBackdropHex:"#12182b",midBackdropHex:"#2c1e4a",botBackdropHex:"#0b0f1e"},hasCharacters:!0,supportingCast:[],turns:[],sceneRuns:[],backdropCount:0}}function By(i,e){let t=new fa({canvas:i,antialias:!0,alpha:!1,preserveDrawingBuffer:!0,powerPreference:"high-performance"});t.setPixelRatio(1),t.setSize(e.width,e.height,!1),t.shadowMap.enabled=!0,t.shadowMap.type=xo,t.toneMapping=bo,t.toneMappingExposure=1.15;let n=new Fs,s=mg(e),r=e.setting==="Auto"?"ComedyStage":e.setting,o=ou(n,s,r,"Day",[]),a=null,l=null;if(e.customImageUrl){o.group.clear();let M=new y(new tt(14,14),new Mi({opacity:.42}));M.rotation.x=-Math.PI/2,M.receiveShadow=!0,o.group.add(M),l=new Js().load(e.customImageUrl),l.colorSpace=Lt;let B=e.width/Math.max(1,e.height),F=7.4;a=new y(new tt(F*B,F),new Ne({map:l,depthWrite:!1})),a.position.set(0,1.35,-2.6),o.group.add(a)}else e.setting==="Auto"&&e.solidBgHex&&(n.background=new _e(e.solidBgHex),n.fog=null);let c=lu(n,r,e.vfxStyle,s.palette.primaryHex,s.palette.secondaryHex,s.seed),h=!!e.secondaryRole&&e.secondaryRole!=="None",u=h?-.78:0,f=.78,d=ya({slot:"Left",name:"Lead",role:e.primaryRole,robeHex:e.primaryColor||null},s.palette.primaryHex,r,h?1:0,0);d.root.position.set(u,0,.14),h||(d.root.rotation.y=0),n.add(d.root);let m=h&&e.secondaryRole&&e.secondaryRole!=="None"?ya({slot:"Right",name:"Partner",role:e.secondaryRole,robeHex:e.secondaryColor||null},s.palette.secondaryHex,r,-1,1.7):null;m&&(m.root.position.set(f,0,.02),n.add(m.root));let E=Math.max(0,Math.min(6,Math.round(e.troupeCount??0))),g=[];if(E>0){let M=e.troupeRole??(r==="PalaceCourt"?"NobleWoman":e.primaryRole),H=e.troupeColor||e.secondaryColor||"#7F1D1D";for(let B=0;B<E;B++){let F=B%2===0?-1:1,k=Math.floor(B/2),V=ya({slot:F<0?"Left":"Right",name:`Dancer${B+1}`,role:M,robeHex:H},H,r,F<0?1:-1,(B+1)*.45),W=F*(1.68+k*.68),le=-.78-k*.44,O=F*-.18;V.root.position.set(W,0,le),V.root.rotation.y=O,V.root.scale.setScalar(.93),n.add(V.root),g.push({rig:V,side:F,baseRotY:O,phaseOffset:k*.12})}}let p=e.choreographyStyle&&e.choreographyStyle!=="auto"?e.choreographyStyle:r==="PalaceCourt"||r==="Temple"||r==="RiverGhat"||e.primaryRole==="NobleWoman"||e.primaryRole==="KingCrown"?"sufiKathak":"viralBounce",_=Math.max(d.topY,m?.topY??0),v=Math.max(.66,Math.min(1.08,_*.5)),x=(e.height>e.width?5.65:4.25)+(g.length>0?e.height>e.width?1.1:1.45:0),b=e.height>e.width,R=new bt(b?40:37,e.width/Math.max(1,e.height),.1,100),A=new I(0,v+.24,x),P=new I(0,v,0);R.position.copy(A),R.lookAt(P);let T=Number.NaN;return{resize(M,H){t.setSize(M,H,!1),R.aspect=M/Math.max(1,H),R.updateProjectionMatrix()},render(M,H,B,F,k){au(o,M,M%60/60,0,.5,null),k&&(B=Math.max(B,.36*Math.pow(1-k.phase,2)));let V=B>.55?"surprised":B>.25?"laughing":"happy";if(cu(c,M,M%60/60,h?"Left":"Narrator",u,f,V,.5,s.palette.primaryHex,s.palette.secondaryHex),a){let de=1.03+.03*Math.sin(M*.45);a.scale.setScalar(de)}let W=pg(k,M,B),le=(de,be)=>({...de,hipOffsetX:de.hipOffsetX*be,grooveBend:de.grooveBend??W}),O=H[0]?le(F?_a(H[0]):H[0],.45):null,he=k?.phase??0;if(O?(dr(d,O,M),d.root.rotation.y=h?.2:0):(Ma(d,M,p,he,!1,0,B),d.root.rotation.y=h?.18:0),m){let de=H[1]?le(F?_a(H[1]):H[1],.45):null;if(de)dr(m,de,M);else if(O){let be=_a(O);dr(m,{...be,hipOffsetX:be.hipOffsetX*.55,emotion:B>.45?"laughing":"happy",mouthOpen:B>.4?.55:.2},M)}else Ma(m,M,p,he,!0,.14,B);m.root.rotation.y=-.18}for(let de of g){if(O&&H.length>0&&p==="viralBounce"){let be=de.side>0?_a(O):O;dr(de.rig,{...be,hipOffsetX:be.hipOffsetX*.35,liftY:0},M+de.phaseOffset)}else Ma(de.rig,M,p,he,de.side>0,de.phaseOffset,B);de.rig.root.rotation.y=de.baseRotY}let re=x,me=0,Re=v+.24,Ae=re,q=v,ae=e.cameraAngle??"autoCut",K=0;ae==="autoCut"&&(K=Math.floor(k?k.index/4:M/2.6),ae=["front","left34","right34","lowHero"][(K%4+4)%4]),ae==="left34"?(me=-1.75,Re=v+.36,Ae=re*.92):ae==="right34"?(me=1.75,Re=v+.36,Ae=re*.92):ae==="lowHero"&&(me=.25,Re=Math.max(.55,v-.18),Ae=re*.88,q=v+.14);let ie=h?0:d.root.position.x+d.bodyPivot.position.x*.7,Y=g.length>0?ie*.4:ie;me+=Y,e.dynamicZoom!==!1&&(Ae-=Math.min(.75,B*.85),k&&(Ae-=.22*Math.pow(1-k.phase,3)),me+=Math.sin(M*1.1)*.1);let we=K!==T;T=K;let X=we?1:.18;A.lerp(new I(me,Re,Ae),X),P.lerp(new I(Y,q,0),X),R.position.copy(A),R.lookAt(P),t.render(n,R)},dispose(){l?.dispose(),t.dispose()}}}export{By as createMotion3DStage};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
