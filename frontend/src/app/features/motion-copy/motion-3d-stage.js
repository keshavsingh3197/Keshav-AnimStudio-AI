var Gc=0,El=1,Bc=2;var gl=1,vo=2,_n=3,Fn=0,Ft=1,ct=2,zn=0,wi=1,vn=2,Ml=3,yl=4,Uc=5,ri=100,Fc=101,Nc=102,kc=103,Oc=104,zc=200,Vc=201,Wc=202,Xc=203,qr=204,Zr=205,Yc=206,qc=207,Zc=208,Jc=209,Kc=210,$c=211,Qc=212,jc=213,eh=214,So=0,bo=1,Ro=2,Ti=3,Ao=4,Co=5,Ho=6,Po=7,xl=0,th=1,nh=2,Vn=0,ih=1,sh=2,rh=3,Io=4,oh=5,ah=6,lh=7;var wl=300,Ci=301,Hi=302,Do=303,Lo=304,rr=306,Nn=1e3,si=1001,Jr=1002,cn=1003,ch=1004;var or=1005;var Mn=1006,Go=1007;var di=1008;var Sn=1009,Tl=1010,_l=1011,hs=1012,Bo=1013,ui=1014,bn=1015,fi=1016,Uo=1017,Fo=1018,ds=1020,vl=35902,Sl=1021,bl=1022,un=1023,Rl=1024,Al=1025,Qi=1026,us=1027,Cl=1028,No=1029,Hl=1030,ko=1031;var Oo=1033,ar=33776,lr=33777,cr=33778,hr=33779,zo=35840,Vo=35841,Wo=35842,Xo=35843,Yo=36196,qo=37492,Zo=37496,Jo=37808,Ko=37809,$o=37810,Qo=37811,jo=37812,ea=37813,ta=37814,na=37815,ia=37816,sa=37817,ra=37818,oa=37819,aa=37820,la=37821,dr=36492,ca=36494,ha=36495,Pl=36283,da=36284,ua=36285,fa=36286;var Ls=2300,Kr=2301,Yr=2302,sl=2400,rl=2401,ol=2402;var hh=3200,dh=3201;var Il=0,uh=1,Wn="",xt="srgb",_i="srgb-linear",Gs="linear",gt="srgb";var xi=7680;var al=519,fh=512,ph=513,mh=514,Dl=515,Eh=516,gh=517,Mh=518,yh=519,ll=35044;var Ll="300 es",wn=2e3,Bs=2001;var kn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},kt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Ha=Math.PI/180,Us=180/Math.PI;function ur(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(kt[n&255]+kt[n>>8&255]+kt[n>>16&255]+kt[n>>24&255]+"-"+kt[e&255]+kt[e>>8&255]+"-"+kt[e>>16&15|64]+kt[e>>24&255]+"-"+kt[t&63|128]+kt[t>>8&255]+"-"+kt[t>>16&255]+kt[t>>24&255]+kt[i&255]+kt[i>>8&255]+kt[i>>16&255]+kt[i>>24&255]).toLowerCase()}function rt(n,e,t){return Math.max(e,Math.min(t,n))}function Cd(n,e){return(n%e+e)%e}function Pa(n,e,t){return(1-t)*n+t*e}function Ss(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Zt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var Se=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=rt(this.x,e.x,t.x),this.y=rt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=rt(this.x,e,t),this.y=rt(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(rt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(rt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},it=class n{constructor(e,t,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],d=i[7],f=i[2],u=i[5],E=i[8],M=s[0],g=s[3],p=s[6],T=s[1],y=s[4],x=s[7],S=s[2],b=s[5],C=s[8];return r[0]=o*M+a*T+l*S,r[3]=o*g+a*y+l*b,r[6]=o*p+a*x+l*C,r[1]=c*M+h*T+d*S,r[4]=c*g+h*y+d*b,r[7]=c*p+h*x+d*C,r[2]=f*M+u*T+E*S,r[5]=f*g+u*y+E*b,r[8]=f*p+u*x+E*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=h*o-a*c,f=a*l-h*r,u=c*r-o*l,E=t*d+i*f+s*u;if(E===0)return this.set(0,0,0,0,0,0,0,0,0);let M=1/E;return e[0]=d*M,e[1]=(s*c-h*i)*M,e[2]=(a*i-s*o)*M,e[3]=f*M,e[4]=(h*t-s*l)*M,e[5]=(s*r-a*t)*M,e[6]=u*M,e[7]=(i*l-c*t)*M,e[8]=(o*t-i*r)*M,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Ia.makeScale(e,t)),this}rotate(e){return this.premultiply(Ia.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ia.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ia=new it;function Gl(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function ji(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function xh(){let n=ji("canvas");return n.style.display="block",n}var lc={};function fr(n){n in lc||(lc[n]=!0,console.warn(n))}function wh(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function Th(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function _h(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var cc=new it().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),hc=new it().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Hd(){let n={enabled:!0,workingColorSpace:_i,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===gt&&(s.r=Un(s.r),s.g=Un(s.g),s.b=Un(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===gt&&(s.r=$i(s.r),s.g=$i(s.g),s.b=$i(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Wn?Gs:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[_i]:{primaries:e,whitePoint:i,transfer:Gs,toXYZ:cc,fromXYZ:hc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:xt},outputColorSpaceConfig:{drawingBufferColorSpace:xt}},[xt]:{primaries:e,whitePoint:i,transfer:gt,toXYZ:cc,fromXYZ:hc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:xt}}}),n}var dt=Hd();function Un(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function $i(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Ni,$r=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Ni===void 0&&(Ni=ji("canvas")),Ni.width=e.width,Ni.height=e.height;let s=Ni.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=Ni}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ji("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Un(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Un(t[i]/255)*255):t[i]=Un(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Pd=0,es=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pd++}),this.uuid=ur(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Da(s[o].image)):r.push(Da(s[o]))}else r=Da(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Da(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?$r.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Id=0,Wt=class n extends kn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=si,s=si,r=Mn,o=di,a=un,l=Sn,c=n.DEFAULT_ANISOTROPY,h=Wn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Id++}),this.uuid=ur(),this.name="",this.source=new es(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Se(0,0),this.repeat=new Se(1,1),this.center=new Se(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new it,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==wl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Nn:e.x=e.x-Math.floor(e.x);break;case si:e.x=e.x<0?0:1;break;case Jr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Nn:e.y=e.y-Math.floor(e.y);break;case si:e.y=e.y<0?0:1;break;case Jr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Wt.DEFAULT_IMAGE=null;Wt.DEFAULT_MAPPING=wl;Wt.DEFAULT_ANISOTROPY=1;var ft=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],d=l[8],f=l[1],u=l[5],E=l[9],M=l[2],g=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(d-M)<.01&&Math.abs(E-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(d+M)<.1&&Math.abs(E+g)<.1&&Math.abs(c+u+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let y=(c+1)/2,x=(u+1)/2,S=(p+1)/2,b=(h+f)/4,C=(d+M)/4,H=(E+g)/4;return y>x&&y>S?y<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(y),s=b/i,r=C/i):x>S?x<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),i=b/s,r=H/s):S<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(S),i=C/r,s=H/r),this.set(i,s,r,t),this}let T=Math.sqrt((g-E)*(g-E)+(d-M)*(d-M)+(f-h)*(f-h));return Math.abs(T)<.001&&(T=1),this.x=(g-E)/T,this.y=(d-M)/T,this.z=(f-h)/T,this.w=Math.acos((c+u+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=rt(this.x,e.x,t.x),this.y=rt(this.y,e.y,t.y),this.z=rt(this.z,e.z,t.z),this.w=rt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=rt(this.x,e,t),this.y=rt(this.y,e,t),this.z=rt(this.z,e,t),this.w=rt(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(rt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Qr=class extends kn{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ft(0,0,e,t),this.scissorTest=!1,this.viewport=new ft(0,0,e,t);let s={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Mn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new Wt(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new es(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},hn=class extends Qr{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Fs=class extends Wt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=cn,this.minFilter=cn,this.wrapR=si,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var jr=class extends Wt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=cn,this.minFilter=cn,this.wrapR=si,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var bt=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],d=i[s+3],f=r[o+0],u=r[o+1],E=r[o+2],M=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d;return}if(a===1){e[t+0]=f,e[t+1]=u,e[t+2]=E,e[t+3]=M;return}if(d!==M||l!==f||c!==u||h!==E){let g=1-a,p=l*f+c*u+h*E+d*M,T=p>=0?1:-1,y=1-p*p;if(y>Number.EPSILON){let S=Math.sqrt(y),b=Math.atan2(S,p*T);g=Math.sin(g*b)/S,a=Math.sin(a*b)/S}let x=a*T;if(l=l*g+f*x,c=c*g+u*x,h=h*g+E*x,d=d*g+M*x,g===1-a){let S=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=S,c*=S,h*=S,d*=S}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],d=r[o],f=r[o+1],u=r[o+2],E=r[o+3];return e[t]=a*E+h*d+l*u-c*f,e[t+1]=l*E+h*f+c*d-a*u,e[t+2]=c*E+h*u+a*f-l*d,e[t+3]=h*E-a*d-l*f-c*u,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),d=a(r/2),f=l(i/2),u=l(s/2),E=l(r/2);switch(o){case"XYZ":this._x=f*h*d+c*u*E,this._y=c*u*d-f*h*E,this._z=c*h*E+f*u*d,this._w=c*h*d-f*u*E;break;case"YXZ":this._x=f*h*d+c*u*E,this._y=c*u*d-f*h*E,this._z=c*h*E-f*u*d,this._w=c*h*d+f*u*E;break;case"ZXY":this._x=f*h*d-c*u*E,this._y=c*u*d+f*h*E,this._z=c*h*E+f*u*d,this._w=c*h*d-f*u*E;break;case"ZYX":this._x=f*h*d-c*u*E,this._y=c*u*d+f*h*E,this._z=c*h*E-f*u*d,this._w=c*h*d+f*u*E;break;case"YZX":this._x=f*h*d+c*u*E,this._y=c*u*d+f*h*E,this._z=c*h*E-f*u*d,this._w=c*h*d-f*u*E;break;case"XZY":this._x=f*h*d-c*u*E,this._y=c*u*d-f*h*E,this._z=c*h*E+f*u*d,this._w=c*h*d+f*u*E;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],d=t[10],f=i+a+d;if(f>0){let u=.5/Math.sqrt(f+1);this._w=.25/u,this._x=(h-l)*u,this._y=(r-c)*u,this._z=(o-s)*u}else if(i>a&&i>d){let u=2*Math.sqrt(1+i-a-d);this._w=(h-l)/u,this._x=.25*u,this._y=(s+o)/u,this._z=(r+c)/u}else if(a>d){let u=2*Math.sqrt(1+a-i-d);this._w=(r-c)/u,this._x=(s+o)/u,this._y=.25*u,this._z=(l+h)/u}else{let u=2*Math.sqrt(1+d-i-a);this._w=(o-s)/u,this._x=(r+c)/u,this._y=(l+h)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(rt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let u=1-t;return this._w=u*o+t*this._w,this._x=u*i+t*this._x,this._y=u*s+t*this._y,this._z=u*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),d=Math.sin((1-t)*h)/c,f=Math.sin(t*h)/c;return this._w=o*d+this._w*f,this._x=i*d+this._x*f,this._y=s*d+this._y*f,this._z=r*d+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(dc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(dc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),h=2*(a*t-r*s),d=2*(r*i-o*t);return this.x=t+l*c+o*d-a*h,this.y=i+l*h+a*c-r*d,this.z=s+l*d+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=rt(this.x,e.x,t.x),this.y=rt(this.y,e.y,t.y),this.z=rt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=rt(this.x,e,t),this.y=rt(this.y,e,t),this.z=rt(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(rt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return La.copy(this).projectOnVector(e),this.sub(La)}reflect(e){return this.sub(La.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(rt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},La=new L,dc=new bt,oi=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(mn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(mn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=mn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,mn):mn.fromBufferAttribute(r,o),mn.applyMatrix4(e.matrixWorld),this.expandByPoint(mn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),_r.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),_r.copy(i.boundingBox)),_r.applyMatrix4(e.matrixWorld),this.union(_r)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,mn),mn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(bs),vr.subVectors(this.max,bs),ki.subVectors(e.a,bs),Oi.subVectors(e.b,bs),zi.subVectors(e.c,bs),$n.subVectors(Oi,ki),Qn.subVectors(zi,Oi),Ei.subVectors(ki,zi);let t=[0,-$n.z,$n.y,0,-Qn.z,Qn.y,0,-Ei.z,Ei.y,$n.z,0,-$n.x,Qn.z,0,-Qn.x,Ei.z,0,-Ei.x,-$n.y,$n.x,0,-Qn.y,Qn.x,0,-Ei.y,Ei.x,0];return!Ga(t,ki,Oi,zi,vr)||(t=[1,0,0,0,1,0,0,0,1],!Ga(t,ki,Oi,zi,vr))?!1:(Sr.crossVectors($n,Qn),t=[Sr.x,Sr.y,Sr.z],Ga(t,ki,Oi,zi,vr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,mn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(mn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(In[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),In[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),In[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),In[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),In[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),In[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),In[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),In[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(In),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},In=[new L,new L,new L,new L,new L,new L,new L,new L],mn=new L,_r=new oi,ki=new L,Oi=new L,zi=new L,$n=new L,Qn=new L,Ei=new L,bs=new L,vr=new L,Sr=new L,gi=new L;function Ga(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){gi.fromArray(n,r);let a=s.x*Math.abs(gi.x)+s.y*Math.abs(gi.y)+s.z*Math.abs(gi.z),l=e.dot(gi),c=t.dot(gi),h=i.dot(gi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Dd=new oi,Rs=new L,Ba=new L,ai=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Dd.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Rs.subVectors(e,this.center);let t=Rs.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Rs,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ba.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Rs.copy(e.center).add(Ba)),this.expandByPoint(Rs.copy(e.center).sub(Ba))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Dn=new L,Ua=new L,br=new L,jn=new L,Fa=new L,Rr=new L,Na=new L,ts=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Dn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Dn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Dn.copy(this.origin).addScaledVector(this.direction,t),Dn.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Ua.copy(e).add(t).multiplyScalar(.5),br.copy(t).sub(e).normalize(),jn.copy(this.origin).sub(Ua);let r=e.distanceTo(t)*.5,o=-this.direction.dot(br),a=jn.dot(this.direction),l=-jn.dot(br),c=jn.lengthSq(),h=Math.abs(1-o*o),d,f,u,E;if(h>0)if(d=o*l-a,f=o*a-l,E=r*h,d>=0)if(f>=-E)if(f<=E){let M=1/h;d*=M,f*=M,u=d*(d+o*f+2*a)+f*(o*d+f+2*l)+c}else f=r,d=Math.max(0,-(o*f+a)),u=-d*d+f*(f+2*l)+c;else f=-r,d=Math.max(0,-(o*f+a)),u=-d*d+f*(f+2*l)+c;else f<=-E?(d=Math.max(0,-(-o*r+a)),f=d>0?-r:Math.min(Math.max(-r,-l),r),u=-d*d+f*(f+2*l)+c):f<=E?(d=0,f=Math.min(Math.max(-r,-l),r),u=f*(f+2*l)+c):(d=Math.max(0,-(o*r+a)),f=d>0?r:Math.min(Math.max(-r,-l),r),u=-d*d+f*(f+2*l)+c);else f=o>0?-r:r,d=Math.max(0,-(o*f+a)),u=-d*d+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Ua).addScaledVector(br,f),u}intersectSphere(e,t){Dn.subVectors(e.center,this.origin);let i=Dn.dot(this.direction),s=Dn.dot(Dn)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,s=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,s=(e.min.x-f.x)*c),h>=0?(r=(e.min.y-f.y)*h,o=(e.max.y-f.y)*h):(r=(e.max.y-f.y)*h,o=(e.min.y-f.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-f.z)*d,l=(e.max.z-f.z)*d):(a=(e.max.z-f.z)*d,l=(e.min.z-f.z)*d),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Dn)!==null}intersectTriangle(e,t,i,s,r){Fa.subVectors(t,e),Rr.subVectors(i,e),Na.crossVectors(Fa,Rr);let o=this.direction.dot(Na),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;jn.subVectors(this.origin,e);let l=a*this.direction.dot(Rr.crossVectors(jn,Rr));if(l<0)return null;let c=a*this.direction.dot(Fa.cross(jn));if(c<0||l+c>o)return null;let h=-a*jn.dot(Na);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},pt=class n{constructor(e,t,i,s,r,o,a,l,c,h,d,f,u,E,M,g){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,h,d,f,u,E,M,g)}set(e,t,i,s,r,o,a,l,c,h,d,f,u,E,M,g){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=d,p[14]=f,p[3]=u,p[7]=E,p[11]=M,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/Vi.setFromMatrixColumn(e,0).length(),r=1/Vi.setFromMatrixColumn(e,1).length(),o=1/Vi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let f=o*h,u=o*d,E=a*h,M=a*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=u+E*c,t[5]=f-M*c,t[9]=-a*l,t[2]=M-f*c,t[6]=E+u*c,t[10]=o*l}else if(e.order==="YXZ"){let f=l*h,u=l*d,E=c*h,M=c*d;t[0]=f+M*a,t[4]=E*a-u,t[8]=o*c,t[1]=o*d,t[5]=o*h,t[9]=-a,t[2]=u*a-E,t[6]=M+f*a,t[10]=o*l}else if(e.order==="ZXY"){let f=l*h,u=l*d,E=c*h,M=c*d;t[0]=f-M*a,t[4]=-o*d,t[8]=E+u*a,t[1]=u+E*a,t[5]=o*h,t[9]=M-f*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let f=o*h,u=o*d,E=a*h,M=a*d;t[0]=l*h,t[4]=E*c-u,t[8]=f*c+M,t[1]=l*d,t[5]=M*c+f,t[9]=u*c-E,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let f=o*l,u=o*c,E=a*l,M=a*c;t[0]=l*h,t[4]=M-f*d,t[8]=E*d+u,t[1]=d,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=u*d+E,t[10]=f-M*d}else if(e.order==="XZY"){let f=o*l,u=o*c,E=a*l,M=a*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=f*d+M,t[5]=o*h,t[9]=u*d-E,t[2]=E*d-u,t[6]=a*h,t[10]=M*d+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ld,e,Gd)}lookAt(e,t,i){let s=this.elements;return Qt.subVectors(e,t),Qt.lengthSq()===0&&(Qt.z=1),Qt.normalize(),ei.crossVectors(i,Qt),ei.lengthSq()===0&&(Math.abs(i.z)===1?Qt.x+=1e-4:Qt.z+=1e-4,Qt.normalize(),ei.crossVectors(i,Qt)),ei.normalize(),Ar.crossVectors(Qt,ei),s[0]=ei.x,s[4]=Ar.x,s[8]=Qt.x,s[1]=ei.y,s[5]=Ar.y,s[9]=Qt.y,s[2]=ei.z,s[6]=Ar.z,s[10]=Qt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],d=i[5],f=i[9],u=i[13],E=i[2],M=i[6],g=i[10],p=i[14],T=i[3],y=i[7],x=i[11],S=i[15],b=s[0],C=s[4],H=s[8],_=s[12],w=s[1],P=s[5],I=s[9],B=s[13],F=s[2],W=s[6],Y=s[10],Q=s[14],N=s[3],ee=s[7],$=s[11],fe=s[15];return r[0]=o*b+a*w+l*F+c*N,r[4]=o*C+a*P+l*W+c*ee,r[8]=o*H+a*I+l*Y+c*$,r[12]=o*_+a*B+l*Q+c*fe,r[1]=h*b+d*w+f*F+u*N,r[5]=h*C+d*P+f*W+u*ee,r[9]=h*H+d*I+f*Y+u*$,r[13]=h*_+d*B+f*Q+u*fe,r[2]=E*b+M*w+g*F+p*N,r[6]=E*C+M*P+g*W+p*ee,r[10]=E*H+M*I+g*Y+p*$,r[14]=E*_+M*B+g*Q+p*fe,r[3]=T*b+y*w+x*F+S*N,r[7]=T*C+y*P+x*W+S*ee,r[11]=T*H+y*I+x*Y+S*$,r[15]=T*_+y*B+x*Q+S*fe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],d=e[6],f=e[10],u=e[14],E=e[3],M=e[7],g=e[11],p=e[15];return E*(+r*l*d-s*c*d-r*a*f+i*c*f+s*a*u-i*l*u)+M*(+t*l*u-t*c*f+r*o*f-s*o*u+s*c*h-r*l*h)+g*(+t*c*d-t*a*u-r*o*d+i*o*u+r*a*h-i*c*h)+p*(-s*a*h-t*l*d+t*a*f+s*o*d-i*o*f+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=e[9],f=e[10],u=e[11],E=e[12],M=e[13],g=e[14],p=e[15],T=d*g*c-M*f*c+M*l*u-a*g*u-d*l*p+a*f*p,y=E*f*c-h*g*c-E*l*u+o*g*u+h*l*p-o*f*p,x=h*M*c-E*d*c+E*a*u-o*M*u-h*a*p+o*d*p,S=E*d*l-h*M*l-E*a*f+o*M*f+h*a*g-o*d*g,b=t*T+i*y+s*x+r*S;if(b===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/b;return e[0]=T*C,e[1]=(M*f*r-d*g*r-M*s*u+i*g*u+d*s*p-i*f*p)*C,e[2]=(a*g*r-M*l*r+M*s*c-i*g*c-a*s*p+i*l*p)*C,e[3]=(d*l*r-a*f*r-d*s*c+i*f*c+a*s*u-i*l*u)*C,e[4]=y*C,e[5]=(h*g*r-E*f*r+E*s*u-t*g*u-h*s*p+t*f*p)*C,e[6]=(E*l*r-o*g*r-E*s*c+t*g*c+o*s*p-t*l*p)*C,e[7]=(o*f*r-h*l*r+h*s*c-t*f*c-o*s*u+t*l*u)*C,e[8]=x*C,e[9]=(E*d*r-h*M*r-E*i*u+t*M*u+h*i*p-t*d*p)*C,e[10]=(o*M*r-E*a*r+E*i*c-t*M*c-o*i*p+t*a*p)*C,e[11]=(h*a*r-o*d*r-h*i*c+t*d*c+o*i*u-t*a*u)*C,e[12]=S*C,e[13]=(h*M*s-E*d*s+E*i*f-t*M*f-h*i*g+t*d*g)*C,e[14]=(E*a*s-o*M*s-E*i*l+t*M*l+o*i*g-t*a*g)*C,e[15]=(o*d*s-h*a*s+h*i*l-t*d*l-o*i*f+t*a*f)*C,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,d=a+a,f=r*c,u=r*h,E=r*d,M=o*h,g=o*d,p=a*d,T=l*c,y=l*h,x=l*d,S=i.x,b=i.y,C=i.z;return s[0]=(1-(M+p))*S,s[1]=(u+x)*S,s[2]=(E-y)*S,s[3]=0,s[4]=(u-x)*b,s[5]=(1-(f+p))*b,s[6]=(g+T)*b,s[7]=0,s[8]=(E+y)*C,s[9]=(g-T)*C,s[10]=(1-(f+M))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=Vi.set(s[0],s[1],s[2]).length(),o=Vi.set(s[4],s[5],s[6]).length(),a=Vi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],En.copy(this);let c=1/r,h=1/o,d=1/a;return En.elements[0]*=c,En.elements[1]*=c,En.elements[2]*=c,En.elements[4]*=h,En.elements[5]*=h,En.elements[6]*=h,En.elements[8]*=d,En.elements[9]*=d,En.elements[10]*=d,t.setFromRotationMatrix(En),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=wn){let l=this.elements,c=2*r/(t-e),h=2*r/(i-s),d=(t+e)/(t-e),f=(i+s)/(i-s),u,E;if(a===wn)u=-(o+r)/(o-r),E=-2*o*r/(o-r);else if(a===Bs)u=-o/(o-r),E=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=u,l[14]=E,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=wn){let l=this.elements,c=1/(t-e),h=1/(i-s),d=1/(o-r),f=(t+e)*c,u=(i+s)*h,E,M;if(a===wn)E=(o+r)*d,M=-2*d;else if(a===Bs)E=r*d,M=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-u,l[2]=0,l[6]=0,l[10]=M,l[14]=-E,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Vi=new L,En=new pt,Ld=new L(0,0,0),Gd=new L(1,1,1),ei=new L,Ar=new L,Qt=new L,uc=new pt,fc=new bt,Xt=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],d=s[2],f=s[6],u=s[10];switch(t){case"XYZ":this._y=Math.asin(rt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,u),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-rt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,u),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(rt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,u),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-rt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,u),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(rt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,u));break;case"XZY":this._z=Math.asin(-rt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,u),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return uc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(uc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return fc.setFromEuler(this),this.setFromQuaternion(fc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Xt.DEFAULT_ORDER="XYZ";var Ns=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Bd=0,pc=new L,Wi=new bt,Ln=new pt,Cr=new L,As=new L,Ud=new L,Fd=new bt,mc=new L(1,0,0),Ec=new L(0,1,0),gc=new L(0,0,1),Mc={type:"added"},Nd={type:"removed"},Xi={type:"childadded",child:null},ka={type:"childremoved",child:null},_t=class n extends kn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Bd++}),this.uuid=ur(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new L,t=new Xt,i=new bt,s=new L(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new pt},normalMatrix:{value:new it}}),this.matrix=new pt,this.matrixWorld=new pt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ns,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.multiply(Wi),this}rotateOnWorldAxis(e,t){return Wi.setFromAxisAngle(e,t),this.quaternion.premultiply(Wi),this}rotateX(e){return this.rotateOnAxis(mc,e)}rotateY(e){return this.rotateOnAxis(Ec,e)}rotateZ(e){return this.rotateOnAxis(gc,e)}translateOnAxis(e,t){return pc.copy(e).applyQuaternion(this.quaternion),this.position.add(pc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(mc,e)}translateY(e){return this.translateOnAxis(Ec,e)}translateZ(e){return this.translateOnAxis(gc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ln.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Cr.copy(e):Cr.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),As.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ln.lookAt(As,Cr,this.up):Ln.lookAt(Cr,As,this.up),this.quaternion.setFromRotationMatrix(Ln),s&&(Ln.extractRotation(s.matrixWorld),Wi.setFromRotationMatrix(Ln),this.quaternion.premultiply(Wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Mc),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Nd),ka.child=e,this.dispatchEvent(ka),ka.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ln.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ln.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ln),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Mc),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(As,e,Ud),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(As,Fd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),d=o(e.shapes),f=o(e.skeletons),u=o(e.animations),E=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),f.length>0&&(i.skeletons=f),u.length>0&&(i.animations=u),E.length>0&&(i.nodes=E)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};_t.DEFAULT_UP=new L(0,1,0);_t.DEFAULT_MATRIX_AUTO_UPDATE=!0;_t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var gn=new L,Gn=new L,Oa=new L,Bn=new L,Yi=new L,qi=new L,yc=new L,za=new L,Va=new L,Wa=new L,Xa=new ft,Ya=new ft,qa=new ft,ii=class n{constructor(e=new L,t=new L,i=new L){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),gn.subVectors(e,t),s.cross(gn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){gn.subVectors(s,t),Gn.subVectors(i,t),Oa.subVectors(e,t);let o=gn.dot(gn),a=gn.dot(Gn),l=gn.dot(Oa),c=Gn.dot(Gn),h=Gn.dot(Oa),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let f=1/d,u=(c*l-a*h)*f,E=(o*h-a*l)*f;return r.set(1-u-E,E,u)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,Bn)===null?!1:Bn.x>=0&&Bn.y>=0&&Bn.x+Bn.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,Bn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Bn.x),l.addScaledVector(o,Bn.y),l.addScaledVector(a,Bn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return Xa.setScalar(0),Ya.setScalar(0),qa.setScalar(0),Xa.fromBufferAttribute(e,t),Ya.fromBufferAttribute(e,i),qa.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Xa,r.x),o.addScaledVector(Ya,r.y),o.addScaledVector(qa,r.z),o}static isFrontFacing(e,t,i,s){return gn.subVectors(i,t),Gn.subVectors(e,t),gn.cross(Gn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return gn.subVectors(this.c,this.b),Gn.subVectors(this.a,this.b),gn.cross(Gn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;Yi.subVectors(s,i),qi.subVectors(r,i),za.subVectors(e,i);let l=Yi.dot(za),c=qi.dot(za);if(l<=0&&c<=0)return t.copy(i);Va.subVectors(e,s);let h=Yi.dot(Va),d=qi.dot(Va);if(h>=0&&d<=h)return t.copy(s);let f=l*d-h*c;if(f<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector(Yi,o);Wa.subVectors(e,r);let u=Yi.dot(Wa),E=qi.dot(Wa);if(E>=0&&u<=E)return t.copy(r);let M=u*c-l*E;if(M<=0&&c>=0&&E<=0)return a=c/(c-E),t.copy(i).addScaledVector(qi,a);let g=h*E-u*d;if(g<=0&&d-h>=0&&u-E>=0)return yc.subVectors(r,s),a=(d-h)/(d-h+(u-E)),t.copy(s).addScaledVector(yc,a);let p=1/(g+M+f);return o=M*p,a=f*p,t.copy(i).addScaledVector(Yi,o).addScaledVector(qi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},vh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ti={h:0,s:0,l:0},Hr={h:0,s:0,l:0};function Za(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ie=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,dt.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=dt.workingColorSpace){return this.r=e,this.g=t,this.b=i,dt.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=dt.workingColorSpace){if(e=Cd(e,1),t=rt(t,0,1),i=rt(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Za(o,r,e+1/3),this.g=Za(o,r,e),this.b=Za(o,r,e-1/3)}return dt.toWorkingColorSpace(this,s),this}setStyle(e,t=xt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xt){let i=vh[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Un(e.r),this.g=Un(e.g),this.b=Un(e.b),this}copyLinearToSRGB(e){return this.r=$i(e.r),this.g=$i(e.g),this.b=$i(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xt){return dt.fromWorkingColorSpace(Ot.copy(this),e),Math.round(rt(Ot.r*255,0,255))*65536+Math.round(rt(Ot.g*255,0,255))*256+Math.round(rt(Ot.b*255,0,255))}getHexString(e=xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=dt.workingColorSpace){dt.fromWorkingColorSpace(Ot.copy(this),t);let i=Ot.r,s=Ot.g,r=Ot.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=h<=.5?d/(o+a):d/(2-o-a),o){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=dt.workingColorSpace){return dt.fromWorkingColorSpace(Ot.copy(this),t),e.r=Ot.r,e.g=Ot.g,e.b=Ot.b,e}getStyle(e=xt){dt.fromWorkingColorSpace(Ot.copy(this),e);let t=Ot.r,i=Ot.g,s=Ot.b;return e!==xt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(ti),this.setHSL(ti.h+e,ti.s+t,ti.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ti),e.getHSL(Hr);let i=Pa(ti.h,Hr.h,t),s=Pa(ti.s,Hr.s,t),r=Pa(ti.l,Hr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ot=new Ie;Ie.NAMES=vh;var kd=0,yn=class extends kn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:kd++}),this.uuid=ur(),this.name="",this.type="Material",this.blending=wi,this.side=Fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=qr,this.blendDst=Zr,this.blendEquation=ri,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ie(0,0,0),this.blendAlpha=0,this.depthFunc=Ti,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=al,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=xi,this.stencilZFail=xi,this.stencilZPass=xi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==wi&&(i.blending=this.blending),this.side!==Fn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==qr&&(i.blendSrc=this.blendSrc),this.blendDst!==Zr&&(i.blendDst=this.blendDst),this.blendEquation!==ri&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ti&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==al&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==xi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==xi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==xi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},_e=class extends yn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ie(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xt,this.combine=xl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ct=new L,Pr=new Se,Od=0,Bt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Od++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=ll,this.updateRanges=[],this.gpuType=bn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Pr.fromBufferAttribute(this,t),Pr.applyMatrix3(e),this.setXY(t,Pr.x,Pr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix3(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix4(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyNormalMatrix(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.transformDirection(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ss(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Zt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ss(t,this.array)),t}setX(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ss(t,this.array)),t}setY(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ss(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ss(t,this.array)),t}setW(e,t){return this.normalized&&(t=Zt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Zt(t,this.array),i=Zt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=Zt(t,this.array),i=Zt(i,this.array),s=Zt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=Zt(t,this.array),i=Zt(i,this.array),s=Zt(s,this.array),r=Zt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ll&&(e.usage=this.usage),e}};var ks=class extends Bt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Os=class extends Bt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var ot=class extends Bt{constructor(e,t,i){super(new Float32Array(e),t,i)}},zd=0,an=new pt,Ja=new _t,Zi=new L,jt=new oi,Cs=new oi,Lt=new L,vt=class n extends kn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:zd++}),this.uuid=ur(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Gl(e)?Os:ks)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new it().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,i){return an.makeTranslation(e,t,i),this.applyMatrix4(an),this}scale(e,t,i){return an.makeScale(e,t,i),this.applyMatrix4(an),this}lookAt(e){return Ja.lookAt(e),Ja.updateMatrix(),this.applyMatrix4(Ja.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Zi).negate(),this.translate(Zi.x,Zi.y,Zi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new ot(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];jt.setFromBufferAttribute(r),this.morphTargetsRelative?(Lt.addVectors(this.boundingBox.min,jt.min),this.boundingBox.expandByPoint(Lt),Lt.addVectors(this.boundingBox.max,jt.max),this.boundingBox.expandByPoint(Lt)):(this.boundingBox.expandByPoint(jt.min),this.boundingBox.expandByPoint(jt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ai);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(e){let i=this.boundingSphere.center;if(jt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Cs.setFromBufferAttribute(a),this.morphTargetsRelative?(Lt.addVectors(jt.min,Cs.min),jt.expandByPoint(Lt),Lt.addVectors(jt.max,Cs.max),jt.expandByPoint(Lt)):(jt.expandByPoint(Cs.min),jt.expandByPoint(Cs.max))}jt.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)Lt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Lt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Lt.fromBufferAttribute(a,c),l&&(Zi.fromBufferAttribute(e,c),Lt.add(Zi)),s=Math.max(s,i.distanceToSquared(Lt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Bt(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let H=0;H<i.count;H++)a[H]=new L,l[H]=new L;let c=new L,h=new L,d=new L,f=new Se,u=new Se,E=new Se,M=new L,g=new L;function p(H,_,w){c.fromBufferAttribute(i,H),h.fromBufferAttribute(i,_),d.fromBufferAttribute(i,w),f.fromBufferAttribute(r,H),u.fromBufferAttribute(r,_),E.fromBufferAttribute(r,w),h.sub(c),d.sub(c),u.sub(f),E.sub(f);let P=1/(u.x*E.y-E.x*u.y);isFinite(P)&&(M.copy(h).multiplyScalar(E.y).addScaledVector(d,-u.y).multiplyScalar(P),g.copy(d).multiplyScalar(u.x).addScaledVector(h,-E.x).multiplyScalar(P),a[H].add(M),a[_].add(M),a[w].add(M),l[H].add(g),l[_].add(g),l[w].add(g))}let T=this.groups;T.length===0&&(T=[{start:0,count:e.count}]);for(let H=0,_=T.length;H<_;++H){let w=T[H],P=w.start,I=w.count;for(let B=P,F=P+I;B<F;B+=3)p(e.getX(B+0),e.getX(B+1),e.getX(B+2))}let y=new L,x=new L,S=new L,b=new L;function C(H){S.fromBufferAttribute(s,H),b.copy(S);let _=a[H];y.copy(_),y.sub(S.multiplyScalar(S.dot(_))).normalize(),x.crossVectors(b,_);let P=x.dot(l[H])<0?-1:1;o.setXYZW(H,y.x,y.y,y.z,P)}for(let H=0,_=T.length;H<_;++H){let w=T[H],P=w.start,I=w.count;for(let B=P,F=P+I;B<F;B+=3)C(e.getX(B+0)),C(e.getX(B+1)),C(e.getX(B+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Bt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,u=i.count;f<u;f++)i.setXYZ(f,0,0,0);let s=new L,r=new L,o=new L,a=new L,l=new L,c=new L,h=new L,d=new L;if(e)for(let f=0,u=e.count;f<u;f+=3){let E=e.getX(f+0),M=e.getX(f+1),g=e.getX(f+2);s.fromBufferAttribute(t,E),r.fromBufferAttribute(t,M),o.fromBufferAttribute(t,g),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(i,E),l.fromBufferAttribute(i,M),c.fromBufferAttribute(i,g),a.add(h),l.add(h),c.add(h),i.setXYZ(E,a.x,a.y,a.z),i.setXYZ(M,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,u=t.count;f<u;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Lt.fromBufferAttribute(e,t),Lt.normalize(),e.setXYZ(t,Lt.x,Lt.y,Lt.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,d=a.normalized,f=new c.constructor(l.length*h),u=0,E=0;for(let M=0,g=l.length;M<g;M++){a.isInterleavedBufferAttribute?u=l[M]*a.data.stride+a.offset:u=l[M]*h;for(let p=0;p<h;p++)f[E++]=c[u++]}return new Bt(f,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,d=c.length;h<d;h++){let f=c[h],u=e(f,i);l.push(u)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,f=c.length;d<f;d++){let u=c[d];h.push(u.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],d=r[c];for(let f=0,u=d.length;f<u;f++)h.push(d[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},xc=new pt,Mi=new ts,Ir=new ai,wc=new L,Dr=new L,Lr=new L,Gr=new L,Ka=new L,Br=new L,Tc=new L,Ur=new L,m=class extends _t{constructor(e=new vt,t=new _e){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Br.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],d=r[l];h!==0&&(Ka.fromBufferAttribute(d,e),o?Br.addScaledVector(Ka,h):Br.addScaledVector(Ka.sub(t),h))}t.add(Br)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ir.copy(i.boundingSphere),Ir.applyMatrix4(r),Mi.copy(e.ray).recast(e.near),!(Ir.containsPoint(Mi.origin)===!1&&(Mi.intersectSphere(Ir,wc)===null||Mi.origin.distanceToSquared(wc)>(e.far-e.near)**2))&&(xc.copy(r).invert(),Mi.copy(e.ray).applyMatrix4(xc),!(i.boundingBox!==null&&Mi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Mi)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,f=r.groups,u=r.drawRange;if(a!==null)if(Array.isArray(o))for(let E=0,M=f.length;E<M;E++){let g=f[E],p=o[g.materialIndex],T=Math.max(g.start,u.start),y=Math.min(a.count,Math.min(g.start+g.count,u.start+u.count));for(let x=T,S=y;x<S;x+=3){let b=a.getX(x),C=a.getX(x+1),H=a.getX(x+2);s=Fr(this,p,e,i,c,h,d,b,C,H),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let E=Math.max(0,u.start),M=Math.min(a.count,u.start+u.count);for(let g=E,p=M;g<p;g+=3){let T=a.getX(g),y=a.getX(g+1),x=a.getX(g+2);s=Fr(this,o,e,i,c,h,d,T,y,x),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let E=0,M=f.length;E<M;E++){let g=f[E],p=o[g.materialIndex],T=Math.max(g.start,u.start),y=Math.min(l.count,Math.min(g.start+g.count,u.start+u.count));for(let x=T,S=y;x<S;x+=3){let b=x,C=x+1,H=x+2;s=Fr(this,p,e,i,c,h,d,b,C,H),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let E=Math.max(0,u.start),M=Math.min(l.count,u.start+u.count);for(let g=E,p=M;g<p;g+=3){let T=g,y=g+1,x=g+2;s=Fr(this,o,e,i,c,h,d,T,y,x),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function Vd(n,e,t,i,s,r,o,a){let l;if(e.side===Ft?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===Fn,a),l===null)return null;Ur.copy(a),Ur.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Ur);return c<t.near||c>t.far?null:{distance:c,point:Ur.clone(),object:n}}function Fr(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,Dr),n.getVertexPosition(l,Lr),n.getVertexPosition(c,Gr);let h=Vd(n,e,t,i,Dr,Lr,Gr,Tc);if(h){let d=new L;ii.getBarycoord(Tc,Dr,Lr,Gr,d),s&&(h.uv=ii.getInterpolatedAttribute(s,a,l,c,d,new Se)),r&&(h.uv1=ii.getInterpolatedAttribute(r,a,l,c,d,new Se)),o&&(h.normal=ii.getInterpolatedAttribute(o,a,l,c,d,new L),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:l,c,normal:new L,materialIndex:0};ii.getNormal(Dr,Lr,Gr,f.normal),h.face=f,h.barycoord=d}return h}var z=class n extends vt{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],d=[],f=0,u=0;E("z","y","x",-1,-1,i,t,e,o,r,0),E("z","y","x",1,-1,i,t,-e,o,r,1),E("x","z","y",1,1,e,i,t,s,o,2),E("x","z","y",1,-1,e,i,-t,s,o,3),E("x","y","z",1,-1,e,t,i,s,r,4),E("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new ot(c,3)),this.setAttribute("normal",new ot(h,3)),this.setAttribute("uv",new ot(d,2));function E(M,g,p,T,y,x,S,b,C,H,_){let w=x/C,P=S/H,I=x/2,B=S/2,F=b/2,W=C+1,Y=H+1,Q=0,N=0,ee=new L;for(let $=0;$<Y;$++){let fe=$*P-B;for(let be=0;be<W;be++){let Re=be*w-I;ee[M]=Re*T,ee[g]=fe*y,ee[p]=F,c.push(ee.x,ee.y,ee.z),ee[M]=0,ee[g]=0,ee[p]=b>0?1:-1,h.push(ee.x,ee.y,ee.z),d.push(be/C),d.push(1-$/H),Q+=1}}for(let $=0;$<H;$++)for(let fe=0;fe<C;fe++){let be=f+fe+W*$,Re=f+fe+W*($+1),K=f+(fe+1)+W*($+1),ae=f+(fe+1)+W*$;l.push(be,Re,ae),l.push(Re,K,ae),N+=6}a.addGroup(u,N,_),u+=N,f+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Pi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function zt(n){let e={};for(let t=0;t<n.length;t++){let i=Pi(n[t]);for(let s in i)e[s]=i[s]}return e}function Wd(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Bl(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:dt.workingColorSpace}var pa={clone:Pi,merge:zt},Xd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Yd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ut=class extends yn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Xd,this.fragmentShader=Yd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Pi(e.uniforms),this.uniformsGroups=Wd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},zs=class extends _t{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pt,this.projectionMatrix=new pt,this.projectionMatrixInverse=new pt,this.coordinateSystem=wn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ni=new L,_c=new Se,vc=new Se,Ht=class extends zs{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Us*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ha*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Us*2*Math.atan(Math.tan(Ha*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ni.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ni.x,ni.y).multiplyScalar(-e/ni.z),ni.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ni.x,ni.y).multiplyScalar(-e/ni.z)}getViewSize(e,t){return this.getViewBounds(e,_c,vc),t.subVectors(vc,_c)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ha*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Ji=-90,Ki=1,eo=class extends _t{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ht(Ji,Ki,e,t);s.layers=this.layers,this.add(s);let r=new Ht(Ji,Ki,e,t);r.layers=this.layers,this.add(r);let o=new Ht(Ji,Ki,e,t);o.layers=this.layers,this.add(o);let a=new Ht(Ji,Ki,e,t);a.layers=this.layers,this.add(a);let l=new Ht(Ji,Ki,e,t);l.layers=this.layers,this.add(l);let c=new Ht(Ji,Ki,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===wn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Bs)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,d=e.getRenderTarget(),f=e.getActiveCubeFace(),u=e.getActiveMipmapLevel(),E=e.xr.enabled;e.xr.enabled=!1;let M=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=M,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(d,f,u),e.xr.enabled=E,i.texture.needsPMREMUpdate=!0}},Vs=class extends Wt{constructor(e=[],t=Ci,i,s,r,o,a,l,c,h){super(e,t,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},to=class extends hn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Vs(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Mn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new z(5,5,5),r=new Ut({name:"CubemapFromEquirect",uniforms:Pi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ft,blending:zn});r.uniforms.tEquirect.value=t;let o=new m(s,r),a=t.minFilter;return t.minFilter===di&&(t.minFilter=Mn),new eo(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},te=class extends _t{constructor(){super(),this.isGroup=!0,this.type="Group"}},qd={type:"move"},ns=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new te,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new te,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new te,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let M of e.hand.values()){let g=t.getJointPose(M,i),p=this._getHandJoint(c,M);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],f=h.position.distanceTo(d.position),u=.02,E=.005;c.inputState.pinching&&f>u+E?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=u-E&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(qd)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new te;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Ws=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ie(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Xs=class extends _t{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Xt,this.environmentIntensity=1,this.environmentRotation=new Xt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var $a=new L,Zd=new L,Jd=new it,ln=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=$a.subVectors(i,t).cross(Zd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta($a),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Jd.getNormalMatrix(e),s=this.coplanarPoint($a).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},yi=new ai,Nr=new L,is=class{constructor(e=new ln,t=new ln,i=new ln,s=new ln,r=new ln,o=new ln){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=wn){let i=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],d=s[6],f=s[7],u=s[8],E=s[9],M=s[10],g=s[11],p=s[12],T=s[13],y=s[14],x=s[15];if(i[0].setComponents(l-r,f-c,g-u,x-p).normalize(),i[1].setComponents(l+r,f+c,g+u,x+p).normalize(),i[2].setComponents(l+o,f+h,g+E,x+T).normalize(),i[3].setComponents(l-o,f-h,g-E,x-T).normalize(),i[4].setComponents(l-a,f-d,g-M,x-y).normalize(),t===wn)i[5].setComponents(l+a,f+d,g+M,x+y).normalize();else if(t===Bs)i[5].setComponents(a,d,M,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),yi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),yi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(yi)}intersectsSprite(e){return yi.center.set(0,0,0),yi.radius=.7071067811865476,yi.applyMatrix4(e.matrixWorld),this.intersectsSphere(yi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Nr.x=s.normal.x>0?e.max.x:e.min.x,Nr.y=s.normal.y>0?e.max.y:e.min.y,Nr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Nr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ys=class extends yn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ie(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},no=new L,io=new L,Sc=new pt,Hs=new ts,kr=new ai,Qa=new L,bc=new L,so=class extends _t{constructor(e=new vt,t=new Ys){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)no.fromBufferAttribute(t,s-1),io.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=no.distanceTo(io);e.setAttribute("lineDistance",new ot(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),kr.copy(i.boundingSphere),kr.applyMatrix4(s),kr.radius+=r,e.ray.intersectsSphere(kr)===!1)return;Sc.copy(s).invert(),Hs.copy(e.ray).applyMatrix4(Sc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){let u=Math.max(0,o.start),E=Math.min(h.count,o.start+o.count);for(let M=u,g=E-1;M<g;M+=c){let p=h.getX(M),T=h.getX(M+1),y=Or(this,e,Hs,l,p,T,M);y&&t.push(y)}if(this.isLineLoop){let M=h.getX(E-1),g=h.getX(u),p=Or(this,e,Hs,l,M,g,E-1);p&&t.push(p)}}else{let u=Math.max(0,o.start),E=Math.min(f.count,o.start+o.count);for(let M=u,g=E-1;M<g;M+=c){let p=Or(this,e,Hs,l,M,M+1,M);p&&t.push(p)}if(this.isLineLoop){let M=Or(this,e,Hs,l,E-1,u,E-1);M&&t.push(M)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Or(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(no.fromBufferAttribute(a,s),io.fromBufferAttribute(a,r),t.distanceSqToSegment(no,io,Qa,bc)>i)return;Qa.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Qa);if(!(c<e.near||c>e.far))return{distance:c,point:bc.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var Rc=new L,Ac=new L,ro=class extends so{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)Rc.fromBufferAttribute(t,s),Ac.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Rc.distanceTo(Ac);e.setAttribute("lineDistance",new ot(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var vi=class extends yn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ie(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Cc=new pt,cl=new ts,zr=new ai,Vr=new L,ss=class extends _t{constructor(e=new vt,t=new vi){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),zr.copy(i.boundingSphere),zr.applyMatrix4(s),zr.radius+=r,e.ray.intersectsSphere(zr)===!1)return;Cc.copy(s).invert(),cl.copy(e.ray).applyMatrix4(Cc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,d=i.attributes.position;if(c!==null){let f=Math.max(0,o.start),u=Math.min(c.count,o.start+o.count);for(let E=f,M=u;E<M;E++){let g=c.getX(E);Vr.fromBufferAttribute(d,g),Hc(Vr,g,l,s,e,t,this)}}else{let f=Math.max(0,o.start),u=Math.min(d.count,o.start+o.count);for(let E=f,M=u;E<M;E++)Vr.fromBufferAttribute(d,E),Hc(Vr,E,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Hc(n,e,t,i,s,r,o){let a=cl.distanceSqToPoint(n);if(a<t){let l=new L;cl.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Yt=class extends Wt{constructor(e,t,i,s,r,o,a,l,c){super(e,t,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},qs=class extends Wt{constructor(e,t,i=ui,s,r,o,a=cn,l=cn,c,h=Qi){if(h!==Qi&&h!==us)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new es(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},en=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],f=i[s+1]-h,u=(o-h)/f;return(s+u)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new Se:new L);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new L,s=[],r=[],o=[],a=new L,l=new pt;for(let u=0;u<=e;u++){let E=u/e;s[u]=this.getTangentAt(E,new L)}r[0]=new L,o[0]=new L;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),f=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),f<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let u=1;u<=e;u++){if(r[u]=r[u-1].clone(),o[u]=o[u-1].clone(),a.crossVectors(s[u-1],s[u]),a.length()>Number.EPSILON){a.normalize();let E=Math.acos(rt(s[u-1].dot(s[u]),-1,1));r[u].applyMatrix4(l.makeRotationAxis(a,E))}o[u].crossVectors(s[u],r[u])}if(t===!0){let u=Math.acos(rt(r[0].dot(r[e]),-1,1));u/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(u=-u);for(let E=1;E<=e;E++)r[E].applyMatrix4(l.makeRotationAxis(s[E],u*E)),o[E].crossVectors(s[E],r[E])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},rs=class extends en{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new Se){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),f=l-this.aX,u=c-this.aY;l=f*h-u*d+this.aX,c=f*d+u*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},oo=class extends rs{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Ul(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,d){let f=(o-r)/c-(a-r)/(c+h)+(a-o)/h,u=(a-o)/h-(l-o)/(h+d)+(l-a)/d;f*=h,u*=h,s(o,a,f,u)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Wr=new L,ja=new Ul,el=new Ul,tl=new Ul,Jt=class extends en{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new L){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Wr.subVectors(s[0],s[1]).add(s[0]),c=Wr);let d=s[a%r],f=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Wr.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Wr),this.curveType==="centripetal"||this.curveType==="chordal"){let u=this.curveType==="chordal"?.5:.25,E=Math.pow(c.distanceToSquared(d),u),M=Math.pow(d.distanceToSquared(f),u),g=Math.pow(f.distanceToSquared(h),u);M<1e-4&&(M=1),E<1e-4&&(E=M),g<1e-4&&(g=M),ja.initNonuniformCatmullRom(c.x,d.x,f.x,h.x,E,M,g),el.initNonuniformCatmullRom(c.y,d.y,f.y,h.y,E,M,g),tl.initNonuniformCatmullRom(c.z,d.z,f.z,h.z,E,M,g)}else this.curveType==="catmullrom"&&(ja.initCatmullRom(c.x,d.x,f.x,h.x,this.tension),el.initCatmullRom(c.y,d.y,f.y,h.y,this.tension),tl.initCatmullRom(c.z,d.z,f.z,h.z,this.tension));return i.set(ja.calc(l),el.calc(l),tl.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new L().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Pc(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function Kd(n,e){let t=1-n;return t*t*e}function $d(n,e){return 2*(1-n)*n*e}function Qd(n,e){return n*n*e}function Is(n,e,t,i){return Kd(n,e)+$d(n,t)+Qd(n,i)}function jd(n,e){let t=1-n;return t*t*t*e}function eu(n,e){let t=1-n;return 3*t*t*n*e}function tu(n,e){return 3*(1-n)*n*n*e}function nu(n,e){return n*n*n*e}function Ds(n,e,t,i,s){return jd(n,e)+eu(n,t)+tu(n,i)+nu(n,s)}var Zs=class extends en{constructor(e=new Se,t=new Se,i=new Se,s=new Se){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new Se){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ds(e,s.x,r.x,o.x,a.x),Ds(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ao=class extends en{constructor(e=new L,t=new L,i=new L,s=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new L){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ds(e,s.x,r.x,o.x,a.x),Ds(e,s.y,r.y,o.y,a.y),Ds(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Js=class extends en{constructor(e=new Se,t=new Se){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new Se){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Se){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},lo=class extends en{constructor(e=new L,t=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new L){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new L){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ks=class extends en{constructor(e=new Se,t=new Se,i=new Se){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new Se){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Is(e,s.x,r.x,o.x),Is(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},$s=class extends en{constructor(e=new L,t=new L,i=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new L){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Is(e,s.x,r.x,o.x),Is(e,s.y,r.y,o.y),Is(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Qs=class extends en{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new Se){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return i.set(Pc(a,l.x,c.x,h.x,d.x),Pc(a,l.y,c.y,h.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new Se().fromArray(s))}return this}},hl=Object.freeze({__proto__:null,ArcCurve:oo,CatmullRomCurve3:Jt,CubicBezierCurve:Zs,CubicBezierCurve3:ao,EllipseCurve:rs,LineCurve:Js,LineCurve3:lo,QuadraticBezierCurve:Ks,QuadraticBezierCurve3:$s,SplineCurve:Qs}),co=class extends en{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new hl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new hl[s.type]().fromJSON(s))}return this}},ho=class extends co{constructor(e){super(),this.type="Path",this.currentPoint=new Se,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Js(this.currentPoint.clone(),new Se(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new Ks(this.currentPoint.clone(),new Se(e,t),new Se(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new Zs(this.currentPoint.clone(),new Se(e,t),new Se(i,s),new Se(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Qs(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,o,a,l),this}absellipse(e,t,i,s,r,o,a,l){let c=new rs(e,t,i,s,r,o,a,l);if(this.curves.length>0){let d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},On=class n extends vt{constructor(e=[new Se(0,-.5),new Se(.5,0),new Se(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=rt(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,d=new L,f=new Se,u=new L,E=new L,M=new L,g=0,p=0;for(let T=0;T<=e.length-1;T++)switch(T){case 0:g=e[T+1].x-e[T].x,p=e[T+1].y-e[T].y,u.x=p*1,u.y=-g,u.z=p*0,M.copy(u),u.normalize(),l.push(u.x,u.y,u.z);break;case e.length-1:l.push(M.x,M.y,M.z);break;default:g=e[T+1].x-e[T].x,p=e[T+1].y-e[T].y,u.x=p*1,u.y=-g,u.z=p*0,E.copy(u),u.x+=M.x,u.y+=M.y,u.z+=M.z,u.normalize(),l.push(u.x,u.y,u.z),M.copy(E)}for(let T=0;T<=t;T++){let y=i+T*h*s,x=Math.sin(y),S=Math.cos(y);for(let b=0;b<=e.length-1;b++){d.x=e[b].x*x,d.y=e[b].y,d.z=e[b].x*S,o.push(d.x,d.y,d.z),f.x=T/t,f.y=b/(e.length-1),a.push(f.x,f.y);let C=l[3*b+0]*x,H=l[3*b+1],_=l[3*b+0]*S;c.push(C,H,_)}}for(let T=0;T<t;T++)for(let y=0;y<e.length-1;y++){let x=y+T*e.length,S=x,b=x+e.length,C=x+e.length+1,H=x+1;r.push(S,b,H),r.push(C,H,b)}this.setIndex(r),this.setAttribute("position",new ot(o,3)),this.setAttribute("uv",new ot(a,2)),this.setAttribute("normal",new ot(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},lt=class n extends On{constructor(e=1,t=1,i=4,s=8){let r=new ho;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(i),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:s}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},Mt=class n extends vt{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new L,h=new Se;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let d=0,f=3;d<=t;d++,f+=3){let u=i+d/t*s;c.x=e*Math.cos(u),c.y=e*Math.sin(u),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[f]/e+1)/2,h.y=(o[f+1]/e+1)/2,l.push(h.x,h.y)}for(let d=1;d<=t;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new ot(o,3)),this.setAttribute("normal",new ot(a,3)),this.setAttribute("uv",new ot(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},re=class n extends vt{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],f=[],u=[],E=0,M=[],g=i/2,p=0;T(),o===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new ot(d,3)),this.setAttribute("normal",new ot(f,3)),this.setAttribute("uv",new ot(u,2));function T(){let x=new L,S=new L,b=0,C=(t-e)/i;for(let H=0;H<=r;H++){let _=[],w=H/r,P=w*(t-e)+e;for(let I=0;I<=s;I++){let B=I/s,F=B*l+a,W=Math.sin(F),Y=Math.cos(F);S.x=P*W,S.y=-w*i+g,S.z=P*Y,d.push(S.x,S.y,S.z),x.set(W,C,Y).normalize(),f.push(x.x,x.y,x.z),u.push(B,1-w),_.push(E++)}M.push(_)}for(let H=0;H<s;H++)for(let _=0;_<r;_++){let w=M[_][H],P=M[_+1][H],I=M[_+1][H+1],B=M[_][H+1];(e>0||_!==0)&&(h.push(w,P,B),b+=3),(t>0||_!==r-1)&&(h.push(P,I,B),b+=3)}c.addGroup(p,b,0),p+=b}function y(x){let S=E,b=new Se,C=new L,H=0,_=x===!0?e:t,w=x===!0?1:-1;for(let I=1;I<=s;I++)d.push(0,g*w,0),f.push(0,w,0),u.push(.5,.5),E++;let P=E;for(let I=0;I<=s;I++){let F=I/s*l+a,W=Math.cos(F),Y=Math.sin(F);C.x=_*Y,C.y=g*w,C.z=_*W,d.push(C.x,C.y,C.z),f.push(0,w,0),b.x=W*.5+.5,b.y=Y*.5*w+.5,u.push(b.x,b.y),E++}for(let I=0;I<s;I++){let B=S+I,F=P+I;x===!0?h.push(F,F+1,B):h.push(F+1,F,B),H+=3}c.addGroup(p,H,x===!0?1:2),p+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Xe=class n extends re{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},os=class n extends vt{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new ot(r,3)),this.setAttribute("normal",new ot(r.slice(),3)),this.setAttribute("uv",new ot(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(T){let y=new L,x=new L,S=new L;for(let b=0;b<t.length;b+=3)u(t[b+0],y),u(t[b+1],x),u(t[b+2],S),l(y,x,S,T)}function l(T,y,x,S){let b=S+1,C=[];for(let H=0;H<=b;H++){C[H]=[];let _=T.clone().lerp(x,H/b),w=y.clone().lerp(x,H/b),P=b-H;for(let I=0;I<=P;I++)I===0&&H===b?C[H][I]=_:C[H][I]=_.clone().lerp(w,I/P)}for(let H=0;H<b;H++)for(let _=0;_<2*(b-H)-1;_++){let w=Math.floor(_/2);_%2===0?(f(C[H][w+1]),f(C[H+1][w]),f(C[H][w])):(f(C[H][w+1]),f(C[H+1][w+1]),f(C[H+1][w]))}}function c(T){let y=new L;for(let x=0;x<r.length;x+=3)y.x=r[x+0],y.y=r[x+1],y.z=r[x+2],y.normalize().multiplyScalar(T),r[x+0]=y.x,r[x+1]=y.y,r[x+2]=y.z}function h(){let T=new L;for(let y=0;y<r.length;y+=3){T.x=r[y+0],T.y=r[y+1],T.z=r[y+2];let x=g(T)/2/Math.PI+.5,S=p(T)/Math.PI+.5;o.push(x,1-S)}E(),d()}function d(){for(let T=0;T<o.length;T+=6){let y=o[T+0],x=o[T+2],S=o[T+4],b=Math.max(y,x,S),C=Math.min(y,x,S);b>.9&&C<.1&&(y<.2&&(o[T+0]+=1),x<.2&&(o[T+2]+=1),S<.2&&(o[T+4]+=1))}}function f(T){r.push(T.x,T.y,T.z)}function u(T,y){let x=T*3;y.x=e[x+0],y.y=e[x+1],y.z=e[x+2]}function E(){let T=new L,y=new L,x=new L,S=new L,b=new Se,C=new Se,H=new Se;for(let _=0,w=0;_<r.length;_+=9,w+=6){T.set(r[_+0],r[_+1],r[_+2]),y.set(r[_+3],r[_+4],r[_+5]),x.set(r[_+6],r[_+7],r[_+8]),b.set(o[w+0],o[w+1]),C.set(o[w+2],o[w+3]),H.set(o[w+4],o[w+5]),S.copy(T).add(y).add(x).divideScalar(3);let P=g(S);M(b,w+0,T,P),M(C,w+2,y,P),M(H,w+4,x,P)}}function M(T,y,x,S){S<0&&T.x===1&&(o[y]=T.x-1),x.x===0&&x.z===0&&(o[y]=S/2/Math.PI+.5)}function g(T){return Math.atan2(T.z,-T.x)}function p(T){return Math.atan2(-T.y,Math.sqrt(T.x*T.x+T.z*T.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}},li=class n extends os{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=1/i,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-i,0,-s,i,0,s,-i,0,s,i,-s,-i,0,-s,i,0,s,-i,0,s,i,0,-i,0,-s,i,0,-s,-i,0,s,i,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var js=class n extends os{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Rt=class n extends os{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},$e=class n extends vt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,d=e/a,f=t/l,u=[],E=[],M=[],g=[];for(let p=0;p<h;p++){let T=p*f-o;for(let y=0;y<c;y++){let x=y*d-r;E.push(x,-T,0),M.push(0,0,1),g.push(y/a),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let T=0;T<a;T++){let y=T+c*p,x=T+c*(p+1),S=T+1+c*(p+1),b=T+1+c*p;u.push(y,x,b),u.push(x,S,b)}this.setIndex(u),this.setAttribute("position",new ot(E,3)),this.setAttribute("normal",new ot(M,3)),this.setAttribute("uv",new ot(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Tn=class n extends vt{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],d=e,f=(t-e)/s,u=new L,E=new Se;for(let M=0;M<=s;M++){for(let g=0;g<=i;g++){let p=r+g/i*o;u.x=d*Math.cos(p),u.y=d*Math.sin(p),l.push(u.x,u.y,u.z),c.push(0,0,1),E.x=(u.x/t+1)/2,E.y=(u.y/t+1)/2,h.push(E.x,E.y)}d+=f}for(let M=0;M<s;M++){let g=M*(i+1);for(let p=0;p<i;p++){let T=p+g,y=T,x=T+i+1,S=T+i+2,b=T+1;a.push(y,x,b),a.push(x,S,b)}}this.setIndex(a),this.setAttribute("position",new ot(l,3)),this.setAttribute("normal",new ot(c,3)),this.setAttribute("uv",new ot(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var ie=class n extends vt{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],d=new L,f=new L,u=[],E=[],M=[],g=[];for(let p=0;p<=i;p++){let T=[],y=p/i,x=0;p===0&&o===0?x=.5/t:p===i&&l===Math.PI&&(x=-.5/t);for(let S=0;S<=t;S++){let b=S/t;d.x=-e*Math.cos(s+b*r)*Math.sin(o+y*a),d.y=e*Math.cos(o+y*a),d.z=e*Math.sin(s+b*r)*Math.sin(o+y*a),E.push(d.x,d.y,d.z),f.copy(d).normalize(),M.push(f.x,f.y,f.z),g.push(b+x,1-y),T.push(c++)}h.push(T)}for(let p=0;p<i;p++)for(let T=0;T<t;T++){let y=h[p][T+1],x=h[p][T],S=h[p+1][T],b=h[p+1][T+1];(p!==0||o>0)&&u.push(y,x,b),(p!==i-1||l<Math.PI)&&u.push(x,S,b)}this.setIndex(u),this.setAttribute("position",new ot(E,3)),this.setAttribute("normal",new ot(M,3)),this.setAttribute("uv",new ot(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ne=class n extends vt{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new L,d=new L,f=new L;for(let u=0;u<=i;u++)for(let E=0;E<=s;E++){let M=E/s*r,g=u/i*Math.PI*2;d.x=(e+t*Math.cos(g))*Math.cos(M),d.y=(e+t*Math.cos(g))*Math.sin(M),d.z=t*Math.sin(g),a.push(d.x,d.y,d.z),h.x=e*Math.cos(M),h.y=e*Math.sin(M),f.subVectors(d,h).normalize(),l.push(f.x,f.y,f.z),c.push(E/s),c.push(u/i)}for(let u=1;u<=i;u++)for(let E=1;E<=s;E++){let M=(s+1)*u+E-1,g=(s+1)*(u-1)+E-1,p=(s+1)*(u-1)+E,T=(s+1)*u+E;o.push(M,g,T),o.push(g,p,T)}this.setIndex(o),this.setAttribute("position",new ot(a,3)),this.setAttribute("normal",new ot(l,3)),this.setAttribute("uv",new ot(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var dn=class n extends vt{constructor(e=new $s(new L(-1,-1,0),new L(-1,1,0),new L(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new L,l=new L,c=new Se,h=new L,d=[],f=[],u=[],E=[];M(),this.setIndex(E),this.setAttribute("position",new ot(d,3)),this.setAttribute("normal",new ot(f,3)),this.setAttribute("uv",new ot(u,2));function M(){for(let y=0;y<t;y++)g(y);g(r===!1?t:0),T(),p()}function g(y){h=e.getPointAt(y/t,h);let x=o.normals[y],S=o.binormals[y];for(let b=0;b<=s;b++){let C=b/s*Math.PI*2,H=Math.sin(C),_=-Math.cos(C);l.x=_*x.x+H*S.x,l.y=_*x.y+H*S.y,l.z=_*x.z+H*S.z,l.normalize(),f.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,d.push(a.x,a.y,a.z)}}function p(){for(let y=1;y<=t;y++)for(let x=1;x<=s;x++){let S=(s+1)*(y-1)+(x-1),b=(s+1)*y+(x-1),C=(s+1)*y+x,H=(s+1)*(y-1)+x;E.push(S,b,H),E.push(b,C,H)}}function T(){for(let y=0;y<=t;y++)for(let x=0;x<=s;x++)c.x=y/t,c.y=x/s,u.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new hl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Si=class extends yn{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Ie(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var A=class extends yn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ie(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ie(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Il,this.normalScale=new Se(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var uo=class extends yn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=hh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},fo=class extends yn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Xr(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function iu(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var bi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},po=class extends bi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:sl,endingEnd:sl}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case rl:r=e,a=2*t-i;break;case ol:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case rl:o=e,l=2*i-t;break;case ol:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,d=this._offsetNext,f=this._weightPrev,u=this._weightNext,E=(i-t)/(s-t),M=E*E,g=M*E,p=-f*g+2*f*M-f*E,T=(1+f)*g+(-1.5-2*f)*M+(-.5+f)*E+1,y=(-1-u)*g+(1.5+u)*M+.5*E,x=u*g-u*M;for(let S=0;S!==a;++S)r[S]=p*o[h+S]+T*o[c+S]+y*o[l+S]+x*o[d+S];return r}},mo=class extends bi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(s-t),d=1-h;for(let f=0;f!==a;++f)r[f]=o[c+f]*d+o[l+f]*h;return r}},Eo=class extends bi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},tn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Xr(t,this.TimeBufferType),this.values=Xr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Xr(e.times,Array),values:Xr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Eo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new mo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new po(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ls:t=this.InterpolantFactoryMethodDiscrete;break;case Kr:t=this.InterpolantFactoryMethodLinear;break;case Yr:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ls;case this.InterpolantFactoryMethodLinear:return Kr;case this.InterpolantFactoryMethodSmooth:return Yr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&iu(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Yr,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let d=a*i,f=d-i,u=d+i;for(let E=0;E!==i;++E){let M=t[d+E];if(M!==t[f+E]||M!==t[u+E]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let d=a*i,f=o*i;for(let u=0;u!==i;++u)t[f+u]=t[d+u]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};tn.prototype.ValueTypeName="";tn.prototype.TimeBufferType=Float32Array;tn.prototype.ValueBufferType=Float32Array;tn.prototype.DefaultInterpolation=Kr;var ci=class extends tn{constructor(e,t,i){super(e,t,i)}};ci.prototype.ValueTypeName="bool";ci.prototype.ValueBufferType=Array;ci.prototype.DefaultInterpolation=Ls;ci.prototype.InterpolantFactoryMethodLinear=void 0;ci.prototype.InterpolantFactoryMethodSmooth=void 0;var go=class extends tn{constructor(e,t,i,s){super(e,t,i,s)}};go.prototype.ValueTypeName="color";var Mo=class extends tn{constructor(e,t,i,s){super(e,t,i,s)}};Mo.prototype.ValueTypeName="number";var yo=class extends bi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)bt.slerpFlat(r,0,o,c-a,o,c,l);return r}},er=class extends tn{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new yo(this.times,this.values,this.getValueSize(),e)}};er.prototype.ValueTypeName="quaternion";er.prototype.InterpolantFactoryMethodSmooth=void 0;var hi=class extends tn{constructor(e,t,i){super(e,t,i)}};hi.prototype.ValueTypeName="string";hi.prototype.ValueBufferType=Array;hi.prototype.DefaultInterpolation=Ls;hi.prototype.InterpolantFactoryMethodLinear=void 0;hi.prototype.InterpolantFactoryMethodSmooth=void 0;var xo=class extends tn{constructor(e,t,i,s){super(e,t,i,s)}};xo.prototype.ValueTypeName="vector";var dl={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(this.files[n]=e)},get:function(n){if(this.enabled!==!1)return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}},wo=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,f=c.length;d<f;d+=2){let u=c[d],E=c[d+1];if(u.global&&(u.lastIndex=0),u.test(h))return E}return null}}},Sh=new wo,as=class{constructor(e){this.manager=e!==void 0?e:Sh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};as.DEFAULT_MATERIAL_NAME="__DEFAULT";var To=class extends as{constructor(e){super(e)}load(e,t,i,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=dl.get(e);if(o!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o;let a=ji("img");function l(){h(),dl.add(e,this),t&&t(this),r.manager.itemEnd(e)}function c(d){h(),s&&s(d),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(e),a.src=e,a}};var tr=class extends as{constructor(e){super(e)}load(e,t,i,s){let r=new Wt,o=new To(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},i,s),r}},Ri=class extends _t{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ie(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},nr=class extends Ri{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(_t.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ie(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},nl=new pt,Ic=new L,Dc=new L,ir=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Se(512,512),this.map=null,this.mapPass=null,this.matrix=new pt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new is,this._frameExtents=new Se(1,1),this._viewportCount=1,this._viewports=[new ft(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;Ic.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ic),Dc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Dc),t.updateMatrixWorld(),nl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(nl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(nl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ul=class extends ir{constructor(){super(new Ht(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Us*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(i!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=i,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},Ai=class extends Ri{constructor(e,t,i=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(_t.DEFAULT_UP),this.updateMatrix(),this.target=new _t,this.distance=i,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new ul}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Lc=new pt,Ps=new L,il=new L,fl=class extends ir{constructor(){super(new Ht(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Se(4,2),this._viewportCount=6,this._viewports=[new ft(2,1,1,1),new ft(0,1,1,1),new ft(3,1,1,1),new ft(1,1,1,1),new ft(3,0,1,1),new ft(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),Ps.setFromMatrixPosition(e.matrixWorld),i.position.copy(Ps),il.copy(i.position),il.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(il),i.updateMatrixWorld(),s.makeTranslation(-Ps.x,-Ps.y,-Ps.z),Lc.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Lc)}},St=class extends Ri{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new fl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},sr=class extends zs{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},pl=class extends ir{constructor(){super(new sr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ls=class extends Ri{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(_t.DEFAULT_UP),this.updateMatrix(),this.target=new _t,this.shadow=new pl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var _o=class extends Ht{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e,this.index=0}};var Fl="\\[\\]\\.:\\/",su=new RegExp("["+Fl+"]","g"),Nl="[^"+Fl+"]",ru="[^"+Fl.replace("\\.","")+"]",ou=/((?:WC+[\/:])*)/.source.replace("WC",Nl),au=/(WCOD+)?/.source.replace("WCOD",ru),lu=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Nl),cu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Nl),hu=new RegExp("^"+ou+au+lu+cu+"$"),du=["material","materials","bones","map"],ml=class{constructor(e,t,i){let s=i||yt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},yt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(su,"")}static parseTrackName(e){let t=hu.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);du.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};yt.Composite=ml;yt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};yt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};yt.prototype.GetterByBindingType=[yt.prototype._getValue_direct,yt.prototype._getValue_array,yt.prototype._getValue_arrayElement,yt.prototype._getValue_toArray];yt.prototype.SetterByBindingTypeAndVersioning=[[yt.prototype._setValue_direct,yt.prototype._setValue_direct_setNeedsUpdate,yt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_array,yt.prototype._setValue_array_setNeedsUpdate,yt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_arrayElement,yt.prototype._setValue_arrayElement_setNeedsUpdate,yt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[yt.prototype._setValue_fromArray,yt.prototype._setValue_fromArray_setNeedsUpdate,yt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var kE=new Float32Array(1);var cs=class extends ro{constructor(e=10,t=10,i=4473924,s=8947848){i=new Ie(i),s=new Ie(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let f=0,u=0,E=-a;f<=t;f++,E+=o){l.push(-a,0,E,a,0,E),l.push(E,0,-a,E,0,a);let M=f===r?i:s;M.toArray(c,u),u+=3,M.toArray(c,u),u+=3,M.toArray(c,u),u+=3,M.toArray(c,u),u+=3}let h=new vt;h.setAttribute("position",new ot(l,3)),h.setAttribute("color",new ot(c,3));let d=new Ys({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};function kl(n,e,t,i){let s=uu(i);switch(t){case Sl:return n*e;case Rl:return n*e;case Al:return n*e*2;case Cl:return n*e/s.components*s.byteLength;case No:return n*e/s.components*s.byteLength;case Hl:return n*e*2/s.components*s.byteLength;case ko:return n*e*2/s.components*s.byteLength;case bl:return n*e*3/s.components*s.byteLength;case un:return n*e*4/s.components*s.byteLength;case Oo:return n*e*4/s.components*s.byteLength;case ar:case lr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case cr:case hr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Vo:case Xo:return Math.max(n,16)*Math.max(e,8)/4;case zo:case Wo:return Math.max(n,8)*Math.max(e,8)/2;case Yo:case qo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Zo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Jo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ko:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case $o:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case jo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ea:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case ta:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case na:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case ia:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case sa:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case ra:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case oa:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case aa:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case la:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case dr:case ca:case ha:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Pl:case da:return Math.ceil(n/4)*Math.ceil(e/4)*8;case ua:case fa:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function uu(n){switch(n){case Sn:case Tl:return{byteLength:1,components:1};case hs:case _l:case fi:return{byteLength:2,components:1};case Uo:case Fo:return{byteLength:2,components:4};case ui:case Bo:case bn:return{byteLength:4,components:1};case vl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"175"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="175");function Jh(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function pu(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,d=c.byteLength,f=n.createBuffer();n.bindBuffer(l,f),n.bufferData(l,c,h),a.onUploadCallback();let u;if(c instanceof Float32Array)u=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?u=n.HALF_FLOAT:u=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)u=n.SHORT;else if(c instanceof Uint32Array)u=n.UNSIGNED_INT;else if(c instanceof Int32Array)u=n.INT;else if(c instanceof Int8Array)u=n.BYTE;else if(c instanceof Uint8Array)u=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)u=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:u,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let h=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,h);else{d.sort((u,E)=>u.start-E.start);let f=0;for(let u=1;u<d.length;u++){let E=d[f],M=d[u];M.start<=E.start+E.count+1?E.count=Math.max(E.count,M.start+M.count-E.start):(++f,d[f]=M)}d.length=f+1;for(let u=0,E=d.length;u<E;u++){let M=d[u];n.bufferSubData(c,M.start*h.BYTES_PER_ELEMENT,h,M.start,M.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var mu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Eu=`#ifdef USE_ALPHAHASH
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
#endif`,gu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Mu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,xu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,wu=`#ifdef USE_AOMAP
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
#endif`,Tu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,_u=`#ifdef USE_BATCHING
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
#endif`,vu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Su=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,bu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ru=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Au=`#ifdef USE_IRIDESCENCE
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
#endif`,Cu=`#ifdef USE_BUMPMAP
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
#endif`,Hu=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Pu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Iu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Du=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Lu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Gu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Bu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Uu=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Fu=`#define PI 3.141592653589793
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
} // validated`,Nu=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,ku=`vec3 transformedNormal = objectNormal;
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
#endif`,Ou=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,zu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Vu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Wu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Xu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Yu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,qu=`#ifdef USE_ENVMAP
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
#endif`,Zu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ju=`#ifdef USE_ENVMAP
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
#endif`,Ku=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,$u=`#ifdef USE_ENVMAP
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
#endif`,Qu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ju=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ef=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,tf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,nf=`#ifdef USE_GRADIENTMAP
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
}`,sf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,rf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,of=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,af=`uniform bool receiveShadow;
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
#endif`,lf=`#ifdef USE_ENVMAP
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
#endif`,cf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,hf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,df=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,uf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ff=`PhysicalMaterial material;
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
#endif`,pf=`struct PhysicalMaterial {
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
}`,mf=`
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
#endif`,Ef=`#if defined( RE_IndirectDiffuse )
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
#endif`,gf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Mf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,yf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Tf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,_f=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,vf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Sf=`#if defined( USE_POINTS_UV )
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
#endif`,bf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Rf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Af=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Cf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Hf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pf=`#ifdef USE_MORPHTARGETS
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
#endif`,If=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Df=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Lf=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Gf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Bf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Uf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Ff=`#ifdef USE_NORMALMAP
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
#endif`,Nf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,kf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Of=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,zf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Vf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Wf=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Xf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Yf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,qf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Zf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Jf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Kf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$f=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Qf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,jf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,ep=`float getShadowMask() {
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
}`,tp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,np=`#ifdef USE_SKINNING
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
#endif`,ip=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,sp=`#ifdef USE_SKINNING
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
#endif`,rp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,op=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ap=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,lp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,cp=`#ifdef USE_TRANSMISSION
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
#endif`,hp=`#ifdef USE_TRANSMISSION
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
#endif`,dp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,up=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,pp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,mp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ep=`uniform sampler2D t2D;
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
}`,gp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Mp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wp=`#include <common>
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
}`,Tp=`#if DEPTH_PACKING == 3200
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
}`,_p=`#define DISTANCE
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
}`,vp=`#define DISTANCE
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
}`,Sp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,bp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Rp=`uniform float scale;
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
}`,Ap=`uniform vec3 diffuse;
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
}`,Cp=`#include <common>
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
}`,Hp=`uniform vec3 diffuse;
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
}`,Pp=`#define LAMBERT
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
}`,Ip=`#define LAMBERT
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
}`,Dp=`#define MATCAP
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
}`,Lp=`#define MATCAP
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
}`,Gp=`#define NORMAL
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
}`,Bp=`#define NORMAL
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
}`,Up=`#define PHONG
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
}`,Fp=`#define PHONG
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
}`,Np=`#define STANDARD
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
}`,kp=`#define STANDARD
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
}`,Op=`#define TOON
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
}`,zp=`#define TOON
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
}`,Vp=`uniform float size;
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
}`,Wp=`uniform vec3 diffuse;
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
}`,Xp=`#include <common>
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
}`,Yp=`uniform vec3 color;
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
}`,qp=`uniform float rotation;
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
}`,Zp=`uniform vec3 diffuse;
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
}`,st={alphahash_fragment:mu,alphahash_pars_fragment:Eu,alphamap_fragment:gu,alphamap_pars_fragment:Mu,alphatest_fragment:yu,alphatest_pars_fragment:xu,aomap_fragment:wu,aomap_pars_fragment:Tu,batching_pars_vertex:_u,batching_vertex:vu,begin_vertex:Su,beginnormal_vertex:bu,bsdfs:Ru,iridescence_fragment:Au,bumpmap_pars_fragment:Cu,clipping_planes_fragment:Hu,clipping_planes_pars_fragment:Pu,clipping_planes_pars_vertex:Iu,clipping_planes_vertex:Du,color_fragment:Lu,color_pars_fragment:Gu,color_pars_vertex:Bu,color_vertex:Uu,common:Fu,cube_uv_reflection_fragment:Nu,defaultnormal_vertex:ku,displacementmap_pars_vertex:Ou,displacementmap_vertex:zu,emissivemap_fragment:Vu,emissivemap_pars_fragment:Wu,colorspace_fragment:Xu,colorspace_pars_fragment:Yu,envmap_fragment:qu,envmap_common_pars_fragment:Zu,envmap_pars_fragment:Ju,envmap_pars_vertex:Ku,envmap_physical_pars_fragment:lf,envmap_vertex:$u,fog_vertex:Qu,fog_pars_vertex:ju,fog_fragment:ef,fog_pars_fragment:tf,gradientmap_pars_fragment:nf,lightmap_pars_fragment:sf,lights_lambert_fragment:rf,lights_lambert_pars_fragment:of,lights_pars_begin:af,lights_toon_fragment:cf,lights_toon_pars_fragment:hf,lights_phong_fragment:df,lights_phong_pars_fragment:uf,lights_physical_fragment:ff,lights_physical_pars_fragment:pf,lights_fragment_begin:mf,lights_fragment_maps:Ef,lights_fragment_end:gf,logdepthbuf_fragment:Mf,logdepthbuf_pars_fragment:yf,logdepthbuf_pars_vertex:xf,logdepthbuf_vertex:wf,map_fragment:Tf,map_pars_fragment:_f,map_particle_fragment:vf,map_particle_pars_fragment:Sf,metalnessmap_fragment:bf,metalnessmap_pars_fragment:Rf,morphinstance_vertex:Af,morphcolor_vertex:Cf,morphnormal_vertex:Hf,morphtarget_pars_vertex:Pf,morphtarget_vertex:If,normal_fragment_begin:Df,normal_fragment_maps:Lf,normal_pars_fragment:Gf,normal_pars_vertex:Bf,normal_vertex:Uf,normalmap_pars_fragment:Ff,clearcoat_normal_fragment_begin:Nf,clearcoat_normal_fragment_maps:kf,clearcoat_pars_fragment:Of,iridescence_pars_fragment:zf,opaque_fragment:Vf,packing:Wf,premultiplied_alpha_fragment:Xf,project_vertex:Yf,dithering_fragment:qf,dithering_pars_fragment:Zf,roughnessmap_fragment:Jf,roughnessmap_pars_fragment:Kf,shadowmap_pars_fragment:$f,shadowmap_pars_vertex:Qf,shadowmap_vertex:jf,shadowmask_pars_fragment:ep,skinbase_vertex:tp,skinning_pars_vertex:np,skinning_vertex:ip,skinnormal_vertex:sp,specularmap_fragment:rp,specularmap_pars_fragment:op,tonemapping_fragment:ap,tonemapping_pars_fragment:lp,transmission_fragment:cp,transmission_pars_fragment:hp,uv_pars_fragment:dp,uv_pars_vertex:up,uv_vertex:fp,worldpos_vertex:pp,background_vert:mp,background_frag:Ep,backgroundCube_vert:gp,backgroundCube_frag:Mp,cube_vert:yp,cube_frag:xp,depth_vert:wp,depth_frag:Tp,distanceRGBA_vert:_p,distanceRGBA_frag:vp,equirect_vert:Sp,equirect_frag:bp,linedashed_vert:Rp,linedashed_frag:Ap,meshbasic_vert:Cp,meshbasic_frag:Hp,meshlambert_vert:Pp,meshlambert_frag:Ip,meshmatcap_vert:Dp,meshmatcap_frag:Lp,meshnormal_vert:Gp,meshnormal_frag:Bp,meshphong_vert:Up,meshphong_frag:Fp,meshphysical_vert:Np,meshphysical_frag:kp,meshtoon_vert:Op,meshtoon_frag:zp,points_vert:Vp,points_frag:Wp,shadow_vert:Xp,shadow_frag:Yp,sprite_vert:qp,sprite_frag:Zp},Le={common:{diffuse:{value:new Ie(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new it},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new it}},envmap:{envMap:{value:null},envMapRotation:{value:new it},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new it}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new it}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new it},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new it},normalScale:{value:new Se(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new it},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new it}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new it}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new it}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ie(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ie(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0},uvTransform:{value:new it}},sprite:{diffuse:{value:new Ie(16777215)},opacity:{value:1},center:{value:new Se(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new it},alphaMap:{value:null},alphaMapTransform:{value:new it},alphaTest:{value:0}}},Rn={basic:{uniforms:zt([Le.common,Le.specularmap,Le.envmap,Le.aomap,Le.lightmap,Le.fog]),vertexShader:st.meshbasic_vert,fragmentShader:st.meshbasic_frag},lambert:{uniforms:zt([Le.common,Le.specularmap,Le.envmap,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.fog,Le.lights,{emissive:{value:new Ie(0)}}]),vertexShader:st.meshlambert_vert,fragmentShader:st.meshlambert_frag},phong:{uniforms:zt([Le.common,Le.specularmap,Le.envmap,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.fog,Le.lights,{emissive:{value:new Ie(0)},specular:{value:new Ie(1118481)},shininess:{value:30}}]),vertexShader:st.meshphong_vert,fragmentShader:st.meshphong_frag},standard:{uniforms:zt([Le.common,Le.envmap,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.roughnessmap,Le.metalnessmap,Le.fog,Le.lights,{emissive:{value:new Ie(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:st.meshphysical_vert,fragmentShader:st.meshphysical_frag},toon:{uniforms:zt([Le.common,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.gradientmap,Le.fog,Le.lights,{emissive:{value:new Ie(0)}}]),vertexShader:st.meshtoon_vert,fragmentShader:st.meshtoon_frag},matcap:{uniforms:zt([Le.common,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.fog,{matcap:{value:null}}]),vertexShader:st.meshmatcap_vert,fragmentShader:st.meshmatcap_frag},points:{uniforms:zt([Le.points,Le.fog]),vertexShader:st.points_vert,fragmentShader:st.points_frag},dashed:{uniforms:zt([Le.common,Le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:st.linedashed_vert,fragmentShader:st.linedashed_frag},depth:{uniforms:zt([Le.common,Le.displacementmap]),vertexShader:st.depth_vert,fragmentShader:st.depth_frag},normal:{uniforms:zt([Le.common,Le.bumpmap,Le.normalmap,Le.displacementmap,{opacity:{value:1}}]),vertexShader:st.meshnormal_vert,fragmentShader:st.meshnormal_frag},sprite:{uniforms:zt([Le.sprite,Le.fog]),vertexShader:st.sprite_vert,fragmentShader:st.sprite_frag},background:{uniforms:{uvTransform:{value:new it},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:st.background_vert,fragmentShader:st.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new it}},vertexShader:st.backgroundCube_vert,fragmentShader:st.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:st.cube_vert,fragmentShader:st.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:st.equirect_vert,fragmentShader:st.equirect_frag},distanceRGBA:{uniforms:zt([Le.common,Le.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:st.distanceRGBA_vert,fragmentShader:st.distanceRGBA_frag},shadow:{uniforms:zt([Le.lights,Le.fog,{color:{value:new Ie(0)},opacity:{value:1}}]),vertexShader:st.shadow_vert,fragmentShader:st.shadow_frag}};Rn.physical={uniforms:zt([Rn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new it},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new it},clearcoatNormalScale:{value:new Se(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new it},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new it},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new it},sheen:{value:0},sheenColor:{value:new Ie(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new it},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new it},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new it},transmissionSamplerSize:{value:new Se},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new it},attenuationDistance:{value:0},attenuationColor:{value:new Ie(0)},specularColor:{value:new Ie(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new it},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new it},anisotropyVector:{value:new Se},anisotropyMap:{value:null},anisotropyMapTransform:{value:new it}}]),vertexShader:st.meshphysical_vert,fragmentShader:st.meshphysical_frag};var ma={r:0,b:0,g:0},Ii=new Xt,Jp=new pt;function Kp(n,e,t,i,s,r,o){let a=new Ie(0),l=r===!0?0:1,c,h,d=null,f=0,u=null;function E(y){let x=y.isScene===!0?y.background:null;return x&&x.isTexture&&(x=(y.backgroundBlurriness>0?t:e).get(x)),x}function M(y){let x=!1,S=E(y);S===null?p(a,l):S&&S.isColor&&(p(S,1),x=!0);let b=n.xr.getEnvironmentBlendMode();b==="additive"?i.buffers.color.setClear(0,0,0,1,o):b==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||x)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function g(y,x){let S=E(x);S&&(S.isCubeTexture||S.mapping===rr)?(h===void 0&&(h=new m(new z(1,1,1),new Ut({name:"BackgroundCubeMaterial",uniforms:Pi(Rn.backgroundCube.uniforms),vertexShader:Rn.backgroundCube.vertexShader,fragmentShader:Rn.backgroundCube.fragmentShader,side:Ft,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(b,C,H){this.matrixWorld.copyPosition(H.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Ii.copy(x.backgroundRotation),Ii.x*=-1,Ii.y*=-1,Ii.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(Ii.y*=-1,Ii.z*=-1),h.material.uniforms.envMap.value=S,h.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Jp.makeRotationFromEuler(Ii)),h.material.toneMapped=dt.getTransfer(S.colorSpace)!==gt,(d!==S||f!==S.version||u!==n.toneMapping)&&(h.material.needsUpdate=!0,d=S,f=S.version,u=n.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new m(new $e(2,2),new Ut({name:"BackgroundMaterial",uniforms:Pi(Rn.background.uniforms),vertexShader:Rn.background.vertexShader,fragmentShader:Rn.background.fragmentShader,side:Fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=dt.getTransfer(S.colorSpace)!==gt,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(d!==S||f!==S.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,d=S,f=S.version,u=n.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function p(y,x){y.getRGB(ma,Bl(n)),i.buffers.color.setClear(ma.r,ma.g,ma.b,x,o)}function T(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(y,x=1){a.set(y),l=x,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,p(a,l)},render:M,addToRenderList:g,dispose:T}}function $p(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=f(null),r=s,o=!1;function a(w,P,I,B,F){let W=!1,Y=d(B,I,P);r!==Y&&(r=Y,c(r.object)),W=u(w,B,I,F),W&&E(w,B,I,F),F!==null&&e.update(F,n.ELEMENT_ARRAY_BUFFER),(W||o)&&(o=!1,x(w,P,I,B),F!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(F).buffer))}function l(){return n.createVertexArray()}function c(w){return n.bindVertexArray(w)}function h(w){return n.deleteVertexArray(w)}function d(w,P,I){let B=I.wireframe===!0,F=i[w.id];F===void 0&&(F={},i[w.id]=F);let W=F[P.id];W===void 0&&(W={},F[P.id]=W);let Y=W[B];return Y===void 0&&(Y=f(l()),W[B]=Y),Y}function f(w){let P=[],I=[],B=[];for(let F=0;F<t;F++)P[F]=0,I[F]=0,B[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:I,attributeDivisors:B,object:w,attributes:{},index:null}}function u(w,P,I,B){let F=r.attributes,W=P.attributes,Y=0,Q=I.getAttributes();for(let N in Q)if(Q[N].location>=0){let $=F[N],fe=W[N];if(fe===void 0&&(N==="instanceMatrix"&&w.instanceMatrix&&(fe=w.instanceMatrix),N==="instanceColor"&&w.instanceColor&&(fe=w.instanceColor)),$===void 0||$.attribute!==fe||fe&&$.data!==fe.data)return!0;Y++}return r.attributesNum!==Y||r.index!==B}function E(w,P,I,B){let F={},W=P.attributes,Y=0,Q=I.getAttributes();for(let N in Q)if(Q[N].location>=0){let $=W[N];$===void 0&&(N==="instanceMatrix"&&w.instanceMatrix&&($=w.instanceMatrix),N==="instanceColor"&&w.instanceColor&&($=w.instanceColor));let fe={};fe.attribute=$,$&&$.data&&(fe.data=$.data),F[N]=fe,Y++}r.attributes=F,r.attributesNum=Y,r.index=B}function M(){let w=r.newAttributes;for(let P=0,I=w.length;P<I;P++)w[P]=0}function g(w){p(w,0)}function p(w,P){let I=r.newAttributes,B=r.enabledAttributes,F=r.attributeDivisors;I[w]=1,B[w]===0&&(n.enableVertexAttribArray(w),B[w]=1),F[w]!==P&&(n.vertexAttribDivisor(w,P),F[w]=P)}function T(){let w=r.newAttributes,P=r.enabledAttributes;for(let I=0,B=P.length;I<B;I++)P[I]!==w[I]&&(n.disableVertexAttribArray(I),P[I]=0)}function y(w,P,I,B,F,W,Y){Y===!0?n.vertexAttribIPointer(w,P,I,F,W):n.vertexAttribPointer(w,P,I,B,F,W)}function x(w,P,I,B){M();let F=B.attributes,W=I.getAttributes(),Y=P.defaultAttributeValues;for(let Q in W){let N=W[Q];if(N.location>=0){let ee=F[Q];if(ee===void 0&&(Q==="instanceMatrix"&&w.instanceMatrix&&(ee=w.instanceMatrix),Q==="instanceColor"&&w.instanceColor&&(ee=w.instanceColor)),ee!==void 0){let $=ee.normalized,fe=ee.itemSize,be=e.get(ee);if(be===void 0)continue;let Re=be.buffer,K=be.type,ae=be.bytesPerElement,Ee=K===n.INT||K===n.UNSIGNED_INT||ee.gpuType===Bo;if(ee.isInterleavedBufferAttribute){let me=ee.data,le=me.stride,He=ee.offset;if(me.isInstancedInterleavedBuffer){for(let ne=0;ne<N.locationSize;ne++)p(N.location+ne,me.meshPerAttribute);w.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=me.meshPerAttribute*me.count)}else for(let ne=0;ne<N.locationSize;ne++)g(N.location+ne);n.bindBuffer(n.ARRAY_BUFFER,Re);for(let ne=0;ne<N.locationSize;ne++)y(N.location+ne,fe/N.locationSize,K,$,le*ae,(He+fe/N.locationSize*ne)*ae,Ee)}else{if(ee.isInstancedBufferAttribute){for(let me=0;me<N.locationSize;me++)p(N.location+me,ee.meshPerAttribute);w.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let me=0;me<N.locationSize;me++)g(N.location+me);n.bindBuffer(n.ARRAY_BUFFER,Re);for(let me=0;me<N.locationSize;me++)y(N.location+me,fe/N.locationSize,K,$,fe*ae,fe/N.locationSize*me*ae,Ee)}}else if(Y!==void 0){let $=Y[Q];if($!==void 0)switch($.length){case 2:n.vertexAttrib2fv(N.location,$);break;case 3:n.vertexAttrib3fv(N.location,$);break;case 4:n.vertexAttrib4fv(N.location,$);break;default:n.vertexAttrib1fv(N.location,$)}}}}T()}function S(){H();for(let w in i){let P=i[w];for(let I in P){let B=P[I];for(let F in B)h(B[F].object),delete B[F];delete P[I]}delete i[w]}}function b(w){if(i[w.id]===void 0)return;let P=i[w.id];for(let I in P){let B=P[I];for(let F in B)h(B[F].object),delete B[F];delete P[I]}delete i[w.id]}function C(w){for(let P in i){let I=i[P];if(I[w.id]===void 0)continue;let B=I[w.id];for(let F in B)h(B[F].object),delete B[F];delete I[w.id]}}function H(){_(),o=!0,r!==s&&(r=s,c(r.object))}function _(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:H,resetDefaultState:_,dispose:S,releaseStatesOfGeometry:b,releaseStatesOfProgram:C,initAttributes:M,enableAttribute:g,disableUnusedAttributes:T}}function Qp(n,e,t){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function o(c,h,d){d!==0&&(n.drawArraysInstanced(i,c,h,d),t.update(h,i,d))}function a(c,h,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,d);let u=0;for(let E=0;E<d;E++)u+=h[E];t.update(u,i,1)}function l(c,h,d,f){if(d===0)return;let u=e.get("WEBGL_multi_draw");if(u===null)for(let E=0;E<c.length;E++)o(c[E],h[E],f[E]);else{u.multiDrawArraysInstancedWEBGL(i,c,0,h,0,f,0,d);let E=0;for(let M=0;M<d;M++)E+=h[M]*f[M];t.update(E,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function jp(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==un&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let H=C===fi&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==Sn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==bn&&!H)}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,f=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),u=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),E=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),M=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),T=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),y=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),S=E>0,b=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:f,maxTextures:u,maxVertexTextures:E,maxTextureSize:M,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:T,maxVaryings:y,maxFragmentUniforms:x,vertexTextures:S,maxSamples:b}}function e0(n){let e=this,t=null,i=0,s=!1,r=!1,o=new ln,a=new it,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){let u=d.length!==0||f||i!==0||s;return s=f,i=d.length,u},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,f){t=h(d,f,0)},this.setState=function(d,f,u){let E=d.clippingPlanes,M=d.clipIntersection,g=d.clipShadows,p=n.get(d);if(!s||E===null||E.length===0||r&&!g)r?h(null):c();else{let T=r?0:i,y=T*4,x=p.clippingState||null;l.value=x,x=h(E,f,y,u);for(let S=0;S!==y;++S)x[S]=t[S];p.clippingState=x,this.numIntersection=M?this.numPlanes:0,this.numPlanes+=T}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,f,u,E){let M=d!==null?d.length:0,g=null;if(M!==0){if(g=l.value,E!==!0||g===null){let p=u+M*4,T=f.matrixWorldInverse;a.getNormalMatrix(T),(g===null||g.length<p)&&(g=new Float32Array(p));for(let y=0,x=u;y!==M;++y,x+=4)o.copy(d[y]).applyMatrix4(T,a),o.normal.toArray(g,x),g[x+3]=o.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=M,e.numIntersection=0,g}}function t0(n){let e=new WeakMap;function t(o,a){return a===Do?o.mapping=Ci:a===Lo&&(o.mapping=Hi),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===Do||a===Lo)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new to(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var ps=4,bh=[.125,.215,.35,.446,.526,.582],Gi=20,Ol=new sr,Rh=new Ie,zl=null,Vl=0,Wl=0,Xl=!1,Li=(1+Math.sqrt(5))/2,fs=1/Li,Ah=[new L(-Li,fs,0),new L(Li,fs,0),new L(-fs,0,Li),new L(fs,0,Li),new L(0,Li,-fs),new L(0,Li,fs),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],n0=new L,Ma=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=n0}=r;zl=this._renderer.getRenderTarget(),Vl=this._renderer.getActiveCubeFace(),Wl=this._renderer.getActiveMipmapLevel(),Xl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ph(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Hh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(zl,Vl,Wl),this._renderer.xr.enabled=Xl,e.scissorTest=!1,Ea(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ci||e.mapping===Hi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),zl=this._renderer.getRenderTarget(),Vl=this._renderer.getActiveCubeFace(),Wl=this._renderer.getActiveMipmapLevel(),Xl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Mn,minFilter:Mn,generateMipmaps:!1,type:fi,format:un,colorSpace:_i,depthBuffer:!1},s=Ch(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ch(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=i0(r)),this._blurMaterial=s0(r,e,t)}return s}_compileMaterial(e){let t=new m(this._lodPlanes[0],e);this._renderer.compile(t,Ol)}_sceneToCubeUV(e,t,i,s,r){let l=new Ht(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,f=d.autoClear,u=d.toneMapping;d.getClearColor(Rh),d.toneMapping=Vn,d.autoClear=!1;let E=new _e({name:"PMREM.Background",side:Ft,depthWrite:!1,depthTest:!1}),M=new m(new z,E),g=!1,p=e.background;p?p.isColor&&(E.color.copy(p),e.background=null,g=!0):(E.color.copy(Rh),g=!0);for(let T=0;T<6;T++){let y=T%3;y===0?(l.up.set(0,c[T],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[T],r.y,r.z)):y===1?(l.up.set(0,0,c[T]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[T],r.z)):(l.up.set(0,c[T],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[T]));let x=this._cubeSize;Ea(s,y*x,T>2?x:0,x,x),d.setRenderTarget(s),g&&d.render(M,l),d.render(e,l)}M.geometry.dispose(),M.material.dispose(),d.toneMapping=u,d.autoClear=f,e.background=p}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Ci||e.mapping===Hi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ph()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Hh());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new m(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Ea(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Ol)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Ah[(s-r-1)%Ah.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,d=new m(this._lodPlanes[s],c),f=c.uniforms,u=this._sizeLods[i]-1,E=isFinite(r)?Math.PI/(2*u):2*Math.PI/(2*Gi-1),M=r/E,g=isFinite(r)?1+Math.floor(h*M):Gi;g>Gi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Gi}`);let p=[],T=0;for(let C=0;C<Gi;++C){let H=C/M,_=Math.exp(-H*H/2);p.push(_),C===0?T+=_:C<g&&(T+=2*_)}for(let C=0;C<p.length;C++)p[C]=p[C]/T;f.envMap.value=e.texture,f.samples.value=g,f.weights.value=p,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);let{_lodMax:y}=this;f.dTheta.value=E,f.mipInt.value=y-i;let x=this._sizeLods[s],S=3*x*(s>y-ps?s-y+ps:0),b=4*(this._cubeSize-x);Ea(t,S,b,3*x,2*x),l.setRenderTarget(t),l.render(d,Ol)}};function i0(n){let e=[],t=[],i=[],s=n,r=n-ps+1+bh.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>n-ps?l=bh[o-n+ps-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,d=1+c,f=[h,h,d,h,d,d,h,h,d,d,h,d],u=6,E=6,M=3,g=2,p=1,T=new Float32Array(M*E*u),y=new Float32Array(g*E*u),x=new Float32Array(p*E*u);for(let b=0;b<u;b++){let C=b%3*2/3-1,H=b>2?0:-1,_=[C,H,0,C+2/3,H,0,C+2/3,H+1,0,C,H,0,C+2/3,H+1,0,C,H+1,0];T.set(_,M*E*b),y.set(f,g*E*b);let w=[b,b,b,b,b,b];x.set(w,p*E*b)}let S=new vt;S.setAttribute("position",new Bt(T,M)),S.setAttribute("uv",new Bt(y,g)),S.setAttribute("faceIndex",new Bt(x,p)),e.push(S),s>ps&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Ch(n,e,t){let i=new hn(n,e,t);return i.texture.mapping=rr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ea(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function s0(n,e,t){let i=new Float32Array(Gi),s=new L(0,1,0);return new Ut({name:"SphericalGaussianBlur",defines:{n:Gi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:tc(),fragmentShader:`

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
		`,blending:zn,depthTest:!1,depthWrite:!1})}function Hh(){return new Ut({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:tc(),fragmentShader:`

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
		`,blending:zn,depthTest:!1,depthWrite:!1})}function Ph(){return new Ut({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:zn,depthTest:!1,depthWrite:!1})}function tc(){return`

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
	`}function r0(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===Do||l===Lo,h=l===Ci||l===Hi;if(c||h){let d=e.get(a),f=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==f)return t===null&&(t=new Ma(n)),d=c?t.fromEquirectangular(a,d):t.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),d.texture;if(d!==void 0)return d.texture;{let u=a.image;return c&&u&&u.height>0||h&&u&&s(u)?(t===null&&(t=new Ma(n)),d=c?t.fromEquirectangular(a):t.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),a.addEventListener("dispose",r),d.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function o0(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&fr("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function a0(n,e,t,i){let s={},r=new WeakMap;function o(d){let f=d.target;f.index!==null&&e.remove(f.index);for(let E in f.attributes)e.remove(f.attributes[E]);f.removeEventListener("dispose",o),delete s[f.id];let u=r.get(f);u&&(e.remove(u),r.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(d,f){return s[f.id]===!0||(f.addEventListener("dispose",o),s[f.id]=!0,t.memory.geometries++),f}function l(d){let f=d.attributes;for(let u in f)e.update(f[u],n.ARRAY_BUFFER)}function c(d){let f=[],u=d.index,E=d.attributes.position,M=0;if(u!==null){let T=u.array;M=u.version;for(let y=0,x=T.length;y<x;y+=3){let S=T[y+0],b=T[y+1],C=T[y+2];f.push(S,b,b,C,C,S)}}else if(E!==void 0){let T=E.array;M=E.version;for(let y=0,x=T.length/3-1;y<x;y+=3){let S=y+0,b=y+1,C=y+2;f.push(S,b,b,C,C,S)}}else return;let g=new(Gl(f)?Os:ks)(f,1);g.version=M;let p=r.get(d);p&&e.remove(p),r.set(d,g)}function h(d){let f=r.get(d);if(f){let u=d.index;u!==null&&f.version<u.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function l0(n,e,t){let i;function s(f){i=f}let r,o;function a(f){r=f.type,o=f.bytesPerElement}function l(f,u){n.drawElements(i,u,r,f*o),t.update(u,i,1)}function c(f,u,E){E!==0&&(n.drawElementsInstanced(i,u,r,f*o,E),t.update(u,i,E))}function h(f,u,E){if(E===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,r,f,0,E);let g=0;for(let p=0;p<E;p++)g+=u[p];t.update(g,i,1)}function d(f,u,E,M){if(E===0)return;let g=e.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<f.length;p++)c(f[p]/o,u[p],M[p]);else{g.multiDrawElementsInstancedWEBGL(i,u,0,r,f,0,M,0,E);let p=0;for(let T=0;T<E;T++)p+=u[T]*M[T];t.update(p,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function c0(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function h0(n,e,t){let i=new WeakMap,s=new ft;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,f=i.get(a);if(f===void 0||f.count!==d){let _=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",_)};f!==void 0&&f.texture.dispose();let u=a.morphAttributes.position!==void 0,E=a.morphAttributes.normal!==void 0,M=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],T=a.morphAttributes.color||[],y=0;u===!0&&(y=1),E===!0&&(y=2),M===!0&&(y=3);let x=a.attributes.position.count*y,S=1;x>e.maxTextureSize&&(S=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let b=new Float32Array(x*S*4*d),C=new Fs(b,x,S,d);C.type=bn,C.needsUpdate=!0;let H=y*4;for(let w=0;w<d;w++){let P=g[w],I=p[w],B=T[w],F=x*S*4*w;for(let W=0;W<P.count;W++){let Y=W*H;u===!0&&(s.fromBufferAttribute(P,W),b[F+Y+0]=s.x,b[F+Y+1]=s.y,b[F+Y+2]=s.z,b[F+Y+3]=0),E===!0&&(s.fromBufferAttribute(I,W),b[F+Y+4]=s.x,b[F+Y+5]=s.y,b[F+Y+6]=s.z,b[F+Y+7]=0),M===!0&&(s.fromBufferAttribute(B,W),b[F+Y+8]=s.x,b[F+Y+9]=s.y,b[F+Y+10]=s.z,b[F+Y+11]=B.itemSize===4?s.w:1)}}f={count:d,texture:C,size:new Se(x,S)},i.set(a,f),a.addEventListener("dispose",_)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let u=0;for(let M=0;M<c.length;M++)u+=c[M];let E=a.morphTargetsRelative?1:1-u;l.getUniforms().setValue(n,"morphTargetBaseInfluence",E),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",f.size)}return{update:r}}function d0(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,d=e.get(l,h);if(s.get(d)!==c&&(e.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return d}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var Kh=new Wt,Ih=new qs(1,1),$h=new Fs,Qh=new jr,jh=new Vs,Dh=[],Lh=[],Gh=new Float32Array(16),Bh=new Float32Array(9),Uh=new Float32Array(4);function Es(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Dh[s];if(r===void 0&&(r=new Float32Array(s),Dh[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Pt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function xa(n,e){let t=Lh[e];t===void 0&&(t=new Int32Array(e),Lh[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function u0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function f0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Pt(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function p0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Pt(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function m0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Pt(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function E0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Pt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Pt(t,i))return;Uh.set(i),n.uniformMatrix2fv(this.addr,!1,Uh),It(t,i)}}function g0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Pt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Pt(t,i))return;Bh.set(i),n.uniformMatrix3fv(this.addr,!1,Bh),It(t,i)}}function M0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Pt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Pt(t,i))return;Gh.set(i),n.uniformMatrix4fv(this.addr,!1,Gh),It(t,i)}}function y0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function x0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Pt(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function w0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Pt(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function T0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Pt(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function _0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function v0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Pt(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function S0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Pt(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function b0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Pt(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function R0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Ih.compareFunction=Dl,r=Ih):r=Kh,t.setTexture2D(e||r,s)}function A0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||Qh,s)}function C0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||jh,s)}function H0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||$h,s)}function P0(n){switch(n){case 5126:return u0;case 35664:return f0;case 35665:return p0;case 35666:return m0;case 35674:return E0;case 35675:return g0;case 35676:return M0;case 5124:case 35670:return y0;case 35667:case 35671:return x0;case 35668:case 35672:return w0;case 35669:case 35673:return T0;case 5125:return _0;case 36294:return v0;case 36295:return S0;case 36296:return b0;case 35678:case 36198:case 36298:case 36306:case 35682:return R0;case 35679:case 36299:case 36307:return A0;case 35680:case 36300:case 36308:case 36293:return C0;case 36289:case 36303:case 36311:case 36292:return H0}}function I0(n,e){n.uniform1fv(this.addr,e)}function D0(n,e){let t=Es(e,this.size,2);n.uniform2fv(this.addr,t)}function L0(n,e){let t=Es(e,this.size,3);n.uniform3fv(this.addr,t)}function G0(n,e){let t=Es(e,this.size,4);n.uniform4fv(this.addr,t)}function B0(n,e){let t=Es(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function U0(n,e){let t=Es(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function F0(n,e){let t=Es(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function N0(n,e){n.uniform1iv(this.addr,e)}function k0(n,e){n.uniform2iv(this.addr,e)}function O0(n,e){n.uniform3iv(this.addr,e)}function z0(n,e){n.uniform4iv(this.addr,e)}function V0(n,e){n.uniform1uiv(this.addr,e)}function W0(n,e){n.uniform2uiv(this.addr,e)}function X0(n,e){n.uniform3uiv(this.addr,e)}function Y0(n,e){n.uniform4uiv(this.addr,e)}function q0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Pt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||Kh,r[o])}function Z0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Pt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Qh,r[o])}function J0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Pt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||jh,r[o])}function K0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Pt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||$h,r[o])}function $0(n){switch(n){case 5126:return I0;case 35664:return D0;case 35665:return L0;case 35666:return G0;case 35674:return B0;case 35675:return U0;case 35676:return F0;case 5124:case 35670:return N0;case 35667:case 35671:return k0;case 35668:case 35672:return O0;case 35669:case 35673:return z0;case 5125:return V0;case 36294:return W0;case 36295:return X0;case 36296:return Y0;case 35678:case 36198:case 36298:case 36306:case 35682:return q0;case 35679:case 36299:case 36307:return Z0;case 35680:case 36300:case 36308:case 36293:return J0;case 36289:case 36303:case 36311:case 36292:return K0}}var ql=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=P0(t.type)}},Zl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=$0(t.type)}},Jl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Yl=/(\w+)(\])?(\[|\.)?/g;function Fh(n,e){n.seq.push(e),n.map[e.id]=e}function Q0(n,e,t){let i=n.name,s=i.length;for(Yl.lastIndex=0;;){let r=Yl.exec(i),o=Yl.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Fh(t,c===void 0?new ql(a,n,e):new Zl(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new Jl(a),Fh(t,d)),t=d}}}var ms=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Q0(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function Nh(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var j0=37297,em=0;function tm(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var kh=new it;function nm(n){dt._getMatrix(kh,dt.workingColorSpace,n);let e=`mat3( ${kh.elements.map(t=>t.toFixed(4))} )`;switch(dt.getTransfer(n)){case Gs:return[e,"LinearTransferOETF"];case gt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Oh(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+tm(n.getShaderSource(e),o)}else return s}function im(n,e){let t=nm(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function sm(n,e){let t;switch(e){case ih:t="Linear";break;case sh:t="Reinhard";break;case rh:t="Cineon";break;case Io:t="ACESFilmic";break;case ah:t="AgX";break;case lh:t="Neutral";break;case oh:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var ga=new L;function rm(){dt.getLuminanceCoefficients(ga);let n=ga.x.toFixed(4),e=ga.y.toFixed(4),t=ga.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function om(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(pr).join(`
`)}function am(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function lm(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function pr(n){return n!==""}function zh(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Vh(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var cm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Kl(n){return n.replace(cm,dm)}var hm=new Map;function dm(n,e){let t=st[e];if(t===void 0){let i=hm.get(e);if(i!==void 0)t=st[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Kl(t)}var um=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Wh(n){return n.replace(um,fm)}function fm(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Xh(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}function pm(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===gl?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===vo?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===_n&&(e="SHADOWMAP_TYPE_VSM"),e}function mm(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Ci:case Hi:e="ENVMAP_TYPE_CUBE";break;case rr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Em(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Hi:e="ENVMAP_MODE_REFRACTION";break}return e}function gm(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case xl:e="ENVMAP_BLENDING_MULTIPLY";break;case th:e="ENVMAP_BLENDING_MIX";break;case nh:e="ENVMAP_BLENDING_ADD";break}return e}function Mm(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function ym(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=pm(t),c=mm(t),h=Em(t),d=gm(t),f=Mm(t),u=om(t),E=am(r),M=s.createProgram(),g,p,T=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,E].filter(pr).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,E].filter(pr).join(`
`),p.length>0&&(p+=`
`)):(g=[Xh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,E,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pr).join(`
`),p=[Xh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,E,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Vn?"#define TONE_MAPPING":"",t.toneMapping!==Vn?st.tonemapping_pars_fragment:"",t.toneMapping!==Vn?sm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",st.colorspace_pars_fragment,im("linearToOutputTexel",t.outputColorSpace),rm(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(pr).join(`
`)),o=Kl(o),o=zh(o,t),o=Vh(o,t),a=Kl(a),a=zh(a,t),a=Vh(a,t),o=Wh(o),a=Wh(a),t.isRawShaderMaterial!==!0&&(T=`#version 300 es
`,g=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",t.glslVersion===Ll?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ll?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let y=T+g+o,x=T+p+a,S=Nh(s,s.VERTEX_SHADER,y),b=Nh(s,s.FRAGMENT_SHADER,x);s.attachShader(M,S),s.attachShader(M,b),t.index0AttributeName!==void 0?s.bindAttribLocation(M,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(M,0,"position"),s.linkProgram(M);function C(P){if(n.debug.checkShaderErrors){let I=s.getProgramInfoLog(M).trim(),B=s.getShaderInfoLog(S).trim(),F=s.getShaderInfoLog(b).trim(),W=!0,Y=!0;if(s.getProgramParameter(M,s.LINK_STATUS)===!1)if(W=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,M,S,b);else{let Q=Oh(s,S,"vertex"),N=Oh(s,b,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(M,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+I+`
`+Q+`
`+N)}else I!==""?console.warn("THREE.WebGLProgram: Program Info Log:",I):(B===""||F==="")&&(Y=!1);Y&&(P.diagnostics={runnable:W,programLog:I,vertexShader:{log:B,prefix:g},fragmentShader:{log:F,prefix:p}})}s.deleteShader(S),s.deleteShader(b),H=new ms(s,M),_=lm(s,M)}let H;this.getUniforms=function(){return H===void 0&&C(this),H};let _;this.getAttributes=function(){return _===void 0&&C(this),_};let w=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return w===!1&&(w=s.getProgramParameter(M,j0)),w},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(M),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=em++,this.cacheKey=e,this.usedTimes=1,this.program=M,this.vertexShader=S,this.fragmentShader=b,this}var xm=0,$l=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ql(e),t.set(e,i)),i}},Ql=class{constructor(e){this.id=xm++,this.code=e,this.usedTimes=0}};function wm(n,e,t,i,s,r,o){let a=new Ns,l=new $l,c=new Set,h=[],d=s.logarithmicDepthBuffer,f=s.vertexTextures,u=s.precision,E={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function M(_){return c.add(_),_===0?"uv":`uv${_}`}function g(_,w,P,I,B){let F=I.fog,W=B.geometry,Y=_.isMeshStandardMaterial?I.environment:null,Q=(_.isMeshStandardMaterial?t:e).get(_.envMap||Y),N=Q&&Q.mapping===rr?Q.image.height:null,ee=E[_.type];_.precision!==null&&(u=s.getMaxPrecision(_.precision),u!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));let $=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,fe=$!==void 0?$.length:0,be=0;W.morphAttributes.position!==void 0&&(be=1),W.morphAttributes.normal!==void 0&&(be=2),W.morphAttributes.color!==void 0&&(be=3);let Re,K,ae,Ee;if(ee){let et=Rn[ee];Re=et.vertexShader,K=et.fragmentShader}else Re=_.vertexShader,K=_.fragmentShader,l.update(_),ae=l.getVertexShaderID(_),Ee=l.getFragmentShaderID(_);let me=n.getRenderTarget(),le=n.state.buffers.depth.getReversed(),He=B.isInstancedMesh===!0,ne=B.isBatchedMesh===!0,ge=!!_.map,pe=!!_.matcap,xe=!!Q,G=!!_.aoMap,he=!!_.lightMap,k=!!_.bumpMap,Be=!!_.normalMap,we=!!_.displacementMap,Ye=!!_.emissiveMap,Ue=!!_.metalnessMap,D=!!_.roughnessMap,v=_.anisotropy>0,V=_.clearcoat>0,se=_.dispersion>0,ce=_.iridescence>0,oe=_.sheen>0,ze=_.transmission>0,Pe=v&&!!_.anisotropyMap,Ae=V&&!!_.clearcoatMap,Qe=V&&!!_.clearcoatNormalMap,Te=V&&!!_.clearcoatRoughnessMap,ke=ce&&!!_.iridescenceMap,qe=ce&&!!_.iridescenceThicknessMap,Ke=oe&&!!_.sheenColorMap,Fe=oe&&!!_.sheenRoughnessMap,Ce=!!_.specularMap,ve=!!_.specularColorMap,We=!!_.specularIntensityMap,U=ze&&!!_.transmissionMap,Me=ze&&!!_.thicknessMap,q=!!_.gradientMap,Z=!!_.alphaMap,ue=_.alphaTest>0,ye=!!_.alphaHash,Ge=!!_.extensions,nt=Vn;_.toneMapped&&(me===null||me.isXRRenderTarget===!0)&&(nt=n.toneMapping);let at={shaderID:ee,shaderType:_.type,shaderName:_.name,vertexShader:Re,fragmentShader:K,defines:_.defines,customVertexShaderID:ae,customFragmentShaderID:Ee,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:ne,batchingColor:ne&&B._colorsTexture!==null,instancing:He,instancingColor:He&&B.instanceColor!==null,instancingMorph:He&&B.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:me===null?n.outputColorSpace:me.isXRRenderTarget===!0?me.texture.colorSpace:_i,alphaToCoverage:!!_.alphaToCoverage,map:ge,matcap:pe,envMap:xe,envMapMode:xe&&Q.mapping,envMapCubeUVHeight:N,aoMap:G,lightMap:he,bumpMap:k,normalMap:Be,displacementMap:f&&we,emissiveMap:Ye,normalMapObjectSpace:Be&&_.normalMapType===uh,normalMapTangentSpace:Be&&_.normalMapType===Il,metalnessMap:Ue,roughnessMap:D,anisotropy:v,anisotropyMap:Pe,clearcoat:V,clearcoatMap:Ae,clearcoatNormalMap:Qe,clearcoatRoughnessMap:Te,dispersion:se,iridescence:ce,iridescenceMap:ke,iridescenceThicknessMap:qe,sheen:oe,sheenColorMap:Ke,sheenRoughnessMap:Fe,specularMap:Ce,specularColorMap:ve,specularIntensityMap:We,transmission:ze,transmissionMap:U,thicknessMap:Me,gradientMap:q,opaque:_.transparent===!1&&_.blending===wi&&_.alphaToCoverage===!1,alphaMap:Z,alphaTest:ue,alphaHash:ye,combine:_.combine,mapUv:ge&&M(_.map.channel),aoMapUv:G&&M(_.aoMap.channel),lightMapUv:he&&M(_.lightMap.channel),bumpMapUv:k&&M(_.bumpMap.channel),normalMapUv:Be&&M(_.normalMap.channel),displacementMapUv:we&&M(_.displacementMap.channel),emissiveMapUv:Ye&&M(_.emissiveMap.channel),metalnessMapUv:Ue&&M(_.metalnessMap.channel),roughnessMapUv:D&&M(_.roughnessMap.channel),anisotropyMapUv:Pe&&M(_.anisotropyMap.channel),clearcoatMapUv:Ae&&M(_.clearcoatMap.channel),clearcoatNormalMapUv:Qe&&M(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Te&&M(_.clearcoatRoughnessMap.channel),iridescenceMapUv:ke&&M(_.iridescenceMap.channel),iridescenceThicknessMapUv:qe&&M(_.iridescenceThicknessMap.channel),sheenColorMapUv:Ke&&M(_.sheenColorMap.channel),sheenRoughnessMapUv:Fe&&M(_.sheenRoughnessMap.channel),specularMapUv:Ce&&M(_.specularMap.channel),specularColorMapUv:ve&&M(_.specularColorMap.channel),specularIntensityMapUv:We&&M(_.specularIntensityMap.channel),transmissionMapUv:U&&M(_.transmissionMap.channel),thicknessMapUv:Me&&M(_.thicknessMap.channel),alphaMapUv:Z&&M(_.alphaMap.channel),vertexTangents:!!W.attributes.tangent&&(Be||v),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!W.attributes.uv&&(ge||Z),fog:!!F,useFog:_.fog===!0,fogExp2:!!F&&F.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:le,skinning:B.isSkinnedMesh===!0,morphTargets:W.morphAttributes.position!==void 0,morphNormals:W.morphAttributes.normal!==void 0,morphColors:W.morphAttributes.color!==void 0,morphTargetsCount:fe,morphTextureStride:be,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:nt,decodeVideoTexture:ge&&_.map.isVideoTexture===!0&&dt.getTransfer(_.map.colorSpace)===gt,decodeVideoTextureEmissive:Ye&&_.emissiveMap.isVideoTexture===!0&&dt.getTransfer(_.emissiveMap.colorSpace)===gt,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===ct,flipSided:_.side===Ft,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:Ge&&_.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ge&&_.extensions.multiDraw===!0||ne)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return at.vertexUv1s=c.has(1),at.vertexUv2s=c.has(2),at.vertexUv3s=c.has(3),c.clear(),at}function p(_){let w=[];if(_.shaderID?w.push(_.shaderID):(w.push(_.customVertexShaderID),w.push(_.customFragmentShaderID)),_.defines!==void 0)for(let P in _.defines)w.push(P),w.push(_.defines[P]);return _.isRawShaderMaterial===!1&&(T(w,_),y(w,_),w.push(n.outputColorSpace)),w.push(_.customProgramCacheKey),w.join()}function T(_,w){_.push(w.precision),_.push(w.outputColorSpace),_.push(w.envMapMode),_.push(w.envMapCubeUVHeight),_.push(w.mapUv),_.push(w.alphaMapUv),_.push(w.lightMapUv),_.push(w.aoMapUv),_.push(w.bumpMapUv),_.push(w.normalMapUv),_.push(w.displacementMapUv),_.push(w.emissiveMapUv),_.push(w.metalnessMapUv),_.push(w.roughnessMapUv),_.push(w.anisotropyMapUv),_.push(w.clearcoatMapUv),_.push(w.clearcoatNormalMapUv),_.push(w.clearcoatRoughnessMapUv),_.push(w.iridescenceMapUv),_.push(w.iridescenceThicknessMapUv),_.push(w.sheenColorMapUv),_.push(w.sheenRoughnessMapUv),_.push(w.specularMapUv),_.push(w.specularColorMapUv),_.push(w.specularIntensityMapUv),_.push(w.transmissionMapUv),_.push(w.thicknessMapUv),_.push(w.combine),_.push(w.fogExp2),_.push(w.sizeAttenuation),_.push(w.morphTargetsCount),_.push(w.morphAttributeCount),_.push(w.numDirLights),_.push(w.numPointLights),_.push(w.numSpotLights),_.push(w.numSpotLightMaps),_.push(w.numHemiLights),_.push(w.numRectAreaLights),_.push(w.numDirLightShadows),_.push(w.numPointLightShadows),_.push(w.numSpotLightShadows),_.push(w.numSpotLightShadowsWithMaps),_.push(w.numLightProbes),_.push(w.shadowMapType),_.push(w.toneMapping),_.push(w.numClippingPlanes),_.push(w.numClipIntersection),_.push(w.depthPacking)}function y(_,w){a.disableAll(),w.supportsVertexTextures&&a.enable(0),w.instancing&&a.enable(1),w.instancingColor&&a.enable(2),w.instancingMorph&&a.enable(3),w.matcap&&a.enable(4),w.envMap&&a.enable(5),w.normalMapObjectSpace&&a.enable(6),w.normalMapTangentSpace&&a.enable(7),w.clearcoat&&a.enable(8),w.iridescence&&a.enable(9),w.alphaTest&&a.enable(10),w.vertexColors&&a.enable(11),w.vertexAlphas&&a.enable(12),w.vertexUv1s&&a.enable(13),w.vertexUv2s&&a.enable(14),w.vertexUv3s&&a.enable(15),w.vertexTangents&&a.enable(16),w.anisotropy&&a.enable(17),w.alphaHash&&a.enable(18),w.batching&&a.enable(19),w.dispersion&&a.enable(20),w.batchingColor&&a.enable(21),_.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reverseDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),_.push(a.mask)}function x(_){let w=E[_.type],P;if(w){let I=Rn[w];P=pa.clone(I.uniforms)}else P=_.uniforms;return P}function S(_,w){let P;for(let I=0,B=h.length;I<B;I++){let F=h[I];if(F.cacheKey===w){P=F,++P.usedTimes;break}}return P===void 0&&(P=new ym(n,w,_,r),h.push(P)),P}function b(_){if(--_.usedTimes===0){let w=h.indexOf(_);h[w]=h[h.length-1],h.pop(),_.destroy()}}function C(_){l.remove(_)}function H(){l.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:x,acquireProgram:S,releaseProgram:b,releaseShaderCache:C,programs:h,dispose:H}}function Tm(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function _m(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Yh(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function qh(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(d,f,u,E,M,g){let p=n[e];return p===void 0?(p={id:d.id,object:d,geometry:f,material:u,groupOrder:E,renderOrder:d.renderOrder,z:M,group:g},n[e]=p):(p.id=d.id,p.object=d,p.geometry=f,p.material=u,p.groupOrder=E,p.renderOrder=d.renderOrder,p.z=M,p.group=g),e++,p}function a(d,f,u,E,M,g){let p=o(d,f,u,E,M,g);u.transmission>0?i.push(p):u.transparent===!0?s.push(p):t.push(p)}function l(d,f,u,E,M,g){let p=o(d,f,u,E,M,g);u.transmission>0?i.unshift(p):u.transparent===!0?s.unshift(p):t.unshift(p)}function c(d,f){t.length>1&&t.sort(d||_m),i.length>1&&i.sort(f||Yh),s.length>1&&s.sort(f||Yh)}function h(){for(let d=e,f=n.length;d<f;d++){let u=n[d];if(u.id===null)break;u.id=null,u.object=null,u.geometry=null,u.material=null,u.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function vm(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new qh,n.set(i,[o])):s>=r.length?(o=new qh,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Sm(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Ie};break;case"SpotLight":t={position:new L,direction:new L,color:new Ie,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Ie,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Ie,groundColor:new Ie};break;case"RectAreaLight":t={color:new Ie,position:new L,halfWidth:new L,halfHeight:new L};break}return n[e.id]=t,t}}}function bm(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Se};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Se};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Se,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Rm=0;function Am(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Cm(n){let e=new Sm,t=bm(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new L);let s=new L,r=new pt,o=new pt;function a(c){let h=0,d=0,f=0;for(let _=0;_<9;_++)i.probe[_].set(0,0,0);let u=0,E=0,M=0,g=0,p=0,T=0,y=0,x=0,S=0,b=0,C=0;c.sort(Am);for(let _=0,w=c.length;_<w;_++){let P=c[_],I=P.color,B=P.intensity,F=P.distance,W=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)h+=I.r*B,d+=I.g*B,f+=I.b*B;else if(P.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(P.sh.coefficients[Y],B);C++}else if(P.isDirectionalLight){let Y=e.get(P);if(Y.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let Q=P.shadow,N=t.get(P);N.shadowIntensity=Q.intensity,N.shadowBias=Q.bias,N.shadowNormalBias=Q.normalBias,N.shadowRadius=Q.radius,N.shadowMapSize=Q.mapSize,i.directionalShadow[u]=N,i.directionalShadowMap[u]=W,i.directionalShadowMatrix[u]=P.shadow.matrix,T++}i.directional[u]=Y,u++}else if(P.isSpotLight){let Y=e.get(P);Y.position.setFromMatrixPosition(P.matrixWorld),Y.color.copy(I).multiplyScalar(B),Y.distance=F,Y.coneCos=Math.cos(P.angle),Y.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),Y.decay=P.decay,i.spot[M]=Y;let Q=P.shadow;if(P.map&&(i.spotLightMap[S]=P.map,S++,Q.updateMatrices(P),P.castShadow&&b++),i.spotLightMatrix[M]=Q.matrix,P.castShadow){let N=t.get(P);N.shadowIntensity=Q.intensity,N.shadowBias=Q.bias,N.shadowNormalBias=Q.normalBias,N.shadowRadius=Q.radius,N.shadowMapSize=Q.mapSize,i.spotShadow[M]=N,i.spotShadowMap[M]=W,x++}M++}else if(P.isRectAreaLight){let Y=e.get(P);Y.color.copy(I).multiplyScalar(B),Y.halfWidth.set(P.width*.5,0,0),Y.halfHeight.set(0,P.height*.5,0),i.rectArea[g]=Y,g++}else if(P.isPointLight){let Y=e.get(P);if(Y.color.copy(P.color).multiplyScalar(P.intensity),Y.distance=P.distance,Y.decay=P.decay,P.castShadow){let Q=P.shadow,N=t.get(P);N.shadowIntensity=Q.intensity,N.shadowBias=Q.bias,N.shadowNormalBias=Q.normalBias,N.shadowRadius=Q.radius,N.shadowMapSize=Q.mapSize,N.shadowCameraNear=Q.camera.near,N.shadowCameraFar=Q.camera.far,i.pointShadow[E]=N,i.pointShadowMap[E]=W,i.pointShadowMatrix[E]=P.shadow.matrix,y++}i.point[E]=Y,E++}else if(P.isHemisphereLight){let Y=e.get(P);Y.skyColor.copy(P.color).multiplyScalar(B),Y.groundColor.copy(P.groundColor).multiplyScalar(B),i.hemi[p]=Y,p++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Le.LTC_FLOAT_1,i.rectAreaLTC2=Le.LTC_FLOAT_2):(i.rectAreaLTC1=Le.LTC_HALF_1,i.rectAreaLTC2=Le.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=f;let H=i.hash;(H.directionalLength!==u||H.pointLength!==E||H.spotLength!==M||H.rectAreaLength!==g||H.hemiLength!==p||H.numDirectionalShadows!==T||H.numPointShadows!==y||H.numSpotShadows!==x||H.numSpotMaps!==S||H.numLightProbes!==C)&&(i.directional.length=u,i.spot.length=M,i.rectArea.length=g,i.point.length=E,i.hemi.length=p,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.pointShadow.length=y,i.pointShadowMap.length=y,i.spotShadow.length=x,i.spotShadowMap.length=x,i.directionalShadowMatrix.length=T,i.pointShadowMatrix.length=y,i.spotLightMatrix.length=x+S-b,i.spotLightMap.length=S,i.numSpotLightShadowsWithMaps=b,i.numLightProbes=C,H.directionalLength=u,H.pointLength=E,H.spotLength=M,H.rectAreaLength=g,H.hemiLength=p,H.numDirectionalShadows=T,H.numPointShadows=y,H.numSpotShadows=x,H.numSpotMaps=S,H.numLightProbes=C,i.version=Rm++)}function l(c,h){let d=0,f=0,u=0,E=0,M=0,g=h.matrixWorldInverse;for(let p=0,T=c.length;p<T;p++){let y=c[p];if(y.isDirectionalLight){let x=i.directional[d];x.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),d++}else if(y.isSpotLight){let x=i.spot[u];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(g),x.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(g),u++}else if(y.isRectAreaLight){let x=i.rectArea[E];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(g),o.identity(),r.copy(y.matrixWorld),r.premultiply(g),o.extractRotation(r),x.halfWidth.set(y.width*.5,0,0),x.halfHeight.set(0,y.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),E++}else if(y.isPointLight){let x=i.point[f];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(g),f++}else if(y.isHemisphereLight){let x=i.hemi[M];x.direction.setFromMatrixPosition(y.matrixWorld),x.direction.transformDirection(g),M++}}}return{setup:a,setupView:l,state:i}}function Zh(n){let e=new Cm(n),t=[],i=[];function s(h){c.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function o(h){i.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function Hm(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Zh(n),e.set(s,[a])):r>=o.length?(a=new Zh(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var Pm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Im=`uniform sampler2D shadow_pass;
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
}`;function Dm(n,e,t){let i=new is,s=new Se,r=new Se,o=new ft,a=new uo({depthPacking:dh}),l=new fo,c={},h=t.maxTextureSize,d={[Fn]:Ft,[Ft]:Fn,[ct]:ct},f=new Ut({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Se},radius:{value:4}},vertexShader:Pm,fragmentShader:Im}),u=f.clone();u.defines.HORIZONTAL_PASS=1;let E=new vt;E.setAttribute("position",new Bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let M=new m(E,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=gl;let p=this.type;this.render=function(b,C,H){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||b.length===0)return;let _=n.getRenderTarget(),w=n.getActiveCubeFace(),P=n.getActiveMipmapLevel(),I=n.state;I.setBlending(zn),I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);let B=p!==_n&&this.type===_n,F=p===_n&&this.type!==_n;for(let W=0,Y=b.length;W<Y;W++){let Q=b[W],N=Q.shadow;if(N===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(N.autoUpdate===!1&&N.needsUpdate===!1)continue;s.copy(N.mapSize);let ee=N.getFrameExtents();if(s.multiply(ee),r.copy(N.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ee.x),s.x=r.x*ee.x,N.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ee.y),s.y=r.y*ee.y,N.mapSize.y=r.y)),N.map===null||B===!0||F===!0){let fe=this.type!==_n?{minFilter:cn,magFilter:cn}:{};N.map!==null&&N.map.dispose(),N.map=new hn(s.x,s.y,fe),N.map.texture.name=Q.name+".shadowMap",N.camera.updateProjectionMatrix()}n.setRenderTarget(N.map),n.clear();let $=N.getViewportCount();for(let fe=0;fe<$;fe++){let be=N.getViewport(fe);o.set(r.x*be.x,r.y*be.y,r.x*be.z,r.y*be.w),I.viewport(o),N.updateMatrices(Q,fe),i=N.getFrustum(),x(C,H,N.camera,Q,this.type)}N.isPointLightShadow!==!0&&this.type===_n&&T(N,H),N.needsUpdate=!1}p=this.type,g.needsUpdate=!1,n.setRenderTarget(_,w,P)};function T(b,C){let H=e.update(M);f.defines.VSM_SAMPLES!==b.blurSamples&&(f.defines.VSM_SAMPLES=b.blurSamples,u.defines.VSM_SAMPLES=b.blurSamples,f.needsUpdate=!0,u.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new hn(s.x,s.y)),f.uniforms.shadow_pass.value=b.map.texture,f.uniforms.resolution.value=b.mapSize,f.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(C,null,H,f,M,null),u.uniforms.shadow_pass.value=b.mapPass.texture,u.uniforms.resolution.value=b.mapSize,u.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(C,null,H,u,M,null)}function y(b,C,H,_){let w=null,P=H.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(P!==void 0)w=P;else if(w=H.isPointLight===!0?l:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){let I=w.uuid,B=C.uuid,F=c[I];F===void 0&&(F={},c[I]=F);let W=F[B];W===void 0&&(W=w.clone(),F[B]=W,C.addEventListener("dispose",S)),w=W}if(w.visible=C.visible,w.wireframe=C.wireframe,_===_n?w.side=C.shadowSide!==null?C.shadowSide:C.side:w.side=C.shadowSide!==null?C.shadowSide:d[C.side],w.alphaMap=C.alphaMap,w.alphaTest=C.alphaTest,w.map=C.map,w.clipShadows=C.clipShadows,w.clippingPlanes=C.clippingPlanes,w.clipIntersection=C.clipIntersection,w.displacementMap=C.displacementMap,w.displacementScale=C.displacementScale,w.displacementBias=C.displacementBias,w.wireframeLinewidth=C.wireframeLinewidth,w.linewidth=C.linewidth,H.isPointLight===!0&&w.isMeshDistanceMaterial===!0){let I=n.properties.get(w);I.light=H}return w}function x(b,C,H,_,w){if(b.visible===!1)return;if(b.layers.test(C.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&w===_n)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,b.matrixWorld);let B=e.update(b),F=b.material;if(Array.isArray(F)){let W=B.groups;for(let Y=0,Q=W.length;Y<Q;Y++){let N=W[Y],ee=F[N.materialIndex];if(ee&&ee.visible){let $=y(b,ee,_,w);b.onBeforeShadow(n,b,C,H,B,$,N),n.renderBufferDirect(H,null,B,$,b,N),b.onAfterShadow(n,b,C,H,B,$,N)}}}else if(F.visible){let W=y(b,F,_,w);b.onBeforeShadow(n,b,C,H,B,W,null),n.renderBufferDirect(H,null,B,W,b,null),b.onAfterShadow(n,b,C,H,B,W,null)}}let I=b.children;for(let B=0,F=I.length;B<F;B++)x(I[B],C,H,_,w)}function S(b){b.target.removeEventListener("dispose",S);for(let H in c){let _=c[H],w=b.target.uuid;w in _&&(_[w].dispose(),delete _[w])}}}var Lm={[So]:bo,[Ro]:Ho,[Ao]:Po,[Ti]:Co,[bo]:So,[Ho]:Ro,[Po]:Ao,[Co]:Ti};function Gm(n,e){function t(){let U=!1,Me=new ft,q=null,Z=new ft(0,0,0,0);return{setMask:function(ue){q!==ue&&!U&&(n.colorMask(ue,ue,ue,ue),q=ue)},setLocked:function(ue){U=ue},setClear:function(ue,ye,Ge,nt,at){at===!0&&(ue*=nt,ye*=nt,Ge*=nt),Me.set(ue,ye,Ge,nt),Z.equals(Me)===!1&&(n.clearColor(ue,ye,Ge,nt),Z.copy(Me))},reset:function(){U=!1,q=null,Z.set(-1,0,0,0)}}}function i(){let U=!1,Me=!1,q=null,Z=null,ue=null;return{setReversed:function(ye){if(Me!==ye){let Ge=e.get("EXT_clip_control");ye?Ge.clipControlEXT(Ge.LOWER_LEFT_EXT,Ge.ZERO_TO_ONE_EXT):Ge.clipControlEXT(Ge.LOWER_LEFT_EXT,Ge.NEGATIVE_ONE_TO_ONE_EXT),Me=ye;let nt=ue;ue=null,this.setClear(nt)}},getReversed:function(){return Me},setTest:function(ye){ye?me(n.DEPTH_TEST):le(n.DEPTH_TEST)},setMask:function(ye){q!==ye&&!U&&(n.depthMask(ye),q=ye)},setFunc:function(ye){if(Me&&(ye=Lm[ye]),Z!==ye){switch(ye){case So:n.depthFunc(n.NEVER);break;case bo:n.depthFunc(n.ALWAYS);break;case Ro:n.depthFunc(n.LESS);break;case Ti:n.depthFunc(n.LEQUAL);break;case Ao:n.depthFunc(n.EQUAL);break;case Co:n.depthFunc(n.GEQUAL);break;case Ho:n.depthFunc(n.GREATER);break;case Po:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Z=ye}},setLocked:function(ye){U=ye},setClear:function(ye){ue!==ye&&(Me&&(ye=1-ye),n.clearDepth(ye),ue=ye)},reset:function(){U=!1,q=null,Z=null,ue=null,Me=!1}}}function s(){let U=!1,Me=null,q=null,Z=null,ue=null,ye=null,Ge=null,nt=null,at=null;return{setTest:function(et){U||(et?me(n.STENCIL_TEST):le(n.STENCIL_TEST))},setMask:function(et){Me!==et&&!U&&(n.stencilMask(et),Me=et)},setFunc:function(et,Dt,sn){(q!==et||Z!==Dt||ue!==sn)&&(n.stencilFunc(et,Dt,sn),q=et,Z=Dt,ue=sn)},setOp:function(et,Dt,sn){(ye!==et||Ge!==Dt||nt!==sn)&&(n.stencilOp(et,Dt,sn),ye=et,Ge=Dt,nt=sn)},setLocked:function(et){U=et},setClear:function(et){at!==et&&(n.clearStencil(et),at=et)},reset:function(){U=!1,Me=null,q=null,Z=null,ue=null,ye=null,Ge=null,nt=null,at=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},d={},f=new WeakMap,u=[],E=null,M=!1,g=null,p=null,T=null,y=null,x=null,S=null,b=null,C=new Ie(0,0,0),H=0,_=!1,w=null,P=null,I=null,B=null,F=null,W=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,Q=0,N=n.getParameter(n.VERSION);N.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(N)[1]),Y=Q>=1):N.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),Y=Q>=2);let ee=null,$={},fe=n.getParameter(n.SCISSOR_BOX),be=n.getParameter(n.VIEWPORT),Re=new ft().fromArray(fe),K=new ft().fromArray(be);function ae(U,Me,q,Z){let ue=new Uint8Array(4),ye=n.createTexture();n.bindTexture(U,ye),n.texParameteri(U,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(U,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ge=0;Ge<q;Ge++)U===n.TEXTURE_3D||U===n.TEXTURE_2D_ARRAY?n.texImage3D(Me,0,n.RGBA,1,1,Z,0,n.RGBA,n.UNSIGNED_BYTE,ue):n.texImage2D(Me+Ge,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,ue);return ye}let Ee={};Ee[n.TEXTURE_2D]=ae(n.TEXTURE_2D,n.TEXTURE_2D,1),Ee[n.TEXTURE_CUBE_MAP]=ae(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ee[n.TEXTURE_2D_ARRAY]=ae(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Ee[n.TEXTURE_3D]=ae(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),me(n.DEPTH_TEST),o.setFunc(Ti),k(!1),Be(El),me(n.CULL_FACE),G(zn);function me(U){h[U]!==!0&&(n.enable(U),h[U]=!0)}function le(U){h[U]!==!1&&(n.disable(U),h[U]=!1)}function He(U,Me){return d[U]!==Me?(n.bindFramebuffer(U,Me),d[U]=Me,U===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=Me),U===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=Me),!0):!1}function ne(U,Me){let q=u,Z=!1;if(U){q=f.get(Me),q===void 0&&(q=[],f.set(Me,q));let ue=U.textures;if(q.length!==ue.length||q[0]!==n.COLOR_ATTACHMENT0){for(let ye=0,Ge=ue.length;ye<Ge;ye++)q[ye]=n.COLOR_ATTACHMENT0+ye;q.length=ue.length,Z=!0}}else q[0]!==n.BACK&&(q[0]=n.BACK,Z=!0);Z&&n.drawBuffers(q)}function ge(U){return E!==U?(n.useProgram(U),E=U,!0):!1}let pe={[ri]:n.FUNC_ADD,[Fc]:n.FUNC_SUBTRACT,[Nc]:n.FUNC_REVERSE_SUBTRACT};pe[kc]=n.MIN,pe[Oc]=n.MAX;let xe={[zc]:n.ZERO,[Vc]:n.ONE,[Wc]:n.SRC_COLOR,[qr]:n.SRC_ALPHA,[Kc]:n.SRC_ALPHA_SATURATE,[Zc]:n.DST_COLOR,[Yc]:n.DST_ALPHA,[Xc]:n.ONE_MINUS_SRC_COLOR,[Zr]:n.ONE_MINUS_SRC_ALPHA,[Jc]:n.ONE_MINUS_DST_COLOR,[qc]:n.ONE_MINUS_DST_ALPHA,[$c]:n.CONSTANT_COLOR,[Qc]:n.ONE_MINUS_CONSTANT_COLOR,[jc]:n.CONSTANT_ALPHA,[eh]:n.ONE_MINUS_CONSTANT_ALPHA};function G(U,Me,q,Z,ue,ye,Ge,nt,at,et){if(U===zn){M===!0&&(le(n.BLEND),M=!1);return}if(M===!1&&(me(n.BLEND),M=!0),U!==Uc){if(U!==g||et!==_){if((p!==ri||x!==ri)&&(n.blendEquation(n.FUNC_ADD),p=ri,x=ri),et)switch(U){case wi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case vn:n.blendFunc(n.ONE,n.ONE);break;case Ml:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case yl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case wi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case vn:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Ml:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case yl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}T=null,y=null,S=null,b=null,C.set(0,0,0),H=0,g=U,_=et}return}ue=ue||Me,ye=ye||q,Ge=Ge||Z,(Me!==p||ue!==x)&&(n.blendEquationSeparate(pe[Me],pe[ue]),p=Me,x=ue),(q!==T||Z!==y||ye!==S||Ge!==b)&&(n.blendFuncSeparate(xe[q],xe[Z],xe[ye],xe[Ge]),T=q,y=Z,S=ye,b=Ge),(nt.equals(C)===!1||at!==H)&&(n.blendColor(nt.r,nt.g,nt.b,at),C.copy(nt),H=at),g=U,_=!1}function he(U,Me){U.side===ct?le(n.CULL_FACE):me(n.CULL_FACE);let q=U.side===Ft;Me&&(q=!q),k(q),U.blending===wi&&U.transparent===!1?G(zn):G(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let Z=U.stencilWrite;a.setTest(Z),Z&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),Ye(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?me(n.SAMPLE_ALPHA_TO_COVERAGE):le(n.SAMPLE_ALPHA_TO_COVERAGE)}function k(U){w!==U&&(U?n.frontFace(n.CW):n.frontFace(n.CCW),w=U)}function Be(U){U!==Gc?(me(n.CULL_FACE),U!==P&&(U===El?n.cullFace(n.BACK):U===Bc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):le(n.CULL_FACE),P=U}function we(U){U!==I&&(Y&&n.lineWidth(U),I=U)}function Ye(U,Me,q){U?(me(n.POLYGON_OFFSET_FILL),(B!==Me||F!==q)&&(n.polygonOffset(Me,q),B=Me,F=q)):le(n.POLYGON_OFFSET_FILL)}function Ue(U){U?me(n.SCISSOR_TEST):le(n.SCISSOR_TEST)}function D(U){U===void 0&&(U=n.TEXTURE0+W-1),ee!==U&&(n.activeTexture(U),ee=U)}function v(U,Me,q){q===void 0&&(ee===null?q=n.TEXTURE0+W-1:q=ee);let Z=$[q];Z===void 0&&(Z={type:void 0,texture:void 0},$[q]=Z),(Z.type!==U||Z.texture!==Me)&&(ee!==q&&(n.activeTexture(q),ee=q),n.bindTexture(U,Me||Ee[U]),Z.type=U,Z.texture=Me)}function V(){let U=$[ee];U!==void 0&&U.type!==void 0&&(n.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function se(){try{n.compressedTexImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ce(){try{n.compressedTexImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function oe(){try{n.texSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ze(){try{n.texSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Pe(){try{n.compressedTexSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ae(){try{n.compressedTexSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Qe(){try{n.texStorage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Te(){try{n.texStorage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ke(){try{n.texImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function qe(){try{n.texImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ke(U){Re.equals(U)===!1&&(n.scissor(U.x,U.y,U.z,U.w),Re.copy(U))}function Fe(U){K.equals(U)===!1&&(n.viewport(U.x,U.y,U.z,U.w),K.copy(U))}function Ce(U,Me){let q=c.get(Me);q===void 0&&(q=new WeakMap,c.set(Me,q));let Z=q.get(U);Z===void 0&&(Z=n.getUniformBlockIndex(Me,U.name),q.set(U,Z))}function ve(U,Me){let Z=c.get(Me).get(U);l.get(Me)!==Z&&(n.uniformBlockBinding(Me,Z,U.__bindingPointIndex),l.set(Me,Z))}function We(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},ee=null,$={},d={},f=new WeakMap,u=[],E=null,M=!1,g=null,p=null,T=null,y=null,x=null,S=null,b=null,C=new Ie(0,0,0),H=0,_=!1,w=null,P=null,I=null,B=null,F=null,Re.set(0,0,n.canvas.width,n.canvas.height),K.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:me,disable:le,bindFramebuffer:He,drawBuffers:ne,useProgram:ge,setBlending:G,setMaterial:he,setFlipSided:k,setCullFace:Be,setLineWidth:we,setPolygonOffset:Ye,setScissorTest:Ue,activeTexture:D,bindTexture:v,unbindTexture:V,compressedTexImage2D:se,compressedTexImage3D:ce,texImage2D:ke,texImage3D:qe,updateUBOMapping:Ce,uniformBlockBinding:ve,texStorage2D:Qe,texStorage3D:Te,texSubImage2D:oe,texSubImage3D:ze,compressedTexSubImage2D:Pe,compressedTexSubImage3D:Ae,scissor:Ke,viewport:Fe,reset:We}}function Bm(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Se,h=new WeakMap,d,f=new WeakMap,u=!1;try{u=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function E(D,v){return u?new OffscreenCanvas(D,v):ji("canvas")}function M(D,v,V){let se=1,ce=Ue(D);if((ce.width>V||ce.height>V)&&(se=V/Math.max(ce.width,ce.height)),se<1)if(typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&D instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&D instanceof ImageBitmap||typeof VideoFrame<"u"&&D instanceof VideoFrame){let oe=Math.floor(se*ce.width),ze=Math.floor(se*ce.height);d===void 0&&(d=E(oe,ze));let Pe=v?E(oe,ze):d;return Pe.width=oe,Pe.height=ze,Pe.getContext("2d").drawImage(D,0,0,oe,ze),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ce.width+"x"+ce.height+") to ("+oe+"x"+ze+")."),Pe}else return"data"in D&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ce.width+"x"+ce.height+")."),D;return D}function g(D){return D.generateMipmaps}function p(D){n.generateMipmap(D)}function T(D){return D.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:D.isWebGL3DRenderTarget?n.TEXTURE_3D:D.isWebGLArrayRenderTarget||D.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function y(D,v,V,se,ce=!1){if(D!==null){if(n[D]!==void 0)return n[D];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+D+"'")}let oe=v;if(v===n.RED&&(V===n.FLOAT&&(oe=n.R32F),V===n.HALF_FLOAT&&(oe=n.R16F),V===n.UNSIGNED_BYTE&&(oe=n.R8)),v===n.RED_INTEGER&&(V===n.UNSIGNED_BYTE&&(oe=n.R8UI),V===n.UNSIGNED_SHORT&&(oe=n.R16UI),V===n.UNSIGNED_INT&&(oe=n.R32UI),V===n.BYTE&&(oe=n.R8I),V===n.SHORT&&(oe=n.R16I),V===n.INT&&(oe=n.R32I)),v===n.RG&&(V===n.FLOAT&&(oe=n.RG32F),V===n.HALF_FLOAT&&(oe=n.RG16F),V===n.UNSIGNED_BYTE&&(oe=n.RG8)),v===n.RG_INTEGER&&(V===n.UNSIGNED_BYTE&&(oe=n.RG8UI),V===n.UNSIGNED_SHORT&&(oe=n.RG16UI),V===n.UNSIGNED_INT&&(oe=n.RG32UI),V===n.BYTE&&(oe=n.RG8I),V===n.SHORT&&(oe=n.RG16I),V===n.INT&&(oe=n.RG32I)),v===n.RGB_INTEGER&&(V===n.UNSIGNED_BYTE&&(oe=n.RGB8UI),V===n.UNSIGNED_SHORT&&(oe=n.RGB16UI),V===n.UNSIGNED_INT&&(oe=n.RGB32UI),V===n.BYTE&&(oe=n.RGB8I),V===n.SHORT&&(oe=n.RGB16I),V===n.INT&&(oe=n.RGB32I)),v===n.RGBA_INTEGER&&(V===n.UNSIGNED_BYTE&&(oe=n.RGBA8UI),V===n.UNSIGNED_SHORT&&(oe=n.RGBA16UI),V===n.UNSIGNED_INT&&(oe=n.RGBA32UI),V===n.BYTE&&(oe=n.RGBA8I),V===n.SHORT&&(oe=n.RGBA16I),V===n.INT&&(oe=n.RGBA32I)),v===n.RGB&&V===n.UNSIGNED_INT_5_9_9_9_REV&&(oe=n.RGB9_E5),v===n.RGBA){let ze=ce?Gs:dt.getTransfer(se);V===n.FLOAT&&(oe=n.RGBA32F),V===n.HALF_FLOAT&&(oe=n.RGBA16F),V===n.UNSIGNED_BYTE&&(oe=ze===gt?n.SRGB8_ALPHA8:n.RGBA8),V===n.UNSIGNED_SHORT_4_4_4_4&&(oe=n.RGBA4),V===n.UNSIGNED_SHORT_5_5_5_1&&(oe=n.RGB5_A1)}return(oe===n.R16F||oe===n.R32F||oe===n.RG16F||oe===n.RG32F||oe===n.RGBA16F||oe===n.RGBA32F)&&e.get("EXT_color_buffer_float"),oe}function x(D,v){let V;return D?v===null||v===ui||v===ds?V=n.DEPTH24_STENCIL8:v===bn?V=n.DEPTH32F_STENCIL8:v===hs&&(V=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===ui||v===ds?V=n.DEPTH_COMPONENT24:v===bn?V=n.DEPTH_COMPONENT32F:v===hs&&(V=n.DEPTH_COMPONENT16),V}function S(D,v){return g(D)===!0||D.isFramebufferTexture&&D.minFilter!==cn&&D.minFilter!==Mn?Math.log2(Math.max(v.width,v.height))+1:D.mipmaps!==void 0&&D.mipmaps.length>0?D.mipmaps.length:D.isCompressedTexture&&Array.isArray(D.image)?v.mipmaps.length:1}function b(D){let v=D.target;v.removeEventListener("dispose",b),H(v),v.isVideoTexture&&h.delete(v)}function C(D){let v=D.target;v.removeEventListener("dispose",C),w(v)}function H(D){let v=i.get(D);if(v.__webglInit===void 0)return;let V=D.source,se=f.get(V);if(se){let ce=se[v.__cacheKey];ce.usedTimes--,ce.usedTimes===0&&_(D),Object.keys(se).length===0&&f.delete(V)}i.remove(D)}function _(D){let v=i.get(D);n.deleteTexture(v.__webglTexture);let V=D.source,se=f.get(V);delete se[v.__cacheKey],o.memory.textures--}function w(D){let v=i.get(D);if(D.depthTexture&&(D.depthTexture.dispose(),i.remove(D.depthTexture)),D.isWebGLCubeRenderTarget)for(let se=0;se<6;se++){if(Array.isArray(v.__webglFramebuffer[se]))for(let ce=0;ce<v.__webglFramebuffer[se].length;ce++)n.deleteFramebuffer(v.__webglFramebuffer[se][ce]);else n.deleteFramebuffer(v.__webglFramebuffer[se]);v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer[se])}else{if(Array.isArray(v.__webglFramebuffer))for(let se=0;se<v.__webglFramebuffer.length;se++)n.deleteFramebuffer(v.__webglFramebuffer[se]);else n.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&n.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let se=0;se<v.__webglColorRenderbuffer.length;se++)v.__webglColorRenderbuffer[se]&&n.deleteRenderbuffer(v.__webglColorRenderbuffer[se]);v.__webglDepthRenderbuffer&&n.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let V=D.textures;for(let se=0,ce=V.length;se<ce;se++){let oe=i.get(V[se]);oe.__webglTexture&&(n.deleteTexture(oe.__webglTexture),o.memory.textures--),i.remove(V[se])}i.remove(D)}let P=0;function I(){P=0}function B(){let D=P;return D>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+D+" texture units while this GPU supports only "+s.maxTextures),P+=1,D}function F(D){let v=[];return v.push(D.wrapS),v.push(D.wrapT),v.push(D.wrapR||0),v.push(D.magFilter),v.push(D.minFilter),v.push(D.anisotropy),v.push(D.internalFormat),v.push(D.format),v.push(D.type),v.push(D.generateMipmaps),v.push(D.premultiplyAlpha),v.push(D.flipY),v.push(D.unpackAlignment),v.push(D.colorSpace),v.join()}function W(D,v){let V=i.get(D);if(D.isVideoTexture&&we(D),D.isRenderTargetTexture===!1&&D.version>0&&V.__version!==D.version){let se=D.image;if(se===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(se.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(V,D,v);return}}t.bindTexture(n.TEXTURE_2D,V.__webglTexture,n.TEXTURE0+v)}function Y(D,v){let V=i.get(D);if(D.version>0&&V.__version!==D.version){K(V,D,v);return}t.bindTexture(n.TEXTURE_2D_ARRAY,V.__webglTexture,n.TEXTURE0+v)}function Q(D,v){let V=i.get(D);if(D.version>0&&V.__version!==D.version){K(V,D,v);return}t.bindTexture(n.TEXTURE_3D,V.__webglTexture,n.TEXTURE0+v)}function N(D,v){let V=i.get(D);if(D.version>0&&V.__version!==D.version){ae(V,D,v);return}t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture,n.TEXTURE0+v)}let ee={[Nn]:n.REPEAT,[si]:n.CLAMP_TO_EDGE,[Jr]:n.MIRRORED_REPEAT},$={[cn]:n.NEAREST,[ch]:n.NEAREST_MIPMAP_NEAREST,[or]:n.NEAREST_MIPMAP_LINEAR,[Mn]:n.LINEAR,[Go]:n.LINEAR_MIPMAP_NEAREST,[di]:n.LINEAR_MIPMAP_LINEAR},fe={[fh]:n.NEVER,[yh]:n.ALWAYS,[ph]:n.LESS,[Dl]:n.LEQUAL,[mh]:n.EQUAL,[Mh]:n.GEQUAL,[Eh]:n.GREATER,[gh]:n.NOTEQUAL};function be(D,v){if(v.type===bn&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===Mn||v.magFilter===Go||v.magFilter===or||v.magFilter===di||v.minFilter===Mn||v.minFilter===Go||v.minFilter===or||v.minFilter===di)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(D,n.TEXTURE_WRAP_S,ee[v.wrapS]),n.texParameteri(D,n.TEXTURE_WRAP_T,ee[v.wrapT]),(D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY)&&n.texParameteri(D,n.TEXTURE_WRAP_R,ee[v.wrapR]),n.texParameteri(D,n.TEXTURE_MAG_FILTER,$[v.magFilter]),n.texParameteri(D,n.TEXTURE_MIN_FILTER,$[v.minFilter]),v.compareFunction&&(n.texParameteri(D,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(D,n.TEXTURE_COMPARE_FUNC,fe[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===cn||v.minFilter!==or&&v.minFilter!==di||v.type===bn&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");n.texParameterf(D,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function Re(D,v){let V=!1;D.__webglInit===void 0&&(D.__webglInit=!0,v.addEventListener("dispose",b));let se=v.source,ce=f.get(se);ce===void 0&&(ce={},f.set(se,ce));let oe=F(v);if(oe!==D.__cacheKey){ce[oe]===void 0&&(ce[oe]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,V=!0),ce[oe].usedTimes++;let ze=ce[D.__cacheKey];ze!==void 0&&(ce[D.__cacheKey].usedTimes--,ze.usedTimes===0&&_(v)),D.__cacheKey=oe,D.__webglTexture=ce[oe].texture}return V}function K(D,v,V){let se=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(se=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(se=n.TEXTURE_3D);let ce=Re(D,v),oe=v.source;t.bindTexture(se,D.__webglTexture,n.TEXTURE0+V);let ze=i.get(oe);if(oe.version!==ze.__version||ce===!0){t.activeTexture(n.TEXTURE0+V);let Pe=dt.getPrimaries(dt.workingColorSpace),Ae=v.colorSpace===Wn?null:dt.getPrimaries(v.colorSpace),Qe=v.colorSpace===Wn||Pe===Ae?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Qe);let Te=M(v.image,!1,s.maxTextureSize);Te=Ye(v,Te);let ke=r.convert(v.format,v.colorSpace),qe=r.convert(v.type),Ke=y(v.internalFormat,ke,qe,v.colorSpace,v.isVideoTexture);be(se,v);let Fe,Ce=v.mipmaps,ve=v.isVideoTexture!==!0,We=ze.__version===void 0||ce===!0,U=oe.dataReady,Me=S(v,Te);if(v.isDepthTexture)Ke=x(v.format===us,v.type),We&&(ve?t.texStorage2D(n.TEXTURE_2D,1,Ke,Te.width,Te.height):t.texImage2D(n.TEXTURE_2D,0,Ke,Te.width,Te.height,0,ke,qe,null));else if(v.isDataTexture)if(Ce.length>0){ve&&We&&t.texStorage2D(n.TEXTURE_2D,Me,Ke,Ce[0].width,Ce[0].height);for(let q=0,Z=Ce.length;q<Z;q++)Fe=Ce[q],ve?U&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,Fe.width,Fe.height,ke,qe,Fe.data):t.texImage2D(n.TEXTURE_2D,q,Ke,Fe.width,Fe.height,0,ke,qe,Fe.data);v.generateMipmaps=!1}else ve?(We&&t.texStorage2D(n.TEXTURE_2D,Me,Ke,Te.width,Te.height),U&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Te.width,Te.height,ke,qe,Te.data)):t.texImage2D(n.TEXTURE_2D,0,Ke,Te.width,Te.height,0,ke,qe,Te.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){ve&&We&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Me,Ke,Ce[0].width,Ce[0].height,Te.depth);for(let q=0,Z=Ce.length;q<Z;q++)if(Fe=Ce[q],v.format!==un)if(ke!==null)if(ve){if(U)if(v.layerUpdates.size>0){let ue=kl(Fe.width,Fe.height,v.format,v.type);for(let ye of v.layerUpdates){let Ge=Fe.data.subarray(ye*ue/Fe.data.BYTES_PER_ELEMENT,(ye+1)*ue/Fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,ye,Fe.width,Fe.height,1,ke,Ge)}v.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,Fe.width,Fe.height,Te.depth,ke,Fe.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,q,Ke,Fe.width,Fe.height,Te.depth,0,Fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ve?U&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,q,0,0,0,Fe.width,Fe.height,Te.depth,ke,qe,Fe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,q,Ke,Fe.width,Fe.height,Te.depth,0,ke,qe,Fe.data)}else{ve&&We&&t.texStorage2D(n.TEXTURE_2D,Me,Ke,Ce[0].width,Ce[0].height);for(let q=0,Z=Ce.length;q<Z;q++)Fe=Ce[q],v.format!==un?ke!==null?ve?U&&t.compressedTexSubImage2D(n.TEXTURE_2D,q,0,0,Fe.width,Fe.height,ke,Fe.data):t.compressedTexImage2D(n.TEXTURE_2D,q,Ke,Fe.width,Fe.height,0,Fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ve?U&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,Fe.width,Fe.height,ke,qe,Fe.data):t.texImage2D(n.TEXTURE_2D,q,Ke,Fe.width,Fe.height,0,ke,qe,Fe.data)}else if(v.isDataArrayTexture)if(ve){if(We&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Me,Ke,Te.width,Te.height,Te.depth),U)if(v.layerUpdates.size>0){let q=kl(Te.width,Te.height,v.format,v.type);for(let Z of v.layerUpdates){let ue=Te.data.subarray(Z*q/Te.data.BYTES_PER_ELEMENT,(Z+1)*q/Te.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Z,Te.width,Te.height,1,ke,qe,ue)}v.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,Te.width,Te.height,Te.depth,ke,qe,Te.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ke,Te.width,Te.height,Te.depth,0,ke,qe,Te.data);else if(v.isData3DTexture)ve?(We&&t.texStorage3D(n.TEXTURE_3D,Me,Ke,Te.width,Te.height,Te.depth),U&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,Te.width,Te.height,Te.depth,ke,qe,Te.data)):t.texImage3D(n.TEXTURE_3D,0,Ke,Te.width,Te.height,Te.depth,0,ke,qe,Te.data);else if(v.isFramebufferTexture){if(We)if(ve)t.texStorage2D(n.TEXTURE_2D,Me,Ke,Te.width,Te.height);else{let q=Te.width,Z=Te.height;for(let ue=0;ue<Me;ue++)t.texImage2D(n.TEXTURE_2D,ue,Ke,q,Z,0,ke,qe,null),q>>=1,Z>>=1}}else if(Ce.length>0){if(ve&&We){let q=Ue(Ce[0]);t.texStorage2D(n.TEXTURE_2D,Me,Ke,q.width,q.height)}for(let q=0,Z=Ce.length;q<Z;q++)Fe=Ce[q],ve?U&&t.texSubImage2D(n.TEXTURE_2D,q,0,0,ke,qe,Fe):t.texImage2D(n.TEXTURE_2D,q,Ke,ke,qe,Fe);v.generateMipmaps=!1}else if(ve){if(We){let q=Ue(Te);t.texStorage2D(n.TEXTURE_2D,Me,Ke,q.width,q.height)}U&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ke,qe,Te)}else t.texImage2D(n.TEXTURE_2D,0,Ke,ke,qe,Te);g(v)&&p(se),ze.__version=oe.version,v.onUpdate&&v.onUpdate(v)}D.__version=v.version}function ae(D,v,V){if(v.image.length!==6)return;let se=Re(D,v),ce=v.source;t.bindTexture(n.TEXTURE_CUBE_MAP,D.__webglTexture,n.TEXTURE0+V);let oe=i.get(ce);if(ce.version!==oe.__version||se===!0){t.activeTexture(n.TEXTURE0+V);let ze=dt.getPrimaries(dt.workingColorSpace),Pe=v.colorSpace===Wn?null:dt.getPrimaries(v.colorSpace),Ae=v.colorSpace===Wn||ze===Pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae);let Qe=v.isCompressedTexture||v.image[0].isCompressedTexture,Te=v.image[0]&&v.image[0].isDataTexture,ke=[];for(let Z=0;Z<6;Z++)!Qe&&!Te?ke[Z]=M(v.image[Z],!0,s.maxCubemapSize):ke[Z]=Te?v.image[Z].image:v.image[Z],ke[Z]=Ye(v,ke[Z]);let qe=ke[0],Ke=r.convert(v.format,v.colorSpace),Fe=r.convert(v.type),Ce=y(v.internalFormat,Ke,Fe,v.colorSpace),ve=v.isVideoTexture!==!0,We=oe.__version===void 0||se===!0,U=ce.dataReady,Me=S(v,qe);be(n.TEXTURE_CUBE_MAP,v);let q;if(Qe){ve&&We&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Me,Ce,qe.width,qe.height);for(let Z=0;Z<6;Z++){q=ke[Z].mipmaps;for(let ue=0;ue<q.length;ue++){let ye=q[ue];v.format!==un?Ke!==null?ve?U&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue,0,0,ye.width,ye.height,Ke,ye.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue,Ce,ye.width,ye.height,0,ye.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ve?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue,0,0,ye.width,ye.height,Ke,Fe,ye.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue,Ce,ye.width,ye.height,0,Ke,Fe,ye.data)}}}else{if(q=v.mipmaps,ve&&We){q.length>0&&Me++;let Z=Ue(ke[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Me,Ce,Z.width,Z.height)}for(let Z=0;Z<6;Z++)if(Te){ve?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,0,0,ke[Z].width,ke[Z].height,Ke,Fe,ke[Z].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,Ce,ke[Z].width,ke[Z].height,0,Ke,Fe,ke[Z].data);for(let ue=0;ue<q.length;ue++){let Ge=q[ue].image[Z].image;ve?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue+1,0,0,Ge.width,Ge.height,Ke,Fe,Ge.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue+1,Ce,Ge.width,Ge.height,0,Ke,Fe,Ge.data)}}else{ve?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,0,0,Ke,Fe,ke[Z]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0,Ce,Ke,Fe,ke[Z]);for(let ue=0;ue<q.length;ue++){let ye=q[ue];ve?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue+1,0,0,Ke,Fe,ye.image[Z]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Z,ue+1,Ce,Ke,Fe,ye.image[Z])}}}g(v)&&p(n.TEXTURE_CUBE_MAP),oe.__version=ce.version,v.onUpdate&&v.onUpdate(v)}D.__version=v.version}function Ee(D,v,V,se,ce,oe){let ze=r.convert(V.format,V.colorSpace),Pe=r.convert(V.type),Ae=y(V.internalFormat,ze,Pe,V.colorSpace),Qe=i.get(v),Te=i.get(V);if(Te.__renderTarget=v,!Qe.__hasExternalTextures){let ke=Math.max(1,v.width>>oe),qe=Math.max(1,v.height>>oe);ce===n.TEXTURE_3D||ce===n.TEXTURE_2D_ARRAY?t.texImage3D(ce,oe,Ae,ke,qe,v.depth,0,ze,Pe,null):t.texImage2D(ce,oe,Ae,ke,qe,0,ze,Pe,null)}t.bindFramebuffer(n.FRAMEBUFFER,D),Be(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,se,ce,Te.__webglTexture,0,k(v)):(ce===n.TEXTURE_2D||ce>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ce<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,se,ce,Te.__webglTexture,oe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function me(D,v,V){if(n.bindRenderbuffer(n.RENDERBUFFER,D),v.depthBuffer){let se=v.depthTexture,ce=se&&se.isDepthTexture?se.type:null,oe=x(v.stencilBuffer,ce),ze=v.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Pe=k(v);Be(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Pe,oe,v.width,v.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,Pe,oe,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,oe,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ze,n.RENDERBUFFER,D)}else{let se=v.textures;for(let ce=0;ce<se.length;ce++){let oe=se[ce],ze=r.convert(oe.format,oe.colorSpace),Pe=r.convert(oe.type),Ae=y(oe.internalFormat,ze,Pe,oe.colorSpace),Qe=k(v);V&&Be(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Qe,Ae,v.width,v.height):Be(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Qe,Ae,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,Ae,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function le(D,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,D),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let se=i.get(v.depthTexture);se.__renderTarget=v,(!se.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),W(v.depthTexture,0);let ce=se.__webglTexture,oe=k(v);if(v.depthTexture.format===Qi)Be(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ce,0,oe):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ce,0);else if(v.depthTexture.format===us)Be(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ce,0,oe):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ce,0);else throw new Error("Unknown depthTexture format")}function He(D){let v=i.get(D),V=D.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==D.depthTexture){let se=D.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),se){let ce=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,se.removeEventListener("dispose",ce)};se.addEventListener("dispose",ce),v.__depthDisposeCallback=ce}v.__boundDepthTexture=se}if(D.depthTexture&&!v.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");le(v.__webglFramebuffer,D)}else if(V){v.__webglDepthbuffer=[];for(let se=0;se<6;se++)if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[se]),v.__webglDepthbuffer[se]===void 0)v.__webglDepthbuffer[se]=n.createRenderbuffer(),me(v.__webglDepthbuffer[se],D,!1);else{let ce=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,oe=v.__webglDepthbuffer[se];n.bindRenderbuffer(n.RENDERBUFFER,oe),n.framebufferRenderbuffer(n.FRAMEBUFFER,ce,n.RENDERBUFFER,oe)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=n.createRenderbuffer(),me(v.__webglDepthbuffer,D,!1);else{let se=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ce=v.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ce),n.framebufferRenderbuffer(n.FRAMEBUFFER,se,n.RENDERBUFFER,ce)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ne(D,v,V){let se=i.get(D);v!==void 0&&Ee(se.__webglFramebuffer,D,D.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),V!==void 0&&He(D)}function ge(D){let v=D.texture,V=i.get(D),se=i.get(v);D.addEventListener("dispose",C);let ce=D.textures,oe=D.isWebGLCubeRenderTarget===!0,ze=ce.length>1;if(ze||(se.__webglTexture===void 0&&(se.__webglTexture=n.createTexture()),se.__version=v.version,o.memory.textures++),oe){V.__webglFramebuffer=[];for(let Pe=0;Pe<6;Pe++)if(v.mipmaps&&v.mipmaps.length>0){V.__webglFramebuffer[Pe]=[];for(let Ae=0;Ae<v.mipmaps.length;Ae++)V.__webglFramebuffer[Pe][Ae]=n.createFramebuffer()}else V.__webglFramebuffer[Pe]=n.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){V.__webglFramebuffer=[];for(let Pe=0;Pe<v.mipmaps.length;Pe++)V.__webglFramebuffer[Pe]=n.createFramebuffer()}else V.__webglFramebuffer=n.createFramebuffer();if(ze)for(let Pe=0,Ae=ce.length;Pe<Ae;Pe++){let Qe=i.get(ce[Pe]);Qe.__webglTexture===void 0&&(Qe.__webglTexture=n.createTexture(),o.memory.textures++)}if(D.samples>0&&Be(D)===!1){V.__webglMultisampledFramebuffer=n.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let Pe=0;Pe<ce.length;Pe++){let Ae=ce[Pe];V.__webglColorRenderbuffer[Pe]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,V.__webglColorRenderbuffer[Pe]);let Qe=r.convert(Ae.format,Ae.colorSpace),Te=r.convert(Ae.type),ke=y(Ae.internalFormat,Qe,Te,Ae.colorSpace,D.isXRRenderTarget===!0),qe=k(D);n.renderbufferStorageMultisample(n.RENDERBUFFER,qe,ke,D.width,D.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Pe,n.RENDERBUFFER,V.__webglColorRenderbuffer[Pe])}n.bindRenderbuffer(n.RENDERBUFFER,null),D.depthBuffer&&(V.__webglDepthRenderbuffer=n.createRenderbuffer(),me(V.__webglDepthRenderbuffer,D,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(oe){t.bindTexture(n.TEXTURE_CUBE_MAP,se.__webglTexture),be(n.TEXTURE_CUBE_MAP,v);for(let Pe=0;Pe<6;Pe++)if(v.mipmaps&&v.mipmaps.length>0)for(let Ae=0;Ae<v.mipmaps.length;Ae++)Ee(V.__webglFramebuffer[Pe][Ae],D,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Pe,Ae);else Ee(V.__webglFramebuffer[Pe],D,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Pe,0);g(v)&&p(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ze){for(let Pe=0,Ae=ce.length;Pe<Ae;Pe++){let Qe=ce[Pe],Te=i.get(Qe);t.bindTexture(n.TEXTURE_2D,Te.__webglTexture),be(n.TEXTURE_2D,Qe),Ee(V.__webglFramebuffer,D,Qe,n.COLOR_ATTACHMENT0+Pe,n.TEXTURE_2D,0),g(Qe)&&p(n.TEXTURE_2D)}t.unbindTexture()}else{let Pe=n.TEXTURE_2D;if((D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(Pe=D.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Pe,se.__webglTexture),be(Pe,v),v.mipmaps&&v.mipmaps.length>0)for(let Ae=0;Ae<v.mipmaps.length;Ae++)Ee(V.__webglFramebuffer[Ae],D,v,n.COLOR_ATTACHMENT0,Pe,Ae);else Ee(V.__webglFramebuffer,D,v,n.COLOR_ATTACHMENT0,Pe,0);g(v)&&p(Pe),t.unbindTexture()}D.depthBuffer&&He(D)}function pe(D){let v=D.textures;for(let V=0,se=v.length;V<se;V++){let ce=v[V];if(g(ce)){let oe=T(D),ze=i.get(ce).__webglTexture;t.bindTexture(oe,ze),p(oe),t.unbindTexture()}}}let xe=[],G=[];function he(D){if(D.samples>0){if(Be(D)===!1){let v=D.textures,V=D.width,se=D.height,ce=n.COLOR_BUFFER_BIT,oe=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ze=i.get(D),Pe=v.length>1;if(Pe)for(let Ae=0;Ae<v.length;Ae++)t.bindFramebuffer(n.FRAMEBUFFER,ze.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ae,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ze.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ae,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ze.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ze.__webglFramebuffer);for(let Ae=0;Ae<v.length;Ae++){if(D.resolveDepthBuffer&&(D.depthBuffer&&(ce|=n.DEPTH_BUFFER_BIT),D.stencilBuffer&&D.resolveStencilBuffer&&(ce|=n.STENCIL_BUFFER_BIT)),Pe){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ze.__webglColorRenderbuffer[Ae]);let Qe=i.get(v[Ae]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Qe,0)}n.blitFramebuffer(0,0,V,se,0,0,V,se,ce,n.NEAREST),l===!0&&(xe.length=0,G.length=0,xe.push(n.COLOR_ATTACHMENT0+Ae),D.depthBuffer&&D.resolveDepthBuffer===!1&&(xe.push(oe),G.push(oe),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,G)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,xe))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Pe)for(let Ae=0;Ae<v.length;Ae++){t.bindFramebuffer(n.FRAMEBUFFER,ze.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ae,n.RENDERBUFFER,ze.__webglColorRenderbuffer[Ae]);let Qe=i.get(v[Ae]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ze.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ae,n.TEXTURE_2D,Qe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ze.__webglMultisampledFramebuffer)}else if(D.depthBuffer&&D.resolveDepthBuffer===!1&&l){let v=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[v])}}}function k(D){return Math.min(s.maxSamples,D.samples)}function Be(D){let v=i.get(D);return D.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function we(D){let v=o.render.frame;h.get(D)!==v&&(h.set(D,v),D.update())}function Ye(D,v){let V=D.colorSpace,se=D.format,ce=D.type;return D.isCompressedTexture===!0||D.isVideoTexture===!0||V!==_i&&V!==Wn&&(dt.getTransfer(V)===gt?(se!==un||ce!==Sn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),v}function Ue(D){return typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement?(c.width=D.naturalWidth||D.width,c.height=D.naturalHeight||D.height):typeof VideoFrame<"u"&&D instanceof VideoFrame?(c.width=D.displayWidth,c.height=D.displayHeight):(c.width=D.width,c.height=D.height),c}this.allocateTextureUnit=B,this.resetTextureUnits=I,this.setTexture2D=W,this.setTexture2DArray=Y,this.setTexture3D=Q,this.setTextureCube=N,this.rebindTextures=ne,this.setupRenderTarget=ge,this.updateRenderTargetMipmap=pe,this.updateMultisampleRenderTarget=he,this.setupDepthRenderbuffer=He,this.setupFrameBufferTexture=Ee,this.useMultisampledRTT=Be}function Um(n,e){function t(i,s=Wn){let r,o=dt.getTransfer(s);if(i===Sn)return n.UNSIGNED_BYTE;if(i===Uo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Fo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===vl)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Tl)return n.BYTE;if(i===_l)return n.SHORT;if(i===hs)return n.UNSIGNED_SHORT;if(i===Bo)return n.INT;if(i===ui)return n.UNSIGNED_INT;if(i===bn)return n.FLOAT;if(i===fi)return n.HALF_FLOAT;if(i===Sl)return n.ALPHA;if(i===bl)return n.RGB;if(i===un)return n.RGBA;if(i===Rl)return n.LUMINANCE;if(i===Al)return n.LUMINANCE_ALPHA;if(i===Qi)return n.DEPTH_COMPONENT;if(i===us)return n.DEPTH_STENCIL;if(i===Cl)return n.RED;if(i===No)return n.RED_INTEGER;if(i===Hl)return n.RG;if(i===ko)return n.RG_INTEGER;if(i===Oo)return n.RGBA_INTEGER;if(i===ar||i===lr||i===cr||i===hr)if(o===gt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===ar)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===cr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===ar)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===lr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===cr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===hr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===zo||i===Vo||i===Wo||i===Xo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===zo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Vo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Wo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Xo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Yo||i===qo||i===Zo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Yo||i===qo)return o===gt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Zo)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Jo||i===Ko||i===$o||i===Qo||i===jo||i===ea||i===ta||i===na||i===ia||i===sa||i===ra||i===oa||i===aa||i===la)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===Jo)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Ko)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===$o)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Qo)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===jo)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ea)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===ta)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===na)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ia)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===sa)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ra)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===oa)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===aa)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===la)return o===gt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===dr||i===ca||i===ha)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===dr)return o===gt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ca)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ha)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Pl||i===da||i===ua||i===fa)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===dr)return r.COMPRESSED_RED_RGTC1_EXT;if(i===da)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ua)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===fa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ds?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var Fm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Nm=`
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

}`,jl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let s=new Wt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==i.depthNear||t.depthFar!==i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Ut({vertexShader:Fm,fragmentShader:Nm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new m(new $e(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ec=class extends kn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,d=null,f=null,u=null,E=null,M=new jl,g=t.getContextAttributes(),p=null,T=null,y=[],x=[],S=new Se,b=null,C=new Ht;C.viewport=new ft;let H=new Ht;H.viewport=new ft;let _=[C,H],w=new _o,P=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let ae=y[K];return ae===void 0&&(ae=new ns,y[K]=ae),ae.getTargetRaySpace()},this.getControllerGrip=function(K){let ae=y[K];return ae===void 0&&(ae=new ns,y[K]=ae),ae.getGripSpace()},this.getHand=function(K){let ae=y[K];return ae===void 0&&(ae=new ns,y[K]=ae),ae.getHandSpace()};function B(K){let ae=x.indexOf(K.inputSource);if(ae===-1)return;let Ee=y[ae];Ee!==void 0&&(Ee.update(K.inputSource,K.frame,c||o),Ee.dispatchEvent({type:K.type,data:K.inputSource}))}function F(){s.removeEventListener("select",B),s.removeEventListener("selectstart",B),s.removeEventListener("selectend",B),s.removeEventListener("squeeze",B),s.removeEventListener("squeezestart",B),s.removeEventListener("squeezeend",B),s.removeEventListener("end",F),s.removeEventListener("inputsourceschange",W);for(let K=0;K<y.length;K++){let ae=x[K];ae!==null&&(x[K]=null,y[K].disconnect(ae))}P=null,I=null,M.reset(),e.setRenderTarget(p),u=null,f=null,d=null,s=null,T=null,Re.stop(),i.isPresenting=!1,e.setPixelRatio(b),e.setSize(S.width,S.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return f!==null?f:u},this.getBinding=function(){return d},this.getFrame=function(){return E},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=e.getRenderTarget(),s.addEventListener("select",B),s.addEventListener("selectstart",B),s.addEventListener("selectend",B),s.addEventListener("squeeze",B),s.addEventListener("squeezestart",B),s.addEventListener("squeezeend",B),s.addEventListener("end",F),s.addEventListener("inputsourceschange",W),g.xrCompatible!==!0&&await t.makeXRCompatible(),b=e.getPixelRatio(),e.getSize(S),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ee=null,me=null,le=null;g.depth&&(le=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Ee=g.stencil?us:Qi,me=g.stencil?ds:ui);let He={colorFormat:t.RGBA8,depthFormat:le,scaleFactor:r};d=new XRWebGLBinding(s,t),f=d.createProjectionLayer(He),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),T=new hn(f.textureWidth,f.textureHeight,{format:un,type:Sn,depthTexture:new qs(f.textureWidth,f.textureHeight,me,void 0,void 0,void 0,void 0,void 0,void 0,Ee),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{let Ee={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};u=new XRWebGLLayer(s,t,Ee),s.updateRenderState({baseLayer:u}),e.setPixelRatio(1),e.setSize(u.framebufferWidth,u.framebufferHeight,!1),T=new hn(u.framebufferWidth,u.framebufferHeight,{format:un,type:Sn,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Re.setContext(s),Re.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function W(K){for(let ae=0;ae<K.removed.length;ae++){let Ee=K.removed[ae],me=x.indexOf(Ee);me>=0&&(x[me]=null,y[me].disconnect(Ee))}for(let ae=0;ae<K.added.length;ae++){let Ee=K.added[ae],me=x.indexOf(Ee);if(me===-1){for(let He=0;He<y.length;He++)if(He>=x.length){x.push(Ee),me=He;break}else if(x[He]===null){x[He]=Ee,me=He;break}if(me===-1)break}let le=y[me];le&&le.connect(Ee)}}let Y=new L,Q=new L;function N(K,ae,Ee){Y.setFromMatrixPosition(ae.matrixWorld),Q.setFromMatrixPosition(Ee.matrixWorld);let me=Y.distanceTo(Q),le=ae.projectionMatrix.elements,He=Ee.projectionMatrix.elements,ne=le[14]/(le[10]-1),ge=le[14]/(le[10]+1),pe=(le[9]+1)/le[5],xe=(le[9]-1)/le[5],G=(le[8]-1)/le[0],he=(He[8]+1)/He[0],k=ne*G,Be=ne*he,we=me/(-G+he),Ye=we*-G;if(ae.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Ye),K.translateZ(we),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),le[10]===-1)K.projectionMatrix.copy(ae.projectionMatrix),K.projectionMatrixInverse.copy(ae.projectionMatrixInverse);else{let Ue=ne+we,D=ge+we,v=k-Ye,V=Be+(me-Ye),se=pe*ge/D*Ue,ce=xe*ge/D*Ue;K.projectionMatrix.makePerspective(v,V,se,ce,Ue,D),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function ee(K,ae){ae===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(ae.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let ae=K.near,Ee=K.far;M.texture!==null&&(M.depthNear>0&&(ae=M.depthNear),M.depthFar>0&&(Ee=M.depthFar)),w.near=H.near=C.near=ae,w.far=H.far=C.far=Ee,(P!==w.near||I!==w.far)&&(s.updateRenderState({depthNear:w.near,depthFar:w.far}),P=w.near,I=w.far),C.layers.mask=K.layers.mask|2,H.layers.mask=K.layers.mask|4,w.layers.mask=C.layers.mask|H.layers.mask;let me=K.parent,le=w.cameras;ee(w,me);for(let He=0;He<le.length;He++)ee(le[He],me);le.length===2?N(w,C,H):w.projectionMatrix.copy(C.projectionMatrix),$(K,w,me)};function $(K,ae,Ee){Ee===null?K.matrix.copy(ae.matrixWorld):(K.matrix.copy(Ee.matrixWorld),K.matrix.invert(),K.matrix.multiply(ae.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(ae.projectionMatrix),K.projectionMatrixInverse.copy(ae.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Us*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return w},this.getFoveation=function(){if(!(f===null&&u===null))return l},this.setFoveation=function(K){l=K,f!==null&&(f.fixedFoveation=K),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=K)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh(w)};let fe=null;function be(K,ae){if(h=ae.getViewerPose(c||o),E=ae,h!==null){let Ee=h.views;u!==null&&(e.setRenderTargetFramebuffer(T,u.framebuffer),e.setRenderTarget(T));let me=!1;Ee.length!==w.cameras.length&&(w.cameras.length=0,me=!0);for(let ne=0;ne<Ee.length;ne++){let ge=Ee[ne],pe=null;if(u!==null)pe=u.getViewport(ge);else{let G=d.getViewSubImage(f,ge);pe=G.viewport,ne===0&&(e.setRenderTargetTextures(T,G.colorTexture,G.depthStencilTexture),e.setRenderTarget(T))}let xe=_[ne];xe===void 0&&(xe=new Ht,xe.layers.enable(ne),xe.viewport=new ft,_[ne]=xe),xe.matrix.fromArray(ge.transform.matrix),xe.matrix.decompose(xe.position,xe.quaternion,xe.scale),xe.projectionMatrix.fromArray(ge.projectionMatrix),xe.projectionMatrixInverse.copy(xe.projectionMatrix).invert(),xe.viewport.set(pe.x,pe.y,pe.width,pe.height),ne===0&&(w.matrix.copy(xe.matrix),w.matrix.decompose(w.position,w.quaternion,w.scale)),me===!0&&w.cameras.push(xe)}let le=s.enabledFeatures;if(le&&le.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&d){let ne=d.getDepthInformation(Ee[0]);ne&&ne.isValid&&ne.texture&&M.init(e,ne,s.renderState)}}for(let Ee=0;Ee<y.length;Ee++){let me=x[Ee],le=y[Ee];me!==null&&le!==void 0&&le.update(me,ae,c||o)}fe&&fe(K,ae),ae.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ae}),E=null}let Re=new Jh;Re.setAnimationLoop(be),this.setAnimationLoop=function(K){fe=K},this.dispose=function(){}}},Di=new Xt,km=new pt;function Om(n,e){function t(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function i(g,p){p.color.getRGB(g.fogColor.value,Bl(n)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,T,y,x){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),d(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p)):p.isMeshStandardMaterial?(r(g,p),f(g,p),p.isMeshPhysicalMaterial&&u(g,p,x)):p.isMeshMatcapMaterial?(r(g,p),E(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),M(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?l(g,p,T,y):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,t(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===Ft&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,t(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===Ft&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,t(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,t(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let T=e.get(p),y=T.envMap,x=T.envMapRotation;y&&(g.envMap.value=y,Di.copy(x),Di.x*=-1,Di.y*=-1,Di.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Di.y*=-1,Di.z*=-1),g.envMapRotation.value.setFromMatrix4(km.makeRotationFromEuler(Di)),g.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,T,y){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*T,g.scale.value=y*.5,p.map&&(g.map.value=p.map,t(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function d(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function f(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function u(g,p,T){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ft&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=T.texture,g.transmissionSamplerSize.value.set(T.width,T.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,g.specularIntensityMapTransform))}function E(g,p){p.matcap&&(g.matcap.value=p.matcap)}function M(g,p){let T=e.get(p).light;g.referencePosition.value.setFromMatrixPosition(T.matrixWorld),g.nearDistance.value=T.shadow.camera.near,g.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function zm(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(T,y){let x=y.program;i.uniformBlockBinding(T,x)}function c(T,y){let x=s[T.id];x===void 0&&(E(T),x=h(T),s[T.id]=x,T.addEventListener("dispose",g));let S=y.program;i.updateUBOMapping(T,S);let b=e.render.frame;r[T.id]!==b&&(f(T),r[T.id]=b)}function h(T){let y=d();T.__bindingPointIndex=y;let x=n.createBuffer(),S=T.__size,b=T.usage;return n.bindBuffer(n.UNIFORM_BUFFER,x),n.bufferData(n.UNIFORM_BUFFER,S,b),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,y,x),x}function d(){for(let T=0;T<a;T++)if(o.indexOf(T)===-1)return o.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(T){let y=s[T.id],x=T.uniforms,S=T.__cache;n.bindBuffer(n.UNIFORM_BUFFER,y);for(let b=0,C=x.length;b<C;b++){let H=Array.isArray(x[b])?x[b]:[x[b]];for(let _=0,w=H.length;_<w;_++){let P=H[_];if(u(P,b,_,S)===!0){let I=P.__offset,B=Array.isArray(P.value)?P.value:[P.value],F=0;for(let W=0;W<B.length;W++){let Y=B[W],Q=M(Y);typeof Y=="number"||typeof Y=="boolean"?(P.__data[0]=Y,n.bufferSubData(n.UNIFORM_BUFFER,I+F,P.__data)):Y.isMatrix3?(P.__data[0]=Y.elements[0],P.__data[1]=Y.elements[1],P.__data[2]=Y.elements[2],P.__data[3]=0,P.__data[4]=Y.elements[3],P.__data[5]=Y.elements[4],P.__data[6]=Y.elements[5],P.__data[7]=0,P.__data[8]=Y.elements[6],P.__data[9]=Y.elements[7],P.__data[10]=Y.elements[8],P.__data[11]=0):(Y.toArray(P.__data,F),F+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,I,P.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function u(T,y,x,S){let b=T.value,C=y+"_"+x;if(S[C]===void 0)return typeof b=="number"||typeof b=="boolean"?S[C]=b:S[C]=b.clone(),!0;{let H=S[C];if(typeof b=="number"||typeof b=="boolean"){if(H!==b)return S[C]=b,!0}else if(H.equals(b)===!1)return H.copy(b),!0}return!1}function E(T){let y=T.uniforms,x=0,S=16;for(let C=0,H=y.length;C<H;C++){let _=Array.isArray(y[C])?y[C]:[y[C]];for(let w=0,P=_.length;w<P;w++){let I=_[w],B=Array.isArray(I.value)?I.value:[I.value];for(let F=0,W=B.length;F<W;F++){let Y=B[F],Q=M(Y),N=x%S,ee=N%Q.boundary,$=N+ee;x+=ee,$!==0&&S-$<Q.storage&&(x+=S-$),I.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=x,x+=Q.storage}}}let b=x%S;return b>0&&(x+=S-b),T.__size=x,T.__cache={},this}function M(T){let y={boundary:0,storage:0};return typeof T=="number"||typeof T=="boolean"?(y.boundary=4,y.storage=4):T.isVector2?(y.boundary=8,y.storage=8):T.isVector3||T.isColor?(y.boundary=16,y.storage=12):T.isVector4?(y.boundary=16,y.storage=16):T.isMatrix3?(y.boundary=48,y.storage=48):T.isMatrix4?(y.boundary=64,y.storage=64):T.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",T),y}function g(T){let y=T.target;y.removeEventListener("dispose",g);let x=o.indexOf(y.__bindingPointIndex);o.splice(x,1),n.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function p(){for(let T in s)n.deleteBuffer(s[T]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var ya=class{constructor(e={}){let{canvas:t=xh(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:f=!1}=e;this.isWebGLRenderer=!0;let u;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=i.getContextAttributes().alpha}else u=o;let E=new Uint32Array(4),M=new Int32Array(4),g=null,p=null,T=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Vn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let x=this,S=!1;this._outputColorSpace=xt;let b=0,C=0,H=null,_=-1,w=null,P=new ft,I=new ft,B=null,F=new Ie(0),W=0,Y=t.width,Q=t.height,N=1,ee=null,$=null,fe=new ft(0,0,Y,Q),be=new ft(0,0,Y,Q),Re=!1,K=new is,ae=!1,Ee=!1,me=new pt,le=new pt,He=new L,ne=new ft,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},pe=!1;function xe(){return H===null?N:1}let G=i;function he(R,X){return t.getContext(R,X)}try{let R={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"175"}`),t.addEventListener("webglcontextlost",Z,!1),t.addEventListener("webglcontextrestored",ue,!1),t.addEventListener("webglcontextcreationerror",ye,!1),G===null){let X="webgl2";if(G=he(X,R),G===null)throw he(X)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(R){throw console.error("THREE.WebGLRenderer: "+R.message),R}let k,Be,we,Ye,Ue,D,v,V,se,ce,oe,ze,Pe,Ae,Qe,Te,ke,qe,Ke,Fe,Ce,ve,We,U;function Me(){k=new o0(G),k.init(),ve=new Um(G,k),Be=new jp(G,k,e,ve),we=new Gm(G,k),Be.reverseDepthBuffer&&f&&we.buffers.depth.setReversed(!0),Ye=new c0(G),Ue=new Tm,D=new Bm(G,k,we,Ue,Be,ve,Ye),v=new t0(x),V=new r0(x),se=new pu(G),We=new $p(G,se),ce=new a0(G,se,Ye,We),oe=new d0(G,ce,se,Ye),Ke=new h0(G,Be,D),Te=new e0(Ue),ze=new wm(x,v,V,k,Be,We,Te),Pe=new Om(x,Ue),Ae=new vm,Qe=new Hm(k),qe=new Kp(x,v,V,we,oe,u,l),ke=new Dm(x,oe,Be),U=new zm(G,Ye,Be,we),Fe=new Qp(G,k,Ye),Ce=new l0(G,k,Ye),Ye.programs=ze.programs,x.capabilities=Be,x.extensions=k,x.properties=Ue,x.renderLists=Ae,x.shadowMap=ke,x.state=we,x.info=Ye}Me();let q=new ec(x,G);this.xr=q,this.getContext=function(){return G},this.getContextAttributes=function(){return G.getContextAttributes()},this.forceContextLoss=function(){let R=k.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){let R=k.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return N},this.setPixelRatio=function(R){R!==void 0&&(N=R,this.setSize(Y,Q,!1))},this.getSize=function(R){return R.set(Y,Q)},this.setSize=function(R,X,j=!0){if(q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=R,Q=X,t.width=Math.floor(R*N),t.height=Math.floor(X*N),j===!0&&(t.style.width=R+"px",t.style.height=X+"px"),this.setViewport(0,0,R,X)},this.getDrawingBufferSize=function(R){return R.set(Y*N,Q*N).floor()},this.setDrawingBufferSize=function(R,X,j){Y=R,Q=X,N=j,t.width=Math.floor(R*j),t.height=Math.floor(X*j),this.setViewport(0,0,R,X)},this.getCurrentViewport=function(R){return R.copy(P)},this.getViewport=function(R){return R.copy(fe)},this.setViewport=function(R,X,j,J){R.isVector4?fe.set(R.x,R.y,R.z,R.w):fe.set(R,X,j,J),we.viewport(P.copy(fe).multiplyScalar(N).round())},this.getScissor=function(R){return R.copy(be)},this.setScissor=function(R,X,j,J){R.isVector4?be.set(R.x,R.y,R.z,R.w):be.set(R,X,j,J),we.scissor(I.copy(be).multiplyScalar(N).round())},this.getScissorTest=function(){return Re},this.setScissorTest=function(R){we.setScissorTest(Re=R)},this.setOpaqueSort=function(R){ee=R},this.setTransparentSort=function(R){$=R},this.getClearColor=function(R){return R.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor(...arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha(...arguments)},this.clear=function(R=!0,X=!0,j=!0){let J=0;if(R){let O=!1;if(H!==null){let de=H.texture.format;O=de===Oo||de===ko||de===No}if(O){let de=H.texture.type,De=de===Sn||de===ui||de===hs||de===ds||de===Uo||de===Fo,Oe=qe.getClearColor(),Ve=qe.getClearAlpha(),tt=Oe.r,je=Oe.g,Ze=Oe.b;De?(E[0]=tt,E[1]=je,E[2]=Ze,E[3]=Ve,G.clearBufferuiv(G.COLOR,0,E)):(M[0]=tt,M[1]=je,M[2]=Ze,M[3]=Ve,G.clearBufferiv(G.COLOR,0,M))}else J|=G.COLOR_BUFFER_BIT}X&&(J|=G.DEPTH_BUFFER_BIT),j&&(J|=G.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G.clear(J)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",Z,!1),t.removeEventListener("webglcontextrestored",ue,!1),t.removeEventListener("webglcontextcreationerror",ye,!1),qe.dispose(),Ae.dispose(),Qe.dispose(),Ue.dispose(),v.dispose(),V.dispose(),oe.dispose(),We.dispose(),U.dispose(),ze.dispose(),q.dispose(),q.removeEventListener("sessionstart",qn),q.removeEventListener("sessionend",xs),xn.stop()};function Z(R){R.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),S=!0}function ue(){console.log("THREE.WebGLRenderer: Context Restored."),S=!1;let R=Ye.autoReset,X=ke.enabled,j=ke.autoUpdate,J=ke.needsUpdate,O=ke.type;Me(),Ye.autoReset=R,ke.enabled=X,ke.autoUpdate=j,ke.needsUpdate=J,ke.type=O}function ye(R){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function Ge(R){let X=R.target;X.removeEventListener("dispose",Ge),nt(X)}function nt(R){at(R),Ue.remove(R)}function at(R){let X=Ue.get(R).programs;X!==void 0&&(X.forEach(function(j){ze.releaseProgram(j)}),R.isShaderMaterial&&ze.releaseShaderCache(R))}this.renderBufferDirect=function(R,X,j,J,O,de){X===null&&(X=ge);let De=O.isMesh&&O.matrixWorld.determinant()<0,Oe=Pn(R,X,j,J,O);we.setMaterial(J,De);let Ve=j.index,tt=1;if(J.wireframe===!0){if(Ve=ce.getWireframeAttribute(j),Ve===void 0)return;tt=2}let je=j.drawRange,Ze=j.attributes.position,ht=je.start*tt,mt=(je.start+je.count)*tt;de!==null&&(ht=Math.max(ht,de.start*tt),mt=Math.min(mt,(de.start+de.count)*tt)),Ve!==null?(ht=Math.max(ht,0),mt=Math.min(mt,Ve.count)):Ze!=null&&(ht=Math.max(ht,0),mt=Math.min(mt,Ze.count));let At=mt-ht;if(At<0||At===1/0)return;We.setup(O,J,Oe,j,Ve);let Tt,ut=Fe;if(Ve!==null&&(Tt=se.get(Ve),ut=Ce,ut.setIndex(Tt)),O.isMesh)J.wireframe===!0?(we.setLineWidth(J.wireframeLinewidth*xe()),ut.setMode(G.LINES)):ut.setMode(G.TRIANGLES);else if(O.isLine){let Je=J.linewidth;Je===void 0&&(Je=1),we.setLineWidth(Je*xe()),O.isLineSegments?ut.setMode(G.LINES):O.isLineLoop?ut.setMode(G.LINE_LOOP):ut.setMode(G.LINE_STRIP)}else O.isPoints?ut.setMode(G.POINTS):O.isSprite&&ut.setMode(G.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)fr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ut.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(k.get("WEBGL_multi_draw"))ut.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Je=O._multiDrawStarts,Gt=O._multiDrawCounts,Et=O._multiDrawCount,pn=Ve?se.get(Ve).bytesPerElement:1,Fi=Ue.get(J).currentProgram.getUniforms();for(let $t=0;$t<Et;$t++)Fi.setValue(G,"_gl_DrawID",$t),ut.render(Je[$t]/pn,Gt[$t])}else if(O.isInstancedMesh)ut.renderInstances(ht,At,O.count);else if(j.isInstancedBufferGeometry){let Je=j._maxInstanceCount!==void 0?j._maxInstanceCount:1/0,Gt=Math.min(j.instanceCount,Je);ut.renderInstances(ht,At,Gt)}else ut.render(ht,At)};function et(R,X,j){R.transparent===!0&&R.side===ct&&R.forceSinglePass===!1?(R.side=Ft,R.needsUpdate=!0,fn(R,X,j),R.side=Fn,R.needsUpdate=!0,fn(R,X,j),R.side=ct):fn(R,X,j)}this.compile=function(R,X,j=null){j===null&&(j=R),p=Qe.get(j),p.init(X),y.push(p),j.traverseVisible(function(O){O.isLight&&O.layers.test(X.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),R!==j&&R.traverseVisible(function(O){O.isLight&&O.layers.test(X.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let J=new Set;return R.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let de=O.material;if(de)if(Array.isArray(de))for(let De=0;De<de.length;De++){let Oe=de[De];et(Oe,j,O),J.add(Oe)}else et(de,j,O),J.add(de)}),p=y.pop(),J},this.compileAsync=function(R,X,j=null){let J=this.compile(R,X,j);return new Promise(O=>{function de(){if(J.forEach(function(De){Ue.get(De).currentProgram.isReady()&&J.delete(De)}),J.size===0){O(R);return}setTimeout(de,10)}k.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let Dt=null;function sn(R){Dt&&Dt(R)}function qn(){xn.stop()}function xs(){xn.start()}let xn=new Jh;xn.setAnimationLoop(sn),typeof self<"u"&&xn.setContext(self),this.setAnimationLoop=function(R){Dt=R,q.setAnimationLoop(R),R===null?xn.stop():xn.start()},q.addEventListener("sessionstart",qn),q.addEventListener("sessionend",xs),this.render=function(R,X){if(X!==void 0&&X.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(S===!0)return;if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),X.parent===null&&X.matrixWorldAutoUpdate===!0&&X.updateMatrixWorld(),q.enabled===!0&&q.isPresenting===!0&&(q.cameraAutoUpdate===!0&&q.updateCamera(X),X=q.getCamera()),R.isScene===!0&&R.onBeforeRender(x,R,X,H),p=Qe.get(R,y.length),p.init(X),y.push(p),le.multiplyMatrices(X.projectionMatrix,X.matrixWorldInverse),K.setFromProjectionMatrix(le),Ee=this.localClippingEnabled,ae=Te.init(this.clippingPlanes,Ee),g=Ae.get(R,T.length),g.init(),T.push(g),q.enabled===!0&&q.isPresenting===!0){let de=x.xr.getDepthSensingMesh();de!==null&&Hn(de,X,-1/0,x.sortObjects)}Hn(R,X,0,x.sortObjects),g.finish(),x.sortObjects===!0&&g.sort(ee,$),pe=q.enabled===!1||q.isPresenting===!1||q.hasDepthSensing()===!1,pe&&qe.addToRenderList(g,R),this.info.render.frame++,ae===!0&&Te.beginShadows();let j=p.state.shadowsArray;ke.render(j,R,X),ae===!0&&Te.endShadows(),this.info.autoReset===!0&&this.info.reset();let J=g.opaque,O=g.transmissive;if(p.setupLights(),X.isArrayCamera){let de=X.cameras;if(O.length>0)for(let De=0,Oe=de.length;De<Oe;De++){let Ve=de[De];Zn(J,O,R,Ve)}pe&&qe.render(R);for(let De=0,Oe=de.length;De<Oe;De++){let Ve=de[De];ws(g,R,Ve,Ve.viewport)}}else O.length>0&&Zn(J,O,R,X),pe&&qe.render(R),ws(g,R,X);H!==null&&C===0&&(D.updateMultisampleRenderTarget(H),D.updateRenderTargetMipmap(H)),R.isScene===!0&&R.onAfterRender(x,R,X),We.resetDefaultState(),_=-1,w=null,y.pop(),y.length>0?(p=y[y.length-1],ae===!0&&Te.setGlobalState(x.clippingPlanes,p.state.camera)):p=null,T.pop(),T.length>0?g=T[T.length-1]:g=null};function Hn(R,X,j,J){if(R.visible===!1)return;if(R.layers.test(X.layers)){if(R.isGroup)j=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(X);else if(R.isLight)p.pushLight(R),R.castShadow&&p.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||K.intersectsSprite(R)){J&&ne.setFromMatrixPosition(R.matrixWorld).applyMatrix4(le);let De=oe.update(R),Oe=R.material;Oe.visible&&g.push(R,De,Oe,j,ne.z,null)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||K.intersectsObject(R))){let De=oe.update(R),Oe=R.material;if(J&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),ne.copy(R.boundingSphere.center)):(De.boundingSphere===null&&De.computeBoundingSphere(),ne.copy(De.boundingSphere.center)),ne.applyMatrix4(R.matrixWorld).applyMatrix4(le)),Array.isArray(Oe)){let Ve=De.groups;for(let tt=0,je=Ve.length;tt<je;tt++){let Ze=Ve[tt],ht=Oe[Ze.materialIndex];ht&&ht.visible&&g.push(R,De,ht,j,ne.z,Ze)}}else Oe.visible&&g.push(R,De,Oe,j,ne.z,null)}}let de=R.children;for(let De=0,Oe=de.length;De<Oe;De++)Hn(de[De],X,j,J)}function ws(R,X,j,J){let O=R.opaque,de=R.transmissive,De=R.transparent;p.setupLightsView(j),ae===!0&&Te.setGlobalState(x.clippingPlanes,j),J&&we.viewport(P.copy(J)),O.length>0&&Jn(O,X,j),de.length>0&&Jn(de,X,j),De.length>0&&Jn(De,X,j),we.buffers.depth.setTest(!0),we.buffers.depth.setMask(!0),we.buffers.color.setMask(!0),we.setPolygonOffset(!1)}function Zn(R,X,j,J){if((j.isScene===!0?j.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[J.id]===void 0&&(p.state.transmissionRenderTarget[J.id]=new hn(1,1,{generateMipmaps:!0,type:k.has("EXT_color_buffer_half_float")||k.has("EXT_color_buffer_float")?fi:Sn,minFilter:di,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:dt.workingColorSpace}));let de=p.state.transmissionRenderTarget[J.id],De=J.viewport||P;de.setSize(De.z*x.transmissionResolutionScale,De.w*x.transmissionResolutionScale);let Oe=x.getRenderTarget();x.setRenderTarget(de),x.getClearColor(F),W=x.getClearAlpha(),W<1&&x.setClearColor(16777215,.5),x.clear(),pe&&qe.render(j);let Ve=x.toneMapping;x.toneMapping=Vn;let tt=J.viewport;if(J.viewport!==void 0&&(J.viewport=void 0),p.setupLightsView(J),ae===!0&&Te.setGlobalState(x.clippingPlanes,J),Jn(R,j,J),D.updateMultisampleRenderTarget(de),D.updateRenderTargetMipmap(de),k.has("WEBGL_multisampled_render_to_texture")===!1){let je=!1;for(let Ze=0,ht=X.length;Ze<ht;Ze++){let mt=X[Ze],At=mt.object,Tt=mt.geometry,ut=mt.material,Je=mt.group;if(ut.side===ct&&At.layers.test(J.layers)){let Gt=ut.side;ut.side=Ft,ut.needsUpdate=!0,Ui(At,j,J,Tt,ut,Je),ut.side=Gt,ut.needsUpdate=!0,je=!0}}je===!0&&(D.updateMultisampleRenderTarget(de),D.updateRenderTargetMipmap(de))}x.setRenderTarget(Oe),x.setClearColor(F,W),tt!==void 0&&(J.viewport=tt),x.toneMapping=Ve}function Jn(R,X,j){let J=X.isScene===!0?X.overrideMaterial:null;for(let O=0,de=R.length;O<de;O++){let De=R[O],Oe=De.object,Ve=De.geometry,tt=De.group,je=De.material;je.allowOverride===!0&&J!==null&&(je=J),Oe.layers.test(j.layers)&&Ui(Oe,X,j,Ve,je,tt)}}function Ui(R,X,j,J,O,de){R.onBeforeRender(x,X,j,J,O,de),R.modelViewMatrix.multiplyMatrices(j.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),O.onBeforeRender(x,X,j,J,R,de),O.transparent===!0&&O.side===ct&&O.forceSinglePass===!1?(O.side=Ft,O.needsUpdate=!0,x.renderBufferDirect(j,X,J,O,R,de),O.side=Fn,O.needsUpdate=!0,x.renderBufferDirect(j,X,J,O,R,de),O.side=ct):x.renderBufferDirect(j,X,J,O,R,de),R.onAfterRender(x,X,j,J,O,de)}function fn(R,X,j){X.isScene!==!0&&(X=ge);let J=Ue.get(R),O=p.state.lights,de=p.state.shadowsArray,De=O.state.version,Oe=ze.getParameters(R,O.state,de,X,j),Ve=ze.getProgramCacheKey(Oe),tt=J.programs;J.environment=R.isMeshStandardMaterial?X.environment:null,J.fog=X.fog,J.envMap=(R.isMeshStandardMaterial?V:v).get(R.envMap||J.environment),J.envMapRotation=J.environment!==null&&R.envMap===null?X.environmentRotation:R.envMapRotation,tt===void 0&&(R.addEventListener("dispose",Ge),tt=new Map,J.programs=tt);let je=tt.get(Ve);if(je!==void 0){if(J.currentProgram===je&&J.lightsStateVersion===De)return _s(R,Oe),je}else Oe.uniforms=ze.getUniforms(R),R.onBeforeCompile(Oe,x),je=ze.acquireProgram(Oe,Ve),tt.set(Ve,je),J.uniforms=Oe.uniforms;let Ze=J.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(Ze.clippingPlanes=Te.uniform),_s(R,Oe),J.needsLights=wr(R),J.lightsStateVersion=De,J.needsLights&&(Ze.ambientLightColor.value=O.state.ambient,Ze.lightProbe.value=O.state.probe,Ze.directionalLights.value=O.state.directional,Ze.directionalLightShadows.value=O.state.directionalShadow,Ze.spotLights.value=O.state.spot,Ze.spotLightShadows.value=O.state.spotShadow,Ze.rectAreaLights.value=O.state.rectArea,Ze.ltc_1.value=O.state.rectAreaLTC1,Ze.ltc_2.value=O.state.rectAreaLTC2,Ze.pointLights.value=O.state.point,Ze.pointLightShadows.value=O.state.pointShadow,Ze.hemisphereLights.value=O.state.hemi,Ze.directionalShadowMap.value=O.state.directionalShadowMap,Ze.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ze.spotShadowMap.value=O.state.spotShadowMap,Ze.spotLightMatrix.value=O.state.spotLightMatrix,Ze.spotLightMap.value=O.state.spotLightMap,Ze.pointShadowMap.value=O.state.pointShadowMap,Ze.pointShadowMatrix.value=O.state.pointShadowMatrix),J.currentProgram=je,J.uniformsList=null,je}function Ts(R){if(R.uniformsList===null){let X=R.currentProgram.getUniforms();R.uniformsList=ms.seqWithValue(X.seq,R.uniforms)}return R.uniformsList}function _s(R,X){let j=Ue.get(R);j.outputColorSpace=X.outputColorSpace,j.batching=X.batching,j.batchingColor=X.batchingColor,j.instancing=X.instancing,j.instancingColor=X.instancingColor,j.instancingMorph=X.instancingMorph,j.skinning=X.skinning,j.morphTargets=X.morphTargets,j.morphNormals=X.morphNormals,j.morphColors=X.morphColors,j.morphTargetsCount=X.morphTargetsCount,j.numClippingPlanes=X.numClippingPlanes,j.numIntersection=X.numClipIntersection,j.vertexAlphas=X.vertexAlphas,j.vertexTangents=X.vertexTangents,j.toneMapping=X.toneMapping}function Pn(R,X,j,J,O){X.isScene!==!0&&(X=ge),D.resetTextureUnits();let de=X.fog,De=J.isMeshStandardMaterial?X.environment:null,Oe=H===null?x.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:_i,Ve=(J.isMeshStandardMaterial?V:v).get(J.envMap||De),tt=J.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,je=!!j.attributes.tangent&&(!!J.normalMap||J.anisotropy>0),Ze=!!j.morphAttributes.position,ht=!!j.morphAttributes.normal,mt=!!j.morphAttributes.color,At=Vn;J.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&(At=x.toneMapping);let Tt=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,ut=Tt!==void 0?Tt.length:0,Je=Ue.get(J),Gt=p.state.lights;if(ae===!0&&(Ee===!0||R!==w)){let Vt=R===w&&J.id===_;Te.setState(J,R,Vt)}let Et=!1;J.version===Je.__version?(Je.needsLights&&Je.lightsStateVersion!==Gt.state.version||Je.outputColorSpace!==Oe||O.isBatchedMesh&&Je.batching===!1||!O.isBatchedMesh&&Je.batching===!0||O.isBatchedMesh&&Je.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Je.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Je.instancing===!1||!O.isInstancedMesh&&Je.instancing===!0||O.isSkinnedMesh&&Je.skinning===!1||!O.isSkinnedMesh&&Je.skinning===!0||O.isInstancedMesh&&Je.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Je.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Je.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Je.instancingMorph===!1&&O.morphTexture!==null||Je.envMap!==Ve||J.fog===!0&&Je.fog!==de||Je.numClippingPlanes!==void 0&&(Je.numClippingPlanes!==Te.numPlanes||Je.numIntersection!==Te.numIntersection)||Je.vertexAlphas!==tt||Je.vertexTangents!==je||Je.morphTargets!==Ze||Je.morphNormals!==ht||Je.morphColors!==mt||Je.toneMapping!==At||Je.morphTargetsCount!==ut)&&(Et=!0):(Et=!0,Je.__version=J.version);let pn=Je.currentProgram;Et===!0&&(pn=fn(J,X,O));let Fi=!1,$t=!1,vs=!1,wt=pn.getUniforms(),rn=Je.uniforms;if(we.useProgram(pn.program)&&(Fi=!0,$t=!0,vs=!0),J.id!==_&&(_=J.id,$t=!0),Fi||w!==R){we.buffers.depth.getReversed()?(me.copy(R.projectionMatrix),Th(me),_h(me),wt.setValue(G,"projectionMatrix",me)):wt.setValue(G,"projectionMatrix",R.projectionMatrix),wt.setValue(G,"viewMatrix",R.matrixWorldInverse);let qt=wt.map.cameraPosition;qt!==void 0&&qt.setValue(G,He.setFromMatrixPosition(R.matrixWorld)),Be.logarithmicDepthBuffer&&wt.setValue(G,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(J.isMeshPhongMaterial||J.isMeshToonMaterial||J.isMeshLambertMaterial||J.isMeshBasicMaterial||J.isMeshStandardMaterial||J.isShaderMaterial)&&wt.setValue(G,"isOrthographic",R.isOrthographicCamera===!0),w!==R&&(w=R,$t=!0,vs=!0)}if(O.isSkinnedMesh){wt.setOptional(G,O,"bindMatrix"),wt.setOptional(G,O,"bindMatrixInverse");let Vt=O.skeleton;Vt&&(Vt.boneTexture===null&&Vt.computeBoneTexture(),wt.setValue(G,"boneTexture",Vt.boneTexture,D))}O.isBatchedMesh&&(wt.setOptional(G,O,"batchingTexture"),wt.setValue(G,"batchingTexture",O._matricesTexture,D),wt.setOptional(G,O,"batchingIdTexture"),wt.setValue(G,"batchingIdTexture",O._indirectTexture,D),wt.setOptional(G,O,"batchingColorTexture"),O._colorsTexture!==null&&wt.setValue(G,"batchingColorTexture",O._colorsTexture,D));let on=j.morphAttributes;if((on.position!==void 0||on.normal!==void 0||on.color!==void 0)&&Ke.update(O,j,pn),($t||Je.receiveShadow!==O.receiveShadow)&&(Je.receiveShadow=O.receiveShadow,wt.setValue(G,"receiveShadow",O.receiveShadow)),J.isMeshGouraudMaterial&&J.envMap!==null&&(rn.envMap.value=Ve,rn.flipEnvMap.value=Ve.isCubeTexture&&Ve.isRenderTargetTexture===!1?-1:1),J.isMeshStandardMaterial&&J.envMap===null&&X.environment!==null&&(rn.envMapIntensity.value=X.environmentIntensity),$t&&(wt.setValue(G,"toneMappingExposure",x.toneMappingExposure),Je.needsLights&&xr(rn,vs),de&&J.fog===!0&&Pe.refreshFogUniforms(rn,de),Pe.refreshMaterialUniforms(rn,J,N,Q,p.state.transmissionRenderTarget[R.id]),ms.upload(G,Ts(Je),rn,D)),J.isShaderMaterial&&J.uniformsNeedUpdate===!0&&(ms.upload(G,Ts(Je),rn,D),J.uniformsNeedUpdate=!1),J.isSpriteMaterial&&wt.setValue(G,"center",O.center),wt.setValue(G,"modelViewMatrix",O.modelViewMatrix),wt.setValue(G,"normalMatrix",O.normalMatrix),wt.setValue(G,"modelMatrix",O.matrixWorld),J.isShaderMaterial||J.isRawShaderMaterial){let Vt=J.uniformsGroups;for(let qt=0,Ca=Vt.length;qt<Ca;qt++){let mi=Vt[qt];U.update(mi,pn),U.bind(mi,pn)}}return pn}function xr(R,X){R.ambientLightColor.needsUpdate=X,R.lightProbe.needsUpdate=X,R.directionalLights.needsUpdate=X,R.directionalLightShadows.needsUpdate=X,R.pointLights.needsUpdate=X,R.pointLightShadows.needsUpdate=X,R.spotLights.needsUpdate=X,R.spotLightShadows.needsUpdate=X,R.rectAreaLights.needsUpdate=X,R.hemisphereLights.needsUpdate=X}function wr(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return b},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return H},this.setRenderTargetTextures=function(R,X,j){let J=Ue.get(R);J.__autoAllocateDepthBuffer=R.resolveDepthBuffer===!1,J.__autoAllocateDepthBuffer===!1&&(J.__useRenderToTexture=!1),Ue.get(R.texture).__webglTexture=X,Ue.get(R.depthTexture).__webglTexture=J.__autoAllocateDepthBuffer?void 0:j,J.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(R,X){let j=Ue.get(R);j.__webglFramebuffer=X,j.__useDefaultFramebuffer=X===void 0};let Aa=G.createFramebuffer();this.setRenderTarget=function(R,X=0,j=0){H=R,b=X,C=j;let J=!0,O=null,de=!1,De=!1;if(R){let Ve=Ue.get(R);if(Ve.__useDefaultFramebuffer!==void 0)we.bindFramebuffer(G.FRAMEBUFFER,null),J=!1;else if(Ve.__webglFramebuffer===void 0)D.setupRenderTarget(R);else if(Ve.__hasExternalTextures)D.rebindTextures(R,Ue.get(R.texture).__webglTexture,Ue.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){let Ze=R.depthTexture;if(Ve.__boundDepthTexture!==Ze){if(Ze!==null&&Ue.has(Ze)&&(R.width!==Ze.image.width||R.height!==Ze.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");D.setupDepthRenderbuffer(R)}}let tt=R.texture;(tt.isData3DTexture||tt.isDataArrayTexture||tt.isCompressedArrayTexture)&&(De=!0);let je=Ue.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray(je[X])?O=je[X][j]:O=je[X],de=!0):R.samples>0&&D.useMultisampledRTT(R)===!1?O=Ue.get(R).__webglMultisampledFramebuffer:Array.isArray(je)?O=je[j]:O=je,P.copy(R.viewport),I.copy(R.scissor),B=R.scissorTest}else P.copy(fe).multiplyScalar(N).floor(),I.copy(be).multiplyScalar(N).floor(),B=Re;if(j!==0&&(O=Aa),we.bindFramebuffer(G.FRAMEBUFFER,O)&&J&&we.drawBuffers(R,O),we.viewport(P),we.scissor(I),we.setScissorTest(B),de){let Ve=Ue.get(R.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_CUBE_MAP_POSITIVE_X+X,Ve.__webglTexture,j)}else if(De){let Ve=Ue.get(R.texture),tt=X;G.framebufferTextureLayer(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,Ve.__webglTexture,j,tt)}else if(R!==null&&j!==0){let Ve=Ue.get(R.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,Ve.__webglTexture,j)}_=-1},this.readRenderTargetPixels=function(R,X,j,J,O,de,De){if(!(R&&R.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Oe=Ue.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&De!==void 0&&(Oe=Oe[De]),Oe){we.bindFramebuffer(G.FRAMEBUFFER,Oe);try{let Ve=R.texture,tt=Ve.format,je=Ve.type;if(!Be.textureFormatReadable(tt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Be.textureTypeReadable(je)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}X>=0&&X<=R.width-J&&j>=0&&j<=R.height-O&&G.readPixels(X,j,J,O,ve.convert(tt),ve.convert(je),de)}finally{let Ve=H!==null?Ue.get(H).__webglFramebuffer:null;we.bindFramebuffer(G.FRAMEBUFFER,Ve)}}},this.readRenderTargetPixelsAsync=async function(R,X,j,J,O,de,De){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Oe=Ue.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&De!==void 0&&(Oe=Oe[De]),Oe)if(X>=0&&X<=R.width-J&&j>=0&&j<=R.height-O){we.bindFramebuffer(G.FRAMEBUFFER,Oe);let Ve=R.texture,tt=Ve.format,je=Ve.type;if(!Be.textureFormatReadable(tt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Be.textureTypeReadable(je))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ze=G.createBuffer();G.bindBuffer(G.PIXEL_PACK_BUFFER,Ze),G.bufferData(G.PIXEL_PACK_BUFFER,de.byteLength,G.STREAM_READ),G.readPixels(X,j,J,O,ve.convert(tt),ve.convert(je),0);let ht=H!==null?Ue.get(H).__webglFramebuffer:null;we.bindFramebuffer(G.FRAMEBUFFER,ht);let mt=G.fenceSync(G.SYNC_GPU_COMMANDS_COMPLETE,0);return G.flush(),await wh(G,mt,4),G.bindBuffer(G.PIXEL_PACK_BUFFER,Ze),G.getBufferSubData(G.PIXEL_PACK_BUFFER,0,de),G.deleteBuffer(Ze),G.deleteSync(mt),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(R,X=null,j=0){let J=Math.pow(2,-j),O=Math.floor(R.image.width*J),de=Math.floor(R.image.height*J),De=X!==null?X.x:0,Oe=X!==null?X.y:0;D.setTexture2D(R,0),G.copyTexSubImage2D(G.TEXTURE_2D,j,0,0,De,Oe,O,de),we.unbindTexture()};let Tr=G.createFramebuffer(),Kn=G.createFramebuffer();this.copyTextureToTexture=function(R,X,j=null,J=null,O=0,de=null){de===null&&(O!==0?(fr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),de=O,O=0):de=0);let De,Oe,Ve,tt,je,Ze,ht,mt,At,Tt=R.isCompressedTexture?R.mipmaps[de]:R.image;if(j!==null)De=j.max.x-j.min.x,Oe=j.max.y-j.min.y,Ve=j.isBox3?j.max.z-j.min.z:1,tt=j.min.x,je=j.min.y,Ze=j.isBox3?j.min.z:0;else{let on=Math.pow(2,-O);De=Math.floor(Tt.width*on),Oe=Math.floor(Tt.height*on),R.isDataArrayTexture?Ve=Tt.depth:R.isData3DTexture?Ve=Math.floor(Tt.depth*on):Ve=1,tt=0,je=0,Ze=0}J!==null?(ht=J.x,mt=J.y,At=J.z):(ht=0,mt=0,At=0);let ut=ve.convert(X.format),Je=ve.convert(X.type),Gt;X.isData3DTexture?(D.setTexture3D(X,0),Gt=G.TEXTURE_3D):X.isDataArrayTexture||X.isCompressedArrayTexture?(D.setTexture2DArray(X,0),Gt=G.TEXTURE_2D_ARRAY):(D.setTexture2D(X,0),Gt=G.TEXTURE_2D),G.pixelStorei(G.UNPACK_FLIP_Y_WEBGL,X.flipY),G.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,X.premultiplyAlpha),G.pixelStorei(G.UNPACK_ALIGNMENT,X.unpackAlignment);let Et=G.getParameter(G.UNPACK_ROW_LENGTH),pn=G.getParameter(G.UNPACK_IMAGE_HEIGHT),Fi=G.getParameter(G.UNPACK_SKIP_PIXELS),$t=G.getParameter(G.UNPACK_SKIP_ROWS),vs=G.getParameter(G.UNPACK_SKIP_IMAGES);G.pixelStorei(G.UNPACK_ROW_LENGTH,Tt.width),G.pixelStorei(G.UNPACK_IMAGE_HEIGHT,Tt.height),G.pixelStorei(G.UNPACK_SKIP_PIXELS,tt),G.pixelStorei(G.UNPACK_SKIP_ROWS,je),G.pixelStorei(G.UNPACK_SKIP_IMAGES,Ze);let wt=R.isDataArrayTexture||R.isData3DTexture,rn=X.isDataArrayTexture||X.isData3DTexture;if(R.isDepthTexture){let on=Ue.get(R),Vt=Ue.get(X),qt=Ue.get(on.__renderTarget),Ca=Ue.get(Vt.__renderTarget);we.bindFramebuffer(G.READ_FRAMEBUFFER,qt.__webglFramebuffer),we.bindFramebuffer(G.DRAW_FRAMEBUFFER,Ca.__webglFramebuffer);for(let mi=0;mi<Ve;mi++)wt&&(G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Ue.get(R).__webglTexture,O,Ze+mi),G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Ue.get(X).__webglTexture,de,At+mi)),G.blitFramebuffer(tt,je,De,Oe,ht,mt,De,Oe,G.DEPTH_BUFFER_BIT,G.NEAREST);we.bindFramebuffer(G.READ_FRAMEBUFFER,null),we.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else if(O!==0||R.isRenderTargetTexture||Ue.has(R)){let on=Ue.get(R),Vt=Ue.get(X);we.bindFramebuffer(G.READ_FRAMEBUFFER,Tr),we.bindFramebuffer(G.DRAW_FRAMEBUFFER,Kn);for(let qt=0;qt<Ve;qt++)wt?G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,on.__webglTexture,O,Ze+qt):G.framebufferTexture2D(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,on.__webglTexture,O),rn?G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Vt.__webglTexture,de,At+qt):G.framebufferTexture2D(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,Vt.__webglTexture,de),O!==0?G.blitFramebuffer(tt,je,De,Oe,ht,mt,De,Oe,G.COLOR_BUFFER_BIT,G.NEAREST):rn?G.copyTexSubImage3D(Gt,de,ht,mt,At+qt,tt,je,De,Oe):G.copyTexSubImage2D(Gt,de,ht,mt,tt,je,De,Oe);we.bindFramebuffer(G.READ_FRAMEBUFFER,null),we.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else rn?R.isDataTexture||R.isData3DTexture?G.texSubImage3D(Gt,de,ht,mt,At,De,Oe,Ve,ut,Je,Tt.data):X.isCompressedArrayTexture?G.compressedTexSubImage3D(Gt,de,ht,mt,At,De,Oe,Ve,ut,Tt.data):G.texSubImage3D(Gt,de,ht,mt,At,De,Oe,Ve,ut,Je,Tt):R.isDataTexture?G.texSubImage2D(G.TEXTURE_2D,de,ht,mt,De,Oe,ut,Je,Tt.data):R.isCompressedTexture?G.compressedTexSubImage2D(G.TEXTURE_2D,de,ht,mt,Tt.width,Tt.height,ut,Tt.data):G.texSubImage2D(G.TEXTURE_2D,de,ht,mt,De,Oe,ut,Je,Tt);G.pixelStorei(G.UNPACK_ROW_LENGTH,Et),G.pixelStorei(G.UNPACK_IMAGE_HEIGHT,pn),G.pixelStorei(G.UNPACK_SKIP_PIXELS,Fi),G.pixelStorei(G.UNPACK_SKIP_ROWS,$t),G.pixelStorei(G.UNPACK_SKIP_IMAGES,vs),de===0&&X.generateMipmaps&&G.generateMipmap(Gt),we.unbindTexture()},this.copyTextureToTexture3D=function(R,X,j=null,J=null,O=0){return fr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(R,X,j,J,O)},this.initRenderTarget=function(R){Ue.get(R).__webglFramebuffer===void 0&&D.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?D.setTextureCube(R,0):R.isData3DTexture?D.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?D.setTexture2DArray(R,0):D.setTexture2D(R,0),we.unbindTexture()},this.resetState=function(){b=0,C=0,H=null,we.reset(),We.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=dt._getDrawingBufferColorSpace(e),t.unpackColorSpace=dt._getUnpackColorSpace()}};var ed={punching:{rate:2.2,impact:.35},kicking:{rate:1.6,impact:.4}};function nc(n,e){let{rate:t,impact:i}=ed[e],s=(n*t%1+1)%1,r=s<i?1-Math.pow(1-s/i,3):Math.max(0,1-(s-i)/(1-i))**2,o=s>=i?Math.exp(-(s-i)*9):0;return{extend:r,recoil:o}}function ic(n,e,t){let i=new te;i.position.set(0,-.24,.05),n.add(i);let s=new te;s.position.set(0,-.24,.05),e.add(s);let r=new te;r.visible=!1;let o=new A({color:16317180,roughness:.65,side:ct}),a=new A({color:14427686,roughness:.55}),l=new m(new re(.18,.34,.44,18,1,!1,-Math.PI*.65,Math.PI*1.3),o);l.position.set(0,.36,.03),l.castShadow=!0,r.add(l);let c=new m(new Ne(.165,.025,8,20),a);c.rotation.x=Math.PI/2+.14,c.position.set(0,.57,.02),r.add(c),t.add(r);let h=new te;h.visible=!1;let d=new A({color:16708551,roughness:.88}),f=new A({color:165063,roughness:.72}),u=new m(new Ne(.142,.022,8,20),d);u.rotation.x=Math.PI/2+.22,u.position.set(0,.505,-.01),h.add(u);let E=new m(new re(.165,.255,.34,14,1,!1,-Math.PI*.45,Math.PI*.9),d);E.position.set(0,.35,.03),E.rotation.y=Math.PI*.02,h.add(E);for(let J of[-.095,.095]){let O=new m(new z(.072,.19,.014),d);O.position.set(J,.34,.145),O.rotation.x=-.16,O.rotation.z=J<0?.18:-.18,h.add(O);let de=new m(new z(.074,.024,.016),f);de.position.set(J*1.06,.245,.16),de.rotation.x=-.16,de.rotation.z=J<0?.18:-.18,h.add(de)}t.add(h);let M=new A({color:14870768,metalness:.9,roughness:.14}),g=new A({color:7877903,roughness:.52}),p=new A({color:16096779,metalness:.85,roughness:.22}),T=new A({color:14427686,roughness:.38}),y=new A({color:959977,roughness:.35}),x=new A({color:1976635,roughness:.45}),S={},b=new A({color:16317180,metalness:.72,roughness:.16,emissive:3359061,emissiveIntensity:.35}),C=new te,H=new te,_=new m(new z(.042,.32,.016),b);_.position.set(0,.16,0),H.add(_);let w=new m(new Ne(.048,.014,8,16),T);w.position.set(-.028,-.06,0),H.add(w),C.add(H);let P=new te,I=new m(new z(.042,.32,.016),b);I.position.set(0,.16,.008),P.add(I);let B=new m(new Ne(.048,.014,8,16),T);B.position.set(.028,-.06,.008),P.add(B),C.add(P);let F=new m(new re(.018,.018,.032,10),p);F.rotation.x=Math.PI/2,F.position.set(0,.02,.004),C.add(F),C.rotation.x=Math.PI*1.16,C.visible=!1,i.add(C),S.scissors=C;let W=()=>{let J=new te,O=new m(new z(.028,.22,.016),y);O.position.set(0,.1,0),J.add(O);for(let de=-3;de<=3;de++){let De=new m(new z(.042,.012,.012),y);De.position.set(.024,.1+de*.026,0),J.add(De)}return J},Y=W();Y.rotation.x=Math.PI*1.12,Y.visible=!1,i.add(Y),S.comb=Y;let Q=W();Q.rotation.x=Math.PI*1.12,Q.visible=!1,s.add(Q);let N=new te,ee=new m(new Ne(.055,.014,8,16),p);ee.position.y=.03,N.add(ee);let $=new m(new re(.014,.014,.22,8),p);$.position.y=.16,N.add($);let fe=new m(new z(.055,.045,.016),p);fe.position.set(.032,.24,0),N.add(fe),N.rotation.x=Math.PI*.35,N.visible=!1,i.add(N),S.key=N;let be=new te,Re=new m(new z(.11,.2,.018),x);Re.position.set(0,.08,.02),be.add(Re);let K=new _e({color:3718648}),ae=new m(new $e(.09,.16),K);ae.position.set(0,.08,.03),be.add(ae),be.visible=!1,i.add(be),S.phone=be;let Ee=new te,me=new m(new re(.018,.02,.28,10),g);me.position.y=.14,Ee.add(me);let le=new m(new re(.052,.052,.16,12),g);le.rotation.z=Math.PI/2,le.position.y=.26,Ee.add(le);let He=new m(new re(.055,.055,.03,12),p);He.rotation.z=Math.PI/2,He.position.y=.26,Ee.add(He),Ee.rotation.x=Math.PI*.42,Ee.visible=!1,i.add(Ee),S.gavel=Ee;let ne=new te,ge=new m(new re(.02,.016,.22,10),x);ge.position.y=.11,ne.add(ge);let pe=new m(new ie(.048,12,10),M);pe.position.y=.23,ne.add(pe),ne.rotation.x=Math.PI*.25,ne.visible=!1,i.add(ne),S.mic=ne;let xe=new te,G=new m(new re(.068,.048,.11,14),new A({color:14251782,roughness:.72}));G.position.y=.06,xe.add(G);let he=new m(new Mt(.058,12),new A({color:11817737,roughness:.25}));he.rotation.x=-Math.PI/2,he.position.y=.112,xe.add(he),xe.visible=!1,i.add(xe),S.teacup=xe;let k=new te,Be=new m(new re(.014,.014,.36,8),M);Be.position.y=.18,k.add(Be);let we=new m(new ie(.065,12,8,0,Math.PI*2,0,Math.PI*.55),M);we.rotation.x=Math.PI,we.position.set(0,.36,.03),k.add(we),k.rotation.x=Math.PI*.35,k.visible=!1,i.add(k),S.ladle=k;let Ye=new te,Ue=new m(new Ne(.08,.012,8,16,Math.PI*1.4),x);Ue.position.y=.12,Ye.add(Ue);let D=new m(new re(.045,.045,.025,12),M);D.rotation.x=Math.PI/2,D.position.set(0,.22,.03),Ye.add(D),Ye.visible=!1,i.add(Ye),S.stethoscope=Ye;let v=new te,V=new m(new re(.038,.038,.22,12),y);V.position.y=.14,v.add(V);let se=new m(new Xe(.012,.12,8),M);se.position.y=.31,v.add(se),v.rotation.x=Math.PI*.45,v.visible=!1,i.add(v),S.syringe=v;let ce=new te,oe=new m(new Xe(.085,.055,14),p);oe.rotation.x=Math.PI,oe.position.y=.04,ce.add(oe);let ze=new m(new Xe(.025,.08,10),new _e({color:16707722}));ze.position.y=.1,ce.add(ze),ce.visible=!1,i.add(ce),S.diya=ce;let Pe=new te,Ae=new m(new re(.018,.018,.46,10),p);Ae.rotation.z=Math.PI/2,Ae.position.set(.14,.04,.04),Pe.add(Ae),Pe.visible=!1,i.add(Pe),S.flute=Pe;let Qe=new te,Te=new m(new z(.18,.24,.045),T);Te.position.set(0,.1,.04),Qe.add(Te);let ke=new m(new z(.16,.22,.036),new A({color:16710888}));ke.position.set(.01,.1,.04),Qe.add(ke),Qe.visible=!1,i.add(Qe),S.book=Qe;let qe=new te,Ke=new m(new re(.018,.022,.56,10),g);Ke.position.y=.28,qe.add(Ke),qe.rotation.x=Math.PI*.25,qe.visible=!1,i.add(qe),S.baton=qe;let Fe=new te,Ce=new m(new re(.012,.012,.11,8),new A({color:16777215}));Ce.position.y=.06,Fe.add(Ce),Fe.rotation.x=Math.PI*.35,Fe.visible=!1,i.add(Fe),S.chalk=Fe;let ve=new te,We=new m(new re(.016,.016,.92,10),p);We.position.y=.36,ve.add(We);let U=new m(new Xe(.032,.16,8),p);U.position.y=.88,ve.add(U);for(let J of[-1,1]){let O=new m(new Xe(.022,.14,8),p);O.position.set(J*.065,.82,0),O.rotation.z=-J*.25,ve.add(O)}ve.visible=!1,i.add(ve),S.trishul=ve;let Me=new te,q=new m(new Ne(.32,.02,8,22,Math.PI),p);q.rotation.z=-Math.PI/2,q.position.set(0,.18,.05),Me.add(q),Me.visible=!1,i.add(Me),S.bow=Me;let Z=new te,ue=new m(new re(.02,.028,.56,10),p);ue.position.y=.24,Z.add(ue);let ye=new m(new ie(.115,14,12),p);ye.scale.set(1,1.18,1),ye.position.y=.56,Z.add(ye);let Ge=new m(new Ne(.112,.016,6,14),p);Ge.rotation.x=Math.PI/2,Ge.position.y=.56,Z.add(Ge),Z.rotation.x=Math.PI*.28,Z.visible=!1,i.add(Z),S.gada=Z;let nt=new te,at=new m(new z(.14,.08,.025),new A({color:2278750,roughness:.45}));at.position.set(0,.05,.04),nt.add(at),nt.visible=!1,i.add(nt),S.money=nt;let et=new te,Dt=new m(new re(.016,.016,.65,8),g);Dt.position.y=.22,et.add(Dt);let sn=new m(new Xe(.09,.22,10),new A({color:16638023,roughness:.9}));sn.position.y=-.14,et.add(sn),et.visible=!1,i.add(et),S.broom=et;let qn=new te,xs=new m(new re(.014,.014,.55,8),x);xs.position.y=.26,qn.add(xs);let xn=new m(new Xe(.32,.14,14),T);xn.position.y=.52,qn.add(xn),qn.visible=!1,i.add(qn),S.umbrella=qn;let Hn=new te,ws=new m(new re(.12,.09,.022,14),M);ws.position.y=.02,Hn.add(ws);for(let J of[-.04,.04,0]){let O=new m(new ie(.036,10,8),new A({color:16096779,roughness:.45}));O.position.set(J,.055,J===0?.035:-.02),Hn.add(O)}Hn.visible=!1,i.add(Hn),S.sweetplate=Hn;let Zn=new te,Jn=new m(new z(.11,.22,.02),d);Jn.position.set(.01,-.15,.015),Jn.rotation.x=.04,Zn.add(Jn);let Ui=new m(new z(.114,.035,.023),f);Ui.position.set(.01,-.23,.018),Ui.rotation.x=.04,Zn.add(Ui),Zn.visible=!1,i.add(Zn),S.towel=Zn;let fn=new te,Ts=new m(new re(.055,.068,.18,12),y);Ts.position.y=.09,fn.add(Ts);let _s=new m(new z(.09,.04,.035),b);_s.position.set(.025,.2,0),fn.add(_s),fn.rotation.x=Math.PI*.42,fn.visible=!1,i.add(fn),S.sprayBottle=fn;let Pn=new te,xr=new m(new re(.014,.018,.24,8),new A({color:1409085,roughness:.65}));xr.position.y=.08,Pn.add(xr);let wr=new A({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.28}),Aa=new A({color:16020150,emissive:14362487,emissiveIntensity:.25,roughness:.34});for(let J=0;J<8;J++){let O=J/8*Math.PI*2,de=new m(new Xe(.042,.13,6),J%2===0?Aa:wr);de.position.set(Math.cos(O)*.068,.22,Math.sin(O)*.068),de.rotation.z=-Math.cos(O)*.62,de.rotation.x=Math.sin(O)*.62,Pn.add(de)}let Tr=new m(new ie(.048,10,8),wr);Tr.position.y=.22,Pn.add(Tr),Pn.rotation.x=Math.PI*.18,Pn.visible=!1,i.add(Pn),S.lotus=Pn;let Kn=new te,R=new A({color:16498468,emissive:16096779,emissiveIntensity:.78,metalness:.85,roughness:.14}),X=new m(new Ne(.14,.022,8,22),R);X.position.y=.2,Kn.add(X);let j=new m(new Rt(.055,0),R);j.position.y=.2,Kn.add(j);for(let J=0;J<10;J++){let O=J/10*Math.PI*2,de=new m(new Xe(.022,.065,4),R);de.position.set(Math.cos(O)*.165,.2+Math.sin(O)*.165,0),de.rotation.z=O-Math.PI/2,Kn.add(de)}return Kn.visible=!1,i.add(Kn),S.chakra=Kn,{rightGroup:i,leftGroup:s,capeGroup:r,towelNeckGroup:h,rightMeshes:S,leftComb:Q,scissorUpper:H,scissorLower:P,phoneScreen:K,diyaFlame:ze}}function td(n,e,t,i){if(i||n==="BrainrotLog"||n==="CupDancer"||n==="CartoonTank"||n==="ComicBobble")return null;let s=(e||"").toLowerCase();return/narasimha|narsimha|narsingh|नरसिंह|नृसिंह/.test(s)?"narasimha":/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/.test(s)?"asuraKing":/hanuman|maruti|bajrang|pavanputra|हनुमान|मारुति|बजरंग/.test(s)?"hanuman":/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/.test(s)?"shiv":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/.test(s)?"krishna":/ram|raghav|raghunath|राम|राघव/.test(s)?"ram":/vishnu|hari|narayan|vasudev|विष्णु|हरि|नारायण|वासुदेव/.test(s)?"vishnu":n==="NobleWoman"?"devi":n==="ChildDevotee"?"prahladChild":n==="SageRishi"?"rishi":(t==="Temple"||t==="ForestAshram"||t==="RiverGhat"||t==="Himalaya"||t==="PalaceCourt"||t==="Cosmos")&&(n==="KingCrown"||n==="Divine"||n==="Warrior")?"genericSacred":null}function nd(n,e){switch(n){case"narasimha":return{skin:14261851,robe:14251782,sash:12131356,scale:1.18};case"asuraKing":return{skin:8867380,robe:8330525,sash:16096779,scale:1.07};case"hanuman":return{skin:14711612,robe:15357964,sash:16436245,scale:1.08};case"shiv":return{skin:13358561,robe:9584654,sash:16347926,scale:1.1};case"krishna":return{skin:6000370,robe:15381256,sash:14427686,scale:1.04};case"ram":return{skin:8234216,robe:14251782,sash:12131356,scale:1.05};case"vishnu":return{skin:6788331,robe:16096779,sash:14427686,scale:1.12};case"prahladChild":return{skin:15250056,robe:15357964,sash:16498468,scale:.78};case"rishi":return{skin:e.skin,robe:12735506,sash:16638082,scale:.98};default:return{skin:e.skin,robe:e.robe,sash:e.sash,scale:1}}}function id(n,e,t){let i=new A({color:t,roughness:.44,metalness:.04}),s=new A({color:15119740,roughness:.48}),r=new A({color:5972257,roughness:.35}),o=new A({color:8138002,roughness:.62}),a=new A({color:14251782,emissive:7877903,emissiveIntensity:.18,roughness:.52}),l=new A({color:16498468,emissive:11817737,emissiveIntensity:.25,roughness:.42}),c=new A({color:16776693,roughness:.18,metalness:.05}),h=new A({color:16236088,metalness:.88,roughness:.2}),d=new m(new ie(e*1.04,24,18),i);d.scale.set(1.06,1.04,1.04),d.castShadow=!0,n.add(d);for(let Q of[-1,1]){let N=new m(new ie(e*.42,12,10),s);N.scale.set(1.05,.82,.95),N.position.set(Q*e*.54,-e*.12,e*.68),n.add(N);let ee=new m(new Xe(e*.24,e*.44,8),i);ee.position.set(Q*e*.88,e*.72,-e*.04),ee.rotation.z=-Q*.48,ee.rotation.x=.12,n.add(ee)}let f=new m(new z(e*.52,e*.54,e*.62),s);f.position.set(0,-e*.04,e*.86),f.rotation.x=.22,n.add(f);for(let Q of[-1,1]){let N=new m(new ie(e*.27,14,10),s);N.scale.set(1.1,.78,1.15),N.position.set(Q*e*.24,-e*.25,e*1.08),n.add(N);for(let ee=0;ee<3;ee++){let $=new m(new re(.004,.0015,e*.65,4),c);$.rotation.z=Q*(Math.PI*.44+(ee-1)*.16),$.rotation.y=Q*-.22,$.position.set(Q*e*.58,-e*(.2+ee*.06),e*1.12),n.add($)}}let u=new m(new Xe(e*.22,e*.24,4),r);u.rotation.x=Math.PI*.52,u.rotation.z=Math.PI*.25,u.position.set(0,-e*.11,e*1.26),n.add(u);let E=-e*.46,M=new m(new ie(e*.34,14,10),new _e({color:7016218}));M.scale.set(1.05,.48,.85),M.position.set(0,E+e*.04,e*.96),n.add(M);let g=new m(new lt(e*.052,e*.42,4,8),s);g.rotation.z=Math.PI/2,g.position.set(0,E+e*.14,e*1.16),n.add(g);let p=new te;p.position.set(0,E+e*.02,e*.72),n.add(p);let T=new m(new ie(e*.32,14,10),s);T.scale.set(1.06,.65,1.18),T.position.set(0,-e*.14,e*.34),p.add(T);let y=new m(new lt(e*.052,e*.38,4,8),s);y.rotation.z=Math.PI/2,y.position.set(0,-e*.04,e*.46),p.add(y);for(let Q of[-1,1]){let N=new m(new Xe(e*.068,e*.3,8),c);N.rotation.x=Math.PI,N.position.set(Q*e*.24,E+e*.02,e*1.22),n.add(N);let ee=new m(new Xe(e*.056,e*.24,8),c);ee.position.set(Q*e*.2,e*.02,e*.48),p.add(ee)}let x=new A({color:16707722,emissive:16096779,emissiveIntensity:.72,roughness:.15}),S=new A({color:1705218,emissive:8133904,emissiveIntensity:.25,roughness:.1}),b=new A({color:t,roughness:.46}),C=new A({color:8138002,roughness:.55}),H=Q=>{let N=Q*e*.4,ee=e*.14,$=e*.92,fe=new m(new ie(e*.175,14,12),x);fe.scale.set(1.05,.92,.65),fe.position.set(N,ee,$),n.add(fe);let be=new m(new ie(e*.095,12,10),S);be.scale.set(.68,1.15,.7),be.position.set(N,ee,$+e*.125),n.add(be);let Re=new m(new ie(e*.185,12,10,0,Math.PI*2,0,Math.PI*.52),b);Re.scale.set(1.05,.95,.68),Re.position.set(N,ee,$),Re.rotation.x=-Math.PI*.56,n.add(Re);let K=new m(new lt(e*.06,e*.28,5,8),C);return K.rotation.z=Math.PI/2-Q*.38,K.position.set(N,ee+e*.24,$+e*.1),n.add(K),{sclera:fe,pupil:be,eyelid:Re,brow:K}},_=H(-1),w=H(1),P=new A({color:16776171,emissive:16639626,emissiveIntensity:.45}),I=new A({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let Q of[-1,1]){let N=new m(new z(e*.055,e*.44,e*.05),P);N.position.set(Q*e*.095,e*.48,e*.96),N.rotation.z=-Q*.1,n.add(N)}let B=new m(new z(e*.22,e*.07,e*.05),P);B.position.set(0,e*.27,e*.98),n.add(B);let F=new m(new lt(e*.032,e*.32,4,8),I);F.position.set(0,e*.48,e*.99),n.add(F);let W=new te;for(let Q=0;Q<2;Q++){let N=Q===0?16:14,ee=e*(Q===0?1.18:1.02),$=Q===0?-e*.08:-e*.34;for(let fe=0;fe<N;fe++){let be=fe/N*Math.PI*2;if(Math.sin(be)<-.78&&Math.abs(Math.cos(be))<.38&&Q===0)continue;let Re=(fe+Q)%3===0?l:fe%2===0?a:o,K=new m(new Xe(e*(Q===0?.32:.36),e*(Q===0?.88:1.04),7),Re);K.position.set(Math.cos(be)*ee,Math.sin(be)*ee*1.04,$),K.rotation.z=be-Math.PI/2,K.rotation.x=Q===0?-.18:-.35,K.castShadow=!0,W.add(K)}}let Y=new m(new ie(e*1.16,16,12),o);return Y.scale.set(1.22,1.26,.82),Y.position.set(0,-e*.12,-e*.48),W.add(Y),n.add(W),sc(n,e*.96,h,"narasimha"),{leftEye:_,rightEye:w,mouthCavity:M,upperLip:g,lowerLip:y,mouthBaseY:E,lowerJawPivot:p}}function sc(n,e,t,i){let s=new te;s.position.y=i==="narasimha"?e*.84:e*.86;let r=i==="asuraKing",o=r?new A({color:11817737,metalness:.88,roughness:.24}):t,a=new m(new re(e*.78,e*.86,e*.3,20),o);a.castShadow=!0,s.add(a);let l=r?7:5;for(let E=0;E<l;E++){let M=(E-(l-1)/2)/l*Math.PI*.85,g=r?e*(.45+E%2*.22):e*(.42-Math.abs(E-2)*.08),p=new m(new Xe(e*.13,g,8),t);p.position.set(Math.sin(M)*e*.76,e*.22,Math.cos(M)*e*.76),p.rotation.z=-Math.sin(M)*(r?.42:.16),s.add(p)}if(r){let E=new A({color:16096779,metalness:.9,roughness:.18});for(let M of[-1,1]){let g=new m(new Xe(e*.16,e*.92,10),E);g.position.set(M*e*.88,e*.48,0),g.rotation.z=-M*.62,g.rotation.x=-.18,s.add(g)}}let c=new m(new re(e*.46,e*.68,e*.34,16),o);c.position.y=e*.3,s.add(c);let h=new m(new Xe(e*.42,e*.56,16),t);h.position.y=e*.7,s.add(h);let d=new m(new ie(e*.11,10,8),t);d.position.y=e*1,s.add(d);let f=r?14427686:i==="narasimha"?16096779:i==="krishna"?1096065:2282478,u=new m(new Rt(e*.16,0),new A({color:f,emissive:f,emissiveIntensity:.65,metalness:.25,roughness:.1}));if(u.position.set(0,e*.06,e*.84),s.add(u),i==="krishna"){let E=new m(new re(.012,.012,e*1.1,6),t);E.position.set(e*.28,e*.85,e*.12),E.rotation.z=-.35,s.add(E);let M=new m(new ie(e*.2,12,10),new A({color:366185,emissive:959977,emissiveIntensity:.45}));M.scale.set(.85,1.3,.35),M.position.set(e*.46,e*1.32,e*.14),M.rotation.z=-.35,s.add(M)}n.add(s)}function sd(n,e,t,i){let s=new A({color:1315098,roughness:.68}),r=new A({color:16776171,roughness:.22}),o=new A({color:4528669,metalness:.65,roughness:.32});for(let h of[-1,1]){let d=new m(new Xe(t*.14,t*.36,8),o);d.position.set(h*t*1.02,t*.04,0),d.rotation.z=-h*.95,n.add(d)}for(let h of[-1,1]){let d=new m(new lt(t*.055,t*.26,4,8),s);d.rotation.z=Math.PI*.5+h*.38,d.position.set(h*t*.19,-t*.2,t*.94),n.add(d);let f=new m(new Xe(t*.045,t*.19,8),r);f.position.set(h*t*.24,-t*.29,t*.92),f.rotation.z=-h*.22,n.add(f)}let a=new m(new Xe(t*.28,t*.54,10),s);a.rotation.x=Math.PI,a.position.set(0,-t*.72,t*.58),n.add(a);let l=new m(new z(t*.42,t*.075,t*.04),new A({color:14427686,emissive:8330525,emissiveIntensity:.4}));l.position.set(0,t*.26,t*.95),n.add(l);for(let h of[-1,1]){let d=new m(new ie(.145,14,10,0,Math.PI*2,0,Math.PI*.58),i);d.scale.set(1.15,.82,1.05),d.position.set(h*.26,.57,.02),d.rotation.z=-h*.32,e.add(d)}let c=new m(new re(.275,.225,.34,16),o);c.position.set(0,.4,.015),e.add(c)}function rd(n,e,t,i,s,r,o,a,l,c,h){let d={pattaEnds:[]};if(!o)return d;let f=o==="narasimha"?12131356:o==="prahladChild"?16498468:l,u=o==="narasimha"||o==="vishnu"||o==="krishna"?16096779:a,E=new A({color:f,roughness:.46,metalness:.14,side:ct}),M=new A({color:u,roughness:.5,metalness:.12});if(h&&t&&i){for(let b of[t,i]){let C=new m(new re(.122,.114,.28,14),M);C.position.y=-.14,C.castShadow=!0,b.add(C);let H=new m(new Ne(.114,.015,6,16),c);H.rotation.x=Math.PI/2,H.position.y=-.27,b.add(H)}let x=new m(new re(.06,.135,.42,12,1,!1,-Math.PI*.35,Math.PI*.7),M);x.position.set(0,.02,.16),e.add(x);let S=new m(new z(.055,.42,.02),c);S.position.set(0,.02,.21),e.add(S)}let g=new Jt([new L(-.28,.05,.18),new L(-.25,.48,.08),new L(0,.62,-.18),new L(.25,.48,.08),new L(.28,.05,.18)]),p=new m(new dn(g,24,.036,8,!1),E);p.castShadow=!0,e.add(p);for(let x of[-1,1]){let S=new m(new z(.08,.36,.015),E);S.position.set(x*.26,.16,.15),S.rotation.z=x*.12;let b=new m(new z(.085,.045,.018),c);b.position.y=-.16,S.add(b),e.add(S),d.pattaEnds.push(S)}let T=new m(new ie(.055,10,8),new A({color:14427686,emissive:8330525,emissiveIntensity:.45}));T.scale.set(1.2,1,.55),T.position.set(0,.24,.235),e.add(T);let y=new m(new Ne(.17,.019,8,22),c);y.rotation.x=Math.PI/2+.38,y.position.set(0,.46,.08),e.add(y);for(let x of[s,r]){let S=new m(new Ne(.068,.016,8,16),c);S.rotation.x=Math.PI/2,S.position.y=-.18,x.add(S)}if(o==="vishnu"||o==="narasimha"){let x=new m(new Rt(.056,0),new A({color:14753096,emissive:10424889,emissiveIntensity:.65,metalness:.35,roughness:.14}));x.scale.set(1,1.25,.55),x.position.set(0,.44,.255),e.add(x)}if(o==="shiv"){let x=new m(new Ne(.098,.022,8,20),new A({color:2450411,emissive:1920728,emissiveIntensity:.72,roughness:.28}));x.rotation.x=Math.PI/2+.15,x.position.set(0,.64,.02),e.add(x);let S=new A({color:1976635,metalness:.35,roughness:.32}),b=new m(new Ne(.165,.026,8,22,Math.PI*1.48),S);b.rotation.x=Math.PI/2+.22,b.rotation.z=-.35,b.position.set(0,.59,.02),e.add(b);let C=new m(new ie(.055,10,8),S);C.scale.set(.95,1.35,.55),C.position.set(.165,.68,.08),e.add(C);for(let w of[-.016,.016]){let P=new m(new ie(.009,6,6),c);P.position.set(.165+w,.695,.11),e.add(P)}let H=new A({color:8138002,roughness:.62});for(let w=0;w<14;w++){let P=w/14*Math.PI*2,I=new m(new ie(.022,8,6),H);I.position.set(Math.sin(P)*.155,.5-Math.cos(P)*.06,Math.cos(P)*.18),e.add(I)}let _=new A({color:2694420,roughness:.78});for(let[w,P,I]of[[-.14,.14,.22],[.12,.1,.23],[-.04,.02,.24],[.16,-.02,.18]]){let B=new m(new ie(.036,8,6),_);B.scale.set(1.2,.7,.35),B.position.set(w,P,I),e.add(B)}}if(o==="narasimha"||o==="vishnu"||o==="krishna"||o==="ram"||o==="hanuman"){let S=new Jt([new L(-.18,.58,.11),new L(-.22,.22,.24),new L(0,-.02,.27),new L(.22,.22,.24),new L(.18,.58,.11)]).getPoints(18),b=new A({color:16710888,roughness:.55}),C=new A({color:16007006,roughness:.45});S.forEach((H,_)=>{let w=new m(new ie(_%3===0?.038:.026,8,6),_%3===0?C:b);w.position.copy(H),e.add(w)})}if(o==="narasimha"||o==="vishnu"){let x=o==="vishnu"?6788331:14261851,S=new A({color:x,roughness:.44}),b=new A({color:16776693,emissive:16708551,emissiveIntensity:.2,metalness:.25,roughness:.2});if(o==="narasimha")for(let C of[s,r])for(let H=-2;H<=2;H++){let _=new m(new Xe(.012,.095,6),b);_.position.set(H*.022,-.31,.035),_.rotation.x=Math.PI+.35,C.add(_)}for(let C of[-1,1]){let H=new te;H.position.set(C*.27,.54,-.1),H.rotation.set(-.22,0,-C*.48),e.add(H);let _=new m(new lt(.056,.28,6,8),S);_.position.y=.22,H.add(_);let w=new te;if(w.position.set(0,.44,.02),H.add(w),C===1){let P=new te,I=new m(new Ne(.18,.025,8,24),new A({color:16498468,emissive:16096779,emissiveIntensity:.72,metalness:.85,roughness:.15}));P.add(I);for(let B=0;B<12;B++){let F=B/12*Math.PI*2,W=new m(new Xe(.026,.07,4),c);W.position.set(Math.cos(F)*.21,Math.sin(F)*.21,0),W.rotation.z=F-Math.PI/2,P.add(W)}w.add(P),d.chakraWheel=P}else{let P=new te,I=new A({color:16710888,emissive:16708551,emissiveIntensity:.18,roughness:.28}),B=new m(new Xe(.095,.26,14),I);B.rotation.x=.35,P.add(B);let F=new m(new Ne(.088,.015,6,14),c);F.rotation.x=Math.PI/2,P.add(F),w.add(P)}}}return d}function fd(n){let e=t=>t?{x:-t.x,y:t.y,z:t.z}:null;return{lShoulder:e(n.rShoulder),rShoulder:e(n.lShoulder),lElbow:e(n.rElbow),rElbow:e(n.lElbow),lWrist:e(n.rWrist),rWrist:e(n.lWrist),lHip:e(n.rHip),rHip:e(n.lHip),lKnee:e(n.rKnee),rKnee:e(n.lKnee),lAnkle:e(n.rAnkle),rAnkle:e(n.lAnkle),nose:e(n.nose),lEar:e(n.rEar),rEar:e(n.lEar)}}var pd=["devi","mata","durga","lakshmi","laxmi","saraswati","parvati","sita","radha","\u0926\u0947\u0935\u0940","\u092E\u093E\u0924\u093E","\u0926\u0941\u0930\u094D\u0917\u093E","\u0932\u0915\u094D\u0937\u094D\u092E\u0940","\u0938\u0930\u0938\u094D\u0935\u0924\u0940","\u092A\u093E\u0930\u094D\u0935\u0924\u0940","\u0938\u0940\u0924\u093E","\u0930\u093E\u0927\u093E"];function Vm(n,e){return e==="Warrior"||e==="KingCrown"||e==="BrainrotLog"||e==="CupDancer"||e==="CartoonTank"||e==="ComicBobble"||e!=="Narrator"&&(n==="Temple"||n==="ForestAshram"||n==="RiverGhat"||n==="Himalaya")?!0:n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="Battlefield"||n==="PalaceCourt"||n==="ModernCity"||n==="Village"||n==="Archive"}function oc(n){return n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="ModernCity"}function Wm(n,e,t){let i=2907274,s=new Ie(t).getHex(),r=15250056,o=!1;switch(n){case"KingCrown":i=10036282,s=16105016;break;case"SageRishi":i=14247960,s=16638082;break;case"Divine":i=2974425,s=16767040,r=6000111,o=!0;break;case"ChildDevotee":i=15376156,s=14239782;break;case"NobleWoman":i=12725078,s=16303174;break;case"Warrior":i=7557683,s=12962774;break;case"BrainrotLog":i=10115880,s=16436245,r=12088894;break;case"CupDancer":i=16317180,s=16020150,r=16777215;break;case"CartoonTank":i=5078079,s=16436245,r=3560212;break;case"ComicBobble":i=16347926,s=3718648,r=15843995;break;default:i=3104660;break}return e&&/^#?[0-9a-fA-F]{6}$/.test(e.trim())&&(i=new Ie(e.startsWith("#")?e:`#${e}`).getHex()),{robe:i,sash:s,skin:r,isDivine:o}}function Xm(n,e,t,i){let s=[new Se(n*.68,-.05),new Se(n,.02),new Se(n*.98,i*.22),new Se(e,i*.48),new Se(t,i*.82),new Se(t*.62,i*.98),new Se(.01,i)];return new On(s,24)}function Ym(n){let e=new te,t=new A({color:3876421,roughness:.45,metalness:.3}),i=new m(new re(.42,.48,.08,24),t);i.position.y=.04,i.receiveShadow=!0,i.castShadow=!0,e.add(i);let s=new A({color:16020150,emissive:n,emissiveIntensity:.22,roughness:.35});for(let a=0;a<12;a++){let l=a/12*Math.PI*2,c=new m(new ie(.11,10,8),s);c.scale.set(1.2,.45,2),c.position.set(Math.cos(l)*.36,.08,Math.sin(l)*.36),c.rotation.y=-l+Math.PI*.5,c.rotation.x=.22,e.add(c)}let r=new _e({color:n,transparent:!0,opacity:.35,side:ct,depthWrite:!1}),o=new m(new Tn(.32,.52,32),r);return o.rotation.x=-Math.PI/2,o.position.y=.015,e.add(o),{group:e,glowMesh:o}}function qm(n,e,t,i,s,r,o,a,l){let c=new A({color:l&&/^#?[0-9a-fA-F]{6}$/.test(l.trim())?new Ie(l.startsWith("#")?l:`#${l}`):1972516,roughness:.72}),h=new A({color:14277862,roughness:.6}),d=new A({color:16103470,metalness:.85,roughness:.22}),f=t.toLowerCase(),u=e==="SageRishi"&&(f.includes("narad")||f.includes("\u0928\u093E\u0930\u0926")),E=e==="NobleWoman"&&pd.some(p=>f.includes(p)),M=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|harishchandra|dashrath|yudhishthir|duryodhan|bali|bhasmasur|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य|हरिश्चंद्र|दशरथ|युधिष्ठिर|दुर्योधन|बलि/i.test(f);if(e==="KingCrown"&&!M&&(o==="turban"||i==="PalaceCourt"||/sartaaj|sufi|shayar|prince|dulha|singer/i.test(f))&&!/maharaj|raja|samrat|emperor/i.test(f)){let p=new m(new ie(s*1.02,20,14,0,Math.PI*2,0,Math.PI*.42),c);p.rotation.x=-.32,n.add(p);let T=new te,y=i==="PalaceCourt"?16117734:r??10036282,x=new A({color:y,roughness:.62}),S=new m(new ie(s*1.08,22,16,0,Math.PI*2,0,Math.PI*.52),x);S.scale.set(1.04,.78,1.06),S.position.set(0,s*.48,-s*.06),S.castShadow=!0,T.add(S);for(let w=0;w<3;w++){let P=new m(new Ne(s*(.94+(w===1?.04:0)),s*.105,10,24),w===1?x:new A({color:y,roughness:.55}));P.rotation.x=Math.PI/2-.28+w*.1,P.rotation.z=(w-1)*.14,P.position.set(0,s*(.6+w*.14),-s*.02),P.castShadow=!0,T.add(P)}let b=new m(new Rt(s*.15,0),d);b.position.set(s*.16,s*1.02,s*.74),T.add(b);let C=new m(new Xe(s*.12,s*.44,8),new A({color:16708551,emissive:14251782,emissiveIntensity:.25,roughness:.45}));C.position.set(s*.19,s*1.26,s*.64),C.rotation.z=-.2,C.rotation.x=-.16,T.add(C),n.add(T);let H=new m(new ie(s*.46,14,10),c);H.scale.set(1.22,.65,.78),H.position.set(0,-s*.72,s*.54),n.add(H);let _=new m(new lt(s*.036,s*.28,4,8),c);_.rotation.z=Math.PI/2,_.position.set(0,-s*.2,s*.94),n.add(_);return}if(e==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(f)){let p=new A({color:3875604,roughness:.72}),T=new m(new ie(s*1.04,20,14,0,Math.PI*2,0,Math.PI*.48),p);T.scale.set(1.02,1.12,1),T.rotation.x=-.34,n.add(T);let y=new m(new ie(s*.46,16,14),p);y.scale.set(.88,1.32,.88),y.position.set(0,s*1.24,-s*.12),y.castShadow=!0,n.add(y);let x=new A({color:16317180,emissive:14742270,emissiveIntensity:.85,metalness:.45,roughness:.15}),S=new m(new Ne(s*.25,s*.048,8,20,Math.PI*1.22),x);S.position.set(-s*.36,s*1.12,s*.26),S.rotation.z=Math.PI*.68,S.rotation.y=.22,n.add(S);let b=new A({color:3718648,emissive:8246268,emissiveIntensity:.65,roughness:.18}),C=new Jt([new L(.02,s*1.62,-s*.08),new L(s*.22,s*1.78,-s*.16),new L(s*.42,s*1.48,-s*.34),new L(s*.48,s*.96,-s*.56)]);n.add(new m(new dn(C,16,s*.055,8,!1),b));let H=new m(new Ne(s*.42,s*.042,8,16),d);H.rotation.x=Math.PI/2,H.position.set(0,s*.96,-s*.12),n.add(H);return}if(e==="KingCrown"||e==="Divine"||e==="NobleWoman"&&(E||i!=="PalaceCourt"&&(f.includes("rani")||f.includes("\u0930\u093E\u0928\u0940")))){let p=new m(new ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),c);p.scale.set(1.01,1.11,.99),p.rotation.x=-.34,n.add(p);let y=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/i.test(f)?"asuraKing":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/i.test(f)?"krishna":/ram|raghav|raghunath|राम|राघव/i.test(f)?"ram":e==="Divine"?"vishnu":"sacred";if(sc(n,s,d,y),e==="NobleWoman"){let x=new m(new lt(s*.22,s*1.4,8,12),c);x.position.set(0,-s*.85,-s*.82),x.rotation.x=.24,n.add(x)}return}if(e==="SageRishi"){let p=u?new A({color:2892339,roughness:.7}):h,T=new m(new ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),p);T.scale.set(1.01,1.11,.99),T.rotation.x=-.36,n.add(T);let y=new m(new ie(s*.42,14,12),p);if(y.scale.set(.9,1.15,.9),y.position.set(0,s*1.24,-s*.16),y.castShadow=!0,n.add(y),!u){let x=new m(new Xe(s*.52,s*.95,14),p);x.rotation.x=Math.PI,x.position.set(0,-s*.88,s*.48),n.add(x)}return}if(e==="ChildDevotee"){let p=new m(new ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),c);p.scale.set(1.01,1.11,.99),p.rotation.x=-.36,n.add(p);let T=new m(new ie(s*.22,10,8),c);if(T.scale.set(1.3,.65,.85),T.position.set(-s*.12,s*.78,s*.68),n.add(T),!oc(i)){let y=new m(new Ne(s*.9,s*.065,10,24),d);y.rotation.x=Math.PI/2-.34,y.position.set(0,s*.55,s*.06),n.add(y);let x=new m(new Rt(s*.13,0),new A({color:1096065,emissive:366185,emissiveIntensity:.6}));x.position.set(0,s*.62,s*.92),n.add(x)}return}if(e==="NobleWoman"){let p=new m(new ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),c);p.scale.set(1.01,1.11,.99),p.rotation.x=-.34,n.add(p);let T=new m(new lt(s*.24,s*1.45,8,12),c);T.position.set(0,-s*.85,-s*.85),T.rotation.x=.25,n.add(T);let y=new m(new ie(s*.1,10,8),d);y.position.set(0,s*.5,s*.94),n.add(y);return}if(e==="Warrior"){let p=new A({color:10594485,metalness:.78,roughness:.28}),T=new m(new ie(s*1.05,20,14,0,Math.PI*2,0,Math.PI*.47),p);T.scale.set(1.02,1.12,1),T.rotation.x=-.32,n.add(T);let y=new m(new Ne(s*.7,s*.12,8,16,Math.PI),new A({color:14427686,roughness:.6}));y.rotation.y=Math.PI/2,y.position.y=s*.86,n.add(y);return}if(e==="ComicBobble"||oc(i)){let p=new te,T=(a??"").trim().toLowerCase();if(e==="ComicBobble"&&T==="bald"){for(let w of[-1,1]){let P=new m(new ie(s*.26,12,10),c);P.scale.set(.38,.8,1.2),P.position.set(w*s*.92,-s*.06,-s*.26),p.add(P)}let _=new m(new ie(s*.6,14,10),c);return _.scale.set(1.25,.42,.55),_.position.set(0,-s*.2,-s*.66),p.add(_),n.add(p),{hairFullGroup:p}}let y=new m(new ie(s*1.06,20,14,0,Math.PI*2,0,Math.PI*.5),c);if(y.scale.set(1.04,1.15,1.05),y.position.set(0,s*.06,-s*.02),y.rotation.x=-.15,p.add(y),e==="ComicBobble"&&T==="parted"){let _=new m(new ie(s*.5,14,10),c);_.scale.set(1.5,.5,1),_.position.set(s*.22,s*.9,s*.5),_.rotation.z=-.25,p.add(_)}else if(e==="ComicBobble"&&T==="curly"){for(let w=0;w<14;w++){let P=w/14*Math.PI*2,I=new m(new ie(s*.22,10,8),c);I.position.set(Math.cos(P)*s*.78,s*(.78+.12*Math.sin(w*1.7)),Math.sin(P)*s*.78),p.add(I)}let _=new m(new ie(s*.42,12,10),c);_.position.set(0,s*1.08,0),p.add(_)}else if(e==="ComicBobble"&&T==="ponytail"){let _=new m(new lt(s*.16,s*.7,6,10),c);_.position.set(0,s*.55,-s*1.05),_.rotation.x=.55,p.add(_);let w=new m(new Ne(s*.17,s*.05,6,12),new A({color:14753096,roughness:.5}));w.position.set(0,s*.86,-s*.86),w.rotation.x=.9,p.add(w);for(let P of[-1,1]){let I=new m(new lt(s*.09,s*.5,4,8),c);I.position.set(P*s*.78,s*.15,s*.42),p.add(I)}}else if(e==="ComicBobble"&&T==="short"){let _=new m(new ie(s*.4,12,10),c);_.scale.set(1.5,.4,1),_.position.set(0,s*.88,s*.5),p.add(_)}else if(e==="ComicBobble"){for(let w of[-.35,0,.35]){let P=new m(new Xe(s*.15,s*.4,8),c);P.position.set(w*s*.85,s*1.14,s*.2),P.rotation.z=-w*.65,P.rotation.x=.24,p.add(P)}let _=new m(new ie(s*.38,12,10),c);_.scale.set(1.38,.56,.98),_.position.set(0,s*.92,s*.52),p.add(_)}else{let _=new m(new ie(s*.46,14,12),c);_.scale.set(1.48,.78,1.38),_.position.set(0,s*1.1,s*.36),p.add(_);let w=new m(new ie(s*.36,12,10),c);w.scale.set(1.42,.54,.96),w.position.set(0,s*.92,s*.56),p.add(w);for(let P of[-1,1]){let I=new m(new Xe(s*.14,s*.34,8),c);I.position.set(P*s*.42,s*1.16,s*.26),I.rotation.z=-P*.48,I.rotation.x=.28,p.add(I)}}n.add(p);let x=new te;x.visible=!1;let S=new m(new Ne(s*.88,s*.11,8,22,Math.PI*1.15),c);S.rotation.x=Math.PI/2+.18,S.rotation.z=-Math.PI*.075,S.position.set(0,s*.16,-s*.1),x.add(S);let b=new m(new Xe(s*.06,s*.16,6),c);b.position.set(0,s*1.08,-s*.12),x.add(b);let C=new A({color:16775399,emissive:16770229,emissiveIntensity:.48,roughness:.1}),H=new m(new ie(s*.25,12,10),C);return H.scale.set(1.3,.32,.92),H.position.set(.08*s,s*.92,s*.34),H.rotation.z=-.18,H.rotation.x=.28,x.add(H),n.add(x),{hairFullGroup:p,hairShavedGroup:x}}else{let p=new m(new ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),c);p.scale.set(1.01,1.11,.99),p.rotation.x=-.35,n.add(p)}}function md(n,e,t,i,s,r){let o=new A({color:16317180,roughness:.18}),a=new A({color:1971218,roughness:.12}),l=new A({color:t,roughness:.48}),c=new A({color:i,roughness:.55}),h=r?1.38:1,d=C=>{let H=C*e*(r?.38:.36),_=e*.09,w=s,P=new m(new ie(e*.165*h,14,12),o);P.scale.set(1.06,.9,.56),P.position.set(H,_,w),n.add(P);let I=new m(new ie(e*.098*(r?1.15:1),12,10),a);I.scale.set(1,.95,.62),I.position.set(H,_,w+e*.068*h),n.add(I);let B=new m(new ie(e*.036*h,8,6),new _e({color:16777215}));B.position.set(H+e*.032,_+e*.035,w+e*.115*h),n.add(B);let F=new m(new ie(e*.18*h,12,10,0,Math.PI*2,0,Math.PI*.52),l);F.scale.set(1.02,1.05,.65),F.position.set(H,_,w),F.rotation.x=-Math.PI*.48,n.add(F);let W=new m(new lt(e*.034*h,e*.22*h,4,8),c);return W.rotation.z=Math.PI/2,W.position.set(H,_+e*.25*h,w+e*.08*h),n.add(W),{sclera:P,pupil:I,eyelid:F,brow:W}},f=d(-1),u=d(1),E=new A({color:t,roughness:.45}),M=new m(new ie(e*.085,10,8),E);M.scale.set(.8,1.15,.9),M.position.set(0,-e*.08,s+e*.065),n.add(M);let g=new A({color:16172100,metalness:.85,roughness:.22});for(let C of[-1,1]){let H=new m(new Ne(e*.085,e*.025,8,14),g);H.position.set(C*e*.94,-e*.14,e*.04),H.rotation.y=C*Math.PI*.42,n.add(H)}let p=-e*.36,T=s+e*.02,y=new m(new ie(e*(r?.22:.16),12,10),new _e({color:5509406}));y.scale.set(1.1,.2,.45),y.position.set(0,p,T-.01),n.add(y);let x=new A({color:10896452,roughness:.42}),S=new m(new lt(e*.032,e*.22,4,8),x);S.rotation.z=Math.PI/2,S.position.set(0,p+e*.03,T+.03),n.add(S);let b=new m(new lt(e*.034,e*.19,4,8),x);return b.rotation.z=Math.PI/2,b.position.set(0,p-e*.03,T+.03),n.add(b),{leftEye:f,rightEye:u,mouthCavity:y,upperLip:S,lowerLip:b,mouthBaseY:p}}function Zm(n,e,t,i,s,r,o,a){let l=new te,c=new te;l.add(c);let h=new m(new Tn(.46,.58,36),new _e({color:a,transparent:!0,opacity:.22,side:ct,depthWrite:!1}));h.rotation.x=-Math.PI/2,h.position.y=.012,l.add(h);let d=new m(new Mt(.45,32),new _e({color:a,transparent:!0,opacity:.08,side:ct,depthWrite:!1}));d.rotation.x=-Math.PI/2,d.position.y=.01,l.add(d);let f=new A({color:s,roughness:.48,metalness:n==="CartoonTank"?.35:.06}),u=new A({color:r,roughness:.35,metalness:.35}),E=new A({color:2042167,roughness:.72}),M=new te,g=n==="CartoonTank"?.26:.44;M.position.y=g,c.add(M);let p=new te,T,y,x,S,b;if(n==="CartoonTank"){for(let Re of[-.36,.36]){let K=new m(new z(.22,.26,.92),E);K.position.set(Re,-.1,0),K.castShadow=!0,M.add(K);for(let ae of[-.3,0,.3]){let Ee=new m(new re(.11,.11,.25,12),u);Ee.rotation.z=Math.PI/2,Ee.position.set(Re,-.12,ae),M.add(Ee)}}let $=new m(new z(.68,.3,.84),f);$.position.set(0,.14,0),$.castShadow=!0,M.add($),T=new te,T.position.set(0,.42,-.02),M.add(T);let fe=new m(new z(.56,.34,.56),f);fe.castShadow=!0,T.add(fe);let be=new m(new z(.58,.07,.58),u);be.position.y=-.1,T.add(be),y=new m(new re(.065,.08,.66,14),E),y.rotation.x=Math.PI/2,y.position.set(0,.04,.5),y.castShadow=!0,T.add(y),p.position.set(0,.1,0),T.add(p)}else if(n==="BrainrotLog"){let $=K=>{let ae=new te;ae.position.set(K*.14,-.05,0),M.add(ae);let Ee=new m(new lt(.065,.28,6,8),f);Ee.position.set(0,-.17,0),ae.add(Ee);let me=new m(new ie(.1,10,8),u);return me.scale.set(.9,.5,1.5),me.position.set(0,-.34,.05),ae.add(me),ae};S=$(-1),b=$(1);let fe=new m(new re(.21,.25,.96,18),f);fe.position.y=.44,fe.castShadow=!0,M.add(fe);let be=new m(new re(.18,.18,.04,16),new A({color:16639626}));be.position.y=.93,M.add(be);let Re=new m(new re(.025,.04,.18,8),f);Re.position.set(.06,1,0),Re.rotation.z=-.35,M.add(Re),p.position.set(0,.72,0),M.add(p)}else{let $=ae=>{let Ee=new te;Ee.position.set(ae*.13,-.05,0),M.add(Ee);let me=new m(new lt(.055,.3,6,8),E);me.position.set(0,-.17,0),Ee.add(me);let le=new m(new ie(.095,10,8),u);return le.scale.set(.95,.5,1.45),le.position.set(0,-.34,.05),Ee.add(le),Ee};S=$(-1),b=$(1);let fe=new m(new re(.32,.22,.62,24),f);fe.position.y=.34,fe.castShadow=!0,M.add(fe);let be=new m(new Ne(.315,.025,10,24),u);be.rotation.x=Math.PI/2,be.position.y=.65,M.add(be);let Re=new m(new Mt(.295,24),new A({color:4137748,roughness:.2}));Re.rotation.x=-Math.PI/2,Re.position.y=.62,M.add(Re);let K=new m(new Ne(.14,.034,8,16,Math.PI),f);K.rotation.z=-Math.PI/2,K.position.set(-.3,.36,0),M.add(K),p.position.set(0,.42,0),M.add(p)}let _=md(p,n==="CartoonTank"?.26:.24,o,1120295,n==="CartoonTank"?.29:n==="CupDancer"?.28:.21,!0),w=n==="CupDancer"?new A({color:16777215,roughness:.4}):f,P=new lt(.048,.2,6,8),I=new lt(.042,.18,6,8),B=$=>{let fe=new te;fe.position.set($*(n==="CartoonTank"?.33:.27),n==="CartoonTank"?.24:.45,0),M.add(fe);let be=new m(P,w);be.position.y=-.11,fe.add(be);let Re=new te;Re.position.y=-.22,fe.add(Re);let K=new m(I,w);K.position.y=-.1,Re.add(K);let ae=new m(new ie(.068,10,8),u);return ae.position.y=-.22,Re.add(ae),{shoulder:fe,elbow:Re,glove:ae}},F=B(-1),W=B(1),Y=new te;Y.position.set(0,-.25,.06);let Q=new m(new re(.11,.07,.08,14),new A({color:16317180,roughness:.35}));Y.add(Q);let N=new m(new ie(.075,10,8),new A({color:16707722,roughness:.45}));N.scale.set(1.1,.55,1.1),N.position.y=.035,Y.add(N),Y.visible=!1,W.elbow.add(Y);let ee=ic(W.elbow,F.elbow,M);if(n==="BrainrotLog"){x=new te,x.position.set(0,-.22,.04);let $=new m(new re(.065,.025,.65,10),new A({color:14251782,roughness:.45}));$.position.y=-.28,$.castShadow=!0,x.add($),W.elbow.add(x)}return l.rotation.y=t*.36,{root:l,bodyPivot:c,torsoGroup:M,headPivot:p,leftShoulder:F.shoulder,leftElbow:F.elbow,rightShoulder:W.shoulder,rightElbow:W.elbow,leftHip:S,rightHip:b,snackProp:Y,handProps:ee,headY:n==="CartoonTank"?.78:n==="CupDancer"?.86:1.16,leftEyelid:_.leftEye.eyelid,rightEyelid:_.rightEye.eyelid,leftBrow:_.leftEye.brow,rightBrow:_.rightEye.brow,leftSclera:_.leftEye.sclera,rightSclera:_.rightEye.sclera,leftPupil:_.leftEye.pupil,rightPupil:_.rightEye.pupil,mouthCavity:_.mouthCavity,upperLip:_.upperLip,lowerLip:_.lowerLip,auraRing:h,auraDisc:d,turretGroup:T,cannonBarrel:y,propPivot:x,mouthBaseY:_.mouthBaseY,baseTorsoY:g,restScale:1,topY:n==="CartoonTank"?1.05:n==="CupDancer"?1.14:1.54,role:n,name:e,facingSign:t,standing:!0,seedOffset:i}}function Sa(n,e,t,i,s){let r=n.role,o=Vm(t,r),a=Wm(r,n.robeHex,e);n.skinHex&&/^#?[0-9a-fA-F]{6}$/.test(n.skinHex.trim())&&(a.skin=new Ie(n.skinHex.startsWith("#")?n.skinHex:`#${n.skinHex}`).getHex());let{isDivine:l}=a,c=new Ie(e);if(r==="BrainrotLog"||r==="CupDancer"||r==="CartoonTank")return Zm(r,n.name,i,s,a.robe,a.sash,a.skin,c);let h=new te,d=new te;h.add(d);let u=oc(t),E=td(r,n.name,t,u),M=nd(E,a),g=M.robe,p=M.sash,T=M.skin,y=n.scale&&n.scale>0?n.scale:E?M.scale:r==="ChildDevotee"?.82:1;d.scale.setScalar(y);let x=(Ce,ve)=>{let We=document.createElement("canvas");We.width=256,We.height=256;let U=We.getContext("2d"),Me="#"+new Ie(ve).getHexString();if(U.fillStyle=Me,U.fillRect(0,0,256,256),Ce==="colorful"){let Z=["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899","#14b8a6","#eab308"];for(let ue=0;ue<42;ue++){U.fillStyle=Z[ue%Z.length];let ye=ue*53%240,Ge=ue*79%240;U.beginPath(),U.moveTo(ye,Ge),U.lineTo(ye+36,Ge+12),U.lineTo(ye+22,Ge+42),U.lineTo(ye-10,Ge+28),U.closePath(),U.fill()}}else if(Ce==="striped"){U.fillStyle="rgba(255,255,255,0.28)";for(let Z=0;Z<256;Z+=28)U.fillRect(Z,0,10,256)}else if(Ce==="checked"){U.fillStyle="rgba(255,255,255,0.22)";for(let Z=0;Z<256;Z+=32)U.fillRect(Z,0,12,256);for(let Z=0;Z<256;Z+=32)U.fillRect(0,Z,256,12)}let q=new Yt(We);return q.colorSpace=xt,q},S=n.shirtPattern??"solid",b=S!=="solid"?new A({map:x(S,g),roughness:.56,metalness:.05}):new A({color:g,roughness:.58,metalness:.08}),C=new A({color:new Ie(g).multiplyScalar(.75),roughness:.65}),H=new A({color:p,roughness:.42,metalness:.25}),_=new A({color:T,roughness:.48,metalness:.02}),w=new A({color:16236088,metalness:.85,roughness:.22}),P=new m(new Tn(.46,.58,36),new _e({color:c,transparent:!0,opacity:u?0:.22,side:ct,depthWrite:!1}));P.rotation.x=-Math.PI/2,P.position.y=.012,P.visible=!u,h.add(P);let I=new m(new Mt(.45,32),new _e({color:c,transparent:!0,opacity:u?0:.08,side:ct,depthWrite:!1}));I.rotation.x=-Math.PI/2,I.position.y=.01,I.visible=!u,h.add(I);let B,F,W,Y,Q,N=.14,ee=u?new A({color:i>0?1976635:3223169,roughness:.72}):C;if(o){N=.66;let Ce=new m(new ie(.245,16,12),ee);Ce.scale.set(1.06,.65,.88),Ce.position.set(0,N-.01,0),Ce.castShadow=!0,d.add(Ce);let ve=new lt(.104,.2,6,10),We=new lt(.092,.18,6,10),U=new A({color:u?16317180:3875862,roughness:.45}),Me=ue=>{let ye=new te;ye.position.set(ue*.13,N-.04,0),d.add(ye);let Ge=new m(ve,ee);Ge.position.set(0,-.15,0),Ge.castShadow=!0,Ge.receiveShadow=!0,ye.add(Ge);let nt=new te;nt.position.set(0,-.3,0),ye.add(nt);let at=new m(We,ee);at.position.set(0,-.14,0),at.castShadow=!0,at.receiveShadow=!0,nt.add(at);let et=new m(new ie(.105,12,8),U);return et.scale.set(.95,.55,1.55),et.position.set(0,-.265,.05),et.castShadow=!0,nt.add(et),{hip:ye,knee:nt}},q=Me(-1),Z=Me(1);F=q.hip,Y=q.knee,W=Z.hip,Q=Z.knee}else{let Ce=Ym(c);B=Ce.glowMesh,d.add(Ce.group),N=.15;let ve=new m(new ie(.36,20,12),C);ve.scale.set(1.15,.45,.92),ve.position.set(0,N+.06,.03),ve.castShadow=!0,ve.receiveShadow=!0,d.add(ve)}let $=new te;$.position.y=N,d.add($);let fe=Xm(.28,.21,.27,.62),be=E==="narasimha"||E==="hanuman"||E==="shiv"||E==="vishnu"||E==="krishna"||E==="ram",Re=new m(fe,be?_:b);if(Re.castShadow=!0,Re.receiveShadow=!0,$.add(Re),u)if(o&&r==="Scholar"&&(t==="Village"||t==="ChaiStall"||t==="SweetShop"||t==="NeighborhoodGate"||t==="ComedyStage"||t==="PalaceCourt")){let Ce=[new Se(.21,.24),new Se(.25,.02),new Se(.28,-.24),new Se(.29,-.32)],ve=new m(new On(Ce,20),new A({color:g,roughness:.58,side:ct}));ve.castShadow=!0,$.add(ve);let We=new m(new re(.125,.132,.06,16),H);We.position.set(0,.6,.02),$.add(We);let U=new m(new z(.09,.44,.26),H);U.position.set(.16,.36,.02),U.rotation.z=.08,$.add(U)}else{let Ce=new m(new Ne(.132,.026,8,20),H);Ce.rotation.x=Math.PI/2+.2,Ce.position.set(0,.58,.03),$.add(Ce);let ve=new m(new Ne(.255,.022,8,22),new A({color:988970,roughness:.65}));ve.rotation.x=Math.PI/2,ve.position.y=.04,$.add(ve)}else{if(t!=="PalaceCourt"){let We=new Jt([new L(-.16,.55,.1),new L(-.02,.39,.21),new L(.18,.22,.14),new L(.14,.18,-.16)]),U=new m(new dn(We,18,.024,8,!1),H);U.castShadow=!0,$.add(U)}let Ce=new m(new Ne(.22,.022,8,22),w);Ce.rotation.x=Math.PI/2,Ce.position.y=.24,$.add(Ce);let ve=new m(new Ne(.142,.018,8,20),w);if(ve.rotation.x=Math.PI/2+.25,ve.position.set(0,.57,.04),$.add(ve),o&&r==="NobleWoman"){let We=[new Se(.18,.25),new Se(.24,.08),new Se(.36,-.18),new Se(.45,-.44),new Se(.42,-.46)],U=new On(We,28),Me=new A({color:g,roughness:.45,metalness:.14,side:ct}),q=new m(U,Me);q.castShadow=!0,q.receiveShadow=!0,$.add(q);let Z=new m(new Ne(.44,.024,8,32),w);Z.rotation.x=Math.PI/2,Z.position.y=-.44,$.add(Z);let ue=new z(.14,.62,.28),ye=new A({color:g,roughness:.42,metalness:.16}),Ge=new m(ue,ye);Ge.position.set(-.08,.34,.06),Ge.rotation.z=-.52,Ge.castShadow=!0,$.add(Ge);let nt=new m(new z(.028,.63,.29),w);nt.position.set(-.02,.34,.062),nt.rotation.z=-.52,$.add(nt)}else if(o&&r==="KingCrown"&&(!E||E==="genericSacred")&&(t==="PalaceCourt"||n.attire==="turban")){let We=[new Se(.22,.24),new Se(.27,.02),new Se(.31,-.26),new Se(.32,-.34)],U=new m(new On(We,24),new A({color:g,roughness:.5,metalness:.12,side:ct}));U.castShadow=!0,$.add(U);for(let Me=0;Me<4;Me++){let q=new m(new ie(.022,8,8),w);q.position.set(0,.5-Me*.075,Me<2?.248:.225),$.add(q)}}}let K=n.name.toLowerCase();if(r==="SageRishi"&&(K.includes("narad")||K.includes("\u0928\u093E\u0930\u0926"))){let Ce=new te,ve=new A({color:9584654,roughness:.42}),We=new m(new re(.025,.025,.85,10),ve);We.rotation.z=-.68,Ce.add(We);let U=new m(new ie(.11,14,10),ve);U.position.set(-.26,-.32,.04),Ce.add(U);let Me=new m(new ie(.08,12,10),ve);Me.position.set(.24,.3,.04),Ce.add(Me),Ce.position.set(0,.34,.28),$.add(Ce)}else if(r==="Warrior"){let Ce=new m(new re(.22,.22,.04,20),w);Ce.rotation.x=Math.PI/2,Ce.position.set(-.34,.28,.08),$.add(Ce);let ve=new m(new re(.016,.016,1.45,8),new A({color:7029795}));ve.position.set(.36,.55,.02),$.add(ve);let We=new m(new Xe(.04,.14,8),new A({color:14870768,metalness:.85}));We.position.set(.36,1.32,.02),$.add(We)}let ae=new lt(.072,.21,6,10),Ee=new lt(.06,.19,6,10),me=be||E==="asuraKing"?_:b,le=Ce=>{let ve=new te;ve.position.set(Ce*.245,.52,0),$.add(ve);let We=new m(new ie(.088,12,10),me);We.castShadow=!0,ve.add(We);let U=new m(ae,me);U.position.y=-.13,U.castShadow=!0,ve.add(U);let Me=new te;Me.position.y=-.26,ve.add(Me);let q=new m(new ie(.062,10,8),me);q.castShadow=!0,Me.add(q);let Z=new m(Ee,me);Z.position.y=-.115,Z.castShadow=!0,Me.add(Z);let ue=new m(new ie(.066,12,10),_);return ue.scale.set(.95,1.15,.8),ue.position.y=-.24,ue.castShadow=!0,Me.add(ue),{shoulder:ve,elbow:Me}},He=le(-1),ne=le(1),ge=rd(d,$,F,W,He.elbow,ne.elbow,E,g,p,w,o),pe=new te;pe.position.set(0,-.25,.06);let xe=new m(new re(.11,.07,.08,14),new A({color:16317180,roughness:.35}));pe.add(xe);let G=new m(new ie(.075,10,8),new A({color:16707722,roughness:.45}));G.scale.set(1.1,.55,1.1),G.position.y=.035,pe.add(G),pe.visible=!1,ne.elbow.add(pe);let he=ic(ne.elbow,He.elbow,$),k=r==="ComicBobble"?.345:r==="ChildDevotee"?.265:.245,Be=new m(new re(.075,.095,.14,14),_);Be.position.y=.65,$.add(Be);let we=new te;we.position.y=.68+k*.92,$.add(we);let Ye,Ue=k*.08,D,v,V,se,ce,oe,ze,Pe,Ae;if(E==="narasimha"){let Ce=id(we,k,T);Ae=Ce,Pe=Ce.lowerJawPivot}else{let Ce=new m(new ie(k,26,20),_);Ce.scale.set(.98,1.08,.95),Ce.castShadow=!0,Ce.receiveShadow=!0,we.add(Ce);let ve=new m(new ie(k*.14,10,8),_);ve.scale.set(.85,1.05,1.2),ve.position.set(0,-k*.04,k*.94),we.add(ve);for(let q of[-1,1]){let Z=new m(new ie(k*.18,10,8),_);if(Z.scale.set(.5,1.2,.8),Z.position.set(q*k*.96,-k*.04,0),we.add(Z),!u){let ue=new m(new Ne(k*.1,k*.025,8,14),w);ue.rotation.y=Math.PI/2,ue.position.set(q*k*.98,-k*.2,.01),we.add(ue)}}let We=q=>{let Z=new m(new ie(k*.19,10,8),new _e({color:15680580,transparent:!0,opacity:0,depthWrite:!1}));return Z.scale.set(1.2,.75,.35),Z.position.set(q*k*.56,-k*.16,k*.84),we.add(Z),Z};if(D=u?We(-1):void 0,v=u?We(1):void 0,u){let q=new _e({color:3718648,transparent:!0,opacity:.92,depthWrite:!1}),Z=nt=>{let at=new m(new ie(k*.056,8,8),q);return at.scale.set(.75,1.38,.46),at.position.set(nt*k*.34,-k*.02,k*.93),at.visible=!1,we.add(at),at};V=Z(-1),se=Z(1),ce=new te;let ue=new m(new ie(k*.075,8,8),q);ue.scale.set(.85,1.05,.55);let ye=new m(new Xe(k*.068,k*.14,8),q);ye.position.y=k*.085,ce.add(ue,ye),ce.position.set(k*.58,k*.42,k*.8),ce.visible=!1,we.add(ce),oe=new te;let Ge=new _e({color:15680580});for(let[nt,at,et]of[[.45,-k*.055,k*.045],[-.45,k*.055,k*.045],[-.45,-k*.055,-k*.045],[.45,k*.055,-k*.045]]){let Dt=new m(new z(k*.11,k*.032,k*.03),Ge);Dt.rotation.z=nt,Dt.position.set(at,et,0),oe.add(Dt)}oe.position.set(-k*.46,k*.44,k*.86),oe.visible=!1,we.add(oe)}if(u){Ye=new te,Ye.position.set(0,Ue,k*.97);let q=new A({color:988970,metalness:.45,roughness:.25}),Z=new _e({color:12248829,transparent:!0,opacity:.24}),ue=new m(new z(k*1.18,k*.09,k*.05),q);ue.position.set(0,k*.16,.01),Ye.add(ue);for(let Ge of[-1,1]){let nt=new m(new Ne(k*.19,k*.028,8,18),q);nt.position.set(Ge*k*.36,0,0),Ye.add(nt);let at=new m(new Mt(k*.175,16),Z);at.position.set(Ge*k*.36,0,-.005),Ye.add(at);let et=new m(new z(k*.03,k*.035,k*.5),q);et.position.set(Ge*k*.58,k*.06,-k*.22),Ye.add(et)}let ye=new m(new re(k*.022,k*.022,k*.36,6),q);ye.rotation.z=Math.PI/2,ye.position.set(0,k*.02,0),Ye.add(ye),Ye.visible=n.hasGlasses!==void 0&&n.hasGlasses!==null?!!n.hasGlasses:i>0,Ye.userData.wearsByDefault=Ye.visible,we.add(Ye)}if(n.mustache&&n.mustache!=="none"){let q=new A({color:1120295,roughness:.65});if(n.mustache==="brush"){let Z=new m(new z(k*.42,k*.14,k*.08),q);Z.position.set(0,-k*.18,k*.96),we.add(Z)}else if(n.mustache==="handlebar")for(let Z of[-1,1]){let ue=new m(new lt(k*.04,k*.22,4,8),q);ue.rotation.z=Z*1.15,ue.position.set(Z*k*.16,-k*.19,k*.95),we.add(ue)}}if(r==="NobleWoman"){let q=new m(new ie(k*.08,10,8),new A({color:14427686,roughness:.4}));q.scale.z=.4,q.position.set(0,k*.24,k*.96),we.add(q)}else if(r==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(K)){let q=new A({color:16317180,emissive:14870768,emissiveIntensity:.45,roughness:.6});for(let ye of[-.045,0,.045]){let Ge=new m(new z(k*.36,k*.025,k*.04),q);Ge.position.set(0,k*(.28+ye),k*.95),we.add(Ge)}let Z=new m(new lt(k*.028,k*.09,4,8),new A({color:16096779,emissive:14427686,emissiveIntensity:.65}));Z.position.set(0,k*.42,k*.965),we.add(Z);let ue=new m(new ie(k*.045,8,8),new A({color:14427686}));ue.position.set(0,k*.28,k*.975),we.add(ue)}else if(E==="vishnu"||E==="krishna"||E==="ram"){let q=new A({color:16710888,emissive:16708551,emissiveIntensity:.25}),Z=new A({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let ye of[-1,1]){let Ge=new m(new z(k*.042,k*.28,k*.04),q);Ge.position.set(ye*k*.072,k*.36,k*.955),Ge.rotation.z=-ye*.09,we.add(Ge)}let ue=new m(new lt(k*.022,k*.2,4,8),Z);ue.position.set(0,k*.36,k*.97),we.add(ue)}else if(r!=="Warrior"&&!u&&E!=="asuraKing"){let q=new m(new lt(k*.036,k*.16,4,8),new A({color:r==="Divine"?16498468:15357964,emissive:8138002,emissiveIntensity:.2}));q.position.set(0,k*.28,k*.95),we.add(q)}ze=qm(we,r,n.name,t,k,g,n.attire,n.hairStyle,n.hairHex),E==="asuraKing"&&sd(we,$,k,w);let U=r==="SageRishi"?14277862:1840930,Me=r==="ComicBobble"||t==="DoorwaySet"||t==="SkyGauntlet";Ae=md(we,k,T,U,k*.85,Me)}let Qe,Te,ke=r==="NobleWoman"&&pd.some(Ce=>K.includes(Ce));if(l||r==="SageRishi"||ke||E==="narasimha"){Qe=new te,Qe.position.set(0,.04,-k*(E==="narasimha"?.92:.72)),Te=new _e({color:l||E==="narasimha"?16769126:c,transparent:!0,opacity:l||E==="narasimha"?.65:.28,side:ct,depthWrite:!1});let Ce=new m(new Tn(k*1.45,k*1.62,32),Te);Qe.add(Ce);for(let ve=0;ve<8;ve++){let We=new m(new $e(k*.08,k*.45),Te),U=ve/8*Math.PI*2;We.position.set(Math.cos(U)*k*1.54,Math.sin(U)*k*1.54,0),We.rotation.z=U+Math.PI/2,Qe.add(We)}we.add(Qe)}h.rotation.y=i*.42;let qe=N+.68+k*.92,Ke=(o?qe:1.04)*y,Fe=(o?qe+k*1.48:1.4)*y;return{root:h,bodyPivot:d,torsoGroup:$,headPivot:we,leftShoulder:He.shoulder,leftElbow:He.elbow,rightShoulder:ne.shoulder,rightElbow:ne.elbow,leftHip:F,rightHip:W,leftKnee:Y,rightKnee:Q,snackProp:pe,handProps:he,headY:Ke,leftEyelid:Ae.leftEye.eyelid,rightEyelid:Ae.rightEye.eyelid,leftBrow:Ae.leftEye.brow,rightBrow:Ae.rightEye.brow,leftSclera:Ae.leftEye.sclera,rightSclera:Ae.rightEye.sclera,leftPupil:Ae.leftEye.pupil,rightPupil:Ae.rightEye.pupil,mouthCavity:Ae.mouthCavity,upperLip:Ae.upperLip,lowerLip:Ae.lowerLip,glassesGroup:Ye,glassesBaseY:Ue,hairFullGroup:ze?.hairFullGroup,hairShavedGroup:ze?.hairShavedGroup,leftCheekFlush:D,rightCheekFlush:v,leftTearBead:V,rightTearBead:se,sweatDropGroup:ce,angerMarkGroup:oe,haloGroup:Qe,haloMaterial:Te,auraRing:P,auraDisc:I,pedestalGlow:B,chakraWheel:ge.chakraWheel,lowerJawPivot:Pe,pattaEnds:ge.pattaEnds,isNarasimha:E==="narasimha",isAsuraKing:E==="asuraKing",isHolika:/holika|होलिका/i.test(n.name),mouthBaseY:Ae.mouthBaseY,baseTorsoY:o?.66:.15,restScale:y,topY:Fe,role:r,name:n.name,facingSign:i,standing:o,hasFloorAura:!u,seedOffset:s}}var od=(n,e,t)=>n+(e-n)*t,ad=n=>{let e=Math.max(0,Math.min(1,n));return e*e*(3-2*e)};function Jm(n,e,t="dancing",i=!1,s=0){let r=i?-1:1;if(e==="viralBounce"){let E=Math.abs(Math.sin(n*7.2)),M=Math.sin(n*3.6);return{hipOffsetX:M*.14*r,liftY:Math.pow(E,2.4)*.06,bodyRotY:Math.sin(n*1.8)*.24*r,bodyRotZ:M*.08*r,torsoRotX:.06+E*.06,torsoRotY:-M*.14*r,torsoRotZ:-M*.07*r,headRotZ:M*.1*r,leftHipX:-E*.24+M*.16,rightHipX:-E*.24-M*.16,leftKneeX:E*.44,rightKneeX:E*.44,leftShoulder:[-.95+M*.55,.22*r,.52*r],leftElbow:[-.85+E*.35,0,.22*r],rightShoulder:[-.95-M*.55,-.22*r,-.52*r],rightElbow:[-.85+E*.35,0,-.22*r]}}let o=e==="bhangra"?1.32:.92,a=n*o%4,l=t==="adaab"?0:t==="sufiSpin"?3:Math.floor(a),c=t==="dancing"?a-Math.floor(a):n*o%1,h=s>0?Math.pow(1-s,2)*.16:Math.abs(Math.sin(n*Math.PI*o*2))*.14,d=Math.sin(c*Math.PI*2);if(l===0){let E=ad(Math.sin(c*Math.PI));return{hipOffsetX:-.09*r*E,liftY:0,bodyRotY:.16*r*E,bodyRotZ:.04*r*E,torsoRotX:.09*E,torsoRotY:-.12*r*E,torsoRotZ:-.07*r*E,headRotZ:.1*r*E,leftHipX:-.14-h*.25,rightHipX:-.06-h*.15,leftKneeX:.24+h*.55,rightKneeX:.12+h*.35,leftShoulder:[-.78*E-.24,.28*r,(.42+.18*E)*r],leftElbow:[-.48-.28*E,0,-.18*r],rightShoulder:[od(-.45,-1.42,E),-.32*r,(-.36-.16*E)*r],rightElbow:[od(-.55,-1.28,E),0,.24*E*r]}}if(l===1){let E=Math.sin(c*Math.PI*2);return{hipOffsetX:E*.15*r,liftY:0,bodyRotY:E*.22*r,bodyRotZ:E*.05*r,torsoRotX:.05,torsoRotY:-E*.22*r,torsoRotZ:-E*.09*r,headRotZ:E*.14*r,leftHipX:-.16+Math.max(0,E)*.18,rightHipX:-.16+Math.max(0,-E)*.18,leftKneeX:.26+Math.abs(E)*.24+h,rightKneeX:.26+Math.abs(E)*.24+h,leftShoulder:[-1.18+E*.52,.32*r,(.58+E*.32)*r],leftElbow:[-.72+Math.cos(c*Math.PI*2)*.35,0,.26*r],rightShoulder:[-1.18-E*.52,-.32*r,(-.58+E*.32)*r],rightElbow:[-.72-Math.cos(c*Math.PI*2)*.35,0,-.26*r]}}if(l===2){let E=d,M=e==="bhangra"?.35:0;return{hipOffsetX:E*.16*r,liftY:e==="bhangra"?Math.max(0,Math.abs(E)-.6)*.12:0,bodyRotY:E*.2*r,bodyRotZ:E*.06*r,torsoRotX:.08+h*.25,torsoRotY:-E*.18*r,torsoRotZ:-E*.07*r,headRotZ:E*.11*r,leftHipX:-.12+E*.28,rightHipX:-.12-E*.28,leftKneeX:.2+Math.max(0,-E)*.48+h,rightKneeX:.2+Math.max(0,E)*.48+h,leftShoulder:[-1.45-M+E*.38,.24*r,(.64+E*.24)*r],leftElbow:[-.88+E*.24,0,.18*r],rightShoulder:[-1.05-M-E*.42,-.24*r,(-.52+E*.24)*r],rightElbow:[-.88-E*.24,0,-.18*r]}}let f=ad(c),u=Math.sin(f*Math.PI);return{hipOffsetX:Math.sin(f*Math.PI)*.08*r,liftY:e==="bhangra"?u*.08:0,bodyRotY:f*Math.PI*2*r,bodyRotZ:.04*r*u,torsoRotX:-.05*u,torsoRotY:0,torsoRotZ:0,headRotZ:-.08*r*u,leftHipX:-.12,rightHipX:-.12,leftKneeX:.22+h*.4,rightKneeX:.22+h*.4,leftShoulder:[-1.55-.35*u,.28*r,(.68+.32*u)*r],leftElbow:[-.42-.22*u,0,.24*r],rightShoulder:[-1.55-.35*u,-.28*r,(-.68-.32*u)*r],rightElbow:[-.42-.22*u,0,-.24*r]}}function Ed(n,e=0){let t=nE(n);n.bodyPivot.position.y=0,n.bodyPivot.updateMatrixWorld(!0);let i=1/0;for(let r of[t.left,t.right])r&&(r.getWorldPosition(rc),n.root.worldToLocal(rc),i=Math.min(i,rc.y));let s=Number.isFinite(i)?Math.max(-.55,Math.min(.45,-i)):0;n.bodyPivot.position.y=s+Math.max(0,Math.min(.6,e))}function ba(n,e,t,i=0,s=!1,r=0,o=.5){let a=e+r,l=Jm(a,t,"dancing",s,i);n.bodyPivot.scale.setScalar(n.restScale),n.bodyPivot.position.x=l.hipOffsetX,n.bodyPivot.rotation.set(0,l.bodyRotY,l.bodyRotZ),n.torsoGroup.position.y=n.baseTorsoY+Math.sin(a*3)*.01,n.torsoGroup.rotation.set(l.torsoRotX,l.torsoRotY,l.torsoRotZ),n.headPivot.rotation.set(0,Math.sin(a*1.4)*.08,l.headRotZ),n.leftShoulder.rotation.set(l.leftShoulder[0],l.leftShoulder[1],l.leftShoulder[2]),n.leftElbow.rotation.set(l.leftElbow[0],l.leftElbow[1],l.leftElbow[2]),n.rightShoulder.rotation.set(l.rightShoulder[0],l.rightShoulder[1],l.rightShoulder[2]),n.rightElbow.rotation.set(l.rightElbow[0],l.rightElbow[1],l.rightElbow[2]),n.leftHip&&n.leftHip.rotation.set(l.leftHipX,0,0),n.rightHip&&n.rightHip.rotation.set(l.rightHipX,0,0),n.leftKnee&&n.leftKnee.rotation.set(l.leftKneeX,0,0),n.rightKnee&&n.rightKnee.rotation.set(l.rightKneeX,0,0),Ed(n,l.liftY);let c=.22+o*.35,h=a*.31%1>.96;n.leftEyelid.rotation.x=h?.14:-Math.PI*.52,n.rightEyelid.rotation.x=h?.14:-Math.PI*.52,n.mouthCavity.scale.set(1.15,.12+c*.45,.5),n.upperLip.position.y=n.mouthBaseY+c*.02,n.lowerLip.position.y=n.mouthBaseY-c*.04}function gr(n,e,t){let i=t+n.seedOffset;e.joints?iE(n,e,e.joints):(n.bodyPivot.position.x=e.hipOffsetX,n.bodyPivot.position.y=Math.max(0,e.hipBounceY),n.torsoGroup.position.y=n.baseTorsoY+Math.sin(i*3)*.012,n.torsoGroup.rotation.x=e.torsoTiltX,n.torsoGroup.rotation.z=e.torsoTiltZ,n.headPivot.rotation.z=e.headTiltZ,n.headPivot.rotation.y=e.headYawY,n.leftShoulder.rotation.set(-.22,.1,e.leftShoulderZ),n.leftElbow.rotation.set(-.18,0,e.leftElbowZ),n.rightShoulder.rotation.set(-.22,-.1,e.rightShoulderZ),n.rightElbow.rotation.set(-.18,0,e.rightElbowZ),n.turretGroup&&(n.turretGroup.rotation.y=e.headYawY*1.3)),n.propPivot&&(n.propPivot.rotation.z=e.joints?0:e.rightElbowZ*.5);let s=e.emotion??"happy",r=s==="surprised"?1.32:s==="angry"?1.15:1.05;n.leftSclera.scale.set(r,r*1.05,.6*r),n.rightSclera.scale.set(r,r*1.05,.6*r);let o=i*.31%1>.96;n.leftEyelid.rotation.x=o?.14:-Math.PI*.52,n.rightEyelid.rotation.x=o?.14:-Math.PI*.52;let a=e.mouthOpen??.25;n.mouthCavity.scale.set(1.15,.12+a*.45,.5),n.upperLip.position.y=n.mouthBaseY+a*.02,n.lowerLip.position.y=n.mouthBaseY-a*.04;let l=n.auraRing.material,c=n.auraDisc.material;l.opacity=.52+.14*Math.sin(i*5.2),c.opacity=.18}var Km=new L(0,-1,0),$m=new L(0,1,0),gd=new L(1,0,0),Er=new bt,Qm=new bt().setFromAxisAngle(gd,-.3),jm=new bt().setFromEuler(new Xt(-.1,0,-.18)),eE=new bt().setFromEuler(new Xt(-.1,0,.18)),tE=new bt().setFromEuler(new Xt(-.25,0,0)),ld=new bt,va=new bt,Cn=new bt,cd=new bt,wa=new bt,hd=new bt,Kt=new L,An=new L,Yn=new L,nn=new L,mr=new L,rc=new L,Ta=new pt,dd=new WeakMap;function nE(n){let e=dd.get(n);if(!e){let t=(i,s)=>{let r=s??i;if(!r)return null;let o=new _t;return o.position.set(0,s?-.323:-.39,.04),r.add(o),o};e={left:t(n.leftHip,n.leftKnee),right:t(n.rightHip,n.rightKnee)},dd.set(n,e)}return e}function Md(n,e,t){return e.getWorldQuaternion(t),n.root.getWorldQuaternion(ld).invert(),t.premultiply(ld)}function _a(n,e,t){t>=1?n.quaternion.copy(e):n.quaternion.slerp(e,t)}function gs(n,e,t,i,s){Md(n,e.parent,va).invert(),mr.copy(t).applyQuaternion(va),mr.y>.985&&(mr.x+=.07*i,mr.normalize()),Cn.setFromUnitVectors(Km,mr),_a(e,Cn,s)}function Ms(n,e,t){if(!n||!e)return!1;t.set(e.x-n.x,e.y-n.y,e.z-n.z);let i=t.length();return i<1e-4?!1:(t.divideScalar(i),!0)}function ud(n,e){let t=2*Math.acos(Math.min(1,Math.abs(n.w)));t<=e||(cd.copy(n),n.copy(Er).slerp(cd,e/t))}function ys(n,e,t){n&&n.quaternion.slerp(e,t)}function iE(n,e,t){let i=n.role==="CartoonTank",s=0;t.lHip&&t.rHip?s=Math.atan2(-(t.rHip.z-t.lHip.z),t.rHip.x-t.lHip.x):t.lShoulder&&t.rShoulder&&(s=Math.atan2(-(t.rShoulder.z-t.lShoulder.z),t.rShoulder.x-t.lShoulder.x)),s=Math.max(-1.3,Math.min(1.3,s))*(i?.6:1),n.bodyPivot.position.set(e.hipOffsetX,0,0),hd.setFromAxisAngle($m,s),n.bodyPivot.quaternion.slerp(hd,.8),n.torsoGroup.position.y=n.baseTorsoY;let r=!1;t.lShoulder&&t.rShoulder&&(Kt.set(t.rShoulder.x-t.lShoulder.x,t.rShoulder.y-t.lShoulder.y,t.rShoulder.z-t.lShoulder.z),t.lHip&&t.rHip?An.set((t.lShoulder.x+t.rShoulder.x-t.lHip.x-t.rHip.x)/2,(t.lShoulder.y+t.rShoulder.y-t.lHip.y-t.rHip.y)/2,(t.lShoulder.z+t.rShoulder.z-t.lHip.z-t.rHip.z)/2):An.set(0,1,0),Kt.lengthSq()>1e-6&&(Kt.normalize(),An.addScaledVector(Kt,-An.dot(Kt)),An.lengthSq()>1e-6&&(An.normalize(),Yn.crossVectors(Kt,An),Ta.makeBasis(Kt,An,Yn),wa.setFromRotationMatrix(Ta),Cn.copy(n.bodyPivot.quaternion).invert().multiply(wa),ud(Cn,i?.25:.8),_a(n.torsoGroup,Cn,.85),r=!0))),r||ys(n.torsoGroup,Er,.1);let o=!1;t.lEar&&t.rEar&&t.nose&&(Kt.set(t.rEar.x-t.lEar.x,t.rEar.y-t.lEar.y,t.rEar.z-t.lEar.z),Yn.set(t.nose.x-(t.lEar.x+t.rEar.x)/2,t.nose.y-(t.lEar.y+t.rEar.y)/2,t.nose.z-(t.lEar.z+t.rEar.z)/2),Kt.lengthSq()>1e-6&&(Kt.normalize(),Yn.addScaledVector(Kt,-Yn.dot(Kt)),Yn.lengthSq()>1e-6&&(Yn.normalize(),An.crossVectors(Yn,Kt),Ta.makeBasis(Kt,An,Yn),wa.setFromRotationMatrix(Ta).multiply(Qm),Md(n,n.headPivot.parent,va).invert(),Cn.copy(va).multiply(wa),ud(Cn,.75),_a(n.headPivot,Cn,.75),o=!0))),o||ys(n.headPivot,Er,.1);let a=(h,d,f,u,E,M,g)=>{Ms(f,u,nn)?(gs(n,h,nn,M,1),Ms(u,E,nn)?gs(n,d,nn,M,1):ys(d,Er,.15)):(ys(h,g,.12),ys(d,tE,.12))};a(n.leftShoulder,n.leftElbow,t.lShoulder,t.lElbow,t.lWrist,-1,jm),a(n.rightShoulder,n.rightElbow,t.rShoulder,t.rElbow,t.rWrist,1,eE);let l=Math.max(0,Math.min(.9,e.grooveBend??0)),c=(h,d,f,u,E,M)=>{if(h){if(d&&Ms(f,u,nn)){gs(n,h,nn,M,1),Ms(u,E,nn)?gs(n,d,nn,M,1):ys(d,Er,.2);return}if(!d&&(Ms(f,E,nn)||Ms(f,u,nn))){gs(n,h,nn,M,1);return}nn.set(M*.06,-Math.cos(l*.5),Math.sin(l*.5)).normalize(),gs(n,h,nn,M,.35),d&&(Cn.setFromAxisAngle(gd,l),_a(d,Cn,.35))}};c(n.leftHip,n.leftKnee,t.lHip,t.lKnee,t.lAnkle,-1),c(n.rightHip,n.rightKnee,t.rHip,t.rKnee,t.rAnkle,1),n.bodyPivot.scale.setScalar(n.restScale),Ed(n,e.liftY??0)}var Mr=class n extends m{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new Ht;let i=this,s=t.color!==void 0?new Ie(t.color):new Ie(8355711),r=t.textureWidth||512,o=t.textureHeight||512,a=t.clipBias||0,l=t.shader||n.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new ln,d=new L,f=new L,u=new L,E=new pt,M=new L(0,0,-1),g=new ft,p=new L,T=new L,y=new ft,x=new pt,S=this.camera,b=new hn(r,o,{samples:c,type:fi}),C=new Ut({name:l.name!==void 0?l.name:"unspecified",uniforms:pa.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});C.uniforms.tDiffuse.value=b.texture,C.uniforms.color.value=s,C.uniforms.textureMatrix.value=x,this.material=C,this.onBeforeRender=function(H,_,w){if(f.setFromMatrixPosition(i.matrixWorld),u.setFromMatrixPosition(w.matrixWorld),E.extractRotation(i.matrixWorld),d.set(0,0,1),d.applyMatrix4(E),p.subVectors(f,u),p.dot(d)>0===!0&&this.forceUpdate===!1)return;p.reflect(d).negate(),p.add(f),E.extractRotation(w.matrixWorld),M.set(0,0,-1),M.applyMatrix4(E),M.add(u),T.subVectors(f,M),T.reflect(d).negate(),T.add(f),S.position.copy(p),S.up.set(0,1,0),S.up.applyMatrix4(E),S.up.reflect(d),S.lookAt(T),S.far=w.far,S.updateMatrixWorld(),S.projectionMatrix.copy(w.projectionMatrix),x.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),x.multiply(S.projectionMatrix),x.multiply(S.matrixWorldInverse),x.multiply(i.matrixWorld),h.setFromNormalAndCoplanarPoint(d,f),h.applyMatrix4(S.matrixWorldInverse),g.set(h.normal.x,h.normal.y,h.normal.z,h.constant);let I=S.projectionMatrix;y.x=(Math.sign(g.x)+I.elements[8])/I.elements[0],y.y=(Math.sign(g.y)+I.elements[9])/I.elements[5],y.z=-1,y.w=(1+I.elements[10])/I.elements[14],g.multiplyScalar(2/g.dot(y)),I.elements[2]=g.x,I.elements[6]=g.y,I.elements[10]=g.z+1-a,I.elements[14]=g.w,i.visible=!1;let B=H.getRenderTarget(),F=H.xr.enabled,W=H.shadowMap.autoUpdate;H.xr.enabled=!1,H.shadowMap.autoUpdate=!1,H.setRenderTarget(b),H.state.buffers.depth.setMask(!0),H.autoClear===!1&&H.clear(),H.render(_,S),H.xr.enabled=F,H.shadowMap.autoUpdate=W,H.setRenderTarget(B);let Y=w.viewport;Y!==void 0&&H.state.viewport(Y),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return b},this.dispose=function(){b.dispose(),i.material.dispose()}}};Mr.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function sE(n){let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.fillStyle=n,t.fillRect(0,0,256,256);for(let s=0;s<420;s++)t.fillStyle=s%2===0?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",t.fillRect(s*73%256,s*137%256,3,3);t.strokeStyle="rgba(0,0,0,0.16)",t.lineWidth=3;for(let s=0;s<=256;s+=64)t.beginPath(),t.moveTo(s,0),t.lineTo(s,256),t.stroke(),t.beginPath(),t.moveTo(0,s),t.lineTo(256,s),t.stroke();let i=new Yt(e);return i.wrapS=Nn,i.wrapT=Nn,i.repeat.set(5,5),i.colorSpace=xt,i}function rE(n="#9a6234"){let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.fillStyle=n,t.fillRect(0,0,256,256);for(let s=0;s<256;s+=4)t.fillStyle=s%8===0?"rgba(60,30,10,0.12)":"rgba(255,220,175,0.06)",t.fillRect(0,s,256,2);let i=new Yt(e);return i.wrapS=Nn,i.wrapT=Nn,i.colorSpace=xt,i}function oE(){let n=document.createElement("canvas");n.width=256,n.height=256;let e=n.getContext("2d");e.fillStyle="#f8fafc",e.beginPath(),e.arc(128,128,122,0,Math.PI*2),e.fill(),e.strokeStyle="#334155",e.lineWidth=8,e.stroke(),e.fillStyle="#0f172a",e.font="bold 24px sans-serif",e.textAlign="center",e.textBaseline="middle";for(let i=1;i<=12;i++){let s=i/12*Math.PI*2-Math.PI/2;e.fillText(String(i),128+Math.cos(s)*90,128+Math.sin(s)*90)}e.strokeStyle="#0f172a",e.lineWidth=6,e.beginPath(),e.moveTo(128,128),e.lineTo(84,88),e.stroke(),e.lineWidth=4,e.beginPath(),e.moveTo(128,128),e.lineTo(186,98),e.stroke(),e.strokeStyle="#dc2626",e.lineWidth=2,e.beginPath(),e.moveTo(128,128),e.lineTo(175,165),e.stroke();let t=new Yt(n);return t.colorSpace=xt,t}function aE(){let n=document.createElement("canvas");n.width=512,n.height=256;let e=n.getContext("2d");e.fillStyle="#182420",e.fillRect(0,0,512,256);for(let i=0;i<18;i++)e.fillStyle="rgba(255,255,255,0.03)",e.beginPath(),e.arc(i*67%512,i*43%256,34,0,Math.PI*2),e.fill();e.strokeStyle="rgba(241,245,249,0.55)",e.lineWidth=3,e.beginPath(),e.moveTo(60,190),e.lineTo(150,190),e.lineTo(60,95),e.closePath(),e.stroke(),e.beginPath(),e.arc(380,130,48,0,Math.PI*2),e.stroke(),e.fillStyle="rgba(248,250,252,0.75)",e.font="bold 26px sans-serif",e.fillText("EXAM HALL \u2014 NO CHEATING",120,46);let t=new Yt(n);return t.colorSpace=xt,t}function lE(){let n=document.createElement("canvas");n.width=256,n.height=192;let e=n.getContext("2d");e.fillStyle="#4a321f",e.fillRect(0,0,256,192);let t=[[26,26,42,46,"#fde047"],[92,34,40,44,"#fef08a"],[164,24,44,48,"#bbf7d0"],[40,96,46,48,"#fed7aa"],[118,102,42,46,"#fde047"],[182,92,40,44,"#bfdbfe"]];for(let[s,r,o,a,l]of t)e.fillStyle=l,e.fillRect(s,r,o,a);let i=new Yt(n);return i.colorSpace=xt,i}function cE(n,e){let t=new te;t.position.set(e.x,e.y,e.z),t.rotation.y=e.rotY??0;let i=e.width??1.2,s=e.height??1;if(e.kind==="blackboard"){let r=new m(new z(i+.16,s+.16,.08),new A({color:6044193,roughness:.65}));t.add(r);let o=new m(new $e(i,s),new A({map:aE(),roughness:.92}));o.position.z=.045,t.add(o);let a=new m(new z(i+.16,.06,.14),new A({color:6044193,roughness:.65}));a.position.set(0,-s/2-.05,.05),t.add(a)}else if(e.kind==="clock"){let r=new m(new re(i*.52,i*.52,.06,28),new A({color:4674921,metalness:.5,roughness:.35}));r.rotation.x=Math.PI/2,t.add(r);let o=new m(new Mt(i*.48,28),new _e({map:oE()}));o.position.z=.035,t.add(o)}else if(e.kind==="portraitFrame"){let r=new m(new z(i+.08,s+.08,.05),new A({color:7028251,roughness:.55}));t.add(r);let o=new m(new $e(i,s),new A({color:e.color??"#cbd5e1",roughness:.8}));o.position.z=.03,t.add(o);let a=new m(new Mt(Math.min(i,s)*.22,16),new A({color:10105874,roughness:.7}));a.position.set(0,s*.06,.035),t.add(a)}else if(e.kind==="noticeBoard"){let r=new m(new z(i+.08,s+.08,.05),new A({color:3876374,roughness:.65}));t.add(r);let o=new m(new $e(i,s),new A({map:lE(),roughness:.9}));o.position.z=.03,t.add(o)}else if(e.kind==="window"){let r=new A({color:7877903,roughness:.55}),o=new m(new $e(i,s),new _e({color:16710083}));o.position.z=.01,t.add(o);let a=new m(new z(i+.1,.07,.08),r);a.position.y=s/2;let l=a.clone();l.position.y=-s/2;let c=new m(new z(.05,s,.07),r);t.add(a,l,c)}else if(e.kind==="door"){let r=new m(new z(i,s,.08),new A({color:e.color??"#94a3b8",roughness:.5}));t.add(r);let o=new m(new z(i+.12,s+.08,.05),new A({color:4674921,roughness:.6}));o.position.z=-.02,t.add(o)}n.add(t)}function hE(n,e,t){let i=new te;i.position.set(e.x,e.y??0,e.z),i.rotation.y=e.rotY??0;let s=new A({map:t,color:e.color??"#c88a55",roughness:.62}),r=new A({color:3359061,metalness:.55,roughness:.45}),o=e.width??1.1,a=e.height??.72,l=e.depth??.55;if(e.kind==="desk"||e.kind==="table"){let c=new m(new z(o,.05,l),s);c.position.y=a,c.castShadow=!0,c.receiveShadow=!0,i.add(c);let h=new m(new z(o-.08,.22,.04),s);h.position.set(0,a-.14,l/2-.06),i.add(h);let d=new z(.05,a,.05);for(let f of[-o/2+.06,o/2-.06])for(let u of[-l/2+.06,l/2-.06]){let E=new m(d,r);E.position.set(f,a/2,u),E.castShadow=!0,i.add(E)}}else if(e.kind==="bench"||e.kind==="chair"){let c=e.seatHeight??.42,h=new m(new z(o,.045,l),s);h.position.y=c,h.castShadow=!0,h.receiveShadow=!0,i.add(h);let d=new m(new z(o,.36,.04),s);d.position.set(0,c+.22,-l/2+.03),d.castShadow=!0,i.add(d);let f=new z(.045,c,.045);for(let u of[-o/2+.06,o/2-.06])for(let E of[-l/2+.06,l/2-.06]){let M=new m(f,r);M.position.set(u,c/2,E),i.add(M)}}else if(e.kind==="podium"){let c=new m(new z(o,a,l),s);c.position.y=a/2,c.castShadow=!0,c.receiveShadow=!0,i.add(c)}n.add(i)}function dE(n,e){let t=new te;t.position.set(e.x,e.y,e.z),t.rotation.y=e.rotY??0;let i=e.scale??1;if(t.scale.setScalar(i),e.kind==="examPaper"){let s=new m(new z(.24,.006,.3),new A({color:16317180,roughness:.9}));t.add(s)}else if(e.kind==="pen"){let s=new m(new re(.008,.006,.14,8),new A({color:e.color??"#0284c7",roughness:.4}));s.rotation.z=Math.PI/2,s.position.y=.01,t.add(s)}else if(e.kind==="book"){let s=new m(new z(.22,.04,.28),new A({color:e.color??"#1d4ed8",roughness:.7}));s.position.y=.02,t.add(s)}else if(e.kind==="duster"){let s=new m(new z(.14,.04,.06),new A({color:7877903,roughness:.8}));s.position.y=.02,t.add(s)}n.add(t)}function ac(n,e,t){let i=e.room??{},s=i.width??9.6,r=i.depth??8.4,o=i.height??3.6,a=-r/2,l=r/2,c=sE(i.floorColor??"#d6b4a1"),h=rE("#a86b3a"),d=new m(new $e(s,r),new A({map:c,roughness:.78}));d.rotation.x=-Math.PI/2,d.receiveShadow=!0,n.add(d);let f=new A({color:i.wallColor??"#dcd795",roughness:.88}),u=new A({color:i.wallTrimColor??"#a3a86b",roughness:.85}),E=new m(new $e(s,o),f);E.position.set(0,o/2,a),n.add(E);let M=new m(new $e(s,o),f);M.position.set(0,o/2,l),M.rotation.y=Math.PI,n.add(M);let g=new m(new $e(r,o),f);g.position.set(-s/2,o/2,0),g.rotation.y=Math.PI/2,n.add(g);let p=new m(new $e(r,o),f);p.position.set(s/2,o/2,0),p.rotation.y=-Math.PI/2,n.add(p);let T=new m(new z(s,.25,.04),u);T.position.set(0,.125,a+.02),n.add(T);let y=new m(new $e(s,r),new A({color:i.ceilingColor??"#b4c6b8",roughness:.92}));y.rotation.x=Math.PI/2,y.position.y=o,n.add(y);let x=new St(16776171,1.35,14);x.position.set(0,o-.35,0),n.add(x);for(let S of e.wallFixtures??[])cE(n,S);for(let S of e.furniture??[])hE(n,S,h);for(let S of e.props??[])dE(n,S);e.spots&&Object.assign(t,e.spots)}function yd(){let n=[{id:"teacher_podium",kind:"podium",x:.85,z:-2.05,width:1.05,height:.84,depth:.62,color:"#8b4513"}],e=[{kind:"book",x:.72,y:.85,z:-2.02,rotY:.15,color:"#991b1b"},{kind:"duster",x:1.1,y:.85,z:-2.05,rotY:-.2}],t=[-1.55,1.35],i=[-.45,1.05,2.55],s={teacher_podium:{x:.15,y:0,z:-2.55,rotY:.05,pose:"standing"},teacher_aisle:{x:-.1,y:0,z:-1.35,rotY:0,pose:"standing"},door_exit:{x:4.1,y:1.15,z:-4.05,rotY:Math.PI,pose:"standing"}},r=1;return i.forEach((o,a)=>{t.forEach((l,c)=>{n.push({id:`desk_r${a}_c${c}`,kind:"desk",x:l,z:o,width:1.5,height:.72,depth:.56,color:"#b4743e"}),n.push({id:`bench_r${a}_c${c}`,kind:"bench",x:l,z:o+.52,rotY:Math.PI,width:1.5,depth:.42,seatHeight:.42,color:"#b4743e"});for(let h of[-.38,.38])e.push({kind:"examPaper",x:l+h,y:.73,z:o+.04,rotY:h*.12}),e.push({kind:"pen",x:l+h+.16,y:.73,z:o+.02,rotY:.4}),s[`student_${r}`]={x:l+h,y:0,z:o+.38,rotY:Math.PI,pose:"sitting",seatHeight:.42},r++})}),i.forEach((o,a)=>{s[`aisle_r${a}_faceLeft`]={x:-.32,y:0,z:o+.42,rotY:-Math.PI/2,pose:"standing"},s[`aisle_r${a}_faceRight`]={x:.12,y:0,z:o+.42,rotY:Math.PI/2,pose:"standing"},s[`aisle_r${a}_faceFront`]={x:-.1,y:0,z:o+.42,rotY:Math.PI,pose:"standing"}}),s.door_inside={x:3.55,y:0,z:-3.2,rotY:-.8,pose:"standing"},s.front_center={x:-.1,y:0,z:-1.75,rotY:0,pose:"standing"},s.student_front_left=s.student_1,s.student_front_right=s.student_2,s.student_side_left=s.student_3,s.student_side_right=s.student_4,s.student_back_left=s.student_5,s.student_back_right=s.student_6,{room:{width:9.6,depth:8.4,height:3.6,floorColor:"#caa594",floorPattern:"tiles",wallColor:"#dcd795",wallTrimColor:"#a3a86b",ceilingColor:"#9fb4a6"},wallFixtures:[{kind:"blackboard",x:-.35,y:1.85,z:-4.16,width:4,height:1.55},{kind:"clock",x:-2.05,y:2.95,z:-4.15,width:.62,height:.62},{kind:"portraitFrame",x:-.75,y:2.98,z:-4.15,width:.48,height:.62,color:"#fde68a"},{kind:"portraitFrame",x:.05,y:2.98,z:-4.15,width:.48,height:.62,color:"#e2e8f0"},{kind:"noticeBoard",x:2.45,y:2.05,z:-4.16,width:1.35,height:1.05},{kind:"door",x:4.1,y:1.25,z:-4.15,width:1.15,height:2.45,color:"#cbd5e1"},{kind:"window",x:-4.76,y:1.95,z:-1.4,rotY:Math.PI/2,width:1.5,height:1.3},{kind:"window",x:-4.76,y:1.95,z:1.3,rotY:Math.PI/2,width:1.5,height:1.3}],furniture:n,props:e,spots:s}}function xd(n){let e=new A({color:16236088,metalness:.85,roughness:.2}),t=new te;t.visible=!1;let i=new A({color:1976635,roughness:.35,metalness:.25}),s=new A({color:14251782,emissive:7877903,emissiveIntensity:.35}),r=new _e({color:16707722}),o=new _e({color:16777215}),a=new _e({color:15680580}),l=[],c=[{side:-1,z:.36,scale:1.05,phase:0},{side:1,z:.28,scale:.96,phase:1.9},{side:-1,z:-.18,scale:1.15,phase:3.4}];for(let le of c){let He=new te;He.position.set(le.side*1.15,0,le.z),He.scale.setScalar(le.scale);let ne=new Jt([new L(-le.side*.26,.05,-.1),new L(0,.07,.16),new L(le.side*.22,.08,-.08),new L(0,.16,-.12),new L(0,.42,.02)]),ge=new m(new dn(ne,22,.052,10,!1),i);ge.castShadow=!0,He.add(ge);let pe=new te;pe.position.set(0,.42,.02);let xe=new m(new re(.048,.062,.44,10),i);xe.position.y=.2,pe.add(xe);let G=new m(new ie(.16,14,10),i);G.scale.set(1.28,1.48,.38),G.position.set(0,.44,.02),G.castShadow=!0,pe.add(G);let he=new m(new Ne(.08,.015,6,14),s);he.position.set(0,.44,-.04),pe.add(he);let k=new m(new ie(.082,12,10),i);k.scale.set(1.05,.72,1.45),k.position.set(0,.56,.11),pe.add(k);for(let we of[-1,1]){let Ye=new m(new ie(.022,8,6),r);Ye.position.set(we*.048,.58,.19),pe.add(Ye);let Ue=new m(new Xe(.01,.045,5),o);Ue.rotation.x=Math.PI,Ue.position.set(we*.028,.5,.21),pe.add(Ue)}let Be=new m(new z(.016,.008,.12),a);Be.position.set(0,.52,.27),pe.add(Be),He.add(pe),He.rotation.y=-le.side*.95,t.add(He),l.push({root:He,neckPivot:pe,sideSign:le.side,phase:le.phase})}n.add(t);let h=new te;h.visible=!1;let d=new A({color:5396582,roughness:.78}),f=new A({color:3883085,roughness:.84}),u=new A({color:12131356,roughness:.52}),E=new A({color:16776171,roughness:.22}),M=new m(new ie(.56,20,16),d);M.scale.set(1.38,1.05,.96),M.position.set(0,.96,0),M.castShadow=!0,h.add(M);let g=new m(new re(.58,.62,.65,16,1,!1,-Math.PI*.45,Math.PI*.9),u);g.rotation.z=Math.PI/2,g.position.set(0,1.02,0),h.add(g);let p=new m(new z(.76,.08,1.12),e);p.position.set(0,.74,0),h.add(p);let T=[];for(let[le,He]of[[-.44,-.28],[-.44,.28],[.42,-.28],[.42,.28]]){let ne=new m(new re(.145,.165,.74,12),f);ne.position.set(le,.37,He),ne.castShadow=!0;let ge=new m(new Ne(.165,.022,6,14),e);ge.rotation.x=Math.PI/2,ge.position.y=-.28,ne.add(ge),h.add(ne),T.push(ne)}let y=new te;y.position.set(.78,1.18,0),h.add(y);let x=new m(new ie(.38,18,14),d);x.scale.set(1.06,1.15,.96),x.castShadow=!0,y.add(x);let S=new m(new z(.28,.42,.42),e);S.position.set(.24,.06,0),S.rotation.z=-.22,y.add(S);let b=new m(new Xe(.12,.28,12),e);b.position.set(.06,.46,0),y.add(b);for(let le of[-1,1]){let He=new m(new ie(.042,8,6),r);He.position.set(.28,.08,le*.24),y.add(He)}let C=[];for(let le of[-1,1]){let He=new m(new ie(.32,12,10),f);He.scale.set(.18,1.12,.92),He.position.set(-.08,.02,le*.42),He.rotation.y=le*.35,y.add(He),C.push(He);let ne=new Jt([new L(.24,-.18,le*.16),new L(.56,-.26,le*.2),new L(.76,-.05,le*.18)]),ge=new m(new dn(ne,14,.036,8,!1),E);ge.castShadow=!0,y.add(ge)}let H=new te;H.position.set(.34,-.1,0);let _=new Jt([new L(0,0,0),new L(.24,-.28,0),new L(.36,-.62,0),new L(.52,-.58,0)]),w=new m(new dn(_,18,.085,10,!1),d);w.castShadow=!0,H.add(w),y.add(H);let P=new m(new re(.022,.015,.55,6),f);P.position.set(-.76,.72,0),P.rotation.z=-.35,h.add(P),h.position.set(-1.35,0,.12),n.add(h);let I=new te;I.visible=!1,I.position.set(0,0,.16);let B=new A({color:7893356,roughness:.85}),F=new A({color:16347926,emissive:14427686,emissiveIntensity:1.4,roughness:.4}),W=new m(new Ne(.95,.12,8,28),B);W.rotation.x=Math.PI/2,W.position.y=.08,W.castShadow=!0,I.add(W);let Y=new m(new re(.9,.94,.1,24),F);Y.position.y=.05,I.add(Y);let Q=[];for(let le=0;le<16;le++){let He=le/16*Math.PI*2,ne=Math.sin(He)>.2,ge=ne?1.02:le%2===0?.88:1.08,pe=ne?.28+le%3*.08:.95+le%4*.25,xe=new _e({color:le%3===0?16707722:le%2===0?16347926:15680580,transparent:!0,opacity:ne?.65:.84,depthWrite:!1}),G=new m(new Xe(ne?.14:.2+le%3*.05,pe,7),xe);G.position.set(Math.cos(He)*ge,pe*.5+.06,Math.sin(He)*ge),I.add(G),Q.push({mesh:G,baseH:pe,phase:le*.85,radius:ge,angle:He})}let N=new St(16743196,0,8.5,1.5);N.position.set(0,1.45,.45),I.add(N),n.add(I);let ee=new te;ee.visible=!1;let $=new A({color:4674921,roughness:.92});for(let[le,He,ne,ge]of[[-1.3,.22,-.35,1.1],[1.25,.16,-.25,.95],[0,.1,-.65,1.35]]){let pe=new m(new li(.45*ge,0),$);pe.position.set(le,He,ne),pe.scale.set(1.4,.75,1.1),ee.add(pe)}let fe=[],be=new _e({color:14742270,transparent:!0,opacity:.32,depthWrite:!1});for(let le=0;le<6;le++){let He=new m(new ie(.48,12,10),be);He.scale.set(1.9,.42,1.3),He.position.set((le-2.5)*.85,.14+le%2*.12,.25-le%3*.35),ee.add(He),fe.push(He)}n.add(ee);let Re=new te;Re.visible=!1;let K=new _e({color:16638023,transparent:!0,opacity:.2,side:ct,depthWrite:!1}),ae=new m(new ie(.58,24,18),K);ae.scale.set(1,1.35,1),ae.position.y=.78,Re.add(ae);let Ee=new _e({color:16498468,transparent:!0,opacity:.72,side:ct,depthWrite:!1}),me=new m(new Ne(.62,.024,8,36),Ee);me.rotation.x=Math.PI/2,me.position.y=.1,Re.add(me);for(let le=0;le<8;le++){let He=le/8*Math.PI*2,ne=new m(new ie(.14,10,8),new A({color:16020150,emissive:16498468,emissiveIntensity:.4}));ne.scale.set(1.1,.38,1.8),ne.position.set(Math.cos(He)*.42,.08,Math.sin(He)*.42),ne.rotation.y=-He+Math.PI/2,Re.add(ne)}return n.add(Re),{serpentGroup:t,cobras:l,elephantGroup:h,elephantTrunk:H,elephantHead:y,elephantEars:C,elephantLegs:T,fireTrialGroup:I,flames:Q,fireLight:N,cliffGroup:ee,cliffClouds:fe,devoteeShieldGroup:Re,shieldDome:ae,shieldRing:me}}function wd(n,e,t,i,s){let r=t!=="none";if(n.devoteeShieldGroup.visible=r,r){n.devoteeShieldGroup.position.set(i,0,.16),n.shieldRing.rotation.z=e*1.4;let o=.96+Math.sin(e*5)*.05;n.shieldDome.scale.setScalar(o)}if(n.serpentGroup.visible=t==="serpentAttack",t==="serpentAttack"&&n.cobras.forEach(o=>{let a=Math.max(0,Math.sin(e*4.2+o.phase)),l=Math.exp(-Math.pow(a-.85,2)*8)*.24;o.root.position.x=i+o.sideSign*(.98-a*.16+l),o.neckPivot.rotation.x=.38*a-.18,o.neckPivot.rotation.z=Math.sin(e*7.5+o.phase)*.14}),n.elephantGroup.visible=t==="elephantCharge",t==="elephantCharge"){let o=i>=0?1:-1,a=i-o*(1.75-Math.min(1,s*1.6)*.65);n.elephantGroup.position.x=a,n.elephantGroup.rotation.y=o>=0?0:Math.PI;let l=Math.sin(e*8.5)*(s<.65?.25:.05);n.elephantLegs.forEach((h,d)=>{h.rotation.z=(d%2===0?1:-1)*l}),n.elephantEars.forEach((h,d)=>{h.rotation.y=(d===0?-1:1)*(.35+Math.sin(e*6)*.25)});let c=s>.45?Math.min(1,(s-.45)*2.4)*.65:Math.sin(e*4.5)*.18;n.elephantTrunk.rotation.z=c,n.elephantHead.rotation.z=Math.sin(e*3.5)*.08}n.fireTrialGroup.visible=t==="fireTrial",n.fireLight.intensity=t==="fireTrial"?3.2+Math.sin(e*14)*.7:0,t==="fireTrial"&&(n.fireTrialGroup.position.x=0,n.flames.forEach(o=>{let a=.8+.32*Math.sin(e*13.5+o.phase);o.mesh.scale.set(.92+.12*Math.cos(e*9+o.phase),a,1),o.mesh.position.y=o.baseH*a*.5+.05,o.mesh.position.x=Math.cos(o.angle)*o.radius,o.mesh.position.z=Math.sin(o.angle)*o.radius})),n.cliffGroup.visible=t==="cliffRescue",t==="cliffRescue"&&n.cliffClouds.forEach((o,a)=>{o.position.x=(a-2.5)*.85+Math.sin(e*1.4+a)*.22})}function Td(n){let e=new te;e.visible=!1;let t=new A({color:16317180,roughness:.78}),i=new A({color:16708551,roughness:.72}),s=new A({color:16096779,roughness:.55}),r=new A({color:15357964,roughness:.58}),o=new A({color:14251782,metalness:.75,roughness:.25}),a=new m(new z(1.56,.12,.86),t);a.position.set(.08,.06,.25),a.receiveShadow=!0,e.add(a);let l=new m(new z(.36,.14,.62),i);l.position.set(-.44,.18,.25),l.castShadow=!0,e.add(l);let c=new m(new re(.08,.1,.05,12),o);c.position.set(-.68,.025,.56),e.add(c);let h=new m(new re(.008,.008,.24,6),new A({color:4140577}));h.position.set(-.68,.15,.56),h.rotation.z=-.15,e.add(h);let d=new m(new ie(.016,8,6),new _e({color:16347926}));d.position.set(-.66,.265,.56),e.add(d);let f=new te,u=new m(new re(.3,.27,1.04,18,1,!1,-Math.PI*.5,Math.PI),t);u.rotation.z=-Math.PI/2,u.scale.set(.92,1,1.15),u.position.set(.24,.26,.25),u.castShadow=!0,f.add(u);let E=new m(new z(1.06,.24,.64),t);E.position.set(.24,.22,.25),f.add(E);let M=new te;for(let v=0;v<9;v++){let V=(v-4)/4,se=new m(new ie(.044,8,6),v%2===0?s:r);se.position.set(.14+Math.abs(V)*.14,.54-Math.abs(V)*.1,.25+V*.22),M.add(se)}f.add(M),e.add(f),n.add(e);let g=new te;g.position.set(0,2.22,-1.16),g.visible=!1;let p=new m(new Mt(.72,32),new _e({color:988970,transparent:!0,opacity:.84}));p.position.z=-.18,g.add(p);let T=new m(new Ne(.74,.04,12,40),new _e({color:16436245}));T.position.z=-.16,g.add(T);let y=()=>{let v=new te;return v.visible=!1,g.add(v),v},x=y(),S=new A({color:4674921,metalness:.4,roughness:.5});for(let v of[-.36,.36]){let V=new m(new re(.032,.036,.65,8),S);V.position.set(v,-.05,0),x.add(V)}let b=new m(new Ne(.36,.025,8,20,Math.PI*.72),new A({color:1120295,roughness:.7}));b.position.set(0,.25,0),b.rotation.z=Math.PI*1.14,x.add(b);let C=new m(new re(.024,.024,.16,8),new A({color:14251782,metalness:.85,roughness:.2}));C.rotation.z=Math.PI/2,C.position.set(0,-.08,.04),x.add(C);let H=[],_=new _e({color:3718648}),w=new _e({color:16707722});for(let v=0;v<6;v++){let V=new m(new Rt(.058,0),v%2===0?w:_);x.add(V),H.push(V)}let P=y(),I=new te;I.position.set(-.22,-.08,0);let B=new m(new z(.36,.34,.32),new A({color:16347926,roughness:.45}));B.position.y=.08,I.add(B);let F=new m(new z(.3,.13,.34),new _e({color:12248829}));F.position.set(0,.15,.01),I.add(F);for(let v of[-.11,.11]){let V=new m(new ie(.036,8,6),w);V.position.set(v,-.02,.17),I.add(V)}let W=new m(new z(.4,.4,.32),new A({color:15381256,roughness:.55}));W.position.set(-.18,.12,-.18),I.add(W),P.add(I);let Y=new te;Y.position.set(.28,-.12,.14);let Q=new m(new z(.24,.16,.24),new A({color:1483594,roughness:.45}));Y.add(Q);let N=new m(new Xe(.18,.18,4),new A({color:16436245,roughness:.5}));N.rotation.y=Math.PI/4,N.position.y=.16,Y.add(N),P.add(Y);let ee=y(),$=new A({color:165063,roughness:.4}),fe=new m(new re(.24,.24,.48,18),$);fe.position.set(.06,.04,0),ee.add(fe);for(let v of[-.08,.04,.16]){let V=new m(new Ne(.245,.014,8,20),$);V.rotation.x=Math.PI/2,V.position.set(.06,v,0),ee.add(V)}let be=new m(new re(.12,.12,.05,12),new A({color:988970}));be.position.set(.06,.3,0),ee.add(be);let Re=new m(new Mt(.4,20),new _e({color:8246268,transparent:!0,opacity:.85}));Re.rotation.x=-Math.PI/2,Re.position.set(0,-.24,0),ee.add(Re);for(let v of[-.3,-.18]){let V=new m(new re(.015,.015,.56,8),S);V.position.set(v,-.02,.08),V.rotation.z=-.24,ee.add(V)}let K=y(),ae=new m(new re(.46,.46,.06,20),new A({color:3359061,roughness:.8}));ae.position.set(0,-.22,0),K.add(ae);let Ee=new m(new Mt(.28,20),new _e({color:132631}));Ee.rotation.x=-Math.PI/2,Ee.position.set(0,-.185,0),K.add(Ee);for(let v of[-.32,.32]){let V=new m(new Xe(.085,.24,12),r);V.position.set(v,-.06,.12),K.add(V);let se=new m(new Ne(.055,.012,6,12),new _e({color:16777215}));se.rotation.x=Math.PI/2,se.position.set(v,-.06,.12),K.add(se)}let me=y(),le=new A({color:1483594,roughness:.35}),He=new A({color:16638023,roughness:.45}),ne=[];for(let v=0;v<8;v++){let V=.075-v*.0055,se=new m(new ie(Math.max(.025,V),10,8),v%2===0?le:He);me.add(se),ne.push(se)}let ge=new m(new ie(.11,12,10),le);ge.scale.set(1.25,1.35,.65),ge.position.set(-.24,.16,.08),me.add(ge);for(let v of[-.048,.048]){let V=new m(new ie(.032,8,6),new _e({color:16777215}));V.position.set(v,.04,.09),ge.add(V);let se=new m(new ie(.016,6,6),new _e({color:593174}));se.position.set(v,.04,.115),ge.add(se)}let pe=new m(new z(.018,.01,.14),new _e({color:15680580}));pe.position.set(-.24,.12,.22),me.add(pe),ne.push(ge);let xe=y(),G=new m(new re(.32,.26,.04,24),new A({color:14870768,metalness:.85,roughness:.2}));G.position.set(-.08,-.14,.04),xe.add(G);let he=new m(new ie(.11,14,10),s);he.position.set(-.08,-.02,.06),xe.add(he);let k=new m(new re(.09,.065,.28,16),new A({color:3718648,transparent:!0,opacity:.78,roughness:.15}));k.position.set(.28,-.02,.08),xe.add(k);let Be=y(),we=new m(new z(.28,.48,.045),new A({color:988970,roughness:.3}));we.rotation.z=-.12,Be.add(we);let Ye=new _e({color:3718648}),Ue=new m(new $e(.24,.42),Ye);Ue.position.set(0,0,.026),Ue.rotation.z=-.12,Be.add(Ue);let D=new m(new ie(.11,12,10),w);return D.position.set(-.32,.24,-.05),Be.add(D),n.add(g),{funeralGroup:e,shroudMesh:f,shroudGarland:M,bubbleGroup:g,hazards:{wireSpark:x,truckRickshaw:P,waterTank:ee,roadPit:K,giantSnake:me,chokeFood:xe,nightPhone:Be},wireSparks:H,truckGroup:I,rickshawGroup:Y,snakeBody:ne,snakeTongue:pe,phoneGlowMat:Ye}}function _d(n,e,t,i,s,r){if(n.funeralGroup.visible=t,n.shroudMesh.visible=t&&!i,s==="none"){n.bubbleGroup.visible=!1;return}n.bubbleGroup.visible=!0,n.bubbleGroup.position.y=2.22+Math.sin(e*3.2)*.045;let o=r<.16?.65+r/.16*.38:1+Math.sin(e*5)*.025;n.bubbleGroup.scale.setScalar(o);for(let[a,l]of Object.entries(n.hazards))l.visible=a===s;s==="wireSpark"?n.wireSparks.forEach((a,l)=>{let c=e*9+l/n.wireSparks.length*Math.PI*2,h=.08+(e*3.2+l*.2)%.22;a.position.set(Math.cos(c)*h,-.08+Math.sin(c)*h,.06),a.scale.setScalar(.65+.55*Math.abs(Math.sin(e*22+l)))}):s==="truckRickshaw"&&n.truckGroup&&n.rickshawGroup?(n.truckGroup.position.y=-.08+Math.abs(Math.sin(e*14))*.022,n.rickshawGroup.position.y=-.12+Math.abs(Math.sin(e*16+.8))*.028,n.truckGroup.rotation.y=Math.sin(e*2.5)*.15,n.rickshawGroup.rotation.y=Math.sin(e*2.5)*.15):s==="giantSnake"?(n.snakeBody.forEach((a,l)=>{if(l===n.snakeBody.length-1)a.position.set(-.22,.14+Math.sin(e*5.2)*.04,.08),a.rotation.z=Math.sin(e*4.2)*.14;else{let c=-.14+l*.068,h=-.12+Math.sin(e*6-l*.7)*.075,d=Math.cos(e*6-l*.7)*.1;a.position.set(c,h,d)}}),n.snakeTongue&&(n.snakeTongue.visible=Math.sin(e*14)>0,n.snakeTongue.position.y=.1+Math.sin(e*5.2)*.04)):s==="nightPhone"&&n.phoneGlowMat&&n.phoneGlowMat.color.setHex(Math.sin(e*8)>0?3718648:8246268)}function uE(n,e){let t=new Ie(e.topBackdropHex),i=new Ie(e.midBackdropHex),s=new Ie(e.botBackdropHex);return n==="Night"?(t.lerp(new Ie(1448251),.58),i.lerp(new Ie(3482974),.58),s.lerp(new Ie(2495785),.58),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:15127807,sunIntensity:1.48,fogDensity:.024}):n==="Sunset"?(t.lerp(new Ie(2756672),.68),i.lerp(new Ie(14242598),.68),s.lerp(new Ie(3805978),.62),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16752196,sunIntensity:1.92,fogDensity:.036}):n==="Day"?(t.lerp(new Ie(3718648),.55),i.lerp(new Ie(9684477),.55),s.lerp(new Ie(1981023),.55),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16774624,sunIntensity:2,fogDensity:.025}):(t.lerp(new Ie(1970486),.48),i.lerp(new Ie(12076580),.42),s.lerp(new Ie(1707800),.48),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16764807,sunIntensity:1.85,fogDensity:.036})}function Nt(n,e,t,i,s,r,o){let a=new A({color:14251782,metalness:.8,roughness:.25}),l=new m(new Xe(.11,.07,14),a);l.rotation.x=Math.PI,l.position.set(e,t+.035,i),n.add(l);let c=new m(new Xe(.032,.1,10),new _e({color:16768875}));c.position.set(e,t+.11,i),n.add(c);let h=new m(new ie(.11,10,8),new _e({color:16752412,transparent:!0,opacity:.3,depthWrite:!1}));if(h.position.set(e,t+.11,i),n.add(h),r.animatedProps.push({object:c,kind:"diya",baseY:t+.11,phase:s,speed:7.5}),o){let d=new St(16752440,1.4,5.5,1.6);d.position.set(e,t+.22,i),n.add(d),r.ambientFireLights.push({light:d,baseIntensity:1.4,phase:s})}}function pi(n,e,t,i,s,r,o){let a=new te;a.position.set(e,0,t);let l=new A({color:4861725,roughness:.85}),c=new m(new re(.08*i,.15*i,1.5*i,10),l);c.position.y=.75*i,c.castShadow=!0,a.add(c);let h=new A({color:s,roughness:.72}),d=[[0,1.65,0,.65],[-.36,1.42,.15,.48],[.38,1.45,-.1,.48],[0,1.95,.08,.44]];for(let[f,u,E,M]of d){let g=new m(new js(M*i,1),h);g.position.set(f*i,u*i,E*i),g.castShadow=!0,g.receiveShadow=!0,a.add(g)}n.add(a),o.animatedProps.push({object:a,kind:"sway",baseRotZ:0,phase:r,speed:1.1})}function fE(n,e){let t=new A({color:10380100,roughness:.68}),i=new A({color:15261649,roughness:.42,metalness:.08}),s=new A({color:16172100,metalness:.85,roughness:.22}),r=new A({color:2278750,roughness:.45}),o=new m(new re(5.6,5.9,.26,36),t);o.position.y=-.13,o.receiveShadow=!0,n.add(o);let a=new m(new Tn(1.38,1.56,48),new _e({color:16172100,transparent:!0,opacity:.58,side:ct}));a.rotation.x=-Math.PI/2,a.position.y=.012,n.add(a);for(let I of[-2.45,-1.68,1.68,2.45]){let B=Math.abs(I)>2?-1.45:-2.45,F=new m(new z(.42,.26,.42),s);F.position.set(I,.13,B),n.add(F);let W=new m(new re(.15,.19,3.55,14),t);W.position.set(I,1.88,B),W.castShadow=!0,W.receiveShadow=!0,n.add(W);let Y=new m(new re(.27,.18,.22,14),s);Y.position.set(I,3.56,B),n.add(Y)}let l=new m(new Ne(1.75,.085,10,32,Math.PI),s);l.position.set(0,2.55,-2.35),n.add(l);let c=new m(new z(1.75,.95,1.55),t);c.position.set(0,.48,-4.45),n.add(c);for(let I=0;I<3;I++){let B=1.42-I*.28,F=new m(new z(B,.48,B),I===2?s:t);F.position.set(0,1.15+I*.46,-4.45),n.add(F)}let h=new m(new ie(.19,12,10),s);h.position.set(0,2.48,-4.45),n.add(h);let d=new m(new Xe(.09,.28,12),s);d.position.set(0,2.74,-4.45),n.add(d);for(let I of[-1.42,1.42]){let B=new m(new re(.032,.075,1.05,10),s);B.position.set(I,.52,-.88),n.add(B),Nt(n,I,1.04,-.88,I>0?1.4:.3,e,!0)}for(let[I,B]of[[-1.35,0],[1.35,1.3]]){let F=new te;F.position.set(I,3.35,-.6);let W=new m(new re(.014,.014,.65,8),s);W.position.y=-.32,F.add(W);let Y=new m(new Xe(.16,.25,16,1,!0),s);Y.position.y=-.72,Y.castShadow=!0,F.add(Y),n.add(F),e.animatedProps.push({object:F,kind:"bell",baseRotZ:0,phase:B,speed:1.5})}let f=new te;f.position.set(0,1.92,-3.05);let u=new m(new Ne(1.18,.028,10,48),s),E=new m(new Ne(.84,.024,10,36),s);f.add(u,E),n.add(f),e.animatedProps.push({object:u,kind:"ring",phase:0,speed:.35}),e.animatedProps.push({object:E,kind:"ring",phase:1.4,speed:-.52}),Nt(n,-1.12,0,-.45,.2,e,!0),Nt(n,1.12,0,-.45,1.9,e,!0),Nt(n,-.52,0,-1.05,3.1,e,!1),Nt(n,.52,0,-1.05,4.4,e,!1);let M=new te;M.position.set(0,.14,-1.32);let g=new A({color:2500922,metalness:.42,roughness:.18}),p=new m(new re(.56,.64,.14,24),i);p.position.y=-.07,M.add(p);let T=new m(new re(.4,.48,.26,24),i);T.position.y=.13,T.castShadow=!0,T.receiveShadow=!0,M.add(T);let y=new m(new Ne(.32,.055,10,24),s);y.rotation.x=Math.PI/2,y.position.y=.27,M.add(y);let x=new m(new lt(.17,.4,12,20),g);x.position.y=.54,x.castShadow=!0,M.add(x);let S=new m(new re(.025,.032,.88,10),s);S.position.set(0,.54,-.22),M.add(S);let b=new m(new ie(.2,14,10),s);b.scale.set(1.25,.72,.42),b.position.set(0,.98,-.1),b.rotation.x=.35,M.add(b);for(let I of[.58,.62,.66]){let B=new m(new z(.16,.016,.022),new _e({color:16708551}));B.position.set(0,I,.165),M.add(B)}let C=new A({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.26}),H=new A({color:16020150,emissive:14362487,emissiveIntensity:.3,roughness:.32});for(let I=0;I<14;I++){let B=I/14*Math.PI*2,F=new m(new ie(I%2===0?.068:.06,8,6),I%2===0?C:H);F.position.set(Math.cos(B)*.3,.31,Math.sin(B)*.3),M.add(F)}let _=new m(new Rt(.09,1),C);_.scale.set(1.25,.55,1.25),_.position.set(0,.77,0),M.add(_);let w=new m(new ie(.055,8,6),r);w.scale.set(1.2,.35,1.2),w.position.set(.08,.76,.06),M.add(w);for(let I of[-.58,.58]){let B=new m(new re(.24,.18,.045,20),s);B.position.set(I,-.1,.24),M.add(B);for(let F=0;F<7;F++){let W=F/7*Math.PI*2,Y=F===0?0:.12,Q=F===0?.04:0,N=new m(new Rt(.068,1),F%2===0?C:H);N.scale.set(1.2,.62,1.2),N.position.set(I+Math.cos(W)*Y,-.04+Q,.24+Math.sin(W)*Y),M.add(N)}}let P=new St(16763750,2.35,6.2,1.4);P.position.set(0,1.25,.45),M.add(P),n.add(M)}function pE(n,e){let t=new A({color:2507300,roughness:.92}),i=new m(new Mt(9,40),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new te;s.position.set(.1,0,-3.2);let r=new m(new re(.95,1,1.05,18),new A({color:10251846,roughness:.85}));r.position.y=.52,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new m(new Xe(1.38,.95,20),new A({color:12558414,roughness:.9}));o.position.y=1.42,o.castShadow=!0,s.add(o);let a=new m(new $e(.42,.65),new _e({color:16758605}));a.position.set(0,.34,.96),s.add(a),n.add(s),pi(n,-2.1,-1.8,1.45,3108407,.3,e),pi(n,2.2,-1.9,1.38,3635775,1.6,e),pi(n,-1.65,-3.9,1.65,2314793,2.8,e),pi(n,1.75,-4.1,1.55,2711344,4.1,e),Nt(n,0,0,-1.4,.5,e,!0)}function mE(n,e){let t=new A({color:10186830,roughness:.72}),i=new A({color:16096779,metalness:.78,roughness:.28}),s=new m(new z(8.5,.3,2.2),t);s.position.set(0,-.15,.1),s.receiveShadow=!0,n.add(s);let r=new m(new z(8.5,.16,.6),t);r.position.set(0,-.16,-1.25),n.add(r);let o=new m(new z(8.5,.12,.55),t);o.position.set(0,-.22,-1.75),n.add(o);for(let c of[-2.4,2.4]){let h=new m(new re(.14,.17,2.45,12),t);h.position.set(c,1.15,-2.1),n.add(h);let d=new m(new Xe(.42,.55,12),i);d.position.set(c,2.55,-2.1),n.add(d)}let a=new A({color:1994655,emissive:799826,emissiveIntensity:.45,metalness:.72,roughness:.18}),l=new m(new $e(20,11,24,16),a);l.rotation.x=-Math.PI/2,l.position.set(0,-.09,-7.2),l.receiveShadow=!0,n.add(l),e.animatedProps.push({object:l,kind:"water",phase:0,speed:1.8}),Nt(n,-1.2,0,-.65,.4,e,!0),Nt(n,1.2,0,-.65,2.1,e,!0),Nt(n,-.75,-.07,-2.4,3.4,e,!1),Nt(n,.85,-.07,-3.1,4.9,e,!1),Nt(n,-.15,-.07,-3.8,1.5,e,!1),Nt(n,1.45,-.07,-4.4,5.2,e,!1)}function EE(n,e,t){let i=new A({color:1053482,metalness:.7,roughness:.24}),s=new m(new re(5.5,5.5,.2,48),i);s.position.y=-.1,s.receiveShadow=!0,n.add(s);let r=new _e({color:t,transparent:!0,opacity:.75}),o=new A({color:16498468,metalness:.85,roughness:.2}),a=new te;a.position.set(0,2.05,-3.3);let l=new m(new Ne(1.58,.032,10,64),o),c=new m(new Ne(1.16,.026,10,48),r),h=new m(new Ne(.76,.022,10,48),o);c.rotation.x=.7,h.rotation.y=.55;let d=new m(new ie(.28,20,16),new _e({color:16638023}));a.add(l,c,h,d),n.add(a);let f=new St(16498468,3,9,1.4);f.position.set(0,2.1,-2.5),n.add(f),e.ambientFireLights.push({light:f,baseIntensity:3,phase:.3}),e.animatedProps.push({object:l,kind:"ring",phase:.2,speed:.35}),e.animatedProps.push({object:c,kind:"ring",phase:1.5,speed:-.55}),e.animatedProps.push({object:h,kind:"ring",phase:.9,speed:.48});let u=new te;u.position.set(0,2.75,-2.8);let E=new _e({color:16774589,transparent:!0,opacity:0}),M=new m(new Rt(.18,0),E),g=new m(new Xe(.95,3.6,24,1,!0),new _e({color:16770180,transparent:!0,opacity:0,side:ct,depthWrite:!1,blending:vn}));g.position.y=-1.6,u.add(M,g),n.add(u),e.poleStarGroup=u,e.poleStarMat=g.material}function gE(n,e){let t=new A({color:6371360,roughness:.45,metalness:.1}),i=new m(new re(5.2,5.4,.25,40),t);i.position.y=-.125,i.receiveShadow=!0,n.add(i);let s=new A({color:6042653,roughness:.72}),r=new m(new z(8.2,.09,.12),s);r.position.set(0,.72,-3.2),r.receiveShadow=!0,n.add(r);for(let E=-3.6;E<=3.6;E+=.9){let M=new m(new re(.035,.04,.72,8),s);M.position.set(E,.36,-3.2),n.add(M)}let o=new A({color:10033947,roughness:.8});for(let E of[-1,1]){for(let M=0;M<2;M++){let g=new m(new re(.22,.26,4,12),o);g.position.set(E*(3.15+M*.36),2,-2.9+M*.14),g.castShadow=!0,n.add(g)}pi(n,E*4.4,-5.2,.95,3114330,E>0?1.2:.3,e)}let a=new A({color:14870768,metalness:.92,roughness:.15}),l=new m(new re(.016,.024,1.18,8),a);l.position.set(0,.59,.58),l.castShadow=!0,n.add(l);let c=new m(new re(.14,.15,.04,16),a);c.position.set(0,.02,.58),n.add(c);let h=new m(new ie(.055,12,10),a);h.position.set(0,1.21,.58),n.add(h);let d=new m(new Ne(.65,.028,10,40),new _e({color:16486972}));d.position.set(0,2.35,-3.25),n.add(d);let f=new Ai(16638023,4.2,12,.42,.55,1.2);f.position.set(-1.6,4.2,2.2),n.add(f,f.target),e.animatedProps.push({object:f,kind:"spotlight",phase:0,speed:1.3});let u=new Ai(16020150,3.6,12,.42,.55,1.2);u.position.set(1.6,4.2,2.2),n.add(u,u.target),e.animatedProps.push({object:u,kind:"spotlight",phase:1.7,speed:1.5})}function ME(n,e){let t=new A({color:2959666,roughness:.9}),i=new m(new $e(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new A({color:8145446,roughness:.72}),r=new te;r.position.set(0,0,-2);let o=new m(new z(2.1,.85,.7),s);o.position.y=.425,o.castShadow=!0,o.receiveShadow=!0,r.add(o);for(let f of[-.98,.98]){let u=new m(new z(.08,2.15,.08),s);u.position.set(f,1.075,-.25),r.add(u)}let a=new m(new z(2.4,.08,1.1),new A({color:14251782,roughness:.75}));a.position.set(0,2.15,.05),a.rotation.x=.2,a.castShadow=!0,r.add(a);let l=new A({color:16096779,metalness:.75,roughness:.25}),c=new m(new ie(.14,14,12),l);c.position.set(-.35,.98,.05),r.add(c);let h=new A({color:11817737,roughness:.85});for(let f of[.1,.28,.46]){let u=new m(new re(.05,.035,.09,12),h);u.position.set(f,.9,.08),r.add(u)}for(let f=0;f<4;f++){let u=new m(new ie(.06,8,8),new _e({color:16708551,transparent:!0,opacity:.28,depthWrite:!1}));u.position.set(-.35+f%2*.06,1.18+f*.14,.05),r.add(u),e.animatedProps.push({object:u,kind:"steam",baseY:1.16,phase:f*1.4,speed:1.8})}e.spots.counter={x:.25,y:0,z:-.9,rotY:.12};let d=new St(16758605,2.6,7,1.5);d.position.set(0,1.88,.25),r.add(d),e.ambientFireLights.push({light:d,baseIntensity:2.6,phase:.4}),n.add(r)}function yE(n,e){let t=new m(new Mt(9,32),new A({color:13358561,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new A({color:3359061,roughness:.82}),s=new A({color:15857145,roughness:.55}),r=[[-2.4,-4.5,2.6,1.8],[0,-5.6,3.8,2.3],[2.5,-4.4,2.4,1.7]];for(let[o,a,l,c]of r){let h=new m(new Xe(c,l,7),i);h.position.set(o,l*.5-.1,a),n.add(h);let d=new m(new Xe(c*.45,l*.42,7),s);d.position.set(o,l*.78-.1,a),n.add(d)}Nt(n,0,0,-1.1,.8,e,!0)}function xE(n,e,t=!1){let i=new A({color:15127221,roughness:.72}),s=new A({color:13284758,roughness:.58}),r=new A({color:16041038,metalness:.85,roughness:.22}),o=new A({color:7017510,roughness:.8}),a=new A({color:2822922,emissive:14251782,emissiveIntensity:.42,roughness:.6}),l=new m(new Mt(10.5,48),s);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new m(new z(8.8,.06,5.2),i);c.position.set(0,-.02,-.6),c.receiveShadow=!0,n.add(c);let h=new m(new z(3.75,.016,2.35),r);h.position.set(0,.012,.15),h.receiveShadow=!0,n.add(h);let d=new m(new z(3.45,.022,2.08),o);d.position.set(0,.015,.15),d.receiveShadow=!0,n.add(d);let f=new m(new z(10.8,4.4,.28),s);f.position.set(0,2.2,-3.55),f.receiveShadow=!0,n.add(f);let u=new m(new z(10.4,.24,.72),i);u.position.set(0,.12,-2.55),u.receiveShadow=!0,n.add(u);let E=[-3.6,-1.25,1.25,3.6];for(let p of E){let T=new m(new z(.42,.34,.42),i);T.position.set(p,.26,-2.55),T.castShadow=!0,n.add(T);let y=new m(new re(.15,.17,2.75,14),i);y.position.set(p,1.78,-2.55),y.castShadow=!0,n.add(y);let x=new m(new z(.46,.22,.46),r);x.position.set(p,3.2,-2.55),n.add(x)}let M=[-2.42,0,2.42];for(let p=0;p<M.length;p++){let T=M[p],y=p===1?2.42:2.28,x=new m(new z(y,.65,.26),i);x.position.set(T,3.55,-2.55),x.castShadow=!0,n.add(x);let S=new m(new Ne(.88,.065,8,20,Math.PI),i);S.position.set(T,2.52,-2.52),n.add(S);let b=new m(new z(1.18,1.72,.08),r);b.position.set(T,1.56,-3.38),n.add(b);let C=new m(new z(1.02,1.56,.1),a);C.position.set(T,1.56,-3.35),n.add(C);for(let _ of[-1,1]){let w=new m(new re(.09,.14,1.95,10),o);w.position.set(T+_*.54,1.55,-3.28),w.rotation.z=_*.06,n.add(w)}let H=new m(new z(1.22,.56,.12),a);H.position.set(T,3.12,-3.32),n.add(H)}let g=[-2.18,2.18];for(let p=0;p<g.length;p++){let T=g[p],y=-.35,x=new te;x.position.set(T,0,y);let S=new m(new re(.1,.22,.16,14),r);S.position.y=.08,x.add(S);let b=new m(new re(.025,.036,1.18,10),r);b.position.y=.74,b.castShadow=!0,x.add(b);for(let[H,_]of[[-.14,0],[.14,0],[0,.12],[0,-.1]]){let w=new m(new re(.042,.024,.05,8),r);w.position.set(H,1.34,_),x.add(w);let P=new m(new Xe(.022,.09,8),new _e({color:16707722}));P.position.set(H,1.4,_),x.add(P),e.animatedProps.push({object:P,kind:"diya",phase:p*1.4+H*3,speed:12.5})}let C=new St(16757844,1.9,6.2,1.6);C.position.set(0,1.48,0),x.add(C),e.ambientFireLights.push({light:C,baseIntensity:1.9,phase:p*1.7}),n.add(x)}if(Nt(n,-1.65,.24,-2.2,.3,e,!1),Nt(n,1.65,.24,-2.2,1.9,e,!0),t){let p=new m(new z(3.2,.042,.62),i);p.position.set(0,.021,.08),p.receiveShadow=!0,n.add(p);let T=new m(new z(3.08,.014,.06),r);T.position.set(0,.045,.34),n.add(T);for(let B of[-2.95,2.95]){let F=new m(new z(.3,3.2,.34),i);F.position.set(B,1.6,-1.45),F.castShadow=!0,n.add(F);let W=new m(new z(.38,.16,.42),r);W.position.set(B,3.22,-1.45),n.add(W)}let y=new te;y.position.set(0,0,-.78);let x=new m(new z(.68,.38,.68),i);x.position.y=.19,x.castShadow=!0,y.add(x);let S=new m(new re(.24,.28,2.75,10),i);S.position.y=1.72,S.castShadow=!0,y.add(S);for(let B of[.85,1.72,2.58]){let F=new m(new Ne(.27,.032,8,16),r);F.rotation.x=Math.PI/2,F.position.y=B,y.add(F)}let b=new m(new z(.64,.28,.64),r);b.position.y=3.16,y.add(b),n.add(y),e.stambhaWholeGroup=y;let C=new te;C.position.set(0,0,-.78),C.visible=!1;let H=new m(new z(.72,.38,.72),i);H.position.y=.19,C.add(H);let _=new m(new re(.2,.28,.72,9),i);_.position.y=.72,C.add(_);let w=new A({color:16707722,emissive:16347926,emissiveIntensity:1.55,roughness:.2}),P=new m(new li(.32,1),w);P.position.y=1.06,P.scale.set(1.2,1.5,.85),C.add(P);for(let B of[-1,1]){let F=new m(new li(.24,0),i);F.position.set(B*.78,.14,.18),F.scale.set(1.25,.65,.95),F.rotation.set(.18,.55*B,B*.35),C.add(F);let W=new m(new z(.26,.16,.22),i);W.position.set(B*1.12,.09,-.1),W.rotation.y=B*.48,C.add(W)}let I=new St(16758578,0,7.5,1.4);I.position.set(0,1.35,.35),C.add(I),e.stambhaFireLights=[I],n.add(C),e.stambhaBrokenGroup=C}}function wE(n,e){let t=new A({color:11567190,roughness:.92}),i=new m(new $e(24,24),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new te;s.position.set(-2.9,0,-4.6);let r=new m(new re(1.15,1.22,1.35,16),new A({color:12751720,roughness:.9}));r.position.y=.675,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new m(new Xe(1.55,.95,16),new A({color:8738861,roughness:.94}));o.position.y=1.78,o.castShadow=!0,s.add(o);let a=new m(new z(.45,.85,.1),new A({color:4860952,roughness:.85}));a.position.set(.32,.44,1.12),s.add(a),n.add(s),pi(n,3.2,-4.8,1.25,3114330,.4,e),pi(n,-4.6,-6,1.05,3711337,1.3,e);let l=new te;l.position.set(2.15,0,-1.75);let c=new A({color:7028258,roughness:.78}),h=new m(new z(1.25,.07,.58),c);h.position.y=.62,h.castShadow=!0,h.receiveShadow=!0,l.add(h);for(let b of[-.52,.52])for(let C of[-.22,.22]){let H=new m(new re(.032,.032,.62,8),c);H.position.set(b,.31,C),l.add(H)}let d=new A({color:11817737,roughness:.76}),f=new m(new ie(.21,16,14),d);f.position.set(-.36,.84,0),f.castShadow=!0,l.add(f);let u=new m(new re(.09,.075,.08,12),d);u.position.set(-.36,1.06,0),l.add(u);let E=new A({color:16096779,metalness:.85,roughness:.22}),M=new A({color:14251782,metalness:.78,roughness:.28}),g=new m(new ie(.11,14,12),E);g.position.set(.02,.76,.04),l.add(g);let p=new m(new re(.065,.045,.06,12),E);p.position.set(.02,.88,.04),l.add(p);let T=new m(new ie(.16,14,12),M);T.scale.set(1.05,.78,1.05),T.position.set(.36,.77,-.02),l.add(T);let y=new A({color:14870768,metalness:.9,roughness:.18}),x=new m(new re(.16,.13,.024,20),y);x.position.set(.04,.665,-.14),l.add(x),n.add(l);let S=new m(new $e(16,8),new A({color:4160826,roughness:.95}));S.rotation.x=-Math.PI/2,S.position.set(0,.005,-7.5),S.receiveShadow=!0,n.add(S);for(let[b,C,H]of[[-1.6,-5.8,.4],[.4,-6.2,-.35],[2.2,-5.6,.9]]){let _=TE();_.position.set(b,0,C),_.rotation.y=H,n.add(_),e.animatedProps.push({object:_,kind:"sway",baseRotZ:0,phase:b,speed:.85})}}function TE(){let n=new te,e=new A({color:1973796,roughness:.78}),t=new A({color:4144966,roughness:.45,metalness:.2}),i=new m(new lt(.32,.72,8,14),e);i.rotation.z=Math.PI/2,i.position.set(0,.66,0),i.castShadow=!0,n.add(i);let s=new m(new ie(.27,12,10),e);s.position.set(.28,.82,0),n.add(s);let r=new m(new z(.32,.26,.24),e);r.position.set(.62,.68,0),r.rotation.z=-.32,r.castShadow=!0,n.add(r);for(let a of[-1,1]){let l=new m(new Ne(.16,.032,8,14,Math.PI*.82),t);l.position.set(.54,.82,a*.14),l.rotation.set(a*.45,Math.PI*.5,.25),n.add(l)}for(let a of[-.32,.34])for(let l of[-.15,.15]){let c=new m(new re(.06,.048,.56,8),e);c.position.set(a,.28,l),c.castShadow=!0,n.add(c)}let o=new m(new re(.018,.012,.42,6),e);return o.position.set(-.56,.54,0),o.rotation.z=.45,n.add(o),n}function _E(n,e,t,i){if(e==="ModernCity"){let l=new m(new $e(24,24),new A({color:593183,roughness:.35,metalness:.6}));l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new cs(20,28,new Ie(i),1976635);c.position.y=.01,n.add(c);let h=new m(new Rt(.55,0),new A({color:i,wireframe:!0,emissive:i,emissiveIntensity:.6}));h.position.set(0,1.9,-2.5),n.add(h),t.animatedProps.push({object:h,kind:"ring",phase:0,speed:.6});return}let s=e==="PalaceCourt"?6038067:e==="Battlefield"?4140322:4535592,r=new m(new Mt(8.5,36),new A({color:s,roughness:.78}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,n.add(r);let o=e==="PalaceCourt"?14264170:e==="Archive"?6898214:7033664,a=new A({color:o,roughness:.72});for(let l of[-2.1,2.1]){let c=new m(new z(.35,3.4,.35),a);c.position.set(l,1.7,-2.4),c.castShadow=!0,n.add(c)}Nt(n,-1.5,0,-1.2,.4,t,!0),Nt(n,1.5,0,-1.2,2,t,!0)}function vE(n,e,t){let i=new A({color:1976635,roughness:.35,metalness:.55}),s=new A({color:t%2===0?2282478:11032055,emissive:959977,emissiveIntensity:.55}),r=new m(new z(3.8,.22,9.5),i);r.position.set(0,-.11,-1.5),r.receiveShadow=!0,n.add(r);for(let c of[-1.85,1.85]){let h=new m(new z(.12,.25,9.5),s);h.position.set(c,-.09,-1.5),n.add(h)}let o=[[-1.08,2282478],[1.08,16007006]];for(let c=0;c<o.length;c++){let[h,d]=o[c],f=new te;f.position.set(h,1.15,-2.5);let u=new m(new Ne(.75,.08,12,32),new A({color:d,emissive:d,emissiveIntensity:.85,roughness:.2}));f.add(u);let E=new m(new Mt(.7,24),new _e({color:d,transparent:!0,opacity:.24,side:ct}));f.add(E),n.add(f),e.animatedProps.push({object:u,kind:"portal",phase:c*1.4,speed:1.6})}let a=new A({color:16317180,roughness:.9});for(let c=0;c<6;c++){let h=(c-2.5)*2.1,d=-1.2+c%2*.45,f=new m(new ie(.95+c%3*.25,12,10),a);f.scale.set(1.8,.55,1.1),f.position.set(h,d,-5.2-c%2*1.2),n.add(f)}let l=new m(new re(.14,.14,1.6,12),new A({color:16436245,roughness:.35}));l.rotation.z=Math.PI/2,l.position.set(0,.35,-1),n.add(l),e.animatedProps.push({object:l,kind:"hazard",phase:0,speed:1.9})}function SE(n,e){let t=new A({color:10576438,roughness:.92}),i=new m(new Mt(11,36),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new A({color:8142627,roughness:.88});for(let[l,c,h,d]of[[-3.4,-4.6,2.2,1.4],[.4,-5.8,2.8,1.9],[3.5,-4.3,2,1.3]]){let f=new m(new re(d*.72,d,h,8),s);f.position.set(l,h*.5-.1,c),f.castShadow=!0,n.add(f)}let r=new A({color:12753761,roughness:.85});for(let l=-2;l<=2;l++){let c=new m(new lt(.18,.34,6,8),r);c.rotation.z=Math.PI/2,c.position.set(l*.56,.18,-2.3),c.castShadow=!0,n.add(c)}let o=new A({color:16436245,roughness:.5});for(let l of[-2.2,2.2]){let c=new m(new Xe(.22,.58,12),o);c.position.set(l,.29,-1.6),c.castShadow=!0,n.add(c)}let a=new St(16347926,2.4,8,1.5);a.position.set(0,1.4,-2.6),n.add(a),e.ambientFireLights.push({light:a,baseIntensity:2.4,phase:.6})}function bE(n,e,t){let i=new A({color:15857145,roughness:.55}),s=new A({color:t%2===0?3359061:4988309,roughness:.55});for(let f=-4;f<=4;f++)for(let u=-3;u<=3;u++){let E=new m(new z(.98,.06,.98),(f+u)%2===0?i:s);E.position.set(f,-.03,u),E.receiveShadow=!0,n.add(E)}let r=new A({color:t%3===0?5195493:t%3===1?1013358:11817737,roughness:.78});for(let f of[-2.45,2.45]){let u=new m(new z(3.4,4.2,.25),r);u.position.set(f,2.1,-2.8),u.receiveShadow=!0,n.add(u)}let o=new m(new z(1.7,1.4,.25),r);o.position.set(0,3.5,-2.8),n.add(o);let a=new A({color:8138002,roughness:.6});for(let f of[-.78,.78]){let u=new m(new z(.14,2.85,.34),a);u.position.set(f,1.425,-2.8),n.add(u)}let l=new m(new z(1.72,.16,.36),a);l.position.set(0,2.86,-2.8),n.add(l);let c=new te;c.position.set(-.7,0,-2.76);let h=new m(new z(1.38,2.75,.08),new A({color:14251782,roughness:.5}));h.position.set(.69,1.375,0),h.castShadow=!0,c.add(h);let d=new m(new ie(.08,12,10),new A({color:16436245,metalness:.85,roughness:.2}));d.position.set(1.22,1.25,.07),c.add(d),n.add(c),e.animatedProps.push({object:c,kind:"door",phase:.3,speed:2.2})}function Bi(n,e){let t=e.width??12.6,i=e.height??5.4,s=e.backZ??-2.9,r=e.depth??10.5,o=new A({color:e.backColor,roughness:.82}),a=new A({color:e.sideColor??e.backColor,roughness:.84}),l=new m(new z(t,i,.18),o);l.position.set(0,i*.5,s),l.receiveShadow=!0,n.add(l);let c=new m(new z(.18,i,r),a);c.position.set(-t*.5+.09,i*.5,s+r*.5-.1),c.receiveShadow=!0,n.add(c);let h=new m(new z(.18,i,r),a);h.position.set(t*.5-.09,i*.5,s+r*.5-.1),h.receiveShadow=!0,n.add(h);let d=e.trimColor??4674921,f=new A({color:d,roughness:.65}),u=new m(new z(t,.16,.22),f);u.position.set(0,.08,s+.04),n.add(u);let E=new m(new z(t,.35,r),f);E.position.set(0,i+.1,s+r*.5-.1),n.add(E);let M=new m(new z(t,i,.2),o);M.position.set(0,i*.5,s+r-.15),n.add(M);let g=new m(new z(t,.72,.22),f);return g.position.set(0,.36,s+r-.16),n.add(g),o}function RE(n,e){let t=new A({color:6044968,roughness:.78}),i=new m(new $e(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new m(new z(3.6,.02,2.6),new A({color:10424889,roughness:.88}));s.position.set(0,.01,-.4),s.receiveShadow=!0,n.add(s),Bi(n,{backColor:3878738,sideColor:3221063,trimColor:6044968,backZ:-2.9});let r=new St(14412542,2.2,9.5,1.3);r.position.set(.75,2.65,.65),n.add(r),e.ambientFireLights.push({light:r,baseIntensity:2.2,phase:.1});let o=new m(new z(1.5,1.55,.08),new A({color:8145446,roughness:.65}));o.position.set(1.15,2.25,-2.78),n.add(o);let a=new m(new $e(1.28,1.32),new _e({color:12248829}));a.position.set(1.15,2.25,-2.73),n.add(a);let l=new A({color:7877903,roughness:.62}),c=new te;c.position.set(-.88,0,-.58);let h=new m(new z(1.52,.14,2.1),l);h.position.y=.24,h.castShadow=!0,h.receiveShadow=!0,c.add(h);for(let[T,y]of[[-.68,-.95],[.68,-.95],[-.68,.95],[.68,.95]]){let x=new m(new re(.055,.045,.26,8),l);x.position.set(T,.13,y),x.castShadow=!0,c.add(x)}let d=new m(new z(1.54,.72,.1),l);d.position.set(0,.56,-1),d.castShadow=!0,c.add(d);let f=new m(new z(1.42,.16,1.94),new A({color:16708551,roughness:.8}));f.position.set(0,.38,.02),f.receiveShadow=!0,c.add(f);let u=new m(new z(1.44,.18,1.24),new A({color:15357964,roughness:.75}));u.position.set(0,.39,.34),u.castShadow=!0,c.add(u);let E=new m(new z(1.04,.14,.42),new A({color:16777215,roughness:.68}));E.position.set(0,.51,-.72),c.add(E),n.add(c);let M=new m(new z(.55,.52,.52),l);M.position.set(-1.98,.26,-.82),M.castShadow=!0,n.add(M);let g=new m(new Xe(.18,.24,16,1,!0),new A({color:16638023,emissive:16096779,emissiveIntensity:.55,side:ct}));g.position.set(-1.98,.72,-.82),n.add(g);let p=new St(16758605,2.4,6.5,1.5);p.position.set(-1.98,.66,-.82),n.add(p),e.ambientFireLights.push({light:p,baseIntensity:2.4,phase:.7}),e.spots.bed={x:-.88,y:.47,z:.16,rotY:.16},e.spots.door={x:1.45,y:0,z:-1.35,rotY:-.35}}function AE(n,e){let t=new m(new $e(14,14),new A({color:4141901,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new m(new z(4,.02,2.8),new A({color:1013358,roughness:.86}));i.position.set(0,.01,-.2),i.receiveShadow=!0,n.add(i),Bi(n,{backColor:3359061,sideColor:2503236,trimColor:7027230,backZ:-2.95});let s=new A({color:14251782,roughness:.7}),r=new A({color:16707722,roughness:.68}),o=new te;o.position.set(-.78,0,-1.28);let a=new m(new z(1.9,.36,.85),s);a.position.y=.22,a.castShadow=!0,a.receiveShadow=!0,o.add(a);let l=new m(new z(1.9,.68,.22),s);l.position.set(0,.56,-.34),l.castShadow=!0,o.add(l);for(let T of[-.92,.92]){let y=new m(new z(.18,.48,.86),s);y.position.set(T,.38,0),o.add(y)}let c=new m(new z(.32,.28,.14),r);c.position.set(-.55,.48,-.14),c.rotation.z=.18,o.add(c),n.add(o);let h=new A({color:7027230,roughness:.55}),d=new te,f=new m(new z(1.15,.08,.65),h);f.position.set(.08,.34,.12),f.castShadow=!0,d.add(f);let u=new m(new re(.14,.09,.08,16),new A({color:16317180,roughness:.35}));u.position.set(.08,.42,.12),d.add(u),n.add(d),e.livingRoomTableGroup=d;let E=new m(new z(1.1,.78,.06),h);E.position.set(-.7,2.15,-2.84),n.add(E);let M=new m(new $e(.92,.62),new A({color:16498468,roughness:.5}));M.position.set(-.7,2.15,-2.8),n.add(M);let g=new te;g.position.set(1.25,0,-2.7);let p=new m(new z(.95,2.25,.08),h);p.position.set(.475,1.125,0),p.castShadow=!0,g.add(p),n.add(g),e.animatedProps.push({object:g,kind:"door",phase:.4,speed:.85}),e.spots.sofa={x:-.78,y:.38,z:-.74,rotY:.25},e.spots.door={x:1.45,y:0,z:-1.4,rotY:-.4}}function CE(n,e){let t=new m(new $e(14,14),new A({color:3359061,roughness:.6}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new cs(12,16,9741240,4674921);i.position.y=.01,n.add(i),Bi(n,{backColor:10105874,sideColor:8138002,trimColor:16639626,backZ:-2.85});let s=new m(new z(6.8,.92,.05),new A({color:16708551,roughness:.55}));s.position.set(0,1.32,-2.74),n.add(s);let r=new A({color:4674921,roughness:.55}),o=new A({color:14870768,roughness:.3}),a=new m(new z(3.2,.88,.9),r);a.position.set(0,.44,-1.45),a.castShadow=!0,a.receiveShadow=!0,n.add(a);let l=new m(new z(3.28,.07,.96),o);l.position.set(0,.91,-1.45),n.add(l);let c=new _e({color:3718648}),h=new m(new Ne(.18,.025,8,20),c);h.rotation.x=Math.PI/2,h.position.set(-.22,.96,-1.4),n.add(h),e.animatedProps.push({object:h,kind:"diya",phase:0,speed:9});let d=new A({color:14251782,metalness:.72,roughness:.25}),f=new m(new re(.32,.22,.26,20),d);f.position.set(-.22,1.1,-1.4),f.castShadow=!0,n.add(f);let u=new m(new Mt(.3,20),new A({color:16708551,roughness:.28}));u.rotation.x=-Math.PI/2,u.position.set(-.22,1.22,-1.4),n.add(u);for(let g=0;g<5;g++){let p=new m(new ie(.075,8,8),new _e({color:16777215,transparent:!0,opacity:.3,depthWrite:!1}));p.position.set(-.22+(g%3-1)*.08,1.32+g*.14,-1.4),n.add(p),e.animatedProps.push({object:p,kind:"steam",baseY:1.28,phase:g*1.1,speed:1.7})}let E=new m(new z(2.6,.08,.32),new A({color:7877903,roughness:.65}));E.position.set(0,1.85,-2.6),n.add(E);for(let g=-2;g<=2;g++){let p=[15680580,16096779,2278750,3900150,15381256][g+2],T=new m(new re(.075,.075,.22,12),new A({color:p,roughness:.35}));T.position.set(g*.42,2,-2.58),n.add(T)}let M=new St(16775149,3.3,9.5,1.25);M.position.set(0,2.75,.45),n.add(M),e.ambientFireLights.push({light:M,baseIntensity:3.3,phase:.2}),e.spots.counter={x:-.42,y:0,z:-.68,rotY:.3},e.spots.door={x:1.35,y:0,z:-1.15,rotY:-.45}}function yr(n,e,t,i,s,r,o="#0f172a",a="#f59e0b"){let l=document.createElement("canvas");l.width=512,l.height=192;let c=l.getContext("2d");c.fillStyle=o,c.fillRect(0,0,512,192),c.strokeStyle=a,c.lineWidth=10,c.strokeRect(10,10,492,172),c.fillStyle=a,c.font="bold 42px sans-serif",c.textAlign="center",c.fillText(e,256,86),c.fillStyle="#e2e8f0",c.font="600 24px sans-serif",c.fillText(t,256,138);let h=new Yt(l);h.colorSpace=xt;let d=new m(new z(1.48,.56,.05),new A({color:1976635,roughness:.45,metalness:.4}));d.position.set(i,s,r-.02),n.add(d);let f=new m(new $e(1.38,.48),new _e({map:h}));f.position.set(i,s,r+.01),n.add(f)}function HE(n,e){let t=new m(new $e(14,14),new A({color:4860970,roughness:.75}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),Bi(n,{backColor:8138002,sideColor:6037518,trimColor:16096779,backZ:-2.9}),yr(n,"MITHAI & KESHAV","FRESH SHAHI HALWAI",0,2.75,-2.76,"#431407","#fbbf24");let i=new A({color:8138002,roughness:.58}),s=new m(new z(2.8,.92,.85),i);s.position.set(0,.46,-1.45),s.castShadow=!0,s.receiveShadow=!0,n.add(s);let r=new A({color:14870768,metalness:.85,roughness:.2}),o=new A({color:16096779,roughness:.45}),a=new A({color:16708551,roughness:.38});for(let h of[-.65,0,.65]){let d=new m(new z(.52,.04,.48),r);d.position.set(h,.94,-1.42),n.add(d);for(let f=-.14;f<=.15;f+=.14)for(let u=-.1;u<=.12;u+=.14){let E=h===0?new m(new z(.11,.08,.11),a):new m(new ie(.06,10,8),o);E.position.set(h+f,1,-1.42+u),n.add(E)}}let l=new m(new z(3.2,.1,1.2),new A({color:15357964,roughness:.65}));l.position.set(0,2.35,-1.35),l.rotation.x=.18,n.add(l);for(let h=-5;h<=5;h++){let d=new m(new ie(.075,10,8),new A({color:h%2===0?16096779:16436245,roughness:.6}));d.position.set(h*.28,2.15-Math.cos(h*.35)*.14,-.82),n.add(d)}let c=new St(16758605,3,8,1.4);c.position.set(0,2.15,-1),n.add(c),e.ambientFireLights.push({light:c,baseIntensity:3,phase:.5}),e.spots.counter={x:.38,y:0,z:-.62,rotY:.22}}function vd(n,e,t,i,s,r,o,a,l=512,c=256){let h=new te;h.position.set(i,s,r),h.rotation.y=o;let d=new m(new z(e+.2,t+.2,.08),a);d.position.z=-.045,h.add(d);let f=new Mr(new $e(e,t),{clipBias:.003,textureWidth:l,textureHeight:c,color:14412542,multisample:0});f.position.z=.002,h.add(f);let u=new m(new $e(.07,t*.92),new _e({color:16777215,transparent:!0,opacity:.16}));u.position.set(-e*.34,0,.006),u.rotation.z=-.35,h.add(u),n.add(h)}function PE(n,e){let t=new A({color:3359061,roughness:.42,metalness:.12}),i=new A({color:6583435,roughness:.45,metalness:.08}),s=new m(new $e(14,14),t);s.rotation.x=-Math.PI/2,s.receiveShadow=!0,n.add(s);for(let N=-4;N<=4;N++)for(let ee=-4;ee<=3;ee++){if((N+ee)%2!==0)continue;let $=new m(new $e(.95,.95),i);$.rotation.x=-Math.PI/2,$.position.set(N*1,.004,ee*1),$.receiveShadow=!0,n.add($)}Bi(n,{backColor:16051425,sideColor:15129288,trimColor:1013358,backZ:-2.9});let r=new m(new z(12.6,1.02,.21),new A({color:1013358,roughness:.45}));r.position.set(0,.51,-2.86),n.add(r),yr(n,"SHAHI SALON","KESHAV STUDIO \u2022 VIP CUTS",2.34,2.26,-2.75,"#0f172a","#f59e0b"),yr(n,"STYLE CHART","1. BAHUBALI  2. FADE  3. KATORA",2.34,1.64,-2.75,"#1e293b","#38bdf8");let o=new A({color:14870768,metalness:.88,roughness:.16});vd(n,3.25,1.38,-.25,1.92,-2.7,0,o,512,256);let a=new m(new re(.032,.032,.65,10),o);a.rotation.z=Math.PI/2,a.position.set(-2.5,1.62,-.88),n.add(a),vd(n,1.42,1.18,-2.14,1.62,-.78,1.04,o,384,320);let l=new m(new z(2.8,.08,.14),new _e({color:16776171}));l.position.set(-.25,2.78,-2.7),n.add(l);let c=new St(16776171,3.2,9.5,1.3);c.position.set(-.25,2.65,-1.25),n.add(c);let h=new m(new z(3.6,.08,.22),new _e({color:16708551}));h.position.set(0,3.85,1.2),n.add(h);let d=new A({color:1013358,roughness:.48}),f=new m(new z(6.4,1.2,.12),d);f.position.set(0,1.85,7.25),n.add(f);let u=new m(new z(2.6,.015,2.2),new A({color:1013358,roughness:.9}));u.position.set(-.55,.008,-.78),u.receiveShadow=!0,n.add(u);let E=new te;E.position.set(3.48,1.68,-2.55);let M=new m(new re(.11,.11,.92,16),new A({color:16317180,roughness:.25}));E.add(M),[14427686,2450411,14427686].forEach((N,ee)=>{let $=new m(new Ne(.112,.028,8,18),new A({color:N,roughness:.3}));$.rotation.x=Math.PI/2+.42,$.position.y=-.26+ee*.26,E.add($)});let g=new A({color:13948120,metalness:.85,roughness:.2});for(let N of[-.5,.5]){let ee=new m(new ie(.125,12,10),g);ee.position.y=N,E.add(ee)}n.add(E),e.animatedProps.push({object:E,kind:"hazard",phase:0,speed:3.2});let p=new m(new z(.75,.72,.56),new A({color:16317180,roughness:.32}));p.position.set(-2.98,.36,-2.42),n.add(p);let T=new m(new re(.28,.2,.18,16),new A({color:16777215,roughness:.22}));T.position.set(-2.98,.78,-2.38),n.add(T);let y=new m(new re(.02,.02,.24,8),o);y.position.set(-2.98,.92,-2.58),n.add(y);let x=new m(new z(3.3,.08,.36),new A({color:7029795,roughness:.6}));x.position.set(-.25,1.02,-2.6),n.add(x),[14753096,959977,16096779,1096065,9133302].forEach((N,ee)=>{let $=new m(new re(.055,.055,.22,10),new A({color:N,roughness:.3}));$.position.set(-1.2+ee*.48,1.17,-2.55),n.add($)});let S=new te;S.position.set(.96,0,-1.26);let b=new m(new z(.46,.8,.36),new A({color:1976635,roughness:.5}));b.position.y=.42,S.add(b);let C=new m(new z(.5,.05,.4),o);C.position.y=.84,S.add(C);let H=new m(new re(.04,.052,.16,10),new A({color:959977,roughness:.3}));H.position.set(-.14,.94,.04),S.add(H);let _=new m(new z(.05,.05,.14),o);_.position.set(0,.89,.06),S.add(_),[16708551,14742270].forEach((N,ee)=>{let $=new m(new z(.2,.055,.22),new A({color:N,roughness:.85}));$.position.set(.11,.895+ee*.056,-.02),S.add($)}),n.add(S);let w=new te;w.position.set(-.44,0,-.78),w.rotation.y=.2;let P=new A({color:12131356,roughness:.42}),I=new m(new re(.36,.4,.08,18),o);I.position.y=.04,w.add(I);let B=new m(new re(.08,.1,.42,12),o);B.position.y=.25,w.add(B);let F=new m(new z(.76,.16,.72),P);F.position.y=.46,F.castShadow=!0,w.add(F);let W=new m(new z(.74,.76,.14),P);W.position.set(0,.84,-.32),W.rotation.x=-.14,W.castShadow=!0,w.add(W);for(let N of[-.41,.41]){let ee=new m(new z(.08,.08,.62),o);ee.position.set(N,.68,0),w.add(ee)}let Y=new m(new z(.46,.05,.22),o);Y.position.set(0,.22,.48),w.add(Y),n.add(w);let Q=new m(new z(1.9,.42,.68),new A({color:2450411,roughness:.6}));Q.position.set(1.76,.21,-1.68),Q.castShadow=!0,n.add(Q),e.spots.sofa={x:-.44,y:.28,z:-.66,rotY:.18},e.spots.counter={x:.34,y:0,z:-.96,rotY:-.36},e.spots.door={x:1.76,y:0,z:-1.45,rotY:-.35}}function IE(n,e){let t=new m(new $e(14,14),new A({color:4927003,roughness:.68}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new A({color:7029795,roughness:.62});Bi(n,{backColor:7029795,sideColor:5715482,trimColor:9584654,backZ:-2.9}),yr(n,"SATYAMEVA JAYATE","KESHAV DISTRICT COURT",0,3.05,-2.76,"#451a03","#f59e0b");let s=new m(new z(3.4,1.25,1),i);s.position.set(0,.62,-1.9),s.castShadow=!0,n.add(s);let r=new m(new Ne(.32,.04,10,24),new A({color:16096779,metalness:.85,roughness:.2}));r.position.set(0,2.4,-2.76),n.add(r);let o=new m(new z(1.1,.92,.9),i);o.position.set(-.95,.46,-.55),o.castShadow=!0,n.add(o),e.spots.sofa={x:0,y:.42,z:-1.45,rotY:.08},e.spots.counter={x:-.95,y:.1,z:-.35,rotY:.38}}function DE(n,e){let t=new m(new $e(14,14),new A({color:14412542,roughness:.52}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),Bi(n,{backColor:16317180,sideColor:14870768,trimColor:165063,backZ:-2.9}),yr(n,"CITY CLINIC","DR. DIAGNOSTICS \u2022 OPD 1",2.25,2.35,-2.75,"#0c4a6e","#38bdf8");let i=new _e({color:15680580}),s=new m(new z(.22,.72,.05),i);s.position.set(0,2.35,-2.78),n.add(s);let r=new m(new z(.72,.22,.05),i);r.position.set(0,2.35,-2.78),n.add(r);let o=new m(new z(1.8,.52,.88),new A({color:959977,roughness:.6}));o.position.set(-.95,.26,-.88),o.castShadow=!0,n.add(o);let a=new m(new z(1.4,.75,.72),new A({color:6583435,roughness:.5}));a.position.set(.85,.38,-.85),a.castShadow=!0,n.add(a),e.spots.bed={x:-.95,y:.52,z:-.82,rotY:.32},e.spots.sofa={x:.85,y:0,z:-.45,rotY:-.35}}function LE(n,e){let t=new m(new $e(14,14),new A({color:593188,roughness:.35,metalness:.3}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new _e({color:3718648}),s=new m(new Ne(2.15,.06,12,48),i);s.rotation.x=Math.PI/2,s.position.set(0,.04,0),n.add(s),e.animatedProps.push({object:s,kind:"ring",phase:0,speed:.4});let r=new m(new Ne(2.7,.08,12,48),new _e({color:11032055}));r.position.set(0,1.9,-2.5),n.add(r),e.animatedProps.push({object:r,kind:"portal",phase:.4,speed:.8});let o=new A({color:1976635,metalness:.55,roughness:.3});[-.95,.95].forEach(l=>{let c=new m(new re(.38,.44,.82,16),o);c.position.set(l,.41,-.35),c.castShadow=!0,n.add(c)});let a=new Ai(3718648,8.5,16,Math.PI/5,.4);a.position.set(0,4.6,1.5),n.add(a),n.add(a.target),e.animatedProps.push({object:a,kind:"spotlight",phase:0,speed:1.5})}function GE(n,e){let t=new m(new $e(14,14),new A({color:7041664,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new A({color:10105874,roughness:.82}),s=new A({color:16708551,roughness:.55}),r=new _e({color:16638023});[-2.6,2.6].forEach(h=>{let d=new m(new z(3,2.2,.28),i);d.position.set(h,1.1,-2.4),d.castShadow=!0,n.add(d)}),[-1.08,1.08].forEach(h=>{let d=new m(new z(.38,2.55,.38),i);d.position.set(h,1.28,-2.35),d.castShadow=!0,n.add(d);let f=new m(new z(.46,.12,.46),s);f.position.set(h,2.58,-2.35),n.add(f);let u=new m(new ie(.11,10,8),r);u.position.set(h,2.74,-2.35),n.add(u)});let o=new te;o.position.set(-.92,0,-2.35);let a=new A({color:1976635,metalness:.65,roughness:.35});for(let h of[.35,1.85]){let d=new m(new z(1.84,.08,.08),a);d.position.set(.92,h,0),o.add(d)}for(let h=0;h<=7;h++){let d=new m(new re(.025,.025,2.05,8),a);d.position.set(.08+h*.24,1.05,0),d.castShadow=!0,o.add(d)}let l=new m(new z(.14,.16,.08),new A({color:16096779,metalness:.85,roughness:.2}));l.position.set(1.72,1.12,.08),o.add(l),n.add(o),e.animatedProps.push({object:o,kind:"door",phase:.1,speed:.7});let c=new m(new re(.09,.11,3.8,12),new A({color:4674921,metalness:.5,roughness:.5}));c.position.set(2.15,1.9,-1.6),n.add(c),pi(n,-2.75,-1.25,1.05,1409085,.3,e),e.spots.door={x:0,y:0,z:-1.35,rotY:.1}}function BE(n,e){let t=new A({color:3875606,roughness:.72}),i=new A({color:6042653,roughness:.65}),s=new A({color:16041038,metalness:.85,roughness:.25}),r=new A({color:1920728,roughness:.45,metalness:.2}),o=new A({color:8330525,roughness:.82}),a=new m(new Mt(10,44),t);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,n.add(a);let l=new m(new z(3.6,.02,2.2),o);l.position.set(0,.015,.1),l.receiveShadow=!0,n.add(l);for(let M of[-2.4,2.4]){let g=new m(new z(2,3.1,.45),i);g.position.set(M,1.55,-2.9),g.castShadow=!0,n.add(g);for(let p of[.85,1.65,2.45]){let T=new m(new z(1.75,.22,.48),s);T.position.set(M,p,-2.9),n.add(T)}}let c=new m(new re(.42,.56,1.05,20),i);c.position.set(0,.525,-2.35),c.castShadow=!0,n.add(c);let h=new te;h.position.set(0,1.55,-2.35);let d=new m(new ie(.46,24,18),r);h.add(d);let f=new m(new Ne(.55,.032,10,42),s);h.add(f);let u=new m(new Ne(.51,.024,10,42),s);u.rotation.x=Math.PI/2,h.add(u),n.add(h),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.45});let E=new St(16639626,3.2,8,1.4);E.position.set(0,2.65,-1.65),n.add(E),e.ambientFireLights.push({light:E,baseIntensity:3.2,phase:.4})}function UE(n,e,t){let i=new A({color:988970,roughness:.5,metalness:.25}),s=new A({color:1976635,roughness:.45,metalness:.35}),r=new _e({color:t||"#38bdf8"}),o=new m(new Mt(10,44),i);o.rotation.x=-Math.PI/2,o.receiveShadow=!0,n.add(o);let a=new m(new Ne(2.3,.04,10,48),r);a.rotation.x=Math.PI/2,a.position.y=.02,n.add(a);let l=[[-3.6,-4.2,1.1,4.2],[-2.1,-4.6,1,5.1],[-.4,-5,1.25,5.8],[1.4,-4.6,1,4.8],[3.1,-4.2,1.15,4]];for(let[d,f,u,E]of l){let M=new m(new z(u,E,.9),s);M.position.set(d,E*.5,f),n.add(M);for(let g=1;g<E-.5;g+=.95){let p=new m(new z(u*.72,.14,.94),r);p.position.set(d,g,f),n.add(p)}}let c=new m(new Ne(1.8,.035,10,48),r);c.position.set(0,2.6,-3.1),n.add(c),e.animatedProps.push({object:c,kind:"ring",phase:.4,speed:.35});let h=new St(t||"#38bdf8",2.8,9,1.4);h.position.set(0,2.8,-1.8),n.add(h),e.ambientFireLights.push({light:h,baseIntensity:2.8,phase:.6})}function Sd(n,e,t,i,s){let{top:r,mid:o,bot:a,sunColor:l,sunIntensity:c,fogDensity:h}=uE(i,e.palette);n.fog=new Ws(o,h);let d=new ie(28,32,20),f=new Ut({side:Ft,depthWrite:!1,uniforms:{uTop:{value:new Ie(r)},uMid:{value:new Ie(o)},uBot:{value:new Ie(a)}},vertexShader:`
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
    `}),u=new m(d,f);if(n.add(u),!(t==="Bedroom"||t==="LivingRoom"||t==="Kitchen"||t==="SweetShop"||t==="BarberShop"||t==="Courtroom"||t==="DoctorClinic"||t==="Classroom"||t==="QuizStudio"||t==="Archive")){let x=i==="Night"?16317180:i==="Sunset"?16752196:16774064,S=new m(new Mt(i==="Night"?.85:1.15,24),new _e({color:x,fog:!1}));S.position.set(3.2,i==="Sunset"?3.1:5.2,-16.5),n.add(S);let b=i==="Night"?6583435:i==="Sunset"?16765363:16777215,C=new _e({color:b,transparent:!0,opacity:.88,fog:!1}),H=[[-4.2,4.4,-13.5,.72],[-.6,5.1,-15,.85],[2.4,4,-12.5,.65],[4.8,4.8,-14.5,.78]];for(let[_,w,P,I]of H){let B=new te;B.position.set(_,w,P);for(let[F,W,Y]of[[0,0,.55],[-.45,-.08,.42],[.48,-.06,.44],[.15,.22,.4]]){let Q=new m(new ie(Y*I,10,8),C);Q.position.set(F*I,W*I,0),B.add(Q)}n.add(B)}}let M=new nr(l,a,.85);n.add(M);let g=new ls(l,c);g.position.set(2.8,5.2,3.8),g.castShadow=!0,g.shadow.mapSize.set(1024,1024),g.shadow.camera.near=.5,g.shadow.camera.far=16,g.shadow.camera.left=-4,g.shadow.camera.right=4,g.shadow.camera.top=4,g.shadow.camera.bottom=-4,g.shadow.bias=-8e-4,n.add(g);let p=new ls(e.palette.secondaryHex,.65);p.position.set(-3,3.4,-3.5),n.add(p);let T=new te;n.add(T);let y={group:T,skyMaterial:f,keyLight:g,hemiLight:M,ambientFireLights:[],animatedProps:[],backdropTextures:s,spots:{},dynamicSpots:{}};if(e.sceneBlueprint)return ac(T,e.sceneBlueprint,y.dynamicSpots),y;if(s.length>0){let x=new m(new $e(14,14),new Si({opacity:.42}));x.rotation.x=-Math.PI/2,x.receiveShadow=!0,T.add(x);let S=!!e.stageLayout?.templateBackdrop,b=e.width/e.height,C=S?6.2:9.4,H=C*b,_=new m(new $e(H,C),new _e({map:s[0],depthWrite:!1,fog:!1}));return _.position.set(0,S?1.32:2.15,S?-2.1:-4.8),T.add(_),y.backdropMesh=_,y}switch(t){case"Temple":fE(T,y);break;case"ForestAshram":pE(T,y);break;case"RiverGhat":mE(T,y);break;case"Cosmos":EE(T,y,e.palette.primaryHex);break;case"ComedyStage":gE(T,y);break;case"ChaiStall":ME(T,y);break;case"SkyGauntlet":vE(T,y,e.uniqueVariant??e.seed??0);break;case"TankArena":SE(T,y);break;case"DoorwaySet":bE(T,y,e.uniqueVariant??e.seed??0);break;case"Himalaya":yE(T,y);break;case"PalaceCourt":{let x=[e.title,e.leftCharacter?.name,e.rightCharacter?.name,...e.supportingCast.map(b=>b.name)].join(" "),S=/narasimha|narsimha|hiranyakashipu|prahlad|नरसिंह|नृसिंह|हिरण्यकशिपु|प्रह्लाद|खंभ|स्तंभ/i.test(x);xE(T,y,S);break}case"Bedroom":RE(T,y);break;case"LivingRoom":AE(T,y);break;case"Kitchen":CE(T,y);break;case"SweetShop":HE(T,y);break;case"BarberShop":PE(T,y);break;case"Courtroom":IE(T,y);break;case"DoctorClinic":DE(T,y);break;case"Classroom":ac(T,yd(),y.dynamicSpots);break;case"QuizStudio":LE(T,y);break;case"Archive":BE(T,y);break;case"ModernCity":UE(T,y,e.palette.primaryHex);break;case"NeighborhoodGate":GE(T,y);break;case"Village":wE(T,y);break;default:_E(T,t,y,e.palette.primaryHex);break}return(t==="Temple"||t==="PalaceCourt"||t==="Himalaya"||t==="ForestAshram"||t==="RiverGhat"||t==="Cosmos")&&(y.trialProps=xd(T)),t==="LivingRoom"&&(y.comedyGags=Td(T)),y}function bd(n,e,t,i,s,r,o=!1,a="none",l=0,c=.5,h){for(let d of n.ambientFireLights)d.light.intensity=d.baseIntensity*(.86+.14*Math.sin(e*9.5+d.phase));for(let d of n.animatedProps)if(d.kind==="bell")d.object.rotation.z=Math.sin(e*d.speed+d.phase)*.16;else if(d.kind==="sway")d.object.rotation.z=Math.sin(e*d.speed+d.phase)*.035;else if(d.kind==="ring")d.object.rotation.z=e*d.speed+d.phase,d.object.rotation.y=Math.sin(e*.4+d.phase)*.25;else if(d.kind==="diya")d.object.scale.y=.85+.22*Math.sin(e*d.speed+d.phase),d.object.scale.x=.92+.12*Math.cos(e*d.speed*1.1+d.phase);else if(d.kind==="steam"){let f=(e*.55+d.phase)%1;d.object.position.y=(d.baseY??1.16)+f*.65,d.object.scale.setScalar(.75+f*1.15);let u=d.object.material;u.opacity=Math.sin(f*Math.PI)*.28}else if(d.kind==="spotlight"){let f=d.object;f.target.position.set(Math.sin(e*d.speed+d.phase)*1.1,.8,0),f.target.updateMatrixWorld()}else if(d.kind==="portal"){d.object.rotation.z=e*d.speed+d.phase;let f=.94+.08*Math.sin(e*3.8+d.phase);d.object.scale.setScalar(f)}else d.kind==="door"?d.object.rotation.y=.35+Math.sin(e*d.speed+d.phase)*.48:d.kind==="hazard"&&(d.object.rotation.y=e*d.speed+d.phase);if(n.poleStarGroup&&n.poleStarMat){let d=Math.max(0,Math.min(1,(t-.55)/.35));n.poleStarGroup.visible=d>.02,n.poleStarGroup.rotation.y=e*.8,n.poleStarMat.opacity=d*.28}if(n.stambhaWholeGroup&&n.stambhaBrokenGroup&&(n.stambhaWholeGroup.visible=!o,n.stambhaBrokenGroup.visible=o),n.stambhaFireLights){let d=o?3.8+Math.sin(e*14)*.55:0;n.stambhaFireLights.forEach(f=>{f.intensity=d})}if(n.trialProps&&wd(n.trialProps,e,a,l,c),n.livingRoomTableGroup&&(n.livingRoomTableGroup.visible=!h?.hasFuneralShroud),n.comedyGags&&_d(n.comedyGags,e,h?.hasFuneralShroud??!1,h?.shroudOpen??!1,h?.hazardMode??"none",c),n.backdropMesh&&n.backdropTextures.length>0){let d=Math.max(0,i)%n.backdropTextures.length,f=n.backdropMesh.material;if(f.map!==n.backdropTextures[d]&&(f.map=n.backdropTextures[d],f.needsUpdate=!0),r?.templateBackdrop){let u=r.templateMotion==="AutoSmooth"?["GentleZoom","OrbitRound","ZoomOut","SlowPan","GentleRotate"][Math.max(0,i>=0?i:Math.floor(e/5.5))%5]:r.templateMotion;if(n.backdropMesh.rotation.z=0,n.backdropMesh.position.y=1.32,u==="GentleZoom"){let E=1+.06*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(E),n.backdropMesh.position.x=0}else if(u==="ZoomOut"){let E=1.1-.09*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(E),n.backdropMesh.position.x=0}else if(u==="SlowPan")n.backdropMesh.scale.setScalar(1.08),n.backdropMesh.position.x=Math.sin(e*Math.PI*2/32)*.16;else if(u==="OrbitRound"){let E=e*Math.PI*2/22;n.backdropMesh.scale.setScalar(1.1),n.backdropMesh.position.x=Math.sin(E)*.13,n.backdropMesh.position.y=1.32+(Math.sin(E+1.25)-Math.sin(1.25))*.055}else if(u==="GentleRotate"){let E=1.08+.03*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(E),n.backdropMesh.position.x=0,n.backdropMesh.rotation.z=.032*Math.sin(e*Math.PI*2/18)}else n.backdropMesh.scale.setScalar(1),n.backdropMesh.position.x=0}else{let u=s*s*(3-2*s);n.backdropMesh.scale.setScalar(1.04+.09*u),n.backdropMesh.position.x=(d%2===0?1:-1)*.14*(u-.5)}}}function Rd(n,e,t,i,s,r){let o=new te;n.add(o);let a=document.createElement("canvas");a.width=64,a.height=64;let l=a.getContext("2d"),c=l.createRadialGradient(32,32,2,32,32,30);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.35,"rgba(255,255,255,0.75)"),c.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);let h=new Yt(a),d="upward";t==="ComedyBurst"||e==="ComedyStage"?d="star":e==="ForestAshram"?d="firefly":e==="Himalaya"?d="snow":(t==="DivineAura"||e==="PalaceCourt")&&(d="petal");let f=110,u=new Float32Array(f*3),E=new Float32Array(f*3),M=new Float32Array(f*3),g=new Ie(i),p=new Ie(s),T=new Ie(16775126),y=(r^2654435769)>>>0,x=()=>(y=Math.imul(1664525,y)+1013904223>>>0,y/4294967296);for(let he=0;he<f;he++){let k=(x()-.5)*6.2,Be=x()*4.2,we=(x()-.5)*4.5-.4;u[he*3]=k,u[he*3+1]=Be,u[he*3+2]=we,M[he*3]=x()*6.283,M[he*3+1]=.4+x()*.9,M[he*3+2]=k;let Ye=he%3===0?g:he%3===1?p:T;E[he*3]=Ye.r,E[he*3+1]=Ye.g,E[he*3+2]=Ye.b}let S=new vt;S.setAttribute("position",new Bt(u,3)),S.setAttribute("color",new Bt(E,3));let b=new vi({size:d==="star"?.065:.12,map:h,vertexColors:!0,transparent:!0,opacity:d==="star"?.16:.78,blending:vn,depthWrite:!1}),C=new ss(S,b);d==="star"&&(C.visible=!1),o.add(C);let H=36,_=new Float32Array(H*3),w=new vt;w.setAttribute("position",new Bt(_,3));let P=new vi({size:.16,map:h,color:16638023,transparent:!0,opacity:0,blending:vn,depthWrite:!1}),I=new ss(w,P);o.add(I);let B=[];if(e!=="ModernCity"&&d!=="star")for(let he=0;he<4;he++){let k=new Ut({transparent:!0,depthWrite:!1,side:ct,blending:vn,uniforms:{uColor:{value:new Ie(i)},uOpacity:{value:.08}},vertexShader:`
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
        `}),Be=new m(new Xe(.85,7.2,20,1,!0),k);Be.position.set(-1.6+he*1.05,2.6,-1.9),Be.rotation.z=-.32+he*.1,o.add(Be),B.push(Be)}let F=[];for(let he=0;he<7;he++){let k=new m(new ie(.036,10,8),new _e({color:s,transparent:!0,opacity:0,blending:vn,depthWrite:!1}));o.add(k),F.push(k)}let W=new te,Y=new _e({color:8246268,transparent:!0,opacity:.85});for(let he=0;he<3;he++){let k=new te,Be=.06+he*.028,we=new m(new z(Be*1.6,Be*.35,Be*.35),Y);we.position.y=Be*.7;let Ye=new m(new z(Be*1.8,Be*.32,Be*.35),Y);Ye.rotation.z=.72;let Ue=new m(new z(Be*1.6,Be*.35,Be*.35),Y);Ue.position.y=-Be*.7,k.add(we,Ye,Ue),W.add(k)}W.visible=!1,o.add(W);let Q=new te,N=new _e({color:16436245,side:ct});for(let he=0;he<6;he++){let k=he/6*Math.PI*2,Be=new m(new Xe(.036,.16,4),N);Be.position.set(Math.cos(k)*.22,Math.sin(k)*.22,0),Be.rotation.z=k-Math.PI/2,Q.add(Be)}Q.visible=!1,o.add(Q);let ee=new te,$=new _e({color:16638023});for(let he=0;he<3;he++){let k=new m(new Rt(.068,0),$);ee.add(k)}ee.visible=!1,o.add(ee);let fe=new te,be=new _e({color:14870768,transparent:!0,opacity:.55});for(let he=0;he<4;he++){let k=new m(new ie(.085,8,6),be);fe.add(k)}fe.visible=!1,o.add(fe);let Re=new te,K=new _e({color:1120295,transparent:!0,opacity:.94});for(let he=0;he<12;he++){let k=new m(new z(.068,.022,.024),K);Re.add(k)}Re.visible=!1,o.add(Re);let ae=new te,Ee=new _e({color:16708338,transparent:!0,opacity:.85}),me=new _e({color:15680580,transparent:!0,opacity:.92});for(let he=0;he<6;he++){let k=new m(new ie(.065+he%2*.022,8,6),he%3===2?me:Ee);ae.add(k)}ae.visible=!1,o.add(ae);let le=new te,He=new _e({color:8246268,transparent:!0,opacity:.82});for(let he=0;he<10;he++){let k=new m(new ie(.024,6,5),He);le.add(k)}le.visible=!1,o.add(le);let ne=new te,ge=[16436245,16638023,3718648,16020150,4906624];for(let he=0;he<10;he++){let k=new m(new Rt(.062+he%2*.025,0),new _e({color:ge[he%ge.length],transparent:!0,opacity:.94}));ne.add(k)}ne.visible=!1,o.add(ne);let pe=new te,xe=new _e({color:13358561,transparent:!0,opacity:.72}),G=new _e({color:15857145,transparent:!0,opacity:.78});for(let he=0;he<8;he++){let k=new m(new ie(.095+he%3*.028,8,6),he%2===0?xe:G);pe.add(k)}return pe.visible=!1,o.add(pe),{group:o,ambientPoints:C,ambientPositions:u,ambientSeeds:M,burstPoints:I,burstPositions:_,burstMat:P,streamDots:F,godRays:B,particleMode:d,sleepZGroup:W,shockBurstGroup:Q,dizzyStarsGroup:ee,dustGroup:fe,hairCutGroup:Re,angrySteamGroup:ae,sprayMistGroup:le,celebrateStarsGroup:ne,brakeSmokeGroup:pe}}function Ad(n,e,t,i,s,r,o,a,l,c,h="none",d="none",f=0,u=0,E=!1,M="calm",g="calm",p=!1,T=null){let y=n.ambientPositions.length/3,x=n.particleMode==="snow"||n.particleMode==="petal"&&t>.6;for(let ne=0;ne<y;ne++){let ge=n.ambientSeeds[ne*3],pe=n.ambientSeeds[ne*3+1],xe=n.ambientSeeds[ne*3+2];if(n.particleMode==="firefly")n.ambientPositions[ne*3]=xe+Math.sin(e*.9*pe+ge)*.45,n.ambientPositions[ne*3+1]=.4+((ne*.17+Math.sin(e*.65+ge)*.6)%2.8+2.8)%2.8;else{let G=((e*.14*pe+ge*.15)%1+1)%1;n.ambientPositions[ne*3]=xe+Math.sin(e*1.1+ge)*.25,n.ambientPositions[ne*3+1]=x?3.9-G*3.8:.15+G*3.8}}n.ambientPoints.geometry.attributes.position.needsUpdate=!0;for(let ne=0;ne<n.godRays.length;ne++){let pe=n.godRays[ne].material;pe.uniforms.uOpacity.value=.075+.04*Math.sin(e*.8+ne*1.1)}let S=n.particleMode==="star",b=i==="Left"||i==="Right",C=i==="Left"?l:c;for(let ne=0;ne<n.streamDots.length;ne++){let ge=n.streamDots[ne],pe=ge.material;if(!b||S){pe.opacity=0;continue}let xe=i==="Left"?s+.2:r-.2,G=i==="Left"?r-.2:s+.2,he=(e*1.35+ne/n.streamDots.length)%1;ge.position.set(xe+(G-xe)*he,1.38+Math.sin(he*Math.PI)*.42+Math.sin(e*7+ne)*.03,-.38+Math.cos(e*6+ne)*.06),pe.color.set(C),pe.opacity=Math.sin(he*Math.PI)*.22}if(b&&(S?E:(o==="laughing"||o==="surprised"||o==="proud"||E)&&(a<.4||E))){let ne=Math.min(1,a/.4),ge=i==="Left"?s:r;n.burstMat.color.setHex(o==="angry"?16347926:16638023);let pe=n.burstPositions.length/3;for(let xe=0;xe<pe;xe++){let G=xe/pe*Math.PI*2,he=.68+ne*.92;n.burstPositions[xe*3]=ge+Math.cos(G)*he,n.burstPositions[xe*3+1]=1.55+Math.sin(G)*he*.85-ne*.16,n.burstPositions[xe*3+2]=S?-1.08:-.42}n.burstPoints.geometry.attributes.position.needsUpdate=!0,n.burstMat.opacity=(1-ne*.82)*(S?.36:.45)}else n.burstMat.opacity=0;let _=h==="sleeping";if(_||d==="sleeping"){n.sleepZGroup.visible=!0;let ne=_?s:r,ge=(_?f:u)+.62,pe=_&&f>.25?-.78:-.35;n.sleepZGroup.children.forEach((xe,G)=>{let he=(e*.55+G*.33)%1;xe.position.set(ne+Math.sin(e*2.2+G)*.12+he*.14,ge+he*.65,pe),xe.rotation.z=Math.sin(e*1.8+G)*.22;let k=Math.sin(he*Math.PI)*.85;xe.scale.setScalar(Math.max(.01,k))})}else n.sleepZGroup.visible=!1;let P=p?0:i==="Right"?r:s,I=p?.04:i==="Right"?u:f,B=p?"corpseSnapUp":i==="Right"?d:h,F=S&&(p||E||(B==="shockedFall"||B==="wakingUp"||o==="surprised")&&a<.42),W=S&&(h==="punching"||h==="kicking"),Y=S&&(d==="punching"||d==="kicking"),Q=W?h:d,N=W||Y?nc(e,Q).recoil:0;if(N>.08){let ne=W?r:s,ge=W?u:f;n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(ne+(W?-.28:.28),ge+(Q==="kicking"?.95:1.45),-.05),n.shockBurstGroup.rotation.z=e*3.1,n.shockBurstGroup.scale.setScalar(.45+N*.85)}else if(F){n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(P,I+2.08,-.18),n.shockBurstGroup.rotation.z=e*2.2;let ne=.88+.18*Math.sin(e*16);n.shockBurstGroup.scale.setScalar(ne)}else n.shockBurstGroup.visible=!1;if(h==="slapForehead"||d==="slapForehead"||o==="confused"){n.dizzyStarsGroup.visible=!0;let ne=d==="slapForehead"?r:h==="slapForehead"?s:P,ge=(d==="slapForehead"?u:h==="slapForehead"?f:I)+1.82;n.dizzyStarsGroup.children.forEach((pe,xe)=>{let G=e*4.5+xe/3*Math.PI*2;pe.position.set(ne+Math.cos(G)*.28,ge+Math.sin(G*2)*.04,Math.sin(G)*.24),pe.rotation.y=e*5})}else n.dizzyStarsGroup.visible=!1;let $=h==="walking"||h==="running";if($||(d==="walking"||d==="running")){n.dustGroup.visible=!0;let ne=$?s:r,ge=($?f:u)+.06;n.dustGroup.children.forEach((pe,xe)=>{let G=(e*(h==="running"||d==="running"?3.2:1.8)+xe*.25)%1;pe.position.set(ne-G*.35+(xe%2===0?-.1:.1),ge+G*.28,-.05),pe.scale.setScalar(Math.max(.01,Math.sin(G*Math.PI)*1.25))})}else n.dustGroup.visible=!1;let be=h==="cutting";if(be||d==="cutting"){n.hairCutGroup.visible=!0;let ne=be?r:s,ge=(be?u:f)+1.44,pe=-.6;n.hairCutGroup.children.forEach((xe,G)=>{let he=(e*2.25+G*.13)%1,k=(G%2===0?1:-1)*(.09+he*.28);xe.position.set(ne+k+Math.sin(e*7+G)*.04,ge-he*1.12,pe+.08),xe.rotation.set(e*6+G,G*.9,e*8),xe.scale.setScalar(Math.max(.08,Math.sin(he*Math.PI)*1.25))})}else n.hairCutGroup.visible=!1;let K=M==="angry",ae=g==="angry";if(K||ae||p){n.angrySteamGroup.visible=!0;let ne=p?0:ae?r:s,ge=(p?.06:ae?u:f)+1.54,pe=p?-.06:ae?-.68:-.58;n.angrySteamGroup.children.forEach((xe,G)=>{let he=G%2===0?-1:1,k=(e*2.4+Math.floor(G/2)*.34)%1;xe.position.set(ne+he*(.24+k*.22),ge+k*.36,pe),xe.scale.setScalar(Math.max(.05,Math.sin(k*Math.PI)*.68))})}else n.angrySteamGroup.visible=!1;let Ee=h==="spraying";if(Ee||d==="spraying"){n.sprayMistGroup.visible=!0;let ne=Ee?r:s,ge=(Ee?u:f)+1.48,pe=Ee?s:r;n.sprayMistGroup.children.forEach((xe,G)=>{let he=(e*3.6+G*.1)%1,k=(G%5-2)*.055;xe.position.set(pe+(ne-pe)*(.35+he*.65),ge+k+Math.sin(he*3)*.04,-.62),xe.scale.setScalar(Math.max(.1,(1-he*.4)*1.15))})}else n.sprayMistGroup.visible=!1;if(h==="celebrate"||d==="celebrate"||M==="proud"||g==="proud"||T==="tada"||T==="coin"){n.celebrateStarsGroup.visible=!0;let ne=d==="celebrate"||g==="proud"?r:h==="celebrate"||M==="proud"?s:P,ge=(d==="celebrate"||g==="proud"?u:h==="celebrate"||M==="proud"?f:I)+1.55;n.celebrateStarsGroup.children.forEach((pe,xe)=>{let G=(e*1.9+xe*.12)%1,he=xe/10*Math.PI*2+e*2.2,k=.24+G*.46;pe.position.set(ne+Math.cos(he)*k,ge+Math.sin(he)*.22+G*.44,-.46+Math.sin(he)*.16),pe.rotation.set(e*4+xe,e*5,xe),pe.scale.setScalar(Math.max(.05,Math.sin(G*Math.PI)*1.25))})}else n.celebrateStarsGroup.visible=!1;if(h==="brakeStop"||d==="brakeStop"||h==="hazardTruck"||d==="hazardTruck"||T==="brake"){n.brakeSmokeGroup.visible=!0;let ne=d==="brakeStop"||d==="hazardTruck"?r:h==="brakeStop"||h==="hazardTruck"?s:P,ge=(d==="brakeStop"||d==="hazardTruck"?u:h==="brakeStop"||h==="hazardTruck"?f:I)+.12;n.brakeSmokeGroup.children.forEach((pe,xe)=>{let G=(e*2.8+xe*.14)%1,he=xe%2===0?-1:1;pe.position.set(ne+he*(.14+G*.62),ge+G*.42,-.45+xe%3*.08),pe.scale.setScalar(Math.max(.08,Math.sin(G*Math.PI)*1.55))})}else n.brakeSmokeGroup.visible=!1}function Ra(n){return{...n,leftShoulderZ:-n.rightShoulderZ,leftElbowZ:-n.rightElbowZ,rightShoulderZ:-n.leftShoulderZ,rightElbowZ:-n.leftElbowZ,torsoTiltZ:-n.torsoTiltZ,headTiltZ:-n.headTiltZ,headYawY:-n.headYawY,hipOffsetX:-n.hipOffsetX,joints:n.joints?fd(n.joints):n.joints}}function FE(n,e,t){let i=.18+.32*Math.min(1,t*1.4);return n?i*Math.pow(1-n.phase,2.2):i*.5*(1+Math.cos(e*Math.PI*4))}function NE(n){return{width:n.width,height:n.height,fps:30,durationSeconds:60,totalFrames:1800,seed:n.seed??42,theme:"ComedyStage3D",vfxStyle:n.vfxStyle,enableDynamicCamera:n.dynamicZoom!==!1,isSeamlessLoop:!1,isComedyMode:!0,uniqueVariant:n.seed??42,title:"Motion Remix",palette:{primaryHex:n.primaryColor||"#F97316",secondaryHex:n.secondaryColor||"#38BDF8",speakerAHex:n.primaryColor||"#F97316",speakerBHex:n.secondaryColor||"#38BDF8",topBackdropHex:"#12182b",midBackdropHex:"#2c1e4a",botBackdropHex:"#0b0f1e"},hasCharacters:!0,supportingCast:[],turns:[],sceneRuns:[],backdropCount:0}}function Ex(n,e){let t=new ya({canvas:n,antialias:!0,alpha:!1,preserveDrawingBuffer:!0,powerPreference:"high-performance"});t.setPixelRatio(1),t.setSize(e.width,e.height,!1),t.shadowMap.enabled=!0,t.shadowMap.type=vo,t.toneMapping=Io,t.toneMappingExposure=1.15;let i=new Xs,s=NE(e),r=e.setting==="Auto"?"ComedyStage":e.setting,o=Sd(i,s,r,"Day",[]),a=null,l=null;if(e.customImageUrl){o.group.clear();let w=new m(new $e(14,14),new Si({opacity:.42}));w.rotation.x=-Math.PI/2,w.receiveShadow=!0,o.group.add(w),l=new tr().load(e.customImageUrl),l.colorSpace=xt;let I=e.width/Math.max(1,e.height),B=7.4;a=new m(new $e(B*I,B),new _e({map:l,depthWrite:!1})),a.position.set(0,1.35,-2.6),o.group.add(a)}else e.setting==="Auto"&&e.solidBgHex&&(i.background=new Ie(e.solidBgHex),i.fog=null);let c=Rd(i,r,e.vfxStyle,s.palette.primaryHex,s.palette.secondaryHex,s.seed),h=!!e.secondaryRole&&e.secondaryRole!=="None",d=h?-.78:0,f=.78,u=Sa({slot:"Left",name:"Lead",role:e.primaryRole,robeHex:e.primaryColor||null},s.palette.primaryHex,r,h?1:0,0);u.root.position.set(d,0,.14),h||(u.root.rotation.y=0),i.add(u.root);let E=h&&e.secondaryRole&&e.secondaryRole!=="None"?Sa({slot:"Right",name:"Partner",role:e.secondaryRole,robeHex:e.secondaryColor||null},s.palette.secondaryHex,r,-1,1.7):null;E&&(E.root.position.set(f,0,.02),i.add(E.root));let M=Math.max(0,Math.min(6,Math.round(e.troupeCount??0))),g=[];if(M>0){let w=e.troupeRole??(r==="PalaceCourt"?"NobleWoman":e.primaryRole),P=e.troupeColor||e.secondaryColor||"#7F1D1D";for(let I=0;I<M;I++){let B=I%2===0?-1:1,F=Math.floor(I/2),W=Sa({slot:B<0?"Left":"Right",name:`Dancer${I+1}`,role:w,robeHex:P},P,r,B<0?1:-1,(I+1)*.45),Y=B*(1.68+F*.68),Q=-.78-F*.44,N=B*-.18;W.root.position.set(Y,0,Q),W.root.rotation.y=N,W.root.scale.setScalar(.93),i.add(W.root),g.push({rig:W,side:B,baseRotY:N,phaseOffset:F*.12})}}let p=e.choreographyStyle&&e.choreographyStyle!=="auto"?e.choreographyStyle:r==="PalaceCourt"||r==="Temple"||r==="RiverGhat"||e.primaryRole==="NobleWoman"||e.primaryRole==="KingCrown"?"sufiKathak":"viralBounce",T=Math.max(u.topY,E?.topY??0),y=Math.max(.66,Math.min(1.08,T*.5)),x=(e.height>e.width?5.65:4.25)+(g.length>0?e.height>e.width?1.1:1.45:0),S=e.height>e.width,b=new Ht(S?40:37,e.width/Math.max(1,e.height),.1,100),C=new L(0,y+.24,x),H=new L(0,y,0);b.position.copy(C),b.lookAt(H);let _=Number.NaN;return{resize(w,P){t.setSize(w,P,!1),b.aspect=w/Math.max(1,P),b.updateProjectionMatrix()},render(w,P,I,B,F){bd(o,w,w%60/60,0,.5,null),F&&(I=Math.max(I,.36*Math.pow(1-F.phase,2)));let W=I>.55?"surprised":I>.25?"laughing":"happy";if(Ad(c,w,w%60/60,h?"Left":"Narrator",d,f,W,.5,s.palette.primaryHex,s.palette.secondaryHex),a){let ge=1.03+.03*Math.sin(w*.45);a.scale.setScalar(ge)}let Y=FE(F,w,I),Q=(ge,pe)=>({...ge,hipOffsetX:ge.hipOffsetX*pe,grooveBend:ge.grooveBend??Y}),N=P[0]?Q(B?Ra(P[0]):P[0],.45):null,ee=F?.phase??0;if(N?(gr(u,N,w),u.root.rotation.y=h?.2:0):(ba(u,w,p,ee,!1,0,I),u.root.rotation.y=h?.18:0),E){let ge=P[1]?Q(B?Ra(P[1]):P[1],.45):null;if(ge)gr(E,ge,w);else if(N){let pe=Ra(N);gr(E,{...pe,hipOffsetX:pe.hipOffsetX*.55,emotion:I>.45?"laughing":"happy",mouthOpen:I>.4?.55:.2},w)}else ba(E,w,p,ee,!0,.14,I);E.root.rotation.y=-.18}for(let ge of g){if(N&&P.length>0&&p==="viralBounce"){let pe=ge.side>0?Ra(N):N;gr(ge.rig,{...pe,hipOffsetX:pe.hipOffsetX*.35,liftY:0},w+ge.phaseOffset)}else ba(ge.rig,w,p,ee,ge.side>0,ge.phaseOffset,I);ge.rig.root.rotation.y=ge.baseRotY}let $=x,fe=0,be=y+.24,Re=$,K=y,ae=e.cameraAngle??"autoCut",Ee=0;ae==="autoCut"&&(Ee=Math.floor(F?F.index/4:w/2.6),ae=["front","left34","right34","lowHero"][(Ee%4+4)%4]),ae==="left34"?(fe=-1.75,be=y+.36,Re=$*.92):ae==="right34"?(fe=1.75,be=y+.36,Re=$*.92):ae==="lowHero"&&(fe=.25,be=Math.max(.55,y-.18),Re=$*.88,K=y+.14);let me=h?0:u.root.position.x+u.bodyPivot.position.x*.7,le=g.length>0?me*.4:me;fe+=le,e.dynamicZoom!==!1&&(Re-=Math.min(.75,I*.85),F&&(Re-=.22*Math.pow(1-F.phase,3)),fe+=Math.sin(w*1.1)*.1);let He=Ee!==_;_=Ee;let ne=He?1:.18;C.lerp(new L(fe,be,Re),ne),H.lerp(new L(le,K,0),ne),b.position.copy(C),b.lookAt(H),t.render(i,b)},dispose(){l?.dispose(),t.dispose()}}}export{Ex as createMotion3DStage};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
