var Lc=0,El=1,Bc=2;var gl=1,vo=2,wn=3,Un=0,Ut=1,at=2,Nn=0,yi=1,Tn=2,Ml=3,yl=4,Gc=5,ti=100,Uc=101,Fc=102,Nc=103,Oc=104,kc=200,zc=201,Vc=202,Wc=203,Yr=204,qr=205,Xc=206,Yc=207,qc=208,Zc=209,Jc=210,Kc=211,$c=212,Qc=213,jc=214,So=0,bo=1,Ro=2,xi=3,Ao=4,Co=5,Ho=6,Po=7,xl=0,eh=1,th=2,On=0,nh=1,ih=2,sh=3,Io=4,rh=5,oh=6,ah=7;var _l=300,Ai=301,Ci=302,Do=303,Lo=304,ir=306,Zr=1e3,ei=1001,Jr=1002,ln=1003,lh=1004;var sr=1005;var gn=1006,Bo=1007;var li=1008;var vn=1009,wl=1010,Tl=1011,ls=1012,Go=1013,ci=1014,Sn=1015,hi=1016,Uo=1017,Fo=1018,cs=1020,vl=35902,Sl=1021,bl=1022,dn=1023,Rl=1024,Al=1025,Ki=1026,hs=1027,Cl=1028,No=1029,Hl=1030,Oo=1031;var ko=1033,rr=33776,or=33777,ar=33778,lr=33779,zo=35840,Vo=35841,Wo=35842,Xo=35843,Yo=36196,qo=37492,Zo=37496,Jo=37808,Ko=37809,$o=37810,Qo=37811,jo=37812,ea=37813,ta=37814,na=37815,ia=37816,sa=37817,ra=37818,oa=37819,aa=37820,la=37821,cr=36492,ca=36494,ha=36495,Pl=36283,da=36284,ua=36285,fa=36286;var Is=2300,Kr=2301,Xr=2302,sl=2400,rl=2401,ol=2402;var ch=3200,hh=3201;var Il=0,dh=1,kn="",Lt="srgb",_i="srgb-linear",Ds="linear",Et="srgb";var Mi=7680;var al=519,uh=512,fh=513,ph=514,Dl=515,mh=516,Eh=517,gh=518,Mh=519,ll=35044;var Ll="300 es",xn=2e3,Ls=2001;var Fn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Ha=Math.PI/180,Bs=180/Math.PI;function hr(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]).toLowerCase()}function it(n,e,t){return Math.max(e,Math.min(t,n))}function Rd(n,e){return(n%e+e)%e}function Pa(n,e,t){return(1-t)*n+t*e}function Ts(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function qt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var be=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=it(this.x,e.x,t.x),this.y=it(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=it(this.x,e,t),this.y=it(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(it(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(it(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},je=class n{constructor(e,t,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],d=i[7],p=i[2],u=i[5],m=i[8],M=s[0],g=s[3],f=s[6],_=s[1],w=s[4],y=s[7],b=s[2],R=s[5],C=s[8];return r[0]=o*M+a*_+l*b,r[3]=o*g+a*w+l*R,r[6]=o*f+a*y+l*C,r[1]=c*M+h*_+d*b,r[4]=c*g+h*w+d*R,r[7]=c*f+h*y+d*C,r[2]=p*M+u*_+m*b,r[5]=p*g+u*w+m*R,r[8]=p*f+u*y+m*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=h*o-a*c,p=a*l-h*r,u=c*r-o*l,m=t*d+i*p+s*u;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let M=1/m;return e[0]=d*M,e[1]=(s*c-h*i)*M,e[2]=(a*i-s*o)*M,e[3]=p*M,e[4]=(h*t-s*l)*M,e[5]=(s*r-a*t)*M,e[6]=u*M,e[7]=(i*l-c*t)*M,e[8]=(o*t-i*r)*M,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Ia.makeScale(e,t)),this}rotate(e){return this.premultiply(Ia.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ia.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ia=new je;function Bl(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function $i(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function yh(){let n=$i("canvas");return n.style.display="block",n}var ac={};function dr(n){n in ac||(ac[n]=!0,console.warn(n))}function xh(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function _h(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function wh(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var lc=new je().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),cc=new je().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ad(){let n={enabled:!0,workingColorSpace:_i,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Et&&(s.r=Gn(s.r),s.g=Gn(s.g),s.b=Gn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Et&&(s.r=Ji(s.r),s.g=Ji(s.g),s.b=Ji(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===kn?Ds:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[_i]:{primaries:e,whitePoint:i,transfer:Ds,toXYZ:lc,fromXYZ:cc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Lt},outputColorSpaceConfig:{drawingBufferColorSpace:Lt}},[Lt]:{primaries:e,whitePoint:i,transfer:Et,toXYZ:lc,fromXYZ:cc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Lt}}}),n}var ct=Ad();function Gn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ji(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Ui,$r=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Ui===void 0&&(Ui=$i("canvas")),Ui.width=e.width,Ui.height=e.height;let s=Ui.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=Ui}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=$i("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Gn(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Gn(t[i]/255)*255):t[i]=Gn(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Cd=0,Qi=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Cd++}),this.uuid=hr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Da(s[o].image)):r.push(Da(s[o]))}else r=Da(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Da(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?$r.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Hd=0,Vt=class n extends Fn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=ei,s=ei,r=gn,o=li,a=dn,l=vn,c=n.DEFAULT_ANISOTROPY,h=kn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Hd++}),this.uuid=hr(),this.name="",this.source=new Qi(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new be(0,0),this.repeat=new be(1,1),this.center=new be(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new je,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==_l)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Zr:e.x=e.x-Math.floor(e.x);break;case ei:e.x=e.x<0?0:1;break;case Jr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Zr:e.y=e.y-Math.floor(e.y);break;case ei:e.y=e.y<0?0:1;break;case Jr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Vt.DEFAULT_IMAGE=null;Vt.DEFAULT_MAPPING=_l;Vt.DEFAULT_ANISOTROPY=1;var dt=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],d=l[8],p=l[1],u=l[5],m=l[9],M=l[2],g=l[6],f=l[10];if(Math.abs(h-p)<.01&&Math.abs(d-M)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+p)<.1&&Math.abs(d+M)<.1&&Math.abs(m+g)<.1&&Math.abs(c+u+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(c+1)/2,y=(u+1)/2,b=(f+1)/2,R=(h+p)/4,C=(d+M)/4,H=(m+g)/4;return w>y&&w>b?w<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(w),s=R/i,r=C/i):y>b?y<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),i=R/s,r=H/s):b<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),i=C/r,s=H/r),this.set(i,s,r,t),this}let _=Math.sqrt((g-m)*(g-m)+(d-M)*(d-M)+(p-h)*(p-h));return Math.abs(_)<.001&&(_=1),this.x=(g-m)/_,this.y=(d-M)/_,this.z=(p-h)/_,this.w=Math.acos((c+u+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=it(this.x,e.x,t.x),this.y=it(this.y,e.y,t.y),this.z=it(this.z,e.z,t.z),this.w=it(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=it(this.x,e,t),this.y=it(this.y,e,t),this.z=it(this.z,e,t),this.w=it(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(it(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Qr=class extends Fn{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t);let s={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:gn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new Vt(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Qi(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},cn=class extends Qr{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Gs=class extends Vt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=ei,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var jr=class extends Vt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=ei,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var vt=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],d=i[s+3],p=r[o+0],u=r[o+1],m=r[o+2],M=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d;return}if(a===1){e[t+0]=p,e[t+1]=u,e[t+2]=m,e[t+3]=M;return}if(d!==M||l!==p||c!==u||h!==m){let g=1-a,f=l*p+c*u+h*m+d*M,_=f>=0?1:-1,w=1-f*f;if(w>Number.EPSILON){let b=Math.sqrt(w),R=Math.atan2(b,f*_);g=Math.sin(g*R)/b,a=Math.sin(a*R)/b}let y=a*_;if(l=l*g+p*y,c=c*g+u*y,h=h*g+m*y,d=d*g+M*y,g===1-a){let b=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=b,c*=b,h*=b,d*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],d=r[o],p=r[o+1],u=r[o+2],m=r[o+3];return e[t]=a*m+h*d+l*u-c*p,e[t+1]=l*m+h*p+c*d-a*u,e[t+2]=c*m+h*u+a*p-l*d,e[t+3]=h*m-a*d-l*p-c*u,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),d=a(r/2),p=l(i/2),u=l(s/2),m=l(r/2);switch(o){case"XYZ":this._x=p*h*d+c*u*m,this._y=c*u*d-p*h*m,this._z=c*h*m+p*u*d,this._w=c*h*d-p*u*m;break;case"YXZ":this._x=p*h*d+c*u*m,this._y=c*u*d-p*h*m,this._z=c*h*m-p*u*d,this._w=c*h*d+p*u*m;break;case"ZXY":this._x=p*h*d-c*u*m,this._y=c*u*d+p*h*m,this._z=c*h*m+p*u*d,this._w=c*h*d-p*u*m;break;case"ZYX":this._x=p*h*d-c*u*m,this._y=c*u*d+p*h*m,this._z=c*h*m-p*u*d,this._w=c*h*d+p*u*m;break;case"YZX":this._x=p*h*d+c*u*m,this._y=c*u*d+p*h*m,this._z=c*h*m-p*u*d,this._w=c*h*d-p*u*m;break;case"XZY":this._x=p*h*d-c*u*m,this._y=c*u*d-p*h*m,this._z=c*h*m+p*u*d,this._w=c*h*d+p*u*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],d=t[10],p=i+a+d;if(p>0){let u=.5/Math.sqrt(p+1);this._w=.25/u,this._x=(h-l)*u,this._y=(r-c)*u,this._z=(o-s)*u}else if(i>a&&i>d){let u=2*Math.sqrt(1+i-a-d);this._w=(h-l)/u,this._x=.25*u,this._y=(s+o)/u,this._z=(r+c)/u}else if(a>d){let u=2*Math.sqrt(1+a-i-d);this._w=(r-c)/u,this._x=(s+o)/u,this._y=.25*u,this._z=(l+h)/u}else{let u=2*Math.sqrt(1+d-i-a);this._w=(o-s)/u,this._x=(r+c)/u,this._y=(l+h)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(it(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let u=1-t;return this._w=u*o+t*this._w,this._x=u*i+t*this._x,this._y=u*s+t*this._y,this._z=u*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),d=Math.sin((1-t)*h)/c,p=Math.sin(t*h)/c;return this._w=o*d+this._w*p,this._x=i*d+this._x*p,this._y=s*d+this._y*p,this._z=r*d+this._z*p,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(hc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(hc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),h=2*(a*t-r*s),d=2*(r*i-o*t);return this.x=t+l*c+o*d-a*h,this.y=i+l*h+a*c-r*d,this.z=s+l*d+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=it(this.x,e.x,t.x),this.y=it(this.y,e.y,t.y),this.z=it(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=it(this.x,e,t),this.y=it(this.y,e,t),this.z=it(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(it(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return La.copy(this).projectOnVector(e),this.sub(La)}reflect(e){return this.sub(La.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(it(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},La=new L,hc=new vt,ni=class{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(pn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(pn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=pn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,pn):pn.fromBufferAttribute(r,o),pn.applyMatrix4(e.matrixWorld),this.expandByPoint(pn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),wr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),wr.copy(i.boundingBox)),wr.applyMatrix4(e.matrixWorld),this.union(wr)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,pn),pn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(vs),Tr.subVectors(this.max,vs),Fi.subVectors(e.a,vs),Ni.subVectors(e.b,vs),Oi.subVectors(e.c,vs),qn.subVectors(Ni,Fi),Zn.subVectors(Oi,Ni),pi.subVectors(Fi,Oi);let t=[0,-qn.z,qn.y,0,-Zn.z,Zn.y,0,-pi.z,pi.y,qn.z,0,-qn.x,Zn.z,0,-Zn.x,pi.z,0,-pi.x,-qn.y,qn.x,0,-Zn.y,Zn.x,0,-pi.y,pi.x,0];return!Ba(t,Fi,Ni,Oi,Tr)||(t=[1,0,0,0,1,0,0,0,1],!Ba(t,Fi,Ni,Oi,Tr))?!1:(vr.crossVectors(qn,Zn),t=[vr.x,vr.y,vr.z],Ba(t,Fi,Ni,Oi,Tr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,pn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(pn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Pn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Pn=[new L,new L,new L,new L,new L,new L,new L,new L],pn=new L,wr=new ni,Fi=new L,Ni=new L,Oi=new L,qn=new L,Zn=new L,pi=new L,vs=new L,Tr=new L,vr=new L,mi=new L;function Ba(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){mi.fromArray(n,r);let a=s.x*Math.abs(mi.x)+s.y*Math.abs(mi.y)+s.z*Math.abs(mi.z),l=e.dot(mi),c=t.dot(mi),h=i.dot(mi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Pd=new ni,Ss=new L,Ga=new L,ii=class{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Pd.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ss.subVectors(e,this.center);let t=Ss.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Ss,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ga.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ss.copy(e.center).add(Ga)),this.expandByPoint(Ss.copy(e.center).sub(Ga))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},In=new L,Ua=new L,Sr=new L,Jn=new L,Fa=new L,br=new L,Na=new L,ji=class{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,In)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=In.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(In.copy(this.origin).addScaledVector(this.direction,t),In.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Ua.copy(e).add(t).multiplyScalar(.5),Sr.copy(t).sub(e).normalize(),Jn.copy(this.origin).sub(Ua);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Sr),a=Jn.dot(this.direction),l=-Jn.dot(Sr),c=Jn.lengthSq(),h=Math.abs(1-o*o),d,p,u,m;if(h>0)if(d=o*l-a,p=o*a-l,m=r*h,d>=0)if(p>=-m)if(p<=m){let M=1/h;d*=M,p*=M,u=d*(d+o*p+2*a)+p*(o*d+p+2*l)+c}else p=r,d=Math.max(0,-(o*p+a)),u=-d*d+p*(p+2*l)+c;else p=-r,d=Math.max(0,-(o*p+a)),u=-d*d+p*(p+2*l)+c;else p<=-m?(d=Math.max(0,-(-o*r+a)),p=d>0?-r:Math.min(Math.max(-r,-l),r),u=-d*d+p*(p+2*l)+c):p<=m?(d=0,p=Math.min(Math.max(-r,-l),r),u=p*(p+2*l)+c):(d=Math.max(0,-(o*r+a)),p=d>0?r:Math.min(Math.max(-r,-l),r),u=-d*d+p*(p+2*l)+c);else p=o>0?-r:r,d=Math.max(0,-(o*p+a)),u=-d*d+p*(p+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Ua).addScaledVector(Sr,p),u}intersectSphere(e,t){In.subVectors(e.center,this.origin);let i=In.dot(this.direction),s=In.dot(In)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,p=this.origin;return c>=0?(i=(e.min.x-p.x)*c,s=(e.max.x-p.x)*c):(i=(e.max.x-p.x)*c,s=(e.min.x-p.x)*c),h>=0?(r=(e.min.y-p.y)*h,o=(e.max.y-p.y)*h):(r=(e.max.y-p.y)*h,o=(e.min.y-p.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-p.z)*d,l=(e.max.z-p.z)*d):(a=(e.max.z-p.z)*d,l=(e.min.z-p.z)*d),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,In)!==null}intersectTriangle(e,t,i,s,r){Fa.subVectors(t,e),br.subVectors(i,e),Na.crossVectors(Fa,br);let o=this.direction.dot(Na),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Jn.subVectors(this.origin,e);let l=a*this.direction.dot(br.crossVectors(Jn,br));if(l<0)return null;let c=a*this.direction.dot(Fa.cross(Jn));if(c<0||l+c>o)return null;let h=-a*Jn.dot(Na);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ut=class n{constructor(e,t,i,s,r,o,a,l,c,h,d,p,u,m,M,g){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,h,d,p,u,m,M,g)}set(e,t,i,s,r,o,a,l,c,h,d,p,u,m,M,g){let f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=s,f[1]=r,f[5]=o,f[9]=a,f[13]=l,f[2]=c,f[6]=h,f[10]=d,f[14]=p,f[3]=u,f[7]=m,f[11]=M,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/ki.setFromMatrixColumn(e,0).length(),r=1/ki.setFromMatrixColumn(e,1).length(),o=1/ki.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let p=o*h,u=o*d,m=a*h,M=a*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=u+m*c,t[5]=p-M*c,t[9]=-a*l,t[2]=M-p*c,t[6]=m+u*c,t[10]=o*l}else if(e.order==="YXZ"){let p=l*h,u=l*d,m=c*h,M=c*d;t[0]=p+M*a,t[4]=m*a-u,t[8]=o*c,t[1]=o*d,t[5]=o*h,t[9]=-a,t[2]=u*a-m,t[6]=M+p*a,t[10]=o*l}else if(e.order==="ZXY"){let p=l*h,u=l*d,m=c*h,M=c*d;t[0]=p-M*a,t[4]=-o*d,t[8]=m+u*a,t[1]=u+m*a,t[5]=o*h,t[9]=M-p*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let p=o*h,u=o*d,m=a*h,M=a*d;t[0]=l*h,t[4]=m*c-u,t[8]=p*c+M,t[1]=l*d,t[5]=M*c+p,t[9]=u*c-m,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let p=o*l,u=o*c,m=a*l,M=a*c;t[0]=l*h,t[4]=M-p*d,t[8]=m*d+u,t[1]=d,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=u*d+m,t[10]=p-M*d}else if(e.order==="XZY"){let p=o*l,u=o*c,m=a*l,M=a*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=p*d+M,t[5]=o*h,t[9]=u*d-m,t[2]=m*d-u,t[6]=a*h,t[10]=M*d+p}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Id,e,Dd)}lookAt(e,t,i){let s=this.elements;return $t.subVectors(e,t),$t.lengthSq()===0&&($t.z=1),$t.normalize(),Kn.crossVectors(i,$t),Kn.lengthSq()===0&&(Math.abs(i.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),Kn.crossVectors(i,$t)),Kn.normalize(),Rr.crossVectors($t,Kn),s[0]=Kn.x,s[4]=Rr.x,s[8]=$t.x,s[1]=Kn.y,s[5]=Rr.y,s[9]=$t.y,s[2]=Kn.z,s[6]=Rr.z,s[10]=$t.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],d=i[5],p=i[9],u=i[13],m=i[2],M=i[6],g=i[10],f=i[14],_=i[3],w=i[7],y=i[11],b=i[15],R=s[0],C=s[4],H=s[8],T=s[12],x=s[1],I=s[5],B=s[9],G=s[13],N=s[2],W=s[6],z=s[10],J=s[14],U=s[3],Q=s[7],te=s[11],ue=s[15];return r[0]=o*R+a*x+l*N+c*U,r[4]=o*C+a*I+l*W+c*Q,r[8]=o*H+a*B+l*z+c*te,r[12]=o*T+a*G+l*J+c*ue,r[1]=h*R+d*x+p*N+u*U,r[5]=h*C+d*I+p*W+u*Q,r[9]=h*H+d*B+p*z+u*te,r[13]=h*T+d*G+p*J+u*ue,r[2]=m*R+M*x+g*N+f*U,r[6]=m*C+M*I+g*W+f*Q,r[10]=m*H+M*B+g*z+f*te,r[14]=m*T+M*G+g*J+f*ue,r[3]=_*R+w*x+y*N+b*U,r[7]=_*C+w*I+y*W+b*Q,r[11]=_*H+w*B+y*z+b*te,r[15]=_*T+w*G+y*J+b*ue,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],d=e[6],p=e[10],u=e[14],m=e[3],M=e[7],g=e[11],f=e[15];return m*(+r*l*d-s*c*d-r*a*p+i*c*p+s*a*u-i*l*u)+M*(+t*l*u-t*c*p+r*o*p-s*o*u+s*c*h-r*l*h)+g*(+t*c*d-t*a*u-r*o*d+i*o*u+r*a*h-i*c*h)+f*(-s*a*h-t*l*d+t*a*p+s*o*d-i*o*p+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=e[9],p=e[10],u=e[11],m=e[12],M=e[13],g=e[14],f=e[15],_=d*g*c-M*p*c+M*l*u-a*g*u-d*l*f+a*p*f,w=m*p*c-h*g*c-m*l*u+o*g*u+h*l*f-o*p*f,y=h*M*c-m*d*c+m*a*u-o*M*u-h*a*f+o*d*f,b=m*d*l-h*M*l-m*a*p+o*M*p+h*a*g-o*d*g,R=t*_+i*w+s*y+r*b;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/R;return e[0]=_*C,e[1]=(M*p*r-d*g*r-M*s*u+i*g*u+d*s*f-i*p*f)*C,e[2]=(a*g*r-M*l*r+M*s*c-i*g*c-a*s*f+i*l*f)*C,e[3]=(d*l*r-a*p*r-d*s*c+i*p*c+a*s*u-i*l*u)*C,e[4]=w*C,e[5]=(h*g*r-m*p*r+m*s*u-t*g*u-h*s*f+t*p*f)*C,e[6]=(m*l*r-o*g*r-m*s*c+t*g*c+o*s*f-t*l*f)*C,e[7]=(o*p*r-h*l*r+h*s*c-t*p*c-o*s*u+t*l*u)*C,e[8]=y*C,e[9]=(m*d*r-h*M*r-m*i*u+t*M*u+h*i*f-t*d*f)*C,e[10]=(o*M*r-m*a*r+m*i*c-t*M*c-o*i*f+t*a*f)*C,e[11]=(h*a*r-o*d*r-h*i*c+t*d*c+o*i*u-t*a*u)*C,e[12]=b*C,e[13]=(h*M*s-m*d*s+m*i*p-t*M*p-h*i*g+t*d*g)*C,e[14]=(m*a*s-o*M*s-m*i*l+t*M*l+o*i*g-t*a*g)*C,e[15]=(o*d*s-h*a*s+h*i*l-t*d*l-o*i*p+t*a*p)*C,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,d=a+a,p=r*c,u=r*h,m=r*d,M=o*h,g=o*d,f=a*d,_=l*c,w=l*h,y=l*d,b=i.x,R=i.y,C=i.z;return s[0]=(1-(M+f))*b,s[1]=(u+y)*b,s[2]=(m-w)*b,s[3]=0,s[4]=(u-y)*R,s[5]=(1-(p+f))*R,s[6]=(g+_)*R,s[7]=0,s[8]=(m+w)*C,s[9]=(g-_)*C,s[10]=(1-(p+M))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=ki.set(s[0],s[1],s[2]).length(),o=ki.set(s[4],s[5],s[6]).length(),a=ki.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],mn.copy(this);let c=1/r,h=1/o,d=1/a;return mn.elements[0]*=c,mn.elements[1]*=c,mn.elements[2]*=c,mn.elements[4]*=h,mn.elements[5]*=h,mn.elements[6]*=h,mn.elements[8]*=d,mn.elements[9]*=d,mn.elements[10]*=d,t.setFromRotationMatrix(mn),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=xn){let l=this.elements,c=2*r/(t-e),h=2*r/(i-s),d=(t+e)/(t-e),p=(i+s)/(i-s),u,m;if(a===xn)u=-(o+r)/(o-r),m=-2*o*r/(o-r);else if(a===Ls)u=-o/(o-r),m=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=u,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=xn){let l=this.elements,c=1/(t-e),h=1/(i-s),d=1/(o-r),p=(t+e)*c,u=(i+s)*h,m,M;if(a===xn)m=(o+r)*d,M=-2*d;else if(a===Ls)m=r*d,M=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-p,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-u,l[2]=0,l[6]=0,l[10]=M,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},ki=new L,mn=new ut,Id=new L(0,0,0),Dd=new L(1,1,1),Kn=new L,Rr=new L,$t=new L,dc=new ut,uc=new vt,Wt=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],d=s[2],p=s[6],u=s[10];switch(t){case"XYZ":this._y=Math.asin(it(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,u),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-it(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,u),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(it(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-d,u),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-it(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(p,u),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(it(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,u));break;case"XZY":this._z=Math.asin(-it(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,u),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return dc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(dc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return uc.setFromEuler(this),this.setFromQuaternion(uc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Wt.DEFAULT_ORDER="XYZ";var Us=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Ld=0,fc=new L,zi=new vt,Dn=new ut,Ar=new L,bs=new L,Bd=new L,Gd=new vt,pc=new L(1,0,0),mc=new L(0,1,0),Ec=new L(0,0,1),gc={type:"added"},Ud={type:"removed"},Vi={type:"childadded",child:null},Oa={type:"childremoved",child:null},wt=class n extends Fn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ld++}),this.uuid=hr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new L,t=new Wt,i=new vt,s=new L(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ut},normalMatrix:{value:new je}}),this.matrix=new ut,this.matrixWorld=new ut,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Us,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return zi.setFromAxisAngle(e,t),this.quaternion.multiply(zi),this}rotateOnWorldAxis(e,t){return zi.setFromAxisAngle(e,t),this.quaternion.premultiply(zi),this}rotateX(e){return this.rotateOnAxis(pc,e)}rotateY(e){return this.rotateOnAxis(mc,e)}rotateZ(e){return this.rotateOnAxis(Ec,e)}translateOnAxis(e,t){return fc.copy(e).applyQuaternion(this.quaternion),this.position.add(fc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(pc,e)}translateY(e){return this.translateOnAxis(mc,e)}translateZ(e){return this.translateOnAxis(Ec,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Dn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ar.copy(e):Ar.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),bs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Dn.lookAt(bs,Ar,this.up):Dn.lookAt(Ar,bs,this.up),this.quaternion.setFromRotationMatrix(Dn),s&&(Dn.extractRotation(s.matrixWorld),zi.setFromRotationMatrix(Dn),this.quaternion.premultiply(zi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(gc),Vi.child=e,this.dispatchEvent(Vi),Vi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ud),Oa.child=e,this.dispatchEvent(Oa),Oa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Dn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Dn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Dn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(gc),Vi.child=e,this.dispatchEvent(Vi),Vi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(bs,e,Bd),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(bs,Gd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),d=o(e.shapes),p=o(e.skeletons),u=o(e.animations),m=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),p.length>0&&(i.skeletons=p),u.length>0&&(i.animations=u),m.length>0&&(i.nodes=m)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};wt.DEFAULT_UP=new L(0,1,0);wt.DEFAULT_MATRIX_AUTO_UPDATE=!0;wt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var En=new L,Ln=new L,ka=new L,Bn=new L,Wi=new L,Xi=new L,Mc=new L,za=new L,Va=new L,Wa=new L,Xa=new dt,Ya=new dt,qa=new dt,jn=class n{constructor(e=new L,t=new L,i=new L){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),En.subVectors(e,t),s.cross(En);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){En.subVectors(s,t),Ln.subVectors(i,t),ka.subVectors(e,t);let o=En.dot(En),a=En.dot(Ln),l=En.dot(ka),c=Ln.dot(Ln),h=Ln.dot(ka),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let p=1/d,u=(c*l-a*h)*p,m=(o*h-a*l)*p;return r.set(1-u-m,m,u)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,Bn)===null?!1:Bn.x>=0&&Bn.y>=0&&Bn.x+Bn.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,Bn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Bn.x),l.addScaledVector(o,Bn.y),l.addScaledVector(a,Bn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return Xa.setScalar(0),Ya.setScalar(0),qa.setScalar(0),Xa.fromBufferAttribute(e,t),Ya.fromBufferAttribute(e,i),qa.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Xa,r.x),o.addScaledVector(Ya,r.y),o.addScaledVector(qa,r.z),o}static isFrontFacing(e,t,i,s){return En.subVectors(i,t),Ln.subVectors(e,t),En.cross(Ln).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return En.subVectors(this.c,this.b),Ln.subVectors(this.a,this.b),En.cross(Ln).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;Wi.subVectors(s,i),Xi.subVectors(r,i),za.subVectors(e,i);let l=Wi.dot(za),c=Xi.dot(za);if(l<=0&&c<=0)return t.copy(i);Va.subVectors(e,s);let h=Wi.dot(Va),d=Xi.dot(Va);if(h>=0&&d<=h)return t.copy(s);let p=l*d-h*c;if(p<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector(Wi,o);Wa.subVectors(e,r);let u=Wi.dot(Wa),m=Xi.dot(Wa);if(m>=0&&u<=m)return t.copy(r);let M=u*c-l*m;if(M<=0&&c>=0&&m<=0)return a=c/(c-m),t.copy(i).addScaledVector(Xi,a);let g=h*m-u*d;if(g<=0&&d-h>=0&&u-m>=0)return Mc.subVectors(r,s),a=(d-h)/(d-h+(u-m)),t.copy(s).addScaledVector(Mc,a);let f=1/(g+M+p);return o=M*f,a=p*f,t.copy(i).addScaledVector(Wi,o).addScaledVector(Xi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Th={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},$n={h:0,s:0,l:0},Cr={h:0,s:0,l:0};function Za(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Pe=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Lt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ct.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=ct.workingColorSpace){return this.r=e,this.g=t,this.b=i,ct.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=ct.workingColorSpace){if(e=Rd(e,1),t=it(t,0,1),i=it(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Za(o,r,e+1/3),this.g=Za(o,r,e),this.b=Za(o,r,e-1/3)}return ct.toWorkingColorSpace(this,s),this}setStyle(e,t=Lt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Lt){let i=Th[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Gn(e.r),this.g=Gn(e.g),this.b=Gn(e.b),this}copyLinearToSRGB(e){return this.r=Ji(e.r),this.g=Ji(e.g),this.b=Ji(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Lt){return ct.fromWorkingColorSpace(Ot.copy(this),e),Math.round(it(Ot.r*255,0,255))*65536+Math.round(it(Ot.g*255,0,255))*256+Math.round(it(Ot.b*255,0,255))}getHexString(e=Lt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ct.workingColorSpace){ct.fromWorkingColorSpace(Ot.copy(this),t);let i=Ot.r,s=Ot.g,r=Ot.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=h<=.5?d/(o+a):d/(2-o-a),o){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=ct.workingColorSpace){return ct.fromWorkingColorSpace(Ot.copy(this),t),e.r=Ot.r,e.g=Ot.g,e.b=Ot.b,e}getStyle(e=Lt){ct.fromWorkingColorSpace(Ot.copy(this),e);let t=Ot.r,i=Ot.g,s=Ot.b;return e!==Lt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL($n),this.setHSL($n.h+e,$n.s+t,$n.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL($n),e.getHSL(Cr);let i=Pa($n.h,Cr.h,t),s=Pa($n.s,Cr.s,t),r=Pa($n.l,Cr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ot=new Pe;Pe.NAMES=Th;var Fd=0,Mn=class extends Fn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Fd++}),this.uuid=hr(),this.name="",this.type="Material",this.blending=yi,this.side=Un,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Yr,this.blendDst=qr,this.blendEquation=ti,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Pe(0,0,0),this.blendAlpha=0,this.depthFunc=xi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=al,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Mi,this.stencilZFail=Mi,this.stencilZPass=Mi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==yi&&(i.blending=this.blending),this.side!==Un&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Yr&&(i.blendSrc=this.blendSrc),this.blendDst!==qr&&(i.blendDst=this.blendDst),this.blendEquation!==ti&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==xi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==al&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Mi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Mi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Mi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Se=class extends Mn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Pe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.combine=xl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Rt=new L,Hr=new be,Nd=0,Bt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Nd++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=ll,this.updateRanges=[],this.gpuType=Sn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Hr.fromBufferAttribute(this,t),Hr.applyMatrix3(e),this.setXY(t,Hr.x,Hr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix3(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix4(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyNormalMatrix(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.transformDirection(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ts(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=qt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ts(t,this.array)),t}setX(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ts(t,this.array)),t}setY(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ts(t,this.array)),t}setZ(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ts(t,this.array)),t}setW(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),i=qt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),i=qt(i,this.array),s=qt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),i=qt(i,this.array),s=qt(s,this.array),r=qt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ll&&(e.usage=this.usage),e}};var Fs=class extends Bt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Ns=class extends Bt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var st=class extends Bt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Od=0,on=new ut,Ja=new wt,Yi=new L,Qt=new ni,Rs=new ni,It=new L,Tt=class n extends Fn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Od++}),this.uuid=hr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Bl(e)?Ns:Fs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new je().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return on.makeRotationFromQuaternion(e),this.applyMatrix4(on),this}rotateX(e){return on.makeRotationX(e),this.applyMatrix4(on),this}rotateY(e){return on.makeRotationY(e),this.applyMatrix4(on),this}rotateZ(e){return on.makeRotationZ(e),this.applyMatrix4(on),this}translate(e,t,i){return on.makeTranslation(e,t,i),this.applyMatrix4(on),this}scale(e,t,i){return on.makeScale(e,t,i),this.applyMatrix4(on),this}lookAt(e){return Ja.lookAt(e),Ja.updateMatrix(),this.applyMatrix4(Ja.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Yi).negate(),this.translate(Yi.x,Yi.y,Yi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new st(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ni);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];Qt.setFromBufferAttribute(r),this.morphTargetsRelative?(It.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(It),It.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(It)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ii);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(e){let i=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Rs.setFromBufferAttribute(a),this.morphTargetsRelative?(It.addVectors(Qt.min,Rs.min),Qt.expandByPoint(It),It.addVectors(Qt.max,Rs.max),Qt.expandByPoint(It)):(Qt.expandByPoint(Rs.min),Qt.expandByPoint(Rs.max))}Qt.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)It.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(It));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)It.fromBufferAttribute(a,c),l&&(Yi.fromBufferAttribute(e,c),It.add(Yi)),s=Math.max(s,i.distanceToSquared(It))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Bt(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let H=0;H<i.count;H++)a[H]=new L,l[H]=new L;let c=new L,h=new L,d=new L,p=new be,u=new be,m=new be,M=new L,g=new L;function f(H,T,x){c.fromBufferAttribute(i,H),h.fromBufferAttribute(i,T),d.fromBufferAttribute(i,x),p.fromBufferAttribute(r,H),u.fromBufferAttribute(r,T),m.fromBufferAttribute(r,x),h.sub(c),d.sub(c),u.sub(p),m.sub(p);let I=1/(u.x*m.y-m.x*u.y);isFinite(I)&&(M.copy(h).multiplyScalar(m.y).addScaledVector(d,-u.y).multiplyScalar(I),g.copy(d).multiplyScalar(u.x).addScaledVector(h,-m.x).multiplyScalar(I),a[H].add(M),a[T].add(M),a[x].add(M),l[H].add(g),l[T].add(g),l[x].add(g))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let H=0,T=_.length;H<T;++H){let x=_[H],I=x.start,B=x.count;for(let G=I,N=I+B;G<N;G+=3)f(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let w=new L,y=new L,b=new L,R=new L;function C(H){b.fromBufferAttribute(s,H),R.copy(b);let T=a[H];w.copy(T),w.sub(b.multiplyScalar(b.dot(T))).normalize(),y.crossVectors(R,T);let I=y.dot(l[H])<0?-1:1;o.setXYZW(H,w.x,w.y,w.z,I)}for(let H=0,T=_.length;H<T;++H){let x=_[H],I=x.start,B=x.count;for(let G=I,N=I+B;G<N;G+=3)C(e.getX(G+0)),C(e.getX(G+1)),C(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Bt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let p=0,u=i.count;p<u;p++)i.setXYZ(p,0,0,0);let s=new L,r=new L,o=new L,a=new L,l=new L,c=new L,h=new L,d=new L;if(e)for(let p=0,u=e.count;p<u;p+=3){let m=e.getX(p+0),M=e.getX(p+1),g=e.getX(p+2);s.fromBufferAttribute(t,m),r.fromBufferAttribute(t,M),o.fromBufferAttribute(t,g),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(i,m),l.fromBufferAttribute(i,M),c.fromBufferAttribute(i,g),a.add(h),l.add(h),c.add(h),i.setXYZ(m,a.x,a.y,a.z),i.setXYZ(M,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let p=0,u=t.count;p<u;p+=3)s.fromBufferAttribute(t,p+0),r.fromBufferAttribute(t,p+1),o.fromBufferAttribute(t,p+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),i.setXYZ(p+0,h.x,h.y,h.z),i.setXYZ(p+1,h.x,h.y,h.z),i.setXYZ(p+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)It.fromBufferAttribute(e,t),It.normalize(),e.setXYZ(t,It.x,It.y,It.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,d=a.normalized,p=new c.constructor(l.length*h),u=0,m=0;for(let M=0,g=l.length;M<g;M++){a.isInterleavedBufferAttribute?u=l[M]*a.data.stride+a.offset:u=l[M]*h;for(let f=0;f<h;f++)p[m++]=c[u++]}return new Bt(p,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,d=c.length;h<d;h++){let p=c[h],u=e(p,i);l.push(u)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,p=c.length;d<p;d++){let u=c[d];h.push(u.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],d=r[c];for(let p=0,u=d.length;p<u;p++)h.push(d[p].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},yc=new ut,Ei=new ji,Pr=new ii,xc=new L,Ir=new L,Dr=new L,Lr=new L,Ka=new L,Br=new L,_c=new L,Gr=new L,E=class extends wt{constructor(e=new Tt,t=new Se){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Br.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],d=r[l];h!==0&&(Ka.fromBufferAttribute(d,e),o?Br.addScaledVector(Ka,h):Br.addScaledVector(Ka.sub(t),h))}t.add(Br)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Pr.copy(i.boundingSphere),Pr.applyMatrix4(r),Ei.copy(e.ray).recast(e.near),!(Pr.containsPoint(Ei.origin)===!1&&(Ei.intersectSphere(Pr,xc)===null||Ei.origin.distanceToSquared(xc)>(e.far-e.near)**2))&&(yc.copy(r).invert(),Ei.copy(e.ray).applyMatrix4(yc),!(i.boundingBox!==null&&Ei.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ei)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,p=r.groups,u=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,M=p.length;m<M;m++){let g=p[m],f=o[g.materialIndex],_=Math.max(g.start,u.start),w=Math.min(a.count,Math.min(g.start+g.count,u.start+u.count));for(let y=_,b=w;y<b;y+=3){let R=a.getX(y),C=a.getX(y+1),H=a.getX(y+2);s=Ur(this,f,e,i,c,h,d,R,C,H),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let m=Math.max(0,u.start),M=Math.min(a.count,u.start+u.count);for(let g=m,f=M;g<f;g+=3){let _=a.getX(g),w=a.getX(g+1),y=a.getX(g+2);s=Ur(this,o,e,i,c,h,d,_,w,y),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let m=0,M=p.length;m<M;m++){let g=p[m],f=o[g.materialIndex],_=Math.max(g.start,u.start),w=Math.min(l.count,Math.min(g.start+g.count,u.start+u.count));for(let y=_,b=w;y<b;y+=3){let R=y,C=y+1,H=y+2;s=Ur(this,f,e,i,c,h,d,R,C,H),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let m=Math.max(0,u.start),M=Math.min(l.count,u.start+u.count);for(let g=m,f=M;g<f;g+=3){let _=g,w=g+1,y=g+2;s=Ur(this,o,e,i,c,h,d,_,w,y),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function kd(n,e,t,i,s,r,o,a){let l;if(e.side===Ut?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===Un,a),l===null)return null;Gr.copy(a),Gr.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Gr);return c<t.near||c>t.far?null:{distance:c,point:Gr.clone(),object:n}}function Ur(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,Ir),n.getVertexPosition(l,Dr),n.getVertexPosition(c,Lr);let h=kd(n,e,t,i,Ir,Dr,Lr,_c);if(h){let d=new L;jn.getBarycoord(_c,Ir,Dr,Lr,d),s&&(h.uv=jn.getInterpolatedAttribute(s,a,l,c,d,new be)),r&&(h.uv1=jn.getInterpolatedAttribute(r,a,l,c,d,new be)),o&&(h.normal=jn.getInterpolatedAttribute(o,a,l,c,d,new L),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let p={a,b:l,c,normal:new L,materialIndex:0};jn.getNormal(Ir,Dr,Lr,p.normal),h.face=p,h.barycoord=d}return h}var X=class n extends Tt{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],d=[],p=0,u=0;m("z","y","x",-1,-1,i,t,e,o,r,0),m("z","y","x",1,-1,i,t,-e,o,r,1),m("x","z","y",1,1,e,i,t,s,o,2),m("x","z","y",1,-1,e,i,-t,s,o,3),m("x","y","z",1,-1,e,t,i,s,r,4),m("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new st(c,3)),this.setAttribute("normal",new st(h,3)),this.setAttribute("uv",new st(d,2));function m(M,g,f,_,w,y,b,R,C,H,T){let x=y/C,I=b/H,B=y/2,G=b/2,N=R/2,W=C+1,z=H+1,J=0,U=0,Q=new L;for(let te=0;te<z;te++){let ue=te*I-G;for(let we=0;we<W;we++){let Ae=we*x-B;Q[M]=Ae*_,Q[g]=ue*w,Q[f]=N,c.push(Q.x,Q.y,Q.z),Q[M]=0,Q[g]=0,Q[f]=R>0?1:-1,h.push(Q.x,Q.y,Q.z),d.push(we/C),d.push(1-te/H),J+=1}}for(let te=0;te<H;te++)for(let ue=0;ue<C;ue++){let we=p+ue+W*te,Ae=p+ue+W*(te+1),q=p+(ue+1)+W*(te+1),ie=p+(ue+1)+W*te;l.push(we,Ae,ie),l.push(Ae,q,ie),U+=6}a.addGroup(u,U,T),u+=U,p+=J}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Hi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function kt(n){let e={};for(let t=0;t<n.length;t++){let i=Hi(n[t]);for(let s in i)e[s]=i[s]}return e}function zd(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Gl(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ct.workingColorSpace}var pa={clone:Hi,merge:kt},Vd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Wd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Gt=class extends Mn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Vd,this.fragmentShader=Wd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Hi(e.uniforms),this.uniformsGroups=zd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Os=class extends wt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ut,this.projectionMatrix=new ut,this.projectionMatrixInverse=new ut,this.coordinateSystem=xn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Qn=new L,wc=new be,Tc=new be,At=class extends Os{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Bs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ha*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Bs*2*Math.atan(Math.tan(Ha*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Qn.x,Qn.y).multiplyScalar(-e/Qn.z),Qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Qn.x,Qn.y).multiplyScalar(-e/Qn.z)}getViewSize(e,t){return this.getViewBounds(e,wc,Tc),t.subVectors(Tc,wc)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ha*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},qi=-90,Zi=1,eo=class extends wt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new At(qi,Zi,e,t);s.layers=this.layers,this.add(s);let r=new At(qi,Zi,e,t);r.layers=this.layers,this.add(r);let o=new At(qi,Zi,e,t);o.layers=this.layers,this.add(o);let a=new At(qi,Zi,e,t);a.layers=this.layers,this.add(a);let l=new At(qi,Zi,e,t);l.layers=this.layers,this.add(l);let c=new At(qi,Zi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===xn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ls)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,d=e.getRenderTarget(),p=e.getActiveCubeFace(),u=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let M=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=M,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(d,p,u),e.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},ks=class extends Vt{constructor(e=[],t=Ai,i,s,r,o,a,l,c,h){super(e,t,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},to=class extends cn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new ks(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:gn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new X(5,5,5),r=new Gt({name:"CubemapFromEquirect",uniforms:Hi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ut,blending:Nn});r.uniforms.tEquirect.value=t;let o=new E(s,r),a=t.minFilter;return t.minFilter===li&&(t.minFilter=gn),new eo(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},j=class extends wt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Xd={type:"move"},es=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new j,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new j,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new j,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let M of e.hand.values()){let g=t.getJointPose(M,i),f=this._getHandJoint(c,M);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],p=h.position.distanceTo(d.position),u=.02,m=.005;c.inputState.pinching&&p>u+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&p<=u-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Xd)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new j;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},zs=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Pe(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Vs=class extends wt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wt,this.environmentIntensity=1,this.environmentRotation=new Wt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var $a=new L,Yd=new L,qd=new je,an=class{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=$a.subVectors(i,t).cross(Yd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta($a),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||qd.getNormalMatrix(e),s=this.coplanarPoint($a).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},gi=new ii,Fr=new L,ts=class{constructor(e=new an,t=new an,i=new an,s=new an,r=new an,o=new an){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=xn){let i=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],d=s[6],p=s[7],u=s[8],m=s[9],M=s[10],g=s[11],f=s[12],_=s[13],w=s[14],y=s[15];if(i[0].setComponents(l-r,p-c,g-u,y-f).normalize(),i[1].setComponents(l+r,p+c,g+u,y+f).normalize(),i[2].setComponents(l+o,p+h,g+m,y+_).normalize(),i[3].setComponents(l-o,p-h,g-m,y-_).normalize(),i[4].setComponents(l-a,p-d,g-M,y-w).normalize(),t===xn)i[5].setComponents(l+a,p+d,g+M,y+w).normalize();else if(t===Ls)i[5].setComponents(a,d,M,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gi)}intersectsSprite(e){return gi.center.set(0,0,0),gi.radius=.7071067811865476,gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(gi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Fr.x=s.normal.x>0?e.max.x:e.min.x,Fr.y=s.normal.y>0?e.max.y:e.min.y,Fr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Fr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ws=class extends Mn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Pe(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},no=new L,io=new L,vc=new ut,As=new ji,Nr=new ii,Qa=new L,Sc=new L,so=class extends wt{constructor(e=new Tt,t=new Ws){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)no.fromBufferAttribute(t,s-1),io.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=no.distanceTo(io);e.setAttribute("lineDistance",new st(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Nr.copy(i.boundingSphere),Nr.applyMatrix4(s),Nr.radius+=r,e.ray.intersectsSphere(Nr)===!1)return;vc.copy(s).invert(),As.copy(e.ray).applyMatrix4(vc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,p=i.attributes.position;if(h!==null){let u=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let M=u,g=m-1;M<g;M+=c){let f=h.getX(M),_=h.getX(M+1),w=Or(this,e,As,l,f,_,M);w&&t.push(w)}if(this.isLineLoop){let M=h.getX(m-1),g=h.getX(u),f=Or(this,e,As,l,M,g,m-1);f&&t.push(f)}}else{let u=Math.max(0,o.start),m=Math.min(p.count,o.start+o.count);for(let M=u,g=m-1;M<g;M+=c){let f=Or(this,e,As,l,M,M+1,M);f&&t.push(f)}if(this.isLineLoop){let M=Or(this,e,As,l,m-1,u,m-1);M&&t.push(M)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Or(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(no.fromBufferAttribute(a,s),io.fromBufferAttribute(a,r),t.distanceSqToSegment(no,io,Qa,Sc)>i)return;Qa.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Qa);if(!(c<e.near||c>e.far))return{distance:c,point:Sc.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var bc=new L,Rc=new L,ro=class extends so{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)bc.fromBufferAttribute(t,s),Rc.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+bc.distanceTo(Rc);e.setAttribute("lineDistance",new st(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var wi=class extends Mn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Pe(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ac=new ut,cl=new ji,kr=new ii,zr=new L,ns=class extends wt{constructor(e=new Tt,t=new wi){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),kr.copy(i.boundingSphere),kr.applyMatrix4(s),kr.radius+=r,e.ray.intersectsSphere(kr)===!1)return;Ac.copy(s).invert(),cl.copy(e.ray).applyMatrix4(Ac);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,d=i.attributes.position;if(c!==null){let p=Math.max(0,o.start),u=Math.min(c.count,o.start+o.count);for(let m=p,M=u;m<M;m++){let g=c.getX(m);zr.fromBufferAttribute(d,g),Cc(zr,g,l,s,e,t,this)}}else{let p=Math.max(0,o.start),u=Math.min(d.count,o.start+o.count);for(let m=p,M=u;m<M;m++)zr.fromBufferAttribute(d,m),Cc(zr,m,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Cc(n,e,t,i,s,r,o){let a=cl.distanceSqToPoint(n);if(a<t){let l=new L;cl.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Ti=class extends Vt{constructor(e,t,i,s,r,o,a,l,c){super(e,t,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Xs=class extends Vt{constructor(e,t,i=ci,s,r,o,a=ln,l=ln,c,h=Ki){if(h!==Ki&&h!==hs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Qi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},jt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],p=i[s+1]-h,u=(o-h)/p;return(s+u)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new be:new L);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new L,s=[],r=[],o=[],a=new L,l=new ut;for(let u=0;u<=e;u++){let m=u/e;s[u]=this.getTangentAt(m,new L)}r[0]=new L,o[0]=new L;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),p=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),p<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let u=1;u<=e;u++){if(r[u]=r[u-1].clone(),o[u]=o[u-1].clone(),a.crossVectors(s[u-1],s[u]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(it(s[u-1].dot(s[u]),-1,1));r[u].applyMatrix4(l.makeRotationAxis(a,m))}o[u].crossVectors(s[u],r[u])}if(t===!0){let u=Math.acos(it(r[0].dot(r[e]),-1,1));u/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(u=-u);for(let m=1;m<=e;m++)r[m].applyMatrix4(l.makeRotationAxis(s[m],u*m)),o[m].crossVectors(s[m],r[m])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},is=class extends jt{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new be){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),p=l-this.aX,u=c-this.aY;l=p*h-u*d+this.aX,c=p*d+u*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},oo=class extends is{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Ul(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,d){let p=(o-r)/c-(a-r)/(c+h)+(a-o)/h,u=(a-o)/h-(l-o)/(h+d)+(l-a)/d;p*=h,u*=h,s(o,a,p,u)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Vr=new L,ja=new Ul,el=new Ul,tl=new Ul,Zt=class extends jt{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new L){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Vr.subVectors(s[0],s[1]).add(s[0]),c=Vr);let d=s[a%r],p=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Vr.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Vr),this.curveType==="centripetal"||this.curveType==="chordal"){let u=this.curveType==="chordal"?.5:.25,m=Math.pow(c.distanceToSquared(d),u),M=Math.pow(d.distanceToSquared(p),u),g=Math.pow(p.distanceToSquared(h),u);M<1e-4&&(M=1),m<1e-4&&(m=M),g<1e-4&&(g=M),ja.initNonuniformCatmullRom(c.x,d.x,p.x,h.x,m,M,g),el.initNonuniformCatmullRom(c.y,d.y,p.y,h.y,m,M,g),tl.initNonuniformCatmullRom(c.z,d.z,p.z,h.z,m,M,g)}else this.curveType==="catmullrom"&&(ja.initCatmullRom(c.x,d.x,p.x,h.x,this.tension),el.initCatmullRom(c.y,d.y,p.y,h.y,this.tension),tl.initCatmullRom(c.z,d.z,p.z,h.z,this.tension));return i.set(ja.calc(l),el.calc(l),tl.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new L().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Hc(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function Zd(n,e){let t=1-n;return t*t*e}function Jd(n,e){return 2*(1-n)*n*e}function Kd(n,e){return n*n*e}function Hs(n,e,t,i){return Zd(n,e)+Jd(n,t)+Kd(n,i)}function $d(n,e){let t=1-n;return t*t*t*e}function Qd(n,e){let t=1-n;return 3*t*t*n*e}function jd(n,e){return 3*(1-n)*n*n*e}function eu(n,e){return n*n*n*e}function Ps(n,e,t,i,s){return $d(n,e)+Qd(n,t)+jd(n,i)+eu(n,s)}var Ys=class extends jt{constructor(e=new be,t=new be,i=new be,s=new be){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new be){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ps(e,s.x,r.x,o.x,a.x),Ps(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ao=class extends jt{constructor(e=new L,t=new L,i=new L,s=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new L){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ps(e,s.x,r.x,o.x,a.x),Ps(e,s.y,r.y,o.y,a.y),Ps(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},qs=class extends jt{constructor(e=new be,t=new be){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new be){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new be){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},lo=class extends jt{constructor(e=new L,t=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new L){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new L){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Zs=class extends jt{constructor(e=new be,t=new be,i=new be){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new be){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Hs(e,s.x,r.x,o.x),Hs(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Js=class extends jt{constructor(e=new L,t=new L,i=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new L){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Hs(e,s.x,r.x,o.x),Hs(e,s.y,r.y,o.y),Hs(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ks=class extends jt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new be){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return i.set(Hc(a,l.x,c.x,h.x,d.x),Hc(a,l.y,c.y,h.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new be().fromArray(s))}return this}},hl=Object.freeze({__proto__:null,ArcCurve:oo,CatmullRomCurve3:Zt,CubicBezierCurve:Ys,CubicBezierCurve3:ao,EllipseCurve:is,LineCurve:qs,LineCurve3:lo,QuadraticBezierCurve:Zs,QuadraticBezierCurve3:Js,SplineCurve:Ks}),co=class extends jt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new hl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new hl[s.type]().fromJSON(s))}return this}},ho=class extends co{constructor(e){super(),this.type="Path",this.currentPoint=new be,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new qs(this.currentPoint.clone(),new be(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new Zs(this.currentPoint.clone(),new be(e,t),new be(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new Ys(this.currentPoint.clone(),new be(e,t),new be(i,s),new be(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Ks(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,o,a,l),this}absellipse(e,t,i,s,r,o,a,l){let c=new is(e,t,i,s,r,o,a,l);if(this.curves.length>0){let d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},si=class n extends Tt{constructor(e=[new be(0,-.5),new be(.5,0),new be(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=it(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,d=new L,p=new be,u=new L,m=new L,M=new L,g=0,f=0;for(let _=0;_<=e.length-1;_++)switch(_){case 0:g=e[_+1].x-e[_].x,f=e[_+1].y-e[_].y,u.x=f*1,u.y=-g,u.z=f*0,M.copy(u),u.normalize(),l.push(u.x,u.y,u.z);break;case e.length-1:l.push(M.x,M.y,M.z);break;default:g=e[_+1].x-e[_].x,f=e[_+1].y-e[_].y,u.x=f*1,u.y=-g,u.z=f*0,m.copy(u),u.x+=M.x,u.y+=M.y,u.z+=M.z,u.normalize(),l.push(u.x,u.y,u.z),M.copy(m)}for(let _=0;_<=t;_++){let w=i+_*h*s,y=Math.sin(w),b=Math.cos(w);for(let R=0;R<=e.length-1;R++){d.x=e[R].x*y,d.y=e[R].y,d.z=e[R].x*b,o.push(d.x,d.y,d.z),p.x=_/t,p.y=R/(e.length-1),a.push(p.x,p.y);let C=l[3*R+0]*y,H=l[3*R+1],T=l[3*R+0]*b;c.push(C,H,T)}}for(let _=0;_<t;_++)for(let w=0;w<e.length-1;w++){let y=w+_*e.length,b=y,R=y+e.length,C=y+e.length+1,H=y+1;r.push(b,R,H),r.push(C,H,R)}this.setIndex(r),this.setAttribute("position",new st(o,3)),this.setAttribute("uv",new st(a,2)),this.setAttribute("normal",new st(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},ft=class n extends si{constructor(e=1,t=1,i=4,s=8){let r=new ho;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(i),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:s}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},yt=class n extends Tt{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new L,h=new be;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let d=0,p=3;d<=t;d++,p+=3){let u=i+d/t*s;c.x=e*Math.cos(u),c.y=e*Math.sin(u),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[p]/e+1)/2,h.y=(o[p+1]/e+1)/2,l.push(h.x,h.y)}for(let d=1;d<=t;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new st(o,3)),this.setAttribute("normal",new st(a,3)),this.setAttribute("uv",new st(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},le=class n extends Tt{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],p=[],u=[],m=0,M=[],g=i/2,f=0;_(),o===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new st(d,3)),this.setAttribute("normal",new st(p,3)),this.setAttribute("uv",new st(u,2));function _(){let y=new L,b=new L,R=0,C=(t-e)/i;for(let H=0;H<=r;H++){let T=[],x=H/r,I=x*(t-e)+e;for(let B=0;B<=s;B++){let G=B/s,N=G*l+a,W=Math.sin(N),z=Math.cos(N);b.x=I*W,b.y=-x*i+g,b.z=I*z,d.push(b.x,b.y,b.z),y.set(W,C,z).normalize(),p.push(y.x,y.y,y.z),u.push(G,1-x),T.push(m++)}M.push(T)}for(let H=0;H<s;H++)for(let T=0;T<r;T++){let x=M[T][H],I=M[T+1][H],B=M[T+1][H+1],G=M[T][H+1];(e>0||T!==0)&&(h.push(x,I,G),R+=3),(t>0||T!==r-1)&&(h.push(I,B,G),R+=3)}c.addGroup(f,R,0),f+=R}function w(y){let b=m,R=new be,C=new L,H=0,T=y===!0?e:t,x=y===!0?1:-1;for(let B=1;B<=s;B++)d.push(0,g*x,0),p.push(0,x,0),u.push(.5,.5),m++;let I=m;for(let B=0;B<=s;B++){let N=B/s*l+a,W=Math.cos(N),z=Math.sin(N);C.x=T*z,C.y=g*x,C.z=T*W,d.push(C.x,C.y,C.z),p.push(0,x,0),R.x=W*.5+.5,R.y=z*.5*x+.5,u.push(R.x,R.y),m++}for(let B=0;B<s;B++){let G=b+B,N=I+B;y===!0?h.push(N,N+1,G):h.push(N+1,N,G),H+=3}c.addGroup(f,H,y===!0?1:2),f+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Xe=class n extends le{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},ss=class n extends Tt{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new st(r,3)),this.setAttribute("normal",new st(r.slice(),3)),this.setAttribute("uv",new st(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(_){let w=new L,y=new L,b=new L;for(let R=0;R<t.length;R+=3)u(t[R+0],w),u(t[R+1],y),u(t[R+2],b),l(w,y,b,_)}function l(_,w,y,b){let R=b+1,C=[];for(let H=0;H<=R;H++){C[H]=[];let T=_.clone().lerp(y,H/R),x=w.clone().lerp(y,H/R),I=R-H;for(let B=0;B<=I;B++)B===0&&H===R?C[H][B]=T:C[H][B]=T.clone().lerp(x,B/I)}for(let H=0;H<R;H++)for(let T=0;T<2*(R-H)-1;T++){let x=Math.floor(T/2);T%2===0?(p(C[H][x+1]),p(C[H+1][x]),p(C[H][x])):(p(C[H][x+1]),p(C[H+1][x+1]),p(C[H+1][x]))}}function c(_){let w=new L;for(let y=0;y<r.length;y+=3)w.x=r[y+0],w.y=r[y+1],w.z=r[y+2],w.normalize().multiplyScalar(_),r[y+0]=w.x,r[y+1]=w.y,r[y+2]=w.z}function h(){let _=new L;for(let w=0;w<r.length;w+=3){_.x=r[w+0],_.y=r[w+1],_.z=r[w+2];let y=g(_)/2/Math.PI+.5,b=f(_)/Math.PI+.5;o.push(y,1-b)}m(),d()}function d(){for(let _=0;_<o.length;_+=6){let w=o[_+0],y=o[_+2],b=o[_+4],R=Math.max(w,y,b),C=Math.min(w,y,b);R>.9&&C<.1&&(w<.2&&(o[_+0]+=1),y<.2&&(o[_+2]+=1),b<.2&&(o[_+4]+=1))}}function p(_){r.push(_.x,_.y,_.z)}function u(_,w){let y=_*3;w.x=e[y+0],w.y=e[y+1],w.z=e[y+2]}function m(){let _=new L,w=new L,y=new L,b=new L,R=new be,C=new be,H=new be;for(let T=0,x=0;T<r.length;T+=9,x+=6){_.set(r[T+0],r[T+1],r[T+2]),w.set(r[T+3],r[T+4],r[T+5]),y.set(r[T+6],r[T+7],r[T+8]),R.set(o[x+0],o[x+1]),C.set(o[x+2],o[x+3]),H.set(o[x+4],o[x+5]),b.copy(_).add(w).add(y).divideScalar(3);let I=g(b);M(R,x+0,_,I),M(C,x+2,w,I),M(H,x+4,y,I)}}function M(_,w,y,b){b<0&&_.x===1&&(o[w]=_.x-1),y.x===0&&y.z===0&&(o[w]=b/2/Math.PI+.5)}function g(_){return Math.atan2(_.z,-_.x)}function f(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}},ri=class n extends ss{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=1/i,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-i,0,-s,i,0,s,-i,0,s,i,-s,-i,0,-s,i,0,s,-i,0,s,i,0,-i,0,-s,i,0,-s,-i,0,s,i,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var $s=class n extends ss{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},St=class n extends ss{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},nt=class n extends Tt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,d=e/a,p=t/l,u=[],m=[],M=[],g=[];for(let f=0;f<h;f++){let _=f*p-o;for(let w=0;w<c;w++){let y=w*d-r;m.push(y,-_,0),M.push(0,0,1),g.push(w/a),g.push(1-f/l)}}for(let f=0;f<l;f++)for(let _=0;_<a;_++){let w=_+c*f,y=_+c*(f+1),b=_+1+c*(f+1),R=_+1+c*f;u.push(w,y,R),u.push(y,b,R)}this.setIndex(u),this.setAttribute("position",new st(m,3)),this.setAttribute("normal",new st(M,3)),this.setAttribute("uv",new st(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},_n=class n extends Tt{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],d=e,p=(t-e)/s,u=new L,m=new be;for(let M=0;M<=s;M++){for(let g=0;g<=i;g++){let f=r+g/i*o;u.x=d*Math.cos(f),u.y=d*Math.sin(f),l.push(u.x,u.y,u.z),c.push(0,0,1),m.x=(u.x/t+1)/2,m.y=(u.y/t+1)/2,h.push(m.x,m.y)}d+=p}for(let M=0;M<s;M++){let g=M*(i+1);for(let f=0;f<i;f++){let _=f+g,w=_,y=_+i+1,b=_+i+2,R=_+1;a.push(w,y,R),a.push(y,b,R)}}this.setIndex(a),this.setAttribute("position",new st(l,3)),this.setAttribute("normal",new st(c,3)),this.setAttribute("uv",new st(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var se=class n extends Tt{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],d=new L,p=new L,u=[],m=[],M=[],g=[];for(let f=0;f<=i;f++){let _=[],w=f/i,y=0;f===0&&o===0?y=.5/t:f===i&&l===Math.PI&&(y=-.5/t);for(let b=0;b<=t;b++){let R=b/t;d.x=-e*Math.cos(s+R*r)*Math.sin(o+w*a),d.y=e*Math.cos(o+w*a),d.z=e*Math.sin(s+R*r)*Math.sin(o+w*a),m.push(d.x,d.y,d.z),p.copy(d).normalize(),M.push(p.x,p.y,p.z),g.push(R+y,1-w),_.push(c++)}h.push(_)}for(let f=0;f<i;f++)for(let _=0;_<t;_++){let w=h[f][_+1],y=h[f][_],b=h[f+1][_],R=h[f+1][_+1];(f!==0||o>0)&&u.push(w,y,R),(f!==i-1||l<Math.PI)&&u.push(y,b,R)}this.setIndex(u),this.setAttribute("position",new st(m,3)),this.setAttribute("normal",new st(M,3)),this.setAttribute("uv",new st(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ne=class n extends Tt{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new L,d=new L,p=new L;for(let u=0;u<=i;u++)for(let m=0;m<=s;m++){let M=m/s*r,g=u/i*Math.PI*2;d.x=(e+t*Math.cos(g))*Math.cos(M),d.y=(e+t*Math.cos(g))*Math.sin(M),d.z=t*Math.sin(g),a.push(d.x,d.y,d.z),h.x=e*Math.cos(M),h.y=e*Math.sin(M),p.subVectors(d,h).normalize(),l.push(p.x,p.y,p.z),c.push(m/s),c.push(u/i)}for(let u=1;u<=i;u++)for(let m=1;m<=s;m++){let M=(s+1)*u+m-1,g=(s+1)*(u-1)+m-1,f=(s+1)*(u-1)+m,_=(s+1)*u+m;o.push(M,g,_),o.push(g,f,_)}this.setIndex(o),this.setAttribute("position",new st(a,3)),this.setAttribute("normal",new st(l,3)),this.setAttribute("uv",new st(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var hn=class n extends Tt{constructor(e=new Js(new L(-1,-1,0),new L(-1,1,0),new L(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new L,l=new L,c=new be,h=new L,d=[],p=[],u=[],m=[];M(),this.setIndex(m),this.setAttribute("position",new st(d,3)),this.setAttribute("normal",new st(p,3)),this.setAttribute("uv",new st(u,2));function M(){for(let w=0;w<t;w++)g(w);g(r===!1?t:0),_(),f()}function g(w){h=e.getPointAt(w/t,h);let y=o.normals[w],b=o.binormals[w];for(let R=0;R<=s;R++){let C=R/s*Math.PI*2,H=Math.sin(C),T=-Math.cos(C);l.x=T*y.x+H*b.x,l.y=T*y.y+H*b.y,l.z=T*y.z+H*b.z,l.normalize(),p.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,d.push(a.x,a.y,a.z)}}function f(){for(let w=1;w<=t;w++)for(let y=1;y<=s;y++){let b=(s+1)*(w-1)+(y-1),R=(s+1)*w+(y-1),C=(s+1)*w+y,H=(s+1)*(w-1)+y;m.push(b,R,H),m.push(R,C,H)}}function _(){for(let w=0;w<=t;w++)for(let y=0;y<=s;y++)c.x=w/t,c.y=y/s,u.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new hl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var vi=class extends Mn{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Pe(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var P=class extends Mn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Pe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Pe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Il,this.normalScale=new be(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var uo=class extends Mn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=ch,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},fo=class extends Mn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Wr(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function tu(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Si=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},po=class extends Si{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:sl,endingEnd:sl}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case rl:r=e,a=2*t-i;break;case ol:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case rl:o=e,l=2*i-t;break;case ol:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,d=this._offsetNext,p=this._weightPrev,u=this._weightNext,m=(i-t)/(s-t),M=m*m,g=M*m,f=-p*g+2*p*M-p*m,_=(1+p)*g+(-1.5-2*p)*M+(-.5+p)*m+1,w=(-1-u)*g+(1.5+u)*M+.5*m,y=u*g-u*M;for(let b=0;b!==a;++b)r[b]=f*o[h+b]+_*o[c+b]+w*o[l+b]+y*o[d+b];return r}},mo=class extends Si{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(s-t),d=1-h;for(let p=0;p!==a;++p)r[p]=o[c+p]*d+o[l+p]*h;return r}},Eo=class extends Si{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},en=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Wr(t,this.TimeBufferType),this.values=Wr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Wr(e.times,Array),values:Wr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Eo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new mo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new po(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Is:t=this.InterpolantFactoryMethodDiscrete;break;case Kr:t=this.InterpolantFactoryMethodLinear;break;case Xr:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Is;case this.InterpolantFactoryMethodLinear:return Kr;case this.InterpolantFactoryMethodSmooth:return Xr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&tu(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Xr,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let d=a*i,p=d-i,u=d+i;for(let m=0;m!==i;++m){let M=t[d+m];if(M!==t[p+m]||M!==t[u+m]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let d=a*i,p=o*i;for(let u=0;u!==i;++u)t[p+u]=t[d+u]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};en.prototype.ValueTypeName="";en.prototype.TimeBufferType=Float32Array;en.prototype.ValueBufferType=Float32Array;en.prototype.DefaultInterpolation=Kr;var oi=class extends en{constructor(e,t,i){super(e,t,i)}};oi.prototype.ValueTypeName="bool";oi.prototype.ValueBufferType=Array;oi.prototype.DefaultInterpolation=Is;oi.prototype.InterpolantFactoryMethodLinear=void 0;oi.prototype.InterpolantFactoryMethodSmooth=void 0;var go=class extends en{constructor(e,t,i,s){super(e,t,i,s)}};go.prototype.ValueTypeName="color";var Mo=class extends en{constructor(e,t,i,s){super(e,t,i,s)}};Mo.prototype.ValueTypeName="number";var yo=class extends Si{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)vt.slerpFlat(r,0,o,c-a,o,c,l);return r}},Qs=class extends en{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new yo(this.times,this.values,this.getValueSize(),e)}};Qs.prototype.ValueTypeName="quaternion";Qs.prototype.InterpolantFactoryMethodSmooth=void 0;var ai=class extends en{constructor(e,t,i){super(e,t,i)}};ai.prototype.ValueTypeName="string";ai.prototype.ValueBufferType=Array;ai.prototype.DefaultInterpolation=Is;ai.prototype.InterpolantFactoryMethodLinear=void 0;ai.prototype.InterpolantFactoryMethodSmooth=void 0;var xo=class extends en{constructor(e,t,i,s){super(e,t,i,s)}};xo.prototype.ValueTypeName="vector";var dl={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(this.files[n]=e)},get:function(n){if(this.enabled!==!1)return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}},_o=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,p=c.length;d<p;d+=2){let u=c[d],m=c[d+1];if(u.global&&(u.lastIndex=0),u.test(h))return m}return null}}},vh=new _o,rs=class{constructor(e){this.manager=e!==void 0?e:vh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};rs.DEFAULT_MATERIAL_NAME="__DEFAULT";var wo=class extends rs{constructor(e){super(e)}load(e,t,i,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=dl.get(e);if(o!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o;let a=$i("img");function l(){h(),dl.add(e,this),t&&t(this),r.manager.itemEnd(e)}function c(d){h(),s&&s(d),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(e),a.src=e,a}};var js=class extends rs{constructor(e){super(e)}load(e,t,i,s){let r=new Vt,o=new wo(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},i,s),r}},bi=class extends wt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Pe(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},er=class extends bi{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(wt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Pe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},nl=new ut,Pc=new L,Ic=new L,tr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new be(512,512),this.map=null,this.mapPass=null,this.matrix=new ut,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ts,this._frameExtents=new be(1,1),this._viewportCount=1,this._viewports=[new dt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;Pc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Pc),Ic.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ic),t.updateMatrixWorld(),nl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(nl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(nl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ul=class extends tr{constructor(){super(new At(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Bs*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(i!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=i,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},Ri=class extends bi{constructor(e,t,i=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(wt.DEFAULT_UP),this.updateMatrix(),this.target=new wt,this.distance=i,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new ul}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Dc=new ut,Cs=new L,il=new L,fl=class extends tr{constructor(){super(new At(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new be(4,2),this._viewportCount=6,this._viewports=[new dt(2,1,1,1),new dt(0,1,1,1),new dt(3,1,1,1),new dt(1,1,1,1),new dt(3,0,1,1),new dt(1,0,1,1)],this._cubeDirections=[new L(1,0,0),new L(-1,0,0),new L(0,0,1),new L(0,0,-1),new L(0,1,0),new L(0,-1,0)],this._cubeUps=[new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,1,0),new L(0,0,1),new L(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),Cs.setFromMatrixPosition(e.matrixWorld),i.position.copy(Cs),il.copy(i.position),il.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(il),i.updateMatrixWorld(),s.makeTranslation(-Cs.x,-Cs.y,-Cs.z),Dc.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Dc)}},Ct=class extends bi{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new fl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},nr=class extends Os{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},pl=class extends tr{constructor(){super(new nr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},os=class extends bi{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(wt.DEFAULT_UP),this.updateMatrix(),this.target=new wt,this.shadow=new pl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var To=class extends At{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e,this.index=0}};var Fl="\\[\\]\\.:\\/",nu=new RegExp("["+Fl+"]","g"),Nl="[^"+Fl+"]",iu="[^"+Fl.replace("\\.","")+"]",su=/((?:WC+[\/:])*)/.source.replace("WC",Nl),ru=/(WCOD+)?/.source.replace("WCOD",iu),ou=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Nl),au=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Nl),lu=new RegExp("^"+su+ru+ou+au+"$"),cu=["material","materials","bones","map"],ml=class{constructor(e,t,i){let s=i||gt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},gt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(nu,"")}static parseTrackName(e){let t=lu.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);cu.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};gt.Composite=ml;gt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};gt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};gt.prototype.GetterByBindingType=[gt.prototype._getValue_direct,gt.prototype._getValue_array,gt.prototype._getValue_arrayElement,gt.prototype._getValue_toArray];gt.prototype.SetterByBindingTypeAndVersioning=[[gt.prototype._setValue_direct,gt.prototype._setValue_direct_setNeedsUpdate,gt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[gt.prototype._setValue_array,gt.prototype._setValue_array_setNeedsUpdate,gt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[gt.prototype._setValue_arrayElement,gt.prototype._setValue_arrayElement_setNeedsUpdate,gt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[gt.prototype._setValue_fromArray,gt.prototype._setValue_fromArray_setNeedsUpdate,gt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var CE=new Float32Array(1);var as=class extends ro{constructor(e=10,t=10,i=4473924,s=8947848){i=new Pe(i),s=new Pe(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let p=0,u=0,m=-a;p<=t;p++,m+=o){l.push(-a,0,m,a,0,m),l.push(m,0,-a,m,0,a);let M=p===r?i:s;M.toArray(c,u),u+=3,M.toArray(c,u),u+=3,M.toArray(c,u),u+=3,M.toArray(c,u),u+=3}let h=new Tt;h.setAttribute("position",new st(l,3)),h.setAttribute("color",new st(c,3));let d=new Ws({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};function Ol(n,e,t,i){let s=hu(i);switch(t){case Sl:return n*e;case Rl:return n*e;case Al:return n*e*2;case Cl:return n*e/s.components*s.byteLength;case No:return n*e/s.components*s.byteLength;case Hl:return n*e*2/s.components*s.byteLength;case Oo:return n*e*2/s.components*s.byteLength;case bl:return n*e*3/s.components*s.byteLength;case dn:return n*e*4/s.components*s.byteLength;case ko:return n*e*4/s.components*s.byteLength;case rr:case or:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ar:case lr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Vo:case Xo:return Math.max(n,16)*Math.max(e,8)/4;case zo:case Wo:return Math.max(n,8)*Math.max(e,8)/2;case Yo:case qo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Zo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Jo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ko:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case $o:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Qo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case jo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ea:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case ta:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case na:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case ia:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case sa:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case ra:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case oa:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case aa:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case la:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case cr:case ca:case ha:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Pl:case da:return Math.ceil(n/4)*Math.ceil(e/4)*8;case ua:case fa:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function hu(n){switch(n){case vn:case wl:return{byteLength:1,components:1};case ls:case Tl:case hi:return{byteLength:2,components:1};case Uo:case Fo:return{byteLength:2,components:4};case ci:case Go:case Sn:return{byteLength:4,components:1};case vl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"175"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="175");function Zh(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function uu(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,d=c.byteLength,p=n.createBuffer();n.bindBuffer(l,p),n.bufferData(l,c,h),a.onUploadCallback();let u;if(c instanceof Float32Array)u=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?u=n.HALF_FLOAT:u=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)u=n.SHORT;else if(c instanceof Uint32Array)u=n.UNSIGNED_INT;else if(c instanceof Int32Array)u=n.INT;else if(c instanceof Int8Array)u=n.BYTE;else if(c instanceof Uint8Array)u=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)u=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:p,type:u,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let h=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,h);else{d.sort((u,m)=>u.start-m.start);let p=0;for(let u=1;u<d.length;u++){let m=d[p],M=d[u];M.start<=m.start+m.count+1?m.count=Math.max(m.count,M.start+M.count-m.start):(++p,d[p]=M)}d.length=p+1;for(let u=0,m=d.length;u<m;u++){let M=d[u];n.bufferSubData(c,M.start*h.BYTES_PER_ELEMENT,h,M.start,M.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var fu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pu=`#ifdef USE_ALPHAHASH
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
#endif`,mu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Eu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,gu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Mu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,yu=`#ifdef USE_AOMAP
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
#endif`,xu=`#ifdef USE_AOMAP
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
#endif`,wu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Tu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,vu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Su=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,bu=`#ifdef USE_IRIDESCENCE
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
#endif`,Ru=`#ifdef USE_BUMPMAP
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
#endif`,Au=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Cu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Hu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Pu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Iu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Du=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Lu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Bu=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Gu=`#define PI 3.141592653589793
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
} // validated`,Uu=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Fu=`vec3 transformedNormal = objectNormal;
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
#endif`,Nu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ou=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,ku=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,zu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Vu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xu=`#ifdef USE_ENVMAP
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
#endif`,Yu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,qu=`#ifdef USE_ENVMAP
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
#endif`,Zu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ju=`#ifdef USE_ENVMAP
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
#endif`,Ku=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,$u=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Qu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ju=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ef=`#ifdef USE_GRADIENTMAP
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
}`,tf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,nf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,sf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,rf=`uniform bool receiveShadow;
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
#endif`,of=`#ifdef USE_ENVMAP
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
#endif`,af=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,cf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,hf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,df=`PhysicalMaterial material;
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
#endif`,uf=`struct PhysicalMaterial {
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
}`,ff=`
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
#endif`,pf=`#if defined( RE_IndirectDiffuse )
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
#endif`,mf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ef=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,gf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Mf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,xf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,_f=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,wf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Tf=`#if defined( USE_POINTS_UV )
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
#endif`,vf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Sf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,bf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Rf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Af=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cf=`#ifdef USE_MORPHTARGETS
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
#endif`,Hf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,If=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Df=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Bf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Gf=`#ifdef USE_NORMALMAP
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
#endif`,Uf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ff=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Nf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Of=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,kf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,zf=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Vf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Wf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Xf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Yf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,qf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Zf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Jf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Kf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,$f=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Qf=`float getShadowMask() {
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
}`,jf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ep=`#ifdef USE_SKINNING
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
#endif`,tp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,np=`#ifdef USE_SKINNING
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
#endif`,ip=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,rp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,op=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,ap=`#ifdef USE_TRANSMISSION
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
#endif`,lp=`#ifdef USE_TRANSMISSION
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
#endif`,cp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,up=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,fp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,pp=`uniform sampler2D t2D;
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
}`,mp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ep=`#ifdef ENVMAP_TYPE_CUBE
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
}`,gp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Mp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yp=`#include <common>
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
}`,xp=`#if DEPTH_PACKING == 3200
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
}`,wp=`#define DISTANCE
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
}`,Tp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,vp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sp=`uniform float scale;
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
}`,bp=`uniform vec3 diffuse;
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
}`,Rp=`#include <common>
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
}`,Ap=`uniform vec3 diffuse;
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
}`,Cp=`#define LAMBERT
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
}`,Hp=`#define LAMBERT
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
}`,Pp=`#define MATCAP
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
}`,Ip=`#define MATCAP
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
}`,Dp=`#define NORMAL
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
}`,Lp=`#define NORMAL
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
}`,Bp=`#define PHONG
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
}`,Gp=`#define PHONG
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
}`,Up=`#define STANDARD
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
}`,Fp=`#define STANDARD
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
}`,Np=`#define TOON
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
}`,Op=`#define TOON
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
}`,kp=`uniform float size;
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
}`,zp=`uniform vec3 diffuse;
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
}`,Vp=`#include <common>
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
}`,Wp=`uniform vec3 color;
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
}`,Xp=`uniform float rotation;
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
}`,Yp=`uniform vec3 diffuse;
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
}`,tt={alphahash_fragment:fu,alphahash_pars_fragment:pu,alphamap_fragment:mu,alphamap_pars_fragment:Eu,alphatest_fragment:gu,alphatest_pars_fragment:Mu,aomap_fragment:yu,aomap_pars_fragment:xu,batching_pars_vertex:_u,batching_vertex:wu,begin_vertex:Tu,beginnormal_vertex:vu,bsdfs:Su,iridescence_fragment:bu,bumpmap_pars_fragment:Ru,clipping_planes_fragment:Au,clipping_planes_pars_fragment:Cu,clipping_planes_pars_vertex:Hu,clipping_planes_vertex:Pu,color_fragment:Iu,color_pars_fragment:Du,color_pars_vertex:Lu,color_vertex:Bu,common:Gu,cube_uv_reflection_fragment:Uu,defaultnormal_vertex:Fu,displacementmap_pars_vertex:Nu,displacementmap_vertex:Ou,emissivemap_fragment:ku,emissivemap_pars_fragment:zu,colorspace_fragment:Vu,colorspace_pars_fragment:Wu,envmap_fragment:Xu,envmap_common_pars_fragment:Yu,envmap_pars_fragment:qu,envmap_pars_vertex:Zu,envmap_physical_pars_fragment:of,envmap_vertex:Ju,fog_vertex:Ku,fog_pars_vertex:$u,fog_fragment:Qu,fog_pars_fragment:ju,gradientmap_pars_fragment:ef,lightmap_pars_fragment:tf,lights_lambert_fragment:nf,lights_lambert_pars_fragment:sf,lights_pars_begin:rf,lights_toon_fragment:af,lights_toon_pars_fragment:lf,lights_phong_fragment:cf,lights_phong_pars_fragment:hf,lights_physical_fragment:df,lights_physical_pars_fragment:uf,lights_fragment_begin:ff,lights_fragment_maps:pf,lights_fragment_end:mf,logdepthbuf_fragment:Ef,logdepthbuf_pars_fragment:gf,logdepthbuf_pars_vertex:Mf,logdepthbuf_vertex:yf,map_fragment:xf,map_pars_fragment:_f,map_particle_fragment:wf,map_particle_pars_fragment:Tf,metalnessmap_fragment:vf,metalnessmap_pars_fragment:Sf,morphinstance_vertex:bf,morphcolor_vertex:Rf,morphnormal_vertex:Af,morphtarget_pars_vertex:Cf,morphtarget_vertex:Hf,normal_fragment_begin:Pf,normal_fragment_maps:If,normal_pars_fragment:Df,normal_pars_vertex:Lf,normal_vertex:Bf,normalmap_pars_fragment:Gf,clearcoat_normal_fragment_begin:Uf,clearcoat_normal_fragment_maps:Ff,clearcoat_pars_fragment:Nf,iridescence_pars_fragment:Of,opaque_fragment:kf,packing:zf,premultiplied_alpha_fragment:Vf,project_vertex:Wf,dithering_fragment:Xf,dithering_pars_fragment:Yf,roughnessmap_fragment:qf,roughnessmap_pars_fragment:Zf,shadowmap_pars_fragment:Jf,shadowmap_pars_vertex:Kf,shadowmap_vertex:$f,shadowmask_pars_fragment:Qf,skinbase_vertex:jf,skinning_pars_vertex:ep,skinning_vertex:tp,skinnormal_vertex:np,specularmap_fragment:ip,specularmap_pars_fragment:sp,tonemapping_fragment:rp,tonemapping_pars_fragment:op,transmission_fragment:ap,transmission_pars_fragment:lp,uv_pars_fragment:cp,uv_pars_vertex:hp,uv_vertex:dp,worldpos_vertex:up,background_vert:fp,background_frag:pp,backgroundCube_vert:mp,backgroundCube_frag:Ep,cube_vert:gp,cube_frag:Mp,depth_vert:yp,depth_frag:xp,distanceRGBA_vert:_p,distanceRGBA_frag:wp,equirect_vert:Tp,equirect_frag:vp,linedashed_vert:Sp,linedashed_frag:bp,meshbasic_vert:Rp,meshbasic_frag:Ap,meshlambert_vert:Cp,meshlambert_frag:Hp,meshmatcap_vert:Pp,meshmatcap_frag:Ip,meshnormal_vert:Dp,meshnormal_frag:Lp,meshphong_vert:Bp,meshphong_frag:Gp,meshphysical_vert:Up,meshphysical_frag:Fp,meshtoon_vert:Np,meshtoon_frag:Op,points_vert:kp,points_frag:zp,shadow_vert:Vp,shadow_frag:Wp,sprite_vert:Xp,sprite_frag:Yp},Le={common:{diffuse:{value:new Pe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new je}},envmap:{envMap:{value:null},envMapRotation:{value:new je},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new je},normalScale:{value:new be(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Pe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Pe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0},uvTransform:{value:new je}},sprite:{diffuse:{value:new Pe(16777215)},opacity:{value:1},center:{value:new be(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}}},bn={basic:{uniforms:kt([Le.common,Le.specularmap,Le.envmap,Le.aomap,Le.lightmap,Le.fog]),vertexShader:tt.meshbasic_vert,fragmentShader:tt.meshbasic_frag},lambert:{uniforms:kt([Le.common,Le.specularmap,Le.envmap,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.fog,Le.lights,{emissive:{value:new Pe(0)}}]),vertexShader:tt.meshlambert_vert,fragmentShader:tt.meshlambert_frag},phong:{uniforms:kt([Le.common,Le.specularmap,Le.envmap,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.fog,Le.lights,{emissive:{value:new Pe(0)},specular:{value:new Pe(1118481)},shininess:{value:30}}]),vertexShader:tt.meshphong_vert,fragmentShader:tt.meshphong_frag},standard:{uniforms:kt([Le.common,Le.envmap,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.roughnessmap,Le.metalnessmap,Le.fog,Le.lights,{emissive:{value:new Pe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag},toon:{uniforms:kt([Le.common,Le.aomap,Le.lightmap,Le.emissivemap,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.gradientmap,Le.fog,Le.lights,{emissive:{value:new Pe(0)}}]),vertexShader:tt.meshtoon_vert,fragmentShader:tt.meshtoon_frag},matcap:{uniforms:kt([Le.common,Le.bumpmap,Le.normalmap,Le.displacementmap,Le.fog,{matcap:{value:null}}]),vertexShader:tt.meshmatcap_vert,fragmentShader:tt.meshmatcap_frag},points:{uniforms:kt([Le.points,Le.fog]),vertexShader:tt.points_vert,fragmentShader:tt.points_frag},dashed:{uniforms:kt([Le.common,Le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tt.linedashed_vert,fragmentShader:tt.linedashed_frag},depth:{uniforms:kt([Le.common,Le.displacementmap]),vertexShader:tt.depth_vert,fragmentShader:tt.depth_frag},normal:{uniforms:kt([Le.common,Le.bumpmap,Le.normalmap,Le.displacementmap,{opacity:{value:1}}]),vertexShader:tt.meshnormal_vert,fragmentShader:tt.meshnormal_frag},sprite:{uniforms:kt([Le.sprite,Le.fog]),vertexShader:tt.sprite_vert,fragmentShader:tt.sprite_frag},background:{uniforms:{uvTransform:{value:new je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tt.background_vert,fragmentShader:tt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new je}},vertexShader:tt.backgroundCube_vert,fragmentShader:tt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tt.cube_vert,fragmentShader:tt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tt.equirect_vert,fragmentShader:tt.equirect_frag},distanceRGBA:{uniforms:kt([Le.common,Le.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tt.distanceRGBA_vert,fragmentShader:tt.distanceRGBA_frag},shadow:{uniforms:kt([Le.lights,Le.fog,{color:{value:new Pe(0)},opacity:{value:1}}]),vertexShader:tt.shadow_vert,fragmentShader:tt.shadow_frag}};bn.physical={uniforms:kt([bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new je},clearcoatNormalScale:{value:new be(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new je},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new je},sheen:{value:0},sheenColor:{value:new Pe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new je},transmissionSamplerSize:{value:new be},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new je},attenuationDistance:{value:0},attenuationColor:{value:new Pe(0)},specularColor:{value:new Pe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new je},anisotropyVector:{value:new be},anisotropyMap:{value:null},anisotropyMapTransform:{value:new je}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag};var ma={r:0,b:0,g:0},Pi=new Wt,qp=new ut;function Zp(n,e,t,i,s,r,o){let a=new Pe(0),l=r===!0?0:1,c,h,d=null,p=0,u=null;function m(w){let y=w.isScene===!0?w.background:null;return y&&y.isTexture&&(y=(w.backgroundBlurriness>0?t:e).get(y)),y}function M(w){let y=!1,b=m(w);b===null?f(a,l):b&&b.isColor&&(f(b,1),y=!0);let R=n.xr.getEnvironmentBlendMode();R==="additive"?i.buffers.color.setClear(0,0,0,1,o):R==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||y)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function g(w,y){let b=m(y);b&&(b.isCubeTexture||b.mapping===ir)?(h===void 0&&(h=new E(new X(1,1,1),new Gt({name:"BackgroundCubeMaterial",uniforms:Hi(bn.backgroundCube.uniforms),vertexShader:bn.backgroundCube.vertexShader,fragmentShader:bn.backgroundCube.fragmentShader,side:Ut,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,C,H){this.matrixWorld.copyPosition(H.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Pi.copy(y.backgroundRotation),Pi.x*=-1,Pi.y*=-1,Pi.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(Pi.y*=-1,Pi.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(qp.makeRotationFromEuler(Pi)),h.material.toneMapped=ct.getTransfer(b.colorSpace)!==Et,(d!==b||p!==b.version||u!==n.toneMapping)&&(h.material.needsUpdate=!0,d=b,p=b.version,u=n.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new E(new nt(2,2),new Gt({name:"BackgroundMaterial",uniforms:Hi(bn.background.uniforms),vertexShader:bn.background.vertexShader,fragmentShader:bn.background.fragmentShader,side:Un,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=ct.getTransfer(b.colorSpace)!==Et,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(d!==b||p!==b.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,d=b,p=b.version,u=n.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null))}function f(w,y){w.getRGB(ma,Gl(n)),i.buffers.color.setClear(ma.r,ma.g,ma.b,y,o)}function _(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(w,y=1){a.set(w),l=y,f(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,f(a,l)},render:M,addToRenderList:g,dispose:_}}function Jp(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=p(null),r=s,o=!1;function a(x,I,B,G,N){let W=!1,z=d(G,B,I);r!==z&&(r=z,c(r.object)),W=u(x,G,B,N),W&&m(x,G,B,N),N!==null&&e.update(N,n.ELEMENT_ARRAY_BUFFER),(W||o)&&(o=!1,y(x,I,B,G),N!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function l(){return n.createVertexArray()}function c(x){return n.bindVertexArray(x)}function h(x){return n.deleteVertexArray(x)}function d(x,I,B){let G=B.wireframe===!0,N=i[x.id];N===void 0&&(N={},i[x.id]=N);let W=N[I.id];W===void 0&&(W={},N[I.id]=W);let z=W[G];return z===void 0&&(z=p(l()),W[G]=z),z}function p(x){let I=[],B=[],G=[];for(let N=0;N<t;N++)I[N]=0,B[N]=0,G[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:B,attributeDivisors:G,object:x,attributes:{},index:null}}function u(x,I,B,G){let N=r.attributes,W=I.attributes,z=0,J=B.getAttributes();for(let U in J)if(J[U].location>=0){let te=N[U],ue=W[U];if(ue===void 0&&(U==="instanceMatrix"&&x.instanceMatrix&&(ue=x.instanceMatrix),U==="instanceColor"&&x.instanceColor&&(ue=x.instanceColor)),te===void 0||te.attribute!==ue||ue&&te.data!==ue.data)return!0;z++}return r.attributesNum!==z||r.index!==G}function m(x,I,B,G){let N={},W=I.attributes,z=0,J=B.getAttributes();for(let U in J)if(J[U].location>=0){let te=W[U];te===void 0&&(U==="instanceMatrix"&&x.instanceMatrix&&(te=x.instanceMatrix),U==="instanceColor"&&x.instanceColor&&(te=x.instanceColor));let ue={};ue.attribute=te,te&&te.data&&(ue.data=te.data),N[U]=ue,z++}r.attributes=N,r.attributesNum=z,r.index=G}function M(){let x=r.newAttributes;for(let I=0,B=x.length;I<B;I++)x[I]=0}function g(x){f(x,0)}function f(x,I){let B=r.newAttributes,G=r.enabledAttributes,N=r.attributeDivisors;B[x]=1,G[x]===0&&(n.enableVertexAttribArray(x),G[x]=1),N[x]!==I&&(n.vertexAttribDivisor(x,I),N[x]=I)}function _(){let x=r.newAttributes,I=r.enabledAttributes;for(let B=0,G=I.length;B<G;B++)I[B]!==x[B]&&(n.disableVertexAttribArray(B),I[B]=0)}function w(x,I,B,G,N,W,z){z===!0?n.vertexAttribIPointer(x,I,B,N,W):n.vertexAttribPointer(x,I,B,G,N,W)}function y(x,I,B,G){M();let N=G.attributes,W=B.getAttributes(),z=I.defaultAttributeValues;for(let J in W){let U=W[J];if(U.location>=0){let Q=N[J];if(Q===void 0&&(J==="instanceMatrix"&&x.instanceMatrix&&(Q=x.instanceMatrix),J==="instanceColor"&&x.instanceColor&&(Q=x.instanceColor)),Q!==void 0){let te=Q.normalized,ue=Q.itemSize,we=e.get(Q);if(we===void 0)continue;let Ae=we.buffer,q=we.type,ie=we.bytesPerElement,Ee=q===n.INT||q===n.UNSIGNED_INT||Q.gpuType===Go;if(Q.isInterleavedBufferAttribute){let me=Q.data,oe=me.stride,Ce=Q.offset;if(me.isInstancedInterleavedBuffer){for(let $=0;$<U.locationSize;$++)f(U.location+$,me.meshPerAttribute);x.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=me.meshPerAttribute*me.count)}else for(let $=0;$<U.locationSize;$++)g(U.location+$);n.bindBuffer(n.ARRAY_BUFFER,Ae);for(let $=0;$<U.locationSize;$++)w(U.location+$,ue/U.locationSize,q,te,oe*ie,(Ce+ue/U.locationSize*$)*ie,Ee)}else{if(Q.isInstancedBufferAttribute){for(let me=0;me<U.locationSize;me++)f(U.location+me,Q.meshPerAttribute);x.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let me=0;me<U.locationSize;me++)g(U.location+me);n.bindBuffer(n.ARRAY_BUFFER,Ae);for(let me=0;me<U.locationSize;me++)w(U.location+me,ue/U.locationSize,q,te,ue*ie,ue/U.locationSize*me*ie,Ee)}}else if(z!==void 0){let te=z[J];if(te!==void 0)switch(te.length){case 2:n.vertexAttrib2fv(U.location,te);break;case 3:n.vertexAttrib3fv(U.location,te);break;case 4:n.vertexAttrib4fv(U.location,te);break;default:n.vertexAttrib1fv(U.location,te)}}}}_()}function b(){H();for(let x in i){let I=i[x];for(let B in I){let G=I[B];for(let N in G)h(G[N].object),delete G[N];delete I[B]}delete i[x]}}function R(x){if(i[x.id]===void 0)return;let I=i[x.id];for(let B in I){let G=I[B];for(let N in G)h(G[N].object),delete G[N];delete I[B]}delete i[x.id]}function C(x){for(let I in i){let B=i[I];if(B[x.id]===void 0)continue;let G=B[x.id];for(let N in G)h(G[N].object),delete G[N];delete B[x.id]}}function H(){T(),o=!0,r!==s&&(r=s,c(r.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:H,resetDefaultState:T,dispose:b,releaseStatesOfGeometry:R,releaseStatesOfProgram:C,initAttributes:M,enableAttribute:g,disableUnusedAttributes:_}}function Kp(n,e,t){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function o(c,h,d){d!==0&&(n.drawArraysInstanced(i,c,h,d),t.update(h,i,d))}function a(c,h,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,d);let u=0;for(let m=0;m<d;m++)u+=h[m];t.update(u,i,1)}function l(c,h,d,p){if(d===0)return;let u=e.get("WEBGL_multi_draw");if(u===null)for(let m=0;m<c.length;m++)o(c[m],h[m],p[m]);else{u.multiDrawArraysInstancedWEBGL(i,c,0,h,0,p,0,d);let m=0;for(let M=0;M<d;M++)m+=h[M]*p[M];t.update(m,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function $p(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==dn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let H=C===hi&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==vn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==Sn&&!H)}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,p=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),u=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),M=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),f=n.getParameter(n.MAX_VERTEX_ATTRIBS),_=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),w=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),b=m>0,R=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:p,maxTextures:u,maxVertexTextures:m,maxTextureSize:M,maxCubemapSize:g,maxAttributes:f,maxVertexUniforms:_,maxVaryings:w,maxFragmentUniforms:y,vertexTextures:b,maxSamples:R}}function Qp(n){let e=this,t=null,i=0,s=!1,r=!1,o=new an,a=new je,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,p){let u=d.length!==0||p||i!==0||s;return s=p,i=d.length,u},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,p){t=h(d,p,0)},this.setState=function(d,p,u){let m=d.clippingPlanes,M=d.clipIntersection,g=d.clipShadows,f=n.get(d);if(!s||m===null||m.length===0||r&&!g)r?h(null):c();else{let _=r?0:i,w=_*4,y=f.clippingState||null;l.value=y,y=h(m,p,w,u);for(let b=0;b!==w;++b)y[b]=t[b];f.clippingState=y,this.numIntersection=M?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,p,u,m){let M=d!==null?d.length:0,g=null;if(M!==0){if(g=l.value,m!==!0||g===null){let f=u+M*4,_=p.matrixWorldInverse;a.getNormalMatrix(_),(g===null||g.length<f)&&(g=new Float32Array(f));for(let w=0,y=u;w!==M;++w,y+=4)o.copy(d[w]).applyMatrix4(_,a),o.normal.toArray(g,y),g[y+3]=o.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=M,e.numIntersection=0,g}}function jp(n){let e=new WeakMap;function t(o,a){return a===Do?o.mapping=Ai:a===Lo&&(o.mapping=Ci),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===Do||a===Lo)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new to(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var us=4,Sh=[.125,.215,.35,.446,.526,.582],Li=20,kl=new nr,bh=new Pe,zl=null,Vl=0,Wl=0,Xl=!1,Di=(1+Math.sqrt(5))/2,ds=1/Di,Rh=[new L(-Di,ds,0),new L(Di,ds,0),new L(-ds,0,Di),new L(ds,0,Di),new L(0,Di,-ds),new L(0,Di,ds),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)],e0=new L,Ma=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=e0}=r;zl=this._renderer.getRenderTarget(),Vl=this._renderer.getActiveCubeFace(),Wl=this._renderer.getActiveMipmapLevel(),Xl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Hh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ch(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(zl,Vl,Wl),this._renderer.xr.enabled=Xl,e.scissorTest=!1,Ea(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ai||e.mapping===Ci?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),zl=this._renderer.getRenderTarget(),Vl=this._renderer.getActiveCubeFace(),Wl=this._renderer.getActiveMipmapLevel(),Xl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:gn,minFilter:gn,generateMipmaps:!1,type:hi,format:dn,colorSpace:_i,depthBuffer:!1},s=Ah(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ah(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=t0(r)),this._blurMaterial=n0(r,e,t)}return s}_compileMaterial(e){let t=new E(this._lodPlanes[0],e);this._renderer.compile(t,kl)}_sceneToCubeUV(e,t,i,s,r){let l=new At(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,p=d.autoClear,u=d.toneMapping;d.getClearColor(bh),d.toneMapping=On,d.autoClear=!1;let m=new Se({name:"PMREM.Background",side:Ut,depthWrite:!1,depthTest:!1}),M=new E(new X,m),g=!1,f=e.background;f?f.isColor&&(m.color.copy(f),e.background=null,g=!0):(m.color.copy(bh),g=!0);for(let _=0;_<6;_++){let w=_%3;w===0?(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[_],r.y,r.z)):w===1?(l.up.set(0,0,c[_]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[_],r.z)):(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[_]));let y=this._cubeSize;Ea(s,w*y,_>2?y:0,y,y),d.setRenderTarget(s),g&&d.render(M,l),d.render(e,l)}M.geometry.dispose(),M.material.dispose(),d.toneMapping=u,d.autoClear=p,e.background=f}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Ai||e.mapping===Ci;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Hh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ch());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new E(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Ea(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,kl)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Rh[(s-r-1)%Rh.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,d=new E(this._lodPlanes[s],c),p=c.uniforms,u=this._sizeLods[i]-1,m=isFinite(r)?Math.PI/(2*u):2*Math.PI/(2*Li-1),M=r/m,g=isFinite(r)?1+Math.floor(h*M):Li;g>Li&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Li}`);let f=[],_=0;for(let C=0;C<Li;++C){let H=C/M,T=Math.exp(-H*H/2);f.push(T),C===0?_+=T:C<g&&(_+=2*T)}for(let C=0;C<f.length;C++)f[C]=f[C]/_;p.envMap.value=e.texture,p.samples.value=g,p.weights.value=f,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);let{_lodMax:w}=this;p.dTheta.value=m,p.mipInt.value=w-i;let y=this._sizeLods[s],b=3*y*(s>w-us?s-w+us:0),R=4*(this._cubeSize-y);Ea(t,b,R,3*y,2*y),l.setRenderTarget(t),l.render(d,kl)}};function t0(n){let e=[],t=[],i=[],s=n,r=n-us+1+Sh.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>n-us?l=Sh[o-n+us-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,d=1+c,p=[h,h,d,h,d,d,h,h,d,d,h,d],u=6,m=6,M=3,g=2,f=1,_=new Float32Array(M*m*u),w=new Float32Array(g*m*u),y=new Float32Array(f*m*u);for(let R=0;R<u;R++){let C=R%3*2/3-1,H=R>2?0:-1,T=[C,H,0,C+2/3,H,0,C+2/3,H+1,0,C,H,0,C+2/3,H+1,0,C,H+1,0];_.set(T,M*m*R),w.set(p,g*m*R);let x=[R,R,R,R,R,R];y.set(x,f*m*R)}let b=new Tt;b.setAttribute("position",new Bt(_,M)),b.setAttribute("uv",new Bt(w,g)),b.setAttribute("faceIndex",new Bt(y,f)),e.push(b),s>us&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Ah(n,e,t){let i=new cn(n,e,t);return i.texture.mapping=ir,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ea(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function n0(n,e,t){let i=new Float32Array(Li),s=new L(0,1,0);return new Gt({name:"SphericalGaussianBlur",defines:{n:Li,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:tc(),fragmentShader:`

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
		`,blending:Nn,depthTest:!1,depthWrite:!1})}function Ch(){return new Gt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:tc(),fragmentShader:`

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
		`,blending:Nn,depthTest:!1,depthWrite:!1})}function Hh(){return new Gt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Nn,depthTest:!1,depthWrite:!1})}function tc(){return`

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
	`}function i0(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===Do||l===Lo,h=l===Ai||l===Ci;if(c||h){let d=e.get(a),p=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==p)return t===null&&(t=new Ma(n)),d=c?t.fromEquirectangular(a,d):t.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),d.texture;if(d!==void 0)return d.texture;{let u=a.image;return c&&u&&u.height>0||h&&u&&s(u)?(t===null&&(t=new Ma(n)),d=c?t.fromEquirectangular(a):t.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),a.addEventListener("dispose",r),d.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function s0(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&dr("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function r0(n,e,t,i){let s={},r=new WeakMap;function o(d){let p=d.target;p.index!==null&&e.remove(p.index);for(let m in p.attributes)e.remove(p.attributes[m]);p.removeEventListener("dispose",o),delete s[p.id];let u=r.get(p);u&&(e.remove(u),r.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function a(d,p){return s[p.id]===!0||(p.addEventListener("dispose",o),s[p.id]=!0,t.memory.geometries++),p}function l(d){let p=d.attributes;for(let u in p)e.update(p[u],n.ARRAY_BUFFER)}function c(d){let p=[],u=d.index,m=d.attributes.position,M=0;if(u!==null){let _=u.array;M=u.version;for(let w=0,y=_.length;w<y;w+=3){let b=_[w+0],R=_[w+1],C=_[w+2];p.push(b,R,R,C,C,b)}}else if(m!==void 0){let _=m.array;M=m.version;for(let w=0,y=_.length/3-1;w<y;w+=3){let b=w+0,R=w+1,C=w+2;p.push(b,R,R,C,C,b)}}else return;let g=new(Bl(p)?Ns:Fs)(p,1);g.version=M;let f=r.get(d);f&&e.remove(f),r.set(d,g)}function h(d){let p=r.get(d);if(p){let u=d.index;u!==null&&p.version<u.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function o0(n,e,t){let i;function s(p){i=p}let r,o;function a(p){r=p.type,o=p.bytesPerElement}function l(p,u){n.drawElements(i,u,r,p*o),t.update(u,i,1)}function c(p,u,m){m!==0&&(n.drawElementsInstanced(i,u,r,p*o,m),t.update(u,i,m))}function h(p,u,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,r,p,0,m);let g=0;for(let f=0;f<m;f++)g+=u[f];t.update(g,i,1)}function d(p,u,m,M){if(m===0)return;let g=e.get("WEBGL_multi_draw");if(g===null)for(let f=0;f<p.length;f++)c(p[f]/o,u[f],M[f]);else{g.multiDrawElementsInstancedWEBGL(i,u,0,r,p,0,M,0,m);let f=0;for(let _=0;_<m;_++)f+=u[_]*M[_];t.update(f,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function a0(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function l0(n,e,t){let i=new WeakMap,s=new dt;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,p=i.get(a);if(p===void 0||p.count!==d){let T=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",T)};p!==void 0&&p.texture.dispose();let u=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,M=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],_=a.morphAttributes.color||[],w=0;u===!0&&(w=1),m===!0&&(w=2),M===!0&&(w=3);let y=a.attributes.position.count*w,b=1;y>e.maxTextureSize&&(b=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let R=new Float32Array(y*b*4*d),C=new Gs(R,y,b,d);C.type=Sn,C.needsUpdate=!0;let H=w*4;for(let x=0;x<d;x++){let I=g[x],B=f[x],G=_[x],N=y*b*4*x;for(let W=0;W<I.count;W++){let z=W*H;u===!0&&(s.fromBufferAttribute(I,W),R[N+z+0]=s.x,R[N+z+1]=s.y,R[N+z+2]=s.z,R[N+z+3]=0),m===!0&&(s.fromBufferAttribute(B,W),R[N+z+4]=s.x,R[N+z+5]=s.y,R[N+z+6]=s.z,R[N+z+7]=0),M===!0&&(s.fromBufferAttribute(G,W),R[N+z+8]=s.x,R[N+z+9]=s.y,R[N+z+10]=s.z,R[N+z+11]=G.itemSize===4?s.w:1)}}p={count:d,texture:C,size:new be(y,b)},i.set(a,p),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let u=0;for(let M=0;M<c.length;M++)u+=c[M];let m=a.morphTargetsRelative?1:1-u;l.getUniforms().setValue(n,"morphTargetBaseInfluence",m),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",p.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",p.size)}return{update:r}}function c0(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,d=e.get(l,h);if(s.get(d)!==c&&(e.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let p=l.skeleton;s.get(p)!==c&&(p.update(),s.set(p,c))}return d}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var Jh=new Vt,Ph=new Xs(1,1),Kh=new Gs,$h=new jr,Qh=new ks,Ih=[],Dh=[],Lh=new Float32Array(16),Bh=new Float32Array(9),Gh=new Float32Array(4);function ps(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Ih[s];if(r===void 0&&(r=new Float32Array(s),Ih[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Ht(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Pt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function xa(n,e){let t=Dh[e];t===void 0&&(t=new Int32Array(e),Dh[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function h0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function d0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ht(t,e))return;n.uniform2fv(this.addr,e),Pt(t,e)}}function u0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ht(t,e))return;n.uniform3fv(this.addr,e),Pt(t,e)}}function f0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ht(t,e))return;n.uniform4fv(this.addr,e),Pt(t,e)}}function p0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ht(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Pt(t,e)}else{if(Ht(t,i))return;Gh.set(i),n.uniformMatrix2fv(this.addr,!1,Gh),Pt(t,i)}}function m0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ht(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Pt(t,e)}else{if(Ht(t,i))return;Bh.set(i),n.uniformMatrix3fv(this.addr,!1,Bh),Pt(t,i)}}function E0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ht(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Pt(t,e)}else{if(Ht(t,i))return;Lh.set(i),n.uniformMatrix4fv(this.addr,!1,Lh),Pt(t,i)}}function g0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function M0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ht(t,e))return;n.uniform2iv(this.addr,e),Pt(t,e)}}function y0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ht(t,e))return;n.uniform3iv(this.addr,e),Pt(t,e)}}function x0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ht(t,e))return;n.uniform4iv(this.addr,e),Pt(t,e)}}function _0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function w0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ht(t,e))return;n.uniform2uiv(this.addr,e),Pt(t,e)}}function T0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ht(t,e))return;n.uniform3uiv(this.addr,e),Pt(t,e)}}function v0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ht(t,e))return;n.uniform4uiv(this.addr,e),Pt(t,e)}}function S0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Ph.compareFunction=Dl,r=Ph):r=Jh,t.setTexture2D(e||r,s)}function b0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||$h,s)}function R0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Qh,s)}function A0(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Kh,s)}function C0(n){switch(n){case 5126:return h0;case 35664:return d0;case 35665:return u0;case 35666:return f0;case 35674:return p0;case 35675:return m0;case 35676:return E0;case 5124:case 35670:return g0;case 35667:case 35671:return M0;case 35668:case 35672:return y0;case 35669:case 35673:return x0;case 5125:return _0;case 36294:return w0;case 36295:return T0;case 36296:return v0;case 35678:case 36198:case 36298:case 36306:case 35682:return S0;case 35679:case 36299:case 36307:return b0;case 35680:case 36300:case 36308:case 36293:return R0;case 36289:case 36303:case 36311:case 36292:return A0}}function H0(n,e){n.uniform1fv(this.addr,e)}function P0(n,e){let t=ps(e,this.size,2);n.uniform2fv(this.addr,t)}function I0(n,e){let t=ps(e,this.size,3);n.uniform3fv(this.addr,t)}function D0(n,e){let t=ps(e,this.size,4);n.uniform4fv(this.addr,t)}function L0(n,e){let t=ps(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function B0(n,e){let t=ps(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function G0(n,e){let t=ps(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function U0(n,e){n.uniform1iv(this.addr,e)}function F0(n,e){n.uniform2iv(this.addr,e)}function N0(n,e){n.uniform3iv(this.addr,e)}function O0(n,e){n.uniform4iv(this.addr,e)}function k0(n,e){n.uniform1uiv(this.addr,e)}function z0(n,e){n.uniform2uiv(this.addr,e)}function V0(n,e){n.uniform3uiv(this.addr,e)}function W0(n,e){n.uniform4uiv(this.addr,e)}function X0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||Jh,r[o])}function Y0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||$h,r[o])}function q0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Qh,r[o])}function Z0(n,e,t){let i=this.cache,s=e.length,r=xa(t,s);Ht(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Kh,r[o])}function J0(n){switch(n){case 5126:return H0;case 35664:return P0;case 35665:return I0;case 35666:return D0;case 35674:return L0;case 35675:return B0;case 35676:return G0;case 5124:case 35670:return U0;case 35667:case 35671:return F0;case 35668:case 35672:return N0;case 35669:case 35673:return O0;case 5125:return k0;case 36294:return z0;case 36295:return V0;case 36296:return W0;case 35678:case 36198:case 36298:case 36306:case 35682:return X0;case 35679:case 36299:case 36307:return Y0;case 35680:case 36300:case 36308:case 36293:return q0;case 36289:case 36303:case 36311:case 36292:return Z0}}var ql=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=C0(t.type)}},Zl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=J0(t.type)}},Jl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Yl=/(\w+)(\])?(\[|\.)?/g;function Uh(n,e){n.seq.push(e),n.map[e.id]=e}function K0(n,e,t){let i=n.name,s=i.length;for(Yl.lastIndex=0;;){let r=Yl.exec(i),o=Yl.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Uh(t,c===void 0?new ql(a,n,e):new Zl(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new Jl(a),Uh(t,d)),t=d}}}var fs=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);K0(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function Fh(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var $0=37297,Q0=0;function j0(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var Nh=new je;function em(n){ct._getMatrix(Nh,ct.workingColorSpace,n);let e=`mat3( ${Nh.elements.map(t=>t.toFixed(4))} )`;switch(ct.getTransfer(n)){case Ds:return[e,"LinearTransferOETF"];case Et:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Oh(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+j0(n.getShaderSource(e),o)}else return s}function tm(n,e){let t=em(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function nm(n,e){let t;switch(e){case nh:t="Linear";break;case ih:t="Reinhard";break;case sh:t="Cineon";break;case Io:t="ACESFilmic";break;case oh:t="AgX";break;case ah:t="Neutral";break;case rh:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var ga=new L;function im(){ct.getLuminanceCoefficients(ga);let n=ga.x.toFixed(4),e=ga.y.toFixed(4),t=ga.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function sm(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ur).join(`
`)}function rm(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function om(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function ur(n){return n!==""}function kh(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function zh(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var am=/^[ \t]*#include +<([\w\d./]+)>/gm;function Kl(n){return n.replace(am,cm)}var lm=new Map;function cm(n,e){let t=tt[e];if(t===void 0){let i=lm.get(e);if(i!==void 0)t=tt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Kl(t)}var hm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vh(n){return n.replace(hm,dm)}function dm(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Wh(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}function um(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===gl?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===vo?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===wn&&(e="SHADOWMAP_TYPE_VSM"),e}function fm(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Ai:case Ci:e="ENVMAP_TYPE_CUBE";break;case ir:e="ENVMAP_TYPE_CUBE_UV";break}return e}function pm(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Ci:e="ENVMAP_MODE_REFRACTION";break}return e}function mm(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case xl:e="ENVMAP_BLENDING_MULTIPLY";break;case eh:e="ENVMAP_BLENDING_MIX";break;case th:e="ENVMAP_BLENDING_ADD";break}return e}function Em(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function gm(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=um(t),c=fm(t),h=pm(t),d=mm(t),p=Em(t),u=sm(t),m=rm(r),M=s.createProgram(),g,f,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(ur).join(`
`),g.length>0&&(g+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(ur).join(`
`),f.length>0&&(f+=`
`)):(g=[Wh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ur).join(`
`),f=[Wh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==On?"#define TONE_MAPPING":"",t.toneMapping!==On?tt.tonemapping_pars_fragment:"",t.toneMapping!==On?nm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",tt.colorspace_pars_fragment,tm("linearToOutputTexel",t.outputColorSpace),im(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ur).join(`
`)),o=Kl(o),o=kh(o,t),o=zh(o,t),a=Kl(a),a=kh(a,t),a=zh(a,t),o=Vh(o),a=Vh(a),t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,g=[u,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,f=["#define varying in",t.glslVersion===Ll?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ll?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let w=_+g+o,y=_+f+a,b=Fh(s,s.VERTEX_SHADER,w),R=Fh(s,s.FRAGMENT_SHADER,y);s.attachShader(M,b),s.attachShader(M,R),t.index0AttributeName!==void 0?s.bindAttribLocation(M,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(M,0,"position"),s.linkProgram(M);function C(I){if(n.debug.checkShaderErrors){let B=s.getProgramInfoLog(M).trim(),G=s.getShaderInfoLog(b).trim(),N=s.getShaderInfoLog(R).trim(),W=!0,z=!0;if(s.getProgramParameter(M,s.LINK_STATUS)===!1)if(W=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,M,b,R);else{let J=Oh(s,b,"vertex"),U=Oh(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(M,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+B+`
`+J+`
`+U)}else B!==""?console.warn("THREE.WebGLProgram: Program Info Log:",B):(G===""||N==="")&&(z=!1);z&&(I.diagnostics={runnable:W,programLog:B,vertexShader:{log:G,prefix:g},fragmentShader:{log:N,prefix:f}})}s.deleteShader(b),s.deleteShader(R),H=new fs(s,M),T=om(s,M)}let H;this.getUniforms=function(){return H===void 0&&C(this),H};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=s.getProgramParameter(M,$0)),x},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(M),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Q0++,this.cacheKey=e,this.usedTimes=1,this.program=M,this.vertexShader=b,this.fragmentShader=R,this}var Mm=0,$l=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ql(e),t.set(e,i)),i}},Ql=class{constructor(e){this.id=Mm++,this.code=e,this.usedTimes=0}};function ym(n,e,t,i,s,r,o){let a=new Us,l=new $l,c=new Set,h=[],d=s.logarithmicDepthBuffer,p=s.vertexTextures,u=s.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function M(T){return c.add(T),T===0?"uv":`uv${T}`}function g(T,x,I,B,G){let N=B.fog,W=G.geometry,z=T.isMeshStandardMaterial?B.environment:null,J=(T.isMeshStandardMaterial?t:e).get(T.envMap||z),U=J&&J.mapping===ir?J.image.height:null,Q=m[T.type];T.precision!==null&&(u=s.getMaxPrecision(T.precision),u!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",u,"instead."));let te=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,ue=te!==void 0?te.length:0,we=0;W.morphAttributes.position!==void 0&&(we=1),W.morphAttributes.normal!==void 0&&(we=2),W.morphAttributes.color!==void 0&&(we=3);let Ae,q,ie,Ee;if(Q){let ot=bn[Q];Ae=ot.vertexShader,q=ot.fragmentShader}else Ae=T.vertexShader,q=T.fragmentShader,l.update(T),ie=l.getVertexShaderID(T),Ee=l.getFragmentShaderID(T);let me=n.getRenderTarget(),oe=n.state.buffers.depth.getReversed(),Ce=G.isInstancedMesh===!0,$=G.isBatchedMesh===!0,Me=!!T.map,ge=!!T.matcap,ye=!!J,S=!!T.aoMap,ce=!!T.lightMap,ae=!!T.bumpMap,He=!!T.normalMap,Ge=!!T.displacementMap,Ke=!!T.emissiveMap,Ue=!!T.metalnessMap,D=!!T.roughnessMap,v=T.anisotropy>0,k=T.clearcoat>0,ne=T.dispersion>0,he=T.iridescence>0,re=T.sheen>0,Ie=T.transmission>0,Re=v&&!!T.anisotropyMap,Be=k&&!!T.clearcoatMap,et=k&&!!T.clearcoatNormalMap,xe=k&&!!T.clearcoatRoughnessMap,Oe=he&&!!T.iridescenceMap,Ye=he&&!!T.iridescenceThicknessMap,Te=re&&!!T.sheenColorMap,fe=re&&!!T.sheenRoughnessMap,Ve=!!T.specularMap,Fe=!!T.specularColorMap,Ze=!!T.specularIntensityMap,F=Ie&&!!T.transmissionMap,pe=Ie&&!!T.thicknessMap,Z=!!T.gradientMap,ee=!!T.alphaMap,_e=T.alphaTest>0,ve=!!T.alphaHash,We=!!T.extensions,rt=On;T.toneMapped&&(me===null||me.isXRRenderTarget===!0)&&(rt=n.toneMapping);let xt={shaderID:Q,shaderType:T.type,shaderName:T.name,vertexShader:Ae,fragmentShader:q,defines:T.defines,customVertexShaderID:ie,customFragmentShaderID:Ee,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:u,batching:$,batchingColor:$&&G._colorsTexture!==null,instancing:Ce,instancingColor:Ce&&G.instanceColor!==null,instancingMorph:Ce&&G.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:me===null?n.outputColorSpace:me.isXRRenderTarget===!0?me.texture.colorSpace:_i,alphaToCoverage:!!T.alphaToCoverage,map:Me,matcap:ge,envMap:ye,envMapMode:ye&&J.mapping,envMapCubeUVHeight:U,aoMap:S,lightMap:ce,bumpMap:ae,normalMap:He,displacementMap:p&&Ge,emissiveMap:Ke,normalMapObjectSpace:He&&T.normalMapType===dh,normalMapTangentSpace:He&&T.normalMapType===Il,metalnessMap:Ue,roughnessMap:D,anisotropy:v,anisotropyMap:Re,clearcoat:k,clearcoatMap:Be,clearcoatNormalMap:et,clearcoatRoughnessMap:xe,dispersion:ne,iridescence:he,iridescenceMap:Oe,iridescenceThicknessMap:Ye,sheen:re,sheenColorMap:Te,sheenRoughnessMap:fe,specularMap:Ve,specularColorMap:Fe,specularIntensityMap:Ze,transmission:Ie,transmissionMap:F,thicknessMap:pe,gradientMap:Z,opaque:T.transparent===!1&&T.blending===yi&&T.alphaToCoverage===!1,alphaMap:ee,alphaTest:_e,alphaHash:ve,combine:T.combine,mapUv:Me&&M(T.map.channel),aoMapUv:S&&M(T.aoMap.channel),lightMapUv:ce&&M(T.lightMap.channel),bumpMapUv:ae&&M(T.bumpMap.channel),normalMapUv:He&&M(T.normalMap.channel),displacementMapUv:Ge&&M(T.displacementMap.channel),emissiveMapUv:Ke&&M(T.emissiveMap.channel),metalnessMapUv:Ue&&M(T.metalnessMap.channel),roughnessMapUv:D&&M(T.roughnessMap.channel),anisotropyMapUv:Re&&M(T.anisotropyMap.channel),clearcoatMapUv:Be&&M(T.clearcoatMap.channel),clearcoatNormalMapUv:et&&M(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:xe&&M(T.clearcoatRoughnessMap.channel),iridescenceMapUv:Oe&&M(T.iridescenceMap.channel),iridescenceThicknessMapUv:Ye&&M(T.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&M(T.sheenColorMap.channel),sheenRoughnessMapUv:fe&&M(T.sheenRoughnessMap.channel),specularMapUv:Ve&&M(T.specularMap.channel),specularColorMapUv:Fe&&M(T.specularColorMap.channel),specularIntensityMapUv:Ze&&M(T.specularIntensityMap.channel),transmissionMapUv:F&&M(T.transmissionMap.channel),thicknessMapUv:pe&&M(T.thicknessMap.channel),alphaMapUv:ee&&M(T.alphaMap.channel),vertexTangents:!!W.attributes.tangent&&(He||v),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!W.attributes.uv&&(Me||ee),fog:!!N,useFog:T.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:oe,skinning:G.isSkinnedMesh===!0,morphTargets:W.morphAttributes.position!==void 0,morphNormals:W.morphAttributes.normal!==void 0,morphColors:W.morphAttributes.color!==void 0,morphTargetsCount:ue,morphTextureStride:we,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:T.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:rt,decodeVideoTexture:Me&&T.map.isVideoTexture===!0&&ct.getTransfer(T.map.colorSpace)===Et,decodeVideoTextureEmissive:Ke&&T.emissiveMap.isVideoTexture===!0&&ct.getTransfer(T.emissiveMap.colorSpace)===Et,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===at,flipSided:T.side===Ut,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:We&&T.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(We&&T.extensions.multiDraw===!0||$)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return xt.vertexUv1s=c.has(1),xt.vertexUv2s=c.has(2),xt.vertexUv3s=c.has(3),c.clear(),xt}function f(T){let x=[];if(T.shaderID?x.push(T.shaderID):(x.push(T.customVertexShaderID),x.push(T.customFragmentShaderID)),T.defines!==void 0)for(let I in T.defines)x.push(I),x.push(T.defines[I]);return T.isRawShaderMaterial===!1&&(_(x,T),w(x,T),x.push(n.outputColorSpace)),x.push(T.customProgramCacheKey),x.join()}function _(T,x){T.push(x.precision),T.push(x.outputColorSpace),T.push(x.envMapMode),T.push(x.envMapCubeUVHeight),T.push(x.mapUv),T.push(x.alphaMapUv),T.push(x.lightMapUv),T.push(x.aoMapUv),T.push(x.bumpMapUv),T.push(x.normalMapUv),T.push(x.displacementMapUv),T.push(x.emissiveMapUv),T.push(x.metalnessMapUv),T.push(x.roughnessMapUv),T.push(x.anisotropyMapUv),T.push(x.clearcoatMapUv),T.push(x.clearcoatNormalMapUv),T.push(x.clearcoatRoughnessMapUv),T.push(x.iridescenceMapUv),T.push(x.iridescenceThicknessMapUv),T.push(x.sheenColorMapUv),T.push(x.sheenRoughnessMapUv),T.push(x.specularMapUv),T.push(x.specularColorMapUv),T.push(x.specularIntensityMapUv),T.push(x.transmissionMapUv),T.push(x.thicknessMapUv),T.push(x.combine),T.push(x.fogExp2),T.push(x.sizeAttenuation),T.push(x.morphTargetsCount),T.push(x.morphAttributeCount),T.push(x.numDirLights),T.push(x.numPointLights),T.push(x.numSpotLights),T.push(x.numSpotLightMaps),T.push(x.numHemiLights),T.push(x.numRectAreaLights),T.push(x.numDirLightShadows),T.push(x.numPointLightShadows),T.push(x.numSpotLightShadows),T.push(x.numSpotLightShadowsWithMaps),T.push(x.numLightProbes),T.push(x.shadowMapType),T.push(x.toneMapping),T.push(x.numClippingPlanes),T.push(x.numClipIntersection),T.push(x.depthPacking)}function w(T,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),T.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reverseDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),T.push(a.mask)}function y(T){let x=m[T.type],I;if(x){let B=bn[x];I=pa.clone(B.uniforms)}else I=T.uniforms;return I}function b(T,x){let I;for(let B=0,G=h.length;B<G;B++){let N=h[B];if(N.cacheKey===x){I=N,++I.usedTimes;break}}return I===void 0&&(I=new gm(n,x,T,r),h.push(I)),I}function R(T){if(--T.usedTimes===0){let x=h.indexOf(T);h[x]=h[h.length-1],h.pop(),T.destroy()}}function C(T){l.remove(T)}function H(){l.dispose()}return{getParameters:g,getProgramCacheKey:f,getUniforms:y,acquireProgram:b,releaseProgram:R,releaseShaderCache:C,programs:h,dispose:H}}function xm(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function _m(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Xh(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Yh(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(d,p,u,m,M,g){let f=n[e];return f===void 0?(f={id:d.id,object:d,geometry:p,material:u,groupOrder:m,renderOrder:d.renderOrder,z:M,group:g},n[e]=f):(f.id=d.id,f.object=d,f.geometry=p,f.material=u,f.groupOrder=m,f.renderOrder=d.renderOrder,f.z=M,f.group=g),e++,f}function a(d,p,u,m,M,g){let f=o(d,p,u,m,M,g);u.transmission>0?i.push(f):u.transparent===!0?s.push(f):t.push(f)}function l(d,p,u,m,M,g){let f=o(d,p,u,m,M,g);u.transmission>0?i.unshift(f):u.transparent===!0?s.unshift(f):t.unshift(f)}function c(d,p){t.length>1&&t.sort(d||_m),i.length>1&&i.sort(p||Xh),s.length>1&&s.sort(p||Xh)}function h(){for(let d=e,p=n.length;d<p;d++){let u=n[d];if(u.id===null)break;u.id=null,u.object=null,u.geometry=null,u.material=null,u.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function wm(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new Yh,n.set(i,[o])):s>=r.length?(o=new Yh,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Tm(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new Pe};break;case"SpotLight":t={position:new L,direction:new L,color:new Pe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new Pe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new Pe,groundColor:new Pe};break;case"RectAreaLight":t={color:new Pe,position:new L,halfWidth:new L,halfHeight:new L};break}return n[e.id]=t,t}}}function vm(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new be};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new be};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new be,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Sm=0;function bm(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Rm(n){let e=new Tm,t=vm(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new L);let s=new L,r=new ut,o=new ut;function a(c){let h=0,d=0,p=0;for(let T=0;T<9;T++)i.probe[T].set(0,0,0);let u=0,m=0,M=0,g=0,f=0,_=0,w=0,y=0,b=0,R=0,C=0;c.sort(bm);for(let T=0,x=c.length;T<x;T++){let I=c[T],B=I.color,G=I.intensity,N=I.distance,W=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)h+=B.r*G,d+=B.g*G,p+=B.b*G;else if(I.isLightProbe){for(let z=0;z<9;z++)i.probe[z].addScaledVector(I.sh.coefficients[z],G);C++}else if(I.isDirectionalLight){let z=e.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let J=I.shadow,U=t.get(I);U.shadowIntensity=J.intensity,U.shadowBias=J.bias,U.shadowNormalBias=J.normalBias,U.shadowRadius=J.radius,U.shadowMapSize=J.mapSize,i.directionalShadow[u]=U,i.directionalShadowMap[u]=W,i.directionalShadowMatrix[u]=I.shadow.matrix,_++}i.directional[u]=z,u++}else if(I.isSpotLight){let z=e.get(I);z.position.setFromMatrixPosition(I.matrixWorld),z.color.copy(B).multiplyScalar(G),z.distance=N,z.coneCos=Math.cos(I.angle),z.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),z.decay=I.decay,i.spot[M]=z;let J=I.shadow;if(I.map&&(i.spotLightMap[b]=I.map,b++,J.updateMatrices(I),I.castShadow&&R++),i.spotLightMatrix[M]=J.matrix,I.castShadow){let U=t.get(I);U.shadowIntensity=J.intensity,U.shadowBias=J.bias,U.shadowNormalBias=J.normalBias,U.shadowRadius=J.radius,U.shadowMapSize=J.mapSize,i.spotShadow[M]=U,i.spotShadowMap[M]=W,y++}M++}else if(I.isRectAreaLight){let z=e.get(I);z.color.copy(B).multiplyScalar(G),z.halfWidth.set(I.width*.5,0,0),z.halfHeight.set(0,I.height*.5,0),i.rectArea[g]=z,g++}else if(I.isPointLight){let z=e.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),z.distance=I.distance,z.decay=I.decay,I.castShadow){let J=I.shadow,U=t.get(I);U.shadowIntensity=J.intensity,U.shadowBias=J.bias,U.shadowNormalBias=J.normalBias,U.shadowRadius=J.radius,U.shadowMapSize=J.mapSize,U.shadowCameraNear=J.camera.near,U.shadowCameraFar=J.camera.far,i.pointShadow[m]=U,i.pointShadowMap[m]=W,i.pointShadowMatrix[m]=I.shadow.matrix,w++}i.point[m]=z,m++}else if(I.isHemisphereLight){let z=e.get(I);z.skyColor.copy(I.color).multiplyScalar(G),z.groundColor.copy(I.groundColor).multiplyScalar(G),i.hemi[f]=z,f++}}g>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Le.LTC_FLOAT_1,i.rectAreaLTC2=Le.LTC_FLOAT_2):(i.rectAreaLTC1=Le.LTC_HALF_1,i.rectAreaLTC2=Le.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=p;let H=i.hash;(H.directionalLength!==u||H.pointLength!==m||H.spotLength!==M||H.rectAreaLength!==g||H.hemiLength!==f||H.numDirectionalShadows!==_||H.numPointShadows!==w||H.numSpotShadows!==y||H.numSpotMaps!==b||H.numLightProbes!==C)&&(i.directional.length=u,i.spot.length=M,i.rectArea.length=g,i.point.length=m,i.hemi.length=f,i.directionalShadow.length=_,i.directionalShadowMap.length=_,i.pointShadow.length=w,i.pointShadowMap.length=w,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=_,i.pointShadowMatrix.length=w,i.spotLightMatrix.length=y+b-R,i.spotLightMap.length=b,i.numSpotLightShadowsWithMaps=R,i.numLightProbes=C,H.directionalLength=u,H.pointLength=m,H.spotLength=M,H.rectAreaLength=g,H.hemiLength=f,H.numDirectionalShadows=_,H.numPointShadows=w,H.numSpotShadows=y,H.numSpotMaps=b,H.numLightProbes=C,i.version=Sm++)}function l(c,h){let d=0,p=0,u=0,m=0,M=0,g=h.matrixWorldInverse;for(let f=0,_=c.length;f<_;f++){let w=c[f];if(w.isDirectionalLight){let y=i.directional[d];y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(g),d++}else if(w.isSpotLight){let y=i.spot[u];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(g),y.direction.setFromMatrixPosition(w.matrixWorld),s.setFromMatrixPosition(w.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(g),u++}else if(w.isRectAreaLight){let y=i.rectArea[m];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(g),o.identity(),r.copy(w.matrixWorld),r.premultiply(g),o.extractRotation(r),y.halfWidth.set(w.width*.5,0,0),y.halfHeight.set(0,w.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),m++}else if(w.isPointLight){let y=i.point[p];y.position.setFromMatrixPosition(w.matrixWorld),y.position.applyMatrix4(g),p++}else if(w.isHemisphereLight){let y=i.hemi[M];y.direction.setFromMatrixPosition(w.matrixWorld),y.direction.transformDirection(g),M++}}}return{setup:a,setupView:l,state:i}}function qh(n){let e=new Rm(n),t=[],i=[];function s(h){c.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function o(h){i.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function Am(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new qh(n),e.set(s,[a])):r>=o.length?(a=new qh(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var Cm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Hm=`uniform sampler2D shadow_pass;
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
}`;function Pm(n,e,t){let i=new ts,s=new be,r=new be,o=new dt,a=new uo({depthPacking:hh}),l=new fo,c={},h=t.maxTextureSize,d={[Un]:Ut,[Ut]:Un,[at]:at},p=new Gt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new be},radius:{value:4}},vertexShader:Cm,fragmentShader:Hm}),u=p.clone();u.defines.HORIZONTAL_PASS=1;let m=new Tt;m.setAttribute("position",new Bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let M=new E(m,p),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=gl;let f=this.type;this.render=function(R,C,H){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||R.length===0)return;let T=n.getRenderTarget(),x=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),B=n.state;B.setBlending(Nn),B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let G=f!==wn&&this.type===wn,N=f===wn&&this.type!==wn;for(let W=0,z=R.length;W<z;W++){let J=R[W],U=J.shadow;if(U===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;s.copy(U.mapSize);let Q=U.getFrameExtents();if(s.multiply(Q),r.copy(U.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Q.x),s.x=r.x*Q.x,U.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Q.y),s.y=r.y*Q.y,U.mapSize.y=r.y)),U.map===null||G===!0||N===!0){let ue=this.type!==wn?{minFilter:ln,magFilter:ln}:{};U.map!==null&&U.map.dispose(),U.map=new cn(s.x,s.y,ue),U.map.texture.name=J.name+".shadowMap",U.camera.updateProjectionMatrix()}n.setRenderTarget(U.map),n.clear();let te=U.getViewportCount();for(let ue=0;ue<te;ue++){let we=U.getViewport(ue);o.set(r.x*we.x,r.y*we.y,r.x*we.z,r.y*we.w),B.viewport(o),U.updateMatrices(J,ue),i=U.getFrustum(),y(C,H,U.camera,J,this.type)}U.isPointLightShadow!==!0&&this.type===wn&&_(U,H),U.needsUpdate=!1}f=this.type,g.needsUpdate=!1,n.setRenderTarget(T,x,I)};function _(R,C){let H=e.update(M);p.defines.VSM_SAMPLES!==R.blurSamples&&(p.defines.VSM_SAMPLES=R.blurSamples,u.defines.VSM_SAMPLES=R.blurSamples,p.needsUpdate=!0,u.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new cn(s.x,s.y)),p.uniforms.shadow_pass.value=R.map.texture,p.uniforms.resolution.value=R.mapSize,p.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(C,null,H,p,M,null),u.uniforms.shadow_pass.value=R.mapPass.texture,u.uniforms.resolution.value=R.mapSize,u.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(C,null,H,u,M,null)}function w(R,C,H,T){let x=null,I=H.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(I!==void 0)x=I;else if(x=H.isPointLight===!0?l:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){let B=x.uuid,G=C.uuid,N=c[B];N===void 0&&(N={},c[B]=N);let W=N[G];W===void 0&&(W=x.clone(),N[G]=W,C.addEventListener("dispose",b)),x=W}if(x.visible=C.visible,x.wireframe=C.wireframe,T===wn?x.side=C.shadowSide!==null?C.shadowSide:C.side:x.side=C.shadowSide!==null?C.shadowSide:d[C.side],x.alphaMap=C.alphaMap,x.alphaTest=C.alphaTest,x.map=C.map,x.clipShadows=C.clipShadows,x.clippingPlanes=C.clippingPlanes,x.clipIntersection=C.clipIntersection,x.displacementMap=C.displacementMap,x.displacementScale=C.displacementScale,x.displacementBias=C.displacementBias,x.wireframeLinewidth=C.wireframeLinewidth,x.linewidth=C.linewidth,H.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let B=n.properties.get(x);B.light=H}return x}function y(R,C,H,T,x){if(R.visible===!1)return;if(R.layers.test(C.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&x===wn)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,R.matrixWorld);let G=e.update(R),N=R.material;if(Array.isArray(N)){let W=G.groups;for(let z=0,J=W.length;z<J;z++){let U=W[z],Q=N[U.materialIndex];if(Q&&Q.visible){let te=w(R,Q,T,x);R.onBeforeShadow(n,R,C,H,G,te,U),n.renderBufferDirect(H,null,G,te,R,U),R.onAfterShadow(n,R,C,H,G,te,U)}}}else if(N.visible){let W=w(R,N,T,x);R.onBeforeShadow(n,R,C,H,G,W,null),n.renderBufferDirect(H,null,G,W,R,null),R.onAfterShadow(n,R,C,H,G,W,null)}}let B=R.children;for(let G=0,N=B.length;G<N;G++)y(B[G],C,H,T,x)}function b(R){R.target.removeEventListener("dispose",b);for(let H in c){let T=c[H],x=R.target.uuid;x in T&&(T[x].dispose(),delete T[x])}}}var Im={[So]:bo,[Ro]:Ho,[Ao]:Po,[xi]:Co,[bo]:So,[Ho]:Ro,[Po]:Ao,[Co]:xi};function Dm(n,e){function t(){let F=!1,pe=new dt,Z=null,ee=new dt(0,0,0,0);return{setMask:function(_e){Z!==_e&&!F&&(n.colorMask(_e,_e,_e,_e),Z=_e)},setLocked:function(_e){F=_e},setClear:function(_e,ve,We,rt,xt){xt===!0&&(_e*=rt,ve*=rt,We*=rt),pe.set(_e,ve,We,rt),ee.equals(pe)===!1&&(n.clearColor(_e,ve,We,rt),ee.copy(pe))},reset:function(){F=!1,Z=null,ee.set(-1,0,0,0)}}}function i(){let F=!1,pe=!1,Z=null,ee=null,_e=null;return{setReversed:function(ve){if(pe!==ve){let We=e.get("EXT_clip_control");ve?We.clipControlEXT(We.LOWER_LEFT_EXT,We.ZERO_TO_ONE_EXT):We.clipControlEXT(We.LOWER_LEFT_EXT,We.NEGATIVE_ONE_TO_ONE_EXT),pe=ve;let rt=_e;_e=null,this.setClear(rt)}},getReversed:function(){return pe},setTest:function(ve){ve?me(n.DEPTH_TEST):oe(n.DEPTH_TEST)},setMask:function(ve){Z!==ve&&!F&&(n.depthMask(ve),Z=ve)},setFunc:function(ve){if(pe&&(ve=Im[ve]),ee!==ve){switch(ve){case So:n.depthFunc(n.NEVER);break;case bo:n.depthFunc(n.ALWAYS);break;case Ro:n.depthFunc(n.LESS);break;case xi:n.depthFunc(n.LEQUAL);break;case Ao:n.depthFunc(n.EQUAL);break;case Co:n.depthFunc(n.GEQUAL);break;case Ho:n.depthFunc(n.GREATER);break;case Po:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ee=ve}},setLocked:function(ve){F=ve},setClear:function(ve){_e!==ve&&(pe&&(ve=1-ve),n.clearDepth(ve),_e=ve)},reset:function(){F=!1,Z=null,ee=null,_e=null,pe=!1}}}function s(){let F=!1,pe=null,Z=null,ee=null,_e=null,ve=null,We=null,rt=null,xt=null;return{setTest:function(ot){F||(ot?me(n.STENCIL_TEST):oe(n.STENCIL_TEST))},setMask:function(ot){pe!==ot&&!F&&(n.stencilMask(ot),pe=ot)},setFunc:function(ot,Xt,nn){(Z!==ot||ee!==Xt||_e!==nn)&&(n.stencilFunc(ot,Xt,nn),Z=ot,ee=Xt,_e=nn)},setOp:function(ot,Xt,nn){(ve!==ot||We!==Xt||rt!==nn)&&(n.stencilOp(ot,Xt,nn),ve=ot,We=Xt,rt=nn)},setLocked:function(ot){F=ot},setClear:function(ot){xt!==ot&&(n.clearStencil(ot),xt=ot)},reset:function(){F=!1,pe=null,Z=null,ee=null,_e=null,ve=null,We=null,rt=null,xt=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},d={},p=new WeakMap,u=[],m=null,M=!1,g=null,f=null,_=null,w=null,y=null,b=null,R=null,C=new Pe(0,0,0),H=0,T=!1,x=null,I=null,B=null,G=null,N=null,W=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,J=0,U=n.getParameter(n.VERSION);U.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(U)[1]),z=J>=1):U.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(U)[1]),z=J>=2);let Q=null,te={},ue=n.getParameter(n.SCISSOR_BOX),we=n.getParameter(n.VIEWPORT),Ae=new dt().fromArray(ue),q=new dt().fromArray(we);function ie(F,pe,Z,ee){let _e=new Uint8Array(4),ve=n.createTexture();n.bindTexture(F,ve),n.texParameteri(F,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(F,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let We=0;We<Z;We++)F===n.TEXTURE_3D||F===n.TEXTURE_2D_ARRAY?n.texImage3D(pe,0,n.RGBA,1,1,ee,0,n.RGBA,n.UNSIGNED_BYTE,_e):n.texImage2D(pe+We,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,_e);return ve}let Ee={};Ee[n.TEXTURE_2D]=ie(n.TEXTURE_2D,n.TEXTURE_2D,1),Ee[n.TEXTURE_CUBE_MAP]=ie(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ee[n.TEXTURE_2D_ARRAY]=ie(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Ee[n.TEXTURE_3D]=ie(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),me(n.DEPTH_TEST),o.setFunc(xi),ae(!1),He(El),me(n.CULL_FACE),S(Nn);function me(F){h[F]!==!0&&(n.enable(F),h[F]=!0)}function oe(F){h[F]!==!1&&(n.disable(F),h[F]=!1)}function Ce(F,pe){return d[F]!==pe?(n.bindFramebuffer(F,pe),d[F]=pe,F===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=pe),F===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=pe),!0):!1}function $(F,pe){let Z=u,ee=!1;if(F){Z=p.get(pe),Z===void 0&&(Z=[],p.set(pe,Z));let _e=F.textures;if(Z.length!==_e.length||Z[0]!==n.COLOR_ATTACHMENT0){for(let ve=0,We=_e.length;ve<We;ve++)Z[ve]=n.COLOR_ATTACHMENT0+ve;Z.length=_e.length,ee=!0}}else Z[0]!==n.BACK&&(Z[0]=n.BACK,ee=!0);ee&&n.drawBuffers(Z)}function Me(F){return m!==F?(n.useProgram(F),m=F,!0):!1}let ge={[ti]:n.FUNC_ADD,[Uc]:n.FUNC_SUBTRACT,[Fc]:n.FUNC_REVERSE_SUBTRACT};ge[Nc]=n.MIN,ge[Oc]=n.MAX;let ye={[kc]:n.ZERO,[zc]:n.ONE,[Vc]:n.SRC_COLOR,[Yr]:n.SRC_ALPHA,[Jc]:n.SRC_ALPHA_SATURATE,[qc]:n.DST_COLOR,[Xc]:n.DST_ALPHA,[Wc]:n.ONE_MINUS_SRC_COLOR,[qr]:n.ONE_MINUS_SRC_ALPHA,[Zc]:n.ONE_MINUS_DST_COLOR,[Yc]:n.ONE_MINUS_DST_ALPHA,[Kc]:n.CONSTANT_COLOR,[$c]:n.ONE_MINUS_CONSTANT_COLOR,[Qc]:n.CONSTANT_ALPHA,[jc]:n.ONE_MINUS_CONSTANT_ALPHA};function S(F,pe,Z,ee,_e,ve,We,rt,xt,ot){if(F===Nn){M===!0&&(oe(n.BLEND),M=!1);return}if(M===!1&&(me(n.BLEND),M=!0),F!==Gc){if(F!==g||ot!==T){if((f!==ti||y!==ti)&&(n.blendEquation(n.FUNC_ADD),f=ti,y=ti),ot)switch(F){case yi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Tn:n.blendFunc(n.ONE,n.ONE);break;case Ml:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case yl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}else switch(F){case yi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Tn:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case Ml:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case yl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}_=null,w=null,b=null,R=null,C.set(0,0,0),H=0,g=F,T=ot}return}_e=_e||pe,ve=ve||Z,We=We||ee,(pe!==f||_e!==y)&&(n.blendEquationSeparate(ge[pe],ge[_e]),f=pe,y=_e),(Z!==_||ee!==w||ve!==b||We!==R)&&(n.blendFuncSeparate(ye[Z],ye[ee],ye[ve],ye[We]),_=Z,w=ee,b=ve,R=We),(rt.equals(C)===!1||xt!==H)&&(n.blendColor(rt.r,rt.g,rt.b,xt),C.copy(rt),H=xt),g=F,T=!1}function ce(F,pe){F.side===at?oe(n.CULL_FACE):me(n.CULL_FACE);let Z=F.side===Ut;pe&&(Z=!Z),ae(Z),F.blending===yi&&F.transparent===!1?S(Nn):S(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),o.setFunc(F.depthFunc),o.setTest(F.depthTest),o.setMask(F.depthWrite),r.setMask(F.colorWrite);let ee=F.stencilWrite;a.setTest(ee),ee&&(a.setMask(F.stencilWriteMask),a.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),a.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),Ke(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?me(n.SAMPLE_ALPHA_TO_COVERAGE):oe(n.SAMPLE_ALPHA_TO_COVERAGE)}function ae(F){x!==F&&(F?n.frontFace(n.CW):n.frontFace(n.CCW),x=F)}function He(F){F!==Lc?(me(n.CULL_FACE),F!==I&&(F===El?n.cullFace(n.BACK):F===Bc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):oe(n.CULL_FACE),I=F}function Ge(F){F!==B&&(z&&n.lineWidth(F),B=F)}function Ke(F,pe,Z){F?(me(n.POLYGON_OFFSET_FILL),(G!==pe||N!==Z)&&(n.polygonOffset(pe,Z),G=pe,N=Z)):oe(n.POLYGON_OFFSET_FILL)}function Ue(F){F?me(n.SCISSOR_TEST):oe(n.SCISSOR_TEST)}function D(F){F===void 0&&(F=n.TEXTURE0+W-1),Q!==F&&(n.activeTexture(F),Q=F)}function v(F,pe,Z){Z===void 0&&(Q===null?Z=n.TEXTURE0+W-1:Z=Q);let ee=te[Z];ee===void 0&&(ee={type:void 0,texture:void 0},te[Z]=ee),(ee.type!==F||ee.texture!==pe)&&(Q!==Z&&(n.activeTexture(Z),Q=Z),n.bindTexture(F,pe||Ee[F]),ee.type=F,ee.texture=pe)}function k(){let F=te[Q];F!==void 0&&F.type!==void 0&&(n.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function ne(){try{n.compressedTexImage2D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function he(){try{n.compressedTexImage3D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function re(){try{n.texSubImage2D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Ie(){try{n.texSubImage3D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Re(){try{n.compressedTexSubImage2D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Be(){try{n.compressedTexSubImage3D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function et(){try{n.texStorage2D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function xe(){try{n.texStorage3D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Oe(){try{n.texImage2D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Ye(){try{n.texImage3D(...arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Te(F){Ae.equals(F)===!1&&(n.scissor(F.x,F.y,F.z,F.w),Ae.copy(F))}function fe(F){q.equals(F)===!1&&(n.viewport(F.x,F.y,F.z,F.w),q.copy(F))}function Ve(F,pe){let Z=c.get(pe);Z===void 0&&(Z=new WeakMap,c.set(pe,Z));let ee=Z.get(F);ee===void 0&&(ee=n.getUniformBlockIndex(pe,F.name),Z.set(F,ee))}function Fe(F,pe){let ee=c.get(pe).get(F);l.get(pe)!==ee&&(n.uniformBlockBinding(pe,ee,F.__bindingPointIndex),l.set(pe,ee))}function Ze(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},Q=null,te={},d={},p=new WeakMap,u=[],m=null,M=!1,g=null,f=null,_=null,w=null,y=null,b=null,R=null,C=new Pe(0,0,0),H=0,T=!1,x=null,I=null,B=null,G=null,N=null,Ae.set(0,0,n.canvas.width,n.canvas.height),q.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:me,disable:oe,bindFramebuffer:Ce,drawBuffers:$,useProgram:Me,setBlending:S,setMaterial:ce,setFlipSided:ae,setCullFace:He,setLineWidth:Ge,setPolygonOffset:Ke,setScissorTest:Ue,activeTexture:D,bindTexture:v,unbindTexture:k,compressedTexImage2D:ne,compressedTexImage3D:he,texImage2D:Oe,texImage3D:Ye,updateUBOMapping:Ve,uniformBlockBinding:Fe,texStorage2D:et,texStorage3D:xe,texSubImage2D:re,texSubImage3D:Ie,compressedTexSubImage2D:Re,compressedTexSubImage3D:Be,scissor:Te,viewport:fe,reset:Ze}}function Lm(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new be,h=new WeakMap,d,p=new WeakMap,u=!1;try{u=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(D,v){return u?new OffscreenCanvas(D,v):$i("canvas")}function M(D,v,k){let ne=1,he=Ue(D);if((he.width>k||he.height>k)&&(ne=k/Math.max(he.width,he.height)),ne<1)if(typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&D instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&D instanceof ImageBitmap||typeof VideoFrame<"u"&&D instanceof VideoFrame){let re=Math.floor(ne*he.width),Ie=Math.floor(ne*he.height);d===void 0&&(d=m(re,Ie));let Re=v?m(re,Ie):d;return Re.width=re,Re.height=Ie,Re.getContext("2d").drawImage(D,0,0,re,Ie),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+he.width+"x"+he.height+") to ("+re+"x"+Ie+")."),Re}else return"data"in D&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+he.width+"x"+he.height+")."),D;return D}function g(D){return D.generateMipmaps}function f(D){n.generateMipmap(D)}function _(D){return D.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:D.isWebGL3DRenderTarget?n.TEXTURE_3D:D.isWebGLArrayRenderTarget||D.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function w(D,v,k,ne,he=!1){if(D!==null){if(n[D]!==void 0)return n[D];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+D+"'")}let re=v;if(v===n.RED&&(k===n.FLOAT&&(re=n.R32F),k===n.HALF_FLOAT&&(re=n.R16F),k===n.UNSIGNED_BYTE&&(re=n.R8)),v===n.RED_INTEGER&&(k===n.UNSIGNED_BYTE&&(re=n.R8UI),k===n.UNSIGNED_SHORT&&(re=n.R16UI),k===n.UNSIGNED_INT&&(re=n.R32UI),k===n.BYTE&&(re=n.R8I),k===n.SHORT&&(re=n.R16I),k===n.INT&&(re=n.R32I)),v===n.RG&&(k===n.FLOAT&&(re=n.RG32F),k===n.HALF_FLOAT&&(re=n.RG16F),k===n.UNSIGNED_BYTE&&(re=n.RG8)),v===n.RG_INTEGER&&(k===n.UNSIGNED_BYTE&&(re=n.RG8UI),k===n.UNSIGNED_SHORT&&(re=n.RG16UI),k===n.UNSIGNED_INT&&(re=n.RG32UI),k===n.BYTE&&(re=n.RG8I),k===n.SHORT&&(re=n.RG16I),k===n.INT&&(re=n.RG32I)),v===n.RGB_INTEGER&&(k===n.UNSIGNED_BYTE&&(re=n.RGB8UI),k===n.UNSIGNED_SHORT&&(re=n.RGB16UI),k===n.UNSIGNED_INT&&(re=n.RGB32UI),k===n.BYTE&&(re=n.RGB8I),k===n.SHORT&&(re=n.RGB16I),k===n.INT&&(re=n.RGB32I)),v===n.RGBA_INTEGER&&(k===n.UNSIGNED_BYTE&&(re=n.RGBA8UI),k===n.UNSIGNED_SHORT&&(re=n.RGBA16UI),k===n.UNSIGNED_INT&&(re=n.RGBA32UI),k===n.BYTE&&(re=n.RGBA8I),k===n.SHORT&&(re=n.RGBA16I),k===n.INT&&(re=n.RGBA32I)),v===n.RGB&&k===n.UNSIGNED_INT_5_9_9_9_REV&&(re=n.RGB9_E5),v===n.RGBA){let Ie=he?Ds:ct.getTransfer(ne);k===n.FLOAT&&(re=n.RGBA32F),k===n.HALF_FLOAT&&(re=n.RGBA16F),k===n.UNSIGNED_BYTE&&(re=Ie===Et?n.SRGB8_ALPHA8:n.RGBA8),k===n.UNSIGNED_SHORT_4_4_4_4&&(re=n.RGBA4),k===n.UNSIGNED_SHORT_5_5_5_1&&(re=n.RGB5_A1)}return(re===n.R16F||re===n.R32F||re===n.RG16F||re===n.RG32F||re===n.RGBA16F||re===n.RGBA32F)&&e.get("EXT_color_buffer_float"),re}function y(D,v){let k;return D?v===null||v===ci||v===cs?k=n.DEPTH24_STENCIL8:v===Sn?k=n.DEPTH32F_STENCIL8:v===ls&&(k=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===ci||v===cs?k=n.DEPTH_COMPONENT24:v===Sn?k=n.DEPTH_COMPONENT32F:v===ls&&(k=n.DEPTH_COMPONENT16),k}function b(D,v){return g(D)===!0||D.isFramebufferTexture&&D.minFilter!==ln&&D.minFilter!==gn?Math.log2(Math.max(v.width,v.height))+1:D.mipmaps!==void 0&&D.mipmaps.length>0?D.mipmaps.length:D.isCompressedTexture&&Array.isArray(D.image)?v.mipmaps.length:1}function R(D){let v=D.target;v.removeEventListener("dispose",R),H(v),v.isVideoTexture&&h.delete(v)}function C(D){let v=D.target;v.removeEventListener("dispose",C),x(v)}function H(D){let v=i.get(D);if(v.__webglInit===void 0)return;let k=D.source,ne=p.get(k);if(ne){let he=ne[v.__cacheKey];he.usedTimes--,he.usedTimes===0&&T(D),Object.keys(ne).length===0&&p.delete(k)}i.remove(D)}function T(D){let v=i.get(D);n.deleteTexture(v.__webglTexture);let k=D.source,ne=p.get(k);delete ne[v.__cacheKey],o.memory.textures--}function x(D){let v=i.get(D);if(D.depthTexture&&(D.depthTexture.dispose(),i.remove(D.depthTexture)),D.isWebGLCubeRenderTarget)for(let ne=0;ne<6;ne++){if(Array.isArray(v.__webglFramebuffer[ne]))for(let he=0;he<v.__webglFramebuffer[ne].length;he++)n.deleteFramebuffer(v.__webglFramebuffer[ne][he]);else n.deleteFramebuffer(v.__webglFramebuffer[ne]);v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer[ne])}else{if(Array.isArray(v.__webglFramebuffer))for(let ne=0;ne<v.__webglFramebuffer.length;ne++)n.deleteFramebuffer(v.__webglFramebuffer[ne]);else n.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&n.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&n.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let ne=0;ne<v.__webglColorRenderbuffer.length;ne++)v.__webglColorRenderbuffer[ne]&&n.deleteRenderbuffer(v.__webglColorRenderbuffer[ne]);v.__webglDepthRenderbuffer&&n.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let k=D.textures;for(let ne=0,he=k.length;ne<he;ne++){let re=i.get(k[ne]);re.__webglTexture&&(n.deleteTexture(re.__webglTexture),o.memory.textures--),i.remove(k[ne])}i.remove(D)}let I=0;function B(){I=0}function G(){let D=I;return D>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+D+" texture units while this GPU supports only "+s.maxTextures),I+=1,D}function N(D){let v=[];return v.push(D.wrapS),v.push(D.wrapT),v.push(D.wrapR||0),v.push(D.magFilter),v.push(D.minFilter),v.push(D.anisotropy),v.push(D.internalFormat),v.push(D.format),v.push(D.type),v.push(D.generateMipmaps),v.push(D.premultiplyAlpha),v.push(D.flipY),v.push(D.unpackAlignment),v.push(D.colorSpace),v.join()}function W(D,v){let k=i.get(D);if(D.isVideoTexture&&Ge(D),D.isRenderTargetTexture===!1&&D.version>0&&k.__version!==D.version){let ne=D.image;if(ne===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ne.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(k,D,v);return}}t.bindTexture(n.TEXTURE_2D,k.__webglTexture,n.TEXTURE0+v)}function z(D,v){let k=i.get(D);if(D.version>0&&k.__version!==D.version){q(k,D,v);return}t.bindTexture(n.TEXTURE_2D_ARRAY,k.__webglTexture,n.TEXTURE0+v)}function J(D,v){let k=i.get(D);if(D.version>0&&k.__version!==D.version){q(k,D,v);return}t.bindTexture(n.TEXTURE_3D,k.__webglTexture,n.TEXTURE0+v)}function U(D,v){let k=i.get(D);if(D.version>0&&k.__version!==D.version){ie(k,D,v);return}t.bindTexture(n.TEXTURE_CUBE_MAP,k.__webglTexture,n.TEXTURE0+v)}let Q={[Zr]:n.REPEAT,[ei]:n.CLAMP_TO_EDGE,[Jr]:n.MIRRORED_REPEAT},te={[ln]:n.NEAREST,[lh]:n.NEAREST_MIPMAP_NEAREST,[sr]:n.NEAREST_MIPMAP_LINEAR,[gn]:n.LINEAR,[Bo]:n.LINEAR_MIPMAP_NEAREST,[li]:n.LINEAR_MIPMAP_LINEAR},ue={[uh]:n.NEVER,[Mh]:n.ALWAYS,[fh]:n.LESS,[Dl]:n.LEQUAL,[ph]:n.EQUAL,[gh]:n.GEQUAL,[mh]:n.GREATER,[Eh]:n.NOTEQUAL};function we(D,v){if(v.type===Sn&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===gn||v.magFilter===Bo||v.magFilter===sr||v.magFilter===li||v.minFilter===gn||v.minFilter===Bo||v.minFilter===sr||v.minFilter===li)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(D,n.TEXTURE_WRAP_S,Q[v.wrapS]),n.texParameteri(D,n.TEXTURE_WRAP_T,Q[v.wrapT]),(D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY)&&n.texParameteri(D,n.TEXTURE_WRAP_R,Q[v.wrapR]),n.texParameteri(D,n.TEXTURE_MAG_FILTER,te[v.magFilter]),n.texParameteri(D,n.TEXTURE_MIN_FILTER,te[v.minFilter]),v.compareFunction&&(n.texParameteri(D,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(D,n.TEXTURE_COMPARE_FUNC,ue[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===ln||v.minFilter!==sr&&v.minFilter!==li||v.type===Sn&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||i.get(v).__currentAnisotropy){let k=e.get("EXT_texture_filter_anisotropic");n.texParameterf(D,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy}}}function Ae(D,v){let k=!1;D.__webglInit===void 0&&(D.__webglInit=!0,v.addEventListener("dispose",R));let ne=v.source,he=p.get(ne);he===void 0&&(he={},p.set(ne,he));let re=N(v);if(re!==D.__cacheKey){he[re]===void 0&&(he[re]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,k=!0),he[re].usedTimes++;let Ie=he[D.__cacheKey];Ie!==void 0&&(he[D.__cacheKey].usedTimes--,Ie.usedTimes===0&&T(v)),D.__cacheKey=re,D.__webglTexture=he[re].texture}return k}function q(D,v,k){let ne=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(ne=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(ne=n.TEXTURE_3D);let he=Ae(D,v),re=v.source;t.bindTexture(ne,D.__webglTexture,n.TEXTURE0+k);let Ie=i.get(re);if(re.version!==Ie.__version||he===!0){t.activeTexture(n.TEXTURE0+k);let Re=ct.getPrimaries(ct.workingColorSpace),Be=v.colorSpace===kn?null:ct.getPrimaries(v.colorSpace),et=v.colorSpace===kn||Re===Be?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,et);let xe=M(v.image,!1,s.maxTextureSize);xe=Ke(v,xe);let Oe=r.convert(v.format,v.colorSpace),Ye=r.convert(v.type),Te=w(v.internalFormat,Oe,Ye,v.colorSpace,v.isVideoTexture);we(ne,v);let fe,Ve=v.mipmaps,Fe=v.isVideoTexture!==!0,Ze=Ie.__version===void 0||he===!0,F=re.dataReady,pe=b(v,xe);if(v.isDepthTexture)Te=y(v.format===hs,v.type),Ze&&(Fe?t.texStorage2D(n.TEXTURE_2D,1,Te,xe.width,xe.height):t.texImage2D(n.TEXTURE_2D,0,Te,xe.width,xe.height,0,Oe,Ye,null));else if(v.isDataTexture)if(Ve.length>0){Fe&&Ze&&t.texStorage2D(n.TEXTURE_2D,pe,Te,Ve[0].width,Ve[0].height);for(let Z=0,ee=Ve.length;Z<ee;Z++)fe=Ve[Z],Fe?F&&t.texSubImage2D(n.TEXTURE_2D,Z,0,0,fe.width,fe.height,Oe,Ye,fe.data):t.texImage2D(n.TEXTURE_2D,Z,Te,fe.width,fe.height,0,Oe,Ye,fe.data);v.generateMipmaps=!1}else Fe?(Ze&&t.texStorage2D(n.TEXTURE_2D,pe,Te,xe.width,xe.height),F&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,xe.width,xe.height,Oe,Ye,xe.data)):t.texImage2D(n.TEXTURE_2D,0,Te,xe.width,xe.height,0,Oe,Ye,xe.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Fe&&Ze&&t.texStorage3D(n.TEXTURE_2D_ARRAY,pe,Te,Ve[0].width,Ve[0].height,xe.depth);for(let Z=0,ee=Ve.length;Z<ee;Z++)if(fe=Ve[Z],v.format!==dn)if(Oe!==null)if(Fe){if(F)if(v.layerUpdates.size>0){let _e=Ol(fe.width,fe.height,v.format,v.type);for(let ve of v.layerUpdates){let We=fe.data.subarray(ve*_e/fe.data.BYTES_PER_ELEMENT,(ve+1)*_e/fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Z,0,0,ve,fe.width,fe.height,1,Oe,We)}v.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Z,0,0,0,fe.width,fe.height,xe.depth,Oe,fe.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Z,Te,fe.width,fe.height,xe.depth,0,fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Fe?F&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Z,0,0,0,fe.width,fe.height,xe.depth,Oe,Ye,fe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Z,Te,fe.width,fe.height,xe.depth,0,Oe,Ye,fe.data)}else{Fe&&Ze&&t.texStorage2D(n.TEXTURE_2D,pe,Te,Ve[0].width,Ve[0].height);for(let Z=0,ee=Ve.length;Z<ee;Z++)fe=Ve[Z],v.format!==dn?Oe!==null?Fe?F&&t.compressedTexSubImage2D(n.TEXTURE_2D,Z,0,0,fe.width,fe.height,Oe,fe.data):t.compressedTexImage2D(n.TEXTURE_2D,Z,Te,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Fe?F&&t.texSubImage2D(n.TEXTURE_2D,Z,0,0,fe.width,fe.height,Oe,Ye,fe.data):t.texImage2D(n.TEXTURE_2D,Z,Te,fe.width,fe.height,0,Oe,Ye,fe.data)}else if(v.isDataArrayTexture)if(Fe){if(Ze&&t.texStorage3D(n.TEXTURE_2D_ARRAY,pe,Te,xe.width,xe.height,xe.depth),F)if(v.layerUpdates.size>0){let Z=Ol(xe.width,xe.height,v.format,v.type);for(let ee of v.layerUpdates){let _e=xe.data.subarray(ee*Z/xe.data.BYTES_PER_ELEMENT,(ee+1)*Z/xe.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ee,xe.width,xe.height,1,Oe,Ye,_e)}v.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,xe.width,xe.height,xe.depth,Oe,Ye,xe.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Te,xe.width,xe.height,xe.depth,0,Oe,Ye,xe.data);else if(v.isData3DTexture)Fe?(Ze&&t.texStorage3D(n.TEXTURE_3D,pe,Te,xe.width,xe.height,xe.depth),F&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,xe.width,xe.height,xe.depth,Oe,Ye,xe.data)):t.texImage3D(n.TEXTURE_3D,0,Te,xe.width,xe.height,xe.depth,0,Oe,Ye,xe.data);else if(v.isFramebufferTexture){if(Ze)if(Fe)t.texStorage2D(n.TEXTURE_2D,pe,Te,xe.width,xe.height);else{let Z=xe.width,ee=xe.height;for(let _e=0;_e<pe;_e++)t.texImage2D(n.TEXTURE_2D,_e,Te,Z,ee,0,Oe,Ye,null),Z>>=1,ee>>=1}}else if(Ve.length>0){if(Fe&&Ze){let Z=Ue(Ve[0]);t.texStorage2D(n.TEXTURE_2D,pe,Te,Z.width,Z.height)}for(let Z=0,ee=Ve.length;Z<ee;Z++)fe=Ve[Z],Fe?F&&t.texSubImage2D(n.TEXTURE_2D,Z,0,0,Oe,Ye,fe):t.texImage2D(n.TEXTURE_2D,Z,Te,Oe,Ye,fe);v.generateMipmaps=!1}else if(Fe){if(Ze){let Z=Ue(xe);t.texStorage2D(n.TEXTURE_2D,pe,Te,Z.width,Z.height)}F&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Oe,Ye,xe)}else t.texImage2D(n.TEXTURE_2D,0,Te,Oe,Ye,xe);g(v)&&f(ne),Ie.__version=re.version,v.onUpdate&&v.onUpdate(v)}D.__version=v.version}function ie(D,v,k){if(v.image.length!==6)return;let ne=Ae(D,v),he=v.source;t.bindTexture(n.TEXTURE_CUBE_MAP,D.__webglTexture,n.TEXTURE0+k);let re=i.get(he);if(he.version!==re.__version||ne===!0){t.activeTexture(n.TEXTURE0+k);let Ie=ct.getPrimaries(ct.workingColorSpace),Re=v.colorSpace===kn?null:ct.getPrimaries(v.colorSpace),Be=v.colorSpace===kn||Ie===Re?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Be);let et=v.isCompressedTexture||v.image[0].isCompressedTexture,xe=v.image[0]&&v.image[0].isDataTexture,Oe=[];for(let ee=0;ee<6;ee++)!et&&!xe?Oe[ee]=M(v.image[ee],!0,s.maxCubemapSize):Oe[ee]=xe?v.image[ee].image:v.image[ee],Oe[ee]=Ke(v,Oe[ee]);let Ye=Oe[0],Te=r.convert(v.format,v.colorSpace),fe=r.convert(v.type),Ve=w(v.internalFormat,Te,fe,v.colorSpace),Fe=v.isVideoTexture!==!0,Ze=re.__version===void 0||ne===!0,F=he.dataReady,pe=b(v,Ye);we(n.TEXTURE_CUBE_MAP,v);let Z;if(et){Fe&&Ze&&t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Ve,Ye.width,Ye.height);for(let ee=0;ee<6;ee++){Z=Oe[ee].mipmaps;for(let _e=0;_e<Z.length;_e++){let ve=Z[_e];v.format!==dn?Te!==null?Fe?F&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e,0,0,ve.width,ve.height,Te,ve.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e,Ve,ve.width,ve.height,0,ve.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Fe?F&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e,0,0,ve.width,ve.height,Te,fe,ve.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e,Ve,ve.width,ve.height,0,Te,fe,ve.data)}}}else{if(Z=v.mipmaps,Fe&&Ze){Z.length>0&&pe++;let ee=Ue(Oe[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,pe,Ve,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(xe){Fe?F&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Oe[ee].width,Oe[ee].height,Te,fe,Oe[ee].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Ve,Oe[ee].width,Oe[ee].height,0,Te,fe,Oe[ee].data);for(let _e=0;_e<Z.length;_e++){let We=Z[_e].image[ee].image;Fe?F&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e+1,0,0,We.width,We.height,Te,fe,We.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e+1,Ve,We.width,We.height,0,Te,fe,We.data)}}else{Fe?F&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Te,fe,Oe[ee]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Ve,Te,fe,Oe[ee]);for(let _e=0;_e<Z.length;_e++){let ve=Z[_e];Fe?F&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e+1,0,0,Te,fe,ve.image[ee]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ee,_e+1,Ve,Te,fe,ve.image[ee])}}}g(v)&&f(n.TEXTURE_CUBE_MAP),re.__version=he.version,v.onUpdate&&v.onUpdate(v)}D.__version=v.version}function Ee(D,v,k,ne,he,re){let Ie=r.convert(k.format,k.colorSpace),Re=r.convert(k.type),Be=w(k.internalFormat,Ie,Re,k.colorSpace),et=i.get(v),xe=i.get(k);if(xe.__renderTarget=v,!et.__hasExternalTextures){let Oe=Math.max(1,v.width>>re),Ye=Math.max(1,v.height>>re);he===n.TEXTURE_3D||he===n.TEXTURE_2D_ARRAY?t.texImage3D(he,re,Be,Oe,Ye,v.depth,0,Ie,Re,null):t.texImage2D(he,re,Be,Oe,Ye,0,Ie,Re,null)}t.bindFramebuffer(n.FRAMEBUFFER,D),He(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ne,he,xe.__webglTexture,0,ae(v)):(he===n.TEXTURE_2D||he>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&he<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,ne,he,xe.__webglTexture,re),t.bindFramebuffer(n.FRAMEBUFFER,null)}function me(D,v,k){if(n.bindRenderbuffer(n.RENDERBUFFER,D),v.depthBuffer){let ne=v.depthTexture,he=ne&&ne.isDepthTexture?ne.type:null,re=y(v.stencilBuffer,he),Ie=v.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Re=ae(v);He(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Re,re,v.width,v.height):k?n.renderbufferStorageMultisample(n.RENDERBUFFER,Re,re,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,re,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ie,n.RENDERBUFFER,D)}else{let ne=v.textures;for(let he=0;he<ne.length;he++){let re=ne[he],Ie=r.convert(re.format,re.colorSpace),Re=r.convert(re.type),Be=w(re.internalFormat,Ie,Re,re.colorSpace),et=ae(v);k&&He(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,et,Be,v.width,v.height):He(v)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,et,Be,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,Be,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function oe(D,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,D),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let ne=i.get(v.depthTexture);ne.__renderTarget=v,(!ne.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),W(v.depthTexture,0);let he=ne.__webglTexture,re=ae(v);if(v.depthTexture.format===Ki)He(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,he,0,re):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,he,0);else if(v.depthTexture.format===hs)He(v)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,he,0,re):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,he,0);else throw new Error("Unknown depthTexture format")}function Ce(D){let v=i.get(D),k=D.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==D.depthTexture){let ne=D.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),ne){let he=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,ne.removeEventListener("dispose",he)};ne.addEventListener("dispose",he),v.__depthDisposeCallback=he}v.__boundDepthTexture=ne}if(D.depthTexture&&!v.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");oe(v.__webglFramebuffer,D)}else if(k){v.__webglDepthbuffer=[];for(let ne=0;ne<6;ne++)if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[ne]),v.__webglDepthbuffer[ne]===void 0)v.__webglDepthbuffer[ne]=n.createRenderbuffer(),me(v.__webglDepthbuffer[ne],D,!1);else{let he=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,re=v.__webglDepthbuffer[ne];n.bindRenderbuffer(n.RENDERBUFFER,re),n.framebufferRenderbuffer(n.FRAMEBUFFER,he,n.RENDERBUFFER,re)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=n.createRenderbuffer(),me(v.__webglDepthbuffer,D,!1);else{let ne=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,he=v.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,he),n.framebufferRenderbuffer(n.FRAMEBUFFER,ne,n.RENDERBUFFER,he)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function $(D,v,k){let ne=i.get(D);v!==void 0&&Ee(ne.__webglFramebuffer,D,D.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),k!==void 0&&Ce(D)}function Me(D){let v=D.texture,k=i.get(D),ne=i.get(v);D.addEventListener("dispose",C);let he=D.textures,re=D.isWebGLCubeRenderTarget===!0,Ie=he.length>1;if(Ie||(ne.__webglTexture===void 0&&(ne.__webglTexture=n.createTexture()),ne.__version=v.version,o.memory.textures++),re){k.__webglFramebuffer=[];for(let Re=0;Re<6;Re++)if(v.mipmaps&&v.mipmaps.length>0){k.__webglFramebuffer[Re]=[];for(let Be=0;Be<v.mipmaps.length;Be++)k.__webglFramebuffer[Re][Be]=n.createFramebuffer()}else k.__webglFramebuffer[Re]=n.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){k.__webglFramebuffer=[];for(let Re=0;Re<v.mipmaps.length;Re++)k.__webglFramebuffer[Re]=n.createFramebuffer()}else k.__webglFramebuffer=n.createFramebuffer();if(Ie)for(let Re=0,Be=he.length;Re<Be;Re++){let et=i.get(he[Re]);et.__webglTexture===void 0&&(et.__webglTexture=n.createTexture(),o.memory.textures++)}if(D.samples>0&&He(D)===!1){k.__webglMultisampledFramebuffer=n.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let Re=0;Re<he.length;Re++){let Be=he[Re];k.__webglColorRenderbuffer[Re]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,k.__webglColorRenderbuffer[Re]);let et=r.convert(Be.format,Be.colorSpace),xe=r.convert(Be.type),Oe=w(Be.internalFormat,et,xe,Be.colorSpace,D.isXRRenderTarget===!0),Ye=ae(D);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ye,Oe,D.width,D.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Re,n.RENDERBUFFER,k.__webglColorRenderbuffer[Re])}n.bindRenderbuffer(n.RENDERBUFFER,null),D.depthBuffer&&(k.__webglDepthRenderbuffer=n.createRenderbuffer(),me(k.__webglDepthRenderbuffer,D,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(re){t.bindTexture(n.TEXTURE_CUBE_MAP,ne.__webglTexture),we(n.TEXTURE_CUBE_MAP,v);for(let Re=0;Re<6;Re++)if(v.mipmaps&&v.mipmaps.length>0)for(let Be=0;Be<v.mipmaps.length;Be++)Ee(k.__webglFramebuffer[Re][Be],D,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Re,Be);else Ee(k.__webglFramebuffer[Re],D,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Re,0);g(v)&&f(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ie){for(let Re=0,Be=he.length;Re<Be;Re++){let et=he[Re],xe=i.get(et);t.bindTexture(n.TEXTURE_2D,xe.__webglTexture),we(n.TEXTURE_2D,et),Ee(k.__webglFramebuffer,D,et,n.COLOR_ATTACHMENT0+Re,n.TEXTURE_2D,0),g(et)&&f(n.TEXTURE_2D)}t.unbindTexture()}else{let Re=n.TEXTURE_2D;if((D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(Re=D.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Re,ne.__webglTexture),we(Re,v),v.mipmaps&&v.mipmaps.length>0)for(let Be=0;Be<v.mipmaps.length;Be++)Ee(k.__webglFramebuffer[Be],D,v,n.COLOR_ATTACHMENT0,Re,Be);else Ee(k.__webglFramebuffer,D,v,n.COLOR_ATTACHMENT0,Re,0);g(v)&&f(Re),t.unbindTexture()}D.depthBuffer&&Ce(D)}function ge(D){let v=D.textures;for(let k=0,ne=v.length;k<ne;k++){let he=v[k];if(g(he)){let re=_(D),Ie=i.get(he).__webglTexture;t.bindTexture(re,Ie),f(re),t.unbindTexture()}}}let ye=[],S=[];function ce(D){if(D.samples>0){if(He(D)===!1){let v=D.textures,k=D.width,ne=D.height,he=n.COLOR_BUFFER_BIT,re=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ie=i.get(D),Re=v.length>1;if(Re)for(let Be=0;Be<v.length;Be++)t.bindFramebuffer(n.FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ie.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ie.__webglFramebuffer);for(let Be=0;Be<v.length;Be++){if(D.resolveDepthBuffer&&(D.depthBuffer&&(he|=n.DEPTH_BUFFER_BIT),D.stencilBuffer&&D.resolveStencilBuffer&&(he|=n.STENCIL_BUFFER_BIT)),Re){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ie.__webglColorRenderbuffer[Be]);let et=i.get(v[Be]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,et,0)}n.blitFramebuffer(0,0,k,ne,0,0,k,ne,he,n.NEAREST),l===!0&&(ye.length=0,S.length=0,ye.push(n.COLOR_ATTACHMENT0+Be),D.depthBuffer&&D.resolveDepthBuffer===!1&&(ye.push(re),S.push(re),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,S)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ye))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Re)for(let Be=0;Be<v.length;Be++){t.bindFramebuffer(n.FRAMEBUFFER,Ie.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.RENDERBUFFER,Ie.__webglColorRenderbuffer[Be]);let et=i.get(v[Be]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ie.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Be,n.TEXTURE_2D,et,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ie.__webglMultisampledFramebuffer)}else if(D.depthBuffer&&D.resolveDepthBuffer===!1&&l){let v=D.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[v])}}}function ae(D){return Math.min(s.maxSamples,D.samples)}function He(D){let v=i.get(D);return D.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Ge(D){let v=o.render.frame;h.get(D)!==v&&(h.set(D,v),D.update())}function Ke(D,v){let k=D.colorSpace,ne=D.format,he=D.type;return D.isCompressedTexture===!0||D.isVideoTexture===!0||k!==_i&&k!==kn&&(ct.getTransfer(k)===Et?(ne!==dn||he!==vn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),v}function Ue(D){return typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement?(c.width=D.naturalWidth||D.width,c.height=D.naturalHeight||D.height):typeof VideoFrame<"u"&&D instanceof VideoFrame?(c.width=D.displayWidth,c.height=D.displayHeight):(c.width=D.width,c.height=D.height),c}this.allocateTextureUnit=G,this.resetTextureUnits=B,this.setTexture2D=W,this.setTexture2DArray=z,this.setTexture3D=J,this.setTextureCube=U,this.rebindTextures=$,this.setupRenderTarget=Me,this.updateRenderTargetMipmap=ge,this.updateMultisampleRenderTarget=ce,this.setupDepthRenderbuffer=Ce,this.setupFrameBufferTexture=Ee,this.useMultisampledRTT=He}function Bm(n,e){function t(i,s=kn){let r,o=ct.getTransfer(s);if(i===vn)return n.UNSIGNED_BYTE;if(i===Uo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Fo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===vl)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===wl)return n.BYTE;if(i===Tl)return n.SHORT;if(i===ls)return n.UNSIGNED_SHORT;if(i===Go)return n.INT;if(i===ci)return n.UNSIGNED_INT;if(i===Sn)return n.FLOAT;if(i===hi)return n.HALF_FLOAT;if(i===Sl)return n.ALPHA;if(i===bl)return n.RGB;if(i===dn)return n.RGBA;if(i===Rl)return n.LUMINANCE;if(i===Al)return n.LUMINANCE_ALPHA;if(i===Ki)return n.DEPTH_COMPONENT;if(i===hs)return n.DEPTH_STENCIL;if(i===Cl)return n.RED;if(i===No)return n.RED_INTEGER;if(i===Hl)return n.RG;if(i===Oo)return n.RG_INTEGER;if(i===ko)return n.RGBA_INTEGER;if(i===rr||i===or||i===ar||i===lr)if(o===Et)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===rr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===or)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ar)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===rr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===or)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ar)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===lr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===zo||i===Vo||i===Wo||i===Xo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===zo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Vo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Wo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Xo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Yo||i===qo||i===Zo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Yo||i===qo)return o===Et?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Zo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Jo||i===Ko||i===$o||i===Qo||i===jo||i===ea||i===ta||i===na||i===ia||i===sa||i===ra||i===oa||i===aa||i===la)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===Jo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Ko)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===$o)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Qo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===jo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ea)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===ta)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===na)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ia)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===sa)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ra)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===oa)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===aa)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===la)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===cr||i===ca||i===ha)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===cr)return o===Et?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ca)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ha)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Pl||i===da||i===ua||i===fa)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===cr)return r.COMPRESSED_RED_RGTC1_EXT;if(i===da)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ua)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===fa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===cs?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var Gm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Um=`
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

}`,jl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let s=new Vt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==i.depthNear||t.depthFar!==i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Gt({vertexShader:Gm,fragmentShader:Um,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new E(new nt(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ec=class extends Fn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,d=null,p=null,u=null,m=null,M=new jl,g=t.getContextAttributes(),f=null,_=null,w=[],y=[],b=new be,R=null,C=new At;C.viewport=new dt;let H=new At;H.viewport=new dt;let T=[C,H],x=new To,I=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let ie=w[q];return ie===void 0&&(ie=new es,w[q]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function(q){let ie=w[q];return ie===void 0&&(ie=new es,w[q]=ie),ie.getGripSpace()},this.getHand=function(q){let ie=w[q];return ie===void 0&&(ie=new es,w[q]=ie),ie.getHandSpace()};function G(q){let ie=y.indexOf(q.inputSource);if(ie===-1)return;let Ee=w[ie];Ee!==void 0&&(Ee.update(q.inputSource,q.frame,c||o),Ee.dispatchEvent({type:q.type,data:q.inputSource}))}function N(){s.removeEventListener("select",G),s.removeEventListener("selectstart",G),s.removeEventListener("selectend",G),s.removeEventListener("squeeze",G),s.removeEventListener("squeezestart",G),s.removeEventListener("squeezeend",G),s.removeEventListener("end",N),s.removeEventListener("inputsourceschange",W);for(let q=0;q<w.length;q++){let ie=y[q];ie!==null&&(y[q]=null,w[q].disconnect(ie))}I=null,B=null,M.reset(),e.setRenderTarget(f),u=null,p=null,d=null,s=null,_=null,Ae.stop(),i.isPresenting=!1,e.setPixelRatio(R),e.setSize(b.width,b.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return p!==null?p:u},this.getBinding=function(){return d},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",G),s.addEventListener("selectstart",G),s.addEventListener("selectend",G),s.addEventListener("squeeze",G),s.addEventListener("squeezestart",G),s.addEventListener("squeezeend",G),s.addEventListener("end",N),s.addEventListener("inputsourceschange",W),g.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(b),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ee=null,me=null,oe=null;g.depth&&(oe=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Ee=g.stencil?hs:Ki,me=g.stencil?cs:ci);let Ce={colorFormat:t.RGBA8,depthFormat:oe,scaleFactor:r};d=new XRWebGLBinding(s,t),p=d.createProjectionLayer(Ce),s.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,!1),_=new cn(p.textureWidth,p.textureHeight,{format:dn,type:vn,depthTexture:new Xs(p.textureWidth,p.textureHeight,me,void 0,void 0,void 0,void 0,void 0,void 0,Ee),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}else{let Ee={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};u=new XRWebGLLayer(s,t,Ee),s.updateRenderState({baseLayer:u}),e.setPixelRatio(1),e.setSize(u.framebufferWidth,u.framebufferHeight,!1),_=new cn(u.framebufferWidth,u.framebufferHeight,{format:dn,type:vn,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),Ae.setContext(s),Ae.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function W(q){for(let ie=0;ie<q.removed.length;ie++){let Ee=q.removed[ie],me=y.indexOf(Ee);me>=0&&(y[me]=null,w[me].disconnect(Ee))}for(let ie=0;ie<q.added.length;ie++){let Ee=q.added[ie],me=y.indexOf(Ee);if(me===-1){for(let Ce=0;Ce<w.length;Ce++)if(Ce>=y.length){y.push(Ee),me=Ce;break}else if(y[Ce]===null){y[Ce]=Ee,me=Ce;break}if(me===-1)break}let oe=w[me];oe&&oe.connect(Ee)}}let z=new L,J=new L;function U(q,ie,Ee){z.setFromMatrixPosition(ie.matrixWorld),J.setFromMatrixPosition(Ee.matrixWorld);let me=z.distanceTo(J),oe=ie.projectionMatrix.elements,Ce=Ee.projectionMatrix.elements,$=oe[14]/(oe[10]-1),Me=oe[14]/(oe[10]+1),ge=(oe[9]+1)/oe[5],ye=(oe[9]-1)/oe[5],S=(oe[8]-1)/oe[0],ce=(Ce[8]+1)/Ce[0],ae=$*S,He=$*ce,Ge=me/(-S+ce),Ke=Ge*-S;if(ie.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Ke),q.translateZ(Ge),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),oe[10]===-1)q.projectionMatrix.copy(ie.projectionMatrix),q.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let Ue=$+Ge,D=Me+Ge,v=ae-Ke,k=He+(me-Ke),ne=ge*Me/D*Ue,he=ye*Me/D*Ue;q.projectionMatrix.makePerspective(v,k,ne,he,Ue,D),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function Q(q,ie){ie===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(ie.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let ie=q.near,Ee=q.far;M.texture!==null&&(M.depthNear>0&&(ie=M.depthNear),M.depthFar>0&&(Ee=M.depthFar)),x.near=H.near=C.near=ie,x.far=H.far=C.far=Ee,(I!==x.near||B!==x.far)&&(s.updateRenderState({depthNear:x.near,depthFar:x.far}),I=x.near,B=x.far),C.layers.mask=q.layers.mask|2,H.layers.mask=q.layers.mask|4,x.layers.mask=C.layers.mask|H.layers.mask;let me=q.parent,oe=x.cameras;Q(x,me);for(let Ce=0;Ce<oe.length;Ce++)Q(oe[Ce],me);oe.length===2?U(x,C,H):x.projectionMatrix.copy(C.projectionMatrix),te(q,x,me)};function te(q,ie,Ee){Ee===null?q.matrix.copy(ie.matrixWorld):(q.matrix.copy(Ee.matrixWorld),q.matrix.invert(),q.matrix.multiply(ie.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(ie.projectionMatrix),q.projectionMatrixInverse.copy(ie.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Bs*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(p===null&&u===null))return l},this.setFoveation=function(q){l=q,p!==null&&(p.fixedFoveation=q),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=q)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh(x)};let ue=null;function we(q,ie){if(h=ie.getViewerPose(c||o),m=ie,h!==null){let Ee=h.views;u!==null&&(e.setRenderTargetFramebuffer(_,u.framebuffer),e.setRenderTarget(_));let me=!1;Ee.length!==x.cameras.length&&(x.cameras.length=0,me=!0);for(let $=0;$<Ee.length;$++){let Me=Ee[$],ge=null;if(u!==null)ge=u.getViewport(Me);else{let S=d.getViewSubImage(p,Me);ge=S.viewport,$===0&&(e.setRenderTargetTextures(_,S.colorTexture,S.depthStencilTexture),e.setRenderTarget(_))}let ye=T[$];ye===void 0&&(ye=new At,ye.layers.enable($),ye.viewport=new dt,T[$]=ye),ye.matrix.fromArray(Me.transform.matrix),ye.matrix.decompose(ye.position,ye.quaternion,ye.scale),ye.projectionMatrix.fromArray(Me.projectionMatrix),ye.projectionMatrixInverse.copy(ye.projectionMatrix).invert(),ye.viewport.set(ge.x,ge.y,ge.width,ge.height),$===0&&(x.matrix.copy(ye.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),me===!0&&x.cameras.push(ye)}let oe=s.enabledFeatures;if(oe&&oe.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&d){let $=d.getDepthInformation(Ee[0]);$&&$.isValid&&$.texture&&M.init(e,$,s.renderState)}}for(let Ee=0;Ee<w.length;Ee++){let me=y[Ee],oe=w[Ee];me!==null&&oe!==void 0&&oe.update(me,ie,c||o)}ue&&ue(q,ie),ie.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ie}),m=null}let Ae=new Zh;Ae.setAnimationLoop(we),this.setAnimationLoop=function(q){ue=q},this.dispose=function(){}}},Ii=new Wt,Fm=new ut;function Nm(n,e){function t(g,f){g.matrixAutoUpdate===!0&&g.updateMatrix(),f.value.copy(g.matrix)}function i(g,f){f.color.getRGB(g.fogColor.value,Gl(n)),f.isFog?(g.fogNear.value=f.near,g.fogFar.value=f.far):f.isFogExp2&&(g.fogDensity.value=f.density)}function s(g,f,_,w,y){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(g,f):f.isMeshToonMaterial?(r(g,f),d(g,f)):f.isMeshPhongMaterial?(r(g,f),h(g,f)):f.isMeshStandardMaterial?(r(g,f),p(g,f),f.isMeshPhysicalMaterial&&u(g,f,y)):f.isMeshMatcapMaterial?(r(g,f),m(g,f)):f.isMeshDepthMaterial?r(g,f):f.isMeshDistanceMaterial?(r(g,f),M(g,f)):f.isMeshNormalMaterial?r(g,f):f.isLineBasicMaterial?(o(g,f),f.isLineDashedMaterial&&a(g,f)):f.isPointsMaterial?l(g,f,_,w):f.isSpriteMaterial?c(g,f):f.isShadowMaterial?(g.color.value.copy(f.color),g.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(g,f){g.opacity.value=f.opacity,f.color&&g.diffuse.value.copy(f.color),f.emissive&&g.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(g.map.value=f.map,t(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,t(f.alphaMap,g.alphaMapTransform)),f.bumpMap&&(g.bumpMap.value=f.bumpMap,t(f.bumpMap,g.bumpMapTransform),g.bumpScale.value=f.bumpScale,f.side===Ut&&(g.bumpScale.value*=-1)),f.normalMap&&(g.normalMap.value=f.normalMap,t(f.normalMap,g.normalMapTransform),g.normalScale.value.copy(f.normalScale),f.side===Ut&&g.normalScale.value.negate()),f.displacementMap&&(g.displacementMap.value=f.displacementMap,t(f.displacementMap,g.displacementMapTransform),g.displacementScale.value=f.displacementScale,g.displacementBias.value=f.displacementBias),f.emissiveMap&&(g.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,g.emissiveMapTransform)),f.specularMap&&(g.specularMap.value=f.specularMap,t(f.specularMap,g.specularMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest);let _=e.get(f),w=_.envMap,y=_.envMapRotation;w&&(g.envMap.value=w,Ii.copy(y),Ii.x*=-1,Ii.y*=-1,Ii.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Ii.y*=-1,Ii.z*=-1),g.envMapRotation.value.setFromMatrix4(Fm.makeRotationFromEuler(Ii)),g.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=f.reflectivity,g.ior.value=f.ior,g.refractionRatio.value=f.refractionRatio),f.lightMap&&(g.lightMap.value=f.lightMap,g.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,g.lightMapTransform)),f.aoMap&&(g.aoMap.value=f.aoMap,g.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,g.aoMapTransform))}function o(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,f.map&&(g.map.value=f.map,t(f.map,g.mapTransform))}function a(g,f){g.dashSize.value=f.dashSize,g.totalSize.value=f.dashSize+f.gapSize,g.scale.value=f.scale}function l(g,f,_,w){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.size.value=f.size*_,g.scale.value=w*.5,f.map&&(g.map.value=f.map,t(f.map,g.uvTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,t(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function c(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.rotation.value=f.rotation,f.map&&(g.map.value=f.map,t(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,t(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function h(g,f){g.specular.value.copy(f.specular),g.shininess.value=Math.max(f.shininess,1e-4)}function d(g,f){f.gradientMap&&(g.gradientMap.value=f.gradientMap)}function p(g,f){g.metalness.value=f.metalness,f.metalnessMap&&(g.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,g.metalnessMapTransform)),g.roughness.value=f.roughness,f.roughnessMap&&(g.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,g.roughnessMapTransform)),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)}function u(g,f,_){g.ior.value=f.ior,f.sheen>0&&(g.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),g.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(g.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,g.sheenColorMapTransform)),f.sheenRoughnessMap&&(g.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,g.sheenRoughnessMapTransform))),f.clearcoat>0&&(g.clearcoat.value=f.clearcoat,g.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(g.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,g.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(g.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Ut&&g.clearcoatNormalScale.value.negate())),f.dispersion>0&&(g.dispersion.value=f.dispersion),f.iridescence>0&&(g.iridescence.value=f.iridescence,g.iridescenceIOR.value=f.iridescenceIOR,g.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(g.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,g.iridescenceMapTransform)),f.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),f.transmission>0&&(g.transmission.value=f.transmission,g.transmissionSamplerMap.value=_.texture,g.transmissionSamplerSize.value.set(_.width,_.height),f.transmissionMap&&(g.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,g.transmissionMapTransform)),g.thickness.value=f.thickness,f.thicknessMap&&(g.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=f.attenuationDistance,g.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(g.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(g.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=f.specularIntensity,g.specularColor.value.copy(f.specularColor),f.specularColorMap&&(g.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,g.specularColorMapTransform)),f.specularIntensityMap&&(g.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,f){f.matcap&&(g.matcap.value=f.matcap)}function M(g,f){let _=e.get(f).light;g.referencePosition.value.setFromMatrixPosition(_.matrixWorld),g.nearDistance.value=_.shadow.camera.near,g.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function Om(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,w){let y=w.program;i.uniformBlockBinding(_,y)}function c(_,w){let y=s[_.id];y===void 0&&(m(_),y=h(_),s[_.id]=y,_.addEventListener("dispose",g));let b=w.program;i.updateUBOMapping(_,b);let R=e.render.frame;r[_.id]!==R&&(p(_),r[_.id]=R)}function h(_){let w=d();_.__bindingPointIndex=w;let y=n.createBuffer(),b=_.__size,R=_.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,b,R),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,w,y),y}function d(){for(let _=0;_<a;_++)if(o.indexOf(_)===-1)return o.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(_){let w=s[_.id],y=_.uniforms,b=_.__cache;n.bindBuffer(n.UNIFORM_BUFFER,w);for(let R=0,C=y.length;R<C;R++){let H=Array.isArray(y[R])?y[R]:[y[R]];for(let T=0,x=H.length;T<x;T++){let I=H[T];if(u(I,R,T,b)===!0){let B=I.__offset,G=Array.isArray(I.value)?I.value:[I.value],N=0;for(let W=0;W<G.length;W++){let z=G[W],J=M(z);typeof z=="number"||typeof z=="boolean"?(I.__data[0]=z,n.bufferSubData(n.UNIFORM_BUFFER,B+N,I.__data)):z.isMatrix3?(I.__data[0]=z.elements[0],I.__data[1]=z.elements[1],I.__data[2]=z.elements[2],I.__data[3]=0,I.__data[4]=z.elements[3],I.__data[5]=z.elements[4],I.__data[6]=z.elements[5],I.__data[7]=0,I.__data[8]=z.elements[6],I.__data[9]=z.elements[7],I.__data[10]=z.elements[8],I.__data[11]=0):(z.toArray(I.__data,N),N+=J.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,B,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function u(_,w,y,b){let R=_.value,C=w+"_"+y;if(b[C]===void 0)return typeof R=="number"||typeof R=="boolean"?b[C]=R:b[C]=R.clone(),!0;{let H=b[C];if(typeof R=="number"||typeof R=="boolean"){if(H!==R)return b[C]=R,!0}else if(H.equals(R)===!1)return H.copy(R),!0}return!1}function m(_){let w=_.uniforms,y=0,b=16;for(let C=0,H=w.length;C<H;C++){let T=Array.isArray(w[C])?w[C]:[w[C]];for(let x=0,I=T.length;x<I;x++){let B=T[x],G=Array.isArray(B.value)?B.value:[B.value];for(let N=0,W=G.length;N<W;N++){let z=G[N],J=M(z),U=y%b,Q=U%J.boundary,te=U+Q;y+=Q,te!==0&&b-te<J.storage&&(y+=b-te),B.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=y,y+=J.storage}}}let R=y%b;return R>0&&(y+=b-R),_.__size=y,_.__cache={},this}function M(_){let w={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(w.boundary=4,w.storage=4):_.isVector2?(w.boundary=8,w.storage=8):_.isVector3||_.isColor?(w.boundary=16,w.storage=12):_.isVector4?(w.boundary=16,w.storage=16):_.isMatrix3?(w.boundary=48,w.storage=48):_.isMatrix4?(w.boundary=64,w.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),w}function g(_){let w=_.target;w.removeEventListener("dispose",g);let y=o.indexOf(w.__bindingPointIndex);o.splice(y,1),n.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function f(){for(let _ in s)n.deleteBuffer(s[_]);o=[],s={},r={}}return{bind:l,update:c,dispose:f}}var ya=class{constructor(e={}){let{canvas:t=yh(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:p=!1}=e;this.isWebGLRenderer=!0;let u;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=i.getContextAttributes().alpha}else u=o;let m=new Uint32Array(4),M=new Int32Array(4),g=null,f=null,_=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=On,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let y=this,b=!1;this._outputColorSpace=Lt;let R=0,C=0,H=null,T=-1,x=null,I=new dt,B=new dt,G=null,N=new Pe(0),W=0,z=t.width,J=t.height,U=1,Q=null,te=null,ue=new dt(0,0,z,J),we=new dt(0,0,z,J),Ae=!1,q=new ts,ie=!1,Ee=!1,me=new ut,oe=new ut,Ce=new L,$=new dt,Me={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ge=!1;function ye(){return H===null?U:1}let S=i;function ce(A,V){return t.getContext(A,V)}try{let A={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"175"}`),t.addEventListener("webglcontextlost",ee,!1),t.addEventListener("webglcontextrestored",_e,!1),t.addEventListener("webglcontextcreationerror",ve,!1),S===null){let V="webgl2";if(S=ce(V,A),S===null)throw ce(V)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let ae,He,Ge,Ke,Ue,D,v,k,ne,he,re,Ie,Re,Be,et,xe,Oe,Ye,Te,fe,Ve,Fe,Ze,F;function pe(){ae=new s0(S),ae.init(),Fe=new Bm(S,ae),He=new $p(S,ae,e,Fe),Ge=new Dm(S,ae),He.reverseDepthBuffer&&p&&Ge.buffers.depth.setReversed(!0),Ke=new a0(S),Ue=new xm,D=new Lm(S,ae,Ge,Ue,He,Fe,Ke),v=new jp(y),k=new i0(y),ne=new uu(S),Ze=new Jp(S,ne),he=new r0(S,ne,Ke,Ze),re=new c0(S,he,ne,Ke),Te=new l0(S,He,D),xe=new Qp(Ue),Ie=new ym(y,v,k,ae,He,Ze,xe),Re=new Nm(y,Ue),Be=new wm,et=new Am(ae),Ye=new Zp(y,v,k,Ge,re,u,l),Oe=new Pm(y,re,He),F=new Om(S,Ke,He,Ge),fe=new Kp(S,ae,Ke),Ve=new o0(S,ae,Ke),Ke.programs=Ie.programs,y.capabilities=He,y.extensions=ae,y.properties=Ue,y.renderLists=Be,y.shadowMap=Oe,y.state=Ge,y.info=Ke}pe();let Z=new ec(y,S);this.xr=Z,this.getContext=function(){return S},this.getContextAttributes=function(){return S.getContextAttributes()},this.forceContextLoss=function(){let A=ae.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){let A=ae.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return U},this.setPixelRatio=function(A){A!==void 0&&(U=A,this.setSize(z,J,!1))},this.getSize=function(A){return A.set(z,J)},this.setSize=function(A,V,K=!0){if(Z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=A,J=V,t.width=Math.floor(A*U),t.height=Math.floor(V*U),K===!0&&(t.style.width=A+"px",t.style.height=V+"px"),this.setViewport(0,0,A,V)},this.getDrawingBufferSize=function(A){return A.set(z*U,J*U).floor()},this.setDrawingBufferSize=function(A,V,K){z=A,J=V,U=K,t.width=Math.floor(A*K),t.height=Math.floor(V*K),this.setViewport(0,0,A,V)},this.getCurrentViewport=function(A){return A.copy(I)},this.getViewport=function(A){return A.copy(ue)},this.setViewport=function(A,V,K,Y){A.isVector4?ue.set(A.x,A.y,A.z,A.w):ue.set(A,V,K,Y),Ge.viewport(I.copy(ue).multiplyScalar(U).round())},this.getScissor=function(A){return A.copy(we)},this.setScissor=function(A,V,K,Y){A.isVector4?we.set(A.x,A.y,A.z,A.w):we.set(A,V,K,Y),Ge.scissor(B.copy(we).multiplyScalar(U).round())},this.getScissorTest=function(){return Ae},this.setScissorTest=function(A){Ge.setScissorTest(Ae=A)},this.setOpaqueSort=function(A){Q=A},this.setTransparentSort=function(A){te=A},this.getClearColor=function(A){return A.copy(Ye.getClearColor())},this.setClearColor=function(){Ye.setClearColor(...arguments)},this.getClearAlpha=function(){return Ye.getClearAlpha()},this.setClearAlpha=function(){Ye.setClearAlpha(...arguments)},this.clear=function(A=!0,V=!0,K=!0){let Y=0;if(A){let O=!1;if(H!==null){let de=H.texture.format;O=de===ko||de===Oo||de===No}if(O){let de=H.texture.type,De=de===vn||de===ci||de===ls||de===cs||de===Uo||de===Fo,ke=Ye.getClearColor(),ze=Ye.getClearAlpha(),Qe=ke.r,$e=ke.g,qe=ke.b;De?(m[0]=Qe,m[1]=$e,m[2]=qe,m[3]=ze,S.clearBufferuiv(S.COLOR,0,m)):(M[0]=Qe,M[1]=$e,M[2]=qe,M[3]=ze,S.clearBufferiv(S.COLOR,0,M))}else Y|=S.COLOR_BUFFER_BIT}V&&(Y|=S.DEPTH_BUFFER_BIT),K&&(Y|=S.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),S.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ee,!1),t.removeEventListener("webglcontextrestored",_e,!1),t.removeEventListener("webglcontextcreationerror",ve,!1),Ye.dispose(),Be.dispose(),et.dispose(),Ue.dispose(),v.dispose(),k.dispose(),re.dispose(),Ze.dispose(),F.dispose(),Ie.dispose(),Z.dispose(),Z.removeEventListener("sessionstart",Vn),Z.removeEventListener("sessionend",Ms),yn.stop()};function ee(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function _e(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let A=Ke.autoReset,V=Oe.enabled,K=Oe.autoUpdate,Y=Oe.needsUpdate,O=Oe.type;pe(),Ke.autoReset=A,Oe.enabled=V,Oe.autoUpdate=K,Oe.needsUpdate=Y,Oe.type=O}function ve(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function We(A){let V=A.target;V.removeEventListener("dispose",We),rt(V)}function rt(A){xt(A),Ue.remove(A)}function xt(A){let V=Ue.get(A).programs;V!==void 0&&(V.forEach(function(K){Ie.releaseProgram(K)}),A.isShaderMaterial&&Ie.releaseShaderCache(A))}this.renderBufferDirect=function(A,V,K,Y,O,de){V===null&&(V=Me);let De=O.isMesh&&O.matrixWorld.determinant()<0,ke=Hn(A,V,K,Y,O);Ge.setMaterial(Y,De);let ze=K.index,Qe=1;if(Y.wireframe===!0){if(ze=he.getWireframeAttribute(K),ze===void 0)return;Qe=2}let $e=K.drawRange,qe=K.attributes.position,lt=$e.start*Qe,pt=($e.start+$e.count)*Qe;de!==null&&(lt=Math.max(lt,de.start*Qe),pt=Math.min(pt,(de.start+de.count)*Qe)),ze!==null?(lt=Math.max(lt,0),pt=Math.min(pt,ze.count)):qe!=null&&(lt=Math.max(lt,0),pt=Math.min(pt,qe.count));let bt=pt-lt;if(bt<0||bt===1/0)return;Ze.setup(O,Y,ke,K,ze);let _t,ht=fe;if(ze!==null&&(_t=ne.get(ze),ht=Ve,ht.setIndex(_t)),O.isMesh)Y.wireframe===!0?(Ge.setLineWidth(Y.wireframeLinewidth*ye()),ht.setMode(S.LINES)):ht.setMode(S.TRIANGLES);else if(O.isLine){let Je=Y.linewidth;Je===void 0&&(Je=1),Ge.setLineWidth(Je*ye()),O.isLineSegments?ht.setMode(S.LINES):O.isLineLoop?ht.setMode(S.LINE_LOOP):ht.setMode(S.LINE_STRIP)}else O.isPoints?ht.setMode(S.POINTS):O.isSprite&&ht.setMode(S.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)dr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ht.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(ae.get("WEBGL_multi_draw"))ht.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Je=O._multiDrawStarts,Dt=O._multiDrawCounts,mt=O._multiDrawCount,fn=ze?ne.get(ze).bytesPerElement:1,Gi=Ue.get(Y).currentProgram.getUniforms();for(let Kt=0;Kt<mt;Kt++)Gi.setValue(S,"_gl_DrawID",Kt),ht.render(Je[Kt]/fn,Dt[Kt])}else if(O.isInstancedMesh)ht.renderInstances(lt,bt,O.count);else if(K.isInstancedBufferGeometry){let Je=K._maxInstanceCount!==void 0?K._maxInstanceCount:1/0,Dt=Math.min(K.instanceCount,Je);ht.renderInstances(lt,bt,Dt)}else ht.render(lt,bt)};function ot(A,V,K){A.transparent===!0&&A.side===at&&A.forceSinglePass===!1?(A.side=Ut,A.needsUpdate=!0,un(A,V,K),A.side=Un,A.needsUpdate=!0,un(A,V,K),A.side=at):un(A,V,K)}this.compile=function(A,V,K=null){K===null&&(K=A),f=et.get(K),f.init(V),w.push(f),K.traverseVisible(function(O){O.isLight&&O.layers.test(V.layers)&&(f.pushLight(O),O.castShadow&&f.pushShadow(O))}),A!==K&&A.traverseVisible(function(O){O.isLight&&O.layers.test(V.layers)&&(f.pushLight(O),O.castShadow&&f.pushShadow(O))}),f.setupLights();let Y=new Set;return A.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let de=O.material;if(de)if(Array.isArray(de))for(let De=0;De<de.length;De++){let ke=de[De];ot(ke,K,O),Y.add(ke)}else ot(de,K,O),Y.add(de)}),f=w.pop(),Y},this.compileAsync=function(A,V,K=null){let Y=this.compile(A,V,K);return new Promise(O=>{function de(){if(Y.forEach(function(De){Ue.get(De).currentProgram.isReady()&&Y.delete(De)}),Y.size===0){O(A);return}setTimeout(de,10)}ae.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let Xt=null;function nn(A){Xt&&Xt(A)}function Vn(){yn.stop()}function Ms(){yn.start()}let yn=new Zh;yn.setAnimationLoop(nn),typeof self<"u"&&yn.setContext(self),this.setAnimationLoop=function(A){Xt=A,Z.setAnimationLoop(A),A===null?yn.stop():yn.start()},Z.addEventListener("sessionstart",Vn),Z.addEventListener("sessionend",Ms),this.render=function(A,V){if(V!==void 0&&V.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),Z.enabled===!0&&Z.isPresenting===!0&&(Z.cameraAutoUpdate===!0&&Z.updateCamera(V),V=Z.getCamera()),A.isScene===!0&&A.onBeforeRender(y,A,V,H),f=et.get(A,w.length),f.init(V),w.push(f),oe.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),q.setFromProjectionMatrix(oe),Ee=this.localClippingEnabled,ie=xe.init(this.clippingPlanes,Ee),g=Be.get(A,_.length),g.init(),_.push(g),Z.enabled===!0&&Z.isPresenting===!0){let de=y.xr.getDepthSensingMesh();de!==null&&Cn(de,V,-1/0,y.sortObjects)}Cn(A,V,0,y.sortObjects),g.finish(),y.sortObjects===!0&&g.sort(Q,te),ge=Z.enabled===!1||Z.isPresenting===!1||Z.hasDepthSensing()===!1,ge&&Ye.addToRenderList(g,A),this.info.render.frame++,ie===!0&&xe.beginShadows();let K=f.state.shadowsArray;Oe.render(K,A,V),ie===!0&&xe.endShadows(),this.info.autoReset===!0&&this.info.reset();let Y=g.opaque,O=g.transmissive;if(f.setupLights(),V.isArrayCamera){let de=V.cameras;if(O.length>0)for(let De=0,ke=de.length;De<ke;De++){let ze=de[De];Wn(Y,O,A,ze)}ge&&Ye.render(A);for(let De=0,ke=de.length;De<ke;De++){let ze=de[De];ys(g,A,ze,ze.viewport)}}else O.length>0&&Wn(Y,O,A,V),ge&&Ye.render(A),ys(g,A,V);H!==null&&C===0&&(D.updateMultisampleRenderTarget(H),D.updateRenderTargetMipmap(H)),A.isScene===!0&&A.onAfterRender(y,A,V),Ze.resetDefaultState(),T=-1,x=null,w.pop(),w.length>0?(f=w[w.length-1],ie===!0&&xe.setGlobalState(y.clippingPlanes,f.state.camera)):f=null,_.pop(),_.length>0?g=_[_.length-1]:g=null};function Cn(A,V,K,Y){if(A.visible===!1)return;if(A.layers.test(V.layers)){if(A.isGroup)K=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(V);else if(A.isLight)f.pushLight(A),A.castShadow&&f.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||q.intersectsSprite(A)){Y&&$.setFromMatrixPosition(A.matrixWorld).applyMatrix4(oe);let De=re.update(A),ke=A.material;ke.visible&&g.push(A,De,ke,K,$.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||q.intersectsObject(A))){let De=re.update(A),ke=A.material;if(Y&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),$.copy(A.boundingSphere.center)):(De.boundingSphere===null&&De.computeBoundingSphere(),$.copy(De.boundingSphere.center)),$.applyMatrix4(A.matrixWorld).applyMatrix4(oe)),Array.isArray(ke)){let ze=De.groups;for(let Qe=0,$e=ze.length;Qe<$e;Qe++){let qe=ze[Qe],lt=ke[qe.materialIndex];lt&&lt.visible&&g.push(A,De,lt,K,$.z,qe)}}else ke.visible&&g.push(A,De,ke,K,$.z,null)}}let de=A.children;for(let De=0,ke=de.length;De<ke;De++)Cn(de[De],V,K,Y)}function ys(A,V,K,Y){let O=A.opaque,de=A.transmissive,De=A.transparent;f.setupLightsView(K),ie===!0&&xe.setGlobalState(y.clippingPlanes,K),Y&&Ge.viewport(I.copy(Y)),O.length>0&&Xn(O,V,K),de.length>0&&Xn(de,V,K),De.length>0&&Xn(De,V,K),Ge.buffers.depth.setTest(!0),Ge.buffers.depth.setMask(!0),Ge.buffers.color.setMask(!0),Ge.setPolygonOffset(!1)}function Wn(A,V,K,Y){if((K.isScene===!0?K.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[Y.id]===void 0&&(f.state.transmissionRenderTarget[Y.id]=new cn(1,1,{generateMipmaps:!0,type:ae.has("EXT_color_buffer_half_float")||ae.has("EXT_color_buffer_float")?hi:vn,minFilter:li,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ct.workingColorSpace}));let de=f.state.transmissionRenderTarget[Y.id],De=Y.viewport||I;de.setSize(De.z*y.transmissionResolutionScale,De.w*y.transmissionResolutionScale);let ke=y.getRenderTarget();y.setRenderTarget(de),y.getClearColor(N),W=y.getClearAlpha(),W<1&&y.setClearColor(16777215,.5),y.clear(),ge&&Ye.render(K);let ze=y.toneMapping;y.toneMapping=On;let Qe=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),f.setupLightsView(Y),ie===!0&&xe.setGlobalState(y.clippingPlanes,Y),Xn(A,K,Y),D.updateMultisampleRenderTarget(de),D.updateRenderTargetMipmap(de),ae.has("WEBGL_multisampled_render_to_texture")===!1){let $e=!1;for(let qe=0,lt=V.length;qe<lt;qe++){let pt=V[qe],bt=pt.object,_t=pt.geometry,ht=pt.material,Je=pt.group;if(ht.side===at&&bt.layers.test(Y.layers)){let Dt=ht.side;ht.side=Ut,ht.needsUpdate=!0,Bi(bt,K,Y,_t,ht,Je),ht.side=Dt,ht.needsUpdate=!0,$e=!0}}$e===!0&&(D.updateMultisampleRenderTarget(de),D.updateRenderTargetMipmap(de))}y.setRenderTarget(ke),y.setClearColor(N,W),Qe!==void 0&&(Y.viewport=Qe),y.toneMapping=ze}function Xn(A,V,K){let Y=V.isScene===!0?V.overrideMaterial:null;for(let O=0,de=A.length;O<de;O++){let De=A[O],ke=De.object,ze=De.geometry,Qe=De.group,$e=De.material;$e.allowOverride===!0&&Y!==null&&($e=Y),ke.layers.test(K.layers)&&Bi(ke,V,K,ze,$e,Qe)}}function Bi(A,V,K,Y,O,de){A.onBeforeRender(y,V,K,Y,O,de),A.modelViewMatrix.multiplyMatrices(K.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),O.onBeforeRender(y,V,K,Y,A,de),O.transparent===!0&&O.side===at&&O.forceSinglePass===!1?(O.side=Ut,O.needsUpdate=!0,y.renderBufferDirect(K,V,Y,O,A,de),O.side=Un,O.needsUpdate=!0,y.renderBufferDirect(K,V,Y,O,A,de),O.side=at):y.renderBufferDirect(K,V,Y,O,A,de),A.onAfterRender(y,V,K,Y,O,de)}function un(A,V,K){V.isScene!==!0&&(V=Me);let Y=Ue.get(A),O=f.state.lights,de=f.state.shadowsArray,De=O.state.version,ke=Ie.getParameters(A,O.state,de,V,K),ze=Ie.getProgramCacheKey(ke),Qe=Y.programs;Y.environment=A.isMeshStandardMaterial?V.environment:null,Y.fog=V.fog,Y.envMap=(A.isMeshStandardMaterial?k:v).get(A.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&A.envMap===null?V.environmentRotation:A.envMapRotation,Qe===void 0&&(A.addEventListener("dispose",We),Qe=new Map,Y.programs=Qe);let $e=Qe.get(ze);if($e!==void 0){if(Y.currentProgram===$e&&Y.lightsStateVersion===De)return _s(A,ke),$e}else ke.uniforms=Ie.getUniforms(A),A.onBeforeCompile(ke,y),$e=Ie.acquireProgram(ke,ze),Qe.set(ze,$e),Y.uniforms=ke.uniforms;let qe=Y.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(qe.clippingPlanes=xe.uniform),_s(A,ke),Y.needsLights=xr(A),Y.lightsStateVersion=De,Y.needsLights&&(qe.ambientLightColor.value=O.state.ambient,qe.lightProbe.value=O.state.probe,qe.directionalLights.value=O.state.directional,qe.directionalLightShadows.value=O.state.directionalShadow,qe.spotLights.value=O.state.spot,qe.spotLightShadows.value=O.state.spotShadow,qe.rectAreaLights.value=O.state.rectArea,qe.ltc_1.value=O.state.rectAreaLTC1,qe.ltc_2.value=O.state.rectAreaLTC2,qe.pointLights.value=O.state.point,qe.pointLightShadows.value=O.state.pointShadow,qe.hemisphereLights.value=O.state.hemi,qe.directionalShadowMap.value=O.state.directionalShadowMap,qe.directionalShadowMatrix.value=O.state.directionalShadowMatrix,qe.spotShadowMap.value=O.state.spotShadowMap,qe.spotLightMatrix.value=O.state.spotLightMatrix,qe.spotLightMap.value=O.state.spotLightMap,qe.pointShadowMap.value=O.state.pointShadowMap,qe.pointShadowMatrix.value=O.state.pointShadowMatrix),Y.currentProgram=$e,Y.uniformsList=null,$e}function xs(A){if(A.uniformsList===null){let V=A.currentProgram.getUniforms();A.uniformsList=fs.seqWithValue(V.seq,A.uniforms)}return A.uniformsList}function _s(A,V){let K=Ue.get(A);K.outputColorSpace=V.outputColorSpace,K.batching=V.batching,K.batchingColor=V.batchingColor,K.instancing=V.instancing,K.instancingColor=V.instancingColor,K.instancingMorph=V.instancingMorph,K.skinning=V.skinning,K.morphTargets=V.morphTargets,K.morphNormals=V.morphNormals,K.morphColors=V.morphColors,K.morphTargetsCount=V.morphTargetsCount,K.numClippingPlanes=V.numClippingPlanes,K.numIntersection=V.numClipIntersection,K.vertexAlphas=V.vertexAlphas,K.vertexTangents=V.vertexTangents,K.toneMapping=V.toneMapping}function Hn(A,V,K,Y,O){V.isScene!==!0&&(V=Me),D.resetTextureUnits();let de=V.fog,De=Y.isMeshStandardMaterial?V.environment:null,ke=H===null?y.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:_i,ze=(Y.isMeshStandardMaterial?k:v).get(Y.envMap||De),Qe=Y.vertexColors===!0&&!!K.attributes.color&&K.attributes.color.itemSize===4,$e=!!K.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),qe=!!K.morphAttributes.position,lt=!!K.morphAttributes.normal,pt=!!K.morphAttributes.color,bt=On;Y.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&(bt=y.toneMapping);let _t=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,ht=_t!==void 0?_t.length:0,Je=Ue.get(Y),Dt=f.state.lights;if(ie===!0&&(Ee===!0||A!==x)){let zt=A===x&&Y.id===T;xe.setState(Y,A,zt)}let mt=!1;Y.version===Je.__version?(Je.needsLights&&Je.lightsStateVersion!==Dt.state.version||Je.outputColorSpace!==ke||O.isBatchedMesh&&Je.batching===!1||!O.isBatchedMesh&&Je.batching===!0||O.isBatchedMesh&&Je.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Je.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Je.instancing===!1||!O.isInstancedMesh&&Je.instancing===!0||O.isSkinnedMesh&&Je.skinning===!1||!O.isSkinnedMesh&&Je.skinning===!0||O.isInstancedMesh&&Je.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Je.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Je.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Je.instancingMorph===!1&&O.morphTexture!==null||Je.envMap!==ze||Y.fog===!0&&Je.fog!==de||Je.numClippingPlanes!==void 0&&(Je.numClippingPlanes!==xe.numPlanes||Je.numIntersection!==xe.numIntersection)||Je.vertexAlphas!==Qe||Je.vertexTangents!==$e||Je.morphTargets!==qe||Je.morphNormals!==lt||Je.morphColors!==pt||Je.toneMapping!==bt||Je.morphTargetsCount!==ht)&&(mt=!0):(mt=!0,Je.__version=Y.version);let fn=Je.currentProgram;mt===!0&&(fn=un(Y,V,O));let Gi=!1,Kt=!1,ws=!1,Mt=fn.getUniforms(),sn=Je.uniforms;if(Ge.useProgram(fn.program)&&(Gi=!0,Kt=!0,ws=!0),Y.id!==T&&(T=Y.id,Kt=!0),Gi||x!==A){Ge.buffers.depth.getReversed()?(me.copy(A.projectionMatrix),_h(me),wh(me),Mt.setValue(S,"projectionMatrix",me)):Mt.setValue(S,"projectionMatrix",A.projectionMatrix),Mt.setValue(S,"viewMatrix",A.matrixWorldInverse);let Yt=Mt.map.cameraPosition;Yt!==void 0&&Yt.setValue(S,Ce.setFromMatrixPosition(A.matrixWorld)),He.logarithmicDepthBuffer&&Mt.setValue(S,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&Mt.setValue(S,"isOrthographic",A.isOrthographicCamera===!0),x!==A&&(x=A,Kt=!0,ws=!0)}if(O.isSkinnedMesh){Mt.setOptional(S,O,"bindMatrix"),Mt.setOptional(S,O,"bindMatrixInverse");let zt=O.skeleton;zt&&(zt.boneTexture===null&&zt.computeBoneTexture(),Mt.setValue(S,"boneTexture",zt.boneTexture,D))}O.isBatchedMesh&&(Mt.setOptional(S,O,"batchingTexture"),Mt.setValue(S,"batchingTexture",O._matricesTexture,D),Mt.setOptional(S,O,"batchingIdTexture"),Mt.setValue(S,"batchingIdTexture",O._indirectTexture,D),Mt.setOptional(S,O,"batchingColorTexture"),O._colorsTexture!==null&&Mt.setValue(S,"batchingColorTexture",O._colorsTexture,D));let rn=K.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&Te.update(O,K,fn),(Kt||Je.receiveShadow!==O.receiveShadow)&&(Je.receiveShadow=O.receiveShadow,Mt.setValue(S,"receiveShadow",O.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(sn.envMap.value=ze,sn.flipEnvMap.value=ze.isCubeTexture&&ze.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&V.environment!==null&&(sn.envMapIntensity.value=V.environmentIntensity),Kt&&(Mt.setValue(S,"toneMappingExposure",y.toneMappingExposure),Je.needsLights&&yr(sn,ws),de&&Y.fog===!0&&Re.refreshFogUniforms(sn,de),Re.refreshMaterialUniforms(sn,Y,U,J,f.state.transmissionRenderTarget[A.id]),fs.upload(S,xs(Je),sn,D)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(fs.upload(S,xs(Je),sn,D),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&Mt.setValue(S,"center",O.center),Mt.setValue(S,"modelViewMatrix",O.modelViewMatrix),Mt.setValue(S,"normalMatrix",O.normalMatrix),Mt.setValue(S,"modelMatrix",O.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){let zt=Y.uniformsGroups;for(let Yt=0,Ca=zt.length;Yt<Ca;Yt++){let fi=zt[Yt];F.update(fi,fn),F.bind(fi,fn)}}return fn}function yr(A,V){A.ambientLightColor.needsUpdate=V,A.lightProbe.needsUpdate=V,A.directionalLights.needsUpdate=V,A.directionalLightShadows.needsUpdate=V,A.pointLights.needsUpdate=V,A.pointLightShadows.needsUpdate=V,A.spotLights.needsUpdate=V,A.spotLightShadows.needsUpdate=V,A.rectAreaLights.needsUpdate=V,A.hemisphereLights.needsUpdate=V}function xr(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return H},this.setRenderTargetTextures=function(A,V,K){let Y=Ue.get(A);Y.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,Y.__autoAllocateDepthBuffer===!1&&(Y.__useRenderToTexture=!1),Ue.get(A.texture).__webglTexture=V,Ue.get(A.depthTexture).__webglTexture=Y.__autoAllocateDepthBuffer?void 0:K,Y.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,V){let K=Ue.get(A);K.__webglFramebuffer=V,K.__useDefaultFramebuffer=V===void 0};let Aa=S.createFramebuffer();this.setRenderTarget=function(A,V=0,K=0){H=A,R=V,C=K;let Y=!0,O=null,de=!1,De=!1;if(A){let ze=Ue.get(A);if(ze.__useDefaultFramebuffer!==void 0)Ge.bindFramebuffer(S.FRAMEBUFFER,null),Y=!1;else if(ze.__webglFramebuffer===void 0)D.setupRenderTarget(A);else if(ze.__hasExternalTextures)D.rebindTextures(A,Ue.get(A.texture).__webglTexture,Ue.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){let qe=A.depthTexture;if(ze.__boundDepthTexture!==qe){if(qe!==null&&Ue.has(qe)&&(A.width!==qe.image.width||A.height!==qe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");D.setupDepthRenderbuffer(A)}}let Qe=A.texture;(Qe.isData3DTexture||Qe.isDataArrayTexture||Qe.isCompressedArrayTexture)&&(De=!0);let $e=Ue.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray($e[V])?O=$e[V][K]:O=$e[V],de=!0):A.samples>0&&D.useMultisampledRTT(A)===!1?O=Ue.get(A).__webglMultisampledFramebuffer:Array.isArray($e)?O=$e[K]:O=$e,I.copy(A.viewport),B.copy(A.scissor),G=A.scissorTest}else I.copy(ue).multiplyScalar(U).floor(),B.copy(we).multiplyScalar(U).floor(),G=Ae;if(K!==0&&(O=Aa),Ge.bindFramebuffer(S.FRAMEBUFFER,O)&&Y&&Ge.drawBuffers(A,O),Ge.viewport(I),Ge.scissor(B),Ge.setScissorTest(G),de){let ze=Ue.get(A.texture);S.framebufferTexture2D(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_CUBE_MAP_POSITIVE_X+V,ze.__webglTexture,K)}else if(De){let ze=Ue.get(A.texture),Qe=V;S.framebufferTextureLayer(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,ze.__webglTexture,K,Qe)}else if(A!==null&&K!==0){let ze=Ue.get(A.texture);S.framebufferTexture2D(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,ze.__webglTexture,K)}T=-1},this.readRenderTargetPixels=function(A,V,K,Y,O,de,De){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ke=Ue.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&De!==void 0&&(ke=ke[De]),ke){Ge.bindFramebuffer(S.FRAMEBUFFER,ke);try{let ze=A.texture,Qe=ze.format,$e=ze.type;if(!He.textureFormatReadable(Qe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!He.textureTypeReadable($e)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=A.width-Y&&K>=0&&K<=A.height-O&&S.readPixels(V,K,Y,O,Fe.convert(Qe),Fe.convert($e),de)}finally{let ze=H!==null?Ue.get(H).__webglFramebuffer:null;Ge.bindFramebuffer(S.FRAMEBUFFER,ze)}}},this.readRenderTargetPixelsAsync=async function(A,V,K,Y,O,de,De){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ke=Ue.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&De!==void 0&&(ke=ke[De]),ke)if(V>=0&&V<=A.width-Y&&K>=0&&K<=A.height-O){Ge.bindFramebuffer(S.FRAMEBUFFER,ke);let ze=A.texture,Qe=ze.format,$e=ze.type;if(!He.textureFormatReadable(Qe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!He.textureTypeReadable($e))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let qe=S.createBuffer();S.bindBuffer(S.PIXEL_PACK_BUFFER,qe),S.bufferData(S.PIXEL_PACK_BUFFER,de.byteLength,S.STREAM_READ),S.readPixels(V,K,Y,O,Fe.convert(Qe),Fe.convert($e),0);let lt=H!==null?Ue.get(H).__webglFramebuffer:null;Ge.bindFramebuffer(S.FRAMEBUFFER,lt);let pt=S.fenceSync(S.SYNC_GPU_COMMANDS_COMPLETE,0);return S.flush(),await xh(S,pt,4),S.bindBuffer(S.PIXEL_PACK_BUFFER,qe),S.getBufferSubData(S.PIXEL_PACK_BUFFER,0,de),S.deleteBuffer(qe),S.deleteSync(pt),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,V=null,K=0){let Y=Math.pow(2,-K),O=Math.floor(A.image.width*Y),de=Math.floor(A.image.height*Y),De=V!==null?V.x:0,ke=V!==null?V.y:0;D.setTexture2D(A,0),S.copyTexSubImage2D(S.TEXTURE_2D,K,0,0,De,ke,O,de),Ge.unbindTexture()};let _r=S.createFramebuffer(),Yn=S.createFramebuffer();this.copyTextureToTexture=function(A,V,K=null,Y=null,O=0,de=null){de===null&&(O!==0?(dr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),de=O,O=0):de=0);let De,ke,ze,Qe,$e,qe,lt,pt,bt,_t=A.isCompressedTexture?A.mipmaps[de]:A.image;if(K!==null)De=K.max.x-K.min.x,ke=K.max.y-K.min.y,ze=K.isBox3?K.max.z-K.min.z:1,Qe=K.min.x,$e=K.min.y,qe=K.isBox3?K.min.z:0;else{let rn=Math.pow(2,-O);De=Math.floor(_t.width*rn),ke=Math.floor(_t.height*rn),A.isDataArrayTexture?ze=_t.depth:A.isData3DTexture?ze=Math.floor(_t.depth*rn):ze=1,Qe=0,$e=0,qe=0}Y!==null?(lt=Y.x,pt=Y.y,bt=Y.z):(lt=0,pt=0,bt=0);let ht=Fe.convert(V.format),Je=Fe.convert(V.type),Dt;V.isData3DTexture?(D.setTexture3D(V,0),Dt=S.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(D.setTexture2DArray(V,0),Dt=S.TEXTURE_2D_ARRAY):(D.setTexture2D(V,0),Dt=S.TEXTURE_2D),S.pixelStorei(S.UNPACK_FLIP_Y_WEBGL,V.flipY),S.pixelStorei(S.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),S.pixelStorei(S.UNPACK_ALIGNMENT,V.unpackAlignment);let mt=S.getParameter(S.UNPACK_ROW_LENGTH),fn=S.getParameter(S.UNPACK_IMAGE_HEIGHT),Gi=S.getParameter(S.UNPACK_SKIP_PIXELS),Kt=S.getParameter(S.UNPACK_SKIP_ROWS),ws=S.getParameter(S.UNPACK_SKIP_IMAGES);S.pixelStorei(S.UNPACK_ROW_LENGTH,_t.width),S.pixelStorei(S.UNPACK_IMAGE_HEIGHT,_t.height),S.pixelStorei(S.UNPACK_SKIP_PIXELS,Qe),S.pixelStorei(S.UNPACK_SKIP_ROWS,$e),S.pixelStorei(S.UNPACK_SKIP_IMAGES,qe);let Mt=A.isDataArrayTexture||A.isData3DTexture,sn=V.isDataArrayTexture||V.isData3DTexture;if(A.isDepthTexture){let rn=Ue.get(A),zt=Ue.get(V),Yt=Ue.get(rn.__renderTarget),Ca=Ue.get(zt.__renderTarget);Ge.bindFramebuffer(S.READ_FRAMEBUFFER,Yt.__webglFramebuffer),Ge.bindFramebuffer(S.DRAW_FRAMEBUFFER,Ca.__webglFramebuffer);for(let fi=0;fi<ze;fi++)Mt&&(S.framebufferTextureLayer(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,Ue.get(A).__webglTexture,O,qe+fi),S.framebufferTextureLayer(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,Ue.get(V).__webglTexture,de,bt+fi)),S.blitFramebuffer(Qe,$e,De,ke,lt,pt,De,ke,S.DEPTH_BUFFER_BIT,S.NEAREST);Ge.bindFramebuffer(S.READ_FRAMEBUFFER,null),Ge.bindFramebuffer(S.DRAW_FRAMEBUFFER,null)}else if(O!==0||A.isRenderTargetTexture||Ue.has(A)){let rn=Ue.get(A),zt=Ue.get(V);Ge.bindFramebuffer(S.READ_FRAMEBUFFER,_r),Ge.bindFramebuffer(S.DRAW_FRAMEBUFFER,Yn);for(let Yt=0;Yt<ze;Yt++)Mt?S.framebufferTextureLayer(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,rn.__webglTexture,O,qe+Yt):S.framebufferTexture2D(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,rn.__webglTexture,O),sn?S.framebufferTextureLayer(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,zt.__webglTexture,de,bt+Yt):S.framebufferTexture2D(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,zt.__webglTexture,de),O!==0?S.blitFramebuffer(Qe,$e,De,ke,lt,pt,De,ke,S.COLOR_BUFFER_BIT,S.NEAREST):sn?S.copyTexSubImage3D(Dt,de,lt,pt,bt+Yt,Qe,$e,De,ke):S.copyTexSubImage2D(Dt,de,lt,pt,Qe,$e,De,ke);Ge.bindFramebuffer(S.READ_FRAMEBUFFER,null),Ge.bindFramebuffer(S.DRAW_FRAMEBUFFER,null)}else sn?A.isDataTexture||A.isData3DTexture?S.texSubImage3D(Dt,de,lt,pt,bt,De,ke,ze,ht,Je,_t.data):V.isCompressedArrayTexture?S.compressedTexSubImage3D(Dt,de,lt,pt,bt,De,ke,ze,ht,_t.data):S.texSubImage3D(Dt,de,lt,pt,bt,De,ke,ze,ht,Je,_t):A.isDataTexture?S.texSubImage2D(S.TEXTURE_2D,de,lt,pt,De,ke,ht,Je,_t.data):A.isCompressedTexture?S.compressedTexSubImage2D(S.TEXTURE_2D,de,lt,pt,_t.width,_t.height,ht,_t.data):S.texSubImage2D(S.TEXTURE_2D,de,lt,pt,De,ke,ht,Je,_t);S.pixelStorei(S.UNPACK_ROW_LENGTH,mt),S.pixelStorei(S.UNPACK_IMAGE_HEIGHT,fn),S.pixelStorei(S.UNPACK_SKIP_PIXELS,Gi),S.pixelStorei(S.UNPACK_SKIP_ROWS,Kt),S.pixelStorei(S.UNPACK_SKIP_IMAGES,ws),de===0&&V.generateMipmaps&&S.generateMipmap(Dt),Ge.unbindTexture()},this.copyTextureToTexture3D=function(A,V,K=null,Y=null,O=0){return dr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,V,K,Y,O)},this.initRenderTarget=function(A){Ue.get(A).__webglFramebuffer===void 0&&D.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?D.setTextureCube(A,0):A.isData3DTexture?D.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?D.setTexture2DArray(A,0):D.setTexture2D(A,0),Ge.unbindTexture()},this.resetState=function(){R=0,C=0,H=null,Ge.reset(),Ze.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ct._getDrawingBufferColorSpace(e),t.unpackColorSpace=ct._getUnpackColorSpace()}};var jh={punching:{rate:2.2,impact:.35},kicking:{rate:1.6,impact:.4}};function nc(n,e){let{rate:t,impact:i}=jh[e],s=(n*t%1+1)%1,r=s<i?1-Math.pow(1-s/i,3):Math.max(0,1-(s-i)/(1-i))**2,o=s>=i?Math.exp(-(s-i)*9):0;return{extend:r,recoil:o}}function ic(n,e,t){let i=new j;i.position.set(0,-.24,.05),n.add(i);let s=new j;s.position.set(0,-.24,.05),e.add(s);let r=new j;r.visible=!1;let o=new P({color:16317180,roughness:.65,side:at}),a=new P({color:14427686,roughness:.55}),l=new E(new le(.18,.34,.44,18,1,!1,-Math.PI*.65,Math.PI*1.3),o);l.position.set(0,.36,.03),l.castShadow=!0,r.add(l);let c=new E(new Ne(.165,.025,8,20),a);c.rotation.x=Math.PI/2+.14,c.position.set(0,.57,.02),r.add(c),t.add(r);let h=new j;h.visible=!1;let d=new P({color:16708551,roughness:.88}),p=new P({color:165063,roughness:.72}),u=new E(new Ne(.142,.022,8,20),d);u.rotation.x=Math.PI/2+.22,u.position.set(0,.505,-.01),h.add(u);let m=new E(new le(.165,.255,.34,14,1,!1,-Math.PI*.45,Math.PI*.9),d);m.position.set(0,.35,.03),m.rotation.y=Math.PI*.02,h.add(m);for(let Y of[-.095,.095]){let O=new E(new X(.072,.19,.014),d);O.position.set(Y,.34,.145),O.rotation.x=-.16,O.rotation.z=Y<0?.18:-.18,h.add(O);let de=new E(new X(.074,.024,.016),p);de.position.set(Y*1.06,.245,.16),de.rotation.x=-.16,de.rotation.z=Y<0?.18:-.18,h.add(de)}t.add(h);let M=new P({color:14870768,metalness:.9,roughness:.14}),g=new P({color:7877903,roughness:.52}),f=new P({color:16096779,metalness:.85,roughness:.22}),_=new P({color:14427686,roughness:.38}),w=new P({color:959977,roughness:.35}),y=new P({color:1976635,roughness:.45}),b={},R=new P({color:16317180,metalness:.72,roughness:.16,emissive:3359061,emissiveIntensity:.35}),C=new j,H=new j,T=new E(new X(.042,.32,.016),R);T.position.set(0,.16,0),H.add(T);let x=new E(new Ne(.048,.014,8,16),_);x.position.set(-.028,-.06,0),H.add(x),C.add(H);let I=new j,B=new E(new X(.042,.32,.016),R);B.position.set(0,.16,.008),I.add(B);let G=new E(new Ne(.048,.014,8,16),_);G.position.set(.028,-.06,.008),I.add(G),C.add(I);let N=new E(new le(.018,.018,.032,10),f);N.rotation.x=Math.PI/2,N.position.set(0,.02,.004),C.add(N),C.rotation.x=Math.PI*1.16,C.visible=!1,i.add(C),b.scissors=C;let W=()=>{let Y=new j,O=new E(new X(.028,.22,.016),w);O.position.set(0,.1,0),Y.add(O);for(let de=-3;de<=3;de++){let De=new E(new X(.042,.012,.012),w);De.position.set(.024,.1+de*.026,0),Y.add(De)}return Y},z=W();z.rotation.x=Math.PI*1.12,z.visible=!1,i.add(z),b.comb=z;let J=W();J.rotation.x=Math.PI*1.12,J.visible=!1,s.add(J);let U=new j,Q=new E(new Ne(.055,.014,8,16),f);Q.position.y=.03,U.add(Q);let te=new E(new le(.014,.014,.22,8),f);te.position.y=.16,U.add(te);let ue=new E(new X(.055,.045,.016),f);ue.position.set(.032,.24,0),U.add(ue),U.rotation.x=Math.PI*.35,U.visible=!1,i.add(U),b.key=U;let we=new j,Ae=new E(new X(.11,.2,.018),y);Ae.position.set(0,.08,.02),we.add(Ae);let q=new Se({color:3718648}),ie=new E(new nt(.09,.16),q);ie.position.set(0,.08,.03),we.add(ie),we.visible=!1,i.add(we),b.phone=we;let Ee=new j,me=new E(new le(.018,.02,.28,10),g);me.position.y=.14,Ee.add(me);let oe=new E(new le(.052,.052,.16,12),g);oe.rotation.z=Math.PI/2,oe.position.y=.26,Ee.add(oe);let Ce=new E(new le(.055,.055,.03,12),f);Ce.rotation.z=Math.PI/2,Ce.position.y=.26,Ee.add(Ce),Ee.rotation.x=Math.PI*.42,Ee.visible=!1,i.add(Ee),b.gavel=Ee;let $=new j,Me=new E(new le(.02,.016,.22,10),y);Me.position.y=.11,$.add(Me);let ge=new E(new se(.048,12,10),M);ge.position.y=.23,$.add(ge),$.rotation.x=Math.PI*.25,$.visible=!1,i.add($),b.mic=$;let ye=new j,S=new E(new le(.068,.048,.11,14),new P({color:14251782,roughness:.72}));S.position.y=.06,ye.add(S);let ce=new E(new yt(.058,12),new P({color:11817737,roughness:.25}));ce.rotation.x=-Math.PI/2,ce.position.y=.112,ye.add(ce),ye.visible=!1,i.add(ye),b.teacup=ye;let ae=new j,He=new E(new le(.014,.014,.36,8),M);He.position.y=.18,ae.add(He);let Ge=new E(new se(.065,12,8,0,Math.PI*2,0,Math.PI*.55),M);Ge.rotation.x=Math.PI,Ge.position.set(0,.36,.03),ae.add(Ge),ae.rotation.x=Math.PI*.35,ae.visible=!1,i.add(ae),b.ladle=ae;let Ke=new j,Ue=new E(new Ne(.08,.012,8,16,Math.PI*1.4),y);Ue.position.y=.12,Ke.add(Ue);let D=new E(new le(.045,.045,.025,12),M);D.rotation.x=Math.PI/2,D.position.set(0,.22,.03),Ke.add(D),Ke.visible=!1,i.add(Ke),b.stethoscope=Ke;let v=new j,k=new E(new le(.038,.038,.22,12),w);k.position.y=.14,v.add(k);let ne=new E(new Xe(.012,.12,8),M);ne.position.y=.31,v.add(ne),v.rotation.x=Math.PI*.45,v.visible=!1,i.add(v),b.syringe=v;let he=new j,re=new E(new Xe(.085,.055,14),f);re.rotation.x=Math.PI,re.position.y=.04,he.add(re);let Ie=new E(new Xe(.025,.08,10),new Se({color:16707722}));Ie.position.y=.1,he.add(Ie),he.visible=!1,i.add(he),b.diya=he;let Re=new j,Be=new E(new le(.018,.018,.46,10),f);Be.rotation.z=Math.PI/2,Be.position.set(.14,.04,.04),Re.add(Be),Re.visible=!1,i.add(Re),b.flute=Re;let et=new j,xe=new E(new X(.18,.24,.045),_);xe.position.set(0,.1,.04),et.add(xe);let Oe=new E(new X(.16,.22,.036),new P({color:16710888}));Oe.position.set(.01,.1,.04),et.add(Oe),et.visible=!1,i.add(et),b.book=et;let Ye=new j,Te=new E(new le(.018,.022,.56,10),g);Te.position.y=.28,Ye.add(Te),Ye.rotation.x=Math.PI*.25,Ye.visible=!1,i.add(Ye),b.baton=Ye;let fe=new j,Ve=new E(new le(.012,.012,.11,8),new P({color:16777215}));Ve.position.y=.06,fe.add(Ve),fe.rotation.x=Math.PI*.35,fe.visible=!1,i.add(fe),b.chalk=fe;let Fe=new j,Ze=new E(new le(.016,.016,.92,10),f);Ze.position.y=.36,Fe.add(Ze);let F=new E(new Xe(.032,.16,8),f);F.position.y=.88,Fe.add(F);for(let Y of[-1,1]){let O=new E(new Xe(.022,.14,8),f);O.position.set(Y*.065,.82,0),O.rotation.z=-Y*.25,Fe.add(O)}Fe.visible=!1,i.add(Fe),b.trishul=Fe;let pe=new j,Z=new E(new Ne(.32,.02,8,22,Math.PI),f);Z.rotation.z=-Math.PI/2,Z.position.set(0,.18,.05),pe.add(Z),pe.visible=!1,i.add(pe),b.bow=pe;let ee=new j,_e=new E(new le(.02,.028,.56,10),f);_e.position.y=.24,ee.add(_e);let ve=new E(new se(.115,14,12),f);ve.scale.set(1,1.18,1),ve.position.y=.56,ee.add(ve);let We=new E(new Ne(.112,.016,6,14),f);We.rotation.x=Math.PI/2,We.position.y=.56,ee.add(We),ee.rotation.x=Math.PI*.28,ee.visible=!1,i.add(ee),b.gada=ee;let rt=new j,xt=new E(new X(.14,.08,.025),new P({color:2278750,roughness:.45}));xt.position.set(0,.05,.04),rt.add(xt),rt.visible=!1,i.add(rt),b.money=rt;let ot=new j,Xt=new E(new le(.016,.016,.65,8),g);Xt.position.y=.22,ot.add(Xt);let nn=new E(new Xe(.09,.22,10),new P({color:16638023,roughness:.9}));nn.position.y=-.14,ot.add(nn),ot.visible=!1,i.add(ot),b.broom=ot;let Vn=new j,Ms=new E(new le(.014,.014,.55,8),y);Ms.position.y=.26,Vn.add(Ms);let yn=new E(new Xe(.32,.14,14),_);yn.position.y=.52,Vn.add(yn),Vn.visible=!1,i.add(Vn),b.umbrella=Vn;let Cn=new j,ys=new E(new le(.12,.09,.022,14),M);ys.position.y=.02,Cn.add(ys);for(let Y of[-.04,.04,0]){let O=new E(new se(.036,10,8),new P({color:16096779,roughness:.45}));O.position.set(Y,.055,Y===0?.035:-.02),Cn.add(O)}Cn.visible=!1,i.add(Cn),b.sweetplate=Cn;let Wn=new j,Xn=new E(new X(.11,.22,.02),d);Xn.position.set(.01,-.15,.015),Xn.rotation.x=.04,Wn.add(Xn);let Bi=new E(new X(.114,.035,.023),p);Bi.position.set(.01,-.23,.018),Bi.rotation.x=.04,Wn.add(Bi),Wn.visible=!1,i.add(Wn),b.towel=Wn;let un=new j,xs=new E(new le(.055,.068,.18,12),w);xs.position.y=.09,un.add(xs);let _s=new E(new X(.09,.04,.035),R);_s.position.set(.025,.2,0),un.add(_s),un.rotation.x=Math.PI*.42,un.visible=!1,i.add(un),b.sprayBottle=un;let Hn=new j,yr=new E(new le(.014,.018,.24,8),new P({color:1409085,roughness:.65}));yr.position.y=.08,Hn.add(yr);let xr=new P({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.28}),Aa=new P({color:16020150,emissive:14362487,emissiveIntensity:.25,roughness:.34});for(let Y=0;Y<8;Y++){let O=Y/8*Math.PI*2,de=new E(new Xe(.042,.13,6),Y%2===0?Aa:xr);de.position.set(Math.cos(O)*.068,.22,Math.sin(O)*.068),de.rotation.z=-Math.cos(O)*.62,de.rotation.x=Math.sin(O)*.62,Hn.add(de)}let _r=new E(new se(.048,10,8),xr);_r.position.y=.22,Hn.add(_r),Hn.rotation.x=Math.PI*.18,Hn.visible=!1,i.add(Hn),b.lotus=Hn;let Yn=new j,A=new P({color:16498468,emissive:16096779,emissiveIntensity:.78,metalness:.85,roughness:.14}),V=new E(new Ne(.14,.022,8,22),A);V.position.y=.2,Yn.add(V);let K=new E(new St(.055,0),A);K.position.y=.2,Yn.add(K);for(let Y=0;Y<10;Y++){let O=Y/10*Math.PI*2,de=new E(new Xe(.022,.065,4),A);de.position.set(Math.cos(O)*.165,.2+Math.sin(O)*.165,0),de.rotation.z=O-Math.PI/2,Yn.add(de)}return Yn.visible=!1,i.add(Yn),b.chakra=Yn,{rightGroup:i,leftGroup:s,capeGroup:r,towelNeckGroup:h,rightMeshes:b,leftComb:J,scissorUpper:H,scissorLower:I,phoneScreen:q,diyaFlame:Ie}}function ed(n,e,t,i){if(i||n==="BrainrotLog"||n==="CupDancer"||n==="CartoonTank"||n==="ComicBobble")return null;let s=(e||"").toLowerCase();return/narasimha|narsimha|narsingh|नरसिंह|नृसिंह/.test(s)?"narasimha":/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/.test(s)?"asuraKing":/hanuman|maruti|bajrang|pavanputra|हनुमान|मारुति|बजरंग/.test(s)?"hanuman":/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/.test(s)?"shiv":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/.test(s)?"krishna":/ram|raghav|raghunath|राम|राघव/.test(s)?"ram":/vishnu|hari|narayan|vasudev|विष्णु|हरि|नारायण|वासुदेव/.test(s)?"vishnu":n==="NobleWoman"?"devi":n==="ChildDevotee"?"prahladChild":n==="SageRishi"?"rishi":(t==="Temple"||t==="ForestAshram"||t==="RiverGhat"||t==="Himalaya"||t==="PalaceCourt"||t==="Cosmos")&&(n==="KingCrown"||n==="Divine"||n==="Warrior")?"genericSacred":null}function td(n,e){switch(n){case"narasimha":return{skin:14261851,robe:14251782,sash:12131356,scale:1.18};case"asuraKing":return{skin:8867380,robe:8330525,sash:16096779,scale:1.07};case"hanuman":return{skin:14711612,robe:15357964,sash:16436245,scale:1.08};case"shiv":return{skin:13358561,robe:9584654,sash:16347926,scale:1.1};case"krishna":return{skin:6000370,robe:15381256,sash:14427686,scale:1.04};case"ram":return{skin:8234216,robe:14251782,sash:12131356,scale:1.05};case"vishnu":return{skin:6788331,robe:16096779,sash:14427686,scale:1.12};case"prahladChild":return{skin:15250056,robe:15357964,sash:16498468,scale:.78};case"rishi":return{skin:e.skin,robe:12735506,sash:16638082,scale:.98};default:return{skin:e.skin,robe:e.robe,sash:e.sash,scale:1}}}function nd(n,e,t){let i=new P({color:t,roughness:.44,metalness:.04}),s=new P({color:15119740,roughness:.48}),r=new P({color:5972257,roughness:.35}),o=new P({color:8138002,roughness:.62}),a=new P({color:14251782,emissive:7877903,emissiveIntensity:.18,roughness:.52}),l=new P({color:16498468,emissive:11817737,emissiveIntensity:.25,roughness:.42}),c=new P({color:16776693,roughness:.18,metalness:.05}),h=new P({color:16236088,metalness:.88,roughness:.2}),d=new E(new se(e*1.04,24,18),i);d.scale.set(1.06,1.04,1.04),d.castShadow=!0,n.add(d);for(let J of[-1,1]){let U=new E(new se(e*.42,12,10),s);U.scale.set(1.05,.82,.95),U.position.set(J*e*.54,-e*.12,e*.68),n.add(U);let Q=new E(new Xe(e*.24,e*.44,8),i);Q.position.set(J*e*.88,e*.72,-e*.04),Q.rotation.z=-J*.48,Q.rotation.x=.12,n.add(Q)}let p=new E(new X(e*.52,e*.54,e*.62),s);p.position.set(0,-e*.04,e*.86),p.rotation.x=.22,n.add(p);for(let J of[-1,1]){let U=new E(new se(e*.27,14,10),s);U.scale.set(1.1,.78,1.15),U.position.set(J*e*.24,-e*.25,e*1.08),n.add(U);for(let Q=0;Q<3;Q++){let te=new E(new le(.004,.0015,e*.65,4),c);te.rotation.z=J*(Math.PI*.44+(Q-1)*.16),te.rotation.y=J*-.22,te.position.set(J*e*.58,-e*(.2+Q*.06),e*1.12),n.add(te)}}let u=new E(new Xe(e*.22,e*.24,4),r);u.rotation.x=Math.PI*.52,u.rotation.z=Math.PI*.25,u.position.set(0,-e*.11,e*1.26),n.add(u);let m=-e*.46,M=new E(new se(e*.34,14,10),new Se({color:7016218}));M.scale.set(1.05,.48,.85),M.position.set(0,m+e*.04,e*.96),n.add(M);let g=new E(new ft(e*.052,e*.42,4,8),s);g.rotation.z=Math.PI/2,g.position.set(0,m+e*.14,e*1.16),n.add(g);let f=new j;f.position.set(0,m+e*.02,e*.72),n.add(f);let _=new E(new se(e*.32,14,10),s);_.scale.set(1.06,.65,1.18),_.position.set(0,-e*.14,e*.34),f.add(_);let w=new E(new ft(e*.052,e*.38,4,8),s);w.rotation.z=Math.PI/2,w.position.set(0,-e*.04,e*.46),f.add(w);for(let J of[-1,1]){let U=new E(new Xe(e*.068,e*.3,8),c);U.rotation.x=Math.PI,U.position.set(J*e*.24,m+e*.02,e*1.22),n.add(U);let Q=new E(new Xe(e*.056,e*.24,8),c);Q.position.set(J*e*.2,e*.02,e*.48),f.add(Q)}let y=new P({color:16707722,emissive:16096779,emissiveIntensity:.72,roughness:.15}),b=new P({color:1705218,emissive:8133904,emissiveIntensity:.25,roughness:.1}),R=new P({color:t,roughness:.46}),C=new P({color:8138002,roughness:.55}),H=J=>{let U=J*e*.4,Q=e*.14,te=e*.92,ue=new E(new se(e*.175,14,12),y);ue.scale.set(1.05,.92,.65),ue.position.set(U,Q,te),n.add(ue);let we=new E(new se(e*.095,12,10),b);we.scale.set(.68,1.15,.7),we.position.set(U,Q,te+e*.125),n.add(we);let Ae=new E(new se(e*.185,12,10,0,Math.PI*2,0,Math.PI*.52),R);Ae.scale.set(1.05,.95,.68),Ae.position.set(U,Q,te),Ae.rotation.x=-Math.PI*.56,n.add(Ae);let q=new E(new ft(e*.06,e*.28,5,8),C);return q.rotation.z=Math.PI/2-J*.38,q.position.set(U,Q+e*.24,te+e*.1),n.add(q),{sclera:ue,pupil:we,eyelid:Ae,brow:q}},T=H(-1),x=H(1),I=new P({color:16776171,emissive:16639626,emissiveIntensity:.45}),B=new P({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let J of[-1,1]){let U=new E(new X(e*.055,e*.44,e*.05),I);U.position.set(J*e*.095,e*.48,e*.96),U.rotation.z=-J*.1,n.add(U)}let G=new E(new X(e*.22,e*.07,e*.05),I);G.position.set(0,e*.27,e*.98),n.add(G);let N=new E(new ft(e*.032,e*.32,4,8),B);N.position.set(0,e*.48,e*.99),n.add(N);let W=new j;for(let J=0;J<2;J++){let U=J===0?16:14,Q=e*(J===0?1.18:1.02),te=J===0?-e*.08:-e*.34;for(let ue=0;ue<U;ue++){let we=ue/U*Math.PI*2;if(Math.sin(we)<-.78&&Math.abs(Math.cos(we))<.38&&J===0)continue;let Ae=(ue+J)%3===0?l:ue%2===0?a:o,q=new E(new Xe(e*(J===0?.32:.36),e*(J===0?.88:1.04),7),Ae);q.position.set(Math.cos(we)*Q,Math.sin(we)*Q*1.04,te),q.rotation.z=we-Math.PI/2,q.rotation.x=J===0?-.18:-.35,q.castShadow=!0,W.add(q)}}let z=new E(new se(e*1.16,16,12),o);return z.scale.set(1.22,1.26,.82),z.position.set(0,-e*.12,-e*.48),W.add(z),n.add(W),sc(n,e*.96,h,"narasimha"),{leftEye:T,rightEye:x,mouthCavity:M,upperLip:g,lowerLip:w,mouthBaseY:m,lowerJawPivot:f}}function sc(n,e,t,i){let s=new j;s.position.y=i==="narasimha"?e*.84:e*.86;let r=i==="asuraKing",o=r?new P({color:11817737,metalness:.88,roughness:.24}):t,a=new E(new le(e*.78,e*.86,e*.3,20),o);a.castShadow=!0,s.add(a);let l=r?7:5;for(let m=0;m<l;m++){let M=(m-(l-1)/2)/l*Math.PI*.85,g=r?e*(.45+m%2*.22):e*(.42-Math.abs(m-2)*.08),f=new E(new Xe(e*.13,g,8),t);f.position.set(Math.sin(M)*e*.76,e*.22,Math.cos(M)*e*.76),f.rotation.z=-Math.sin(M)*(r?.42:.16),s.add(f)}if(r){let m=new P({color:16096779,metalness:.9,roughness:.18});for(let M of[-1,1]){let g=new E(new Xe(e*.16,e*.92,10),m);g.position.set(M*e*.88,e*.48,0),g.rotation.z=-M*.62,g.rotation.x=-.18,s.add(g)}}let c=new E(new le(e*.46,e*.68,e*.34,16),o);c.position.y=e*.3,s.add(c);let h=new E(new Xe(e*.42,e*.56,16),t);h.position.y=e*.7,s.add(h);let d=new E(new se(e*.11,10,8),t);d.position.y=e*1,s.add(d);let p=r?14427686:i==="narasimha"?16096779:i==="krishna"?1096065:2282478,u=new E(new St(e*.16,0),new P({color:p,emissive:p,emissiveIntensity:.65,metalness:.25,roughness:.1}));if(u.position.set(0,e*.06,e*.84),s.add(u),i==="krishna"){let m=new E(new le(.012,.012,e*1.1,6),t);m.position.set(e*.28,e*.85,e*.12),m.rotation.z=-.35,s.add(m);let M=new E(new se(e*.2,12,10),new P({color:366185,emissive:959977,emissiveIntensity:.45}));M.scale.set(.85,1.3,.35),M.position.set(e*.46,e*1.32,e*.14),M.rotation.z=-.35,s.add(M)}n.add(s)}function id(n,e,t,i){let s=new P({color:1315098,roughness:.68}),r=new P({color:16776171,roughness:.22}),o=new P({color:4528669,metalness:.65,roughness:.32});for(let h of[-1,1]){let d=new E(new Xe(t*.14,t*.36,8),o);d.position.set(h*t*1.02,t*.04,0),d.rotation.z=-h*.95,n.add(d)}for(let h of[-1,1]){let d=new E(new ft(t*.055,t*.26,4,8),s);d.rotation.z=Math.PI*.5+h*.38,d.position.set(h*t*.19,-t*.2,t*.94),n.add(d);let p=new E(new Xe(t*.045,t*.19,8),r);p.position.set(h*t*.24,-t*.29,t*.92),p.rotation.z=-h*.22,n.add(p)}let a=new E(new Xe(t*.28,t*.54,10),s);a.rotation.x=Math.PI,a.position.set(0,-t*.72,t*.58),n.add(a);let l=new E(new X(t*.42,t*.075,t*.04),new P({color:14427686,emissive:8330525,emissiveIntensity:.4}));l.position.set(0,t*.26,t*.95),n.add(l);for(let h of[-1,1]){let d=new E(new se(.145,14,10,0,Math.PI*2,0,Math.PI*.58),i);d.scale.set(1.15,.82,1.05),d.position.set(h*.26,.57,.02),d.rotation.z=-h*.32,e.add(d)}let c=new E(new le(.275,.225,.34,16),o);c.position.set(0,.4,.015),e.add(c)}function sd(n,e,t,i,s,r,o,a,l,c,h){let d={pattaEnds:[]};if(!o)return d;let p=o==="narasimha"?12131356:o==="prahladChild"?16498468:l,u=o==="narasimha"||o==="vishnu"||o==="krishna"?16096779:a,m=new P({color:p,roughness:.46,metalness:.14,side:at}),M=new P({color:u,roughness:.5,metalness:.12});if(h&&t&&i){for(let R of[t,i]){let C=new E(new le(.122,.114,.28,14),M);C.position.y=-.14,C.castShadow=!0,R.add(C);let H=new E(new Ne(.114,.015,6,16),c);H.rotation.x=Math.PI/2,H.position.y=-.27,R.add(H)}let y=new E(new le(.06,.135,.42,12,1,!1,-Math.PI*.35,Math.PI*.7),M);y.position.set(0,.02,.16),e.add(y);let b=new E(new X(.055,.42,.02),c);b.position.set(0,.02,.21),e.add(b)}let g=new Zt([new L(-.28,.05,.18),new L(-.25,.48,.08),new L(0,.62,-.18),new L(.25,.48,.08),new L(.28,.05,.18)]),f=new E(new hn(g,24,.036,8,!1),m);f.castShadow=!0,e.add(f);for(let y of[-1,1]){let b=new E(new X(.08,.36,.015),m);b.position.set(y*.26,.16,.15),b.rotation.z=y*.12;let R=new E(new X(.085,.045,.018),c);R.position.y=-.16,b.add(R),e.add(b),d.pattaEnds.push(b)}let _=new E(new se(.055,10,8),new P({color:14427686,emissive:8330525,emissiveIntensity:.45}));_.scale.set(1.2,1,.55),_.position.set(0,.24,.235),e.add(_);let w=new E(new Ne(.17,.019,8,22),c);w.rotation.x=Math.PI/2+.38,w.position.set(0,.46,.08),e.add(w);for(let y of[s,r]){let b=new E(new Ne(.068,.016,8,16),c);b.rotation.x=Math.PI/2,b.position.y=-.18,y.add(b)}if(o==="vishnu"||o==="narasimha"){let y=new E(new St(.056,0),new P({color:14753096,emissive:10424889,emissiveIntensity:.65,metalness:.35,roughness:.14}));y.scale.set(1,1.25,.55),y.position.set(0,.44,.255),e.add(y)}if(o==="shiv"){let y=new E(new Ne(.098,.022,8,20),new P({color:2450411,emissive:1920728,emissiveIntensity:.72,roughness:.28}));y.rotation.x=Math.PI/2+.15,y.position.set(0,.64,.02),e.add(y);let b=new P({color:1976635,metalness:.35,roughness:.32}),R=new E(new Ne(.165,.026,8,22,Math.PI*1.48),b);R.rotation.x=Math.PI/2+.22,R.rotation.z=-.35,R.position.set(0,.59,.02),e.add(R);let C=new E(new se(.055,10,8),b);C.scale.set(.95,1.35,.55),C.position.set(.165,.68,.08),e.add(C);for(let x of[-.016,.016]){let I=new E(new se(.009,6,6),c);I.position.set(.165+x,.695,.11),e.add(I)}let H=new P({color:8138002,roughness:.62});for(let x=0;x<14;x++){let I=x/14*Math.PI*2,B=new E(new se(.022,8,6),H);B.position.set(Math.sin(I)*.155,.5-Math.cos(I)*.06,Math.cos(I)*.18),e.add(B)}let T=new P({color:2694420,roughness:.78});for(let[x,I,B]of[[-.14,.14,.22],[.12,.1,.23],[-.04,.02,.24],[.16,-.02,.18]]){let G=new E(new se(.036,8,6),T);G.scale.set(1.2,.7,.35),G.position.set(x,I,B),e.add(G)}}if(o==="narasimha"||o==="vishnu"||o==="krishna"||o==="ram"||o==="hanuman"){let b=new Zt([new L(-.18,.58,.11),new L(-.22,.22,.24),new L(0,-.02,.27),new L(.22,.22,.24),new L(.18,.58,.11)]).getPoints(18),R=new P({color:16710888,roughness:.55}),C=new P({color:16007006,roughness:.45});b.forEach((H,T)=>{let x=new E(new se(T%3===0?.038:.026,8,6),T%3===0?C:R);x.position.copy(H),e.add(x)})}if(o==="narasimha"||o==="vishnu"){let y=o==="vishnu"?6788331:14261851,b=new P({color:y,roughness:.44}),R=new P({color:16776693,emissive:16708551,emissiveIntensity:.2,metalness:.25,roughness:.2});if(o==="narasimha")for(let C of[s,r])for(let H=-2;H<=2;H++){let T=new E(new Xe(.012,.095,6),R);T.position.set(H*.022,-.31,.035),T.rotation.x=Math.PI+.35,C.add(T)}for(let C of[-1,1]){let H=new j;H.position.set(C*.27,.54,-.1),H.rotation.set(-.22,0,-C*.48),e.add(H);let T=new E(new ft(.056,.28,6,8),b);T.position.y=.22,H.add(T);let x=new j;if(x.position.set(0,.44,.02),H.add(x),C===1){let I=new j,B=new E(new Ne(.18,.025,8,24),new P({color:16498468,emissive:16096779,emissiveIntensity:.72,metalness:.85,roughness:.15}));I.add(B);for(let G=0;G<12;G++){let N=G/12*Math.PI*2,W=new E(new Xe(.026,.07,4),c);W.position.set(Math.cos(N)*.21,Math.sin(N)*.21,0),W.rotation.z=N-Math.PI/2,I.add(W)}x.add(I),d.chakraWheel=I}else{let I=new j,B=new P({color:16710888,emissive:16708551,emissiveIntensity:.18,roughness:.28}),G=new E(new Xe(.095,.26,14),B);G.rotation.x=.35,I.add(G);let N=new E(new Ne(.088,.015,6,14),c);N.rotation.x=Math.PI/2,I.add(N),x.add(I)}}}return d}function ud(n){let e=t=>t?{x:-t.x,y:t.y,z:t.z}:null;return{lShoulder:e(n.rShoulder),rShoulder:e(n.lShoulder),lElbow:e(n.rElbow),rElbow:e(n.lElbow),lWrist:e(n.rWrist),rWrist:e(n.lWrist),lHip:e(n.rHip),rHip:e(n.lHip),lKnee:e(n.rKnee),rKnee:e(n.lKnee),lAnkle:e(n.rAnkle),rAnkle:e(n.lAnkle),nose:e(n.nose),lEar:e(n.rEar),rEar:e(n.lEar)}}var fd=["devi","mata","durga","lakshmi","laxmi","saraswati","parvati","sita","radha","\u0926\u0947\u0935\u0940","\u092E\u093E\u0924\u093E","\u0926\u0941\u0930\u094D\u0917\u093E","\u0932\u0915\u094D\u0937\u094D\u092E\u0940","\u0938\u0930\u0938\u094D\u0935\u0924\u0940","\u092A\u093E\u0930\u094D\u0935\u0924\u0940","\u0938\u0940\u0924\u093E","\u0930\u093E\u0927\u093E"];function km(n,e){return e==="Warrior"||e==="KingCrown"||e==="BrainrotLog"||e==="CupDancer"||e==="CartoonTank"||e==="ComicBobble"||e!=="Narrator"&&(n==="Temple"||n==="ForestAshram"||n==="RiverGhat"||n==="Himalaya")?!0:n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="Battlefield"||n==="PalaceCourt"||n==="ModernCity"||n==="Village"||n==="Archive"}function oc(n){return n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="ModernCity"}function zm(n,e,t){let i=2907274,s=new Pe(t).getHex(),r=15250056,o=!1;switch(n){case"KingCrown":i=10036282,s=16105016;break;case"SageRishi":i=14247960,s=16638082;break;case"Divine":i=2974425,s=16767040,r=6000111,o=!0;break;case"ChildDevotee":i=15376156,s=14239782;break;case"NobleWoman":i=12725078,s=16303174;break;case"Warrior":i=7557683,s=12962774;break;case"BrainrotLog":i=10115880,s=16436245,r=12088894;break;case"CupDancer":i=16317180,s=16020150,r=16777215;break;case"CartoonTank":i=5078079,s=16436245,r=3560212;break;case"ComicBobble":i=16347926,s=3718648,r=15843995;break;default:i=3104660;break}return e&&/^#?[0-9a-fA-F]{6}$/.test(e.trim())&&(i=new Pe(e.startsWith("#")?e:`#${e}`).getHex()),{robe:i,sash:s,skin:r,isDivine:o}}function Vm(n,e,t,i){let s=[new be(n*.68,-.05),new be(n,.02),new be(n*.98,i*.22),new be(e,i*.48),new be(t,i*.82),new be(t*.62,i*.98),new be(.01,i)];return new si(s,24)}function Wm(n){let e=new j,t=new P({color:3876421,roughness:.45,metalness:.3}),i=new E(new le(.42,.48,.08,24),t);i.position.y=.04,i.receiveShadow=!0,i.castShadow=!0,e.add(i);let s=new P({color:16020150,emissive:n,emissiveIntensity:.22,roughness:.35});for(let a=0;a<12;a++){let l=a/12*Math.PI*2,c=new E(new se(.11,10,8),s);c.scale.set(1.2,.45,2),c.position.set(Math.cos(l)*.36,.08,Math.sin(l)*.36),c.rotation.y=-l+Math.PI*.5,c.rotation.x=.22,e.add(c)}let r=new Se({color:n,transparent:!0,opacity:.35,side:at,depthWrite:!1}),o=new E(new _n(.32,.52,32),r);return o.rotation.x=-Math.PI/2,o.position.y=.015,e.add(o),{group:e,glowMesh:o}}function Xm(n,e,t,i,s,r,o){let a=new P({color:1972516,roughness:.72}),l=new P({color:14277862,roughness:.6}),c=new P({color:16103470,metalness:.85,roughness:.22}),h=t.toLowerCase(),d=e==="SageRishi"&&(h.includes("narad")||h.includes("\u0928\u093E\u0930\u0926")),p=e==="NobleWoman"&&fd.some(M=>h.includes(M)),u=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|harishchandra|dashrath|yudhishthir|duryodhan|bali|bhasmasur|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य|हरिश्चंद्र|दशरथ|युधिष्ठिर|दुर्योधन|बलि/i.test(h);if(e==="KingCrown"&&!u&&(o==="turban"||i==="PalaceCourt"||/sartaaj|sufi|shayar|prince|dulha|singer/i.test(h))&&!/maharaj|raja|samrat|emperor/i.test(h)){let M=new E(new se(s*1.02,20,14,0,Math.PI*2,0,Math.PI*.42),a);M.rotation.x=-.32,n.add(M);let g=new j,f=i==="PalaceCourt"?16117734:r??10036282,_=new P({color:f,roughness:.62}),w=new E(new se(s*1.08,22,16,0,Math.PI*2,0,Math.PI*.52),_);w.scale.set(1.04,.78,1.06),w.position.set(0,s*.48,-s*.06),w.castShadow=!0,g.add(w);for(let H=0;H<3;H++){let T=new E(new Ne(s*(.94+(H===1?.04:0)),s*.105,10,24),H===1?_:new P({color:f,roughness:.55}));T.rotation.x=Math.PI/2-.28+H*.1,T.rotation.z=(H-1)*.14,T.position.set(0,s*(.6+H*.14),-s*.02),T.castShadow=!0,g.add(T)}let y=new E(new St(s*.15,0),c);y.position.set(s*.16,s*1.02,s*.74),g.add(y);let b=new E(new Xe(s*.12,s*.44,8),new P({color:16708551,emissive:14251782,emissiveIntensity:.25,roughness:.45}));b.position.set(s*.19,s*1.26,s*.64),b.rotation.z=-.2,b.rotation.x=-.16,g.add(b),n.add(g);let R=new E(new se(s*.46,14,10),a);R.scale.set(1.22,.65,.78),R.position.set(0,-s*.72,s*.54),n.add(R);let C=new E(new ft(s*.036,s*.28,4,8),a);C.rotation.z=Math.PI/2,C.position.set(0,-s*.2,s*.94),n.add(C);return}if(e==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(h)){let M=new P({color:3875604,roughness:.72}),g=new E(new se(s*1.04,20,14,0,Math.PI*2,0,Math.PI*.48),M);g.scale.set(1.02,1.12,1),g.rotation.x=-.34,n.add(g);let f=new E(new se(s*.46,16,14),M);f.scale.set(.88,1.32,.88),f.position.set(0,s*1.24,-s*.12),f.castShadow=!0,n.add(f);let _=new P({color:16317180,emissive:14742270,emissiveIntensity:.85,metalness:.45,roughness:.15}),w=new E(new Ne(s*.25,s*.048,8,20,Math.PI*1.22),_);w.position.set(-s*.36,s*1.12,s*.26),w.rotation.z=Math.PI*.68,w.rotation.y=.22,n.add(w);let y=new P({color:3718648,emissive:8246268,emissiveIntensity:.65,roughness:.18}),b=new Zt([new L(.02,s*1.62,-s*.08),new L(s*.22,s*1.78,-s*.16),new L(s*.42,s*1.48,-s*.34),new L(s*.48,s*.96,-s*.56)]);n.add(new E(new hn(b,16,s*.055,8,!1),y));let R=new E(new Ne(s*.42,s*.042,8,16),c);R.rotation.x=Math.PI/2,R.position.set(0,s*.96,-s*.12),n.add(R);return}if(e==="KingCrown"||e==="Divine"||e==="NobleWoman"&&(p||i!=="PalaceCourt"&&(h.includes("rani")||h.includes("\u0930\u093E\u0928\u0940")))){let M=new E(new se(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);M.scale.set(1.01,1.11,.99),M.rotation.x=-.34,n.add(M);let f=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/i.test(h)?"asuraKing":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/i.test(h)?"krishna":/ram|raghav|raghunath|राम|राघव/i.test(h)?"ram":e==="Divine"?"vishnu":"sacred";if(sc(n,s,c,f),e==="NobleWoman"){let _=new E(new ft(s*.22,s*1.4,8,12),a);_.position.set(0,-s*.85,-s*.82),_.rotation.x=.24,n.add(_)}return}if(e==="SageRishi"){let M=d?new P({color:2892339,roughness:.7}):l,g=new E(new se(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),M);g.scale.set(1.01,1.11,.99),g.rotation.x=-.36,n.add(g);let f=new E(new se(s*.42,14,12),M);if(f.scale.set(.9,1.15,.9),f.position.set(0,s*1.24,-s*.16),f.castShadow=!0,n.add(f),!d){let _=new E(new Xe(s*.52,s*.95,14),M);_.rotation.x=Math.PI,_.position.set(0,-s*.88,s*.48),n.add(_)}return}if(e==="ChildDevotee"){let M=new E(new se(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),a);M.scale.set(1.01,1.11,.99),M.rotation.x=-.36,n.add(M);let g=new E(new se(s*.22,10,8),a);if(g.scale.set(1.3,.65,.85),g.position.set(-s*.12,s*.78,s*.68),n.add(g),!oc(i)){let f=new E(new Ne(s*.9,s*.065,10,24),c);f.rotation.x=Math.PI/2-.34,f.position.set(0,s*.55,s*.06),n.add(f);let _=new E(new St(s*.13,0),new P({color:1096065,emissive:366185,emissiveIntensity:.6}));_.position.set(0,s*.62,s*.92),n.add(_)}return}if(e==="NobleWoman"){let M=new E(new se(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);M.scale.set(1.01,1.11,.99),M.rotation.x=-.34,n.add(M);let g=new E(new ft(s*.24,s*1.45,8,12),a);g.position.set(0,-s*.85,-s*.85),g.rotation.x=.25,n.add(g);let f=new E(new se(s*.1,10,8),c);f.position.set(0,s*.5,s*.94),n.add(f);return}if(e==="Warrior"){let M=new P({color:10594485,metalness:.78,roughness:.28}),g=new E(new se(s*1.05,20,14,0,Math.PI*2,0,Math.PI*.47),M);g.scale.set(1.02,1.12,1),g.rotation.x=-.32,n.add(g);let f=new E(new Ne(s*.7,s*.12,8,16,Math.PI),new P({color:14427686,roughness:.6}));f.rotation.y=Math.PI/2,f.position.y=s*.86,n.add(f);return}if(e==="ComicBobble"||oc(i)){let M=new j,g=new E(new se(s*1.06,20,14,0,Math.PI*2,0,Math.PI*.5),a);if(g.scale.set(1.04,1.15,1.05),g.position.set(0,s*.06,-s*.02),g.rotation.x=-.15,M.add(g),e==="ComicBobble"){for(let C of[-.35,0,.35]){let H=new E(new Xe(s*.15,s*.4,8),a);H.position.set(C*s*.85,s*1.14,s*.2),H.rotation.z=-C*.65,H.rotation.x=.24,M.add(H)}let R=new E(new se(s*.38,12,10),a);R.scale.set(1.38,.56,.98),R.position.set(0,s*.92,s*.52),M.add(R)}else{let R=new E(new se(s*.46,14,12),a);R.scale.set(1.48,.78,1.38),R.position.set(0,s*1.1,s*.36),M.add(R);let C=new E(new se(s*.36,12,10),a);C.scale.set(1.42,.54,.96),C.position.set(0,s*.92,s*.56),M.add(C);for(let H of[-1,1]){let T=new E(new Xe(s*.14,s*.34,8),a);T.position.set(H*s*.42,s*1.16,s*.26),T.rotation.z=-H*.48,T.rotation.x=.28,M.add(T)}}n.add(M);let f=new j;f.visible=!1;let _=new E(new Ne(s*.88,s*.11,8,22,Math.PI*1.15),a);_.rotation.x=Math.PI/2+.18,_.rotation.z=-Math.PI*.075,_.position.set(0,s*.16,-s*.1),f.add(_);let w=new E(new Xe(s*.06,s*.16,6),a);w.position.set(0,s*1.08,-s*.12),f.add(w);let y=new P({color:16775399,emissive:16770229,emissiveIntensity:.48,roughness:.1}),b=new E(new se(s*.25,12,10),y);return b.scale.set(1.3,.32,.92),b.position.set(.08*s,s*.92,s*.34),b.rotation.z=-.18,b.rotation.x=.28,f.add(b),n.add(f),{hairFullGroup:M,hairShavedGroup:f}}else{let M=new E(new se(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);M.scale.set(1.01,1.11,.99),M.rotation.x=-.35,n.add(M)}}function pd(n,e,t,i,s,r){let o=new P({color:16317180,roughness:.18}),a=new P({color:1971218,roughness:.12}),l=new P({color:t,roughness:.48}),c=new P({color:i,roughness:.55}),h=r?1.38:1,d=C=>{let H=C*e*(r?.38:.36),T=e*.09,x=s,I=new E(new se(e*.165*h,14,12),o);I.scale.set(1.06,.9,.56),I.position.set(H,T,x),n.add(I);let B=new E(new se(e*.098*(r?1.15:1),12,10),a);B.scale.set(1,.95,.62),B.position.set(H,T,x+e*.068*h),n.add(B);let G=new E(new se(e*.036*h,8,6),new Se({color:16777215}));G.position.set(H+e*.032,T+e*.035,x+e*.115*h),n.add(G);let N=new E(new se(e*.18*h,12,10,0,Math.PI*2,0,Math.PI*.52),l);N.scale.set(1.02,1.05,.65),N.position.set(H,T,x),N.rotation.x=-Math.PI*.48,n.add(N);let W=new E(new ft(e*.034*h,e*.22*h,4,8),c);return W.rotation.z=Math.PI/2,W.position.set(H,T+e*.25*h,x+e*.08*h),n.add(W),{sclera:I,pupil:B,eyelid:N,brow:W}},p=d(-1),u=d(1),m=new P({color:t,roughness:.45}),M=new E(new se(e*.085,10,8),m);M.scale.set(.8,1.15,.9),M.position.set(0,-e*.08,s+e*.065),n.add(M);let g=new P({color:16172100,metalness:.85,roughness:.22});for(let C of[-1,1]){let H=new E(new Ne(e*.085,e*.025,8,14),g);H.position.set(C*e*.94,-e*.14,e*.04),H.rotation.y=C*Math.PI*.42,n.add(H)}let f=-e*.36,_=s+e*.02,w=new E(new se(e*(r?.22:.16),12,10),new Se({color:5509406}));w.scale.set(1.1,.2,.45),w.position.set(0,f,_-.01),n.add(w);let y=new P({color:10896452,roughness:.42}),b=new E(new ft(e*.032,e*.22,4,8),y);b.rotation.z=Math.PI/2,b.position.set(0,f+e*.03,_+.03),n.add(b);let R=new E(new ft(e*.034,e*.19,4,8),y);return R.rotation.z=Math.PI/2,R.position.set(0,f-e*.03,_+.03),n.add(R),{leftEye:p,rightEye:u,mouthCavity:w,upperLip:b,lowerLip:R,mouthBaseY:f}}function Ym(n,e,t,i,s,r,o,a){let l=new j,c=new j;l.add(c);let h=new E(new _n(.46,.58,36),new Se({color:a,transparent:!0,opacity:.22,side:at,depthWrite:!1}));h.rotation.x=-Math.PI/2,h.position.y=.012,l.add(h);let d=new E(new yt(.45,32),new Se({color:a,transparent:!0,opacity:.08,side:at,depthWrite:!1}));d.rotation.x=-Math.PI/2,d.position.y=.01,l.add(d);let p=new P({color:s,roughness:.48,metalness:n==="CartoonTank"?.35:.06}),u=new P({color:r,roughness:.35,metalness:.35}),m=new P({color:2042167,roughness:.72}),M=new j,g=n==="CartoonTank"?.26:.44;M.position.y=g,c.add(M);let f=new j,_,w,y,b,R;if(n==="CartoonTank"){for(let Ae of[-.36,.36]){let q=new E(new X(.22,.26,.92),m);q.position.set(Ae,-.1,0),q.castShadow=!0,M.add(q);for(let ie of[-.3,0,.3]){let Ee=new E(new le(.11,.11,.25,12),u);Ee.rotation.z=Math.PI/2,Ee.position.set(Ae,-.12,ie),M.add(Ee)}}let te=new E(new X(.68,.3,.84),p);te.position.set(0,.14,0),te.castShadow=!0,M.add(te),_=new j,_.position.set(0,.42,-.02),M.add(_);let ue=new E(new X(.56,.34,.56),p);ue.castShadow=!0,_.add(ue);let we=new E(new X(.58,.07,.58),u);we.position.y=-.1,_.add(we),w=new E(new le(.065,.08,.66,14),m),w.rotation.x=Math.PI/2,w.position.set(0,.04,.5),w.castShadow=!0,_.add(w),f.position.set(0,.1,0),_.add(f)}else if(n==="BrainrotLog"){let te=q=>{let ie=new j;ie.position.set(q*.14,-.05,0),M.add(ie);let Ee=new E(new ft(.065,.28,6,8),p);Ee.position.set(0,-.17,0),ie.add(Ee);let me=new E(new se(.1,10,8),u);return me.scale.set(.9,.5,1.5),me.position.set(0,-.34,.05),ie.add(me),ie};b=te(-1),R=te(1);let ue=new E(new le(.21,.25,.96,18),p);ue.position.y=.44,ue.castShadow=!0,M.add(ue);let we=new E(new le(.18,.18,.04,16),new P({color:16639626}));we.position.y=.93,M.add(we);let Ae=new E(new le(.025,.04,.18,8),p);Ae.position.set(.06,1,0),Ae.rotation.z=-.35,M.add(Ae),f.position.set(0,.72,0),M.add(f)}else{let te=ie=>{let Ee=new j;Ee.position.set(ie*.13,-.05,0),M.add(Ee);let me=new E(new ft(.055,.3,6,8),m);me.position.set(0,-.17,0),Ee.add(me);let oe=new E(new se(.095,10,8),u);return oe.scale.set(.95,.5,1.45),oe.position.set(0,-.34,.05),Ee.add(oe),Ee};b=te(-1),R=te(1);let ue=new E(new le(.32,.22,.62,24),p);ue.position.y=.34,ue.castShadow=!0,M.add(ue);let we=new E(new Ne(.315,.025,10,24),u);we.rotation.x=Math.PI/2,we.position.y=.65,M.add(we);let Ae=new E(new yt(.295,24),new P({color:4137748,roughness:.2}));Ae.rotation.x=-Math.PI/2,Ae.position.y=.62,M.add(Ae);let q=new E(new Ne(.14,.034,8,16,Math.PI),p);q.rotation.z=-Math.PI/2,q.position.set(-.3,.36,0),M.add(q),f.position.set(0,.42,0),M.add(f)}let T=pd(f,n==="CartoonTank"?.26:.24,o,1120295,n==="CartoonTank"?.29:n==="CupDancer"?.28:.21,!0),x=n==="CupDancer"?new P({color:16777215,roughness:.4}):p,I=new ft(.048,.2,6,8),B=new ft(.042,.18,6,8),G=te=>{let ue=new j;ue.position.set(te*(n==="CartoonTank"?.33:.27),n==="CartoonTank"?.24:.45,0),M.add(ue);let we=new E(I,x);we.position.y=-.11,ue.add(we);let Ae=new j;Ae.position.y=-.22,ue.add(Ae);let q=new E(B,x);q.position.y=-.1,Ae.add(q);let ie=new E(new se(.068,10,8),u);return ie.position.y=-.22,Ae.add(ie),{shoulder:ue,elbow:Ae,glove:ie}},N=G(-1),W=G(1),z=new j;z.position.set(0,-.25,.06);let J=new E(new le(.11,.07,.08,14),new P({color:16317180,roughness:.35}));z.add(J);let U=new E(new se(.075,10,8),new P({color:16707722,roughness:.45}));U.scale.set(1.1,.55,1.1),U.position.y=.035,z.add(U),z.visible=!1,W.elbow.add(z);let Q=ic(W.elbow,N.elbow,M);if(n==="BrainrotLog"){y=new j,y.position.set(0,-.22,.04);let te=new E(new le(.065,.025,.65,10),new P({color:14251782,roughness:.45}));te.position.y=-.28,te.castShadow=!0,y.add(te),W.elbow.add(y)}return l.rotation.y=t*.36,{root:l,bodyPivot:c,torsoGroup:M,headPivot:f,leftShoulder:N.shoulder,leftElbow:N.elbow,rightShoulder:W.shoulder,rightElbow:W.elbow,leftHip:b,rightHip:R,snackProp:z,handProps:Q,headY:n==="CartoonTank"?.78:n==="CupDancer"?.86:1.16,leftEyelid:T.leftEye.eyelid,rightEyelid:T.rightEye.eyelid,leftBrow:T.leftEye.brow,rightBrow:T.rightEye.brow,leftSclera:T.leftEye.sclera,rightSclera:T.rightEye.sclera,leftPupil:T.leftEye.pupil,rightPupil:T.rightEye.pupil,mouthCavity:T.mouthCavity,upperLip:T.upperLip,lowerLip:T.lowerLip,auraRing:h,auraDisc:d,turretGroup:_,cannonBarrel:w,propPivot:y,mouthBaseY:T.mouthBaseY,baseTorsoY:g,restScale:1,topY:n==="CartoonTank"?1.05:n==="CupDancer"?1.14:1.54,role:n,name:e,facingSign:t,standing:!0,seedOffset:i}}function Sa(n,e,t,i,s){let r=n.role,o=km(t,r),a=zm(r,n.robeHex,e),{isDivine:l}=a,c=new Pe(e);if(r==="BrainrotLog"||r==="CupDancer"||r==="CartoonTank")return Ym(r,n.name,i,s,a.robe,a.sash,a.skin,c);let h=new j,d=new j;h.add(d);let u=oc(t),m=ed(r,n.name,t,u),M=td(m,a),g=M.robe,f=M.sash,_=M.skin,w=m?M.scale:r==="ChildDevotee"?.82:1;d.scale.setScalar(w);let y=new P({color:g,roughness:.58,metalness:.08}),b=new P({color:new Pe(g).multiplyScalar(.75),roughness:.65}),R=new P({color:f,roughness:.42,metalness:.25}),C=new P({color:_,roughness:.48,metalness:.02}),H=new P({color:16236088,metalness:.85,roughness:.22}),T=new E(new _n(.46,.58,36),new Se({color:c,transparent:!0,opacity:u?0:.22,side:at,depthWrite:!1}));T.rotation.x=-Math.PI/2,T.position.y=.012,T.visible=!u,h.add(T);let x=new E(new yt(.45,32),new Se({color:c,transparent:!0,opacity:u?0:.08,side:at,depthWrite:!1}));x.rotation.x=-Math.PI/2,x.position.y=.01,x.visible=!u,h.add(x);let I,B,G,N,W,z=.14,J=u?new P({color:i>0?1976635:3223169,roughness:.72}):b;if(o){z=.66;let Te=new E(new se(.245,16,12),J);Te.scale.set(1.06,.65,.88),Te.position.set(0,z-.01,0),Te.castShadow=!0,d.add(Te);let fe=new ft(.104,.2,6,10),Ve=new ft(.092,.18,6,10),Fe=new P({color:u?16317180:3875862,roughness:.45}),Ze=Z=>{let ee=new j;ee.position.set(Z*.13,z-.04,0),d.add(ee);let _e=new E(fe,J);_e.position.set(0,-.15,0),_e.castShadow=!0,_e.receiveShadow=!0,ee.add(_e);let ve=new j;ve.position.set(0,-.3,0),ee.add(ve);let We=new E(Ve,J);We.position.set(0,-.14,0),We.castShadow=!0,We.receiveShadow=!0,ve.add(We);let rt=new E(new se(.105,12,8),Fe);return rt.scale.set(.95,.55,1.55),rt.position.set(0,-.265,.05),rt.castShadow=!0,ve.add(rt),{hip:ee,knee:ve}},F=Ze(-1),pe=Ze(1);B=F.hip,N=F.knee,G=pe.hip,W=pe.knee}else{let Te=Wm(c);I=Te.glowMesh,d.add(Te.group),z=.15;let fe=new E(new se(.36,20,12),b);fe.scale.set(1.15,.45,.92),fe.position.set(0,z+.06,.03),fe.castShadow=!0,fe.receiveShadow=!0,d.add(fe)}let U=new j;U.position.y=z,d.add(U);let Q=Vm(.28,.21,.27,.62),te=m==="narasimha"||m==="hanuman"||m==="shiv"||m==="vishnu"||m==="krishna"||m==="ram",ue=new E(Q,te?C:y);if(ue.castShadow=!0,ue.receiveShadow=!0,U.add(ue),u){let Te=new E(new Ne(.132,.026,8,20),R);Te.rotation.x=Math.PI/2+.2,Te.position.set(0,.58,.03),U.add(Te);let fe=new E(new Ne(.255,.022,8,22),new P({color:988970,roughness:.65}));fe.rotation.x=Math.PI/2,fe.position.y=.04,U.add(fe)}else{if(t!=="PalaceCourt"){let Ve=new Zt([new L(-.16,.55,.1),new L(-.02,.39,.21),new L(.18,.22,.14),new L(.14,.18,-.16)]),Fe=new E(new hn(Ve,18,.024,8,!1),R);Fe.castShadow=!0,U.add(Fe)}let Te=new E(new Ne(.22,.022,8,22),H);Te.rotation.x=Math.PI/2,Te.position.y=.24,U.add(Te);let fe=new E(new Ne(.142,.018,8,20),H);if(fe.rotation.x=Math.PI/2+.25,fe.position.set(0,.57,.04),U.add(fe),o&&r==="NobleWoman"){let Ve=[new be(.18,.25),new be(.24,.08),new be(.36,-.18),new be(.45,-.44),new be(.42,-.46)],Fe=new si(Ve,28),Ze=new P({color:g,roughness:.45,metalness:.14,side:at}),F=new E(Fe,Ze);F.castShadow=!0,F.receiveShadow=!0,U.add(F);let pe=new E(new Ne(.44,.024,8,32),H);pe.rotation.x=Math.PI/2,pe.position.y=-.44,U.add(pe)}else if(o&&r==="KingCrown"&&(!m||m==="genericSacred")&&(t==="PalaceCourt"||n.attire==="turban")){let Ve=[new be(.22,.24),new be(.27,.02),new be(.31,-.26),new be(.32,-.34)],Fe=new E(new si(Ve,24),new P({color:g,roughness:.5,metalness:.12,side:at}));Fe.castShadow=!0,U.add(Fe);for(let Ze=0;Ze<4;Ze++){let F=new E(new se(.022,8,8),H);F.position.set(0,.5-Ze*.075,Ze<2?.248:.225),U.add(F)}}}let we=n.name.toLowerCase();if(r==="SageRishi"&&(we.includes("narad")||we.includes("\u0928\u093E\u0930\u0926"))){let Te=new j,fe=new P({color:9584654,roughness:.42}),Ve=new E(new le(.025,.025,.85,10),fe);Ve.rotation.z=-.68,Te.add(Ve);let Fe=new E(new se(.11,14,10),fe);Fe.position.set(-.26,-.32,.04),Te.add(Fe);let Ze=new E(new se(.08,12,10),fe);Ze.position.set(.24,.3,.04),Te.add(Ze),Te.position.set(0,.34,.28),U.add(Te)}else if(r==="Warrior"){let Te=new E(new le(.22,.22,.04,20),H);Te.rotation.x=Math.PI/2,Te.position.set(-.34,.28,.08),U.add(Te);let fe=new E(new le(.016,.016,1.45,8),new P({color:7029795}));fe.position.set(.36,.55,.02),U.add(fe);let Ve=new E(new Xe(.04,.14,8),new P({color:14870768,metalness:.85}));Ve.position.set(.36,1.32,.02),U.add(Ve)}let Ae=new ft(.072,.21,6,10),q=new ft(.06,.19,6,10),ie=te||m==="asuraKing"?C:y,Ee=Te=>{let fe=new j;fe.position.set(Te*.245,.52,0),U.add(fe);let Ve=new E(new se(.088,12,10),ie);Ve.castShadow=!0,fe.add(Ve);let Fe=new E(Ae,ie);Fe.position.y=-.13,Fe.castShadow=!0,fe.add(Fe);let Ze=new j;Ze.position.y=-.26,fe.add(Ze);let F=new E(new se(.062,10,8),ie);F.castShadow=!0,Ze.add(F);let pe=new E(q,ie);pe.position.y=-.115,pe.castShadow=!0,Ze.add(pe);let Z=new E(new se(.066,12,10),C);return Z.scale.set(.95,1.15,.8),Z.position.y=-.24,Z.castShadow=!0,Ze.add(Z),{shoulder:fe,elbow:Ze}},me=Ee(-1),oe=Ee(1),Ce=sd(d,U,B,G,me.elbow,oe.elbow,m,g,f,H,o),$=new j;$.position.set(0,-.25,.06);let Me=new E(new le(.11,.07,.08,14),new P({color:16317180,roughness:.35}));$.add(Me);let ge=new E(new se(.075,10,8),new P({color:16707722,roughness:.45}));ge.scale.set(1.1,.55,1.1),ge.position.y=.035,$.add(ge),$.visible=!1,oe.elbow.add($);let ye=ic(oe.elbow,me.elbow,U),S=r==="ComicBobble"?.345:r==="ChildDevotee"?.265:.245,ce=new E(new le(.075,.095,.14,14),C);ce.position.y=.65,U.add(ce);let ae=new j;ae.position.y=.68+S*.92,U.add(ae);let He,Ge=S*.08,Ke,Ue,D,v,k,ne,he,re,Ie;if(m==="narasimha"){let Te=nd(ae,S,_);Ie=Te,re=Te.lowerJawPivot}else{let Te=new E(new se(S,26,20),C);Te.scale.set(.98,1.08,.95),Te.castShadow=!0,Te.receiveShadow=!0,ae.add(Te);let fe=new E(new se(S*.14,10,8),C);fe.scale.set(.85,1.05,1.2),fe.position.set(0,-S*.04,S*.94),ae.add(fe);for(let F of[-1,1]){let pe=new E(new se(S*.18,10,8),C);if(pe.scale.set(.5,1.2,.8),pe.position.set(F*S*.96,-S*.04,0),ae.add(pe),!u){let Z=new E(new Ne(S*.1,S*.025,8,14),H);Z.rotation.y=Math.PI/2,Z.position.set(F*S*.98,-S*.2,.01),ae.add(Z)}}let Ve=F=>{let pe=new E(new se(S*.19,10,8),new Se({color:15680580,transparent:!0,opacity:0,depthWrite:!1}));return pe.scale.set(1.2,.75,.35),pe.position.set(F*S*.56,-S*.16,S*.84),ae.add(pe),pe};if(Ke=u?Ve(-1):void 0,Ue=u?Ve(1):void 0,u){let F=new Se({color:3718648,transparent:!0,opacity:.92,depthWrite:!1}),pe=ve=>{let We=new E(new se(S*.056,8,8),F);return We.scale.set(.75,1.38,.46),We.position.set(ve*S*.34,-S*.02,S*.93),We.visible=!1,ae.add(We),We};D=pe(-1),v=pe(1),k=new j;let Z=new E(new se(S*.075,8,8),F);Z.scale.set(.85,1.05,.55);let ee=new E(new Xe(S*.068,S*.14,8),F);ee.position.y=S*.085,k.add(Z,ee),k.position.set(S*.58,S*.42,S*.8),k.visible=!1,ae.add(k),ne=new j;let _e=new Se({color:15680580});for(let[ve,We,rt]of[[.45,-S*.055,S*.045],[-.45,S*.055,S*.045],[-.45,-S*.055,-S*.045],[.45,S*.055,-S*.045]]){let xt=new E(new X(S*.11,S*.032,S*.03),_e);xt.rotation.z=ve,xt.position.set(We,rt,0),ne.add(xt)}ne.position.set(-S*.46,S*.44,S*.86),ne.visible=!1,ae.add(ne)}if(u){He=new j,He.position.set(0,Ge,S*.97);let F=new P({color:988970,metalness:.45,roughness:.25}),pe=new Se({color:12248829,transparent:!0,opacity:.24}),Z=new E(new X(S*1.18,S*.09,S*.05),F);Z.position.set(0,S*.16,.01),He.add(Z);for(let _e of[-1,1]){let ve=new E(new Ne(S*.19,S*.028,8,18),F);ve.position.set(_e*S*.36,0,0),He.add(ve);let We=new E(new yt(S*.175,16),pe);We.position.set(_e*S*.36,0,-.005),He.add(We);let rt=new E(new X(S*.03,S*.035,S*.92),F);rt.position.set(_e*S*.56,S*.11,-S*.44),He.add(rt)}let ee=new E(new le(S*.022,S*.022,S*.36,6),F);ee.rotation.z=Math.PI/2,ee.position.set(0,S*.02,0),He.add(ee),He.visible=n.hasGlasses!==void 0&&n.hasGlasses!==null?!!n.hasGlasses:i>0,ae.add(He)}if(r==="NobleWoman"){let F=new E(new se(S*.08,10,8),new P({color:14427686,roughness:.4}));F.scale.z=.4,F.position.set(0,S*.24,S*.96),ae.add(F)}else if(r==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(we)){let F=new P({color:16317180,emissive:14870768,emissiveIntensity:.45,roughness:.6});for(let ee of[-.045,0,.045]){let _e=new E(new X(S*.36,S*.025,S*.04),F);_e.position.set(0,S*(.28+ee),S*.95),ae.add(_e)}let pe=new E(new ft(S*.028,S*.09,4,8),new P({color:16096779,emissive:14427686,emissiveIntensity:.65}));pe.position.set(0,S*.42,S*.965),ae.add(pe);let Z=new E(new se(S*.045,8,8),new P({color:14427686}));Z.position.set(0,S*.28,S*.975),ae.add(Z)}else if(m==="vishnu"||m==="krishna"||m==="ram"){let F=new P({color:16710888,emissive:16708551,emissiveIntensity:.25}),pe=new P({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let ee of[-1,1]){let _e=new E(new X(S*.042,S*.28,S*.04),F);_e.position.set(ee*S*.072,S*.36,S*.955),_e.rotation.z=-ee*.09,ae.add(_e)}let Z=new E(new ft(S*.022,S*.2,4,8),pe);Z.position.set(0,S*.36,S*.97),ae.add(Z)}else if(r!=="Warrior"&&!u&&m!=="asuraKing"){let F=new E(new ft(S*.036,S*.16,4,8),new P({color:r==="Divine"?16498468:15357964,emissive:8138002,emissiveIntensity:.2}));F.position.set(0,S*.28,S*.95),ae.add(F)}he=Xm(ae,r,n.name,t,S,g,n.attire),m==="asuraKing"&&id(ae,U,S,H);let Fe=r==="SageRishi"?14277862:1840930,Ze=r==="ComicBobble"||t==="DoorwaySet"||t==="SkyGauntlet";Ie=pd(ae,S,_,Fe,S*.85,Ze)}let Re,Be,et=r==="NobleWoman"&&fd.some(Te=>we.includes(Te));if(l||r==="SageRishi"||et||m==="narasimha"){Re=new j,Re.position.set(0,.04,-S*(m==="narasimha"?.92:.72)),Be=new Se({color:l||m==="narasimha"?16769126:c,transparent:!0,opacity:l||m==="narasimha"?.65:.28,side:at,depthWrite:!1});let Te=new E(new _n(S*1.45,S*1.62,32),Be);Re.add(Te);for(let fe=0;fe<8;fe++){let Ve=new E(new nt(S*.08,S*.45),Be),Fe=fe/8*Math.PI*2;Ve.position.set(Math.cos(Fe)*S*1.54,Math.sin(Fe)*S*1.54,0),Ve.rotation.z=Fe+Math.PI/2,Re.add(Ve)}ae.add(Re)}h.rotation.y=i*.42;let xe=z+.68+S*.92,Oe=(o?xe:1.04)*w,Ye=(o?xe+S*1.48:1.4)*w;return{root:h,bodyPivot:d,torsoGroup:U,headPivot:ae,leftShoulder:me.shoulder,leftElbow:me.elbow,rightShoulder:oe.shoulder,rightElbow:oe.elbow,leftHip:B,rightHip:G,leftKnee:N,rightKnee:W,snackProp:$,handProps:ye,headY:Oe,leftEyelid:Ie.leftEye.eyelid,rightEyelid:Ie.rightEye.eyelid,leftBrow:Ie.leftEye.brow,rightBrow:Ie.rightEye.brow,leftSclera:Ie.leftEye.sclera,rightSclera:Ie.rightEye.sclera,leftPupil:Ie.leftEye.pupil,rightPupil:Ie.rightEye.pupil,mouthCavity:Ie.mouthCavity,upperLip:Ie.upperLip,lowerLip:Ie.lowerLip,glassesGroup:He,glassesBaseY:Ge,hairFullGroup:he?.hairFullGroup,hairShavedGroup:he?.hairShavedGroup,leftCheekFlush:Ke,rightCheekFlush:Ue,leftTearBead:D,rightTearBead:v,sweatDropGroup:k,angerMarkGroup:ne,haloGroup:Re,haloMaterial:Be,auraRing:T,auraDisc:x,pedestalGlow:I,chakraWheel:Ce.chakraWheel,lowerJawPivot:re,pattaEnds:Ce.pattaEnds,isNarasimha:m==="narasimha",isAsuraKing:m==="asuraKing",isHolika:/holika|होलिका/i.test(n.name),mouthBaseY:Ie.mouthBaseY,baseTorsoY:o?.66:.15,restScale:w,topY:Ye,role:r,name:n.name,facingSign:i,standing:o,hasFloorAura:!u,seedOffset:s}}var rd=(n,e,t)=>n+(e-n)*t,od=n=>{let e=Math.max(0,Math.min(1,n));return e*e*(3-2*e)};function qm(n,e,t="dancing",i=!1,s=0){let r=i?-1:1;if(e==="viralBounce"){let m=Math.abs(Math.sin(n*7.2)),M=Math.sin(n*3.6);return{hipOffsetX:M*.14*r,liftY:Math.pow(m,2.4)*.06,bodyRotY:Math.sin(n*1.8)*.24*r,bodyRotZ:M*.08*r,torsoRotX:.06+m*.06,torsoRotY:-M*.14*r,torsoRotZ:-M*.07*r,headRotZ:M*.1*r,leftHipX:-m*.24+M*.16,rightHipX:-m*.24-M*.16,leftKneeX:m*.44,rightKneeX:m*.44,leftShoulder:[-.95+M*.55,.22*r,.52*r],leftElbow:[-.85+m*.35,0,.22*r],rightShoulder:[-.95-M*.55,-.22*r,-.52*r],rightElbow:[-.85+m*.35,0,-.22*r]}}let o=e==="bhangra"?1.32:.92,a=n*o%4,l=t==="adaab"?0:t==="sufiSpin"?3:Math.floor(a),c=t==="dancing"?a-Math.floor(a):n*o%1,h=s>0?Math.pow(1-s,2)*.16:Math.abs(Math.sin(n*Math.PI*o*2))*.14,d=Math.sin(c*Math.PI*2);if(l===0){let m=od(Math.sin(c*Math.PI));return{hipOffsetX:-.09*r*m,liftY:0,bodyRotY:.16*r*m,bodyRotZ:.04*r*m,torsoRotX:.09*m,torsoRotY:-.12*r*m,torsoRotZ:-.07*r*m,headRotZ:.1*r*m,leftHipX:-.14-h*.25,rightHipX:-.06-h*.15,leftKneeX:.24+h*.55,rightKneeX:.12+h*.35,leftShoulder:[-.78*m-.24,.28*r,(.42+.18*m)*r],leftElbow:[-.48-.28*m,0,-.18*r],rightShoulder:[rd(-.45,-1.42,m),-.32*r,(-.36-.16*m)*r],rightElbow:[rd(-.55,-1.28,m),0,.24*m*r]}}if(l===1){let m=Math.sin(c*Math.PI*2);return{hipOffsetX:m*.15*r,liftY:0,bodyRotY:m*.22*r,bodyRotZ:m*.05*r,torsoRotX:.05,torsoRotY:-m*.22*r,torsoRotZ:-m*.09*r,headRotZ:m*.14*r,leftHipX:-.16+Math.max(0,m)*.18,rightHipX:-.16+Math.max(0,-m)*.18,leftKneeX:.26+Math.abs(m)*.24+h,rightKneeX:.26+Math.abs(m)*.24+h,leftShoulder:[-1.18+m*.52,.32*r,(.58+m*.32)*r],leftElbow:[-.72+Math.cos(c*Math.PI*2)*.35,0,.26*r],rightShoulder:[-1.18-m*.52,-.32*r,(-.58+m*.32)*r],rightElbow:[-.72-Math.cos(c*Math.PI*2)*.35,0,-.26*r]}}if(l===2){let m=d,M=e==="bhangra"?.35:0;return{hipOffsetX:m*.16*r,liftY:e==="bhangra"?Math.max(0,Math.abs(m)-.6)*.12:0,bodyRotY:m*.2*r,bodyRotZ:m*.06*r,torsoRotX:.08+h*.25,torsoRotY:-m*.18*r,torsoRotZ:-m*.07*r,headRotZ:m*.11*r,leftHipX:-.12+m*.28,rightHipX:-.12-m*.28,leftKneeX:.2+Math.max(0,-m)*.48+h,rightKneeX:.2+Math.max(0,m)*.48+h,leftShoulder:[-1.45-M+m*.38,.24*r,(.64+m*.24)*r],leftElbow:[-.88+m*.24,0,.18*r],rightShoulder:[-1.05-M-m*.42,-.24*r,(-.52+m*.24)*r],rightElbow:[-.88-m*.24,0,-.18*r]}}let p=od(c),u=Math.sin(p*Math.PI);return{hipOffsetX:Math.sin(p*Math.PI)*.08*r,liftY:e==="bhangra"?u*.08:0,bodyRotY:p*Math.PI*2*r,bodyRotZ:.04*r*u,torsoRotX:-.05*u,torsoRotY:0,torsoRotZ:0,headRotZ:-.08*r*u,leftHipX:-.12,rightHipX:-.12,leftKneeX:.22+h*.4,rightKneeX:.22+h*.4,leftShoulder:[-1.55-.35*u,.28*r,(.68+.32*u)*r],leftElbow:[-.42-.22*u,0,.24*r],rightShoulder:[-1.55-.35*u,-.28*r,(-.68-.32*u)*r],rightElbow:[-.42-.22*u,0,-.24*r]}}function md(n,e=0){let t=eE(n);n.bodyPivot.position.y=0,n.bodyPivot.updateMatrixWorld(!0);let i=1/0;for(let r of[t.left,t.right])r&&(r.getWorldPosition(rc),n.root.worldToLocal(rc),i=Math.min(i,rc.y));let s=Number.isFinite(i)?Math.max(-.55,Math.min(.45,-i)):0;n.bodyPivot.position.y=s+Math.max(0,Math.min(.6,e))}function ba(n,e,t,i=0,s=!1,r=0,o=.5){let a=e+r,l=qm(a,t,"dancing",s,i);n.bodyPivot.scale.setScalar(n.restScale),n.bodyPivot.position.x=l.hipOffsetX,n.bodyPivot.rotation.set(0,l.bodyRotY,l.bodyRotZ),n.torsoGroup.position.y=n.baseTorsoY+Math.sin(a*3)*.01,n.torsoGroup.rotation.set(l.torsoRotX,l.torsoRotY,l.torsoRotZ),n.headPivot.rotation.set(0,Math.sin(a*1.4)*.08,l.headRotZ),n.leftShoulder.rotation.set(l.leftShoulder[0],l.leftShoulder[1],l.leftShoulder[2]),n.leftElbow.rotation.set(l.leftElbow[0],l.leftElbow[1],l.leftElbow[2]),n.rightShoulder.rotation.set(l.rightShoulder[0],l.rightShoulder[1],l.rightShoulder[2]),n.rightElbow.rotation.set(l.rightElbow[0],l.rightElbow[1],l.rightElbow[2]),n.leftHip&&n.leftHip.rotation.set(l.leftHipX,0,0),n.rightHip&&n.rightHip.rotation.set(l.rightHipX,0,0),n.leftKnee&&n.leftKnee.rotation.set(l.leftKneeX,0,0),n.rightKnee&&n.rightKnee.rotation.set(l.rightKneeX,0,0),md(n,l.liftY);let c=.22+o*.35,h=a*.31%1>.96;n.leftEyelid.rotation.x=h?.14:-Math.PI*.52,n.rightEyelid.rotation.x=h?.14:-Math.PI*.52,n.mouthCavity.scale.set(1.15,.12+c*.45,.5),n.upperLip.position.y=n.mouthBaseY+c*.02,n.lowerLip.position.y=n.mouthBaseY-c*.04}function mr(n,e,t){let i=t+n.seedOffset;e.joints?tE(n,e,e.joints):(n.bodyPivot.position.x=e.hipOffsetX,n.bodyPivot.position.y=Math.max(0,e.hipBounceY),n.torsoGroup.position.y=n.baseTorsoY+Math.sin(i*3)*.012,n.torsoGroup.rotation.x=e.torsoTiltX,n.torsoGroup.rotation.z=e.torsoTiltZ,n.headPivot.rotation.z=e.headTiltZ,n.headPivot.rotation.y=e.headYawY,n.leftShoulder.rotation.set(-.22,.1,e.leftShoulderZ),n.leftElbow.rotation.set(-.18,0,e.leftElbowZ),n.rightShoulder.rotation.set(-.22,-.1,e.rightShoulderZ),n.rightElbow.rotation.set(-.18,0,e.rightElbowZ),n.turretGroup&&(n.turretGroup.rotation.y=e.headYawY*1.3)),n.propPivot&&(n.propPivot.rotation.z=e.joints?0:e.rightElbowZ*.5);let s=e.emotion??"happy",r=s==="surprised"?1.32:s==="angry"?1.15:1.05;n.leftSclera.scale.set(r,r*1.05,.6*r),n.rightSclera.scale.set(r,r*1.05,.6*r);let o=i*.31%1>.96;n.leftEyelid.rotation.x=o?.14:-Math.PI*.52,n.rightEyelid.rotation.x=o?.14:-Math.PI*.52;let a=e.mouthOpen??.25;n.mouthCavity.scale.set(1.15,.12+a*.45,.5),n.upperLip.position.y=n.mouthBaseY+a*.02,n.lowerLip.position.y=n.mouthBaseY-a*.04;let l=n.auraRing.material,c=n.auraDisc.material;l.opacity=.52+.14*Math.sin(i*5.2),c.opacity=.18}var Zm=new L(0,-1,0),Jm=new L(0,1,0),Ed=new L(1,0,0),pr=new vt,Km=new vt().setFromAxisAngle(Ed,-.3),$m=new vt().setFromEuler(new Wt(-.1,0,-.18)),Qm=new vt().setFromEuler(new Wt(-.1,0,.18)),jm=new vt().setFromEuler(new Wt(-.25,0,0)),ad=new vt,va=new vt,An=new vt,ld=new vt,_a=new vt,cd=new vt,Jt=new L,Rn=new L,zn=new L,tn=new L,fr=new L,rc=new L,wa=new ut,hd=new WeakMap;function eE(n){let e=hd.get(n);if(!e){let t=(i,s)=>{let r=s??i;if(!r)return null;let o=new wt;return o.position.set(0,s?-.323:-.39,.04),r.add(o),o};e={left:t(n.leftHip,n.leftKnee),right:t(n.rightHip,n.rightKnee)},hd.set(n,e)}return e}function gd(n,e,t){return e.getWorldQuaternion(t),n.root.getWorldQuaternion(ad).invert(),t.premultiply(ad)}function Ta(n,e,t){t>=1?n.quaternion.copy(e):n.quaternion.slerp(e,t)}function ms(n,e,t,i,s){gd(n,e.parent,va).invert(),fr.copy(t).applyQuaternion(va),fr.y>.985&&(fr.x+=.07*i,fr.normalize()),An.setFromUnitVectors(Zm,fr),Ta(e,An,s)}function Es(n,e,t){if(!n||!e)return!1;t.set(e.x-n.x,e.y-n.y,e.z-n.z);let i=t.length();return i<1e-4?!1:(t.divideScalar(i),!0)}function dd(n,e){let t=2*Math.acos(Math.min(1,Math.abs(n.w)));t<=e||(ld.copy(n),n.copy(pr).slerp(ld,e/t))}function gs(n,e,t){n&&n.quaternion.slerp(e,t)}function tE(n,e,t){let i=n.role==="CartoonTank",s=0;t.lHip&&t.rHip?s=Math.atan2(-(t.rHip.z-t.lHip.z),t.rHip.x-t.lHip.x):t.lShoulder&&t.rShoulder&&(s=Math.atan2(-(t.rShoulder.z-t.lShoulder.z),t.rShoulder.x-t.lShoulder.x)),s=Math.max(-1.3,Math.min(1.3,s))*(i?.6:1),n.bodyPivot.position.set(e.hipOffsetX,0,0),cd.setFromAxisAngle(Jm,s),n.bodyPivot.quaternion.slerp(cd,.8),n.torsoGroup.position.y=n.baseTorsoY;let r=!1;t.lShoulder&&t.rShoulder&&(Jt.set(t.rShoulder.x-t.lShoulder.x,t.rShoulder.y-t.lShoulder.y,t.rShoulder.z-t.lShoulder.z),t.lHip&&t.rHip?Rn.set((t.lShoulder.x+t.rShoulder.x-t.lHip.x-t.rHip.x)/2,(t.lShoulder.y+t.rShoulder.y-t.lHip.y-t.rHip.y)/2,(t.lShoulder.z+t.rShoulder.z-t.lHip.z-t.rHip.z)/2):Rn.set(0,1,0),Jt.lengthSq()>1e-6&&(Jt.normalize(),Rn.addScaledVector(Jt,-Rn.dot(Jt)),Rn.lengthSq()>1e-6&&(Rn.normalize(),zn.crossVectors(Jt,Rn),wa.makeBasis(Jt,Rn,zn),_a.setFromRotationMatrix(wa),An.copy(n.bodyPivot.quaternion).invert().multiply(_a),dd(An,i?.25:.8),Ta(n.torsoGroup,An,.85),r=!0))),r||gs(n.torsoGroup,pr,.1);let o=!1;t.lEar&&t.rEar&&t.nose&&(Jt.set(t.rEar.x-t.lEar.x,t.rEar.y-t.lEar.y,t.rEar.z-t.lEar.z),zn.set(t.nose.x-(t.lEar.x+t.rEar.x)/2,t.nose.y-(t.lEar.y+t.rEar.y)/2,t.nose.z-(t.lEar.z+t.rEar.z)/2),Jt.lengthSq()>1e-6&&(Jt.normalize(),zn.addScaledVector(Jt,-zn.dot(Jt)),zn.lengthSq()>1e-6&&(zn.normalize(),Rn.crossVectors(zn,Jt),wa.makeBasis(Jt,Rn,zn),_a.setFromRotationMatrix(wa).multiply(Km),gd(n,n.headPivot.parent,va).invert(),An.copy(va).multiply(_a),dd(An,.75),Ta(n.headPivot,An,.75),o=!0))),o||gs(n.headPivot,pr,.1);let a=(h,d,p,u,m,M,g)=>{Es(p,u,tn)?(ms(n,h,tn,M,1),Es(u,m,tn)?ms(n,d,tn,M,1):gs(d,pr,.15)):(gs(h,g,.12),gs(d,jm,.12))};a(n.leftShoulder,n.leftElbow,t.lShoulder,t.lElbow,t.lWrist,-1,$m),a(n.rightShoulder,n.rightElbow,t.rShoulder,t.rElbow,t.rWrist,1,Qm);let l=Math.max(0,Math.min(.9,e.grooveBend??0)),c=(h,d,p,u,m,M)=>{if(h){if(d&&Es(p,u,tn)){ms(n,h,tn,M,1),Es(u,m,tn)?ms(n,d,tn,M,1):gs(d,pr,.2);return}if(!d&&(Es(p,m,tn)||Es(p,u,tn))){ms(n,h,tn,M,1);return}tn.set(M*.06,-Math.cos(l*.5),Math.sin(l*.5)).normalize(),ms(n,h,tn,M,.35),d&&(An.setFromAxisAngle(Ed,l),Ta(d,An,.35))}};c(n.leftHip,n.leftKnee,t.lHip,t.lKnee,t.lAnkle,-1),c(n.rightHip,n.rightKnee,t.rHip,t.rKnee,t.rAnkle,1),n.bodyPivot.scale.setScalar(n.restScale),md(n,e.liftY??0)}var Er=class n extends E{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new At;let i=this,s=t.color!==void 0?new Pe(t.color):new Pe(8355711),r=t.textureWidth||512,o=t.textureHeight||512,a=t.clipBias||0,l=t.shader||n.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new an,d=new L,p=new L,u=new L,m=new ut,M=new L(0,0,-1),g=new dt,f=new L,_=new L,w=new dt,y=new ut,b=this.camera,R=new cn(r,o,{samples:c,type:hi}),C=new Gt({name:l.name!==void 0?l.name:"unspecified",uniforms:pa.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});C.uniforms.tDiffuse.value=R.texture,C.uniforms.color.value=s,C.uniforms.textureMatrix.value=y,this.material=C,this.onBeforeRender=function(H,T,x){if(p.setFromMatrixPosition(i.matrixWorld),u.setFromMatrixPosition(x.matrixWorld),m.extractRotation(i.matrixWorld),d.set(0,0,1),d.applyMatrix4(m),f.subVectors(p,u),f.dot(d)>0===!0&&this.forceUpdate===!1)return;f.reflect(d).negate(),f.add(p),m.extractRotation(x.matrixWorld),M.set(0,0,-1),M.applyMatrix4(m),M.add(u),_.subVectors(p,M),_.reflect(d).negate(),_.add(p),b.position.copy(f),b.up.set(0,1,0),b.up.applyMatrix4(m),b.up.reflect(d),b.lookAt(_),b.far=x.far,b.updateMatrixWorld(),b.projectionMatrix.copy(x.projectionMatrix),y.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),y.multiply(b.projectionMatrix),y.multiply(b.matrixWorldInverse),y.multiply(i.matrixWorld),h.setFromNormalAndCoplanarPoint(d,p),h.applyMatrix4(b.matrixWorldInverse),g.set(h.normal.x,h.normal.y,h.normal.z,h.constant);let B=b.projectionMatrix;w.x=(Math.sign(g.x)+B.elements[8])/B.elements[0],w.y=(Math.sign(g.y)+B.elements[9])/B.elements[5],w.z=-1,w.w=(1+B.elements[10])/B.elements[14],g.multiplyScalar(2/g.dot(w)),B.elements[2]=g.x,B.elements[6]=g.y,B.elements[10]=g.z+1-a,B.elements[14]=g.w,i.visible=!1;let G=H.getRenderTarget(),N=H.xr.enabled,W=H.shadowMap.autoUpdate;H.xr.enabled=!1,H.shadowMap.autoUpdate=!1,H.setRenderTarget(R),H.state.buffers.depth.setMask(!0),H.autoClear===!1&&H.clear(),H.render(T,b),H.xr.enabled=N,H.shadowMap.autoUpdate=W,H.setRenderTarget(G);let z=x.viewport;z!==void 0&&H.state.viewport(z),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return R},this.dispose=function(){R.dispose(),i.material.dispose()}}};Er.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function Md(n){let e=new P({color:16236088,metalness:.85,roughness:.2}),t=new j;t.visible=!1;let i=new P({color:1976635,roughness:.35,metalness:.25}),s=new P({color:14251782,emissive:7877903,emissiveIntensity:.35}),r=new Se({color:16707722}),o=new Se({color:16777215}),a=new Se({color:15680580}),l=[],c=[{side:-1,z:.36,scale:1.05,phase:0},{side:1,z:.28,scale:.96,phase:1.9},{side:-1,z:-.18,scale:1.15,phase:3.4}];for(let oe of c){let Ce=new j;Ce.position.set(oe.side*1.15,0,oe.z),Ce.scale.setScalar(oe.scale);let $=new Zt([new L(-oe.side*.26,.05,-.1),new L(0,.07,.16),new L(oe.side*.22,.08,-.08),new L(0,.16,-.12),new L(0,.42,.02)]),Me=new E(new hn($,22,.052,10,!1),i);Me.castShadow=!0,Ce.add(Me);let ge=new j;ge.position.set(0,.42,.02);let ye=new E(new le(.048,.062,.44,10),i);ye.position.y=.2,ge.add(ye);let S=new E(new se(.16,14,10),i);S.scale.set(1.28,1.48,.38),S.position.set(0,.44,.02),S.castShadow=!0,ge.add(S);let ce=new E(new Ne(.08,.015,6,14),s);ce.position.set(0,.44,-.04),ge.add(ce);let ae=new E(new se(.082,12,10),i);ae.scale.set(1.05,.72,1.45),ae.position.set(0,.56,.11),ge.add(ae);for(let Ge of[-1,1]){let Ke=new E(new se(.022,8,6),r);Ke.position.set(Ge*.048,.58,.19),ge.add(Ke);let Ue=new E(new Xe(.01,.045,5),o);Ue.rotation.x=Math.PI,Ue.position.set(Ge*.028,.5,.21),ge.add(Ue)}let He=new E(new X(.016,.008,.12),a);He.position.set(0,.52,.27),ge.add(He),Ce.add(ge),Ce.rotation.y=-oe.side*.95,t.add(Ce),l.push({root:Ce,neckPivot:ge,sideSign:oe.side,phase:oe.phase})}n.add(t);let h=new j;h.visible=!1;let d=new P({color:5396582,roughness:.78}),p=new P({color:3883085,roughness:.84}),u=new P({color:12131356,roughness:.52}),m=new P({color:16776171,roughness:.22}),M=new E(new se(.56,20,16),d);M.scale.set(1.38,1.05,.96),M.position.set(0,.96,0),M.castShadow=!0,h.add(M);let g=new E(new le(.58,.62,.65,16,1,!1,-Math.PI*.45,Math.PI*.9),u);g.rotation.z=Math.PI/2,g.position.set(0,1.02,0),h.add(g);let f=new E(new X(.76,.08,1.12),e);f.position.set(0,.74,0),h.add(f);let _=[];for(let[oe,Ce]of[[-.44,-.28],[-.44,.28],[.42,-.28],[.42,.28]]){let $=new E(new le(.145,.165,.74,12),p);$.position.set(oe,.37,Ce),$.castShadow=!0;let Me=new E(new Ne(.165,.022,6,14),e);Me.rotation.x=Math.PI/2,Me.position.y=-.28,$.add(Me),h.add($),_.push($)}let w=new j;w.position.set(.78,1.18,0),h.add(w);let y=new E(new se(.38,18,14),d);y.scale.set(1.06,1.15,.96),y.castShadow=!0,w.add(y);let b=new E(new X(.28,.42,.42),e);b.position.set(.24,.06,0),b.rotation.z=-.22,w.add(b);let R=new E(new Xe(.12,.28,12),e);R.position.set(.06,.46,0),w.add(R);for(let oe of[-1,1]){let Ce=new E(new se(.042,8,6),r);Ce.position.set(.28,.08,oe*.24),w.add(Ce)}let C=[];for(let oe of[-1,1]){let Ce=new E(new se(.32,12,10),p);Ce.scale.set(.18,1.12,.92),Ce.position.set(-.08,.02,oe*.42),Ce.rotation.y=oe*.35,w.add(Ce),C.push(Ce);let $=new Zt([new L(.24,-.18,oe*.16),new L(.56,-.26,oe*.2),new L(.76,-.05,oe*.18)]),Me=new E(new hn($,14,.036,8,!1),m);Me.castShadow=!0,w.add(Me)}let H=new j;H.position.set(.34,-.1,0);let T=new Zt([new L(0,0,0),new L(.24,-.28,0),new L(.36,-.62,0),new L(.52,-.58,0)]),x=new E(new hn(T,18,.085,10,!1),d);x.castShadow=!0,H.add(x),w.add(H);let I=new E(new le(.022,.015,.55,6),p);I.position.set(-.76,.72,0),I.rotation.z=-.35,h.add(I),h.position.set(-1.35,0,.12),n.add(h);let B=new j;B.visible=!1,B.position.set(0,0,.16);let G=new P({color:7893356,roughness:.85}),N=new P({color:16347926,emissive:14427686,emissiveIntensity:1.4,roughness:.4}),W=new E(new Ne(.95,.12,8,28),G);W.rotation.x=Math.PI/2,W.position.y=.08,W.castShadow=!0,B.add(W);let z=new E(new le(.9,.94,.1,24),N);z.position.y=.05,B.add(z);let J=[];for(let oe=0;oe<16;oe++){let Ce=oe/16*Math.PI*2,$=Math.sin(Ce)>.2,Me=$?1.02:oe%2===0?.88:1.08,ge=$?.28+oe%3*.08:.95+oe%4*.25,ye=new Se({color:oe%3===0?16707722:oe%2===0?16347926:15680580,transparent:!0,opacity:$?.65:.84,depthWrite:!1}),S=new E(new Xe($?.14:.2+oe%3*.05,ge,7),ye);S.position.set(Math.cos(Ce)*Me,ge*.5+.06,Math.sin(Ce)*Me),B.add(S),J.push({mesh:S,baseH:ge,phase:oe*.85,radius:Me,angle:Ce})}let U=new Ct(16743196,0,8.5,1.5);U.position.set(0,1.45,.45),B.add(U),n.add(B);let Q=new j;Q.visible=!1;let te=new P({color:4674921,roughness:.92});for(let[oe,Ce,$,Me]of[[-1.3,.22,-.35,1.1],[1.25,.16,-.25,.95],[0,.1,-.65,1.35]]){let ge=new E(new ri(.45*Me,0),te);ge.position.set(oe,Ce,$),ge.scale.set(1.4,.75,1.1),Q.add(ge)}let ue=[],we=new Se({color:14742270,transparent:!0,opacity:.32,depthWrite:!1});for(let oe=0;oe<6;oe++){let Ce=new E(new se(.48,12,10),we);Ce.scale.set(1.9,.42,1.3),Ce.position.set((oe-2.5)*.85,.14+oe%2*.12,.25-oe%3*.35),Q.add(Ce),ue.push(Ce)}n.add(Q);let Ae=new j;Ae.visible=!1;let q=new Se({color:16638023,transparent:!0,opacity:.2,side:at,depthWrite:!1}),ie=new E(new se(.58,24,18),q);ie.scale.set(1,1.35,1),ie.position.y=.78,Ae.add(ie);let Ee=new Se({color:16498468,transparent:!0,opacity:.72,side:at,depthWrite:!1}),me=new E(new Ne(.62,.024,8,36),Ee);me.rotation.x=Math.PI/2,me.position.y=.1,Ae.add(me);for(let oe=0;oe<8;oe++){let Ce=oe/8*Math.PI*2,$=new E(new se(.14,10,8),new P({color:16020150,emissive:16498468,emissiveIntensity:.4}));$.scale.set(1.1,.38,1.8),$.position.set(Math.cos(Ce)*.42,.08,Math.sin(Ce)*.42),$.rotation.y=-Ce+Math.PI/2,Ae.add($)}return n.add(Ae),{serpentGroup:t,cobras:l,elephantGroup:h,elephantTrunk:H,elephantHead:w,elephantEars:C,elephantLegs:_,fireTrialGroup:B,flames:J,fireLight:U,cliffGroup:Q,cliffClouds:ue,devoteeShieldGroup:Ae,shieldDome:ie,shieldRing:me}}function yd(n,e,t,i,s){let r=t!=="none";if(n.devoteeShieldGroup.visible=r,r){n.devoteeShieldGroup.position.set(i,0,.16),n.shieldRing.rotation.z=e*1.4;let o=.96+Math.sin(e*5)*.05;n.shieldDome.scale.setScalar(o)}if(n.serpentGroup.visible=t==="serpentAttack",t==="serpentAttack"&&n.cobras.forEach(o=>{let a=Math.max(0,Math.sin(e*4.2+o.phase)),l=Math.exp(-Math.pow(a-.85,2)*8)*.24;o.root.position.x=i+o.sideSign*(.98-a*.16+l),o.neckPivot.rotation.x=.38*a-.18,o.neckPivot.rotation.z=Math.sin(e*7.5+o.phase)*.14}),n.elephantGroup.visible=t==="elephantCharge",t==="elephantCharge"){let o=i>=0?1:-1,a=i-o*(1.75-Math.min(1,s*1.6)*.65);n.elephantGroup.position.x=a,n.elephantGroup.rotation.y=o>=0?0:Math.PI;let l=Math.sin(e*8.5)*(s<.65?.25:.05);n.elephantLegs.forEach((h,d)=>{h.rotation.z=(d%2===0?1:-1)*l}),n.elephantEars.forEach((h,d)=>{h.rotation.y=(d===0?-1:1)*(.35+Math.sin(e*6)*.25)});let c=s>.45?Math.min(1,(s-.45)*2.4)*.65:Math.sin(e*4.5)*.18;n.elephantTrunk.rotation.z=c,n.elephantHead.rotation.z=Math.sin(e*3.5)*.08}n.fireTrialGroup.visible=t==="fireTrial",n.fireLight.intensity=t==="fireTrial"?3.2+Math.sin(e*14)*.7:0,t==="fireTrial"&&(n.fireTrialGroup.position.x=0,n.flames.forEach(o=>{let a=.8+.32*Math.sin(e*13.5+o.phase);o.mesh.scale.set(.92+.12*Math.cos(e*9+o.phase),a,1),o.mesh.position.y=o.baseH*a*.5+.05,o.mesh.position.x=Math.cos(o.angle)*o.radius,o.mesh.position.z=Math.sin(o.angle)*o.radius})),n.cliffGroup.visible=t==="cliffRescue",t==="cliffRescue"&&n.cliffClouds.forEach((o,a)=>{o.position.x=(a-2.5)*.85+Math.sin(e*1.4+a)*.22})}function xd(n){let e=new j;e.visible=!1;let t=new P({color:16317180,roughness:.78}),i=new P({color:16708551,roughness:.72}),s=new P({color:16096779,roughness:.55}),r=new P({color:15357964,roughness:.58}),o=new P({color:14251782,metalness:.75,roughness:.25}),a=new E(new X(1.56,.12,.86),t);a.position.set(.08,.06,.25),a.receiveShadow=!0,e.add(a);let l=new E(new X(.36,.14,.62),i);l.position.set(-.44,.18,.25),l.castShadow=!0,e.add(l);let c=new E(new le(.08,.1,.05,12),o);c.position.set(-.68,.025,.56),e.add(c);let h=new E(new le(.008,.008,.24,6),new P({color:4140577}));h.position.set(-.68,.15,.56),h.rotation.z=-.15,e.add(h);let d=new E(new se(.016,8,6),new Se({color:16347926}));d.position.set(-.66,.265,.56),e.add(d);let p=new j,u=new E(new le(.3,.27,1.04,18,1,!1,-Math.PI*.5,Math.PI),t);u.rotation.z=-Math.PI/2,u.scale.set(.92,1,1.15),u.position.set(.24,.26,.25),u.castShadow=!0,p.add(u);let m=new E(new X(1.06,.24,.64),t);m.position.set(.24,.22,.25),p.add(m);let M=new j;for(let v=0;v<9;v++){let k=(v-4)/4,ne=new E(new se(.044,8,6),v%2===0?s:r);ne.position.set(.14+Math.abs(k)*.14,.54-Math.abs(k)*.1,.25+k*.22),M.add(ne)}p.add(M),e.add(p),n.add(e);let g=new j;g.position.set(0,2.22,-1.16),g.visible=!1;let f=new E(new yt(.72,32),new Se({color:988970,transparent:!0,opacity:.84}));f.position.z=-.18,g.add(f);let _=new E(new Ne(.74,.04,12,40),new Se({color:16436245}));_.position.z=-.16,g.add(_);let w=()=>{let v=new j;return v.visible=!1,g.add(v),v},y=w(),b=new P({color:4674921,metalness:.4,roughness:.5});for(let v of[-.36,.36]){let k=new E(new le(.032,.036,.65,8),b);k.position.set(v,-.05,0),y.add(k)}let R=new E(new Ne(.36,.025,8,20,Math.PI*.72),new P({color:1120295,roughness:.7}));R.position.set(0,.25,0),R.rotation.z=Math.PI*1.14,y.add(R);let C=new E(new le(.024,.024,.16,8),new P({color:14251782,metalness:.85,roughness:.2}));C.rotation.z=Math.PI/2,C.position.set(0,-.08,.04),y.add(C);let H=[],T=new Se({color:3718648}),x=new Se({color:16707722});for(let v=0;v<6;v++){let k=new E(new St(.058,0),v%2===0?x:T);y.add(k),H.push(k)}let I=w(),B=new j;B.position.set(-.22,-.08,0);let G=new E(new X(.36,.34,.32),new P({color:16347926,roughness:.45}));G.position.y=.08,B.add(G);let N=new E(new X(.3,.13,.34),new Se({color:12248829}));N.position.set(0,.15,.01),B.add(N);for(let v of[-.11,.11]){let k=new E(new se(.036,8,6),x);k.position.set(v,-.02,.17),B.add(k)}let W=new E(new X(.4,.4,.32),new P({color:15381256,roughness:.55}));W.position.set(-.18,.12,-.18),B.add(W),I.add(B);let z=new j;z.position.set(.28,-.12,.14);let J=new E(new X(.24,.16,.24),new P({color:1483594,roughness:.45}));z.add(J);let U=new E(new Xe(.18,.18,4),new P({color:16436245,roughness:.5}));U.rotation.y=Math.PI/4,U.position.y=.16,z.add(U),I.add(z);let Q=w(),te=new P({color:165063,roughness:.4}),ue=new E(new le(.24,.24,.48,18),te);ue.position.set(.06,.04,0),Q.add(ue);for(let v of[-.08,.04,.16]){let k=new E(new Ne(.245,.014,8,20),te);k.rotation.x=Math.PI/2,k.position.set(.06,v,0),Q.add(k)}let we=new E(new le(.12,.12,.05,12),new P({color:988970}));we.position.set(.06,.3,0),Q.add(we);let Ae=new E(new yt(.4,20),new Se({color:8246268,transparent:!0,opacity:.85}));Ae.rotation.x=-Math.PI/2,Ae.position.set(0,-.24,0),Q.add(Ae);for(let v of[-.3,-.18]){let k=new E(new le(.015,.015,.56,8),b);k.position.set(v,-.02,.08),k.rotation.z=-.24,Q.add(k)}let q=w(),ie=new E(new le(.46,.46,.06,20),new P({color:3359061,roughness:.8}));ie.position.set(0,-.22,0),q.add(ie);let Ee=new E(new yt(.28,20),new Se({color:132631}));Ee.rotation.x=-Math.PI/2,Ee.position.set(0,-.185,0),q.add(Ee);for(let v of[-.32,.32]){let k=new E(new Xe(.085,.24,12),r);k.position.set(v,-.06,.12),q.add(k);let ne=new E(new Ne(.055,.012,6,12),new Se({color:16777215}));ne.rotation.x=Math.PI/2,ne.position.set(v,-.06,.12),q.add(ne)}let me=w(),oe=new P({color:1483594,roughness:.35}),Ce=new P({color:16638023,roughness:.45}),$=[];for(let v=0;v<8;v++){let k=.075-v*.0055,ne=new E(new se(Math.max(.025,k),10,8),v%2===0?oe:Ce);me.add(ne),$.push(ne)}let Me=new E(new se(.11,12,10),oe);Me.scale.set(1.25,1.35,.65),Me.position.set(-.24,.16,.08),me.add(Me);for(let v of[-.048,.048]){let k=new E(new se(.032,8,6),new Se({color:16777215}));k.position.set(v,.04,.09),Me.add(k);let ne=new E(new se(.016,6,6),new Se({color:593174}));ne.position.set(v,.04,.115),Me.add(ne)}let ge=new E(new X(.018,.01,.14),new Se({color:15680580}));ge.position.set(-.24,.12,.22),me.add(ge),$.push(Me);let ye=w(),S=new E(new le(.32,.26,.04,24),new P({color:14870768,metalness:.85,roughness:.2}));S.position.set(-.08,-.14,.04),ye.add(S);let ce=new E(new se(.11,14,10),s);ce.position.set(-.08,-.02,.06),ye.add(ce);let ae=new E(new le(.09,.065,.28,16),new P({color:3718648,transparent:!0,opacity:.78,roughness:.15}));ae.position.set(.28,-.02,.08),ye.add(ae);let He=w(),Ge=new E(new X(.28,.48,.045),new P({color:988970,roughness:.3}));Ge.rotation.z=-.12,He.add(Ge);let Ke=new Se({color:3718648}),Ue=new E(new nt(.24,.42),Ke);Ue.position.set(0,0,.026),Ue.rotation.z=-.12,He.add(Ue);let D=new E(new se(.11,12,10),x);return D.position.set(-.32,.24,-.05),He.add(D),n.add(g),{funeralGroup:e,shroudMesh:p,shroudGarland:M,bubbleGroup:g,hazards:{wireSpark:y,truckRickshaw:I,waterTank:Q,roadPit:q,giantSnake:me,chokeFood:ye,nightPhone:He},wireSparks:H,truckGroup:B,rickshawGroup:z,snakeBody:$,snakeTongue:ge,phoneGlowMat:Ke}}function _d(n,e,t,i,s,r){if(n.funeralGroup.visible=t,n.shroudMesh.visible=t&&!i,s==="none"){n.bubbleGroup.visible=!1;return}n.bubbleGroup.visible=!0,n.bubbleGroup.position.y=2.22+Math.sin(e*3.2)*.045;let o=r<.16?.65+r/.16*.38:1+Math.sin(e*5)*.025;n.bubbleGroup.scale.setScalar(o);for(let[a,l]of Object.entries(n.hazards))l.visible=a===s;s==="wireSpark"?n.wireSparks.forEach((a,l)=>{let c=e*9+l/n.wireSparks.length*Math.PI*2,h=.08+(e*3.2+l*.2)%.22;a.position.set(Math.cos(c)*h,-.08+Math.sin(c)*h,.06),a.scale.setScalar(.65+.55*Math.abs(Math.sin(e*22+l)))}):s==="truckRickshaw"&&n.truckGroup&&n.rickshawGroup?(n.truckGroup.position.y=-.08+Math.abs(Math.sin(e*14))*.022,n.rickshawGroup.position.y=-.12+Math.abs(Math.sin(e*16+.8))*.028,n.truckGroup.rotation.y=Math.sin(e*2.5)*.15,n.rickshawGroup.rotation.y=Math.sin(e*2.5)*.15):s==="giantSnake"?(n.snakeBody.forEach((a,l)=>{if(l===n.snakeBody.length-1)a.position.set(-.22,.14+Math.sin(e*5.2)*.04,.08),a.rotation.z=Math.sin(e*4.2)*.14;else{let c=-.14+l*.068,h=-.12+Math.sin(e*6-l*.7)*.075,d=Math.cos(e*6-l*.7)*.1;a.position.set(c,h,d)}}),n.snakeTongue&&(n.snakeTongue.visible=Math.sin(e*14)>0,n.snakeTongue.position.y=.1+Math.sin(e*5.2)*.04)):s==="nightPhone"&&n.phoneGlowMat&&n.phoneGlowMat.color.setHex(Math.sin(e*8)>0?3718648:8246268)}function nE(n,e){let t=new Pe(e.topBackdropHex),i=new Pe(e.midBackdropHex),s=new Pe(e.botBackdropHex);return n==="Night"?(t.lerp(new Pe(1448251),.58),i.lerp(new Pe(3482974),.58),s.lerp(new Pe(2495785),.58),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:15127807,sunIntensity:1.48,fogDensity:.024}):n==="Sunset"?(t.lerp(new Pe(2756672),.68),i.lerp(new Pe(14242598),.68),s.lerp(new Pe(3805978),.62),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16752196,sunIntensity:1.92,fogDensity:.036}):n==="Day"?(t.lerp(new Pe(3718648),.55),i.lerp(new Pe(9684477),.55),s.lerp(new Pe(1981023),.55),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16774624,sunIntensity:2,fogDensity:.025}):(t.lerp(new Pe(1970486),.48),i.lerp(new Pe(12076580),.42),s.lerp(new Pe(1707800),.48),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16764807,sunIntensity:1.85,fogDensity:.036})}function Ft(n,e,t,i,s,r,o){let a=new P({color:14251782,metalness:.8,roughness:.25}),l=new E(new Xe(.11,.07,14),a);l.rotation.x=Math.PI,l.position.set(e,t+.035,i),n.add(l);let c=new E(new Xe(.032,.1,10),new Se({color:16768875}));c.position.set(e,t+.11,i),n.add(c);let h=new E(new se(.11,10,8),new Se({color:16752412,transparent:!0,opacity:.3,depthWrite:!1}));if(h.position.set(e,t+.11,i),n.add(h),r.animatedProps.push({object:c,kind:"diya",baseY:t+.11,phase:s,speed:7.5}),o){let d=new Ct(16752440,1.4,5.5,1.6);d.position.set(e,t+.22,i),n.add(d),r.ambientFireLights.push({light:d,baseIntensity:1.4,phase:s})}}function gr(n,e,t,i,s,r,o){let a=new j;a.position.set(e,0,t);let l=new P({color:4861725,roughness:.85}),c=new E(new le(.08*i,.15*i,1.5*i,10),l);c.position.y=.75*i,c.castShadow=!0,a.add(c);let h=new P({color:s,roughness:.72}),d=[[0,1.65,0,.65],[-.36,1.42,.15,.48],[.38,1.45,-.1,.48],[0,1.95,.08,.44]];for(let[p,u,m,M]of d){let g=new E(new $s(M*i,1),h);g.position.set(p*i,u*i,m*i),g.castShadow=!0,g.receiveShadow=!0,a.add(g)}n.add(a),o.animatedProps.push({object:a,kind:"sway",baseRotZ:0,phase:r,speed:1.1})}function iE(n,e){let t=new P({color:10380100,roughness:.68}),i=new P({color:15261649,roughness:.42,metalness:.08}),s=new P({color:16172100,metalness:.85,roughness:.22}),r=new P({color:2278750,roughness:.45}),o=new E(new le(5.6,5.9,.26,36),t);o.position.y=-.13,o.receiveShadow=!0,n.add(o);let a=new E(new _n(1.38,1.56,48),new Se({color:16172100,transparent:!0,opacity:.58,side:at}));a.rotation.x=-Math.PI/2,a.position.y=.012,n.add(a);for(let B of[-2.45,-1.68,1.68,2.45]){let G=Math.abs(B)>2?-1.45:-2.45,N=new E(new X(.42,.26,.42),s);N.position.set(B,.13,G),n.add(N);let W=new E(new le(.15,.19,3.55,14),t);W.position.set(B,1.88,G),W.castShadow=!0,W.receiveShadow=!0,n.add(W);let z=new E(new le(.27,.18,.22,14),s);z.position.set(B,3.56,G),n.add(z)}let l=new E(new Ne(1.75,.085,10,32,Math.PI),s);l.position.set(0,2.55,-2.35),n.add(l);let c=new E(new X(1.75,.95,1.55),t);c.position.set(0,.48,-4.45),n.add(c);for(let B=0;B<3;B++){let G=1.42-B*.28,N=new E(new X(G,.48,G),B===2?s:t);N.position.set(0,1.15+B*.46,-4.45),n.add(N)}let h=new E(new se(.19,12,10),s);h.position.set(0,2.48,-4.45),n.add(h);let d=new E(new Xe(.09,.28,12),s);d.position.set(0,2.74,-4.45),n.add(d);for(let B of[-1.42,1.42]){let G=new E(new le(.032,.075,1.05,10),s);G.position.set(B,.52,-.88),n.add(G),Ft(n,B,1.04,-.88,B>0?1.4:.3,e,!0)}for(let[B,G]of[[-1.35,0],[1.35,1.3]]){let N=new j;N.position.set(B,3.35,-.6);let W=new E(new le(.014,.014,.65,8),s);W.position.y=-.32,N.add(W);let z=new E(new Xe(.16,.25,16,1,!0),s);z.position.y=-.72,z.castShadow=!0,N.add(z),n.add(N),e.animatedProps.push({object:N,kind:"bell",baseRotZ:0,phase:G,speed:1.5})}let p=new j;p.position.set(0,1.92,-3.05);let u=new E(new Ne(1.18,.028,10,48),s),m=new E(new Ne(.84,.024,10,36),s);p.add(u,m),n.add(p),e.animatedProps.push({object:u,kind:"ring",phase:0,speed:.35}),e.animatedProps.push({object:m,kind:"ring",phase:1.4,speed:-.52}),Ft(n,-1.12,0,-.45,.2,e,!0),Ft(n,1.12,0,-.45,1.9,e,!0),Ft(n,-.52,0,-1.05,3.1,e,!1),Ft(n,.52,0,-1.05,4.4,e,!1);let M=new j;M.position.set(0,.14,-1.32);let g=new P({color:2500922,metalness:.42,roughness:.18}),f=new E(new le(.56,.64,.14,24),i);f.position.y=-.07,M.add(f);let _=new E(new le(.4,.48,.26,24),i);_.position.y=.13,_.castShadow=!0,_.receiveShadow=!0,M.add(_);let w=new E(new Ne(.32,.055,10,24),s);w.rotation.x=Math.PI/2,w.position.y=.27,M.add(w);let y=new E(new ft(.17,.4,12,20),g);y.position.y=.54,y.castShadow=!0,M.add(y);let b=new E(new le(.025,.032,.88,10),s);b.position.set(0,.54,-.22),M.add(b);let R=new E(new se(.2,14,10),s);R.scale.set(1.25,.72,.42),R.position.set(0,.98,-.1),R.rotation.x=.35,M.add(R);for(let B of[.58,.62,.66]){let G=new E(new X(.16,.016,.022),new Se({color:16708551}));G.position.set(0,B,.165),M.add(G)}let C=new P({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.26}),H=new P({color:16020150,emissive:14362487,emissiveIntensity:.3,roughness:.32});for(let B=0;B<14;B++){let G=B/14*Math.PI*2,N=new E(new se(B%2===0?.068:.06,8,6),B%2===0?C:H);N.position.set(Math.cos(G)*.3,.31,Math.sin(G)*.3),M.add(N)}let T=new E(new St(.09,1),C);T.scale.set(1.25,.55,1.25),T.position.set(0,.77,0),M.add(T);let x=new E(new se(.055,8,6),r);x.scale.set(1.2,.35,1.2),x.position.set(.08,.76,.06),M.add(x);for(let B of[-.58,.58]){let G=new E(new le(.24,.18,.045,20),s);G.position.set(B,-.1,.24),M.add(G);for(let N=0;N<7;N++){let W=N/7*Math.PI*2,z=N===0?0:.12,J=N===0?.04:0,U=new E(new St(.068,1),N%2===0?C:H);U.scale.set(1.2,.62,1.2),U.position.set(B+Math.cos(W)*z,-.04+J,.24+Math.sin(W)*z),M.add(U)}}let I=new Ct(16763750,2.35,6.2,1.4);I.position.set(0,1.25,.45),M.add(I),n.add(M)}function sE(n,e){let t=new P({color:2507300,roughness:.92}),i=new E(new yt(9,40),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new j;s.position.set(.1,0,-3.2);let r=new E(new le(.95,1,1.05,18),new P({color:10251846,roughness:.85}));r.position.y=.52,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new E(new Xe(1.38,.95,20),new P({color:12558414,roughness:.9}));o.position.y=1.42,o.castShadow=!0,s.add(o);let a=new E(new nt(.42,.65),new Se({color:16758605}));a.position.set(0,.34,.96),s.add(a),n.add(s),gr(n,-2.1,-1.8,1.45,3108407,.3,e),gr(n,2.2,-1.9,1.38,3635775,1.6,e),gr(n,-1.65,-3.9,1.65,2314793,2.8,e),gr(n,1.75,-4.1,1.55,2711344,4.1,e),Ft(n,0,0,-1.4,.5,e,!0)}function rE(n,e){let t=new P({color:10186830,roughness:.72}),i=new P({color:16096779,metalness:.78,roughness:.28}),s=new E(new X(8.5,.3,2.2),t);s.position.set(0,-.15,.1),s.receiveShadow=!0,n.add(s);let r=new E(new X(8.5,.16,.6),t);r.position.set(0,-.16,-1.25),n.add(r);let o=new E(new X(8.5,.12,.55),t);o.position.set(0,-.22,-1.75),n.add(o);for(let c of[-2.4,2.4]){let h=new E(new le(.14,.17,2.45,12),t);h.position.set(c,1.15,-2.1),n.add(h);let d=new E(new Xe(.42,.55,12),i);d.position.set(c,2.55,-2.1),n.add(d)}let a=new P({color:1994655,emissive:799826,emissiveIntensity:.45,metalness:.72,roughness:.18}),l=new E(new nt(20,11,24,16),a);l.rotation.x=-Math.PI/2,l.position.set(0,-.09,-7.2),l.receiveShadow=!0,n.add(l),e.animatedProps.push({object:l,kind:"water",phase:0,speed:1.8}),Ft(n,-1.2,0,-.65,.4,e,!0),Ft(n,1.2,0,-.65,2.1,e,!0),Ft(n,-.75,-.07,-2.4,3.4,e,!1),Ft(n,.85,-.07,-3.1,4.9,e,!1),Ft(n,-.15,-.07,-3.8,1.5,e,!1),Ft(n,1.45,-.07,-4.4,5.2,e,!1)}function oE(n,e,t){let i=new P({color:1053482,metalness:.7,roughness:.24}),s=new E(new le(5.5,5.5,.2,48),i);s.position.y=-.1,s.receiveShadow=!0,n.add(s);let r=new Se({color:t,transparent:!0,opacity:.75}),o=new P({color:16498468,metalness:.85,roughness:.2}),a=new j;a.position.set(0,2.05,-3.3);let l=new E(new Ne(1.58,.032,10,64),o),c=new E(new Ne(1.16,.026,10,48),r),h=new E(new Ne(.76,.022,10,48),o);c.rotation.x=.7,h.rotation.y=.55;let d=new E(new se(.28,20,16),new Se({color:16638023}));a.add(l,c,h,d),n.add(a);let p=new Ct(16498468,3,9,1.4);p.position.set(0,2.1,-2.5),n.add(p),e.ambientFireLights.push({light:p,baseIntensity:3,phase:.3}),e.animatedProps.push({object:l,kind:"ring",phase:.2,speed:.35}),e.animatedProps.push({object:c,kind:"ring",phase:1.5,speed:-.55}),e.animatedProps.push({object:h,kind:"ring",phase:.9,speed:.48});let u=new j;u.position.set(0,2.75,-2.8);let m=new Se({color:16774589,transparent:!0,opacity:0}),M=new E(new St(.18,0),m),g=new E(new Xe(.95,3.6,24,1,!0),new Se({color:16770180,transparent:!0,opacity:0,side:at,depthWrite:!1,blending:Tn}));g.position.y=-1.6,u.add(M,g),n.add(u),e.poleStarGroup=u,e.poleStarMat=g.material}function aE(n,e){let t=new P({color:6371360,roughness:.45,metalness:.1}),i=new E(new le(5.2,5.4,.25,40),t);i.position.y=-.125,i.receiveShadow=!0,n.add(i);let s=new E(new X(8.5,4.5,.25),new P({color:4528676,roughness:.85}));s.position.set(0,2.1,-3.5),s.receiveShadow=!0,n.add(s);let r=new P({color:10033947,roughness:.8});for(let u of[-1,1])for(let m=0;m<3;m++){let M=new E(new le(.24,.28,4.4,12),r);M.position.set(u*(2.2+m*.36),2.1,-2.8+m*.12),M.castShadow=!0,n.add(M)}let o=new P({color:14870768,metalness:.92,roughness:.15}),a=new E(new le(.016,.024,1.18,8),o);a.position.set(0,.59,.58),a.castShadow=!0,n.add(a);let l=new E(new le(.14,.15,.04,16),o);l.position.set(0,.02,.58),n.add(l);let c=new E(new se(.055,12,10),o);c.position.set(0,1.21,.58),n.add(c);let h=new E(new Ne(.65,.028,10,40),new Se({color:16486972}));h.position.set(0,2.25,-3.3),n.add(h);let d=new Ri(16638023,4.2,12,.42,.55,1.2);d.position.set(-1.6,4.2,2.2),n.add(d,d.target),e.animatedProps.push({object:d,kind:"spotlight",phase:0,speed:1.3});let p=new Ri(16020150,3.6,12,.42,.55,1.2);p.position.set(1.6,4.2,2.2),n.add(p,p.target),e.animatedProps.push({object:p,kind:"spotlight",phase:1.7,speed:1.5})}function lE(n,e){let t=new P({color:2959666,roughness:.9}),i=new E(new nt(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new P({color:8145446,roughness:.72}),r=new j;r.position.set(0,0,-2);let o=new E(new X(2.1,.85,.7),s);o.position.y=.425,o.castShadow=!0,o.receiveShadow=!0,r.add(o);for(let p of[-.98,.98]){let u=new E(new X(.08,2.15,.08),s);u.position.set(p,1.075,-.25),r.add(u)}let a=new E(new X(2.4,.08,1.1),new P({color:14251782,roughness:.75}));a.position.set(0,2.15,.05),a.rotation.x=.2,a.castShadow=!0,r.add(a);let l=new P({color:16096779,metalness:.75,roughness:.25}),c=new E(new se(.14,14,12),l);c.position.set(-.35,.98,.05),r.add(c);let h=new P({color:11817737,roughness:.85});for(let p of[.1,.28,.46]){let u=new E(new le(.05,.035,.09,12),h);u.position.set(p,.9,.08),r.add(u)}for(let p=0;p<4;p++){let u=new E(new se(.06,8,8),new Se({color:16708551,transparent:!0,opacity:.28,depthWrite:!1}));u.position.set(-.35+p%2*.06,1.18+p*.14,.05),r.add(u),e.animatedProps.push({object:u,kind:"steam",baseY:1.16,phase:p*1.4,speed:1.8})}e.spots.counter={x:.25,y:0,z:-.9,rotY:.12};let d=new Ct(16758605,2.6,7,1.5);d.position.set(0,1.88,.25),r.add(d),e.ambientFireLights.push({light:d,baseIntensity:2.6,phase:.4}),n.add(r)}function cE(n,e){let t=new E(new yt(9,32),new P({color:13358561,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new P({color:3359061,roughness:.82}),s=new P({color:15857145,roughness:.55}),r=[[-2.4,-4.5,2.6,1.8],[0,-5.6,3.8,2.3],[2.5,-4.4,2.4,1.7]];for(let[o,a,l,c]of r){let h=new E(new Xe(c,l,7),i);h.position.set(o,l*.5-.1,a),n.add(h);let d=new E(new Xe(c*.45,l*.42,7),s);d.position.set(o,l*.78-.1,a),n.add(d)}Ft(n,0,0,-1.1,.8,e,!0)}function hE(n,e,t=!1){let i=new P({color:15127221,roughness:.72}),s=new P({color:13284758,roughness:.58}),r=new P({color:16041038,metalness:.85,roughness:.22}),o=new P({color:7017510,roughness:.8}),a=new P({color:2822922,emissive:14251782,emissiveIntensity:.42,roughness:.6}),l=new E(new yt(10.5,48),s);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new E(new X(8.8,.06,5.2),i);c.position.set(0,-.02,-.6),c.receiveShadow=!0,n.add(c);let h=new E(new X(3.75,.016,2.35),r);h.position.set(0,.012,.15),h.receiveShadow=!0,n.add(h);let d=new E(new X(3.45,.022,2.08),o);d.position.set(0,.015,.15),d.receiveShadow=!0,n.add(d);let p=new E(new X(10.8,4.4,.28),s);p.position.set(0,2.2,-3.55),p.receiveShadow=!0,n.add(p);let u=new E(new X(10.4,.24,.72),i);u.position.set(0,.12,-2.55),u.receiveShadow=!0,n.add(u);let m=[-3.6,-1.25,1.25,3.6];for(let f of m){let _=new E(new X(.42,.34,.42),i);_.position.set(f,.26,-2.55),_.castShadow=!0,n.add(_);let w=new E(new le(.15,.17,2.75,14),i);w.position.set(f,1.78,-2.55),w.castShadow=!0,n.add(w);let y=new E(new X(.46,.22,.46),r);y.position.set(f,3.2,-2.55),n.add(y)}let M=[-2.42,0,2.42];for(let f=0;f<M.length;f++){let _=M[f],w=f===1?2.42:2.28,y=new E(new X(w,.65,.26),i);y.position.set(_,3.55,-2.55),y.castShadow=!0,n.add(y);let b=new E(new Ne(.88,.065,8,20,Math.PI),i);b.position.set(_,2.52,-2.52),n.add(b);let R=new E(new X(1.18,1.72,.08),r);R.position.set(_,1.56,-3.38),n.add(R);let C=new E(new X(1.02,1.56,.1),a);C.position.set(_,1.56,-3.35),n.add(C);for(let T of[-1,1]){let x=new E(new le(.09,.14,1.95,10),o);x.position.set(_+T*.54,1.55,-3.28),x.rotation.z=T*.06,n.add(x)}let H=new E(new X(1.22,.56,.12),a);H.position.set(_,3.12,-3.32),n.add(H)}let g=[-2.18,2.18];for(let f=0;f<g.length;f++){let _=g[f],w=-.35,y=new j;y.position.set(_,0,w);let b=new E(new le(.1,.22,.16,14),r);b.position.y=.08,y.add(b);let R=new E(new le(.025,.036,1.18,10),r);R.position.y=.74,R.castShadow=!0,y.add(R);for(let[H,T]of[[-.14,0],[.14,0],[0,.12],[0,-.1]]){let x=new E(new le(.042,.024,.05,8),r);x.position.set(H,1.34,T),y.add(x);let I=new E(new Xe(.022,.09,8),new Se({color:16707722}));I.position.set(H,1.4,T),y.add(I),e.animatedProps.push({object:I,kind:"diya",phase:f*1.4+H*3,speed:12.5})}let C=new Ct(16757844,1.9,6.2,1.6);C.position.set(0,1.48,0),y.add(C),e.ambientFireLights.push({light:C,baseIntensity:1.9,phase:f*1.7}),n.add(y)}if(Ft(n,-1.65,.24,-2.2,.3,e,!1),Ft(n,1.65,.24,-2.2,1.9,e,!0),t){let f=new E(new X(3.2,.042,.62),i);f.position.set(0,.021,.08),f.receiveShadow=!0,n.add(f);let _=new E(new X(3.08,.014,.06),r);_.position.set(0,.045,.34),n.add(_);for(let G of[-2.95,2.95]){let N=new E(new X(.3,3.2,.34),i);N.position.set(G,1.6,-1.45),N.castShadow=!0,n.add(N);let W=new E(new X(.38,.16,.42),r);W.position.set(G,3.22,-1.45),n.add(W)}let w=new j;w.position.set(0,0,-.78);let y=new E(new X(.68,.38,.68),i);y.position.y=.19,y.castShadow=!0,w.add(y);let b=new E(new le(.24,.28,2.75,10),i);b.position.y=1.72,b.castShadow=!0,w.add(b);for(let G of[.85,1.72,2.58]){let N=new E(new Ne(.27,.032,8,16),r);N.rotation.x=Math.PI/2,N.position.y=G,w.add(N)}let R=new E(new X(.64,.28,.64),r);R.position.y=3.16,w.add(R),n.add(w),e.stambhaWholeGroup=w;let C=new j;C.position.set(0,0,-.78),C.visible=!1;let H=new E(new X(.72,.38,.72),i);H.position.y=.19,C.add(H);let T=new E(new le(.2,.28,.72,9),i);T.position.y=.72,C.add(T);let x=new P({color:16707722,emissive:16347926,emissiveIntensity:1.55,roughness:.2}),I=new E(new ri(.32,1),x);I.position.y=1.06,I.scale.set(1.2,1.5,.85),C.add(I);for(let G of[-1,1]){let N=new E(new ri(.24,0),i);N.position.set(G*.78,.14,.18),N.scale.set(1.25,.65,.95),N.rotation.set(.18,.55*G,G*.35),C.add(N);let W=new E(new X(.26,.16,.22),i);W.position.set(G*1.12,.09,-.1),W.rotation.y=G*.48,C.add(W)}let B=new Ct(16758578,0,7.5,1.4);B.position.set(0,1.35,.35),C.add(B),e.stambhaFireLights=[B],n.add(C),e.stambhaBrokenGroup=C}}function dE(n,e,t,i){if(e==="ModernCity"){let l=new E(new nt(24,24),new P({color:593183,roughness:.35,metalness:.6}));l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new as(20,28,new Pe(i),1976635);c.position.y=.01,n.add(c);let h=new E(new St(.55,0),new P({color:i,wireframe:!0,emissive:i,emissiveIntensity:.6}));h.position.set(0,1.9,-2.5),n.add(h),t.animatedProps.push({object:h,kind:"ring",phase:0,speed:.6});return}let s=e==="PalaceCourt"?6038067:e==="Battlefield"?4140322:4535592,r=new E(new yt(8.5,36),new P({color:s,roughness:.78}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,n.add(r);let o=e==="PalaceCourt"?14264170:e==="Archive"?6898214:7033664,a=new P({color:o,roughness:.72});for(let l of[-2.1,2.1]){let c=new E(new X(.35,3.4,.35),a);c.position.set(l,1.7,-2.4),c.castShadow=!0,n.add(c)}Ft(n,-1.5,0,-1.2,.4,t,!0),Ft(n,1.5,0,-1.2,2,t,!0)}function uE(n,e,t){let i=new P({color:1976635,roughness:.35,metalness:.55}),s=new P({color:t%2===0?2282478:11032055,emissive:959977,emissiveIntensity:.55}),r=new E(new X(3.8,.22,9.5),i);r.position.set(0,-.11,-1.5),r.receiveShadow=!0,n.add(r);for(let c of[-1.85,1.85]){let h=new E(new X(.12,.25,9.5),s);h.position.set(c,-.09,-1.5),n.add(h)}let o=[[-1.08,2282478],[1.08,16007006]];for(let c=0;c<o.length;c++){let[h,d]=o[c],p=new j;p.position.set(h,1.15,-2.5);let u=new E(new Ne(.75,.08,12,32),new P({color:d,emissive:d,emissiveIntensity:.85,roughness:.2}));p.add(u);let m=new E(new yt(.7,24),new Se({color:d,transparent:!0,opacity:.24,side:at}));p.add(m),n.add(p),e.animatedProps.push({object:u,kind:"portal",phase:c*1.4,speed:1.6})}let a=new P({color:16317180,roughness:.9});for(let c=0;c<6;c++){let h=(c-2.5)*2.1,d=-1.2+c%2*.45,p=new E(new se(.95+c%3*.25,12,10),a);p.scale.set(1.8,.55,1.1),p.position.set(h,d,-5.2-c%2*1.2),n.add(p)}let l=new E(new le(.14,.14,1.6,12),new P({color:16436245,roughness:.35}));l.rotation.z=Math.PI/2,l.position.set(0,.35,-1),n.add(l),e.animatedProps.push({object:l,kind:"hazard",phase:0,speed:1.9})}function fE(n,e){let t=new P({color:10576438,roughness:.92}),i=new E(new yt(11,36),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new P({color:8142627,roughness:.88});for(let[l,c,h,d]of[[-3.4,-4.6,2.2,1.4],[.4,-5.8,2.8,1.9],[3.5,-4.3,2,1.3]]){let p=new E(new le(d*.72,d,h,8),s);p.position.set(l,h*.5-.1,c),p.castShadow=!0,n.add(p)}let r=new P({color:12753761,roughness:.85});for(let l=-2;l<=2;l++){let c=new E(new ft(.18,.34,6,8),r);c.rotation.z=Math.PI/2,c.position.set(l*.56,.18,-2.3),c.castShadow=!0,n.add(c)}let o=new P({color:16436245,roughness:.5});for(let l of[-2.2,2.2]){let c=new E(new Xe(.22,.58,12),o);c.position.set(l,.29,-1.6),c.castShadow=!0,n.add(c)}let a=new Ct(16347926,2.4,8,1.5);a.position.set(0,1.4,-2.6),n.add(a),e.ambientFireLights.push({light:a,baseIntensity:2.4,phase:.6})}function pE(n,e,t){let i=new P({color:15857145,roughness:.55}),s=new P({color:t%2===0?3359061:4988309,roughness:.55});for(let p=-4;p<=4;p++)for(let u=-3;u<=3;u++){let m=new E(new X(.98,.06,.98),(p+u)%2===0?i:s);m.position.set(p,-.03,u),m.receiveShadow=!0,n.add(m)}let r=new P({color:t%3===0?5195493:t%3===1?1013358:11817737,roughness:.78});for(let p of[-2.45,2.45]){let u=new E(new X(3.4,4.2,.25),r);u.position.set(p,2.1,-2.8),u.receiveShadow=!0,n.add(u)}let o=new E(new X(1.7,1.4,.25),r);o.position.set(0,3.5,-2.8),n.add(o);let a=new P({color:8138002,roughness:.6});for(let p of[-.78,.78]){let u=new E(new X(.14,2.85,.34),a);u.position.set(p,1.425,-2.8),n.add(u)}let l=new E(new X(1.72,.16,.36),a);l.position.set(0,2.86,-2.8),n.add(l);let c=new j;c.position.set(-.7,0,-2.76);let h=new E(new X(1.38,2.75,.08),new P({color:14251782,roughness:.5}));h.position.set(.69,1.375,0),h.castShadow=!0,c.add(h);let d=new E(new se(.08,12,10),new P({color:16436245,metalness:.85,roughness:.2}));d.position.set(1.22,1.25,.07),c.add(d),n.add(c),e.animatedProps.push({object:c,kind:"door",phase:.3,speed:2.2})}function ui(n,e){let t=e.width??12.6,i=e.height??5.4,s=e.backZ??-2.9,r=e.depth??10.5,o=new P({color:e.backColor,roughness:.82}),a=new P({color:e.sideColor??e.backColor,roughness:.84}),l=new E(new X(t,i,.18),o);l.position.set(0,i*.5,s),l.receiveShadow=!0,n.add(l);let c=new E(new X(.18,i,r),a);c.position.set(-t*.5+.09,i*.5,s+r*.5-.1),c.receiveShadow=!0,n.add(c);let h=new E(new X(.18,i,r),a);h.position.set(t*.5-.09,i*.5,s+r*.5-.1),h.receiveShadow=!0,n.add(h);let d=e.trimColor??4674921,p=new P({color:d,roughness:.65}),u=new E(new X(t,.16,.22),p);u.position.set(0,.08,s+.04),n.add(u);let m=new E(new X(t,.35,r),p);m.position.set(0,i+.1,s+r*.5-.1),n.add(m);let M=new E(new X(t,i,.2),o);M.position.set(0,i*.5,s+r-.15),n.add(M);let g=new E(new X(t,.72,.22),p);return g.position.set(0,.36,s+r-.16),n.add(g),o}function mE(n,e){let t=new P({color:6044968,roughness:.78}),i=new E(new nt(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new E(new X(3.6,.02,2.6),new P({color:10424889,roughness:.88}));s.position.set(0,.01,-.4),s.receiveShadow=!0,n.add(s),ui(n,{backColor:3878738,sideColor:3221063,trimColor:6044968,backZ:-2.9});let r=new Ct(14412542,2.2,9.5,1.3);r.position.set(.75,2.65,.65),n.add(r),e.ambientFireLights.push({light:r,baseIntensity:2.2,phase:.1});let o=new E(new X(1.5,1.55,.08),new P({color:8145446,roughness:.65}));o.position.set(1.15,2.25,-2.78),n.add(o);let a=new E(new nt(1.28,1.32),new Se({color:12248829}));a.position.set(1.15,2.25,-2.73),n.add(a);let l=new P({color:7877903,roughness:.62}),c=new j;c.position.set(-.88,0,-.58);let h=new E(new X(1.52,.14,2.1),l);h.position.y=.24,h.castShadow=!0,h.receiveShadow=!0,c.add(h);for(let[_,w]of[[-.68,-.95],[.68,-.95],[-.68,.95],[.68,.95]]){let y=new E(new le(.055,.045,.26,8),l);y.position.set(_,.13,w),y.castShadow=!0,c.add(y)}let d=new E(new X(1.54,.72,.1),l);d.position.set(0,.56,-1),d.castShadow=!0,c.add(d);let p=new E(new X(1.42,.16,1.94),new P({color:16708551,roughness:.8}));p.position.set(0,.38,.02),p.receiveShadow=!0,c.add(p);let u=new E(new X(1.44,.18,1.24),new P({color:15357964,roughness:.75}));u.position.set(0,.39,.34),u.castShadow=!0,c.add(u);let m=new E(new X(1.04,.14,.42),new P({color:16777215,roughness:.68}));m.position.set(0,.51,-.72),c.add(m),n.add(c);let M=new E(new X(.55,.52,.52),l);M.position.set(-1.98,.26,-.82),M.castShadow=!0,n.add(M);let g=new E(new Xe(.18,.24,16,1,!0),new P({color:16638023,emissive:16096779,emissiveIntensity:.55,side:at}));g.position.set(-1.98,.72,-.82),n.add(g);let f=new Ct(16758605,2.4,6.5,1.5);f.position.set(-1.98,.66,-.82),n.add(f),e.ambientFireLights.push({light:f,baseIntensity:2.4,phase:.7}),e.spots.bed={x:-.88,y:.47,z:.16,rotY:.16},e.spots.door={x:1.45,y:0,z:-1.35,rotY:-.35}}function EE(n,e){let t=new E(new nt(14,14),new P({color:4141901,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new E(new X(4,.02,2.8),new P({color:1013358,roughness:.86}));i.position.set(0,.01,-.2),i.receiveShadow=!0,n.add(i),ui(n,{backColor:3359061,sideColor:2503236,trimColor:7027230,backZ:-2.95});let s=new P({color:14251782,roughness:.7}),r=new P({color:16707722,roughness:.68}),o=new j;o.position.set(-.78,0,-1.28);let a=new E(new X(1.9,.36,.85),s);a.position.y=.22,a.castShadow=!0,a.receiveShadow=!0,o.add(a);let l=new E(new X(1.9,.68,.22),s);l.position.set(0,.56,-.34),l.castShadow=!0,o.add(l);for(let _ of[-.92,.92]){let w=new E(new X(.18,.48,.86),s);w.position.set(_,.38,0),o.add(w)}let c=new E(new X(.32,.28,.14),r);c.position.set(-.55,.48,-.14),c.rotation.z=.18,o.add(c),n.add(o);let h=new P({color:7027230,roughness:.55}),d=new j,p=new E(new X(1.15,.08,.65),h);p.position.set(.08,.34,.12),p.castShadow=!0,d.add(p);let u=new E(new le(.14,.09,.08,16),new P({color:16317180,roughness:.35}));u.position.set(.08,.42,.12),d.add(u),n.add(d),e.livingRoomTableGroup=d;let m=new E(new X(1.1,.78,.06),h);m.position.set(-.7,2.15,-2.84),n.add(m);let M=new E(new nt(.92,.62),new P({color:16498468,roughness:.5}));M.position.set(-.7,2.15,-2.8),n.add(M);let g=new j;g.position.set(1.25,0,-2.7);let f=new E(new X(.95,2.25,.08),h);f.position.set(.475,1.125,0),f.castShadow=!0,g.add(f),n.add(g),e.animatedProps.push({object:g,kind:"door",phase:.4,speed:.85}),e.spots.sofa={x:-.78,y:.38,z:-.74,rotY:.25},e.spots.door={x:1.45,y:0,z:-1.4,rotY:-.4}}function gE(n,e){let t=new E(new nt(14,14),new P({color:3359061,roughness:.6}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new as(12,16,9741240,4674921);i.position.y=.01,n.add(i),ui(n,{backColor:10105874,sideColor:8138002,trimColor:16639626,backZ:-2.85});let s=new E(new X(6.8,.92,.05),new P({color:16708551,roughness:.55}));s.position.set(0,1.32,-2.74),n.add(s);let r=new P({color:4674921,roughness:.55}),o=new P({color:14870768,roughness:.3}),a=new E(new X(3.2,.88,.9),r);a.position.set(0,.44,-1.45),a.castShadow=!0,a.receiveShadow=!0,n.add(a);let l=new E(new X(3.28,.07,.96),o);l.position.set(0,.91,-1.45),n.add(l);let c=new Se({color:3718648}),h=new E(new Ne(.18,.025,8,20),c);h.rotation.x=Math.PI/2,h.position.set(-.22,.96,-1.4),n.add(h),e.animatedProps.push({object:h,kind:"diya",phase:0,speed:9});let d=new P({color:14251782,metalness:.72,roughness:.25}),p=new E(new le(.32,.22,.26,20),d);p.position.set(-.22,1.1,-1.4),p.castShadow=!0,n.add(p);let u=new E(new yt(.3,20),new P({color:16708551,roughness:.28}));u.rotation.x=-Math.PI/2,u.position.set(-.22,1.22,-1.4),n.add(u);for(let g=0;g<5;g++){let f=new E(new se(.075,8,8),new Se({color:16777215,transparent:!0,opacity:.3,depthWrite:!1}));f.position.set(-.22+(g%3-1)*.08,1.32+g*.14,-1.4),n.add(f),e.animatedProps.push({object:f,kind:"steam",baseY:1.28,phase:g*1.1,speed:1.7})}let m=new E(new X(2.6,.08,.32),new P({color:7877903,roughness:.65}));m.position.set(0,1.85,-2.6),n.add(m);for(let g=-2;g<=2;g++){let f=[15680580,16096779,2278750,3900150,15381256][g+2],_=new E(new le(.075,.075,.22,12),new P({color:f,roughness:.35}));_.position.set(g*.42,2,-2.58),n.add(_)}let M=new Ct(16775149,3.3,9.5,1.25);M.position.set(0,2.75,.45),n.add(M),e.ambientFireLights.push({light:M,baseIntensity:3.3,phase:.2}),e.spots.counter={x:-.42,y:0,z:-.68,rotY:.3},e.spots.door={x:1.35,y:0,z:-1.15,rotY:-.45}}function Mr(n,e,t,i,s,r,o="#0f172a",a="#f59e0b"){let l=document.createElement("canvas");l.width=512,l.height=192;let c=l.getContext("2d");c.fillStyle=o,c.fillRect(0,0,512,192),c.strokeStyle=a,c.lineWidth=10,c.strokeRect(10,10,492,172),c.fillStyle=a,c.font="bold 42px sans-serif",c.textAlign="center",c.fillText(e,256,86),c.fillStyle="#e2e8f0",c.font="600 24px sans-serif",c.fillText(t,256,138);let h=new Ti(l);h.colorSpace=Lt;let d=new E(new X(1.48,.56,.05),new P({color:1976635,roughness:.45,metalness:.4}));d.position.set(i,s,r-.02),n.add(d);let p=new E(new nt(1.38,.48),new Se({map:h}));p.position.set(i,s,r+.01),n.add(p)}function ME(n,e){let t=new E(new nt(14,14),new P({color:4860970,roughness:.75}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),ui(n,{backColor:8138002,sideColor:6037518,trimColor:16096779,backZ:-2.9}),Mr(n,"MITHAI & KESHAV","FRESH SHAHI HALWAI",0,2.75,-2.76,"#431407","#fbbf24");let i=new P({color:8138002,roughness:.58}),s=new E(new X(2.8,.92,.85),i);s.position.set(0,.46,-1.45),s.castShadow=!0,s.receiveShadow=!0,n.add(s);let r=new P({color:14870768,metalness:.85,roughness:.2}),o=new P({color:16096779,roughness:.45}),a=new P({color:16708551,roughness:.38});for(let h of[-.65,0,.65]){let d=new E(new X(.52,.04,.48),r);d.position.set(h,.94,-1.42),n.add(d);for(let p=-.14;p<=.15;p+=.14)for(let u=-.1;u<=.12;u+=.14){let m=h===0?new E(new X(.11,.08,.11),a):new E(new se(.06,10,8),o);m.position.set(h+p,1,-1.42+u),n.add(m)}}let l=new E(new X(3.2,.1,1.2),new P({color:15357964,roughness:.65}));l.position.set(0,2.35,-1.35),l.rotation.x=.18,n.add(l);for(let h=-5;h<=5;h++){let d=new E(new se(.075,10,8),new P({color:h%2===0?16096779:16436245,roughness:.6}));d.position.set(h*.28,2.15-Math.cos(h*.35)*.14,-.82),n.add(d)}let c=new Ct(16758605,3,8,1.4);c.position.set(0,2.15,-1),n.add(c),e.ambientFireLights.push({light:c,baseIntensity:3,phase:.5}),e.spots.counter={x:.38,y:0,z:-.62,rotY:.22}}function wd(n,e,t,i,s,r,o,a,l=512,c=256){let h=new j;h.position.set(i,s,r),h.rotation.y=o;let d=new E(new X(e+.2,t+.2,.08),a);d.position.z=-.045,h.add(d);let p=new Er(new nt(e,t),{clipBias:.003,textureWidth:l,textureHeight:c,color:14412542,multisample:0});p.position.z=.002,h.add(p);let u=new E(new nt(.07,t*.92),new Se({color:16777215,transparent:!0,opacity:.16}));u.position.set(-e*.34,0,.006),u.rotation.z=-.35,h.add(u),n.add(h)}function yE(n,e){let t=new P({color:3359061,roughness:.42,metalness:.12}),i=new P({color:6583435,roughness:.45,metalness:.08}),s=new E(new nt(14,14),t);s.rotation.x=-Math.PI/2,s.receiveShadow=!0,n.add(s);for(let U=-4;U<=4;U++)for(let Q=-4;Q<=3;Q++){if((U+Q)%2!==0)continue;let te=new E(new nt(.95,.95),i);te.rotation.x=-Math.PI/2,te.position.set(U*1,.004,Q*1),te.receiveShadow=!0,n.add(te)}ui(n,{backColor:16051425,sideColor:15129288,trimColor:1013358,backZ:-2.9});let r=new E(new X(12.6,1.02,.21),new P({color:1013358,roughness:.45}));r.position.set(0,.51,-2.86),n.add(r),Mr(n,"SHAHI SALON","KESHAV STUDIO \u2022 VIP CUTS",2.34,2.26,-2.75,"#0f172a","#f59e0b"),Mr(n,"STYLE CHART","1. BAHUBALI  2. FADE  3. KATORA",2.34,1.64,-2.75,"#1e293b","#38bdf8");let o=new P({color:14870768,metalness:.88,roughness:.16});wd(n,3.25,1.38,-.25,1.92,-2.7,0,o,512,256);let a=new E(new le(.032,.032,.65,10),o);a.rotation.z=Math.PI/2,a.position.set(-2.5,1.62,-.88),n.add(a),wd(n,1.42,1.18,-2.14,1.62,-.78,1.04,o,384,320);let l=new E(new X(2.8,.08,.14),new Se({color:16776171}));l.position.set(-.25,2.78,-2.7),n.add(l);let c=new Ct(16776171,3.2,9.5,1.3);c.position.set(-.25,2.65,-1.25),n.add(c);let h=new E(new X(3.6,.08,.22),new Se({color:16708551}));h.position.set(0,3.85,1.2),n.add(h);let d=new P({color:1013358,roughness:.48}),p=new E(new X(6.4,1.2,.12),d);p.position.set(0,1.85,7.25),n.add(p);let u=new E(new X(2.6,.015,2.2),new P({color:1013358,roughness:.9}));u.position.set(-.55,.008,-.78),u.receiveShadow=!0,n.add(u);let m=new j;m.position.set(3.48,1.68,-2.55);let M=new E(new le(.11,.11,.92,16),new P({color:16317180,roughness:.25}));m.add(M),[14427686,2450411,14427686].forEach((U,Q)=>{let te=new E(new Ne(.112,.028,8,18),new P({color:U,roughness:.3}));te.rotation.x=Math.PI/2+.42,te.position.y=-.26+Q*.26,m.add(te)});let g=new P({color:13948120,metalness:.85,roughness:.2});for(let U of[-.5,.5]){let Q=new E(new se(.125,12,10),g);Q.position.y=U,m.add(Q)}n.add(m),e.animatedProps.push({object:m,kind:"hazard",phase:0,speed:3.2});let f=new E(new X(.75,.72,.56),new P({color:16317180,roughness:.32}));f.position.set(-2.98,.36,-2.42),n.add(f);let _=new E(new le(.28,.2,.18,16),new P({color:16777215,roughness:.22}));_.position.set(-2.98,.78,-2.38),n.add(_);let w=new E(new le(.02,.02,.24,8),o);w.position.set(-2.98,.92,-2.58),n.add(w);let y=new E(new X(3.3,.08,.36),new P({color:7029795,roughness:.6}));y.position.set(-.25,1.02,-2.6),n.add(y),[14753096,959977,16096779,1096065,9133302].forEach((U,Q)=>{let te=new E(new le(.055,.055,.22,10),new P({color:U,roughness:.3}));te.position.set(-1.2+Q*.48,1.17,-2.55),n.add(te)});let b=new j;b.position.set(.96,0,-1.26);let R=new E(new X(.46,.8,.36),new P({color:1976635,roughness:.5}));R.position.y=.42,b.add(R);let C=new E(new X(.5,.05,.4),o);C.position.y=.84,b.add(C);let H=new E(new le(.04,.052,.16,10),new P({color:959977,roughness:.3}));H.position.set(-.14,.94,.04),b.add(H);let T=new E(new X(.05,.05,.14),o);T.position.set(0,.89,.06),b.add(T),[16708551,14742270].forEach((U,Q)=>{let te=new E(new X(.2,.055,.22),new P({color:U,roughness:.85}));te.position.set(.11,.895+Q*.056,-.02),b.add(te)}),n.add(b);let x=new j;x.position.set(-.44,0,-.78),x.rotation.y=.2;let I=new P({color:12131356,roughness:.42}),B=new E(new le(.36,.4,.08,18),o);B.position.y=.04,x.add(B);let G=new E(new le(.08,.1,.42,12),o);G.position.y=.25,x.add(G);let N=new E(new X(.76,.16,.72),I);N.position.y=.46,N.castShadow=!0,x.add(N);let W=new E(new X(.74,.76,.14),I);W.position.set(0,.84,-.32),W.rotation.x=-.14,W.castShadow=!0,x.add(W);for(let U of[-.41,.41]){let Q=new E(new X(.08,.08,.62),o);Q.position.set(U,.68,0),x.add(Q)}let z=new E(new X(.46,.05,.22),o);z.position.set(0,.22,.48),x.add(z),n.add(x);let J=new E(new X(1.9,.42,.68),new P({color:2450411,roughness:.6}));J.position.set(1.76,.21,-1.68),J.castShadow=!0,n.add(J),e.spots.sofa={x:-.44,y:.28,z:-.66,rotY:.18},e.spots.counter={x:.34,y:0,z:-.96,rotY:-.36},e.spots.door={x:1.76,y:0,z:-1.45,rotY:-.35}}function xE(n,e){let t=new E(new nt(14,14),new P({color:4927003,roughness:.68}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new P({color:7029795,roughness:.62});ui(n,{backColor:7029795,sideColor:5715482,trimColor:9584654,backZ:-2.9}),Mr(n,"SATYAMEVA JAYATE","KESHAV DISTRICT COURT",0,3.05,-2.76,"#451a03","#f59e0b");let s=new E(new X(3.4,1.25,1),i);s.position.set(0,.62,-1.9),s.castShadow=!0,n.add(s);let r=new E(new Ne(.32,.04,10,24),new P({color:16096779,metalness:.85,roughness:.2}));r.position.set(0,2.4,-2.76),n.add(r);let o=new E(new X(1.1,.92,.9),i);o.position.set(-.95,.46,-.55),o.castShadow=!0,n.add(o),e.spots.sofa={x:0,y:.42,z:-1.45,rotY:.08},e.spots.counter={x:-.95,y:.1,z:-.35,rotY:.38}}function _E(n,e){let t=new E(new nt(14,14),new P({color:14412542,roughness:.52}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),ui(n,{backColor:16317180,sideColor:14870768,trimColor:165063,backZ:-2.9}),Mr(n,"CITY CLINIC","DR. DIAGNOSTICS \u2022 OPD 1",2.25,2.35,-2.75,"#0c4a6e","#38bdf8");let i=new Se({color:15680580}),s=new E(new X(.22,.72,.05),i);s.position.set(0,2.35,-2.78),n.add(s);let r=new E(new X(.72,.22,.05),i);r.position.set(0,2.35,-2.78),n.add(r);let o=new E(new X(1.8,.52,.88),new P({color:959977,roughness:.6}));o.position.set(-.95,.26,-.88),o.castShadow=!0,n.add(o);let a=new E(new X(1.4,.75,.72),new P({color:6583435,roughness:.5}));a.position.set(.85,.38,-.85),a.castShadow=!0,n.add(a),e.spots.bed={x:-.95,y:.52,z:-.82,rotY:.32},e.spots.sofa={x:.85,y:0,z:-.45,rotY:-.35}}function wE(n,e){let t=new E(new nt(14,14),new P({color:7887420,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),ui(n,{backColor:16708551,sideColor:16639626,trimColor:7877903,backZ:-2.9});let i=new E(new X(4.2,1.55,.08),new P({color:7877903,roughness:.6}));i.position.set(0,1.95,-2.78),n.add(i);let s=new E(new nt(3.95,1.32),new P({color:1332013,roughness:.9}));s.position.set(0,1.95,-2.73),n.add(s);let r=[16750899,16777215,1280008];for(let a=-5;a<=5;a++){let l=new E(new Xe(.11,.22,4),new P({color:r[(a+5)%3],roughness:.5}));l.rotation.x=Math.PI,l.position.set(a*.42,3.05-Math.cos(a*.28)*.16,-1.6),n.add(l),e.animatedProps.push({object:l,kind:"sway",phase:a*.4,speed:2.1})}let o=new E(new X(.9,.85,.65),new P({color:7877903,roughness:.6}));o.position.set(-.85,.42,-.75),n.add(o),e.spots.sofa={x:.8,y:0,z:-.45,rotY:-.4},e.spots.counter={x:-.85,y:0,z:-.45,rotY:.35}}function TE(n,e){let t=new E(new nt(14,14),new P({color:593188,roughness:.35,metalness:.3}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new Se({color:3718648}),s=new E(new Ne(2.15,.06,12,48),i);s.rotation.x=Math.PI/2,s.position.set(0,.04,0),n.add(s),e.animatedProps.push({object:s,kind:"ring",phase:0,speed:.4});let r=new E(new Ne(2.7,.08,12,48),new Se({color:11032055}));r.position.set(0,1.9,-2.5),n.add(r),e.animatedProps.push({object:r,kind:"portal",phase:.4,speed:.8});let o=new P({color:1976635,metalness:.55,roughness:.3});[-.95,.95].forEach(l=>{let c=new E(new le(.38,.44,.82,16),o);c.position.set(l,.41,-.35),c.castShadow=!0,n.add(c)});let a=new Ri(3718648,8.5,16,Math.PI/5,.4);a.position.set(0,4.6,1.5),n.add(a),n.add(a.target),e.animatedProps.push({object:a,kind:"spotlight",phase:0,speed:1.5})}function vE(n,e){let t=new E(new nt(14,14),new P({color:7041664,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new P({color:10105874,roughness:.82}),s=new P({color:16708551,roughness:.55}),r=new Se({color:16638023});[-2.6,2.6].forEach(h=>{let d=new E(new X(3,2.2,.28),i);d.position.set(h,1.1,-2.4),d.castShadow=!0,n.add(d)}),[-1.08,1.08].forEach(h=>{let d=new E(new X(.38,2.55,.38),i);d.position.set(h,1.28,-2.35),d.castShadow=!0,n.add(d);let p=new E(new X(.46,.12,.46),s);p.position.set(h,2.58,-2.35),n.add(p);let u=new E(new se(.11,10,8),r);u.position.set(h,2.74,-2.35),n.add(u)});let o=new j;o.position.set(-.92,0,-2.35);let a=new P({color:1976635,metalness:.65,roughness:.35});for(let h of[.35,1.85]){let d=new E(new X(1.84,.08,.08),a);d.position.set(.92,h,0),o.add(d)}for(let h=0;h<=7;h++){let d=new E(new le(.025,.025,2.05,8),a);d.position.set(.08+h*.24,1.05,0),d.castShadow=!0,o.add(d)}let l=new E(new X(.14,.16,.08),new P({color:16096779,metalness:.85,roughness:.2}));l.position.set(1.72,1.12,.08),o.add(l),n.add(o),e.animatedProps.push({object:o,kind:"door",phase:.1,speed:.7});let c=new E(new le(.09,.11,3.8,12),new P({color:4674921,metalness:.5,roughness:.5}));c.position.set(2.15,1.9,-1.6),n.add(c),gr(n,-2.75,-1.25,1.05,1409085,.3,e),e.spots.door={x:0,y:0,z:-1.35,rotY:.1}}function SE(n,e){let t=new P({color:3875606,roughness:.72}),i=new P({color:6042653,roughness:.65}),s=new P({color:16041038,metalness:.85,roughness:.25}),r=new P({color:1920728,roughness:.45,metalness:.2}),o=new P({color:8330525,roughness:.82}),a=new E(new yt(10,44),t);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,n.add(a);let l=new E(new X(3.6,.02,2.2),o);l.position.set(0,.015,.1),l.receiveShadow=!0,n.add(l);for(let M of[-2.4,2.4]){let g=new E(new X(2,3.1,.45),i);g.position.set(M,1.55,-2.9),g.castShadow=!0,n.add(g);for(let f of[.85,1.65,2.45]){let _=new E(new X(1.75,.22,.48),s);_.position.set(M,f,-2.9),n.add(_)}}let c=new E(new le(.42,.56,1.05,20),i);c.position.set(0,.525,-2.35),c.castShadow=!0,n.add(c);let h=new j;h.position.set(0,1.55,-2.35);let d=new E(new se(.46,24,18),r);h.add(d);let p=new E(new Ne(.55,.032,10,42),s);h.add(p);let u=new E(new Ne(.51,.024,10,42),s);u.rotation.x=Math.PI/2,h.add(u),n.add(h),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.45});let m=new Ct(16639626,3.2,8,1.4);m.position.set(0,2.65,-1.65),n.add(m),e.ambientFireLights.push({light:m,baseIntensity:3.2,phase:.4})}function bE(n,e,t){let i=new P({color:988970,roughness:.5,metalness:.25}),s=new P({color:1976635,roughness:.45,metalness:.35}),r=new Se({color:t||"#38bdf8"}),o=new E(new yt(10,44),i);o.rotation.x=-Math.PI/2,o.receiveShadow=!0,n.add(o);let a=new E(new Ne(2.3,.04,10,48),r);a.rotation.x=Math.PI/2,a.position.y=.02,n.add(a);let l=[[-3.6,-4.2,1.1,4.2],[-2.1,-4.6,1,5.1],[-.4,-5,1.25,5.8],[1.4,-4.6,1,4.8],[3.1,-4.2,1.15,4]];for(let[d,p,u,m]of l){let M=new E(new X(u,m,.9),s);M.position.set(d,m*.5,p),n.add(M);for(let g=1;g<m-.5;g+=.95){let f=new E(new X(u*.72,.14,.94),r);f.position.set(d,g,p),n.add(f)}}let c=new E(new Ne(1.8,.035,10,48),r);c.position.set(0,2.6,-3.1),n.add(c),e.animatedProps.push({object:c,kind:"ring",phase:.4,speed:.35});let h=new Ct(t||"#38bdf8",2.8,9,1.4);h.position.set(0,2.8,-1.8),n.add(h),e.ambientFireLights.push({light:h,baseIntensity:2.8,phase:.6})}function Td(n,e,t,i,s){let{top:r,mid:o,bot:a,sunColor:l,sunIntensity:c,fogDensity:h}=nE(i,e.palette);n.fog=new zs(o,h);let d=new se(28,32,20),p=new Gt({side:Ut,depthWrite:!1,uniforms:{uTop:{value:new Pe(r)},uMid:{value:new Pe(o)},uBot:{value:new Pe(a)}},vertexShader:`
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
    `}),u=new E(d,p);n.add(u);let m=new er(l,a,.85);n.add(m);let M=new os(l,c);M.position.set(2.8,5.2,3.8),M.castShadow=!0,M.shadow.mapSize.set(1024,1024),M.shadow.camera.near=.5,M.shadow.camera.far=16,M.shadow.camera.left=-4,M.shadow.camera.right=4,M.shadow.camera.top=4,M.shadow.camera.bottom=-4,M.shadow.bias=-8e-4,n.add(M);let g=new os(e.palette.secondaryHex,.65);g.position.set(-3,3.4,-3.5),n.add(g);let f=new j;n.add(f);let _={group:f,skyMaterial:p,keyLight:M,hemiLight:m,ambientFireLights:[],animatedProps:[],backdropTextures:s,spots:{}};if(s.length>0&&e.stageLayout?.templateBackdrop){let w=new E(new nt(14,14),new vi({opacity:.42}));w.rotation.x=-Math.PI/2,w.receiveShadow=!0,f.add(w);let y=e.width/e.height,b=6.2,R=b*y,C=new E(new nt(R,b),new Se({map:s[0],depthWrite:!1}));return C.position.set(0,1.32,-2.1),f.add(C),_.backdropMesh=C,_}if(s.length>0){let w=e.width/e.height,y=11.2,b=y*w,R=new E(new nt(b,y),new Se({map:s[0],depthWrite:!1,fog:!1}));R.position.set(0,2.75,-6.5),f.add(R),_.backdropMesh=R}switch(t){case"Temple":iE(f,_);break;case"ForestAshram":sE(f,_);break;case"RiverGhat":rE(f,_);break;case"Cosmos":oE(f,_,e.palette.primaryHex);break;case"ComedyStage":aE(f,_);break;case"ChaiStall":lE(f,_);break;case"SkyGauntlet":uE(f,_,e.uniqueVariant??e.seed??0);break;case"TankArena":fE(f,_);break;case"DoorwaySet":pE(f,_,e.uniqueVariant??e.seed??0);break;case"Himalaya":cE(f,_);break;case"PalaceCourt":{let w=[e.title,e.leftCharacter?.name,e.rightCharacter?.name,...e.supportingCast.map(b=>b.name)].join(" "),y=/narasimha|narsimha|hiranyakashipu|prahlad|नरसिंह|नृसिंह|हिरण्यकशिपु|प्रह्लाद|खंभ|स्तंभ/i.test(w);hE(f,_,y);break}case"Bedroom":mE(f,_);break;case"LivingRoom":EE(f,_);break;case"Kitchen":gE(f,_);break;case"SweetShop":ME(f,_);break;case"BarberShop":yE(f,_);break;case"Courtroom":xE(f,_);break;case"DoctorClinic":_E(f,_);break;case"Classroom":wE(f,_);break;case"QuizStudio":TE(f,_);break;case"Archive":SE(f,_);break;case"ModernCity":bE(f,_,e.palette.primaryHex);break;case"NeighborhoodGate":vE(f,_);break;default:dE(f,t,_,e.palette.primaryHex);break}return(t==="Temple"||t==="PalaceCourt"||t==="Himalaya"||t==="ForestAshram"||t==="RiverGhat"||t==="Cosmos")&&(_.trialProps=Md(f)),t==="LivingRoom"&&(_.comedyGags=xd(f)),_}function vd(n,e,t,i,s,r,o=!1,a="none",l=0,c=.5,h){for(let d of n.ambientFireLights)d.light.intensity=d.baseIntensity*(.86+.14*Math.sin(e*9.5+d.phase));for(let d of n.animatedProps)if(d.kind==="bell")d.object.rotation.z=Math.sin(e*d.speed+d.phase)*.16;else if(d.kind==="sway")d.object.rotation.z=Math.sin(e*d.speed+d.phase)*.035;else if(d.kind==="ring")d.object.rotation.z=e*d.speed+d.phase,d.object.rotation.y=Math.sin(e*.4+d.phase)*.25;else if(d.kind==="diya")d.object.scale.y=.85+.22*Math.sin(e*d.speed+d.phase),d.object.scale.x=.92+.12*Math.cos(e*d.speed*1.1+d.phase);else if(d.kind==="steam"){let p=(e*.55+d.phase)%1;d.object.position.y=(d.baseY??1.16)+p*.65,d.object.scale.setScalar(.75+p*1.15);let u=d.object.material;u.opacity=Math.sin(p*Math.PI)*.28}else if(d.kind==="spotlight"){let p=d.object;p.target.position.set(Math.sin(e*d.speed+d.phase)*1.1,.8,0),p.target.updateMatrixWorld()}else if(d.kind==="portal"){d.object.rotation.z=e*d.speed+d.phase;let p=.94+.08*Math.sin(e*3.8+d.phase);d.object.scale.setScalar(p)}else d.kind==="door"?d.object.rotation.y=.35+Math.sin(e*d.speed+d.phase)*.48:d.kind==="hazard"&&(d.object.rotation.y=e*d.speed+d.phase);if(n.poleStarGroup&&n.poleStarMat){let d=Math.max(0,Math.min(1,(t-.55)/.35));n.poleStarGroup.visible=d>.02,n.poleStarGroup.rotation.y=e*.8,n.poleStarMat.opacity=d*.28}if(n.stambhaWholeGroup&&n.stambhaBrokenGroup&&(n.stambhaWholeGroup.visible=!o,n.stambhaBrokenGroup.visible=o),n.stambhaFireLights){let d=o?3.8+Math.sin(e*14)*.55:0;n.stambhaFireLights.forEach(p=>{p.intensity=d})}if(n.trialProps&&yd(n.trialProps,e,a,l,c),n.livingRoomTableGroup&&(n.livingRoomTableGroup.visible=!h?.hasFuneralShroud),n.comedyGags&&_d(n.comedyGags,e,h?.hasFuneralShroud??!1,h?.shroudOpen??!1,h?.hazardMode??"none",c),n.backdropMesh&&n.backdropTextures.length>0){let d=Math.max(0,i)%n.backdropTextures.length,p=n.backdropMesh.material;if(p.map!==n.backdropTextures[d]&&(p.map=n.backdropTextures[d],p.needsUpdate=!0),r?.templateBackdrop){let u=r.templateMotion==="AutoSmooth"?["GentleZoom","OrbitRound","ZoomOut","SlowPan","GentleRotate"][Math.max(0,i>=0?i:Math.floor(e/5.5))%5]:r.templateMotion;if(n.backdropMesh.rotation.z=0,n.backdropMesh.position.y=1.32,u==="GentleZoom"){let m=1+.06*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(m),n.backdropMesh.position.x=0}else if(u==="ZoomOut"){let m=1.1-.09*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(m),n.backdropMesh.position.x=0}else if(u==="SlowPan")n.backdropMesh.scale.setScalar(1.08),n.backdropMesh.position.x=Math.sin(e*Math.PI*2/32)*.16;else if(u==="OrbitRound"){let m=e*Math.PI*2/22;n.backdropMesh.scale.setScalar(1.1),n.backdropMesh.position.x=Math.sin(m)*.13,n.backdropMesh.position.y=1.32+(Math.sin(m+1.25)-Math.sin(1.25))*.055}else if(u==="GentleRotate"){let m=1.08+.03*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(m),n.backdropMesh.position.x=0,n.backdropMesh.rotation.z=.032*Math.sin(e*Math.PI*2/18)}else n.backdropMesh.scale.setScalar(1),n.backdropMesh.position.x=0}else{let u=s*s*(3-2*s);n.backdropMesh.scale.setScalar(1.04+.09*u),n.backdropMesh.position.x=(d%2===0?1:-1)*.14*(u-.5)}}}function Sd(n,e,t,i,s,r){let o=new j;n.add(o);let a=document.createElement("canvas");a.width=64,a.height=64;let l=a.getContext("2d"),c=l.createRadialGradient(32,32,2,32,32,30);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.35,"rgba(255,255,255,0.75)"),c.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);let h=new Ti(a),d="upward";t==="ComedyBurst"||e==="ComedyStage"?d="star":e==="ForestAshram"?d="firefly":e==="Himalaya"?d="snow":(t==="DivineAura"||e==="PalaceCourt")&&(d="petal");let p=110,u=new Float32Array(p*3),m=new Float32Array(p*3),M=new Float32Array(p*3),g=new Pe(i),f=new Pe(s),_=new Pe(16775126),w=(r^2654435769)>>>0,y=()=>(w=Math.imul(1664525,w)+1013904223>>>0,w/4294967296);for(let ce=0;ce<p;ce++){let ae=(y()-.5)*6.2,He=y()*4.2,Ge=(y()-.5)*4.5-.4;u[ce*3]=ae,u[ce*3+1]=He,u[ce*3+2]=Ge,M[ce*3]=y()*6.283,M[ce*3+1]=.4+y()*.9,M[ce*3+2]=ae;let Ke=ce%3===0?g:ce%3===1?f:_;m[ce*3]=Ke.r,m[ce*3+1]=Ke.g,m[ce*3+2]=Ke.b}let b=new Tt;b.setAttribute("position",new Bt(u,3)),b.setAttribute("color",new Bt(m,3));let R=new wi({size:d==="star"?.065:.12,map:h,vertexColors:!0,transparent:!0,opacity:d==="star"?.16:.78,blending:Tn,depthWrite:!1}),C=new ns(b,R);d==="star"&&(C.visible=!1),o.add(C);let H=36,T=new Float32Array(H*3),x=new Tt;x.setAttribute("position",new Bt(T,3));let I=new wi({size:.16,map:h,color:16638023,transparent:!0,opacity:0,blending:Tn,depthWrite:!1}),B=new ns(x,I);o.add(B);let G=[];if(e!=="ModernCity"&&d!=="star")for(let ce=0;ce<4;ce++){let ae=new Gt({transparent:!0,depthWrite:!1,side:at,blending:Tn,uniforms:{uColor:{value:new Pe(i)},uOpacity:{value:.08}},vertexShader:`
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
        `}),He=new E(new Xe(.85,7.2,20,1,!0),ae);He.position.set(-1.6+ce*1.05,2.6,-1.9),He.rotation.z=-.32+ce*.1,o.add(He),G.push(He)}let N=[];for(let ce=0;ce<7;ce++){let ae=new E(new se(.036,10,8),new Se({color:s,transparent:!0,opacity:0,blending:Tn,depthWrite:!1}));o.add(ae),N.push(ae)}let W=new j,z=new Se({color:8246268,transparent:!0,opacity:.85});for(let ce=0;ce<3;ce++){let ae=new j,He=.06+ce*.028,Ge=new E(new X(He*1.6,He*.35,He*.35),z);Ge.position.y=He*.7;let Ke=new E(new X(He*1.8,He*.32,He*.35),z);Ke.rotation.z=.72;let Ue=new E(new X(He*1.6,He*.35,He*.35),z);Ue.position.y=-He*.7,ae.add(Ge,Ke,Ue),W.add(ae)}W.visible=!1,o.add(W);let J=new j,U=new Se({color:16436245,side:at});for(let ce=0;ce<6;ce++){let ae=ce/6*Math.PI*2,He=new E(new Xe(.036,.16,4),U);He.position.set(Math.cos(ae)*.22,Math.sin(ae)*.22,0),He.rotation.z=ae-Math.PI/2,J.add(He)}J.visible=!1,o.add(J);let Q=new j,te=new Se({color:16638023});for(let ce=0;ce<3;ce++){let ae=new E(new St(.068,0),te);Q.add(ae)}Q.visible=!1,o.add(Q);let ue=new j,we=new Se({color:14870768,transparent:!0,opacity:.55});for(let ce=0;ce<4;ce++){let ae=new E(new se(.085,8,6),we);ue.add(ae)}ue.visible=!1,o.add(ue);let Ae=new j,q=new Se({color:1120295,transparent:!0,opacity:.94});for(let ce=0;ce<12;ce++){let ae=new E(new X(.068,.022,.024),q);Ae.add(ae)}Ae.visible=!1,o.add(Ae);let ie=new j,Ee=new Se({color:16708338,transparent:!0,opacity:.85}),me=new Se({color:15680580,transparent:!0,opacity:.92});for(let ce=0;ce<6;ce++){let ae=new E(new se(.065+ce%2*.022,8,6),ce%3===2?me:Ee);ie.add(ae)}ie.visible=!1,o.add(ie);let oe=new j,Ce=new Se({color:8246268,transparent:!0,opacity:.82});for(let ce=0;ce<10;ce++){let ae=new E(new se(.024,6,5),Ce);oe.add(ae)}oe.visible=!1,o.add(oe);let $=new j,Me=[16436245,16638023,3718648,16020150,4906624];for(let ce=0;ce<10;ce++){let ae=new E(new St(.062+ce%2*.025,0),new Se({color:Me[ce%Me.length],transparent:!0,opacity:.94}));$.add(ae)}$.visible=!1,o.add($);let ge=new j,ye=new Se({color:13358561,transparent:!0,opacity:.72}),S=new Se({color:15857145,transparent:!0,opacity:.78});for(let ce=0;ce<8;ce++){let ae=new E(new se(.095+ce%3*.028,8,6),ce%2===0?ye:S);ge.add(ae)}return ge.visible=!1,o.add(ge),{group:o,ambientPoints:C,ambientPositions:u,ambientSeeds:M,burstPoints:B,burstPositions:T,burstMat:I,streamDots:N,godRays:G,particleMode:d,sleepZGroup:W,shockBurstGroup:J,dizzyStarsGroup:Q,dustGroup:ue,hairCutGroup:Ae,angrySteamGroup:ie,sprayMistGroup:oe,celebrateStarsGroup:$,brakeSmokeGroup:ge}}function bd(n,e,t,i,s,r,o,a,l,c,h="none",d="none",p=0,u=0,m=!1,M="calm",g="calm",f=!1,_=null){let w=n.ambientPositions.length/3,y=n.particleMode==="snow"||n.particleMode==="petal"&&t>.6;for(let $=0;$<w;$++){let Me=n.ambientSeeds[$*3],ge=n.ambientSeeds[$*3+1],ye=n.ambientSeeds[$*3+2];if(n.particleMode==="firefly")n.ambientPositions[$*3]=ye+Math.sin(e*.9*ge+Me)*.45,n.ambientPositions[$*3+1]=.4+(($*.17+Math.sin(e*.65+Me)*.6)%2.8+2.8)%2.8;else{let S=((e*.14*ge+Me*.15)%1+1)%1;n.ambientPositions[$*3]=ye+Math.sin(e*1.1+Me)*.25,n.ambientPositions[$*3+1]=y?3.9-S*3.8:.15+S*3.8}}n.ambientPoints.geometry.attributes.position.needsUpdate=!0;for(let $=0;$<n.godRays.length;$++){let ge=n.godRays[$].material;ge.uniforms.uOpacity.value=.075+.04*Math.sin(e*.8+$*1.1)}let b=n.particleMode==="star",R=i==="Left"||i==="Right",C=i==="Left"?l:c;for(let $=0;$<n.streamDots.length;$++){let Me=n.streamDots[$],ge=Me.material;if(!R||b){ge.opacity=0;continue}let ye=i==="Left"?s+.2:r-.2,S=i==="Left"?r-.2:s+.2,ce=(e*1.35+$/n.streamDots.length)%1;Me.position.set(ye+(S-ye)*ce,1.38+Math.sin(ce*Math.PI)*.42+Math.sin(e*7+$)*.03,-.38+Math.cos(e*6+$)*.06),ge.color.set(C),ge.opacity=Math.sin(ce*Math.PI)*.22}if(R&&(b?m:(o==="laughing"||o==="surprised"||o==="proud"||m)&&(a<.4||m))){let $=Math.min(1,a/.4),Me=i==="Left"?s:r;n.burstMat.color.setHex(o==="angry"?16347926:16638023);let ge=n.burstPositions.length/3;for(let ye=0;ye<ge;ye++){let S=ye/ge*Math.PI*2,ce=.68+$*.92;n.burstPositions[ye*3]=Me+Math.cos(S)*ce,n.burstPositions[ye*3+1]=1.55+Math.sin(S)*ce*.85-$*.16,n.burstPositions[ye*3+2]=b?-1.08:-.42}n.burstPoints.geometry.attributes.position.needsUpdate=!0,n.burstMat.opacity=(1-$*.82)*(b?.36:.45)}else n.burstMat.opacity=0;let T=h==="sleeping";if(T||d==="sleeping"){n.sleepZGroup.visible=!0;let $=T?s:r,Me=(T?p:u)+.62,ge=T&&p>.25?-.78:-.35;n.sleepZGroup.children.forEach((ye,S)=>{let ce=(e*.55+S*.33)%1;ye.position.set($+Math.sin(e*2.2+S)*.12+ce*.14,Me+ce*.65,ge),ye.rotation.z=Math.sin(e*1.8+S)*.22;let ae=Math.sin(ce*Math.PI)*.85;ye.scale.setScalar(Math.max(.01,ae))})}else n.sleepZGroup.visible=!1;let I=f?0:i==="Right"?r:s,B=f?.04:i==="Right"?u:p,G=f?"corpseSnapUp":i==="Right"?d:h,N=b&&(f||m||(G==="shockedFall"||G==="wakingUp"||o==="surprised")&&a<.42),W=b&&(h==="punching"||h==="kicking"),z=b&&(d==="punching"||d==="kicking"),J=W?h:d,U=W||z?nc(e,J).recoil:0;if(U>.08){let $=W?r:s,Me=W?u:p;n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set($+(W?-.28:.28),Me+(J==="kicking"?.95:1.45),-.05),n.shockBurstGroup.rotation.z=e*3.1,n.shockBurstGroup.scale.setScalar(.45+U*.85)}else if(N){n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(I,B+2.08,-.18),n.shockBurstGroup.rotation.z=e*2.2;let $=.88+.18*Math.sin(e*16);n.shockBurstGroup.scale.setScalar($)}else n.shockBurstGroup.visible=!1;if(h==="slapForehead"||d==="slapForehead"||o==="confused"){n.dizzyStarsGroup.visible=!0;let $=d==="slapForehead"?r:h==="slapForehead"?s:I,Me=(d==="slapForehead"?u:h==="slapForehead"?p:B)+1.82;n.dizzyStarsGroup.children.forEach((ge,ye)=>{let S=e*4.5+ye/3*Math.PI*2;ge.position.set($+Math.cos(S)*.28,Me+Math.sin(S*2)*.04,Math.sin(S)*.24),ge.rotation.y=e*5})}else n.dizzyStarsGroup.visible=!1;let te=h==="walking"||h==="running";if(te||(d==="walking"||d==="running")){n.dustGroup.visible=!0;let $=te?s:r,Me=(te?p:u)+.06;n.dustGroup.children.forEach((ge,ye)=>{let S=(e*(h==="running"||d==="running"?3.2:1.8)+ye*.25)%1;ge.position.set($-S*.35+(ye%2===0?-.1:.1),Me+S*.28,-.05),ge.scale.setScalar(Math.max(.01,Math.sin(S*Math.PI)*1.25))})}else n.dustGroup.visible=!1;let we=h==="cutting";if(we||d==="cutting"){n.hairCutGroup.visible=!0;let $=we?r:s,Me=(we?u:p)+1.44,ge=-.6;n.hairCutGroup.children.forEach((ye,S)=>{let ce=(e*2.25+S*.13)%1,ae=(S%2===0?1:-1)*(.09+ce*.28);ye.position.set($+ae+Math.sin(e*7+S)*.04,Me-ce*1.12,ge+.08),ye.rotation.set(e*6+S,S*.9,e*8),ye.scale.setScalar(Math.max(.08,Math.sin(ce*Math.PI)*1.25))})}else n.hairCutGroup.visible=!1;let q=M==="angry",ie=g==="angry";if(q||ie||f){n.angrySteamGroup.visible=!0;let $=f?0:ie?r:s,Me=(f?.06:ie?u:p)+1.54,ge=f?-.06:ie?-.68:-.58;n.angrySteamGroup.children.forEach((ye,S)=>{let ce=S%2===0?-1:1,ae=(e*2.4+Math.floor(S/2)*.34)%1;ye.position.set($+ce*(.24+ae*.22),Me+ae*.36,ge),ye.scale.setScalar(Math.max(.05,Math.sin(ae*Math.PI)*.68))})}else n.angrySteamGroup.visible=!1;let Ee=h==="spraying";if(Ee||d==="spraying"){n.sprayMistGroup.visible=!0;let $=Ee?r:s,Me=(Ee?u:p)+1.48,ge=Ee?s:r;n.sprayMistGroup.children.forEach((ye,S)=>{let ce=(e*3.6+S*.1)%1,ae=(S%5-2)*.055;ye.position.set(ge+($-ge)*(.35+ce*.65),Me+ae+Math.sin(ce*3)*.04,-.62),ye.scale.setScalar(Math.max(.1,(1-ce*.4)*1.15))})}else n.sprayMistGroup.visible=!1;if(h==="celebrate"||d==="celebrate"||M==="proud"||g==="proud"||_==="tada"||_==="coin"){n.celebrateStarsGroup.visible=!0;let $=d==="celebrate"||g==="proud"?r:h==="celebrate"||M==="proud"?s:I,Me=(d==="celebrate"||g==="proud"?u:h==="celebrate"||M==="proud"?p:B)+1.55;n.celebrateStarsGroup.children.forEach((ge,ye)=>{let S=(e*1.9+ye*.12)%1,ce=ye/10*Math.PI*2+e*2.2,ae=.24+S*.46;ge.position.set($+Math.cos(ce)*ae,Me+Math.sin(ce)*.22+S*.44,-.46+Math.sin(ce)*.16),ge.rotation.set(e*4+ye,e*5,ye),ge.scale.setScalar(Math.max(.05,Math.sin(S*Math.PI)*1.25))})}else n.celebrateStarsGroup.visible=!1;if(h==="brakeStop"||d==="brakeStop"||h==="hazardTruck"||d==="hazardTruck"||_==="brake"){n.brakeSmokeGroup.visible=!0;let $=d==="brakeStop"||d==="hazardTruck"?r:h==="brakeStop"||h==="hazardTruck"?s:I,Me=(d==="brakeStop"||d==="hazardTruck"?u:h==="brakeStop"||h==="hazardTruck"?p:B)+.12;n.brakeSmokeGroup.children.forEach((ge,ye)=>{let S=(e*2.8+ye*.14)%1,ce=ye%2===0?-1:1;ge.position.set($+ce*(.14+S*.62),Me+S*.42,-.45+ye%3*.08),ge.scale.setScalar(Math.max(.08,Math.sin(S*Math.PI)*1.55))})}else n.brakeSmokeGroup.visible=!1}function Ra(n){return{...n,leftShoulderZ:-n.rightShoulderZ,leftElbowZ:-n.rightElbowZ,rightShoulderZ:-n.leftShoulderZ,rightElbowZ:-n.leftElbowZ,torsoTiltZ:-n.torsoTiltZ,headTiltZ:-n.headTiltZ,headYawY:-n.headYawY,hipOffsetX:-n.hipOffsetX,joints:n.joints?ud(n.joints):n.joints}}function RE(n,e,t){let i=.18+.32*Math.min(1,t*1.4);return n?i*Math.pow(1-n.phase,2.2):i*.5*(1+Math.cos(e*Math.PI*4))}function AE(n){return{width:n.width,height:n.height,fps:30,durationSeconds:60,totalFrames:1800,seed:n.seed??42,theme:"ComedyStage3D",vfxStyle:n.vfxStyle,enableDynamicCamera:n.dynamicZoom!==!1,isSeamlessLoop:!1,isComedyMode:!0,uniqueVariant:n.seed??42,title:"Motion Remix",palette:{primaryHex:n.primaryColor||"#F97316",secondaryHex:n.secondaryColor||"#38BDF8",speakerAHex:n.primaryColor||"#F97316",speakerBHex:n.secondaryColor||"#38BDF8",topBackdropHex:"#12182b",midBackdropHex:"#2c1e4a",botBackdropHex:"#0b0f1e"},hasCharacters:!0,supportingCast:[],turns:[],sceneRuns:[],backdropCount:0}}function ix(n,e){let t=new ya({canvas:n,antialias:!0,alpha:!1,preserveDrawingBuffer:!0,powerPreference:"high-performance"});t.setPixelRatio(1),t.setSize(e.width,e.height,!1),t.shadowMap.enabled=!0,t.shadowMap.type=vo,t.toneMapping=Io,t.toneMappingExposure=1.15;let i=new Vs,s=AE(e),r=e.setting==="Auto"?"ComedyStage":e.setting,o=Td(i,s,r,"Day",[]),a=null,l=null;if(e.customImageUrl){o.group.clear();let x=new E(new nt(14,14),new vi({opacity:.42}));x.rotation.x=-Math.PI/2,x.receiveShadow=!0,o.group.add(x),l=new js().load(e.customImageUrl),l.colorSpace=Lt;let B=e.width/Math.max(1,e.height),G=7.4;a=new E(new nt(G*B,G),new Se({map:l,depthWrite:!1})),a.position.set(0,1.35,-2.6),o.group.add(a)}else e.setting==="Auto"&&e.solidBgHex&&(i.background=new Pe(e.solidBgHex),i.fog=null);let c=Sd(i,r,e.vfxStyle,s.palette.primaryHex,s.palette.secondaryHex,s.seed),h=!!e.secondaryRole&&e.secondaryRole!=="None",d=h?-.78:0,p=.78,u=Sa({slot:"Left",name:"Lead",role:e.primaryRole,robeHex:e.primaryColor||null},s.palette.primaryHex,r,h?1:0,0);u.root.position.set(d,0,.14),h||(u.root.rotation.y=0),i.add(u.root);let m=h&&e.secondaryRole&&e.secondaryRole!=="None"?Sa({slot:"Right",name:"Partner",role:e.secondaryRole,robeHex:e.secondaryColor||null},s.palette.secondaryHex,r,-1,1.7):null;m&&(m.root.position.set(p,0,.02),i.add(m.root));let M=Math.max(0,Math.min(6,Math.round(e.troupeCount??0))),g=[];if(M>0){let x=e.troupeRole??(r==="PalaceCourt"?"NobleWoman":e.primaryRole),I=e.troupeColor||e.secondaryColor||"#7F1D1D";for(let B=0;B<M;B++){let G=B%2===0?-1:1,N=Math.floor(B/2),W=Sa({slot:G<0?"Left":"Right",name:`Dancer${B+1}`,role:x,robeHex:I},I,r,G<0?1:-1,(B+1)*.45),z=G*(1.68+N*.68),J=-.78-N*.44,U=G*-.18;W.root.position.set(z,0,J),W.root.rotation.y=U,W.root.scale.setScalar(.93),i.add(W.root),g.push({rig:W,side:G,baseRotY:U,phaseOffset:N*.12})}}let f=e.choreographyStyle&&e.choreographyStyle!=="auto"?e.choreographyStyle:r==="PalaceCourt"||r==="Temple"||r==="RiverGhat"||e.primaryRole==="NobleWoman"||e.primaryRole==="KingCrown"?"sufiKathak":"viralBounce",_=Math.max(u.topY,m?.topY??0),w=Math.max(.66,Math.min(1.08,_*.5)),y=(e.height>e.width?5.65:4.25)+(g.length>0?e.height>e.width?1.1:1.45:0),b=e.height>e.width,R=new At(b?40:37,e.width/Math.max(1,e.height),.1,100),C=new L(0,w+.24,y),H=new L(0,w,0);R.position.copy(C),R.lookAt(H);let T=Number.NaN;return{resize(x,I){t.setSize(x,I,!1),R.aspect=x/Math.max(1,I),R.updateProjectionMatrix()},render(x,I,B,G,N){vd(o,x,x%60/60,0,.5,null),N&&(B=Math.max(B,.36*Math.pow(1-N.phase,2)));let W=B>.55?"surprised":B>.25?"laughing":"happy";if(bd(c,x,x%60/60,h?"Left":"Narrator",d,p,W,.5,s.palette.primaryHex,s.palette.secondaryHex),a){let Me=1.03+.03*Math.sin(x*.45);a.scale.setScalar(Me)}let z=RE(N,x,B),J=(Me,ge)=>({...Me,hipOffsetX:Me.hipOffsetX*ge,grooveBend:Me.grooveBend??z}),U=I[0]?J(G?Ra(I[0]):I[0],.45):null,Q=N?.phase??0;if(U?(mr(u,U,x),u.root.rotation.y=h?.2:0):(ba(u,x,f,Q,!1,0,B),u.root.rotation.y=h?.18:0),m){let Me=I[1]?J(G?Ra(I[1]):I[1],.45):null;if(Me)mr(m,Me,x);else if(U){let ge=Ra(U);mr(m,{...ge,hipOffsetX:ge.hipOffsetX*.55,emotion:B>.45?"laughing":"happy",mouthOpen:B>.4?.55:.2},x)}else ba(m,x,f,Q,!0,.14,B);m.root.rotation.y=-.18}for(let Me of g){if(U&&I.length>0&&f==="viralBounce"){let ge=Me.side>0?Ra(U):U;mr(Me.rig,{...ge,hipOffsetX:ge.hipOffsetX*.35,liftY:0},x+Me.phaseOffset)}else ba(Me.rig,x,f,Q,Me.side>0,Me.phaseOffset,B);Me.rig.root.rotation.y=Me.baseRotY}let te=y,ue=0,we=w+.24,Ae=te,q=w,ie=e.cameraAngle??"autoCut",Ee=0;ie==="autoCut"&&(Ee=Math.floor(N?N.index/4:x/2.6),ie=["front","left34","right34","lowHero"][(Ee%4+4)%4]),ie==="left34"?(ue=-1.75,we=w+.36,Ae=te*.92):ie==="right34"?(ue=1.75,we=w+.36,Ae=te*.92):ie==="lowHero"&&(ue=.25,we=Math.max(.55,w-.18),Ae=te*.88,q=w+.14);let me=h?0:u.root.position.x+u.bodyPivot.position.x*.7,oe=g.length>0?me*.4:me;ue+=oe,e.dynamicZoom!==!1&&(Ae-=Math.min(.75,B*.85),N&&(Ae-=.22*Math.pow(1-N.phase,3)),ue+=Math.sin(x*1.1)*.1);let Ce=Ee!==T;T=Ee;let $=Ce?1:.18;C.lerp(new L(ue,we,Ae),$),H.lerp(new L(oe,q,0),$),R.position.copy(C),R.lookAt(H),t.render(i,R)},dispose(){l?.dispose(),t.dispose()}}}export{ix as createMotion3DStage};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
