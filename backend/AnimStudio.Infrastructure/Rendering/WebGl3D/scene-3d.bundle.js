"use strict";(()=>{var mc=0,Qa=1,gc=2;var ja=1,fo=2,Hn=3,Vn=0,Wt=1,xt=2,Yn=0,_i=1,Dn=2,el=3,tl=4,Ec=5,si=100,xc=101,yc=102,Mc=103,_c=104,vc=200,wc=201,Tc=202,Sc=203,Ur=204,Br=205,bc=206,Rc=207,Ac=208,Cc=209,Pc=210,Ic=211,Hc=212,Dc=213,Lc=214,po=0,mo=1,go=2,vi=3,Eo=4,xo=5,yo=6,Mo=7,nl=0,Uc=1,Bc=2,qn=0,Fc=1,Nc=2,Oc=3,_o=4,Gc=5,kc=6,zc=7;var il=300,Pi=301,Ii=302,vo=303,wo=304,Qs=306,Fr=1e3,ii=1001,Nr=1002,tn=1003,Vc=1004;var js=1005;var bn=1006,To=1007;var hi=1008;var Ln=1009,sl=1010,rl=1011,as=1012,So=1013,ui=1014,Un=1015,di=1016,bo=1017,Ro=1018,ls=1020,ol=35902,al=1021,ll=1022,nn=1023,cl=1024,hl=1025,$i=1026,cs=1027,ul=1028,Ao=1029,dl=1030,Co=1031;var Po=1033,er=33776,tr=33777,nr=33778,ir=33779,Io=35840,Ho=35841,Do=35842,Lo=35843,Uo=36196,Bo=37492,Fo=37496,No=37808,Oo=37809,Go=37810,ko=37811,zo=37812,Vo=37813,Wo=37814,Xo=37815,Yo=37816,qo=37817,Zo=37818,Jo=37819,Ko=37820,$o=37821,sr=36492,Qo=36494,jo=36495,fl=36283,ea=36284,ta=36285,na=36286;var Ss=2300,Or=2301,Lr=2302,ka=2400,za=2401,Va=2402;var Wc=3200,Xc=3201;var pl=0,Yc=1,Zn="",Ut="srgb",wi="srgb-linear",bs="linear",Et="srgb";var Mi=7680;var Wa=519,qc=512,Zc=513,Jc=514,ml=515,Kc=516,$c=517,Qc=518,jc=519,Xa=35044;var gl="300 es",Pn=2e3,Rs=2001;var Wn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Yt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var fa=Math.PI/180,As=180/Math.PI;function rr(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Yt[n&255]+Yt[n>>8&255]+Yt[n>>16&255]+Yt[n>>24&255]+"-"+Yt[e&255]+Yt[e>>8&255]+"-"+Yt[e>>16&15|64]+Yt[e>>24&255]+"-"+Yt[t&63|128]+Yt[t>>8&255]+"-"+Yt[t>>16&255]+Yt[t>>24&255]+Yt[i&255]+Yt[i>>8&255]+Yt[i>>16&255]+Yt[i>>24&255]).toLowerCase()}function nt(n,e,t){return Math.max(e,Math.min(t,n))}function Kh(n,e){return(n%e+e)%e}function pa(n,e,t){return(1-t)*n+t*e}function gs(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function en(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var ye=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=nt(this.x,e.x,t.x),this.y=nt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=nt(this.x,e,t),this.y=nt(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(nt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(nt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},je=class n{constructor(e,t,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],u=i[7],p=i[2],f=i[5],g=i[8],m=s[0],E=s[3],d=s[6],_=s[1],M=s[4],x=s[7],b=s[2],R=s[5],A=s[8];return r[0]=o*m+a*_+l*b,r[3]=o*E+a*M+l*R,r[6]=o*d+a*x+l*A,r[1]=c*m+h*_+u*b,r[4]=c*E+h*M+u*R,r[7]=c*d+h*x+u*A,r[2]=p*m+f*_+g*b,r[5]=p*E+f*M+g*R,r[8]=p*d+f*x+g*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=h*o-a*c,p=a*l-h*r,f=c*r-o*l,g=t*u+i*p+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/g;return e[0]=u*m,e[1]=(s*c-h*i)*m,e[2]=(a*i-s*o)*m,e[3]=p*m,e[4]=(h*t-s*l)*m,e[5]=(s*r-a*t)*m,e[6]=f*m,e[7]=(i*l-c*t)*m,e[8]=(o*t-i*r)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(ma.makeScale(e,t)),this}rotate(e){return this.premultiply(ma.makeRotation(-e)),this}translate(e,t){return this.premultiply(ma.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ma=new je;function El(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Cs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function eh(){let n=Cs("canvas");return n.style.display="block",n}var zl={};function or(n){n in zl||(zl[n]=!0,console.warn(n))}function th(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function nh(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function ih(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var Vl=new je().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Wl=new je().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function $h(){let n={enabled:!0,workingColorSpace:wi,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Et&&(s.r=zn(s.r),s.g=zn(s.g),s.b=zn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Et&&(s.r=Ki(s.r),s.g=Ki(s.g),s.b=Ki(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Zn?bs:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[wi]:{primaries:e,whitePoint:i,transfer:bs,toXYZ:Vl,fromXYZ:Wl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ut},outputColorSpaceConfig:{drawingBufferColorSpace:Ut}},[Ut]:{primaries:e,whitePoint:i,transfer:Et,toXYZ:Vl,fromXYZ:Wl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ut}}}),n}var ht=$h();function zn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ki(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Ni,Gr=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Ni===void 0&&(Ni=Cs("canvas")),Ni.width=e.width,Ni.height=e.height;let s=Ni.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=Ni}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Cs("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=zn(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(zn(t[i]/255)*255):t[i]=zn(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Qh=0,Qi=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Qh++}),this.uuid=rr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ga(s[o].image)):r.push(ga(s[o]))}else r=ga(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function ga(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Gr.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var jh=0,$t=class n extends Wn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=ii,s=ii,r=bn,o=hi,a=nn,l=Ln,c=n.DEFAULT_ANISOTROPY,h=Zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:jh++}),this.uuid=rr(),this.name="",this.source=new Qi(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ye(0,0),this.repeat=new ye(1,1),this.center=new ye(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new je,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==il)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Fr:e.x=e.x-Math.floor(e.x);break;case ii:e.x=e.x<0?0:1;break;case Nr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Fr:e.y=e.y-Math.floor(e.y);break;case ii:e.y=e.y<0?0:1;break;case Nr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};$t.DEFAULT_IMAGE=null;$t.DEFAULT_MAPPING=il;$t.DEFAULT_ANISOTROPY=1;var dt=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],p=l[1],f=l[5],g=l[9],m=l[2],E=l[6],d=l[10];if(Math.abs(h-p)<.01&&Math.abs(u-m)<.01&&Math.abs(g-E)<.01){if(Math.abs(h+p)<.1&&Math.abs(u+m)<.1&&Math.abs(g+E)<.1&&Math.abs(c+f+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let M=(c+1)/2,x=(f+1)/2,b=(d+1)/2,R=(h+p)/4,A=(u+m)/4,C=(g+E)/4;return M>x&&M>b?M<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(M),s=R/i,r=A/i):x>b?x<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),i=R/s,r=C/s):b<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),i=A/r,s=C/r),this.set(i,s,r,t),this}let _=Math.sqrt((E-g)*(E-g)+(u-m)*(u-m)+(p-h)*(p-h));return Math.abs(_)<.001&&(_=1),this.x=(E-g)/_,this.y=(u-m)/_,this.z=(p-h)/_,this.w=Math.acos((c+f+d-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=nt(this.x,e.x,t.x),this.y=nt(this.y,e.y,t.y),this.z=nt(this.z,e.z,t.z),this.w=nt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=nt(this.x,e,t),this.y=nt(this.y,e,t),this.z=nt(this.z,e,t),this.w=nt(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(nt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},kr=class extends Wn{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t);let s={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:bn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new $t(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Qi(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},En=class extends kr{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Ps=class extends $t{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var zr=class extends $t{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=tn,this.minFilter=tn,this.wrapR=ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var At=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],u=i[s+3],p=r[o+0],f=r[o+1],g=r[o+2],m=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=p,e[t+1]=f,e[t+2]=g,e[t+3]=m;return}if(u!==m||l!==p||c!==f||h!==g){let E=1-a,d=l*p+c*f+h*g+u*m,_=d>=0?1:-1,M=1-d*d;if(M>Number.EPSILON){let b=Math.sqrt(M),R=Math.atan2(b,d*_);E=Math.sin(E*R)/b,a=Math.sin(a*R)/b}let x=a*_;if(l=l*E+p*x,c=c*E+f*x,h=h*E+g*x,u=u*E+m*x,E===1-a){let b=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=b,c*=b,h*=b,u*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],u=r[o],p=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+h*u+l*f-c*p,e[t+1]=l*g+h*p+c*u-a*f,e[t+2]=c*g+h*f+a*p-l*u,e[t+3]=h*g-a*u-l*p-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),u=a(r/2),p=l(i/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=p*h*u+c*f*g,this._y=c*f*u-p*h*g,this._z=c*h*g+p*f*u,this._w=c*h*u-p*f*g;break;case"YXZ":this._x=p*h*u+c*f*g,this._y=c*f*u-p*h*g,this._z=c*h*g-p*f*u,this._w=c*h*u+p*f*g;break;case"ZXY":this._x=p*h*u-c*f*g,this._y=c*f*u+p*h*g,this._z=c*h*g+p*f*u,this._w=c*h*u-p*f*g;break;case"ZYX":this._x=p*h*u-c*f*g,this._y=c*f*u+p*h*g,this._z=c*h*g-p*f*u,this._w=c*h*u+p*f*g;break;case"YZX":this._x=p*h*u+c*f*g,this._y=c*f*u+p*h*g,this._z=c*h*g-p*f*u,this._w=c*h*u-p*f*g;break;case"XZY":this._x=p*h*u-c*f*g,this._y=c*f*u-p*h*g,this._z=c*h*g+p*f*u,this._w=c*h*u+p*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],u=t[10],p=i+a+u;if(p>0){let f=.5/Math.sqrt(p+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(i>a&&i>u){let f=2*Math.sqrt(1+i-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>u){let f=2*Math.sqrt(1+a-i-u);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-i-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(nt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*i+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-t)*h)/c,p=Math.sin(t*h)/c;return this._w=o*u+this._w*p,this._x=i*u+this._x*p,this._y=s*u+this._y*p,this._z=r*u+this._z*p,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},I=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Xl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Xl.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),h=2*(a*t-r*s),u=2*(r*i-o*t);return this.x=t+l*c+o*u-a*h,this.y=i+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=nt(this.x,e.x,t.x),this.y=nt(this.y,e.y,t.y),this.z=nt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=nt(this.x,e,t),this.y=nt(this.y,e,t),this.z=nt(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(nt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ea.copy(this).projectOnVector(e),this.sub(Ea)}reflect(e){return this.sub(Ea.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(nt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ea=new I,Xl=new At,ri=class{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(wn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(wn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=wn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,wn):wn.fromBufferAttribute(r,o),wn.applyMatrix4(e.matrixWorld),this.expandByPoint(wn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ur.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ur.copy(i.boundingBox)),ur.applyMatrix4(e.matrixWorld),this.union(ur)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,wn),wn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Es),dr.subVectors(this.max,Es),Oi.subVectors(e.a,Es),Gi.subVectors(e.b,Es),ki.subVectors(e.c,Es),Kn.subVectors(Gi,Oi),$n.subVectors(ki,Gi),gi.subVectors(Oi,ki);let t=[0,-Kn.z,Kn.y,0,-$n.z,$n.y,0,-gi.z,gi.y,Kn.z,0,-Kn.x,$n.z,0,-$n.x,gi.z,0,-gi.x,-Kn.y,Kn.x,0,-$n.y,$n.x,0,-gi.y,gi.x,0];return!xa(t,Oi,Gi,ki,dr)||(t=[1,0,0,0,1,0,0,0,1],!xa(t,Oi,Gi,ki,dr))?!1:(fr.crossVectors(Kn,$n),t=[fr.x,fr.y,fr.z],xa(t,Oi,Gi,ki,dr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,wn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(wn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Fn=[new I,new I,new I,new I,new I,new I,new I,new I],wn=new I,ur=new ri,Oi=new I,Gi=new I,ki=new I,Kn=new I,$n=new I,gi=new I,Es=new I,dr=new I,fr=new I,Ei=new I;function xa(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){Ei.fromArray(n,r);let a=s.x*Math.abs(Ei.x)+s.y*Math.abs(Ei.y)+s.z*Math.abs(Ei.z),l=e.dot(Ei),c=t.dot(Ei),h=i.dot(Ei);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var eu=new ri,xs=new I,ya=new I,oi=class{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):eu.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;xs.subVectors(e,this.center);let t=xs.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(xs,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ya.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(xs.copy(e.center).add(ya)),this.expandByPoint(xs.copy(e.center).sub(ya))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Nn=new I,Ma=new I,pr=new I,Qn=new I,_a=new I,mr=new I,va=new I,ji=class{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Nn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Nn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Nn.copy(this.origin).addScaledVector(this.direction,t),Nn.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Ma.copy(e).add(t).multiplyScalar(.5),pr.copy(t).sub(e).normalize(),Qn.copy(this.origin).sub(Ma);let r=e.distanceTo(t)*.5,o=-this.direction.dot(pr),a=Qn.dot(this.direction),l=-Qn.dot(pr),c=Qn.lengthSq(),h=Math.abs(1-o*o),u,p,f,g;if(h>0)if(u=o*l-a,p=o*a-l,g=r*h,u>=0)if(p>=-g)if(p<=g){let m=1/h;u*=m,p*=m,f=u*(u+o*p+2*a)+p*(o*u+p+2*l)+c}else p=r,u=Math.max(0,-(o*p+a)),f=-u*u+p*(p+2*l)+c;else p=-r,u=Math.max(0,-(o*p+a)),f=-u*u+p*(p+2*l)+c;else p<=-g?(u=Math.max(0,-(-o*r+a)),p=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+p*(p+2*l)+c):p<=g?(u=0,p=Math.min(Math.max(-r,-l),r),f=p*(p+2*l)+c):(u=Math.max(0,-(o*r+a)),p=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+p*(p+2*l)+c);else p=o>0?-r:r,u=Math.max(0,-(o*p+a)),f=-u*u+p*(p+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Ma).addScaledVector(pr,p),f}intersectSphere(e,t){Nn.subVectors(e.center,this.origin);let i=Nn.dot(this.direction),s=Nn.dot(Nn)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,p=this.origin;return c>=0?(i=(e.min.x-p.x)*c,s=(e.max.x-p.x)*c):(i=(e.max.x-p.x)*c,s=(e.min.x-p.x)*c),h>=0?(r=(e.min.y-p.y)*h,o=(e.max.y-p.y)*h):(r=(e.max.y-p.y)*h,o=(e.min.y-p.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-p.z)*u,l=(e.max.z-p.z)*u):(a=(e.max.z-p.z)*u,l=(e.min.z-p.z)*u),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Nn)!==null}intersectTriangle(e,t,i,s,r){_a.subVectors(t,e),mr.subVectors(i,e),va.crossVectors(_a,mr);let o=this.direction.dot(va),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Qn.subVectors(this.origin,e);let l=a*this.direction.dot(mr.crossVectors(Qn,mr));if(l<0)return null;let c=a*this.direction.dot(_a.cross(Qn));if(c<0||l+c>o)return null;let h=-a*Qn.dot(va);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},pt=class n{constructor(e,t,i,s,r,o,a,l,c,h,u,p,f,g,m,E){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,h,u,p,f,g,m,E)}set(e,t,i,s,r,o,a,l,c,h,u,p,f,g,m,E){let d=this.elements;return d[0]=e,d[4]=t,d[8]=i,d[12]=s,d[1]=r,d[5]=o,d[9]=a,d[13]=l,d[2]=c,d[6]=h,d[10]=u,d[14]=p,d[3]=f,d[7]=g,d[11]=m,d[15]=E,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/zi.setFromMatrixColumn(e,0).length(),r=1/zi.setFromMatrixColumn(e,1).length(),o=1/zi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let p=o*h,f=o*u,g=a*h,m=a*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+g*c,t[5]=p-m*c,t[9]=-a*l,t[2]=m-p*c,t[6]=g+f*c,t[10]=o*l}else if(e.order==="YXZ"){let p=l*h,f=l*u,g=c*h,m=c*u;t[0]=p+m*a,t[4]=g*a-f,t[8]=o*c,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=f*a-g,t[6]=m+p*a,t[10]=o*l}else if(e.order==="ZXY"){let p=l*h,f=l*u,g=c*h,m=c*u;t[0]=p-m*a,t[4]=-o*u,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*h,t[9]=m-p*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let p=o*h,f=o*u,g=a*h,m=a*u;t[0]=l*h,t[4]=g*c-f,t[8]=p*c+m,t[1]=l*u,t[5]=m*c+p,t[9]=f*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let p=o*l,f=o*c,g=a*l,m=a*c;t[0]=l*h,t[4]=m-p*u,t[8]=g*u+f,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=f*u+g,t[10]=p-m*u}else if(e.order==="XZY"){let p=o*l,f=o*c,g=a*l,m=a*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=p*u+m,t[5]=o*h,t[9]=f*u-g,t[2]=g*u-f,t[6]=a*h,t[10]=m*u+p}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(tu,e,nu)}lookAt(e,t,i){let s=this.elements;return ln.subVectors(e,t),ln.lengthSq()===0&&(ln.z=1),ln.normalize(),jn.crossVectors(i,ln),jn.lengthSq()===0&&(Math.abs(i.z)===1?ln.x+=1e-4:ln.z+=1e-4,ln.normalize(),jn.crossVectors(i,ln)),jn.normalize(),gr.crossVectors(ln,jn),s[0]=jn.x,s[4]=gr.x,s[8]=ln.x,s[1]=jn.y,s[5]=gr.y,s[9]=ln.y,s[2]=jn.z,s[6]=gr.z,s[10]=ln.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],u=i[5],p=i[9],f=i[13],g=i[2],m=i[6],E=i[10],d=i[14],_=i[3],M=i[7],x=i[11],b=i[15],R=s[0],A=s[4],C=s[8],w=s[12],v=s[1],H=s[5],z=s[9],G=s[13],J=s[2],Y=s[6],Z=s[10],se=s[14],B=s[3],te=s[7],re=s[11],j=s[15];return r[0]=o*R+a*v+l*J+c*B,r[4]=o*A+a*H+l*Y+c*te,r[8]=o*C+a*z+l*Z+c*re,r[12]=o*w+a*G+l*se+c*j,r[1]=h*R+u*v+p*J+f*B,r[5]=h*A+u*H+p*Y+f*te,r[9]=h*C+u*z+p*Z+f*re,r[13]=h*w+u*G+p*se+f*j,r[2]=g*R+m*v+E*J+d*B,r[6]=g*A+m*H+E*Y+d*te,r[10]=g*C+m*z+E*Z+d*re,r[14]=g*w+m*G+E*se+d*j,r[3]=_*R+M*v+x*J+b*B,r[7]=_*A+M*H+x*Y+b*te,r[11]=_*C+M*z+x*Z+b*re,r[15]=_*w+M*G+x*se+b*j,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],u=e[6],p=e[10],f=e[14],g=e[3],m=e[7],E=e[11],d=e[15];return g*(+r*l*u-s*c*u-r*a*p+i*c*p+s*a*f-i*l*f)+m*(+t*l*f-t*c*p+r*o*p-s*o*f+s*c*h-r*l*h)+E*(+t*c*u-t*a*f-r*o*u+i*o*f+r*a*h-i*c*h)+d*(-s*a*h-t*l*u+t*a*p+s*o*u-i*o*p+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=e[9],p=e[10],f=e[11],g=e[12],m=e[13],E=e[14],d=e[15],_=u*E*c-m*p*c+m*l*f-a*E*f-u*l*d+a*p*d,M=g*p*c-h*E*c-g*l*f+o*E*f+h*l*d-o*p*d,x=h*m*c-g*u*c+g*a*f-o*m*f-h*a*d+o*u*d,b=g*u*l-h*m*l-g*a*p+o*m*p+h*a*E-o*u*E,R=t*_+i*M+s*x+r*b;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/R;return e[0]=_*A,e[1]=(m*p*r-u*E*r-m*s*f+i*E*f+u*s*d-i*p*d)*A,e[2]=(a*E*r-m*l*r+m*s*c-i*E*c-a*s*d+i*l*d)*A,e[3]=(u*l*r-a*p*r-u*s*c+i*p*c+a*s*f-i*l*f)*A,e[4]=M*A,e[5]=(h*E*r-g*p*r+g*s*f-t*E*f-h*s*d+t*p*d)*A,e[6]=(g*l*r-o*E*r-g*s*c+t*E*c+o*s*d-t*l*d)*A,e[7]=(o*p*r-h*l*r+h*s*c-t*p*c-o*s*f+t*l*f)*A,e[8]=x*A,e[9]=(g*u*r-h*m*r-g*i*f+t*m*f+h*i*d-t*u*d)*A,e[10]=(o*m*r-g*a*r+g*i*c-t*m*c-o*i*d+t*a*d)*A,e[11]=(h*a*r-o*u*r-h*i*c+t*u*c+o*i*f-t*a*f)*A,e[12]=b*A,e[13]=(h*m*s-g*u*s+g*i*p-t*m*p-h*i*E+t*u*E)*A,e[14]=(g*a*s-o*m*s-g*i*l+t*m*l+o*i*E-t*a*E)*A,e[15]=(o*u*s-h*a*s+h*i*l-t*u*l-o*i*p+t*a*p)*A,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,u=a+a,p=r*c,f=r*h,g=r*u,m=o*h,E=o*u,d=a*u,_=l*c,M=l*h,x=l*u,b=i.x,R=i.y,A=i.z;return s[0]=(1-(m+d))*b,s[1]=(f+x)*b,s[2]=(g-M)*b,s[3]=0,s[4]=(f-x)*R,s[5]=(1-(p+d))*R,s[6]=(E+_)*R,s[7]=0,s[8]=(g+M)*A,s[9]=(E-_)*A,s[10]=(1-(p+m))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=zi.set(s[0],s[1],s[2]).length(),o=zi.set(s[4],s[5],s[6]).length(),a=zi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Tn.copy(this);let c=1/r,h=1/o,u=1/a;return Tn.elements[0]*=c,Tn.elements[1]*=c,Tn.elements[2]*=c,Tn.elements[4]*=h,Tn.elements[5]*=h,Tn.elements[6]*=h,Tn.elements[8]*=u,Tn.elements[9]*=u,Tn.elements[10]*=u,t.setFromRotationMatrix(Tn),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=Pn){let l=this.elements,c=2*r/(t-e),h=2*r/(i-s),u=(t+e)/(t-e),p=(i+s)/(i-s),f,g;if(a===Pn)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Rs)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=Pn){let l=this.elements,c=1/(t-e),h=1/(i-s),u=1/(o-r),p=(t+e)*c,f=(i+s)*h,g,m;if(a===Pn)g=(o+r)*u,m=-2*u;else if(a===Rs)g=r*u,m=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-p,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=m,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},zi=new I,Tn=new pt,tu=new I(0,0,0),nu=new I(1,1,1),jn=new I,gr=new I,ln=new I,Yl=new pt,ql=new At,Qt=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],p=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(nt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-nt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(nt(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-nt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(p,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(nt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-nt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Yl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Yl,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ql.setFromEuler(this),this.setFromQuaternion(ql,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Qt.DEFAULT_ORDER="XYZ";var Is=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},iu=0,Zl=new I,Vi=new At,On=new pt,Er=new I,ys=new I,su=new I,ru=new At,Jl=new I(1,0,0),Kl=new I(0,1,0),$l=new I(0,0,1),Ql={type:"added"},ou={type:"removed"},Wi={type:"childadded",child:null},wa={type:"childremoved",child:null},Tt=class n extends Wn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:iu++}),this.uuid=rr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new I,t=new Qt,i=new At,s=new I(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new pt},normalMatrix:{value:new je}}),this.matrix=new pt,this.matrixWorld=new pt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Is,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Vi.setFromAxisAngle(e,t),this.quaternion.multiply(Vi),this}rotateOnWorldAxis(e,t){return Vi.setFromAxisAngle(e,t),this.quaternion.premultiply(Vi),this}rotateX(e){return this.rotateOnAxis(Jl,e)}rotateY(e){return this.rotateOnAxis(Kl,e)}rotateZ(e){return this.rotateOnAxis($l,e)}translateOnAxis(e,t){return Zl.copy(e).applyQuaternion(this.quaternion),this.position.add(Zl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Jl,e)}translateY(e){return this.translateOnAxis(Kl,e)}translateZ(e){return this.translateOnAxis($l,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(On.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Er.copy(e):Er.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),ys.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?On.lookAt(ys,Er,this.up):On.lookAt(Er,ys,this.up),this.quaternion.setFromRotationMatrix(On),s&&(On.extractRotation(s.matrixWorld),Vi.setFromRotationMatrix(On),this.quaternion.premultiply(Vi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ql),Wi.child=e,this.dispatchEvent(Wi),Wi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ou),wa.child=e,this.dispatchEvent(wa),wa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),On.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),On.multiply(e.parent.matrixWorld)),e.applyMatrix4(On),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ql),Wi.child=e,this.dispatchEvent(Wi),Wi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ys,e,su),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ys,ru,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),u=o(e.shapes),p=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),p.length>0&&(i.skeletons=p),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Tt.DEFAULT_UP=new I(0,1,0);Tt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Tt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Sn=new I,Gn=new I,Ta=new I,kn=new I,Xi=new I,Yi=new I,jl=new I,Sa=new I,ba=new I,Ra=new I,Aa=new dt,Ca=new dt,Pa=new dt,ni=class n{constructor(e=new I,t=new I,i=new I){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Sn.subVectors(e,t),s.cross(Sn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){Sn.subVectors(s,t),Gn.subVectors(i,t),Ta.subVectors(e,t);let o=Sn.dot(Sn),a=Sn.dot(Gn),l=Sn.dot(Ta),c=Gn.dot(Gn),h=Gn.dot(Ta),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let p=1/u,f=(c*l-a*h)*p,g=(o*h-a*l)*p;return r.set(1-f-g,g,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,kn)===null?!1:kn.x>=0&&kn.y>=0&&kn.x+kn.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,kn.x),l.addScaledVector(o,kn.y),l.addScaledVector(a,kn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return Aa.setScalar(0),Ca.setScalar(0),Pa.setScalar(0),Aa.fromBufferAttribute(e,t),Ca.fromBufferAttribute(e,i),Pa.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Aa,r.x),o.addScaledVector(Ca,r.y),o.addScaledVector(Pa,r.z),o}static isFrontFacing(e,t,i,s){return Sn.subVectors(i,t),Gn.subVectors(e,t),Sn.cross(Gn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Sn.subVectors(this.c,this.b),Gn.subVectors(this.a,this.b),Sn.cross(Gn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;Xi.subVectors(s,i),Yi.subVectors(r,i),Sa.subVectors(e,i);let l=Xi.dot(Sa),c=Yi.dot(Sa);if(l<=0&&c<=0)return t.copy(i);ba.subVectors(e,s);let h=Xi.dot(ba),u=Yi.dot(ba);if(h>=0&&u<=h)return t.copy(s);let p=l*u-h*c;if(p<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector(Xi,o);Ra.subVectors(e,r);let f=Xi.dot(Ra),g=Yi.dot(Ra);if(g>=0&&f<=g)return t.copy(r);let m=f*c-l*g;if(m<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(i).addScaledVector(Yi,a);let E=h*g-f*u;if(E<=0&&u-h>=0&&f-g>=0)return jl.subVectors(r,s),a=(u-h)/(u-h+(f-g)),t.copy(s).addScaledVector(jl,a);let d=1/(E+m+p);return o=m*d,a=p*d,t.copy(i).addScaledVector(Xi,o).addScaledVector(Yi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},sh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ei={h:0,s:0,l:0},xr={h:0,s:0,l:0};function Ia(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var De=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ht.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=ht.workingColorSpace){return this.r=e,this.g=t,this.b=i,ht.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=ht.workingColorSpace){if(e=Kh(e,1),t=nt(t,0,1),i=nt(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Ia(o,r,e+1/3),this.g=Ia(o,r,e),this.b=Ia(o,r,e-1/3)}return ht.toWorkingColorSpace(this,s),this}setStyle(e,t=Ut){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ut){let i=sh[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=zn(e.r),this.g=zn(e.g),this.b=zn(e.b),this}copyLinearToSRGB(e){return this.r=Ki(e.r),this.g=Ki(e.g),this.b=Ki(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ut){return ht.fromWorkingColorSpace(qt.copy(this),e),Math.round(nt(qt.r*255,0,255))*65536+Math.round(nt(qt.g*255,0,255))*256+Math.round(nt(qt.b*255,0,255))}getHexString(e=Ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ht.workingColorSpace){ht.fromWorkingColorSpace(qt.copy(this),t);let i=qt.r,s=qt.g,r=qt.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case i:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-i)/u+2;break;case r:l=(i-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=ht.workingColorSpace){return ht.fromWorkingColorSpace(qt.copy(this),t),e.r=qt.r,e.g=qt.g,e.b=qt.b,e}getStyle(e=Ut){ht.fromWorkingColorSpace(qt.copy(this),e);let t=qt.r,i=qt.g,s=qt.b;return e!==Ut?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(ei),this.setHSL(ei.h+e,ei.s+t,ei.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ei),e.getHSL(xr);let i=pa(ei.h,xr.h,t),s=pa(ei.s,xr.s,t),r=pa(ei.l,xr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},qt=new De;De.NAMES=sh;var au=0,Rn=class extends Wn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:au++}),this.uuid=rr(),this.name="",this.type="Material",this.blending=_i,this.side=Vn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ur,this.blendDst=Br,this.blendEquation=si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new De(0,0,0),this.blendAlpha=0,this.depthFunc=vi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Wa,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Mi,this.stencilZFail=Mi,this.stencilZPass=Mi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==_i&&(i.blending=this.blending),this.side!==Vn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Ur&&(i.blendSrc=this.blendSrc),this.blendDst!==Br&&(i.blendDst=this.blendDst),this.blendEquation!==si&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==vi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Wa&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Mi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Mi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Mi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},ke=class extends Rn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new De(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Qt,this.combine=nl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ht=new I,yr=new ye,lu=0,kt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:lu++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Xa,this.updateRanges=[],this.gpuType=Un,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)yr.fromBufferAttribute(this,t),yr.applyMatrix3(e),this.setXY(t,yr.x,yr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyMatrix3(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyMatrix4(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyNormalMatrix(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.transformDirection(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=gs(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=en(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=gs(t,this.array)),t}setX(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=gs(t,this.array)),t}setY(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=gs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=gs(t,this.array)),t}setW(e,t){return this.normalized&&(t=en(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),i=en(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),i=en(i,this.array),s=en(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=en(t,this.array),i=en(i,this.array),s=en(s,this.array),r=en(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Xa&&(e.usage=this.usage),e}};var Hs=class extends kt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Ds=class extends kt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var it=class extends kt{constructor(e,t,i){super(new Float32Array(e),t,i)}},cu=0,mn=new pt,Ha=new Tt,qi=new I,cn=new ri,Ms=new ri,Ot=new I,St=class n extends Wn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:cu++}),this.uuid=rr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(El(e)?Ds:Hs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new je().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return mn.makeRotationFromQuaternion(e),this.applyMatrix4(mn),this}rotateX(e){return mn.makeRotationX(e),this.applyMatrix4(mn),this}rotateY(e){return mn.makeRotationY(e),this.applyMatrix4(mn),this}rotateZ(e){return mn.makeRotationZ(e),this.applyMatrix4(mn),this}translate(e,t,i){return mn.makeTranslation(e,t,i),this.applyMatrix4(mn),this}scale(e,t,i){return mn.makeScale(e,t,i),this.applyMatrix4(mn),this}lookAt(e){return Ha.lookAt(e),Ha.updateMatrix(),this.applyMatrix4(Ha.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qi).negate(),this.translate(qi.x,qi.y,qi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new it(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ri);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];cn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ot.addVectors(this.boundingBox.min,cn.min),this.boundingBox.expandByPoint(Ot),Ot.addVectors(this.boundingBox.max,cn.max),this.boundingBox.expandByPoint(Ot)):(this.boundingBox.expandByPoint(cn.min),this.boundingBox.expandByPoint(cn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){let i=this.boundingSphere.center;if(cn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Ms.setFromBufferAttribute(a),this.morphTargetsRelative?(Ot.addVectors(cn.min,Ms.min),cn.expandByPoint(Ot),Ot.addVectors(cn.max,Ms.max),cn.expandByPoint(Ot)):(cn.expandByPoint(Ms.min),cn.expandByPoint(Ms.max))}cn.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)Ot.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Ot));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Ot.fromBufferAttribute(a,c),l&&(qi.fromBufferAttribute(e,c),Ot.add(qi)),s=Math.max(s,i.distanceToSquared(Ot))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new kt(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let C=0;C<i.count;C++)a[C]=new I,l[C]=new I;let c=new I,h=new I,u=new I,p=new ye,f=new ye,g=new ye,m=new I,E=new I;function d(C,w,v){c.fromBufferAttribute(i,C),h.fromBufferAttribute(i,w),u.fromBufferAttribute(i,v),p.fromBufferAttribute(r,C),f.fromBufferAttribute(r,w),g.fromBufferAttribute(r,v),h.sub(c),u.sub(c),f.sub(p),g.sub(p);let H=1/(f.x*g.y-g.x*f.y);isFinite(H)&&(m.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(H),E.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(H),a[C].add(m),a[w].add(m),a[v].add(m),l[C].add(E),l[w].add(E),l[v].add(E))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let C=0,w=_.length;C<w;++C){let v=_[C],H=v.start,z=v.count;for(let G=H,J=H+z;G<J;G+=3)d(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let M=new I,x=new I,b=new I,R=new I;function A(C){b.fromBufferAttribute(s,C),R.copy(b);let w=a[C];M.copy(w),M.sub(b.multiplyScalar(b.dot(w))).normalize(),x.crossVectors(R,w);let H=x.dot(l[C])<0?-1:1;o.setXYZW(C,M.x,M.y,M.z,H)}for(let C=0,w=_.length;C<w;++C){let v=_[C],H=v.start,z=v.count;for(let G=H,J=H+z;G<J;G+=3)A(e.getX(G+0)),A(e.getX(G+1)),A(e.getX(G+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new kt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let p=0,f=i.count;p<f;p++)i.setXYZ(p,0,0,0);let s=new I,r=new I,o=new I,a=new I,l=new I,c=new I,h=new I,u=new I;if(e)for(let p=0,f=e.count;p<f;p+=3){let g=e.getX(p+0),m=e.getX(p+1),E=e.getX(p+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,m),o.fromBufferAttribute(t,E),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(i,g),l.fromBufferAttribute(i,m),c.fromBufferAttribute(i,E),a.add(h),l.add(h),c.add(h),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(m,l.x,l.y,l.z),i.setXYZ(E,c.x,c.y,c.z)}else for(let p=0,f=t.count;p<f;p+=3)s.fromBufferAttribute(t,p+0),r.fromBufferAttribute(t,p+1),o.fromBufferAttribute(t,p+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),i.setXYZ(p+0,h.x,h.y,h.z),i.setXYZ(p+1,h.x,h.y,h.z),i.setXYZ(p+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Ot.fromBufferAttribute(e,t),Ot.normalize(),e.setXYZ(t,Ot.x,Ot.y,Ot.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,u=a.normalized,p=new c.constructor(l.length*h),f=0,g=0;for(let m=0,E=l.length;m<E;m++){a.isInterleavedBufferAttribute?f=l[m]*a.data.stride+a.offset:f=l[m]*h;for(let d=0;d<h;d++)p[g++]=c[f++]}return new kt(p,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let p=c[h],f=e(p,i);l.push(f)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,p=c.length;u<p;u++){let f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let p=0,f=u.length;p<f;p++)h.push(u[p].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},ec=new pt,xi=new ji,Mr=new oi,tc=new I,_r=new I,vr=new I,wr=new I,Da=new I,Tr=new I,nc=new I,Sr=new I,y=class extends Tt{constructor(e=new St,t=new ke){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Tr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Da.fromBufferAttribute(u,e),o?Tr.addScaledVector(Da,h):Tr.addScaledVector(Da.sub(t),h))}t.add(Tr)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Mr.copy(i.boundingSphere),Mr.applyMatrix4(r),xi.copy(e.ray).recast(e.near),!(Mr.containsPoint(xi.origin)===!1&&(xi.intersectSphere(Mr,tc)===null||xi.origin.distanceToSquared(tc)>(e.far-e.near)**2))&&(ec.copy(r).invert(),xi.copy(e.ray).applyMatrix4(ec),!(i.boundingBox!==null&&xi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,xi)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,p=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,m=p.length;g<m;g++){let E=p[g],d=o[E.materialIndex],_=Math.max(E.start,f.start),M=Math.min(a.count,Math.min(E.start+E.count,f.start+f.count));for(let x=_,b=M;x<b;x+=3){let R=a.getX(x),A=a.getX(x+1),C=a.getX(x+2);s=br(this,d,e,i,c,h,u,R,A,C),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=E.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),m=Math.min(a.count,f.start+f.count);for(let E=g,d=m;E<d;E+=3){let _=a.getX(E),M=a.getX(E+1),x=a.getX(E+2);s=br(this,o,e,i,c,h,u,_,M,x),s&&(s.faceIndex=Math.floor(E/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,m=p.length;g<m;g++){let E=p[g],d=o[E.materialIndex],_=Math.max(E.start,f.start),M=Math.min(l.count,Math.min(E.start+E.count,f.start+f.count));for(let x=_,b=M;x<b;x+=3){let R=x,A=x+1,C=x+2;s=br(this,d,e,i,c,h,u,R,A,C),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=E.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),m=Math.min(l.count,f.start+f.count);for(let E=g,d=m;E<d;E+=3){let _=E,M=E+1,x=E+2;s=br(this,o,e,i,c,h,u,_,M,x),s&&(s.faceIndex=Math.floor(E/3),t.push(s))}}}};function hu(n,e,t,i,s,r,o,a){let l;if(e.side===Wt?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===Vn,a),l===null)return null;Sr.copy(a),Sr.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Sr);return c<t.near||c>t.far?null:{distance:c,point:Sr.clone(),object:n}}function br(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,_r),n.getVertexPosition(l,vr),n.getVertexPosition(c,wr);let h=hu(n,e,t,i,_r,vr,wr,nc);if(h){let u=new I;ni.getBarycoord(nc,_r,vr,wr,u),s&&(h.uv=ni.getInterpolatedAttribute(s,a,l,c,u,new ye)),r&&(h.uv1=ni.getInterpolatedAttribute(r,a,l,c,u,new ye)),o&&(h.normal=ni.getInterpolatedAttribute(o,a,l,c,u,new I),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let p={a,b:l,c,normal:new I,materialIndex:0};ni.getNormal(_r,vr,wr,p.normal),h.face=p,h.barycoord=u}return h}var oe=class n extends St{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],p=0,f=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,s,o,2),g("x","z","y",1,-1,e,i,-t,s,o,3),g("x","y","z",1,-1,e,t,i,s,r,4),g("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new it(c,3)),this.setAttribute("normal",new it(h,3)),this.setAttribute("uv",new it(u,2));function g(m,E,d,_,M,x,b,R,A,C,w){let v=x/A,H=b/C,z=x/2,G=b/2,J=R/2,Y=A+1,Z=C+1,se=0,B=0,te=new I;for(let re=0;re<Z;re++){let j=re*H-G;for(let xe=0;xe<Y;xe++){let pe=xe*v-z;te[m]=pe*_,te[E]=j*M,te[d]=J,c.push(te.x,te.y,te.z),te[m]=0,te[E]=0,te[d]=R>0?1:-1,h.push(te.x,te.y,te.z),u.push(xe/A),u.push(1-re/C),se+=1}}for(let re=0;re<C;re++)for(let j=0;j<A;j++){let xe=p+j+Y*re,pe=p+j+Y*(re+1),W=p+(j+1)+Y*(re+1),ue=p+(j+1)+Y*re;l.push(xe,pe,ue),l.push(pe,W,ue),B+=6}a.addGroup(f,B,w),f+=B,p+=se}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Hi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function Zt(n){let e={};for(let t=0;t<n.length;t++){let i=Hi(n[t]);for(let s in i)e[s]=i[s]}return e}function uu(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function xl(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ht.workingColorSpace}var ia={clone:Hi,merge:Zt},du=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,fu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,zt=class extends Rn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=du,this.fragmentShader=fu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Hi(e.uniforms),this.uniformsGroups=uu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},Ls=class extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pt,this.projectionMatrix=new pt,this.projectionMatrixInverse=new pt,this.coordinateSystem=Pn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ti=new I,ic=new ye,sc=new ye,Dt=class extends Ls{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=As*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(fa*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return As*2*Math.atan(Math.tan(fa*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ti.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ti.x,ti.y).multiplyScalar(-e/ti.z),ti.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ti.x,ti.y).multiplyScalar(-e/ti.z)}getViewSize(e,t){return this.getViewBounds(e,ic,sc),t.subVectors(sc,ic)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(fa*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Zi=-90,Ji=1,Vr=class extends Tt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Dt(Zi,Ji,e,t);s.layers=this.layers,this.add(s);let r=new Dt(Zi,Ji,e,t);r.layers=this.layers,this.add(r);let o=new Dt(Zi,Ji,e,t);o.layers=this.layers,this.add(o);let a=new Dt(Zi,Ji,e,t);a.layers=this.layers,this.add(a);let l=new Dt(Zi,Ji,e,t);l.layers=this.layers,this.add(l);let c=new Dt(Zi,Ji,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===Pn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Rs)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=e.getRenderTarget(),p=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let m=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=m,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(u,p,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Us=class extends $t{constructor(e=[],t=Pi,i,s,r,o,a,l,c,h){super(e,t,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Wr=class extends En{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Us(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:bn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new oe(5,5,5),r=new zt({name:"CubemapFromEquirect",uniforms:Hi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Wt,blending:Yn});r.uniforms.tEquirect.value=t;let o=new y(s,r),a=t.minFilter;return t.minFilter===hi&&(t.minFilter=bn),new Vr(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},ge=class extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}},pu={type:"move"},es=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ge,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ge,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ge,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let m of e.hand.values()){let E=t.getJointPose(m,i),d=this._getHandJoint(c,m);E!==null&&(d.matrix.fromArray(E.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=E.radius),d.visible=E!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],p=h.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&p>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&p<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(pu)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ge;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Bs=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new De(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Ti=class extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Qt,this.environmentIntensity=1,this.environmentRotation=new Qt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Fs=class extends $t{constructor(e=null,t=1,i=1,s,r,o,a,l,c=tn,h=tn,u,p){super(null,o,a,l,c,h,s,r,u,p),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var La=new I,mu=new I,gu=new je,gn=class{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=La.subVectors(i,t).cross(mu.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(La),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||gu.getNormalMatrix(e),s=this.coplanarPoint(La).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},yi=new oi,Rr=new I,ts=class{constructor(e=new gn,t=new gn,i=new gn,s=new gn,r=new gn,o=new gn){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Pn){let i=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],p=s[7],f=s[8],g=s[9],m=s[10],E=s[11],d=s[12],_=s[13],M=s[14],x=s[15];if(i[0].setComponents(l-r,p-c,E-f,x-d).normalize(),i[1].setComponents(l+r,p+c,E+f,x+d).normalize(),i[2].setComponents(l+o,p+h,E+g,x+_).normalize(),i[3].setComponents(l-o,p-h,E-g,x-_).normalize(),i[4].setComponents(l-a,p-u,E-m,x-M).normalize(),t===Pn)i[5].setComponents(l+a,p+u,E+m,x+M).normalize();else if(t===Rs)i[5].setComponents(a,u,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),yi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),yi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(yi)}intersectsSprite(e){return yi.center.set(0,0,0),yi.radius=.7071067811865476,yi.applyMatrix4(e.matrixWorld),this.intersectsSphere(yi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Rr.x=s.normal.x>0?e.max.x:e.min.x,Rr.y=s.normal.y>0?e.max.y:e.min.y,Rr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Rr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ns=class extends Rn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new De(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Xr=new I,Yr=new I,rc=new pt,_s=new ji,Ar=new oi,Ua=new I,oc=new I,qr=class extends Tt{constructor(e=new St,t=new Ns){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)Xr.fromBufferAttribute(t,s-1),Yr.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Xr.distanceTo(Yr);e.setAttribute("lineDistance",new it(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ar.copy(i.boundingSphere),Ar.applyMatrix4(s),Ar.radius+=r,e.ray.intersectsSphere(Ar)===!1)return;rc.copy(s).invert(),_s.copy(e.ray).applyMatrix4(rc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,p=i.attributes.position;if(h!==null){let f=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let m=f,E=g-1;m<E;m+=c){let d=h.getX(m),_=h.getX(m+1),M=Cr(this,e,_s,l,d,_,m);M&&t.push(M)}if(this.isLineLoop){let m=h.getX(g-1),E=h.getX(f),d=Cr(this,e,_s,l,m,E,g-1);d&&t.push(d)}}else{let f=Math.max(0,o.start),g=Math.min(p.count,o.start+o.count);for(let m=f,E=g-1;m<E;m+=c){let d=Cr(this,e,_s,l,m,m+1,m);d&&t.push(d)}if(this.isLineLoop){let m=Cr(this,e,_s,l,g-1,f,g-1);m&&t.push(m)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Cr(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(Xr.fromBufferAttribute(a,s),Yr.fromBufferAttribute(a,r),t.distanceSqToSegment(Xr,Yr,Ua,oc)>i)return;Ua.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Ua);if(!(c<e.near||c>e.far))return{distance:c,point:oc.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var ac=new I,lc=new I,Zr=class extends qr{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)ac.fromBufferAttribute(t,s),lc.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+ac.distanceTo(lc);e.setAttribute("lineDistance",new it(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Si=class extends Rn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new De(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},cc=new pt,Ya=new ji,Pr=new oi,Ir=new I,ns=class extends Tt{constructor(e=new St,t=new Si){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Pr.copy(i.boundingSphere),Pr.applyMatrix4(s),Pr.radius+=r,e.ray.intersectsSphere(Pr)===!1)return;cc.copy(s).invert(),Ya.copy(e.ray).applyMatrix4(cc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,u=i.attributes.position;if(c!==null){let p=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=p,m=f;g<m;g++){let E=c.getX(g);Ir.fromBufferAttribute(u,E),hc(Ir,E,l,s,e,t,this)}}else{let p=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let g=p,m=f;g<m;g++)Ir.fromBufferAttribute(u,g),hc(Ir,g,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function hc(n,e,t,i,s,r,o){let a=Ya.distanceSqToPoint(n);if(a<t){let l=new I;Ya.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Xn=class extends $t{constructor(e,t,i,s,r,o,a,l,c){super(e,t,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Os=class extends $t{constructor(e,t,i=ui,s,r,o,a=tn,l=tn,c,h=$i){if(h!==$i&&h!==cs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Qi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},hn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],p=i[s+1]-h,f=(o-h)/p;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new ye:new I);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new I,s=[],r=[],o=[],a=new I,l=new pt;for(let f=0;f<=e;f++){let g=f/e;s[f]=this.getTangentAt(g,new I)}r[0]=new I,o[0]=new I;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),p=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),p<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(nt(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(nt(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(f=-f);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},is=class extends hn{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new ye){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),p=l-this.aX,f=c-this.aY;l=p*h-f*u+this.aX,c=p*u+f*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Jr=class extends is{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function yl(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let p=(o-r)/c-(a-r)/(c+h)+(a-o)/h,f=(a-o)/h-(l-o)/(h+u)+(l-a)/u;p*=h,f*=h,s(o,a,p,f)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Hr=new I,Ba=new yl,Fa=new yl,Na=new yl,ss=class extends hn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new I){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Hr.subVectors(s[0],s[1]).add(s[0]),c=Hr);let u=s[a%r],p=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Hr.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Hr),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(u),f),m=Math.pow(u.distanceToSquared(p),f),E=Math.pow(p.distanceToSquared(h),f);m<1e-4&&(m=1),g<1e-4&&(g=m),E<1e-4&&(E=m),Ba.initNonuniformCatmullRom(c.x,u.x,p.x,h.x,g,m,E),Fa.initNonuniformCatmullRom(c.y,u.y,p.y,h.y,g,m,E),Na.initNonuniformCatmullRom(c.z,u.z,p.z,h.z,g,m,E)}else this.curveType==="catmullrom"&&(Ba.initCatmullRom(c.x,u.x,p.x,h.x,this.tension),Fa.initCatmullRom(c.y,u.y,p.y,h.y,this.tension),Na.initCatmullRom(c.z,u.z,p.z,h.z,this.tension));return i.set(Ba.calc(l),Fa.calc(l),Na.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new I().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function uc(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function Eu(n,e){let t=1-n;return t*t*e}function xu(n,e){return 2*(1-n)*n*e}function yu(n,e){return n*n*e}function ws(n,e,t,i){return Eu(n,e)+xu(n,t)+yu(n,i)}function Mu(n,e){let t=1-n;return t*t*t*e}function _u(n,e){let t=1-n;return 3*t*t*n*e}function vu(n,e){return 3*(1-n)*n*n*e}function wu(n,e){return n*n*n*e}function Ts(n,e,t,i,s){return Mu(n,e)+_u(n,t)+vu(n,i)+wu(n,s)}var Gs=class extends hn{constructor(e=new ye,t=new ye,i=new ye,s=new ye){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new ye){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ts(e,s.x,r.x,o.x,a.x),Ts(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Kr=class extends hn{constructor(e=new I,t=new I,i=new I,s=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new I){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ts(e,s.x,r.x,o.x,a.x),Ts(e,s.y,r.y,o.y,a.y),Ts(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ks=class extends hn{constructor(e=new ye,t=new ye){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ye){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ye){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},$r=class extends hn{constructor(e=new I,t=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new I){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new I){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},zs=class extends hn{constructor(e=new ye,t=new ye,i=new ye){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ye){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(ws(e,s.x,r.x,o.x),ws(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Vs=class extends hn{constructor(e=new I,t=new I,i=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new I){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(ws(e,s.x,r.x,o.x),ws(e,s.y,r.y,o.y),ws(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ws=class extends hn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ye){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return i.set(uc(a,l.x,c.x,h.x,u.x),uc(a,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new ye().fromArray(s))}return this}},qa=Object.freeze({__proto__:null,ArcCurve:Jr,CatmullRomCurve3:ss,CubicBezierCurve:Gs,CubicBezierCurve3:Kr,EllipseCurve:is,LineCurve:ks,LineCurve3:$r,QuadraticBezierCurve:zs,QuadraticBezierCurve3:Vs,SplineCurve:Ws}),Qr=class extends hn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new qa[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new qa[s.type]().fromJSON(s))}return this}},jr=class extends Qr{constructor(e){super(),this.type="Path",this.currentPoint=new ye,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new ks(this.currentPoint.clone(),new ye(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new zs(this.currentPoint.clone(),new ye(e,t),new ye(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new Gs(this.currentPoint.clone(),new ye(e,t),new ye(i,s),new ye(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Ws(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,o,a,l),this}absellipse(e,t,i,s,r,o,a,l){let c=new is(e,t,i,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},ai=class n extends St{constructor(e=[new ye(0,-.5),new ye(.5,0),new ye(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=nt(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,u=new I,p=new ye,f=new I,g=new I,m=new I,E=0,d=0;for(let _=0;_<=e.length-1;_++)switch(_){case 0:E=e[_+1].x-e[_].x,d=e[_+1].y-e[_].y,f.x=d*1,f.y=-E,f.z=d*0,m.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(m.x,m.y,m.z);break;default:E=e[_+1].x-e[_].x,d=e[_+1].y-e[_].y,f.x=d*1,f.y=-E,f.z=d*0,g.copy(f),f.x+=m.x,f.y+=m.y,f.z+=m.z,f.normalize(),l.push(f.x,f.y,f.z),m.copy(g)}for(let _=0;_<=t;_++){let M=i+_*h*s,x=Math.sin(M),b=Math.cos(M);for(let R=0;R<=e.length-1;R++){u.x=e[R].x*x,u.y=e[R].y,u.z=e[R].x*b,o.push(u.x,u.y,u.z),p.x=_/t,p.y=R/(e.length-1),a.push(p.x,p.y);let A=l[3*R+0]*x,C=l[3*R+1],w=l[3*R+0]*b;c.push(A,C,w)}}for(let _=0;_<t;_++)for(let M=0;M<e.length-1;M++){let x=M+_*e.length,b=x,R=x+e.length,A=x+e.length+1,C=x+1;r.push(b,R,C),r.push(A,C,R)}this.setIndex(r),this.setAttribute("position",new it(o,3)),this.setAttribute("uv",new it(a,2)),this.setAttribute("normal",new it(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},bt=class n extends ai{constructor(e=1,t=1,i=4,s=8){let r=new jr;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(i),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:s}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},Lt=class n extends St{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new I,h=new ye;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,p=3;u<=t;u++,p+=3){let f=i+u/t*s;c.x=e*Math.cos(f),c.y=e*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[p]/e+1)/2,h.y=(o[p+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new it(o,3)),this.setAttribute("normal",new it(a,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},be=class n extends St{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],p=[],f=[],g=0,m=[],E=i/2,d=0;_(),o===!1&&(e>0&&M(!0),t>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(p,3)),this.setAttribute("uv",new it(f,2));function _(){let x=new I,b=new I,R=0,A=(t-e)/i;for(let C=0;C<=r;C++){let w=[],v=C/r,H=v*(t-e)+e;for(let z=0;z<=s;z++){let G=z/s,J=G*l+a,Y=Math.sin(J),Z=Math.cos(J);b.x=H*Y,b.y=-v*i+E,b.z=H*Z,u.push(b.x,b.y,b.z),x.set(Y,A,Z).normalize(),p.push(x.x,x.y,x.z),f.push(G,1-v),w.push(g++)}m.push(w)}for(let C=0;C<s;C++)for(let w=0;w<r;w++){let v=m[w][C],H=m[w+1][C],z=m[w+1][C+1],G=m[w][C+1];(e>0||w!==0)&&(h.push(v,H,G),R+=3),(t>0||w!==r-1)&&(h.push(H,z,G),R+=3)}c.addGroup(d,R,0),d+=R}function M(x){let b=g,R=new ye,A=new I,C=0,w=x===!0?e:t,v=x===!0?1:-1;for(let z=1;z<=s;z++)u.push(0,E*v,0),p.push(0,v,0),f.push(.5,.5),g++;let H=g;for(let z=0;z<=s;z++){let J=z/s*l+a,Y=Math.cos(J),Z=Math.sin(J);A.x=w*Z,A.y=E*v,A.z=w*Y,u.push(A.x,A.y,A.z),p.push(0,v,0),R.x=Y*.5+.5,R.y=Z*.5*v+.5,f.push(R.x,R.y),g++}for(let z=0;z<s;z++){let G=b+z,J=H+z;x===!0?h.push(J,J+1,G):h.push(J+1,J,G),C+=3}c.addGroup(d,C,x===!0?1:2),d+=C}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},ot=class n extends be{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Xs=class n extends St{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new it(r,3)),this.setAttribute("normal",new it(r.slice(),3)),this.setAttribute("uv",new it(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(_){let M=new I,x=new I,b=new I;for(let R=0;R<t.length;R+=3)f(t[R+0],M),f(t[R+1],x),f(t[R+2],b),l(M,x,b,_)}function l(_,M,x,b){let R=b+1,A=[];for(let C=0;C<=R;C++){A[C]=[];let w=_.clone().lerp(x,C/R),v=M.clone().lerp(x,C/R),H=R-C;for(let z=0;z<=H;z++)z===0&&C===R?A[C][z]=w:A[C][z]=w.clone().lerp(v,z/H)}for(let C=0;C<R;C++)for(let w=0;w<2*(R-C)-1;w++){let v=Math.floor(w/2);w%2===0?(p(A[C][v+1]),p(A[C+1][v]),p(A[C][v])):(p(A[C][v+1]),p(A[C+1][v+1]),p(A[C+1][v]))}}function c(_){let M=new I;for(let x=0;x<r.length;x+=3)M.x=r[x+0],M.y=r[x+1],M.z=r[x+2],M.normalize().multiplyScalar(_),r[x+0]=M.x,r[x+1]=M.y,r[x+2]=M.z}function h(){let _=new I;for(let M=0;M<r.length;M+=3){_.x=r[M+0],_.y=r[M+1],_.z=r[M+2];let x=E(_)/2/Math.PI+.5,b=d(_)/Math.PI+.5;o.push(x,1-b)}g(),u()}function u(){for(let _=0;_<o.length;_+=6){let M=o[_+0],x=o[_+2],b=o[_+4],R=Math.max(M,x,b),A=Math.min(M,x,b);R>.9&&A<.1&&(M<.2&&(o[_+0]+=1),x<.2&&(o[_+2]+=1),b<.2&&(o[_+4]+=1))}}function p(_){r.push(_.x,_.y,_.z)}function f(_,M){let x=_*3;M.x=e[x+0],M.y=e[x+1],M.z=e[x+2]}function g(){let _=new I,M=new I,x=new I,b=new I,R=new ye,A=new ye,C=new ye;for(let w=0,v=0;w<r.length;w+=9,v+=6){_.set(r[w+0],r[w+1],r[w+2]),M.set(r[w+3],r[w+4],r[w+5]),x.set(r[w+6],r[w+7],r[w+8]),R.set(o[v+0],o[v+1]),A.set(o[v+2],o[v+3]),C.set(o[v+4],o[v+5]),b.copy(_).add(M).add(x).divideScalar(3);let H=E(b);m(R,v+0,_,H),m(A,v+2,M,H),m(C,v+4,x,H)}}function m(_,M,x,b){b<0&&_.x===1&&(o[M]=_.x-1),x.x===0&&x.z===0&&(o[M]=b/2/Math.PI+.5)}function E(_){return Math.atan2(_.z,-_.x)}function d(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}};var Ys=class n extends Xs{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},xn=class n extends Xs{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},rt=class n extends St{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,u=e/a,p=t/l,f=[],g=[],m=[],E=[];for(let d=0;d<h;d++){let _=d*p-o;for(let M=0;M<c;M++){let x=M*u-r;g.push(x,-_,0),m.push(0,0,1),E.push(M/a),E.push(1-d/l)}}for(let d=0;d<l;d++)for(let _=0;_<a;_++){let M=_+c*d,x=_+c*(d+1),b=_+1+c*(d+1),R=_+1+c*d;f.push(M,x,R),f.push(x,b,R)}this.setIndex(f),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(m,3)),this.setAttribute("uv",new it(E,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},In=class n extends St{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=e,p=(t-e)/s,f=new I,g=new ye;for(let m=0;m<=s;m++){for(let E=0;E<=i;E++){let d=r+E/i*o;f.x=u*Math.cos(d),f.y=u*Math.sin(d),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,h.push(g.x,g.y)}u+=p}for(let m=0;m<s;m++){let E=m*(i+1);for(let d=0;d<i;d++){let _=d+E,M=_,x=_+i+1,b=_+i+2,R=_+1;a.push(M,x,R),a.push(x,b,R)}}this.setIndex(a),this.setAttribute("position",new it(l,3)),this.setAttribute("normal",new it(c,3)),this.setAttribute("uv",new it(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Ie=class n extends St{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new I,p=new I,f=[],g=[],m=[],E=[];for(let d=0;d<=i;d++){let _=[],M=d/i,x=0;d===0&&o===0?x=.5/t:d===i&&l===Math.PI&&(x=-.5/t);for(let b=0;b<=t;b++){let R=b/t;u.x=-e*Math.cos(s+R*r)*Math.sin(o+M*a),u.y=e*Math.cos(o+M*a),u.z=e*Math.sin(s+R*r)*Math.sin(o+M*a),g.push(u.x,u.y,u.z),p.copy(u).normalize(),m.push(p.x,p.y,p.z),E.push(R+x,1-M),_.push(c++)}h.push(_)}for(let d=0;d<i;d++)for(let _=0;_<t;_++){let M=h[d][_+1],x=h[d][_],b=h[d+1][_],R=h[d+1][_+1];(d!==0||o>0)&&f.push(M,x,R),(d!==i-1||l<Math.PI)&&f.push(x,b,R)}this.setIndex(f),this.setAttribute("position",new it(g,3)),this.setAttribute("normal",new it(m,3)),this.setAttribute("uv",new it(E,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Qe=class n extends St{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new I,u=new I,p=new I;for(let f=0;f<=i;f++)for(let g=0;g<=s;g++){let m=g/s*r,E=f/i*Math.PI*2;u.x=(e+t*Math.cos(E))*Math.cos(m),u.y=(e+t*Math.cos(E))*Math.sin(m),u.z=t*Math.sin(E),a.push(u.x,u.y,u.z),h.x=e*Math.cos(m),h.y=e*Math.sin(m),p.subVectors(u,h).normalize(),l.push(p.x,p.y,p.z),c.push(g/s),c.push(f/i)}for(let f=1;f<=i;f++)for(let g=1;g<=s;g++){let m=(s+1)*f+g-1,E=(s+1)*(f-1)+g-1,d=(s+1)*(f-1)+g,_=(s+1)*f+g;o.push(m,E,_),o.push(E,d,_)}this.setIndex(o),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(l,3)),this.setAttribute("uv",new it(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var qs=class n extends St{constructor(e=new Vs(new I(-1,-1,0),new I(-1,1,0),new I(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new I,l=new I,c=new ye,h=new I,u=[],p=[],f=[],g=[];m(),this.setIndex(g),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(p,3)),this.setAttribute("uv",new it(f,2));function m(){for(let M=0;M<t;M++)E(M);E(r===!1?t:0),_(),d()}function E(M){h=e.getPointAt(M/t,h);let x=o.normals[M],b=o.binormals[M];for(let R=0;R<=s;R++){let A=R/s*Math.PI*2,C=Math.sin(A),w=-Math.cos(A);l.x=w*x.x+C*b.x,l.y=w*x.y+C*b.y,l.z=w*x.z+C*b.z,l.normalize(),p.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,u.push(a.x,a.y,a.z)}}function d(){for(let M=1;M<=t;M++)for(let x=1;x<=s;x++){let b=(s+1)*(M-1)+(x-1),R=(s+1)*M+(x-1),A=(s+1)*M+x,C=(s+1)*(M-1)+x;g.push(b,R,C),g.push(R,A,C)}}function _(){for(let M=0;M<=t;M++)for(let x=0;x<=s;x++)c.x=M/t,c.y=x/s,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new qa[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Zs=class extends Rn{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new De(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var F=class extends Rn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new De(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new De(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=pl,this.normalScale=new ye(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Qt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var eo=class extends Rn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Wc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},to=class extends Rn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Dr(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Tu(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var bi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},no=class extends bi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ka,endingEnd:ka}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case za:r=e,a=2*t-i;break;case Va:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case za:o=e,l=2*i-t;break;case Va:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,p=this._weightPrev,f=this._weightNext,g=(i-t)/(s-t),m=g*g,E=m*g,d=-p*E+2*p*m-p*g,_=(1+p)*E+(-1.5-2*p)*m+(-.5+p)*g+1,M=(-1-f)*E+(1.5+f)*m+.5*g,x=f*E-f*m;for(let b=0;b!==a;++b)r[b]=d*o[h+b]+_*o[c+b]+M*o[l+b]+x*o[u+b];return r}},io=class extends bi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(s-t),u=1-h;for(let p=0;p!==a;++p)r[p]=o[c+p]*u+o[l+p]*h;return r}},so=class extends bi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},un=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Dr(t,this.TimeBufferType),this.values=Dr(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Dr(e.times,Array),values:Dr(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new so(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new io(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new no(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ss:t=this.InterpolantFactoryMethodDiscrete;break;case Or:t=this.InterpolantFactoryMethodLinear;break;case Lr:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ss;case this.InterpolantFactoryMethodLinear:return Or;case this.InterpolantFactoryMethodSmooth:return Lr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Tu(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Lr,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let u=a*i,p=u-i,f=u+i;for(let g=0;g!==i;++g){let m=t[u+g];if(m!==t[p+g]||m!==t[f+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let u=a*i,p=o*i;for(let f=0;f!==i;++f)t[p+f]=t[u+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};un.prototype.ValueTypeName="";un.prototype.TimeBufferType=Float32Array;un.prototype.ValueBufferType=Float32Array;un.prototype.DefaultInterpolation=Or;var li=class extends un{constructor(e,t,i){super(e,t,i)}};li.prototype.ValueTypeName="bool";li.prototype.ValueBufferType=Array;li.prototype.DefaultInterpolation=Ss;li.prototype.InterpolantFactoryMethodLinear=void 0;li.prototype.InterpolantFactoryMethodSmooth=void 0;var ro=class extends un{constructor(e,t,i,s){super(e,t,i,s)}};ro.prototype.ValueTypeName="color";var oo=class extends un{constructor(e,t,i,s){super(e,t,i,s)}};oo.prototype.ValueTypeName="number";var ao=class extends bi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)At.slerpFlat(r,0,o,c-a,o,c,l);return r}},Js=class extends un{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new ao(this.times,this.values,this.getValueSize(),e)}};Js.prototype.ValueTypeName="quaternion";Js.prototype.InterpolantFactoryMethodSmooth=void 0;var ci=class extends un{constructor(e,t,i){super(e,t,i)}};ci.prototype.ValueTypeName="string";ci.prototype.ValueBufferType=Array;ci.prototype.DefaultInterpolation=Ss;ci.prototype.InterpolantFactoryMethodLinear=void 0;ci.prototype.InterpolantFactoryMethodSmooth=void 0;var lo=class extends un{constructor(e,t,i,s){super(e,t,i,s)}};lo.prototype.ValueTypeName="vector";var co=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,p=c.length;u<p;u+=2){let f=c[u],g=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null}}},rh=new co,ho=class{constructor(e){this.manager=e!==void 0?e:rh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};ho.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ri=class extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new De(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Ks=class extends Ri{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new De(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Oa=new pt,dc=new I,fc=new I,$s=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ye(512,512),this.map=null,this.mapPass=null,this.matrix=new pt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ts,this._frameExtents=new ye(1,1),this._viewportCount=1,this._viewports=[new dt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;dc.setFromMatrixPosition(e.matrixWorld),t.position.copy(dc),fc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(fc),t.updateMatrixWorld(),Oa.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Oa),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Oa)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Za=class extends $s{constructor(){super(new Dt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=As*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(i!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=i,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},Ai=class extends Ri{constructor(e,t,i=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.distance=i,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new Za}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},pc=new pt,vs=new I,Ga=new I,Ja=class extends $s{constructor(){super(new Dt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ye(4,2),this._viewportCount=6,this._viewports=[new dt(2,1,1,1),new dt(0,1,1,1),new dt(3,1,1,1),new dt(1,1,1,1),new dt(3,0,1,1),new dt(1,0,1,1)],this._cubeDirections=[new I(1,0,0),new I(-1,0,0),new I(0,0,1),new I(0,0,-1),new I(0,1,0),new I(0,-1,0)],this._cubeUps=[new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,0,1),new I(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),vs.setFromMatrixPosition(e.matrixWorld),i.position.copy(vs),Ga.copy(i.position),Ga.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(Ga),i.updateMatrixWorld(),s.makeTranslation(-vs.x,-vs.y,-vs.z),pc.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(pc)}},Vt=class extends Ri{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new Ja}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Ci=class extends Ls{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ka=class extends $s{constructor(){super(new Ci(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},rs=class extends Ri{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Tt.DEFAULT_UP),this.updateMatrix(),this.target=new Tt,this.shadow=new Ka}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var uo=class extends Dt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e,this.index=0}};var Ml="\\[\\]\\.:\\/",Su=new RegExp("["+Ml+"]","g"),_l="[^"+Ml+"]",bu="[^"+Ml.replace("\\.","")+"]",Ru=/((?:WC+[\/:])*)/.source.replace("WC",_l),Au=/(WCOD+)?/.source.replace("WCOD",bu),Cu=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",_l),Pu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",_l),Iu=new RegExp("^"+Ru+Au+Cu+Pu+"$"),Hu=["material","materials","bones","map"],$a=class{constructor(e,t,i){let s=i||Mt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},Mt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Su,"")}static parseTrackName(e){let t=Iu.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);Hu.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Mt.Composite=$a;Mt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Mt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Mt.prototype.GetterByBindingType=[Mt.prototype._getValue_direct,Mt.prototype._getValue_array,Mt.prototype._getValue_arrayElement,Mt.prototype._getValue_toArray];Mt.prototype.SetterByBindingTypeAndVersioning=[[Mt.prototype._setValue_direct,Mt.prototype._setValue_direct_setNeedsUpdate,Mt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Mt.prototype._setValue_array,Mt.prototype._setValue_array_setNeedsUpdate,Mt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Mt.prototype._setValue_arrayElement,Mt.prototype._setValue_arrayElement_setNeedsUpdate,Mt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Mt.prototype._setValue_fromArray,Mt.prototype._setValue_fromArray_setNeedsUpdate,Mt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Qm=new Float32Array(1);var os=class extends Zr{constructor(e=10,t=10,i=4473924,s=8947848){i=new De(i),s=new De(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let p=0,f=0,g=-a;p<=t;p++,g+=o){l.push(-a,0,g,a,0,g),l.push(g,0,-a,g,0,a);let m=p===r?i:s;m.toArray(c,f),f+=3,m.toArray(c,f),f+=3,m.toArray(c,f),f+=3,m.toArray(c,f),f+=3}let h=new St;h.setAttribute("position",new it(l,3)),h.setAttribute("color",new it(c,3));let u=new Ns({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};function vl(n,e,t,i){let s=Du(i);switch(t){case al:return n*e;case cl:return n*e;case hl:return n*e*2;case ul:return n*e/s.components*s.byteLength;case Ao:return n*e/s.components*s.byteLength;case dl:return n*e*2/s.components*s.byteLength;case Co:return n*e*2/s.components*s.byteLength;case ll:return n*e*3/s.components*s.byteLength;case nn:return n*e*4/s.components*s.byteLength;case Po:return n*e*4/s.components*s.byteLength;case er:case tr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case nr:case ir:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ho:case Lo:return Math.max(n,16)*Math.max(e,8)/4;case Io:case Do:return Math.max(n,8)*Math.max(e,8)/2;case Uo:case Bo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Fo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case No:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Oo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Go:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case ko:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case zo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Vo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Wo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Xo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Yo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case qo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Zo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Jo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Ko:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case $o:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case sr:case Qo:case jo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case fl:case ea:return Math.ceil(n/4)*Math.ceil(e/4)*8;case ta:case na:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Du(n){switch(n){case Ln:case sl:return{byteLength:1,components:1};case as:case rl:case di:return{byteLength:2,components:1};case bo:case Ro:return{byteLength:2,components:4};case ui:case So:case Un:return{byteLength:4,components:1};case ol:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"175"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="175");function Ch(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Uu(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,u=c.byteLength,p=n.createBuffer();n.bindBuffer(l,p),n.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:p,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function i(a,l,c){let h=l.array,u=l.updateRanges;if(n.bindBuffer(c,a),u.length===0)n.bufferSubData(c,0,h);else{u.sort((f,g)=>f.start-g.start);let p=0;for(let f=1;f<u.length;f++){let g=u[p],m=u[f];m.start<=g.start+g.count+1?g.count=Math.max(g.count,m.start+m.count-g.start):(++p,u[p]=m)}u.length=p+1;for(let f=0,g=u.length;f<g;f++){let m=u[f];n.bufferSubData(c,m.start*h.BYTES_PER_ELEMENT,h,m.start,m.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Bu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Fu=`#ifdef USE_ALPHAHASH
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
#endif`,Nu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ou=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Gu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ku=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,zu=`#ifdef USE_AOMAP
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
#endif`,Vu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Wu=`#ifdef USE_BATCHING
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
#endif`,Xu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Yu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,qu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Zu=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Ju=`#ifdef USE_IRIDESCENCE
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
#endif`,Ku=`#ifdef USE_BUMPMAP
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
#endif`,$u=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Qu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ju=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ed=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,td=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,nd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,id=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,sd=`#if defined( USE_COLOR_ALPHA )
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
#endif`,rd=`#define PI 3.141592653589793
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
} // validated`,od=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,ad=`vec3 transformedNormal = objectNormal;
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
#endif`,ld=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,cd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,hd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ud=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,dd="gl_FragColor = linearToOutputTexel( gl_FragColor );",fd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,pd=`#ifdef USE_ENVMAP
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
#endif`,md=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,gd=`#ifdef USE_ENVMAP
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
#endif`,Ed=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,xd=`#ifdef USE_ENVMAP
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
#endif`,yd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Md=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,_d=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,wd=`#ifdef USE_GRADIENTMAP
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
}`,Td=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Sd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,bd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Rd=`uniform bool receiveShadow;
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
#endif`,Ad=`#ifdef USE_ENVMAP
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
#endif`,Cd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Pd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Id=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Hd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Dd=`PhysicalMaterial material;
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
#endif`,Ld=`struct PhysicalMaterial {
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
}`,Ud=`
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
#endif`,Bd=`#if defined( RE_IndirectDiffuse )
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
#endif`,Fd=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Od=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Gd=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,kd=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,zd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Vd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Wd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Xd=`#if defined( USE_POINTS_UV )
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
#endif`,Yd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,qd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Zd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Jd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Kd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$d=`#ifdef USE_MORPHTARGETS
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
#endif`,Qd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,jd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,ef=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,tf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,nf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,sf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,rf=`#ifdef USE_NORMALMAP
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
#endif`,of=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,af=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,lf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,cf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,hf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,uf=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,df=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ff=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,pf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,mf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,gf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ef=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,xf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,yf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Mf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,_f=`float getShadowMask() {
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
}`,vf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,wf=`#ifdef USE_SKINNING
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
#endif`,Tf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Sf=`#ifdef USE_SKINNING
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
#endif`,bf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Rf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Af=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Cf=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Pf=`#ifdef USE_TRANSMISSION
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
#endif`,If=`#ifdef USE_TRANSMISSION
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
#endif`,Hf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Df=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Lf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Uf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Bf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ff=`uniform sampler2D t2D;
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
}`,Nf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Of=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Gf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zf=`#include <common>
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
}`,Vf=`#if DEPTH_PACKING == 3200
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
}`,Wf=`#define DISTANCE
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
}`,Xf=`#define DISTANCE
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
}`,Yf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,qf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zf=`uniform float scale;
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
}`,Jf=`uniform vec3 diffuse;
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
}`,Kf=`#include <common>
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
}`,$f=`uniform vec3 diffuse;
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
}`,Qf=`#define LAMBERT
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
}`,jf=`#define LAMBERT
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
}`,ep=`#define MATCAP
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
}`,tp=`#define MATCAP
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
}`,np=`#define NORMAL
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
}`,ip=`#define NORMAL
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
}`,sp=`#define PHONG
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
}`,rp=`#define PHONG
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
}`,op=`#define STANDARD
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
}`,ap=`#define STANDARD
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
}`,lp=`#define TOON
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
}`,cp=`#define TOON
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
}`,hp=`uniform float size;
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
}`,up=`uniform vec3 diffuse;
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
}`,dp=`#include <common>
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
}`,fp=`uniform vec3 color;
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
}`,pp=`uniform float rotation;
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
}`,mp=`uniform vec3 diffuse;
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
}`,et={alphahash_fragment:Bu,alphahash_pars_fragment:Fu,alphamap_fragment:Nu,alphamap_pars_fragment:Ou,alphatest_fragment:Gu,alphatest_pars_fragment:ku,aomap_fragment:zu,aomap_pars_fragment:Vu,batching_pars_vertex:Wu,batching_vertex:Xu,begin_vertex:Yu,beginnormal_vertex:qu,bsdfs:Zu,iridescence_fragment:Ju,bumpmap_pars_fragment:Ku,clipping_planes_fragment:$u,clipping_planes_pars_fragment:Qu,clipping_planes_pars_vertex:ju,clipping_planes_vertex:ed,color_fragment:td,color_pars_fragment:nd,color_pars_vertex:id,color_vertex:sd,common:rd,cube_uv_reflection_fragment:od,defaultnormal_vertex:ad,displacementmap_pars_vertex:ld,displacementmap_vertex:cd,emissivemap_fragment:hd,emissivemap_pars_fragment:ud,colorspace_fragment:dd,colorspace_pars_fragment:fd,envmap_fragment:pd,envmap_common_pars_fragment:md,envmap_pars_fragment:gd,envmap_pars_vertex:Ed,envmap_physical_pars_fragment:Ad,envmap_vertex:xd,fog_vertex:yd,fog_pars_vertex:Md,fog_fragment:_d,fog_pars_fragment:vd,gradientmap_pars_fragment:wd,lightmap_pars_fragment:Td,lights_lambert_fragment:Sd,lights_lambert_pars_fragment:bd,lights_pars_begin:Rd,lights_toon_fragment:Cd,lights_toon_pars_fragment:Pd,lights_phong_fragment:Id,lights_phong_pars_fragment:Hd,lights_physical_fragment:Dd,lights_physical_pars_fragment:Ld,lights_fragment_begin:Ud,lights_fragment_maps:Bd,lights_fragment_end:Fd,logdepthbuf_fragment:Nd,logdepthbuf_pars_fragment:Od,logdepthbuf_pars_vertex:Gd,logdepthbuf_vertex:kd,map_fragment:zd,map_pars_fragment:Vd,map_particle_fragment:Wd,map_particle_pars_fragment:Xd,metalnessmap_fragment:Yd,metalnessmap_pars_fragment:qd,morphinstance_vertex:Zd,morphcolor_vertex:Jd,morphnormal_vertex:Kd,morphtarget_pars_vertex:$d,morphtarget_vertex:Qd,normal_fragment_begin:jd,normal_fragment_maps:ef,normal_pars_fragment:tf,normal_pars_vertex:nf,normal_vertex:sf,normalmap_pars_fragment:rf,clearcoat_normal_fragment_begin:of,clearcoat_normal_fragment_maps:af,clearcoat_pars_fragment:lf,iridescence_pars_fragment:cf,opaque_fragment:hf,packing:uf,premultiplied_alpha_fragment:df,project_vertex:ff,dithering_fragment:pf,dithering_pars_fragment:mf,roughnessmap_fragment:gf,roughnessmap_pars_fragment:Ef,shadowmap_pars_fragment:xf,shadowmap_pars_vertex:yf,shadowmap_vertex:Mf,shadowmask_pars_fragment:_f,skinbase_vertex:vf,skinning_pars_vertex:wf,skinning_vertex:Tf,skinnormal_vertex:Sf,specularmap_fragment:bf,specularmap_pars_fragment:Rf,tonemapping_fragment:Af,tonemapping_pars_fragment:Cf,transmission_fragment:Pf,transmission_pars_fragment:If,uv_pars_fragment:Hf,uv_pars_vertex:Df,uv_vertex:Lf,worldpos_vertex:Uf,background_vert:Bf,background_frag:Ff,backgroundCube_vert:Nf,backgroundCube_frag:Of,cube_vert:Gf,cube_frag:kf,depth_vert:zf,depth_frag:Vf,distanceRGBA_vert:Wf,distanceRGBA_frag:Xf,equirect_vert:Yf,equirect_frag:qf,linedashed_vert:Zf,linedashed_frag:Jf,meshbasic_vert:Kf,meshbasic_frag:$f,meshlambert_vert:Qf,meshlambert_frag:jf,meshmatcap_vert:ep,meshmatcap_frag:tp,meshnormal_vert:np,meshnormal_frag:ip,meshphong_vert:sp,meshphong_frag:rp,meshphysical_vert:op,meshphysical_frag:ap,meshtoon_vert:lp,meshtoon_frag:cp,points_vert:hp,points_frag:up,shadow_vert:dp,shadow_frag:fp,sprite_vert:pp,sprite_frag:mp},He={common:{diffuse:{value:new De(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new je}},envmap:{envMap:{value:null},envMapRotation:{value:new je},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new je},normalScale:{value:new ye(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new De(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new De(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0},uvTransform:{value:new je}},sprite:{diffuse:{value:new De(16777215)},opacity:{value:1},center:{value:new ye(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}}},Bn={basic:{uniforms:Zt([He.common,He.specularmap,He.envmap,He.aomap,He.lightmap,He.fog]),vertexShader:et.meshbasic_vert,fragmentShader:et.meshbasic_frag},lambert:{uniforms:Zt([He.common,He.specularmap,He.envmap,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.fog,He.lights,{emissive:{value:new De(0)}}]),vertexShader:et.meshlambert_vert,fragmentShader:et.meshlambert_frag},phong:{uniforms:Zt([He.common,He.specularmap,He.envmap,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.fog,He.lights,{emissive:{value:new De(0)},specular:{value:new De(1118481)},shininess:{value:30}}]),vertexShader:et.meshphong_vert,fragmentShader:et.meshphong_frag},standard:{uniforms:Zt([He.common,He.envmap,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.roughnessmap,He.metalnessmap,He.fog,He.lights,{emissive:{value:new De(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:et.meshphysical_vert,fragmentShader:et.meshphysical_frag},toon:{uniforms:Zt([He.common,He.aomap,He.lightmap,He.emissivemap,He.bumpmap,He.normalmap,He.displacementmap,He.gradientmap,He.fog,He.lights,{emissive:{value:new De(0)}}]),vertexShader:et.meshtoon_vert,fragmentShader:et.meshtoon_frag},matcap:{uniforms:Zt([He.common,He.bumpmap,He.normalmap,He.displacementmap,He.fog,{matcap:{value:null}}]),vertexShader:et.meshmatcap_vert,fragmentShader:et.meshmatcap_frag},points:{uniforms:Zt([He.points,He.fog]),vertexShader:et.points_vert,fragmentShader:et.points_frag},dashed:{uniforms:Zt([He.common,He.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:et.linedashed_vert,fragmentShader:et.linedashed_frag},depth:{uniforms:Zt([He.common,He.displacementmap]),vertexShader:et.depth_vert,fragmentShader:et.depth_frag},normal:{uniforms:Zt([He.common,He.bumpmap,He.normalmap,He.displacementmap,{opacity:{value:1}}]),vertexShader:et.meshnormal_vert,fragmentShader:et.meshnormal_frag},sprite:{uniforms:Zt([He.sprite,He.fog]),vertexShader:et.sprite_vert,fragmentShader:et.sprite_frag},background:{uniforms:{uvTransform:{value:new je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:et.background_vert,fragmentShader:et.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new je}},vertexShader:et.backgroundCube_vert,fragmentShader:et.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:et.cube_vert,fragmentShader:et.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:et.equirect_vert,fragmentShader:et.equirect_frag},distanceRGBA:{uniforms:Zt([He.common,He.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:et.distanceRGBA_vert,fragmentShader:et.distanceRGBA_frag},shadow:{uniforms:Zt([He.lights,He.fog,{color:{value:new De(0)},opacity:{value:1}}]),vertexShader:et.shadow_vert,fragmentShader:et.shadow_frag}};Bn.physical={uniforms:Zt([Bn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new je},clearcoatNormalScale:{value:new ye(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new je},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new je},sheen:{value:0},sheenColor:{value:new De(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new je},transmissionSamplerSize:{value:new ye},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new je},attenuationDistance:{value:0},attenuationColor:{value:new De(0)},specularColor:{value:new De(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new je},anisotropyVector:{value:new ye},anisotropyMap:{value:null},anisotropyMapTransform:{value:new je}}]),vertexShader:et.meshphysical_vert,fragmentShader:et.meshphysical_frag};var sa={r:0,b:0,g:0},Di=new Qt,gp=new pt;function Ep(n,e,t,i,s,r,o){let a=new De(0),l=r===!0?0:1,c,h,u=null,p=0,f=null;function g(M){let x=M.isScene===!0?M.background:null;return x&&x.isTexture&&(x=(M.backgroundBlurriness>0?t:e).get(x)),x}function m(M){let x=!1,b=g(M);b===null?d(a,l):b&&b.isColor&&(d(b,1),x=!0);let R=n.xr.getEnvironmentBlendMode();R==="additive"?i.buffers.color.setClear(0,0,0,1,o):R==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||x)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function E(M,x){let b=g(x);b&&(b.isCubeTexture||b.mapping===Qs)?(h===void 0&&(h=new y(new oe(1,1,1),new zt({name:"BackgroundCubeMaterial",uniforms:Hi(Bn.backgroundCube.uniforms),vertexShader:Bn.backgroundCube.vertexShader,fragmentShader:Bn.backgroundCube.fragmentShader,side:Wt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,A,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Di.copy(x.backgroundRotation),Di.x*=-1,Di.y*=-1,Di.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(Di.y*=-1,Di.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(gp.makeRotationFromEuler(Di)),h.material.toneMapped=ht.getTransfer(b.colorSpace)!==Et,(u!==b||p!==b.version||f!==n.toneMapping)&&(h.material.needsUpdate=!0,u=b,p=b.version,f=n.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new y(new rt(2,2),new zt({name:"BackgroundMaterial",uniforms:Hi(Bn.background.uniforms),vertexShader:Bn.background.vertexShader,fragmentShader:Bn.background.fragmentShader,side:Vn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=ht.getTransfer(b.colorSpace)!==Et,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||p!==b.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,u=b,p=b.version,f=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function d(M,x){M.getRGB(sa,xl(n)),i.buffers.color.setClear(sa.r,sa.g,sa.b,x,o)}function _(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,x=1){a.set(M),l=x,d(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,d(a,l)},render:m,addToRenderList:E,dispose:_}}function xp(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=p(null),r=s,o=!1;function a(v,H,z,G,J){let Y=!1,Z=u(G,z,H);r!==Z&&(r=Z,c(r.object)),Y=f(v,G,z,J),Y&&g(v,G,z,J),J!==null&&e.update(J,n.ELEMENT_ARRAY_BUFFER),(Y||o)&&(o=!1,x(v,H,z,G),J!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(J).buffer))}function l(){return n.createVertexArray()}function c(v){return n.bindVertexArray(v)}function h(v){return n.deleteVertexArray(v)}function u(v,H,z){let G=z.wireframe===!0,J=i[v.id];J===void 0&&(J={},i[v.id]=J);let Y=J[H.id];Y===void 0&&(Y={},J[H.id]=Y);let Z=Y[G];return Z===void 0&&(Z=p(l()),Y[G]=Z),Z}function p(v){let H=[],z=[],G=[];for(let J=0;J<t;J++)H[J]=0,z[J]=0,G[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:H,enabledAttributes:z,attributeDivisors:G,object:v,attributes:{},index:null}}function f(v,H,z,G){let J=r.attributes,Y=H.attributes,Z=0,se=z.getAttributes();for(let B in se)if(se[B].location>=0){let re=J[B],j=Y[B];if(j===void 0&&(B==="instanceMatrix"&&v.instanceMatrix&&(j=v.instanceMatrix),B==="instanceColor"&&v.instanceColor&&(j=v.instanceColor)),re===void 0||re.attribute!==j||j&&re.data!==j.data)return!0;Z++}return r.attributesNum!==Z||r.index!==G}function g(v,H,z,G){let J={},Y=H.attributes,Z=0,se=z.getAttributes();for(let B in se)if(se[B].location>=0){let re=Y[B];re===void 0&&(B==="instanceMatrix"&&v.instanceMatrix&&(re=v.instanceMatrix),B==="instanceColor"&&v.instanceColor&&(re=v.instanceColor));let j={};j.attribute=re,re&&re.data&&(j.data=re.data),J[B]=j,Z++}r.attributes=J,r.attributesNum=Z,r.index=G}function m(){let v=r.newAttributes;for(let H=0,z=v.length;H<z;H++)v[H]=0}function E(v){d(v,0)}function d(v,H){let z=r.newAttributes,G=r.enabledAttributes,J=r.attributeDivisors;z[v]=1,G[v]===0&&(n.enableVertexAttribArray(v),G[v]=1),J[v]!==H&&(n.vertexAttribDivisor(v,H),J[v]=H)}function _(){let v=r.newAttributes,H=r.enabledAttributes;for(let z=0,G=H.length;z<G;z++)H[z]!==v[z]&&(n.disableVertexAttribArray(z),H[z]=0)}function M(v,H,z,G,J,Y,Z){Z===!0?n.vertexAttribIPointer(v,H,z,J,Y):n.vertexAttribPointer(v,H,z,G,J,Y)}function x(v,H,z,G){m();let J=G.attributes,Y=z.getAttributes(),Z=H.defaultAttributeValues;for(let se in Y){let B=Y[se];if(B.location>=0){let te=J[se];if(te===void 0&&(se==="instanceMatrix"&&v.instanceMatrix&&(te=v.instanceMatrix),se==="instanceColor"&&v.instanceColor&&(te=v.instanceColor)),te!==void 0){let re=te.normalized,j=te.itemSize,xe=e.get(te);if(xe===void 0)continue;let pe=xe.buffer,W=xe.type,ue=xe.bytesPerElement,ee=W===n.INT||W===n.UNSIGNED_INT||te.gpuType===So;if(te.isInterleavedBufferAttribute){let le=te.data,X=le.stride,U=te.offset;if(le.isInstancedInterleavedBuffer){for(let D=0;D<B.locationSize;D++)d(B.location+D,le.meshPerAttribute);v.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let D=0;D<B.locationSize;D++)E(B.location+D);n.bindBuffer(n.ARRAY_BUFFER,pe);for(let D=0;D<B.locationSize;D++)M(B.location+D,j/B.locationSize,W,re,X*ue,(U+j/B.locationSize*D)*ue,ee)}else{if(te.isInstancedBufferAttribute){for(let le=0;le<B.locationSize;le++)d(B.location+le,te.meshPerAttribute);v.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let le=0;le<B.locationSize;le++)E(B.location+le);n.bindBuffer(n.ARRAY_BUFFER,pe);for(let le=0;le<B.locationSize;le++)M(B.location+le,j/B.locationSize,W,re,j*ue,j/B.locationSize*le*ue,ee)}}else if(Z!==void 0){let re=Z[se];if(re!==void 0)switch(re.length){case 2:n.vertexAttrib2fv(B.location,re);break;case 3:n.vertexAttrib3fv(B.location,re);break;case 4:n.vertexAttrib4fv(B.location,re);break;default:n.vertexAttrib1fv(B.location,re)}}}}_()}function b(){C();for(let v in i){let H=i[v];for(let z in H){let G=H[z];for(let J in G)h(G[J].object),delete G[J];delete H[z]}delete i[v]}}function R(v){if(i[v.id]===void 0)return;let H=i[v.id];for(let z in H){let G=H[z];for(let J in G)h(G[J].object),delete G[J];delete H[z]}delete i[v.id]}function A(v){for(let H in i){let z=i[H];if(z[v.id]===void 0)continue;let G=z[v.id];for(let J in G)h(G[J].object),delete G[J];delete z[v.id]}}function C(){w(),o=!0,r!==s&&(r=s,c(r.object))}function w(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:C,resetDefaultState:w,dispose:b,releaseStatesOfGeometry:R,releaseStatesOfProgram:A,initAttributes:m,enableAttribute:E,disableUnusedAttributes:_}}function yp(n,e,t){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function o(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),t.update(h,i,u))}function a(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];t.update(f,i,1)}function l(c,h,u,p){if(u===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],h[g],p[g]);else{f.multiDrawArraysInstancedWEBGL(i,c,0,h,0,p,0,u);let g=0;for(let m=0;m<u;m++)g+=h[m]*p[m];t.update(g,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Mp(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let A=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==nn&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){let C=A===di&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==Ln&&i.convert(A)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==Un&&!C)}function l(A){if(A==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,p=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_TEXTURE_SIZE),E=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),d=n.getParameter(n.MAX_VERTEX_ATTRIBS),_=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),M=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),b=g>0,R=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:p,maxTextures:f,maxVertexTextures:g,maxTextureSize:m,maxCubemapSize:E,maxAttributes:d,maxVertexUniforms:_,maxVaryings:M,maxFragmentUniforms:x,vertexTextures:b,maxSamples:R}}function _p(n){let e=this,t=null,i=0,s=!1,r=!1,o=new gn,a=new je,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,p){let f=u.length!==0||p||i!==0||s;return s=p,i=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,p){t=h(u,p,0)},this.setState=function(u,p,f){let g=u.clippingPlanes,m=u.clipIntersection,E=u.clipShadows,d=n.get(u);if(!s||g===null||g.length===0||r&&!E)r?h(null):c();else{let _=r?0:i,M=_*4,x=d.clippingState||null;l.value=x,x=h(g,p,M,f);for(let b=0;b!==M;++b)x[b]=t[b];d.clippingState=x,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(u,p,f,g){let m=u!==null?u.length:0,E=null;if(m!==0){if(E=l.value,g!==!0||E===null){let d=f+m*4,_=p.matrixWorldInverse;a.getNormalMatrix(_),(E===null||E.length<d)&&(E=new Float32Array(d));for(let M=0,x=f;M!==m;++M,x+=4)o.copy(u[M]).applyMatrix4(_,a),o.normal.toArray(E,x),E[x+3]=o.constant}l.value=E,l.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,E}}function vp(n){let e=new WeakMap;function t(o,a){return a===vo?o.mapping=Pi:a===wo&&(o.mapping=Ii),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===vo||a===wo)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Wr(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var us=4,oh=[.125,.215,.35,.446,.526,.582],Bi=20,wl=new Ci,ah=new De,Tl=null,Sl=0,bl=0,Rl=!1,Ui=(1+Math.sqrt(5))/2,hs=1/Ui,lh=[new I(-Ui,hs,0),new I(Ui,hs,0),new I(-hs,0,Ui),new I(hs,0,Ui),new I(0,Ui,-hs),new I(0,Ui,hs),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)],wp=new I,aa=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=wp}=r;Tl=this._renderer.getRenderTarget(),Sl=this._renderer.getActiveCubeFace(),bl=this._renderer.getActiveMipmapLevel(),Rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=uh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=hh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Tl,Sl,bl),this._renderer.xr.enabled=Rl,e.scissorTest=!1,ra(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Pi||e.mapping===Ii?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Tl=this._renderer.getRenderTarget(),Sl=this._renderer.getActiveCubeFace(),bl=this._renderer.getActiveMipmapLevel(),Rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:bn,minFilter:bn,generateMipmaps:!1,type:di,format:nn,colorSpace:wi,depthBuffer:!1},s=ch(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ch(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Tp(r)),this._blurMaterial=Sp(r,e,t)}return s}_compileMaterial(e){let t=new y(this._lodPlanes[0],e);this._renderer.compile(t,wl)}_sceneToCubeUV(e,t,i,s,r){let l=new Dt(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,p=u.autoClear,f=u.toneMapping;u.getClearColor(ah),u.toneMapping=qn,u.autoClear=!1;let g=new ke({name:"PMREM.Background",side:Wt,depthWrite:!1,depthTest:!1}),m=new y(new oe,g),E=!1,d=e.background;d?d.isColor&&(g.color.copy(d),e.background=null,E=!0):(g.color.copy(ah),E=!0);for(let _=0;_<6;_++){let M=_%3;M===0?(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[_],r.y,r.z)):M===1?(l.up.set(0,0,c[_]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[_],r.z)):(l.up.set(0,c[_],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[_]));let x=this._cubeSize;ra(s,M*x,_>2?x:0,x,x),u.setRenderTarget(s),E&&u.render(m,l),u.render(e,l)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=f,u.autoClear=p,e.background=d}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===Pi||e.mapping===Ii;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=uh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=hh());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new y(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;ra(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,wl)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=lh[(s-r-1)%lh.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new y(this._lodPlanes[s],c),p=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Bi-1),m=r/g,E=isFinite(r)?1+Math.floor(h*m):Bi;E>Bi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${E} samples when the maximum is set to ${Bi}`);let d=[],_=0;for(let A=0;A<Bi;++A){let C=A/m,w=Math.exp(-C*C/2);d.push(w),A===0?_+=w:A<E&&(_+=2*w)}for(let A=0;A<d.length;A++)d[A]=d[A]/_;p.envMap.value=e.texture,p.samples.value=E,p.weights.value=d,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);let{_lodMax:M}=this;p.dTheta.value=g,p.mipInt.value=M-i;let x=this._sizeLods[s],b=3*x*(s>M-us?s-M+us:0),R=4*(this._cubeSize-x);ra(t,b,R,3*x,2*x),l.setRenderTarget(t),l.render(u,wl)}};function Tp(n){let e=[],t=[],i=[],s=n,r=n-us+1+oh.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>n-us?l=oh[o-n+us-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,u=1+c,p=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,m=3,E=2,d=1,_=new Float32Array(m*g*f),M=new Float32Array(E*g*f),x=new Float32Array(d*g*f);for(let R=0;R<f;R++){let A=R%3*2/3-1,C=R>2?0:-1,w=[A,C,0,A+2/3,C,0,A+2/3,C+1,0,A,C,0,A+2/3,C+1,0,A,C+1,0];_.set(w,m*g*R),M.set(p,E*g*R);let v=[R,R,R,R,R,R];x.set(v,d*g*R)}let b=new St;b.setAttribute("position",new kt(_,m)),b.setAttribute("uv",new kt(M,E)),b.setAttribute("faceIndex",new kt(x,d)),e.push(b),s>us&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function ch(n,e,t){let i=new En(n,e,t);return i.texture.mapping=Qs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ra(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function Sp(n,e,t){let i=new Float32Array(Bi),s=new I(0,1,0);return new zt({name:"SphericalGaussianBlur",defines:{n:Bi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Fl(),fragmentShader:`

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
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function hh(){return new zt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Fl(),fragmentShader:`

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
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function uh(){return new zt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Fl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Fl(){return`

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
	`}function bp(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===vo||l===wo,h=l===Pi||l===Ii;if(c||h){let u=e.get(a),p=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==p)return t===null&&(t=new aa(n)),u=c?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return c&&f&&f.height>0||h&&f&&s(f)?(t===null&&(t=new aa(n)),u=c?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function Rp(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&or("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function Ap(n,e,t,i){let s={},r=new WeakMap;function o(u){let p=u.target;p.index!==null&&e.remove(p.index);for(let g in p.attributes)e.remove(p.attributes[g]);p.removeEventListener("dispose",o),delete s[p.id];let f=r.get(p);f&&(e.remove(f),r.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function a(u,p){return s[p.id]===!0||(p.addEventListener("dispose",o),s[p.id]=!0,t.memory.geometries++),p}function l(u){let p=u.attributes;for(let f in p)e.update(p[f],n.ARRAY_BUFFER)}function c(u){let p=[],f=u.index,g=u.attributes.position,m=0;if(f!==null){let _=f.array;m=f.version;for(let M=0,x=_.length;M<x;M+=3){let b=_[M+0],R=_[M+1],A=_[M+2];p.push(b,R,R,A,A,b)}}else if(g!==void 0){let _=g.array;m=g.version;for(let M=0,x=_.length/3-1;M<x;M+=3){let b=M+0,R=M+1,A=M+2;p.push(b,R,R,A,A,b)}}else return;let E=new(El(p)?Ds:Hs)(p,1);E.version=m;let d=r.get(u);d&&e.remove(d),r.set(u,E)}function h(u){let p=r.get(u);if(p){let f=u.index;f!==null&&p.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function Cp(n,e,t){let i;function s(p){i=p}let r,o;function a(p){r=p.type,o=p.bytesPerElement}function l(p,f){n.drawElements(i,f,r,p*o),t.update(f,i,1)}function c(p,f,g){g!==0&&(n.drawElementsInstanced(i,f,r,p*o,g),t.update(f,i,g))}function h(p,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,r,p,0,g);let E=0;for(let d=0;d<g;d++)E+=f[d];t.update(E,i,1)}function u(p,f,g,m){if(g===0)return;let E=e.get("WEBGL_multi_draw");if(E===null)for(let d=0;d<p.length;d++)c(p[d]/o,f[d],m[d]);else{E.multiDrawElementsInstancedWEBGL(i,f,0,r,p,0,m,0,g);let d=0;for(let _=0;_<g;_++)d+=f[_]*m[_];t.update(d,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Pp(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Ip(n,e,t){let i=new WeakMap,s=new dt;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,p=i.get(a);if(p===void 0||p.count!==u){let w=function(){A.dispose(),i.delete(a),a.removeEventListener("dispose",w)};p!==void 0&&p.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,E=a.morphAttributes.position||[],d=a.morphAttributes.normal||[],_=a.morphAttributes.color||[],M=0;f===!0&&(M=1),g===!0&&(M=2),m===!0&&(M=3);let x=a.attributes.position.count*M,b=1;x>e.maxTextureSize&&(b=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let R=new Float32Array(x*b*4*u),A=new Ps(R,x,b,u);A.type=Un,A.needsUpdate=!0;let C=M*4;for(let v=0;v<u;v++){let H=E[v],z=d[v],G=_[v],J=x*b*4*v;for(let Y=0;Y<H.count;Y++){let Z=Y*C;f===!0&&(s.fromBufferAttribute(H,Y),R[J+Z+0]=s.x,R[J+Z+1]=s.y,R[J+Z+2]=s.z,R[J+Z+3]=0),g===!0&&(s.fromBufferAttribute(z,Y),R[J+Z+4]=s.x,R[J+Z+5]=s.y,R[J+Z+6]=s.z,R[J+Z+7]=0),m===!0&&(s.fromBufferAttribute(G,Y),R[J+Z+8]=s.x,R[J+Z+9]=s.y,R[J+Z+10]=s.z,R[J+Z+11]=G.itemSize===4?s.w:1)}}p={count:u,texture:A,size:new ye(x,b)},i.set(a,p),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let m=0;m<c.length;m++)f+=c[m];let g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",p.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",p.size)}return{update:r}}function Hp(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let p=l.skeleton;s.get(p)!==c&&(p.update(),s.set(p,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var Ph=new $t,dh=new Os(1,1),Ih=new Ps,Hh=new zr,Dh=new Us,fh=[],ph=[],mh=new Float32Array(16),gh=new Float32Array(9),Eh=new Float32Array(4);function fs(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=fh[s];if(r===void 0&&(r=new Float32Array(s),fh[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Bt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Ft(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function ca(n,e){let t=ph[e];t===void 0&&(t=new Int32Array(e),ph[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Dp(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Lp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Bt(t,e))return;n.uniform2fv(this.addr,e),Ft(t,e)}}function Up(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Bt(t,e))return;n.uniform3fv(this.addr,e),Ft(t,e)}}function Bp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Bt(t,e))return;n.uniform4fv(this.addr,e),Ft(t,e)}}function Fp(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Bt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Ft(t,e)}else{if(Bt(t,i))return;Eh.set(i),n.uniformMatrix2fv(this.addr,!1,Eh),Ft(t,i)}}function Np(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Bt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Ft(t,e)}else{if(Bt(t,i))return;gh.set(i),n.uniformMatrix3fv(this.addr,!1,gh),Ft(t,i)}}function Op(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Bt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Ft(t,e)}else{if(Bt(t,i))return;mh.set(i),n.uniformMatrix4fv(this.addr,!1,mh),Ft(t,i)}}function Gp(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function kp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Bt(t,e))return;n.uniform2iv(this.addr,e),Ft(t,e)}}function zp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Bt(t,e))return;n.uniform3iv(this.addr,e),Ft(t,e)}}function Vp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Bt(t,e))return;n.uniform4iv(this.addr,e),Ft(t,e)}}function Wp(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Xp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Bt(t,e))return;n.uniform2uiv(this.addr,e),Ft(t,e)}}function Yp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Bt(t,e))return;n.uniform3uiv(this.addr,e),Ft(t,e)}}function qp(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Bt(t,e))return;n.uniform4uiv(this.addr,e),Ft(t,e)}}function Zp(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(dh.compareFunction=ml,r=dh):r=Ph,t.setTexture2D(e||r,s)}function Jp(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||Hh,s)}function Kp(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Dh,s)}function $p(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Ih,s)}function Qp(n){switch(n){case 5126:return Dp;case 35664:return Lp;case 35665:return Up;case 35666:return Bp;case 35674:return Fp;case 35675:return Np;case 35676:return Op;case 5124:case 35670:return Gp;case 35667:case 35671:return kp;case 35668:case 35672:return zp;case 35669:case 35673:return Vp;case 5125:return Wp;case 36294:return Xp;case 36295:return Yp;case 36296:return qp;case 35678:case 36198:case 36298:case 36306:case 35682:return Zp;case 35679:case 36299:case 36307:return Jp;case 35680:case 36300:case 36308:case 36293:return Kp;case 36289:case 36303:case 36311:case 36292:return $p}}function jp(n,e){n.uniform1fv(this.addr,e)}function e0(n,e){let t=fs(e,this.size,2);n.uniform2fv(this.addr,t)}function t0(n,e){let t=fs(e,this.size,3);n.uniform3fv(this.addr,t)}function n0(n,e){let t=fs(e,this.size,4);n.uniform4fv(this.addr,t)}function i0(n,e){let t=fs(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function s0(n,e){let t=fs(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function r0(n,e){let t=fs(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function o0(n,e){n.uniform1iv(this.addr,e)}function a0(n,e){n.uniform2iv(this.addr,e)}function l0(n,e){n.uniform3iv(this.addr,e)}function c0(n,e){n.uniform4iv(this.addr,e)}function h0(n,e){n.uniform1uiv(this.addr,e)}function u0(n,e){n.uniform2uiv(this.addr,e)}function d0(n,e){n.uniform3uiv(this.addr,e)}function f0(n,e){n.uniform4uiv(this.addr,e)}function p0(n,e,t){let i=this.cache,s=e.length,r=ca(t,s);Bt(i,r)||(n.uniform1iv(this.addr,r),Ft(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||Ph,r[o])}function m0(n,e,t){let i=this.cache,s=e.length,r=ca(t,s);Bt(i,r)||(n.uniform1iv(this.addr,r),Ft(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Hh,r[o])}function g0(n,e,t){let i=this.cache,s=e.length,r=ca(t,s);Bt(i,r)||(n.uniform1iv(this.addr,r),Ft(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Dh,r[o])}function E0(n,e,t){let i=this.cache,s=e.length,r=ca(t,s);Bt(i,r)||(n.uniform1iv(this.addr,r),Ft(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Ih,r[o])}function x0(n){switch(n){case 5126:return jp;case 35664:return e0;case 35665:return t0;case 35666:return n0;case 35674:return i0;case 35675:return s0;case 35676:return r0;case 5124:case 35670:return o0;case 35667:case 35671:return a0;case 35668:case 35672:return l0;case 35669:case 35673:return c0;case 5125:return h0;case 36294:return u0;case 36295:return d0;case 36296:return f0;case 35678:case 36198:case 36298:case 36306:case 35682:return p0;case 35679:case 36299:case 36307:return m0;case 35680:case 36300:case 36308:case 36293:return g0;case 36289:case 36303:case 36311:case 36292:return E0}}var Cl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Qp(t.type)}},Pl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=x0(t.type)}},Il=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Al=/(\w+)(\])?(\[|\.)?/g;function xh(n,e){n.seq.push(e),n.map[e.id]=e}function y0(n,e,t){let i=n.name,s=i.length;for(Al.lastIndex=0;;){let r=Al.exec(i),o=Al.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){xh(t,c===void 0?new Cl(a,n,e):new Pl(a,n,e));break}else{let u=t.map[a];u===void 0&&(u=new Il(a),xh(t,u)),t=u}}}var ds=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);y0(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function yh(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var M0=37297,_0=0;function v0(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var Mh=new je;function w0(n){ht._getMatrix(Mh,ht.workingColorSpace,n);let e=`mat3( ${Mh.elements.map(t=>t.toFixed(4))} )`;switch(ht.getTransfer(n)){case bs:return[e,"LinearTransferOETF"];case Et:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function _h(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+v0(n.getShaderSource(e),o)}else return s}function T0(n,e){let t=w0(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function S0(n,e){let t;switch(e){case Fc:t="Linear";break;case Nc:t="Reinhard";break;case Oc:t="Cineon";break;case _o:t="ACESFilmic";break;case kc:t="AgX";break;case zc:t="Neutral";break;case Gc:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var oa=new I;function b0(){ht.getLuminanceCoefficients(oa);let n=oa.x.toFixed(4),e=oa.y.toFixed(4),t=oa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function R0(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ar).join(`
`)}function A0(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function C0(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function ar(n){return n!==""}function vh(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function wh(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var P0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hl(n){return n.replace(P0,H0)}var I0=new Map;function H0(n,e){let t=et[e];if(t===void 0){let i=I0.get(e);if(i!==void 0)t=et[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Hl(t)}var D0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Th(n){return n.replace(D0,L0)}function L0(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Sh(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}function U0(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===ja?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===fo?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Hn&&(e="SHADOWMAP_TYPE_VSM"),e}function B0(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Pi:case Ii:e="ENVMAP_TYPE_CUBE";break;case Qs:e="ENVMAP_TYPE_CUBE_UV";break}return e}function F0(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Ii:e="ENVMAP_MODE_REFRACTION";break}return e}function N0(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case nl:e="ENVMAP_BLENDING_MULTIPLY";break;case Uc:e="ENVMAP_BLENDING_MIX";break;case Bc:e="ENVMAP_BLENDING_ADD";break}return e}function O0(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function G0(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=U0(t),c=B0(t),h=F0(t),u=N0(t),p=O0(t),f=R0(t),g=A0(r),m=s.createProgram(),E,d,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(E=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ar).join(`
`),E.length>0&&(E+=`
`),d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ar).join(`
`),d.length>0&&(d+=`
`)):(E=[Sh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ar).join(`
`),d=[Sh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==qn?"#define TONE_MAPPING":"",t.toneMapping!==qn?et.tonemapping_pars_fragment:"",t.toneMapping!==qn?S0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",et.colorspace_pars_fragment,T0("linearToOutputTexel",t.outputColorSpace),b0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ar).join(`
`)),o=Hl(o),o=vh(o,t),o=wh(o,t),a=Hl(a),a=vh(a,t),a=wh(a,t),o=Th(o),a=Th(a),t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,E=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+E,d=["#define varying in",t.glslVersion===gl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===gl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let M=_+E+o,x=_+d+a,b=yh(s,s.VERTEX_SHADER,M),R=yh(s,s.FRAGMENT_SHADER,x);s.attachShader(m,b),s.attachShader(m,R),t.index0AttributeName!==void 0?s.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(m,0,"position"),s.linkProgram(m);function A(H){if(n.debug.checkShaderErrors){let z=s.getProgramInfoLog(m).trim(),G=s.getShaderInfoLog(b).trim(),J=s.getShaderInfoLog(R).trim(),Y=!0,Z=!0;if(s.getProgramParameter(m,s.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,m,b,R);else{let se=_h(s,b,"vertex"),B=_h(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(m,s.VALIDATE_STATUS)+`

Material Name: `+H.name+`
Material Type: `+H.type+`

Program Info Log: `+z+`
`+se+`
`+B)}else z!==""?console.warn("THREE.WebGLProgram: Program Info Log:",z):(G===""||J==="")&&(Z=!1);Z&&(H.diagnostics={runnable:Y,programLog:z,vertexShader:{log:G,prefix:E},fragmentShader:{log:J,prefix:d}})}s.deleteShader(b),s.deleteShader(R),C=new ds(s,m),w=C0(s,m)}let C;this.getUniforms=function(){return C===void 0&&A(this),C};let w;this.getAttributes=function(){return w===void 0&&A(this),w};let v=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=s.getProgramParameter(m,M0)),v},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=_0++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=R,this}var k0=0,Dl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ll(e),t.set(e,i)),i}},Ll=class{constructor(e){this.id=k0++,this.code=e,this.usedTimes=0}};function z0(n,e,t,i,s,r,o){let a=new Is,l=new Dl,c=new Set,h=[],u=s.logarithmicDepthBuffer,p=s.vertexTextures,f=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(w){return c.add(w),w===0?"uv":`uv${w}`}function E(w,v,H,z,G){let J=z.fog,Y=G.geometry,Z=w.isMeshStandardMaterial?z.environment:null,se=(w.isMeshStandardMaterial?t:e).get(w.envMap||Z),B=se&&se.mapping===Qs?se.image.height:null,te=g[w.type];w.precision!==null&&(f=s.getMaxPrecision(w.precision),f!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",f,"instead."));let re=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,j=re!==void 0?re.length:0,xe=0;Y.morphAttributes.position!==void 0&&(xe=1),Y.morphAttributes.normal!==void 0&&(xe=2),Y.morphAttributes.color!==void 0&&(xe=3);let pe,W,ue,ee;if(te){let at=Bn[te];pe=at.vertexShader,W=at.fragmentShader}else pe=w.vertexShader,W=w.fragmentShader,l.update(w),ue=l.getVertexShaderID(w),ee=l.getFragmentShaderID(w);let le=n.getRenderTarget(),X=n.state.buffers.depth.getReversed(),U=G.isInstancedMesh===!0,D=G.isBatchedMesh===!0,fe=!!w.map,we=!!w.matcap,Oe=!!se,L=!!w.aoMap,ct=!!w.lightMap,Ce=!!w.bumpMap,Je=!!w.normalMap,Re=!!w.displacementMap,ze=!!w.emissiveMap,Ae=!!w.metalnessMap,P=!!w.roughnessMap,T=w.anisotropy>0,V=w.clearcoat>0,Q=w.dispersion>0,ae=w.iridescence>0,$=w.sheen>0,Me=w.transmission>0,ne=T&&!!w.anisotropyMap,ce=V&&!!w.clearcoatMap,Ue=V&&!!w.clearcoatNormalMap,he=V&&!!w.clearcoatRoughnessMap,Ee=ae&&!!w.iridescenceMap,Le=ae&&!!w.iridescenceThicknessMap,Ne=$&&!!w.sheenColorMap,ve=$&&!!w.sheenRoughnessMap,Ke=!!w.specularMap,We=!!w.specularColorMap,tt=!!w.specularIntensityMap,O=Me&&!!w.transmissionMap,_e=Me&&!!w.thicknessMap,ie=!!w.gradientMap,de=!!w.alphaMap,Pe=w.alphaTest>0,Te=!!w.alphaHash,$e=!!w.extensions,ft=qn;w.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(ft=n.toneMapping);let yt={shaderID:te,shaderType:w.type,shaderName:w.name,vertexShader:pe,fragmentShader:W,defines:w.defines,customVertexShaderID:ue,customFragmentShaderID:ee,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:f,batching:D,batchingColor:D&&G._colorsTexture!==null,instancing:U,instancingColor:U&&G.instanceColor!==null,instancingMorph:U&&G.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:le===null?n.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:wi,alphaToCoverage:!!w.alphaToCoverage,map:fe,matcap:we,envMap:Oe,envMapMode:Oe&&se.mapping,envMapCubeUVHeight:B,aoMap:L,lightMap:ct,bumpMap:Ce,normalMap:Je,displacementMap:p&&Re,emissiveMap:ze,normalMapObjectSpace:Je&&w.normalMapType===Yc,normalMapTangentSpace:Je&&w.normalMapType===pl,metalnessMap:Ae,roughnessMap:P,anisotropy:T,anisotropyMap:ne,clearcoat:V,clearcoatMap:ce,clearcoatNormalMap:Ue,clearcoatRoughnessMap:he,dispersion:Q,iridescence:ae,iridescenceMap:Ee,iridescenceThicknessMap:Le,sheen:$,sheenColorMap:Ne,sheenRoughnessMap:ve,specularMap:Ke,specularColorMap:We,specularIntensityMap:tt,transmission:Me,transmissionMap:O,thicknessMap:_e,gradientMap:ie,opaque:w.transparent===!1&&w.blending===_i&&w.alphaToCoverage===!1,alphaMap:de,alphaTest:Pe,alphaHash:Te,combine:w.combine,mapUv:fe&&m(w.map.channel),aoMapUv:L&&m(w.aoMap.channel),lightMapUv:ct&&m(w.lightMap.channel),bumpMapUv:Ce&&m(w.bumpMap.channel),normalMapUv:Je&&m(w.normalMap.channel),displacementMapUv:Re&&m(w.displacementMap.channel),emissiveMapUv:ze&&m(w.emissiveMap.channel),metalnessMapUv:Ae&&m(w.metalnessMap.channel),roughnessMapUv:P&&m(w.roughnessMap.channel),anisotropyMapUv:ne&&m(w.anisotropyMap.channel),clearcoatMapUv:ce&&m(w.clearcoatMap.channel),clearcoatNormalMapUv:Ue&&m(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:he&&m(w.clearcoatRoughnessMap.channel),iridescenceMapUv:Ee&&m(w.iridescenceMap.channel),iridescenceThicknessMapUv:Le&&m(w.iridescenceThicknessMap.channel),sheenColorMapUv:Ne&&m(w.sheenColorMap.channel),sheenRoughnessMapUv:ve&&m(w.sheenRoughnessMap.channel),specularMapUv:Ke&&m(w.specularMap.channel),specularColorMapUv:We&&m(w.specularColorMap.channel),specularIntensityMapUv:tt&&m(w.specularIntensityMap.channel),transmissionMapUv:O&&m(w.transmissionMap.channel),thicknessMapUv:_e&&m(w.thicknessMap.channel),alphaMapUv:de&&m(w.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(Je||T),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!Y.attributes.uv&&(fe||de),fog:!!J,useFog:w.fog===!0,fogExp2:!!J&&J.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:X,skinning:G.isSkinnedMesh===!0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:j,morphTextureStride:xe,numDirLights:v.directional.length,numPointLights:v.point.length,numSpotLights:v.spot.length,numSpotLightMaps:v.spotLightMap.length,numRectAreaLights:v.rectArea.length,numHemiLights:v.hemi.length,numDirLightShadows:v.directionalShadowMap.length,numPointLightShadows:v.pointShadowMap.length,numSpotLightShadows:v.spotShadowMap.length,numSpotLightShadowsWithMaps:v.numSpotLightShadowsWithMaps,numLightProbes:v.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:w.dithering,shadowMapEnabled:n.shadowMap.enabled&&H.length>0,shadowMapType:n.shadowMap.type,toneMapping:ft,decodeVideoTexture:fe&&w.map.isVideoTexture===!0&&ht.getTransfer(w.map.colorSpace)===Et,decodeVideoTextureEmissive:ze&&w.emissiveMap.isVideoTexture===!0&&ht.getTransfer(w.emissiveMap.colorSpace)===Et,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===xt,flipSided:w.side===Wt,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:$e&&w.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:($e&&w.extensions.multiDraw===!0||D)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return yt.vertexUv1s=c.has(1),yt.vertexUv2s=c.has(2),yt.vertexUv3s=c.has(3),c.clear(),yt}function d(w){let v=[];if(w.shaderID?v.push(w.shaderID):(v.push(w.customVertexShaderID),v.push(w.customFragmentShaderID)),w.defines!==void 0)for(let H in w.defines)v.push(H),v.push(w.defines[H]);return w.isRawShaderMaterial===!1&&(_(v,w),M(v,w),v.push(n.outputColorSpace)),v.push(w.customProgramCacheKey),v.join()}function _(w,v){w.push(v.precision),w.push(v.outputColorSpace),w.push(v.envMapMode),w.push(v.envMapCubeUVHeight),w.push(v.mapUv),w.push(v.alphaMapUv),w.push(v.lightMapUv),w.push(v.aoMapUv),w.push(v.bumpMapUv),w.push(v.normalMapUv),w.push(v.displacementMapUv),w.push(v.emissiveMapUv),w.push(v.metalnessMapUv),w.push(v.roughnessMapUv),w.push(v.anisotropyMapUv),w.push(v.clearcoatMapUv),w.push(v.clearcoatNormalMapUv),w.push(v.clearcoatRoughnessMapUv),w.push(v.iridescenceMapUv),w.push(v.iridescenceThicknessMapUv),w.push(v.sheenColorMapUv),w.push(v.sheenRoughnessMapUv),w.push(v.specularMapUv),w.push(v.specularColorMapUv),w.push(v.specularIntensityMapUv),w.push(v.transmissionMapUv),w.push(v.thicknessMapUv),w.push(v.combine),w.push(v.fogExp2),w.push(v.sizeAttenuation),w.push(v.morphTargetsCount),w.push(v.morphAttributeCount),w.push(v.numDirLights),w.push(v.numPointLights),w.push(v.numSpotLights),w.push(v.numSpotLightMaps),w.push(v.numHemiLights),w.push(v.numRectAreaLights),w.push(v.numDirLightShadows),w.push(v.numPointLightShadows),w.push(v.numSpotLightShadows),w.push(v.numSpotLightShadowsWithMaps),w.push(v.numLightProbes),w.push(v.shadowMapType),w.push(v.toneMapping),w.push(v.numClippingPlanes),w.push(v.numClipIntersection),w.push(v.depthPacking)}function M(w,v){a.disableAll(),v.supportsVertexTextures&&a.enable(0),v.instancing&&a.enable(1),v.instancingColor&&a.enable(2),v.instancingMorph&&a.enable(3),v.matcap&&a.enable(4),v.envMap&&a.enable(5),v.normalMapObjectSpace&&a.enable(6),v.normalMapTangentSpace&&a.enable(7),v.clearcoat&&a.enable(8),v.iridescence&&a.enable(9),v.alphaTest&&a.enable(10),v.vertexColors&&a.enable(11),v.vertexAlphas&&a.enable(12),v.vertexUv1s&&a.enable(13),v.vertexUv2s&&a.enable(14),v.vertexUv3s&&a.enable(15),v.vertexTangents&&a.enable(16),v.anisotropy&&a.enable(17),v.alphaHash&&a.enable(18),v.batching&&a.enable(19),v.dispersion&&a.enable(20),v.batchingColor&&a.enable(21),w.push(a.mask),a.disableAll(),v.fog&&a.enable(0),v.useFog&&a.enable(1),v.flatShading&&a.enable(2),v.logarithmicDepthBuffer&&a.enable(3),v.reverseDepthBuffer&&a.enable(4),v.skinning&&a.enable(5),v.morphTargets&&a.enable(6),v.morphNormals&&a.enable(7),v.morphColors&&a.enable(8),v.premultipliedAlpha&&a.enable(9),v.shadowMapEnabled&&a.enable(10),v.doubleSided&&a.enable(11),v.flipSided&&a.enable(12),v.useDepthPacking&&a.enable(13),v.dithering&&a.enable(14),v.transmission&&a.enable(15),v.sheen&&a.enable(16),v.opaque&&a.enable(17),v.pointsUvs&&a.enable(18),v.decodeVideoTexture&&a.enable(19),v.decodeVideoTextureEmissive&&a.enable(20),v.alphaToCoverage&&a.enable(21),w.push(a.mask)}function x(w){let v=g[w.type],H;if(v){let z=Bn[v];H=ia.clone(z.uniforms)}else H=w.uniforms;return H}function b(w,v){let H;for(let z=0,G=h.length;z<G;z++){let J=h[z];if(J.cacheKey===v){H=J,++H.usedTimes;break}}return H===void 0&&(H=new G0(n,v,w,r),h.push(H)),H}function R(w){if(--w.usedTimes===0){let v=h.indexOf(w);h[v]=h[h.length-1],h.pop(),w.destroy()}}function A(w){l.remove(w)}function C(){l.dispose()}return{getParameters:E,getProgramCacheKey:d,getUniforms:x,acquireProgram:b,releaseProgram:R,releaseShaderCache:A,programs:h,dispose:C}}function V0(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function W0(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function bh(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Rh(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(u,p,f,g,m,E){let d=n[e];return d===void 0?(d={id:u.id,object:u,geometry:p,material:f,groupOrder:g,renderOrder:u.renderOrder,z:m,group:E},n[e]=d):(d.id=u.id,d.object=u,d.geometry=p,d.material=f,d.groupOrder=g,d.renderOrder=u.renderOrder,d.z=m,d.group=E),e++,d}function a(u,p,f,g,m,E){let d=o(u,p,f,g,m,E);f.transmission>0?i.push(d):f.transparent===!0?s.push(d):t.push(d)}function l(u,p,f,g,m,E){let d=o(u,p,f,g,m,E);f.transmission>0?i.unshift(d):f.transparent===!0?s.unshift(d):t.unshift(d)}function c(u,p){t.length>1&&t.sort(u||W0),i.length>1&&i.sort(p||bh),s.length>1&&s.sort(p||bh)}function h(){for(let u=e,p=n.length;u<p;u++){let f=n[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function X0(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new Rh,n.set(i,[o])):s>=r.length?(o=new Rh,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Y0(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new De};break;case"SpotLight":t={position:new I,direction:new I,color:new De,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new De,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new De,groundColor:new De};break;case"RectAreaLight":t={color:new De,position:new I,halfWidth:new I,halfHeight:new I};break}return n[e.id]=t,t}}}function q0(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Z0=0;function J0(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function K0(n){let e=new Y0,t=q0(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new I);let s=new I,r=new pt,o=new pt;function a(c){let h=0,u=0,p=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let f=0,g=0,m=0,E=0,d=0,_=0,M=0,x=0,b=0,R=0,A=0;c.sort(J0);for(let w=0,v=c.length;w<v;w++){let H=c[w],z=H.color,G=H.intensity,J=H.distance,Y=H.shadow&&H.shadow.map?H.shadow.map.texture:null;if(H.isAmbientLight)h+=z.r*G,u+=z.g*G,p+=z.b*G;else if(H.isLightProbe){for(let Z=0;Z<9;Z++)i.probe[Z].addScaledVector(H.sh.coefficients[Z],G);A++}else if(H.isDirectionalLight){let Z=e.get(H);if(Z.color.copy(H.color).multiplyScalar(H.intensity),H.castShadow){let se=H.shadow,B=t.get(H);B.shadowIntensity=se.intensity,B.shadowBias=se.bias,B.shadowNormalBias=se.normalBias,B.shadowRadius=se.radius,B.shadowMapSize=se.mapSize,i.directionalShadow[f]=B,i.directionalShadowMap[f]=Y,i.directionalShadowMatrix[f]=H.shadow.matrix,_++}i.directional[f]=Z,f++}else if(H.isSpotLight){let Z=e.get(H);Z.position.setFromMatrixPosition(H.matrixWorld),Z.color.copy(z).multiplyScalar(G),Z.distance=J,Z.coneCos=Math.cos(H.angle),Z.penumbraCos=Math.cos(H.angle*(1-H.penumbra)),Z.decay=H.decay,i.spot[m]=Z;let se=H.shadow;if(H.map&&(i.spotLightMap[b]=H.map,b++,se.updateMatrices(H),H.castShadow&&R++),i.spotLightMatrix[m]=se.matrix,H.castShadow){let B=t.get(H);B.shadowIntensity=se.intensity,B.shadowBias=se.bias,B.shadowNormalBias=se.normalBias,B.shadowRadius=se.radius,B.shadowMapSize=se.mapSize,i.spotShadow[m]=B,i.spotShadowMap[m]=Y,x++}m++}else if(H.isRectAreaLight){let Z=e.get(H);Z.color.copy(z).multiplyScalar(G),Z.halfWidth.set(H.width*.5,0,0),Z.halfHeight.set(0,H.height*.5,0),i.rectArea[E]=Z,E++}else if(H.isPointLight){let Z=e.get(H);if(Z.color.copy(H.color).multiplyScalar(H.intensity),Z.distance=H.distance,Z.decay=H.decay,H.castShadow){let se=H.shadow,B=t.get(H);B.shadowIntensity=se.intensity,B.shadowBias=se.bias,B.shadowNormalBias=se.normalBias,B.shadowRadius=se.radius,B.shadowMapSize=se.mapSize,B.shadowCameraNear=se.camera.near,B.shadowCameraFar=se.camera.far,i.pointShadow[g]=B,i.pointShadowMap[g]=Y,i.pointShadowMatrix[g]=H.shadow.matrix,M++}i.point[g]=Z,g++}else if(H.isHemisphereLight){let Z=e.get(H);Z.skyColor.copy(H.color).multiplyScalar(G),Z.groundColor.copy(H.groundColor).multiplyScalar(G),i.hemi[d]=Z,d++}}E>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=He.LTC_FLOAT_1,i.rectAreaLTC2=He.LTC_FLOAT_2):(i.rectAreaLTC1=He.LTC_HALF_1,i.rectAreaLTC2=He.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=p;let C=i.hash;(C.directionalLength!==f||C.pointLength!==g||C.spotLength!==m||C.rectAreaLength!==E||C.hemiLength!==d||C.numDirectionalShadows!==_||C.numPointShadows!==M||C.numSpotShadows!==x||C.numSpotMaps!==b||C.numLightProbes!==A)&&(i.directional.length=f,i.spot.length=m,i.rectArea.length=E,i.point.length=g,i.hemi.length=d,i.directionalShadow.length=_,i.directionalShadowMap.length=_,i.pointShadow.length=M,i.pointShadowMap.length=M,i.spotShadow.length=x,i.spotShadowMap.length=x,i.directionalShadowMatrix.length=_,i.pointShadowMatrix.length=M,i.spotLightMatrix.length=x+b-R,i.spotLightMap.length=b,i.numSpotLightShadowsWithMaps=R,i.numLightProbes=A,C.directionalLength=f,C.pointLength=g,C.spotLength=m,C.rectAreaLength=E,C.hemiLength=d,C.numDirectionalShadows=_,C.numPointShadows=M,C.numSpotShadows=x,C.numSpotMaps=b,C.numLightProbes=A,i.version=Z0++)}function l(c,h){let u=0,p=0,f=0,g=0,m=0,E=h.matrixWorldInverse;for(let d=0,_=c.length;d<_;d++){let M=c[d];if(M.isDirectionalLight){let x=i.directional[u];x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(E),u++}else if(M.isSpotLight){let x=i.spot[f];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(E),x.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(E),f++}else if(M.isRectAreaLight){let x=i.rectArea[g];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(E),o.identity(),r.copy(M.matrixWorld),r.premultiply(E),o.extractRotation(r),x.halfWidth.set(M.width*.5,0,0),x.halfHeight.set(0,M.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),g++}else if(M.isPointLight){let x=i.point[p];x.position.setFromMatrixPosition(M.matrixWorld),x.position.applyMatrix4(E),p++}else if(M.isHemisphereLight){let x=i.hemi[m];x.direction.setFromMatrixPosition(M.matrixWorld),x.direction.transformDirection(E),m++}}}return{setup:a,setupView:l,state:i}}function Ah(n){let e=new K0(n),t=[],i=[];function s(h){c.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function o(h){i.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function $0(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Ah(n),e.set(s,[a])):r>=o.length?(a=new Ah(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var Q0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,j0=`uniform sampler2D shadow_pass;
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
}`;function em(n,e,t){let i=new ts,s=new ye,r=new ye,o=new dt,a=new eo({depthPacking:Xc}),l=new to,c={},h=t.maxTextureSize,u={[Vn]:Wt,[Wt]:Vn,[xt]:xt},p=new zt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ye},radius:{value:4}},vertexShader:Q0,fragmentShader:j0}),f=p.clone();f.defines.HORIZONTAL_PASS=1;let g=new St;g.setAttribute("position",new kt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let m=new y(g,p),E=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ja;let d=this.type;this.render=function(R,A,C){if(E.enabled===!1||E.autoUpdate===!1&&E.needsUpdate===!1||R.length===0)return;let w=n.getRenderTarget(),v=n.getActiveCubeFace(),H=n.getActiveMipmapLevel(),z=n.state;z.setBlending(Yn),z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);let G=d!==Hn&&this.type===Hn,J=d===Hn&&this.type!==Hn;for(let Y=0,Z=R.length;Y<Z;Y++){let se=R[Y],B=se.shadow;if(B===void 0){console.warn("THREE.WebGLShadowMap:",se,"has no shadow.");continue}if(B.autoUpdate===!1&&B.needsUpdate===!1)continue;s.copy(B.mapSize);let te=B.getFrameExtents();if(s.multiply(te),r.copy(B.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/te.x),s.x=r.x*te.x,B.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/te.y),s.y=r.y*te.y,B.mapSize.y=r.y)),B.map===null||G===!0||J===!0){let j=this.type!==Hn?{minFilter:tn,magFilter:tn}:{};B.map!==null&&B.map.dispose(),B.map=new En(s.x,s.y,j),B.map.texture.name=se.name+".shadowMap",B.camera.updateProjectionMatrix()}n.setRenderTarget(B.map),n.clear();let re=B.getViewportCount();for(let j=0;j<re;j++){let xe=B.getViewport(j);o.set(r.x*xe.x,r.y*xe.y,r.x*xe.z,r.y*xe.w),z.viewport(o),B.updateMatrices(se,j),i=B.getFrustum(),x(A,C,B.camera,se,this.type)}B.isPointLightShadow!==!0&&this.type===Hn&&_(B,C),B.needsUpdate=!1}d=this.type,E.needsUpdate=!1,n.setRenderTarget(w,v,H)};function _(R,A){let C=e.update(m);p.defines.VSM_SAMPLES!==R.blurSamples&&(p.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,p.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new En(s.x,s.y)),p.uniforms.shadow_pass.value=R.map.texture,p.uniforms.resolution.value=R.mapSize,p.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(A,null,C,p,m,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(A,null,C,f,m,null)}function M(R,A,C,w){let v=null,H=C.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(H!==void 0)v=H;else if(v=C.isPointLight===!0?l:a,n.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let z=v.uuid,G=A.uuid,J=c[z];J===void 0&&(J={},c[z]=J);let Y=J[G];Y===void 0&&(Y=v.clone(),J[G]=Y,A.addEventListener("dispose",b)),v=Y}if(v.visible=A.visible,v.wireframe=A.wireframe,w===Hn?v.side=A.shadowSide!==null?A.shadowSide:A.side:v.side=A.shadowSide!==null?A.shadowSide:u[A.side],v.alphaMap=A.alphaMap,v.alphaTest=A.alphaTest,v.map=A.map,v.clipShadows=A.clipShadows,v.clippingPlanes=A.clippingPlanes,v.clipIntersection=A.clipIntersection,v.displacementMap=A.displacementMap,v.displacementScale=A.displacementScale,v.displacementBias=A.displacementBias,v.wireframeLinewidth=A.wireframeLinewidth,v.linewidth=A.linewidth,C.isPointLight===!0&&v.isMeshDistanceMaterial===!0){let z=n.properties.get(v);z.light=C}return v}function x(R,A,C,w,v){if(R.visible===!1)return;if(R.layers.test(A.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&v===Hn)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,R.matrixWorld);let G=e.update(R),J=R.material;if(Array.isArray(J)){let Y=G.groups;for(let Z=0,se=Y.length;Z<se;Z++){let B=Y[Z],te=J[B.materialIndex];if(te&&te.visible){let re=M(R,te,w,v);R.onBeforeShadow(n,R,A,C,G,re,B),n.renderBufferDirect(C,null,G,re,R,B),R.onAfterShadow(n,R,A,C,G,re,B)}}}else if(J.visible){let Y=M(R,J,w,v);R.onBeforeShadow(n,R,A,C,G,Y,null),n.renderBufferDirect(C,null,G,Y,R,null),R.onAfterShadow(n,R,A,C,G,Y,null)}}let z=R.children;for(let G=0,J=z.length;G<J;G++)x(z[G],A,C,w,v)}function b(R){R.target.removeEventListener("dispose",b);for(let C in c){let w=c[C],v=R.target.uuid;v in w&&(w[v].dispose(),delete w[v])}}}var tm={[po]:mo,[go]:yo,[Eo]:Mo,[vi]:xo,[mo]:po,[yo]:go,[Mo]:Eo,[xo]:vi};function nm(n,e){function t(){let O=!1,_e=new dt,ie=null,de=new dt(0,0,0,0);return{setMask:function(Pe){ie!==Pe&&!O&&(n.colorMask(Pe,Pe,Pe,Pe),ie=Pe)},setLocked:function(Pe){O=Pe},setClear:function(Pe,Te,$e,ft,yt){yt===!0&&(Pe*=ft,Te*=ft,$e*=ft),_e.set(Pe,Te,$e,ft),de.equals(_e)===!1&&(n.clearColor(Pe,Te,$e,ft),de.copy(_e))},reset:function(){O=!1,ie=null,de.set(-1,0,0,0)}}}function i(){let O=!1,_e=!1,ie=null,de=null,Pe=null;return{setReversed:function(Te){if(_e!==Te){let $e=e.get("EXT_clip_control");Te?$e.clipControlEXT($e.LOWER_LEFT_EXT,$e.ZERO_TO_ONE_EXT):$e.clipControlEXT($e.LOWER_LEFT_EXT,$e.NEGATIVE_ONE_TO_ONE_EXT),_e=Te;let ft=Pe;Pe=null,this.setClear(ft)}},getReversed:function(){return _e},setTest:function(Te){Te?le(n.DEPTH_TEST):X(n.DEPTH_TEST)},setMask:function(Te){ie!==Te&&!O&&(n.depthMask(Te),ie=Te)},setFunc:function(Te){if(_e&&(Te=tm[Te]),de!==Te){switch(Te){case po:n.depthFunc(n.NEVER);break;case mo:n.depthFunc(n.ALWAYS);break;case go:n.depthFunc(n.LESS);break;case vi:n.depthFunc(n.LEQUAL);break;case Eo:n.depthFunc(n.EQUAL);break;case xo:n.depthFunc(n.GEQUAL);break;case yo:n.depthFunc(n.GREATER);break;case Mo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}de=Te}},setLocked:function(Te){O=Te},setClear:function(Te){Pe!==Te&&(_e&&(Te=1-Te),n.clearDepth(Te),Pe=Te)},reset:function(){O=!1,ie=null,de=null,Pe=null,_e=!1}}}function s(){let O=!1,_e=null,ie=null,de=null,Pe=null,Te=null,$e=null,ft=null,yt=null;return{setTest:function(at){O||(at?le(n.STENCIL_TEST):X(n.STENCIL_TEST))},setMask:function(at){_e!==at&&!O&&(n.stencilMask(at),_e=at)},setFunc:function(at,Xt,Nt){(ie!==at||de!==Xt||Pe!==Nt)&&(n.stencilFunc(at,Xt,Nt),ie=at,de=Xt,Pe=Nt)},setOp:function(at,Xt,Nt){(Te!==at||$e!==Xt||ft!==Nt)&&(n.stencilOp(at,Xt,Nt),Te=at,$e=Xt,ft=Nt)},setLocked:function(at){O=at},setClear:function(at){yt!==at&&(n.clearStencil(at),yt=at)},reset:function(){O=!1,_e=null,ie=null,de=null,Pe=null,Te=null,$e=null,ft=null,yt=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},p=new WeakMap,f=[],g=null,m=!1,E=null,d=null,_=null,M=null,x=null,b=null,R=null,A=new De(0,0,0),C=0,w=!1,v=null,H=null,z=null,G=null,J=null,Y=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Z=!1,se=0,B=n.getParameter(n.VERSION);B.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\d)/.exec(B)[1]),Z=se>=1):B.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\d)/.exec(B)[1]),Z=se>=2);let te=null,re={},j=n.getParameter(n.SCISSOR_BOX),xe=n.getParameter(n.VIEWPORT),pe=new dt().fromArray(j),W=new dt().fromArray(xe);function ue(O,_e,ie,de){let Pe=new Uint8Array(4),Te=n.createTexture();n.bindTexture(O,Te),n.texParameteri(O,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(O,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let $e=0;$e<ie;$e++)O===n.TEXTURE_3D||O===n.TEXTURE_2D_ARRAY?n.texImage3D(_e,0,n.RGBA,1,1,de,0,n.RGBA,n.UNSIGNED_BYTE,Pe):n.texImage2D(_e+$e,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Pe);return Te}let ee={};ee[n.TEXTURE_2D]=ue(n.TEXTURE_2D,n.TEXTURE_2D,1),ee[n.TEXTURE_CUBE_MAP]=ue(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),ee[n.TEXTURE_2D_ARRAY]=ue(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),ee[n.TEXTURE_3D]=ue(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),le(n.DEPTH_TEST),o.setFunc(vi),Ce(!1),Je(Qa),le(n.CULL_FACE),L(Yn);function le(O){h[O]!==!0&&(n.enable(O),h[O]=!0)}function X(O){h[O]!==!1&&(n.disable(O),h[O]=!1)}function U(O,_e){return u[O]!==_e?(n.bindFramebuffer(O,_e),u[O]=_e,O===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=_e),O===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=_e),!0):!1}function D(O,_e){let ie=f,de=!1;if(O){ie=p.get(_e),ie===void 0&&(ie=[],p.set(_e,ie));let Pe=O.textures;if(ie.length!==Pe.length||ie[0]!==n.COLOR_ATTACHMENT0){for(let Te=0,$e=Pe.length;Te<$e;Te++)ie[Te]=n.COLOR_ATTACHMENT0+Te;ie.length=Pe.length,de=!0}}else ie[0]!==n.BACK&&(ie[0]=n.BACK,de=!0);de&&n.drawBuffers(ie)}function fe(O){return g!==O?(n.useProgram(O),g=O,!0):!1}let we={[si]:n.FUNC_ADD,[xc]:n.FUNC_SUBTRACT,[yc]:n.FUNC_REVERSE_SUBTRACT};we[Mc]=n.MIN,we[_c]=n.MAX;let Oe={[vc]:n.ZERO,[wc]:n.ONE,[Tc]:n.SRC_COLOR,[Ur]:n.SRC_ALPHA,[Pc]:n.SRC_ALPHA_SATURATE,[Ac]:n.DST_COLOR,[bc]:n.DST_ALPHA,[Sc]:n.ONE_MINUS_SRC_COLOR,[Br]:n.ONE_MINUS_SRC_ALPHA,[Cc]:n.ONE_MINUS_DST_COLOR,[Rc]:n.ONE_MINUS_DST_ALPHA,[Ic]:n.CONSTANT_COLOR,[Hc]:n.ONE_MINUS_CONSTANT_COLOR,[Dc]:n.CONSTANT_ALPHA,[Lc]:n.ONE_MINUS_CONSTANT_ALPHA};function L(O,_e,ie,de,Pe,Te,$e,ft,yt,at){if(O===Yn){m===!0&&(X(n.BLEND),m=!1);return}if(m===!1&&(le(n.BLEND),m=!0),O!==Ec){if(O!==E||at!==w){if((d!==si||x!==si)&&(n.blendEquation(n.FUNC_ADD),d=si,x=si),at)switch(O){case _i:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Dn:n.blendFunc(n.ONE,n.ONE);break;case el:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case tl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case _i:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Dn:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case el:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case tl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}_=null,M=null,b=null,R=null,A.set(0,0,0),C=0,E=O,w=at}return}Pe=Pe||_e,Te=Te||ie,$e=$e||de,(_e!==d||Pe!==x)&&(n.blendEquationSeparate(we[_e],we[Pe]),d=_e,x=Pe),(ie!==_||de!==M||Te!==b||$e!==R)&&(n.blendFuncSeparate(Oe[ie],Oe[de],Oe[Te],Oe[$e]),_=ie,M=de,b=Te,R=$e),(ft.equals(A)===!1||yt!==C)&&(n.blendColor(ft.r,ft.g,ft.b,yt),A.copy(ft),C=yt),E=O,w=!1}function ct(O,_e){O.side===xt?X(n.CULL_FACE):le(n.CULL_FACE);let ie=O.side===Wt;_e&&(ie=!ie),Ce(ie),O.blending===_i&&O.transparent===!1?L(Yn):L(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),o.setFunc(O.depthFunc),o.setTest(O.depthTest),o.setMask(O.depthWrite),r.setMask(O.colorWrite);let de=O.stencilWrite;a.setTest(de),de&&(a.setMask(O.stencilWriteMask),a.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),a.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),ze(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?le(n.SAMPLE_ALPHA_TO_COVERAGE):X(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ce(O){v!==O&&(O?n.frontFace(n.CW):n.frontFace(n.CCW),v=O)}function Je(O){O!==mc?(le(n.CULL_FACE),O!==H&&(O===Qa?n.cullFace(n.BACK):O===gc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):X(n.CULL_FACE),H=O}function Re(O){O!==z&&(Z&&n.lineWidth(O),z=O)}function ze(O,_e,ie){O?(le(n.POLYGON_OFFSET_FILL),(G!==_e||J!==ie)&&(n.polygonOffset(_e,ie),G=_e,J=ie)):X(n.POLYGON_OFFSET_FILL)}function Ae(O){O?le(n.SCISSOR_TEST):X(n.SCISSOR_TEST)}function P(O){O===void 0&&(O=n.TEXTURE0+Y-1),te!==O&&(n.activeTexture(O),te=O)}function T(O,_e,ie){ie===void 0&&(te===null?ie=n.TEXTURE0+Y-1:ie=te);let de=re[ie];de===void 0&&(de={type:void 0,texture:void 0},re[ie]=de),(de.type!==O||de.texture!==_e)&&(te!==ie&&(n.activeTexture(ie),te=ie),n.bindTexture(O,_e||ee[O]),de.type=O,de.texture=_e)}function V(){let O=re[te];O!==void 0&&O.type!==void 0&&(n.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function Q(){try{n.compressedTexImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ae(){try{n.compressedTexImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function $(){try{n.texSubImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Me(){try{n.texSubImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ne(){try{n.compressedTexSubImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ce(){try{n.compressedTexSubImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ue(){try{n.texStorage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function he(){try{n.texStorage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ee(){try{n.texImage2D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Le(){try{n.texImage3D(...arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Ne(O){pe.equals(O)===!1&&(n.scissor(O.x,O.y,O.z,O.w),pe.copy(O))}function ve(O){W.equals(O)===!1&&(n.viewport(O.x,O.y,O.z,O.w),W.copy(O))}function Ke(O,_e){let ie=c.get(_e);ie===void 0&&(ie=new WeakMap,c.set(_e,ie));let de=ie.get(O);de===void 0&&(de=n.getUniformBlockIndex(_e,O.name),ie.set(O,de))}function We(O,_e){let de=c.get(_e).get(O);l.get(_e)!==de&&(n.uniformBlockBinding(_e,de,O.__bindingPointIndex),l.set(_e,de))}function tt(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},te=null,re={},u={},p=new WeakMap,f=[],g=null,m=!1,E=null,d=null,_=null,M=null,x=null,b=null,R=null,A=new De(0,0,0),C=0,w=!1,v=null,H=null,z=null,G=null,J=null,pe.set(0,0,n.canvas.width,n.canvas.height),W.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:le,disable:X,bindFramebuffer:U,drawBuffers:D,useProgram:fe,setBlending:L,setMaterial:ct,setFlipSided:Ce,setCullFace:Je,setLineWidth:Re,setPolygonOffset:ze,setScissorTest:Ae,activeTexture:P,bindTexture:T,unbindTexture:V,compressedTexImage2D:Q,compressedTexImage3D:ae,texImage2D:Ee,texImage3D:Le,updateUBOMapping:Ke,uniformBlockBinding:We,texStorage2D:Ue,texStorage3D:he,texSubImage2D:$,texSubImage3D:Me,compressedTexSubImage2D:ne,compressedTexSubImage3D:ce,scissor:Ne,viewport:ve,reset:tt}}function im(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ye,h=new WeakMap,u,p=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(P,T){return f?new OffscreenCanvas(P,T):Cs("canvas")}function m(P,T,V){let Q=1,ae=Ae(P);if((ae.width>V||ae.height>V)&&(Q=V/Math.max(ae.width,ae.height)),Q<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){let $=Math.floor(Q*ae.width),Me=Math.floor(Q*ae.height);u===void 0&&(u=g($,Me));let ne=T?g($,Me):u;return ne.width=$,ne.height=Me,ne.getContext("2d").drawImage(P,0,0,$,Me),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ae.width+"x"+ae.height+") to ("+$+"x"+Me+")."),ne}else return"data"in P&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ae.width+"x"+ae.height+")."),P;return P}function E(P){return P.generateMipmaps}function d(P){n.generateMipmap(P)}function _(P){return P.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?n.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(P,T,V,Q,ae=!1){if(P!==null){if(n[P]!==void 0)return n[P];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let $=T;if(T===n.RED&&(V===n.FLOAT&&($=n.R32F),V===n.HALF_FLOAT&&($=n.R16F),V===n.UNSIGNED_BYTE&&($=n.R8)),T===n.RED_INTEGER&&(V===n.UNSIGNED_BYTE&&($=n.R8UI),V===n.UNSIGNED_SHORT&&($=n.R16UI),V===n.UNSIGNED_INT&&($=n.R32UI),V===n.BYTE&&($=n.R8I),V===n.SHORT&&($=n.R16I),V===n.INT&&($=n.R32I)),T===n.RG&&(V===n.FLOAT&&($=n.RG32F),V===n.HALF_FLOAT&&($=n.RG16F),V===n.UNSIGNED_BYTE&&($=n.RG8)),T===n.RG_INTEGER&&(V===n.UNSIGNED_BYTE&&($=n.RG8UI),V===n.UNSIGNED_SHORT&&($=n.RG16UI),V===n.UNSIGNED_INT&&($=n.RG32UI),V===n.BYTE&&($=n.RG8I),V===n.SHORT&&($=n.RG16I),V===n.INT&&($=n.RG32I)),T===n.RGB_INTEGER&&(V===n.UNSIGNED_BYTE&&($=n.RGB8UI),V===n.UNSIGNED_SHORT&&($=n.RGB16UI),V===n.UNSIGNED_INT&&($=n.RGB32UI),V===n.BYTE&&($=n.RGB8I),V===n.SHORT&&($=n.RGB16I),V===n.INT&&($=n.RGB32I)),T===n.RGBA_INTEGER&&(V===n.UNSIGNED_BYTE&&($=n.RGBA8UI),V===n.UNSIGNED_SHORT&&($=n.RGBA16UI),V===n.UNSIGNED_INT&&($=n.RGBA32UI),V===n.BYTE&&($=n.RGBA8I),V===n.SHORT&&($=n.RGBA16I),V===n.INT&&($=n.RGBA32I)),T===n.RGB&&V===n.UNSIGNED_INT_5_9_9_9_REV&&($=n.RGB9_E5),T===n.RGBA){let Me=ae?bs:ht.getTransfer(Q);V===n.FLOAT&&($=n.RGBA32F),V===n.HALF_FLOAT&&($=n.RGBA16F),V===n.UNSIGNED_BYTE&&($=Me===Et?n.SRGB8_ALPHA8:n.RGBA8),V===n.UNSIGNED_SHORT_4_4_4_4&&($=n.RGBA4),V===n.UNSIGNED_SHORT_5_5_5_1&&($=n.RGB5_A1)}return($===n.R16F||$===n.R32F||$===n.RG16F||$===n.RG32F||$===n.RGBA16F||$===n.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function x(P,T){let V;return P?T===null||T===ui||T===ls?V=n.DEPTH24_STENCIL8:T===Un?V=n.DEPTH32F_STENCIL8:T===as&&(V=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===ui||T===ls?V=n.DEPTH_COMPONENT24:T===Un?V=n.DEPTH_COMPONENT32F:T===as&&(V=n.DEPTH_COMPONENT16),V}function b(P,T){return E(P)===!0||P.isFramebufferTexture&&P.minFilter!==tn&&P.minFilter!==bn?Math.log2(Math.max(T.width,T.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?T.mipmaps.length:1}function R(P){let T=P.target;T.removeEventListener("dispose",R),C(T),T.isVideoTexture&&h.delete(T)}function A(P){let T=P.target;T.removeEventListener("dispose",A),v(T)}function C(P){let T=i.get(P);if(T.__webglInit===void 0)return;let V=P.source,Q=p.get(V);if(Q){let ae=Q[T.__cacheKey];ae.usedTimes--,ae.usedTimes===0&&w(P),Object.keys(Q).length===0&&p.delete(V)}i.remove(P)}function w(P){let T=i.get(P);n.deleteTexture(T.__webglTexture);let V=P.source,Q=p.get(V);delete Q[T.__cacheKey],o.memory.textures--}function v(P){let T=i.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),i.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(T.__webglFramebuffer[Q]))for(let ae=0;ae<T.__webglFramebuffer[Q].length;ae++)n.deleteFramebuffer(T.__webglFramebuffer[Q][ae]);else n.deleteFramebuffer(T.__webglFramebuffer[Q]);T.__webglDepthbuffer&&n.deleteRenderbuffer(T.__webglDepthbuffer[Q])}else{if(Array.isArray(T.__webglFramebuffer))for(let Q=0;Q<T.__webglFramebuffer.length;Q++)n.deleteFramebuffer(T.__webglFramebuffer[Q]);else n.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&n.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&n.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let Q=0;Q<T.__webglColorRenderbuffer.length;Q++)T.__webglColorRenderbuffer[Q]&&n.deleteRenderbuffer(T.__webglColorRenderbuffer[Q]);T.__webglDepthRenderbuffer&&n.deleteRenderbuffer(T.__webglDepthRenderbuffer)}let V=P.textures;for(let Q=0,ae=V.length;Q<ae;Q++){let $=i.get(V[Q]);$.__webglTexture&&(n.deleteTexture($.__webglTexture),o.memory.textures--),i.remove(V[Q])}i.remove(P)}let H=0;function z(){H=0}function G(){let P=H;return P>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+P+" texture units while this GPU supports only "+s.maxTextures),H+=1,P}function J(P){let T=[];return T.push(P.wrapS),T.push(P.wrapT),T.push(P.wrapR||0),T.push(P.magFilter),T.push(P.minFilter),T.push(P.anisotropy),T.push(P.internalFormat),T.push(P.format),T.push(P.type),T.push(P.generateMipmaps),T.push(P.premultiplyAlpha),T.push(P.flipY),T.push(P.unpackAlignment),T.push(P.colorSpace),T.join()}function Y(P,T){let V=i.get(P);if(P.isVideoTexture&&Re(P),P.isRenderTargetTexture===!1&&P.version>0&&V.__version!==P.version){let Q=P.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{W(V,P,T);return}}t.bindTexture(n.TEXTURE_2D,V.__webglTexture,n.TEXTURE0+T)}function Z(P,T){let V=i.get(P);if(P.version>0&&V.__version!==P.version){W(V,P,T);return}t.bindTexture(n.TEXTURE_2D_ARRAY,V.__webglTexture,n.TEXTURE0+T)}function se(P,T){let V=i.get(P);if(P.version>0&&V.__version!==P.version){W(V,P,T);return}t.bindTexture(n.TEXTURE_3D,V.__webglTexture,n.TEXTURE0+T)}function B(P,T){let V=i.get(P);if(P.version>0&&V.__version!==P.version){ue(V,P,T);return}t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture,n.TEXTURE0+T)}let te={[Fr]:n.REPEAT,[ii]:n.CLAMP_TO_EDGE,[Nr]:n.MIRRORED_REPEAT},re={[tn]:n.NEAREST,[Vc]:n.NEAREST_MIPMAP_NEAREST,[js]:n.NEAREST_MIPMAP_LINEAR,[bn]:n.LINEAR,[To]:n.LINEAR_MIPMAP_NEAREST,[hi]:n.LINEAR_MIPMAP_LINEAR},j={[qc]:n.NEVER,[jc]:n.ALWAYS,[Zc]:n.LESS,[ml]:n.LEQUAL,[Jc]:n.EQUAL,[Qc]:n.GEQUAL,[Kc]:n.GREATER,[$c]:n.NOTEQUAL};function xe(P,T){if(T.type===Un&&e.has("OES_texture_float_linear")===!1&&(T.magFilter===bn||T.magFilter===To||T.magFilter===js||T.magFilter===hi||T.minFilter===bn||T.minFilter===To||T.minFilter===js||T.minFilter===hi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(P,n.TEXTURE_WRAP_S,te[T.wrapS]),n.texParameteri(P,n.TEXTURE_WRAP_T,te[T.wrapT]),(P===n.TEXTURE_3D||P===n.TEXTURE_2D_ARRAY)&&n.texParameteri(P,n.TEXTURE_WRAP_R,te[T.wrapR]),n.texParameteri(P,n.TEXTURE_MAG_FILTER,re[T.magFilter]),n.texParameteri(P,n.TEXTURE_MIN_FILTER,re[T.minFilter]),T.compareFunction&&(n.texParameteri(P,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(P,n.TEXTURE_COMPARE_FUNC,j[T.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===tn||T.minFilter!==js&&T.minFilter!==hi||T.type===Un&&e.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||i.get(T).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");n.texParameterf(P,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,s.getMaxAnisotropy())),i.get(T).__currentAnisotropy=T.anisotropy}}}function pe(P,T){let V=!1;P.__webglInit===void 0&&(P.__webglInit=!0,T.addEventListener("dispose",R));let Q=T.source,ae=p.get(Q);ae===void 0&&(ae={},p.set(Q,ae));let $=J(T);if($!==P.__cacheKey){ae[$]===void 0&&(ae[$]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,V=!0),ae[$].usedTimes++;let Me=ae[P.__cacheKey];Me!==void 0&&(ae[P.__cacheKey].usedTimes--,Me.usedTimes===0&&w(T)),P.__cacheKey=$,P.__webglTexture=ae[$].texture}return V}function W(P,T,V){let Q=n.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(Q=n.TEXTURE_2D_ARRAY),T.isData3DTexture&&(Q=n.TEXTURE_3D);let ae=pe(P,T),$=T.source;t.bindTexture(Q,P.__webglTexture,n.TEXTURE0+V);let Me=i.get($);if($.version!==Me.__version||ae===!0){t.activeTexture(n.TEXTURE0+V);let ne=ht.getPrimaries(ht.workingColorSpace),ce=T.colorSpace===Zn?null:ht.getPrimaries(T.colorSpace),Ue=T.colorSpace===Zn||ne===ce?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,T.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,T.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ue);let he=m(T.image,!1,s.maxTextureSize);he=ze(T,he);let Ee=r.convert(T.format,T.colorSpace),Le=r.convert(T.type),Ne=M(T.internalFormat,Ee,Le,T.colorSpace,T.isVideoTexture);xe(Q,T);let ve,Ke=T.mipmaps,We=T.isVideoTexture!==!0,tt=Me.__version===void 0||ae===!0,O=$.dataReady,_e=b(T,he);if(T.isDepthTexture)Ne=x(T.format===cs,T.type),tt&&(We?t.texStorage2D(n.TEXTURE_2D,1,Ne,he.width,he.height):t.texImage2D(n.TEXTURE_2D,0,Ne,he.width,he.height,0,Ee,Le,null));else if(T.isDataTexture)if(Ke.length>0){We&&tt&&t.texStorage2D(n.TEXTURE_2D,_e,Ne,Ke[0].width,Ke[0].height);for(let ie=0,de=Ke.length;ie<de;ie++)ve=Ke[ie],We?O&&t.texSubImage2D(n.TEXTURE_2D,ie,0,0,ve.width,ve.height,Ee,Le,ve.data):t.texImage2D(n.TEXTURE_2D,ie,Ne,ve.width,ve.height,0,Ee,Le,ve.data);T.generateMipmaps=!1}else We?(tt&&t.texStorage2D(n.TEXTURE_2D,_e,Ne,he.width,he.height),O&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,he.width,he.height,Ee,Le,he.data)):t.texImage2D(n.TEXTURE_2D,0,Ne,he.width,he.height,0,Ee,Le,he.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){We&&tt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,_e,Ne,Ke[0].width,Ke[0].height,he.depth);for(let ie=0,de=Ke.length;ie<de;ie++)if(ve=Ke[ie],T.format!==nn)if(Ee!==null)if(We){if(O)if(T.layerUpdates.size>0){let Pe=vl(ve.width,ve.height,T.format,T.type);for(let Te of T.layerUpdates){let $e=ve.data.subarray(Te*Pe/ve.data.BYTES_PER_ELEMENT,(Te+1)*Pe/ve.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ie,0,0,Te,ve.width,ve.height,1,Ee,$e)}T.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ie,0,0,0,ve.width,ve.height,he.depth,Ee,ve.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ie,Ne,ve.width,ve.height,he.depth,0,ve.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else We?O&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ie,0,0,0,ve.width,ve.height,he.depth,Ee,Le,ve.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ie,Ne,ve.width,ve.height,he.depth,0,Ee,Le,ve.data)}else{We&&tt&&t.texStorage2D(n.TEXTURE_2D,_e,Ne,Ke[0].width,Ke[0].height);for(let ie=0,de=Ke.length;ie<de;ie++)ve=Ke[ie],T.format!==nn?Ee!==null?We?O&&t.compressedTexSubImage2D(n.TEXTURE_2D,ie,0,0,ve.width,ve.height,Ee,ve.data):t.compressedTexImage2D(n.TEXTURE_2D,ie,Ne,ve.width,ve.height,0,ve.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):We?O&&t.texSubImage2D(n.TEXTURE_2D,ie,0,0,ve.width,ve.height,Ee,Le,ve.data):t.texImage2D(n.TEXTURE_2D,ie,Ne,ve.width,ve.height,0,Ee,Le,ve.data)}else if(T.isDataArrayTexture)if(We){if(tt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,_e,Ne,he.width,he.height,he.depth),O)if(T.layerUpdates.size>0){let ie=vl(he.width,he.height,T.format,T.type);for(let de of T.layerUpdates){let Pe=he.data.subarray(de*ie/he.data.BYTES_PER_ELEMENT,(de+1)*ie/he.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,de,he.width,he.height,1,Ee,Le,Pe)}T.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,he.width,he.height,he.depth,Ee,Le,he.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ne,he.width,he.height,he.depth,0,Ee,Le,he.data);else if(T.isData3DTexture)We?(tt&&t.texStorage3D(n.TEXTURE_3D,_e,Ne,he.width,he.height,he.depth),O&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,he.width,he.height,he.depth,Ee,Le,he.data)):t.texImage3D(n.TEXTURE_3D,0,Ne,he.width,he.height,he.depth,0,Ee,Le,he.data);else if(T.isFramebufferTexture){if(tt)if(We)t.texStorage2D(n.TEXTURE_2D,_e,Ne,he.width,he.height);else{let ie=he.width,de=he.height;for(let Pe=0;Pe<_e;Pe++)t.texImage2D(n.TEXTURE_2D,Pe,Ne,ie,de,0,Ee,Le,null),ie>>=1,de>>=1}}else if(Ke.length>0){if(We&&tt){let ie=Ae(Ke[0]);t.texStorage2D(n.TEXTURE_2D,_e,Ne,ie.width,ie.height)}for(let ie=0,de=Ke.length;ie<de;ie++)ve=Ke[ie],We?O&&t.texSubImage2D(n.TEXTURE_2D,ie,0,0,Ee,Le,ve):t.texImage2D(n.TEXTURE_2D,ie,Ne,Ee,Le,ve);T.generateMipmaps=!1}else if(We){if(tt){let ie=Ae(he);t.texStorage2D(n.TEXTURE_2D,_e,Ne,ie.width,ie.height)}O&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Ee,Le,he)}else t.texImage2D(n.TEXTURE_2D,0,Ne,Ee,Le,he);E(T)&&d(Q),Me.__version=$.version,T.onUpdate&&T.onUpdate(T)}P.__version=T.version}function ue(P,T,V){if(T.image.length!==6)return;let Q=pe(P,T),ae=T.source;t.bindTexture(n.TEXTURE_CUBE_MAP,P.__webglTexture,n.TEXTURE0+V);let $=i.get(ae);if(ae.version!==$.__version||Q===!0){t.activeTexture(n.TEXTURE0+V);let Me=ht.getPrimaries(ht.workingColorSpace),ne=T.colorSpace===Zn?null:ht.getPrimaries(T.colorSpace),ce=T.colorSpace===Zn||Me===ne?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,T.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,T.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ce);let Ue=T.isCompressedTexture||T.image[0].isCompressedTexture,he=T.image[0]&&T.image[0].isDataTexture,Ee=[];for(let de=0;de<6;de++)!Ue&&!he?Ee[de]=m(T.image[de],!0,s.maxCubemapSize):Ee[de]=he?T.image[de].image:T.image[de],Ee[de]=ze(T,Ee[de]);let Le=Ee[0],Ne=r.convert(T.format,T.colorSpace),ve=r.convert(T.type),Ke=M(T.internalFormat,Ne,ve,T.colorSpace),We=T.isVideoTexture!==!0,tt=$.__version===void 0||Q===!0,O=ae.dataReady,_e=b(T,Le);xe(n.TEXTURE_CUBE_MAP,T);let ie;if(Ue){We&&tt&&t.texStorage2D(n.TEXTURE_CUBE_MAP,_e,Ke,Le.width,Le.height);for(let de=0;de<6;de++){ie=Ee[de].mipmaps;for(let Pe=0;Pe<ie.length;Pe++){let Te=ie[Pe];T.format!==nn?Ne!==null?We?O&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe,0,0,Te.width,Te.height,Ne,Te.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe,Ke,Te.width,Te.height,0,Te.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):We?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe,0,0,Te.width,Te.height,Ne,ve,Te.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe,Ke,Te.width,Te.height,0,Ne,ve,Te.data)}}}else{if(ie=T.mipmaps,We&&tt){ie.length>0&&_e++;let de=Ae(Ee[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,_e,Ke,de.width,de.height)}for(let de=0;de<6;de++)if(he){We?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,0,0,Ee[de].width,Ee[de].height,Ne,ve,Ee[de].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,Ke,Ee[de].width,Ee[de].height,0,Ne,ve,Ee[de].data);for(let Pe=0;Pe<ie.length;Pe++){let $e=ie[Pe].image[de].image;We?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe+1,0,0,$e.width,$e.height,Ne,ve,$e.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe+1,Ke,$e.width,$e.height,0,Ne,ve,$e.data)}}else{We?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,0,0,Ne,ve,Ee[de]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,0,Ke,Ne,ve,Ee[de]);for(let Pe=0;Pe<ie.length;Pe++){let Te=ie[Pe];We?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe+1,0,0,Ne,ve,Te.image[de]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+de,Pe+1,Ke,Ne,ve,Te.image[de])}}}E(T)&&d(n.TEXTURE_CUBE_MAP),$.__version=ae.version,T.onUpdate&&T.onUpdate(T)}P.__version=T.version}function ee(P,T,V,Q,ae,$){let Me=r.convert(V.format,V.colorSpace),ne=r.convert(V.type),ce=M(V.internalFormat,Me,ne,V.colorSpace),Ue=i.get(T),he=i.get(V);if(he.__renderTarget=T,!Ue.__hasExternalTextures){let Ee=Math.max(1,T.width>>$),Le=Math.max(1,T.height>>$);ae===n.TEXTURE_3D||ae===n.TEXTURE_2D_ARRAY?t.texImage3D(ae,$,ce,Ee,Le,T.depth,0,Me,ne,null):t.texImage2D(ae,$,ce,Ee,Le,0,Me,ne,null)}t.bindFramebuffer(n.FRAMEBUFFER,P),Je(T)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Q,ae,he.__webglTexture,0,Ce(T)):(ae===n.TEXTURE_2D||ae>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ae<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Q,ae,he.__webglTexture,$),t.bindFramebuffer(n.FRAMEBUFFER,null)}function le(P,T,V){if(n.bindRenderbuffer(n.RENDERBUFFER,P),T.depthBuffer){let Q=T.depthTexture,ae=Q&&Q.isDepthTexture?Q.type:null,$=x(T.stencilBuffer,ae),Me=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ne=Ce(T);Je(T)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ne,$,T.width,T.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,ne,$,T.width,T.height):n.renderbufferStorage(n.RENDERBUFFER,$,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Me,n.RENDERBUFFER,P)}else{let Q=T.textures;for(let ae=0;ae<Q.length;ae++){let $=Q[ae],Me=r.convert($.format,$.colorSpace),ne=r.convert($.type),ce=M($.internalFormat,Me,ne,$.colorSpace),Ue=Ce(T);V&&Je(T)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ue,ce,T.width,T.height):Je(T)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ue,ce,T.width,T.height):n.renderbufferStorage(n.RENDERBUFFER,ce,T.width,T.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function X(P,T){if(T&&T.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,P),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Q=i.get(T.depthTexture);Q.__renderTarget=T,(!Q.__webglTexture||T.depthTexture.image.width!==T.width||T.depthTexture.image.height!==T.height)&&(T.depthTexture.image.width=T.width,T.depthTexture.image.height=T.height,T.depthTexture.needsUpdate=!0),Y(T.depthTexture,0);let ae=Q.__webglTexture,$=Ce(T);if(T.depthTexture.format===$i)Je(T)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ae,0,$):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,ae,0);else if(T.depthTexture.format===cs)Je(T)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ae,0,$):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,ae,0);else throw new Error("Unknown depthTexture format")}function U(P){let T=i.get(P),V=P.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==P.depthTexture){let Q=P.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),Q){let ae=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,Q.removeEventListener("dispose",ae)};Q.addEventListener("dispose",ae),T.__depthDisposeCallback=ae}T.__boundDepthTexture=Q}if(P.depthTexture&&!T.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");X(T.__webglFramebuffer,P)}else if(V){T.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(t.bindFramebuffer(n.FRAMEBUFFER,T.__webglFramebuffer[Q]),T.__webglDepthbuffer[Q]===void 0)T.__webglDepthbuffer[Q]=n.createRenderbuffer(),le(T.__webglDepthbuffer[Q],P,!1);else{let ae=P.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,$=T.__webglDepthbuffer[Q];n.bindRenderbuffer(n.RENDERBUFFER,$),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,$)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=n.createRenderbuffer(),le(T.__webglDepthbuffer,P,!1);else{let Q=P.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=T.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ae),n.framebufferRenderbuffer(n.FRAMEBUFFER,Q,n.RENDERBUFFER,ae)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function D(P,T,V){let Q=i.get(P);T!==void 0&&ee(Q.__webglFramebuffer,P,P.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),V!==void 0&&U(P)}function fe(P){let T=P.texture,V=i.get(P),Q=i.get(T);P.addEventListener("dispose",A);let ae=P.textures,$=P.isWebGLCubeRenderTarget===!0,Me=ae.length>1;if(Me||(Q.__webglTexture===void 0&&(Q.__webglTexture=n.createTexture()),Q.__version=T.version,o.memory.textures++),$){V.__webglFramebuffer=[];for(let ne=0;ne<6;ne++)if(T.mipmaps&&T.mipmaps.length>0){V.__webglFramebuffer[ne]=[];for(let ce=0;ce<T.mipmaps.length;ce++)V.__webglFramebuffer[ne][ce]=n.createFramebuffer()}else V.__webglFramebuffer[ne]=n.createFramebuffer()}else{if(T.mipmaps&&T.mipmaps.length>0){V.__webglFramebuffer=[];for(let ne=0;ne<T.mipmaps.length;ne++)V.__webglFramebuffer[ne]=n.createFramebuffer()}else V.__webglFramebuffer=n.createFramebuffer();if(Me)for(let ne=0,ce=ae.length;ne<ce;ne++){let Ue=i.get(ae[ne]);Ue.__webglTexture===void 0&&(Ue.__webglTexture=n.createTexture(),o.memory.textures++)}if(P.samples>0&&Je(P)===!1){V.__webglMultisampledFramebuffer=n.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ne=0;ne<ae.length;ne++){let ce=ae[ne];V.__webglColorRenderbuffer[ne]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,V.__webglColorRenderbuffer[ne]);let Ue=r.convert(ce.format,ce.colorSpace),he=r.convert(ce.type),Ee=M(ce.internalFormat,Ue,he,ce.colorSpace,P.isXRRenderTarget===!0),Le=Ce(P);n.renderbufferStorageMultisample(n.RENDERBUFFER,Le,Ee,P.width,P.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ne,n.RENDERBUFFER,V.__webglColorRenderbuffer[ne])}n.bindRenderbuffer(n.RENDERBUFFER,null),P.depthBuffer&&(V.__webglDepthRenderbuffer=n.createRenderbuffer(),le(V.__webglDepthRenderbuffer,P,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if($){t.bindTexture(n.TEXTURE_CUBE_MAP,Q.__webglTexture),xe(n.TEXTURE_CUBE_MAP,T);for(let ne=0;ne<6;ne++)if(T.mipmaps&&T.mipmaps.length>0)for(let ce=0;ce<T.mipmaps.length;ce++)ee(V.__webglFramebuffer[ne][ce],P,T,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,ce);else ee(V.__webglFramebuffer[ne],P,T,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0);E(T)&&d(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Me){for(let ne=0,ce=ae.length;ne<ce;ne++){let Ue=ae[ne],he=i.get(Ue);t.bindTexture(n.TEXTURE_2D,he.__webglTexture),xe(n.TEXTURE_2D,Ue),ee(V.__webglFramebuffer,P,Ue,n.COLOR_ATTACHMENT0+ne,n.TEXTURE_2D,0),E(Ue)&&d(n.TEXTURE_2D)}t.unbindTexture()}else{let ne=n.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(ne=P.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ne,Q.__webglTexture),xe(ne,T),T.mipmaps&&T.mipmaps.length>0)for(let ce=0;ce<T.mipmaps.length;ce++)ee(V.__webglFramebuffer[ce],P,T,n.COLOR_ATTACHMENT0,ne,ce);else ee(V.__webglFramebuffer,P,T,n.COLOR_ATTACHMENT0,ne,0);E(T)&&d(ne),t.unbindTexture()}P.depthBuffer&&U(P)}function we(P){let T=P.textures;for(let V=0,Q=T.length;V<Q;V++){let ae=T[V];if(E(ae)){let $=_(P),Me=i.get(ae).__webglTexture;t.bindTexture($,Me),d($),t.unbindTexture()}}}let Oe=[],L=[];function ct(P){if(P.samples>0){if(Je(P)===!1){let T=P.textures,V=P.width,Q=P.height,ae=n.COLOR_BUFFER_BIT,$=P.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Me=i.get(P),ne=T.length>1;if(ne)for(let ce=0;ce<T.length;ce++)t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ce,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ce,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Me.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Me.__webglFramebuffer);for(let ce=0;ce<T.length;ce++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(ae|=n.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(ae|=n.STENCIL_BUFFER_BIT)),ne){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Me.__webglColorRenderbuffer[ce]);let Ue=i.get(T[ce]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ue,0)}n.blitFramebuffer(0,0,V,Q,0,0,V,Q,ae,n.NEAREST),l===!0&&(Oe.length=0,L.length=0,Oe.push(n.COLOR_ATTACHMENT0+ce),P.depthBuffer&&P.resolveDepthBuffer===!1&&(Oe.push($),L.push($),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,L)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Oe))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ne)for(let ce=0;ce<T.length;ce++){t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ce,n.RENDERBUFFER,Me.__webglColorRenderbuffer[ce]);let Ue=i.get(T[ce]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ce,n.TEXTURE_2D,Ue,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Me.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.resolveDepthBuffer===!1&&l){let T=P.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[T])}}}function Ce(P){return Math.min(s.maxSamples,P.samples)}function Je(P){let T=i.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function Re(P){let T=o.render.frame;h.get(P)!==T&&(h.set(P,T),P.update())}function ze(P,T){let V=P.colorSpace,Q=P.format,ae=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||V!==wi&&V!==Zn&&(ht.getTransfer(V)===Et?(Q!==nn||ae!==Ln)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),T}function Ae(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(c.width=P.naturalWidth||P.width,c.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(c.width=P.displayWidth,c.height=P.displayHeight):(c.width=P.width,c.height=P.height),c}this.allocateTextureUnit=G,this.resetTextureUnits=z,this.setTexture2D=Y,this.setTexture2DArray=Z,this.setTexture3D=se,this.setTextureCube=B,this.rebindTextures=D,this.setupRenderTarget=fe,this.updateRenderTargetMipmap=we,this.updateMultisampleRenderTarget=ct,this.setupDepthRenderbuffer=U,this.setupFrameBufferTexture=ee,this.useMultisampledRTT=Je}function sm(n,e){function t(i,s=Zn){let r,o=ht.getTransfer(s);if(i===Ln)return n.UNSIGNED_BYTE;if(i===bo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Ro)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ol)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===sl)return n.BYTE;if(i===rl)return n.SHORT;if(i===as)return n.UNSIGNED_SHORT;if(i===So)return n.INT;if(i===ui)return n.UNSIGNED_INT;if(i===Un)return n.FLOAT;if(i===di)return n.HALF_FLOAT;if(i===al)return n.ALPHA;if(i===ll)return n.RGB;if(i===nn)return n.RGBA;if(i===cl)return n.LUMINANCE;if(i===hl)return n.LUMINANCE_ALPHA;if(i===$i)return n.DEPTH_COMPONENT;if(i===cs)return n.DEPTH_STENCIL;if(i===ul)return n.RED;if(i===Ao)return n.RED_INTEGER;if(i===dl)return n.RG;if(i===Co)return n.RG_INTEGER;if(i===Po)return n.RGBA_INTEGER;if(i===er||i===tr||i===nr||i===ir)if(o===Et)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===er)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===tr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===nr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ir)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===er)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===tr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===nr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ir)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Io||i===Ho||i===Do||i===Lo)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===Io)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Ho)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Do)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Lo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Uo||i===Bo||i===Fo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Uo||i===Bo)return o===Et?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Fo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===No||i===Oo||i===Go||i===ko||i===zo||i===Vo||i===Wo||i===Xo||i===Yo||i===qo||i===Zo||i===Jo||i===Ko||i===$o)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===No)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Oo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Go)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ko)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===zo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Vo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Wo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Xo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Yo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===qo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Zo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Jo)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ko)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===$o)return o===Et?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===sr||i===Qo||i===jo)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===sr)return o===Et?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Qo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===jo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===fl||i===ea||i===ta||i===na)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===sr)return r.COMPRESSED_RED_RGTC1_EXT;if(i===ea)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ta)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===na)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ls?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var rm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,om=`
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

}`,Ul=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let s=new $t,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==i.depthNear||t.depthFar!==i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new zt({vertexShader:rm,fragmentShader:om,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new y(new rt(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Bl=class extends Wn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,p=null,f=null,g=null,m=new Ul,E=t.getContextAttributes(),d=null,_=null,M=[],x=[],b=new ye,R=null,A=new Dt;A.viewport=new dt;let C=new Dt;C.viewport=new dt;let w=[A,C],v=new uo,H=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let ue=M[W];return ue===void 0&&(ue=new es,M[W]=ue),ue.getTargetRaySpace()},this.getControllerGrip=function(W){let ue=M[W];return ue===void 0&&(ue=new es,M[W]=ue),ue.getGripSpace()},this.getHand=function(W){let ue=M[W];return ue===void 0&&(ue=new es,M[W]=ue),ue.getHandSpace()};function G(W){let ue=x.indexOf(W.inputSource);if(ue===-1)return;let ee=M[ue];ee!==void 0&&(ee.update(W.inputSource,W.frame,c||o),ee.dispatchEvent({type:W.type,data:W.inputSource}))}function J(){s.removeEventListener("select",G),s.removeEventListener("selectstart",G),s.removeEventListener("selectend",G),s.removeEventListener("squeeze",G),s.removeEventListener("squeezestart",G),s.removeEventListener("squeezeend",G),s.removeEventListener("end",J),s.removeEventListener("inputsourceschange",Y);for(let W=0;W<M.length;W++){let ue=x[W];ue!==null&&(x[W]=null,M[W].disconnect(ue))}H=null,z=null,m.reset(),e.setRenderTarget(d),f=null,p=null,u=null,s=null,_=null,pe.stop(),i.isPresenting=!1,e.setPixelRatio(R),e.setSize(b.width,b.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return p!==null?p:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(d=e.getRenderTarget(),s.addEventListener("select",G),s.addEventListener("selectstart",G),s.addEventListener("selectend",G),s.addEventListener("squeeze",G),s.addEventListener("squeezestart",G),s.addEventListener("squeezeend",G),s.addEventListener("end",J),s.addEventListener("inputsourceschange",Y),E.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(b),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let ee=null,le=null,X=null;E.depth&&(X=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ee=E.stencil?cs:$i,le=E.stencil?ls:ui);let U={colorFormat:t.RGBA8,depthFormat:X,scaleFactor:r};u=new XRWebGLBinding(s,t),p=u.createProjectionLayer(U),s.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,!1),_=new En(p.textureWidth,p.textureHeight,{format:nn,type:Ln,depthTexture:new Os(p.textureWidth,p.textureHeight,le,void 0,void 0,void 0,void 0,void 0,void 0,ee),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}else{let ee={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,ee),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),_=new En(f.framebufferWidth,f.framebufferHeight,{format:nn,type:Ln,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),pe.setContext(s),pe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Y(W){for(let ue=0;ue<W.removed.length;ue++){let ee=W.removed[ue],le=x.indexOf(ee);le>=0&&(x[le]=null,M[le].disconnect(ee))}for(let ue=0;ue<W.added.length;ue++){let ee=W.added[ue],le=x.indexOf(ee);if(le===-1){for(let U=0;U<M.length;U++)if(U>=x.length){x.push(ee),le=U;break}else if(x[U]===null){x[U]=ee,le=U;break}if(le===-1)break}let X=M[le];X&&X.connect(ee)}}let Z=new I,se=new I;function B(W,ue,ee){Z.setFromMatrixPosition(ue.matrixWorld),se.setFromMatrixPosition(ee.matrixWorld);let le=Z.distanceTo(se),X=ue.projectionMatrix.elements,U=ee.projectionMatrix.elements,D=X[14]/(X[10]-1),fe=X[14]/(X[10]+1),we=(X[9]+1)/X[5],Oe=(X[9]-1)/X[5],L=(X[8]-1)/X[0],ct=(U[8]+1)/U[0],Ce=D*L,Je=D*ct,Re=le/(-L+ct),ze=Re*-L;if(ue.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(ze),W.translateZ(Re),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),X[10]===-1)W.projectionMatrix.copy(ue.projectionMatrix),W.projectionMatrixInverse.copy(ue.projectionMatrixInverse);else{let Ae=D+Re,P=fe+Re,T=Ce-ze,V=Je+(le-ze),Q=we*fe/P*Ae,ae=Oe*fe/P*Ae;W.projectionMatrix.makePerspective(T,V,Q,ae,Ae,P),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function te(W,ue){ue===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(ue.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;let ue=W.near,ee=W.far;m.texture!==null&&(m.depthNear>0&&(ue=m.depthNear),m.depthFar>0&&(ee=m.depthFar)),v.near=C.near=A.near=ue,v.far=C.far=A.far=ee,(H!==v.near||z!==v.far)&&(s.updateRenderState({depthNear:v.near,depthFar:v.far}),H=v.near,z=v.far),A.layers.mask=W.layers.mask|2,C.layers.mask=W.layers.mask|4,v.layers.mask=A.layers.mask|C.layers.mask;let le=W.parent,X=v.cameras;te(v,le);for(let U=0;U<X.length;U++)te(X[U],le);X.length===2?B(v,A,C):v.projectionMatrix.copy(A.projectionMatrix),re(W,v,le)};function re(W,ue,ee){ee===null?W.matrix.copy(ue.matrixWorld):(W.matrix.copy(ee.matrixWorld),W.matrix.invert(),W.matrix.multiply(ue.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(ue.projectionMatrix),W.projectionMatrixInverse.copy(ue.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=As*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(p===null&&f===null))return l},this.setFoveation=function(W){l=W,p!==null&&(p.fixedFoveation=W),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=W)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(v)};let j=null;function xe(W,ue){if(h=ue.getViewerPose(c||o),g=ue,h!==null){let ee=h.views;f!==null&&(e.setRenderTargetFramebuffer(_,f.framebuffer),e.setRenderTarget(_));let le=!1;ee.length!==v.cameras.length&&(v.cameras.length=0,le=!0);for(let D=0;D<ee.length;D++){let fe=ee[D],we=null;if(f!==null)we=f.getViewport(fe);else{let L=u.getViewSubImage(p,fe);we=L.viewport,D===0&&(e.setRenderTargetTextures(_,L.colorTexture,L.depthStencilTexture),e.setRenderTarget(_))}let Oe=w[D];Oe===void 0&&(Oe=new Dt,Oe.layers.enable(D),Oe.viewport=new dt,w[D]=Oe),Oe.matrix.fromArray(fe.transform.matrix),Oe.matrix.decompose(Oe.position,Oe.quaternion,Oe.scale),Oe.projectionMatrix.fromArray(fe.projectionMatrix),Oe.projectionMatrixInverse.copy(Oe.projectionMatrix).invert(),Oe.viewport.set(we.x,we.y,we.width,we.height),D===0&&(v.matrix.copy(Oe.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),le===!0&&v.cameras.push(Oe)}let X=s.enabledFeatures;if(X&&X.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&u){let D=u.getDepthInformation(ee[0]);D&&D.isValid&&D.texture&&m.init(e,D,s.renderState)}}for(let ee=0;ee<M.length;ee++){let le=x[ee],X=M[ee];le!==null&&X!==void 0&&X.update(le,ue,c||o)}j&&j(W,ue),ue.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ue}),g=null}let pe=new Ch;pe.setAnimationLoop(xe),this.setAnimationLoop=function(W){j=W},this.dispose=function(){}}},Li=new Qt,am=new pt;function lm(n,e){function t(E,d){E.matrixAutoUpdate===!0&&E.updateMatrix(),d.value.copy(E.matrix)}function i(E,d){d.color.getRGB(E.fogColor.value,xl(n)),d.isFog?(E.fogNear.value=d.near,E.fogFar.value=d.far):d.isFogExp2&&(E.fogDensity.value=d.density)}function s(E,d,_,M,x){d.isMeshBasicMaterial||d.isMeshLambertMaterial?r(E,d):d.isMeshToonMaterial?(r(E,d),u(E,d)):d.isMeshPhongMaterial?(r(E,d),h(E,d)):d.isMeshStandardMaterial?(r(E,d),p(E,d),d.isMeshPhysicalMaterial&&f(E,d,x)):d.isMeshMatcapMaterial?(r(E,d),g(E,d)):d.isMeshDepthMaterial?r(E,d):d.isMeshDistanceMaterial?(r(E,d),m(E,d)):d.isMeshNormalMaterial?r(E,d):d.isLineBasicMaterial?(o(E,d),d.isLineDashedMaterial&&a(E,d)):d.isPointsMaterial?l(E,d,_,M):d.isSpriteMaterial?c(E,d):d.isShadowMaterial?(E.color.value.copy(d.color),E.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(E,d){E.opacity.value=d.opacity,d.color&&E.diffuse.value.copy(d.color),d.emissive&&E.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(E.map.value=d.map,t(d.map,E.mapTransform)),d.alphaMap&&(E.alphaMap.value=d.alphaMap,t(d.alphaMap,E.alphaMapTransform)),d.bumpMap&&(E.bumpMap.value=d.bumpMap,t(d.bumpMap,E.bumpMapTransform),E.bumpScale.value=d.bumpScale,d.side===Wt&&(E.bumpScale.value*=-1)),d.normalMap&&(E.normalMap.value=d.normalMap,t(d.normalMap,E.normalMapTransform),E.normalScale.value.copy(d.normalScale),d.side===Wt&&E.normalScale.value.negate()),d.displacementMap&&(E.displacementMap.value=d.displacementMap,t(d.displacementMap,E.displacementMapTransform),E.displacementScale.value=d.displacementScale,E.displacementBias.value=d.displacementBias),d.emissiveMap&&(E.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,E.emissiveMapTransform)),d.specularMap&&(E.specularMap.value=d.specularMap,t(d.specularMap,E.specularMapTransform)),d.alphaTest>0&&(E.alphaTest.value=d.alphaTest);let _=e.get(d),M=_.envMap,x=_.envMapRotation;M&&(E.envMap.value=M,Li.copy(x),Li.x*=-1,Li.y*=-1,Li.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Li.y*=-1,Li.z*=-1),E.envMapRotation.value.setFromMatrix4(am.makeRotationFromEuler(Li)),E.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,E.reflectivity.value=d.reflectivity,E.ior.value=d.ior,E.refractionRatio.value=d.refractionRatio),d.lightMap&&(E.lightMap.value=d.lightMap,E.lightMapIntensity.value=d.lightMapIntensity,t(d.lightMap,E.lightMapTransform)),d.aoMap&&(E.aoMap.value=d.aoMap,E.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,E.aoMapTransform))}function o(E,d){E.diffuse.value.copy(d.color),E.opacity.value=d.opacity,d.map&&(E.map.value=d.map,t(d.map,E.mapTransform))}function a(E,d){E.dashSize.value=d.dashSize,E.totalSize.value=d.dashSize+d.gapSize,E.scale.value=d.scale}function l(E,d,_,M){E.diffuse.value.copy(d.color),E.opacity.value=d.opacity,E.size.value=d.size*_,E.scale.value=M*.5,d.map&&(E.map.value=d.map,t(d.map,E.uvTransform)),d.alphaMap&&(E.alphaMap.value=d.alphaMap,t(d.alphaMap,E.alphaMapTransform)),d.alphaTest>0&&(E.alphaTest.value=d.alphaTest)}function c(E,d){E.diffuse.value.copy(d.color),E.opacity.value=d.opacity,E.rotation.value=d.rotation,d.map&&(E.map.value=d.map,t(d.map,E.mapTransform)),d.alphaMap&&(E.alphaMap.value=d.alphaMap,t(d.alphaMap,E.alphaMapTransform)),d.alphaTest>0&&(E.alphaTest.value=d.alphaTest)}function h(E,d){E.specular.value.copy(d.specular),E.shininess.value=Math.max(d.shininess,1e-4)}function u(E,d){d.gradientMap&&(E.gradientMap.value=d.gradientMap)}function p(E,d){E.metalness.value=d.metalness,d.metalnessMap&&(E.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,E.metalnessMapTransform)),E.roughness.value=d.roughness,d.roughnessMap&&(E.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,E.roughnessMapTransform)),d.envMap&&(E.envMapIntensity.value=d.envMapIntensity)}function f(E,d,_){E.ior.value=d.ior,d.sheen>0&&(E.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),E.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(E.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,E.sheenColorMapTransform)),d.sheenRoughnessMap&&(E.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,E.sheenRoughnessMapTransform))),d.clearcoat>0&&(E.clearcoat.value=d.clearcoat,E.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(E.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,E.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(E.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,E.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(E.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,E.clearcoatNormalMapTransform),E.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Wt&&E.clearcoatNormalScale.value.negate())),d.dispersion>0&&(E.dispersion.value=d.dispersion),d.iridescence>0&&(E.iridescence.value=d.iridescence,E.iridescenceIOR.value=d.iridescenceIOR,E.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],E.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(E.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,E.iridescenceMapTransform)),d.iridescenceThicknessMap&&(E.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,E.iridescenceThicknessMapTransform))),d.transmission>0&&(E.transmission.value=d.transmission,E.transmissionSamplerMap.value=_.texture,E.transmissionSamplerSize.value.set(_.width,_.height),d.transmissionMap&&(E.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,E.transmissionMapTransform)),E.thickness.value=d.thickness,d.thicknessMap&&(E.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,E.thicknessMapTransform)),E.attenuationDistance.value=d.attenuationDistance,E.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(E.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(E.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,E.anisotropyMapTransform))),E.specularIntensity.value=d.specularIntensity,E.specularColor.value.copy(d.specularColor),d.specularColorMap&&(E.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,E.specularColorMapTransform)),d.specularIntensityMap&&(E.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,E.specularIntensityMapTransform))}function g(E,d){d.matcap&&(E.matcap.value=d.matcap)}function m(E,d){let _=e.get(d).light;E.referencePosition.value.setFromMatrixPosition(_.matrixWorld),E.nearDistance.value=_.shadow.camera.near,E.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function cm(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,M){let x=M.program;i.uniformBlockBinding(_,x)}function c(_,M){let x=s[_.id];x===void 0&&(g(_),x=h(_),s[_.id]=x,_.addEventListener("dispose",E));let b=M.program;i.updateUBOMapping(_,b);let R=e.render.frame;r[_.id]!==R&&(p(_),r[_.id]=R)}function h(_){let M=u();_.__bindingPointIndex=M;let x=n.createBuffer(),b=_.__size,R=_.usage;return n.bindBuffer(n.UNIFORM_BUFFER,x),n.bufferData(n.UNIFORM_BUFFER,b,R),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,x),x}function u(){for(let _=0;_<a;_++)if(o.indexOf(_)===-1)return o.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(_){let M=s[_.id],x=_.uniforms,b=_.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let R=0,A=x.length;R<A;R++){let C=Array.isArray(x[R])?x[R]:[x[R]];for(let w=0,v=C.length;w<v;w++){let H=C[w];if(f(H,R,w,b)===!0){let z=H.__offset,G=Array.isArray(H.value)?H.value:[H.value],J=0;for(let Y=0;Y<G.length;Y++){let Z=G[Y],se=m(Z);typeof Z=="number"||typeof Z=="boolean"?(H.__data[0]=Z,n.bufferSubData(n.UNIFORM_BUFFER,z+J,H.__data)):Z.isMatrix3?(H.__data[0]=Z.elements[0],H.__data[1]=Z.elements[1],H.__data[2]=Z.elements[2],H.__data[3]=0,H.__data[4]=Z.elements[3],H.__data[5]=Z.elements[4],H.__data[6]=Z.elements[5],H.__data[7]=0,H.__data[8]=Z.elements[6],H.__data[9]=Z.elements[7],H.__data[10]=Z.elements[8],H.__data[11]=0):(Z.toArray(H.__data,J),J+=se.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,z,H.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(_,M,x,b){let R=_.value,A=M+"_"+x;if(b[A]===void 0)return typeof R=="number"||typeof R=="boolean"?b[A]=R:b[A]=R.clone(),!0;{let C=b[A];if(typeof R=="number"||typeof R=="boolean"){if(C!==R)return b[A]=R,!0}else if(C.equals(R)===!1)return C.copy(R),!0}return!1}function g(_){let M=_.uniforms,x=0,b=16;for(let A=0,C=M.length;A<C;A++){let w=Array.isArray(M[A])?M[A]:[M[A]];for(let v=0,H=w.length;v<H;v++){let z=w[v],G=Array.isArray(z.value)?z.value:[z.value];for(let J=0,Y=G.length;J<Y;J++){let Z=G[J],se=m(Z),B=x%b,te=B%se.boundary,re=B+te;x+=te,re!==0&&b-re<se.storage&&(x+=b-re),z.__data=new Float32Array(se.storage/Float32Array.BYTES_PER_ELEMENT),z.__offset=x,x+=se.storage}}}let R=x%b;return R>0&&(x+=b-R),_.__size=x,_.__cache={},this}function m(_){let M={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(M.boundary=4,M.storage=4):_.isVector2?(M.boundary=8,M.storage=8):_.isVector3||_.isColor?(M.boundary=16,M.storage=12):_.isVector4?(M.boundary=16,M.storage=16):_.isMatrix3?(M.boundary=48,M.storage=48):_.isMatrix4?(M.boundary=64,M.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),M}function E(_){let M=_.target;M.removeEventListener("dispose",E);let x=o.indexOf(M.__bindingPointIndex);o.splice(x,1),n.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function d(){for(let _ in s)n.deleteBuffer(s[_]);o=[],s={},r={}}return{bind:l,update:c,dispose:d}}var la=class{constructor(e={}){let{canvas:t=eh(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:p=!1}=e;this.isWebGLRenderer=!0;let f;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=i.getContextAttributes().alpha}else f=o;let g=new Uint32Array(4),m=new Int32Array(4),E=null,d=null,_=[],M=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=qn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let x=this,b=!1;this._outputColorSpace=Ut;let R=0,A=0,C=null,w=-1,v=null,H=new dt,z=new dt,G=null,J=new De(0),Y=0,Z=t.width,se=t.height,B=1,te=null,re=null,j=new dt(0,0,Z,se),xe=new dt(0,0,Z,se),pe=!1,W=new ts,ue=!1,ee=!1,le=new pt,X=new pt,U=new I,D=new dt,fe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},we=!1;function Oe(){return C===null?B:1}let L=i;function ct(S,N){return t.getContext(S,N)}try{let S={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"175"}`),t.addEventListener("webglcontextlost",de,!1),t.addEventListener("webglcontextrestored",Pe,!1),t.addEventListener("webglcontextcreationerror",Te,!1),L===null){let N="webgl2";if(L=ct(N,S),L===null)throw ct(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let Ce,Je,Re,ze,Ae,P,T,V,Q,ae,$,Me,ne,ce,Ue,he,Ee,Le,Ne,ve,Ke,We,tt,O;function _e(){Ce=new Rp(L),Ce.init(),We=new sm(L,Ce),Je=new Mp(L,Ce,e,We),Re=new nm(L,Ce),Je.reverseDepthBuffer&&p&&Re.buffers.depth.setReversed(!0),ze=new Pp(L),Ae=new V0,P=new im(L,Ce,Re,Ae,Je,We,ze),T=new vp(x),V=new bp(x),Q=new Uu(L),tt=new xp(L,Q),ae=new Ap(L,Q,ze,tt),$=new Hp(L,ae,Q,ze),Ne=new Ip(L,Je,P),he=new _p(Ae),Me=new z0(x,T,V,Ce,Je,tt,he),ne=new lm(x,Ae),ce=new X0,Ue=new $0(Ce),Le=new Ep(x,T,V,Re,$,f,l),Ee=new em(x,$,Je),O=new cm(L,ze,Je,Re),ve=new yp(L,Ce,ze),Ke=new Cp(L,Ce,ze),ze.programs=Me.programs,x.capabilities=Je,x.extensions=Ce,x.properties=Ae,x.renderLists=ce,x.shadowMap=Ee,x.state=Re,x.info=ze}_e();let ie=new Bl(x,L);this.xr=ie,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let S=Ce.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=Ce.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return B},this.setPixelRatio=function(S){S!==void 0&&(B=S,this.setSize(Z,se,!1))},this.getSize=function(S){return S.set(Z,se)},this.setSize=function(S,N,q=!0){if(ie.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Z=S,se=N,t.width=Math.floor(S*B),t.height=Math.floor(N*B),q===!0&&(t.style.width=S+"px",t.style.height=N+"px"),this.setViewport(0,0,S,N)},this.getDrawingBufferSize=function(S){return S.set(Z*B,se*B).floor()},this.setDrawingBufferSize=function(S,N,q){Z=S,se=N,B=q,t.width=Math.floor(S*q),t.height=Math.floor(N*q),this.setViewport(0,0,S,N)},this.getCurrentViewport=function(S){return S.copy(H)},this.getViewport=function(S){return S.copy(j)},this.setViewport=function(S,N,q,K){S.isVector4?j.set(S.x,S.y,S.z,S.w):j.set(S,N,q,K),Re.viewport(H.copy(j).multiplyScalar(B).round())},this.getScissor=function(S){return S.copy(xe)},this.setScissor=function(S,N,q,K){S.isVector4?xe.set(S.x,S.y,S.z,S.w):xe.set(S,N,q,K),Re.scissor(z.copy(xe).multiplyScalar(B).round())},this.getScissorTest=function(){return pe},this.setScissorTest=function(S){Re.setScissorTest(pe=S)},this.setOpaqueSort=function(S){te=S},this.setTransparentSort=function(S){re=S},this.getClearColor=function(S){return S.copy(Le.getClearColor())},this.setClearColor=function(){Le.setClearColor(...arguments)},this.getClearAlpha=function(){return Le.getClearAlpha()},this.setClearAlpha=function(){Le.setClearAlpha(...arguments)},this.clear=function(S=!0,N=!0,q=!0){let K=0;if(S){let k=!1;if(C!==null){let me=C.texture.format;k=me===Po||me===Co||me===Ao}if(k){let me=C.texture.type,Se=me===Ln||me===ui||me===as||me===ls||me===bo||me===Ro,Be=Le.getClearColor(),Fe=Le.getClearAlpha(),Ze=Be.r,Ye=Be.g,Xe=Be.b;Se?(g[0]=Ze,g[1]=Ye,g[2]=Xe,g[3]=Fe,L.clearBufferuiv(L.COLOR,0,g)):(m[0]=Ze,m[1]=Ye,m[2]=Xe,m[3]=Fe,L.clearBufferiv(L.COLOR,0,m))}else K|=L.COLOR_BUFFER_BIT}N&&(K|=L.DEPTH_BUFFER_BIT),q&&(K|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(K)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",de,!1),t.removeEventListener("webglcontextrestored",Pe,!1),t.removeEventListener("webglcontextcreationerror",Te,!1),Le.dispose(),ce.dispose(),Ue.dispose(),Ae.dispose(),T.dispose(),V.dispose(),$.dispose(),tt.dispose(),O.dispose(),Me.dispose(),ie.dispose(),ie.removeEventListener("sessionstart",pi),ie.removeEventListener("sessionend",An),rn.stop()};function de(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function Pe(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let S=ze.autoReset,N=Ee.enabled,q=Ee.autoUpdate,K=Ee.needsUpdate,k=Ee.type;_e(),ze.autoReset=S,Ee.enabled=N,Ee.autoUpdate=q,Ee.needsUpdate=K,Ee.type=k}function Te(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function $e(S){let N=S.target;N.removeEventListener("dispose",$e),ft(N)}function ft(S){yt(S),Ae.remove(S)}function yt(S){let N=Ae.get(S).programs;N!==void 0&&(N.forEach(function(q){Me.releaseProgram(q)}),S.isShaderMaterial&&Me.releaseShaderCache(S))}this.renderBufferDirect=function(S,N,q,K,k,me){N===null&&(N=fe);let Se=k.isMesh&&k.matrixWorld.determinant()<0,Be=Jt(S,N,q,K,k);Re.setMaterial(K,Se);let Fe=q.index,Ze=1;if(K.wireframe===!0){if(Fe=ae.getWireframeAttribute(q),Fe===void 0)return;Ze=2}let Ye=q.drawRange,Xe=q.attributes.position,lt=Ye.start*Ze,mt=(Ye.start+Ye.count)*Ze;me!==null&&(lt=Math.max(lt,me.start*Ze),mt=Math.min(mt,(me.start+me.count)*Ze)),Fe!==null?(lt=Math.max(lt,0),mt=Math.min(mt,Fe.count)):Xe!=null&&(lt=Math.max(lt,0),mt=Math.min(mt,Xe.count));let It=mt-lt;if(It<0||It===1/0)return;tt.setup(k,K,Be,q,Fe);let wt,ut=ve;if(Fe!==null&&(wt=Q.get(Fe),ut=Ke,ut.setIndex(wt)),k.isMesh)K.wireframe===!0?(Re.setLineWidth(K.wireframeLinewidth*Oe()),ut.setMode(L.LINES)):ut.setMode(L.TRIANGLES);else if(k.isLine){let qe=K.linewidth;qe===void 0&&(qe=1),Re.setLineWidth(qe*Oe()),k.isLineSegments?ut.setMode(L.LINES):k.isLineLoop?ut.setMode(L.LINE_LOOP):ut.setMode(L.LINE_STRIP)}else k.isPoints?ut.setMode(L.POINTS):k.isSprite&&ut.setMode(L.TRIANGLES);if(k.isBatchedMesh)if(k._multiDrawInstances!==null)or("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),ut.renderMultiDrawInstances(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount,k._multiDrawInstances);else if(Ce.get("WEBGL_multi_draw"))ut.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let qe=k._multiDrawStarts,Gt=k._multiDrawCounts,gt=k._multiDrawCount,vn=Fe?Q.get(Fe).bytesPerElement:1,Fi=Ae.get(K).currentProgram.getUniforms();for(let an=0;an<gt;an++)Fi.setValue(L,"_gl_DrawID",an),ut.render(qe[an]/vn,Gt[an])}else if(k.isInstancedMesh)ut.renderInstances(lt,It,k.count);else if(q.isInstancedBufferGeometry){let qe=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Gt=Math.min(q.instanceCount,qe);ut.renderInstances(lt,It,Gt)}else ut.render(lt,It)};function at(S,N,q){S.transparent===!0&&S.side===xt&&S.forceSinglePass===!1?(S.side=Wt,S.needsUpdate=!0,vt(S,N,q),S.side=Vn,S.needsUpdate=!0,vt(S,N,q),S.side=xt):vt(S,N,q)}this.compile=function(S,N,q=null){q===null&&(q=S),d=Ue.get(q),d.init(N),M.push(d),q.traverseVisible(function(k){k.isLight&&k.layers.test(N.layers)&&(d.pushLight(k),k.castShadow&&d.pushShadow(k))}),S!==q&&S.traverseVisible(function(k){k.isLight&&k.layers.test(N.layers)&&(d.pushLight(k),k.castShadow&&d.pushShadow(k))}),d.setupLights();let K=new Set;return S.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let me=k.material;if(me)if(Array.isArray(me))for(let Se=0;Se<me.length;Se++){let Be=me[Se];at(Be,q,k),K.add(Be)}else at(me,q,k),K.add(me)}),d=M.pop(),K},this.compileAsync=function(S,N,q=null){let K=this.compile(S,N,q);return new Promise(k=>{function me(){if(K.forEach(function(Se){Ae.get(Se).currentProgram.isReady()&&K.delete(Se)}),K.size===0){k(S);return}setTimeout(me,10)}Ce.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let Xt=null;function Nt(S){Xt&&Xt(S)}function pi(){rn.stop()}function An(){rn.start()}let rn=new Ch;rn.setAnimationLoop(Nt),typeof self<"u"&&rn.setContext(self),this.setAnimationLoop=function(S){Xt=S,ie.setAnimationLoop(S),S===null?rn.stop():rn.start()},ie.addEventListener("sessionstart",pi),ie.addEventListener("sessionend",An),this.render=function(S,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),ie.enabled===!0&&ie.isPresenting===!0&&(ie.cameraAutoUpdate===!0&&ie.updateCamera(N),N=ie.getCamera()),S.isScene===!0&&S.onBeforeRender(x,S,N,C),d=Ue.get(S,M.length),d.init(N),M.push(d),X.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),W.setFromProjectionMatrix(X),ee=this.localClippingEnabled,ue=he.init(this.clippingPlanes,ee),E=ce.get(S,_.length),E.init(),_.push(E),ie.enabled===!0&&ie.isPresenting===!0){let me=x.xr.getDepthSensingMesh();me!==null&&yn(me,N,-1/0,x.sortObjects)}yn(S,N,0,x.sortObjects),E.finish(),x.sortObjects===!0&&E.sort(te,re),we=ie.enabled===!1||ie.isPresenting===!1||ie.hasDepthSensing()===!1,we&&Le.addToRenderList(E,S),this.info.render.frame++,ue===!0&&he.beginShadows();let q=d.state.shadowsArray;Ee.render(q,S,N),ue===!0&&he.endShadows(),this.info.autoReset===!0&&this.info.reset();let K=E.opaque,k=E.transmissive;if(d.setupLights(),N.isArrayCamera){let me=N.cameras;if(k.length>0)for(let Se=0,Be=me.length;Se<Be;Se++){let Fe=me[Se];Cn(K,k,S,Fe)}we&&Le.render(S);for(let Se=0,Be=me.length;Se<Be;Se++){let Fe=me[Se];on(E,S,Fe,Fe.viewport)}}else k.length>0&&Cn(K,k,S,N),we&&Le.render(S),on(E,S,N);C!==null&&A===0&&(P.updateMultisampleRenderTarget(C),P.updateRenderTargetMipmap(C)),S.isScene===!0&&S.onAfterRender(x,S,N),tt.resetDefaultState(),w=-1,v=null,M.pop(),M.length>0?(d=M[M.length-1],ue===!0&&he.setGlobalState(x.clippingPlanes,d.state.camera)):d=null,_.pop(),_.length>0?E=_[_.length-1]:E=null};function yn(S,N,q,K){if(S.visible===!1)return;if(S.layers.test(N.layers)){if(S.isGroup)q=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(N);else if(S.isLight)d.pushLight(S),S.castShadow&&d.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||W.intersectsSprite(S)){K&&D.setFromMatrixPosition(S.matrixWorld).applyMatrix4(X);let Se=$.update(S),Be=S.material;Be.visible&&E.push(S,Se,Be,q,D.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||W.intersectsObject(S))){let Se=$.update(S),Be=S.material;if(K&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),D.copy(S.boundingSphere.center)):(Se.boundingSphere===null&&Se.computeBoundingSphere(),D.copy(Se.boundingSphere.center)),D.applyMatrix4(S.matrixWorld).applyMatrix4(X)),Array.isArray(Be)){let Fe=Se.groups;for(let Ze=0,Ye=Fe.length;Ze<Ye;Ze++){let Xe=Fe[Ze],lt=Be[Xe.materialIndex];lt&&lt.visible&&E.push(S,Se,lt,q,D.z,Xe)}}else Be.visible&&E.push(S,Se,Be,q,D.z,null)}}let me=S.children;for(let Se=0,Be=me.length;Se<Be;Se++)yn(me[Se],N,q,K)}function on(S,N,q,K){let k=S.opaque,me=S.transmissive,Se=S.transparent;d.setupLightsView(q),ue===!0&&he.setGlobalState(x.clippingPlanes,q),K&&Re.viewport(H.copy(K)),k.length>0&&Mn(k,N,q),me.length>0&&Mn(me,N,q),Se.length>0&&Mn(Se,N,q),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function Cn(S,N,q,K){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;d.state.transmissionRenderTarget[K.id]===void 0&&(d.state.transmissionRenderTarget[K.id]=new En(1,1,{generateMipmaps:!0,type:Ce.has("EXT_color_buffer_half_float")||Ce.has("EXT_color_buffer_float")?di:Ln,minFilter:hi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ht.workingColorSpace}));let me=d.state.transmissionRenderTarget[K.id],Se=K.viewport||H;me.setSize(Se.z*x.transmissionResolutionScale,Se.w*x.transmissionResolutionScale);let Be=x.getRenderTarget();x.setRenderTarget(me),x.getClearColor(J),Y=x.getClearAlpha(),Y<1&&x.setClearColor(16777215,.5),x.clear(),we&&Le.render(q);let Fe=x.toneMapping;x.toneMapping=qn;let Ze=K.viewport;if(K.viewport!==void 0&&(K.viewport=void 0),d.setupLightsView(K),ue===!0&&he.setGlobalState(x.clippingPlanes,K),Mn(S,q,K),P.updateMultisampleRenderTarget(me),P.updateRenderTargetMipmap(me),Ce.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let Xe=0,lt=N.length;Xe<lt;Xe++){let mt=N[Xe],It=mt.object,wt=mt.geometry,ut=mt.material,qe=mt.group;if(ut.side===xt&&It.layers.test(K.layers)){let Gt=ut.side;ut.side=Wt,ut.needsUpdate=!0,Ct(It,q,K,wt,ut,qe),ut.side=Gt,ut.needsUpdate=!0,Ye=!0}}Ye===!0&&(P.updateMultisampleRenderTarget(me),P.updateRenderTargetMipmap(me))}x.setRenderTarget(Be),x.setClearColor(J,Y),Ze!==void 0&&(K.viewport=Ze),x.toneMapping=Fe}function Mn(S,N,q){let K=N.isScene===!0?N.overrideMaterial:null;for(let k=0,me=S.length;k<me;k++){let Se=S[k],Be=Se.object,Fe=Se.geometry,Ze=Se.group,Ye=Se.material;Ye.allowOverride===!0&&K!==null&&(Ye=K),Be.layers.test(q.layers)&&Ct(Be,N,q,Fe,Ye,Ze)}}function Ct(S,N,q,K,k,me){S.onBeforeRender(x,N,q,K,k,me),S.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),k.onBeforeRender(x,N,q,K,S,me),k.transparent===!0&&k.side===xt&&k.forceSinglePass===!1?(k.side=Wt,k.needsUpdate=!0,x.renderBufferDirect(q,N,K,k,S,me),k.side=Vn,k.needsUpdate=!0,x.renderBufferDirect(q,N,K,k,S,me),k.side=xt):x.renderBufferDirect(q,N,K,k,S,me),S.onAfterRender(x,N,q,K,k,me)}function vt(S,N,q){N.isScene!==!0&&(N=fe);let K=Ae.get(S),k=d.state.lights,me=d.state.shadowsArray,Se=k.state.version,Be=Me.getParameters(S,k.state,me,N,q),Fe=Me.getProgramCacheKey(Be),Ze=K.programs;K.environment=S.isMeshStandardMaterial?N.environment:null,K.fog=N.fog,K.envMap=(S.isMeshStandardMaterial?V:T).get(S.envMap||K.environment),K.envMapRotation=K.environment!==null&&S.envMap===null?N.environmentRotation:S.envMapRotation,Ze===void 0&&(S.addEventListener("dispose",$e),Ze=new Map,K.programs=Ze);let Ye=Ze.get(Fe);if(Ye!==void 0){if(K.currentProgram===Ye&&K.lightsStateVersion===Se)return st(S,Be),Ye}else Be.uniforms=Me.getUniforms(S),S.onBeforeCompile(Be,x),Ye=Me.acquireProgram(Be,Fe),Ze.set(Fe,Ye),K.uniforms=Be.uniforms;let Xe=K.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Xe.clippingPlanes=he.uniform),st(S,Be),K.needsLights=_n(S),K.lightsStateVersion=Se,K.needsLights&&(Xe.ambientLightColor.value=k.state.ambient,Xe.lightProbe.value=k.state.probe,Xe.directionalLights.value=k.state.directional,Xe.directionalLightShadows.value=k.state.directionalShadow,Xe.spotLights.value=k.state.spot,Xe.spotLightShadows.value=k.state.spotShadow,Xe.rectAreaLights.value=k.state.rectArea,Xe.ltc_1.value=k.state.rectAreaLTC1,Xe.ltc_2.value=k.state.rectAreaLTC2,Xe.pointLights.value=k.state.point,Xe.pointLightShadows.value=k.state.pointShadow,Xe.hemisphereLights.value=k.state.hemi,Xe.directionalShadowMap.value=k.state.directionalShadowMap,Xe.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Xe.spotShadowMap.value=k.state.spotShadowMap,Xe.spotLightMatrix.value=k.state.spotLightMatrix,Xe.spotLightMap.value=k.state.spotLightMap,Xe.pointShadowMap.value=k.state.pointShadowMap,Xe.pointShadowMatrix.value=k.state.pointShadowMatrix),K.currentProgram=Ye,K.uniformsList=null,Ye}function Ge(S){if(S.uniformsList===null){let N=S.currentProgram.getUniforms();S.uniformsList=ds.seqWithValue(N.seq,S.uniforms)}return S.uniformsList}function st(S,N){let q=Ae.get(S);q.outputColorSpace=N.outputColorSpace,q.batching=N.batching,q.batchingColor=N.batchingColor,q.instancing=N.instancing,q.instancingColor=N.instancingColor,q.instancingMorph=N.instancingMorph,q.skinning=N.skinning,q.morphTargets=N.morphTargets,q.morphNormals=N.morphNormals,q.morphColors=N.morphColors,q.morphTargetsCount=N.morphTargetsCount,q.numClippingPlanes=N.numClippingPlanes,q.numIntersection=N.numClipIntersection,q.vertexAlphas=N.vertexAlphas,q.vertexTangents=N.vertexTangents,q.toneMapping=N.toneMapping}function Jt(S,N,q,K,k){N.isScene!==!0&&(N=fe),P.resetTextureUnits();let me=N.fog,Se=K.isMeshStandardMaterial?N.environment:null,Be=C===null?x.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:wi,Fe=(K.isMeshStandardMaterial?V:T).get(K.envMap||Se),Ze=K.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Ye=!!q.attributes.tangent&&(!!K.normalMap||K.anisotropy>0),Xe=!!q.morphAttributes.position,lt=!!q.morphAttributes.normal,mt=!!q.morphAttributes.color,It=qn;K.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(It=x.toneMapping);let wt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ut=wt!==void 0?wt.length:0,qe=Ae.get(K),Gt=d.state.lights;if(ue===!0&&(ee===!0||S!==v)){let Kt=S===v&&K.id===w;he.setState(K,S,Kt)}let gt=!1;K.version===qe.__version?(qe.needsLights&&qe.lightsStateVersion!==Gt.state.version||qe.outputColorSpace!==Be||k.isBatchedMesh&&qe.batching===!1||!k.isBatchedMesh&&qe.batching===!0||k.isBatchedMesh&&qe.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&qe.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&qe.instancing===!1||!k.isInstancedMesh&&qe.instancing===!0||k.isSkinnedMesh&&qe.skinning===!1||!k.isSkinnedMesh&&qe.skinning===!0||k.isInstancedMesh&&qe.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&qe.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&qe.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&qe.instancingMorph===!1&&k.morphTexture!==null||qe.envMap!==Fe||K.fog===!0&&qe.fog!==me||qe.numClippingPlanes!==void 0&&(qe.numClippingPlanes!==he.numPlanes||qe.numIntersection!==he.numIntersection)||qe.vertexAlphas!==Ze||qe.vertexTangents!==Ye||qe.morphTargets!==Xe||qe.morphNormals!==lt||qe.morphColors!==mt||qe.toneMapping!==It||qe.morphTargetsCount!==ut)&&(gt=!0):(gt=!0,qe.__version=K.version);let vn=qe.currentProgram;gt===!0&&(vn=vt(K,N,k));let Fi=!1,an=!1,ms=!1,_t=vn.getUniforms(),fn=qe.uniforms;if(Re.useProgram(vn.program)&&(Fi=!0,an=!0,ms=!0),K.id!==w&&(w=K.id,an=!0),Fi||v!==S){Re.buffers.depth.getReversed()?(le.copy(S.projectionMatrix),nh(le),ih(le),_t.setValue(L,"projectionMatrix",le)):_t.setValue(L,"projectionMatrix",S.projectionMatrix),_t.setValue(L,"viewMatrix",S.matrixWorldInverse);let jt=_t.map.cameraPosition;jt!==void 0&&jt.setValue(L,U.setFromMatrixPosition(S.matrixWorld)),Je.logarithmicDepthBuffer&&_t.setValue(L,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(K.isMeshPhongMaterial||K.isMeshToonMaterial||K.isMeshLambertMaterial||K.isMeshBasicMaterial||K.isMeshStandardMaterial||K.isShaderMaterial)&&_t.setValue(L,"isOrthographic",S.isOrthographicCamera===!0),v!==S&&(v=S,an=!0,ms=!0)}if(k.isSkinnedMesh){_t.setOptional(L,k,"bindMatrix"),_t.setOptional(L,k,"bindMatrixInverse");let Kt=k.skeleton;Kt&&(Kt.boneTexture===null&&Kt.computeBoneTexture(),_t.setValue(L,"boneTexture",Kt.boneTexture,P))}k.isBatchedMesh&&(_t.setOptional(L,k,"batchingTexture"),_t.setValue(L,"batchingTexture",k._matricesTexture,P),_t.setOptional(L,k,"batchingIdTexture"),_t.setValue(L,"batchingIdTexture",k._indirectTexture,P),_t.setOptional(L,k,"batchingColorTexture"),k._colorsTexture!==null&&_t.setValue(L,"batchingColorTexture",k._colorsTexture,P));let pn=q.morphAttributes;if((pn.position!==void 0||pn.normal!==void 0||pn.color!==void 0)&&Ne.update(k,q,vn),(an||qe.receiveShadow!==k.receiveShadow)&&(qe.receiveShadow=k.receiveShadow,_t.setValue(L,"receiveShadow",k.receiveShadow)),K.isMeshGouraudMaterial&&K.envMap!==null&&(fn.envMap.value=Fe,fn.flipEnvMap.value=Fe.isCubeTexture&&Fe.isRenderTargetTexture===!1?-1:1),K.isMeshStandardMaterial&&K.envMap===null&&N.environment!==null&&(fn.envMapIntensity.value=N.environmentIntensity),an&&(_t.setValue(L,"toneMappingExposure",x.toneMappingExposure),qe.needsLights&&dn(fn,ms),me&&K.fog===!0&&ne.refreshFogUniforms(fn,me),ne.refreshMaterialUniforms(fn,K,B,se,d.state.transmissionRenderTarget[S.id]),ds.upload(L,Ge(qe),fn,P)),K.isShaderMaterial&&K.uniformsNeedUpdate===!0&&(ds.upload(L,Ge(qe),fn,P),K.uniformsNeedUpdate=!1),K.isSpriteMaterial&&_t.setValue(L,"center",k.center),_t.setValue(L,"modelViewMatrix",k.modelViewMatrix),_t.setValue(L,"normalMatrix",k.normalMatrix),_t.setValue(L,"modelMatrix",k.matrixWorld),K.isShaderMaterial||K.isRawShaderMaterial){let Kt=K.uniformsGroups;for(let jt=0,da=Kt.length;jt<da;jt++){let mi=Kt[jt];O.update(mi,vn),O.bind(mi,vn)}}return vn}function dn(S,N){S.ambientLightColor.needsUpdate=N,S.lightProbe.needsUpdate=N,S.directionalLights.needsUpdate=N,S.directionalLightShadows.needsUpdate=N,S.pointLights.needsUpdate=N,S.pointLightShadows.needsUpdate=N,S.spotLights.needsUpdate=N,S.spotLightShadows.needsUpdate=N,S.rectAreaLights.needsUpdate=N,S.hemisphereLights.needsUpdate=N}function _n(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(S,N,q){let K=Ae.get(S);K.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,K.__autoAllocateDepthBuffer===!1&&(K.__useRenderToTexture=!1),Ae.get(S.texture).__webglTexture=N,Ae.get(S.depthTexture).__webglTexture=K.__autoAllocateDepthBuffer?void 0:q,K.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,N){let q=Ae.get(S);q.__webglFramebuffer=N,q.__useDefaultFramebuffer=N===void 0};let Rt=L.createFramebuffer();this.setRenderTarget=function(S,N=0,q=0){C=S,R=N,A=q;let K=!0,k=null,me=!1,Se=!1;if(S){let Fe=Ae.get(S);if(Fe.__useDefaultFramebuffer!==void 0)Re.bindFramebuffer(L.FRAMEBUFFER,null),K=!1;else if(Fe.__webglFramebuffer===void 0)P.setupRenderTarget(S);else if(Fe.__hasExternalTextures)P.rebindTextures(S,Ae.get(S.texture).__webglTexture,Ae.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Xe=S.depthTexture;if(Fe.__boundDepthTexture!==Xe){if(Xe!==null&&Ae.has(Xe)&&(S.width!==Xe.image.width||S.height!==Xe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");P.setupDepthRenderbuffer(S)}}let Ze=S.texture;(Ze.isData3DTexture||Ze.isDataArrayTexture||Ze.isCompressedArrayTexture)&&(Se=!0);let Ye=Ae.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Ye[N])?k=Ye[N][q]:k=Ye[N],me=!0):S.samples>0&&P.useMultisampledRTT(S)===!1?k=Ae.get(S).__webglMultisampledFramebuffer:Array.isArray(Ye)?k=Ye[q]:k=Ye,H.copy(S.viewport),z.copy(S.scissor),G=S.scissorTest}else H.copy(j).multiplyScalar(B).floor(),z.copy(xe).multiplyScalar(B).floor(),G=pe;if(q!==0&&(k=Rt),Re.bindFramebuffer(L.FRAMEBUFFER,k)&&K&&Re.drawBuffers(S,k),Re.viewport(H),Re.scissor(z),Re.setScissorTest(G),me){let Fe=Ae.get(S.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+N,Fe.__webglTexture,q)}else if(Se){let Fe=Ae.get(S.texture),Ze=N;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,Fe.__webglTexture,q,Ze)}else if(S!==null&&q!==0){let Fe=Ae.get(S.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Fe.__webglTexture,q)}w=-1},this.readRenderTargetPixels=function(S,N,q,K,k,me,Se){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Be=Ae.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Se!==void 0&&(Be=Be[Se]),Be){Re.bindFramebuffer(L.FRAMEBUFFER,Be);try{let Fe=S.texture,Ze=Fe.format,Ye=Fe.type;if(!Je.textureFormatReadable(Ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Je.textureTypeReadable(Ye)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=S.width-K&&q>=0&&q<=S.height-k&&L.readPixels(N,q,K,k,We.convert(Ze),We.convert(Ye),me)}finally{let Fe=C!==null?Ae.get(C).__webglFramebuffer:null;Re.bindFramebuffer(L.FRAMEBUFFER,Fe)}}},this.readRenderTargetPixelsAsync=async function(S,N,q,K,k,me,Se){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Be=Ae.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Se!==void 0&&(Be=Be[Se]),Be)if(N>=0&&N<=S.width-K&&q>=0&&q<=S.height-k){Re.bindFramebuffer(L.FRAMEBUFFER,Be);let Fe=S.texture,Ze=Fe.format,Ye=Fe.type;if(!Je.textureFormatReadable(Ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Je.textureTypeReadable(Ye))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Xe=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Xe),L.bufferData(L.PIXEL_PACK_BUFFER,me.byteLength,L.STREAM_READ),L.readPixels(N,q,K,k,We.convert(Ze),We.convert(Ye),0);let lt=C!==null?Ae.get(C).__webglFramebuffer:null;Re.bindFramebuffer(L.FRAMEBUFFER,lt);let mt=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await th(L,mt,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Xe),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,me),L.deleteBuffer(Xe),L.deleteSync(mt),me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,N=null,q=0){let K=Math.pow(2,-q),k=Math.floor(S.image.width*K),me=Math.floor(S.image.height*K),Se=N!==null?N.x:0,Be=N!==null?N.y:0;P.setTexture2D(S,0),L.copyTexSubImage2D(L.TEXTURE_2D,q,0,0,Se,Be,k,me),Re.unbindTexture()};let Ve=L.createFramebuffer(),Pt=L.createFramebuffer();this.copyTextureToTexture=function(S,N,q=null,K=null,k=0,me=null){me===null&&(k!==0?(or("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),me=k,k=0):me=0);let Se,Be,Fe,Ze,Ye,Xe,lt,mt,It,wt=S.isCompressedTexture?S.mipmaps[me]:S.image;if(q!==null)Se=q.max.x-q.min.x,Be=q.max.y-q.min.y,Fe=q.isBox3?q.max.z-q.min.z:1,Ze=q.min.x,Ye=q.min.y,Xe=q.isBox3?q.min.z:0;else{let pn=Math.pow(2,-k);Se=Math.floor(wt.width*pn),Be=Math.floor(wt.height*pn),S.isDataArrayTexture?Fe=wt.depth:S.isData3DTexture?Fe=Math.floor(wt.depth*pn):Fe=1,Ze=0,Ye=0,Xe=0}K!==null?(lt=K.x,mt=K.y,It=K.z):(lt=0,mt=0,It=0);let ut=We.convert(N.format),qe=We.convert(N.type),Gt;N.isData3DTexture?(P.setTexture3D(N,0),Gt=L.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(P.setTexture2DArray(N,0),Gt=L.TEXTURE_2D_ARRAY):(P.setTexture2D(N,0),Gt=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,N.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,N.unpackAlignment);let gt=L.getParameter(L.UNPACK_ROW_LENGTH),vn=L.getParameter(L.UNPACK_IMAGE_HEIGHT),Fi=L.getParameter(L.UNPACK_SKIP_PIXELS),an=L.getParameter(L.UNPACK_SKIP_ROWS),ms=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,wt.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,wt.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Ze),L.pixelStorei(L.UNPACK_SKIP_ROWS,Ye),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Xe);let _t=S.isDataArrayTexture||S.isData3DTexture,fn=N.isDataArrayTexture||N.isData3DTexture;if(S.isDepthTexture){let pn=Ae.get(S),Kt=Ae.get(N),jt=Ae.get(pn.__renderTarget),da=Ae.get(Kt.__renderTarget);Re.bindFramebuffer(L.READ_FRAMEBUFFER,jt.__webglFramebuffer),Re.bindFramebuffer(L.DRAW_FRAMEBUFFER,da.__webglFramebuffer);for(let mi=0;mi<Fe;mi++)_t&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Ae.get(S).__webglTexture,k,Xe+mi),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Ae.get(N).__webglTexture,me,It+mi)),L.blitFramebuffer(Ze,Ye,Se,Be,lt,mt,Se,Be,L.DEPTH_BUFFER_BIT,L.NEAREST);Re.bindFramebuffer(L.READ_FRAMEBUFFER,null),Re.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(k!==0||S.isRenderTargetTexture||Ae.has(S)){let pn=Ae.get(S),Kt=Ae.get(N);Re.bindFramebuffer(L.READ_FRAMEBUFFER,Ve),Re.bindFramebuffer(L.DRAW_FRAMEBUFFER,Pt);for(let jt=0;jt<Fe;jt++)_t?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,pn.__webglTexture,k,Xe+jt):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,pn.__webglTexture,k),fn?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Kt.__webglTexture,me,It+jt):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Kt.__webglTexture,me),k!==0?L.blitFramebuffer(Ze,Ye,Se,Be,lt,mt,Se,Be,L.COLOR_BUFFER_BIT,L.NEAREST):fn?L.copyTexSubImage3D(Gt,me,lt,mt,It+jt,Ze,Ye,Se,Be):L.copyTexSubImage2D(Gt,me,lt,mt,Ze,Ye,Se,Be);Re.bindFramebuffer(L.READ_FRAMEBUFFER,null),Re.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else fn?S.isDataTexture||S.isData3DTexture?L.texSubImage3D(Gt,me,lt,mt,It,Se,Be,Fe,ut,qe,wt.data):N.isCompressedArrayTexture?L.compressedTexSubImage3D(Gt,me,lt,mt,It,Se,Be,Fe,ut,wt.data):L.texSubImage3D(Gt,me,lt,mt,It,Se,Be,Fe,ut,qe,wt):S.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,me,lt,mt,Se,Be,ut,qe,wt.data):S.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,me,lt,mt,wt.width,wt.height,ut,wt.data):L.texSubImage2D(L.TEXTURE_2D,me,lt,mt,Se,Be,ut,qe,wt);L.pixelStorei(L.UNPACK_ROW_LENGTH,gt),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,vn),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Fi),L.pixelStorei(L.UNPACK_SKIP_ROWS,an),L.pixelStorei(L.UNPACK_SKIP_IMAGES,ms),me===0&&N.generateMipmaps&&L.generateMipmap(Gt),Re.unbindTexture()},this.copyTextureToTexture3D=function(S,N,q=null,K=null,k=0){return or('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(S,N,q,K,k)},this.initRenderTarget=function(S){Ae.get(S).__webglFramebuffer===void 0&&P.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?P.setTextureCube(S,0):S.isData3DTexture?P.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?P.setTexture2DArray(S,0):P.setTexture2D(S,0),Re.unbindTexture()},this.resetState=function(){R=0,A=0,C=null,Re.reset(),tt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ht._getDrawingBufferColorSpace(e),t.unpackColorSpace=ht._getUnpackColorSpace()}};var Nl={punching:{rate:2.2,impact:.35},kicking:{rate:1.6,impact:.4}};function Jn(n,e){let{rate:t,impact:i}=Nl[e],s=(n*t%1+1)%1,r=s<i?1-Math.pow(1-s/i,3):Math.max(0,1-(s-i)/(1-i))**2,o=s>=i?Math.exp(-(s-i)*9):0;return{extend:r,recoil:o}}function Ol(n,e,t){let i=new ge;i.position.set(0,-.24,.05),n.add(i);let s=new ge;s.position.set(0,-.24,.05),e.add(s);let r=new ge;r.visible=!1;let o=new F({color:16317180,roughness:.65,side:xt}),a=new F({color:14427686,roughness:.55}),l=new y(new be(.18,.34,.44,18,1,!1,-Math.PI*.65,Math.PI*1.3),o);l.position.set(0,.36,.03),l.castShadow=!0,r.add(l);let c=new y(new Qe(.165,.025,8,20),a);c.rotation.x=Math.PI/2+.14,c.position.set(0,.57,.02),r.add(c),t.add(r);let h=new ge;h.visible=!1;let u=new F({color:16708551,roughness:.88}),p=new F({color:165063,roughness:.72}),f=new y(new Qe(.142,.022,8,20),u);f.rotation.x=Math.PI/2+.22,f.position.set(0,.505,-.01),h.add(f);let g=new y(new be(.165,.255,.34,14,1,!1,-Math.PI*.45,Math.PI*.9),u);g.position.set(0,.35,.03),g.rotation.y=Math.PI*.02,h.add(g);for(let Ct of[-.095,.095]){let vt=new y(new oe(.072,.19,.014),u);vt.position.set(Ct,.34,.145),vt.rotation.x=-.16,vt.rotation.z=Ct<0?.18:-.18,h.add(vt);let Ge=new y(new oe(.074,.024,.016),p);Ge.position.set(Ct*1.06,.245,.16),Ge.rotation.x=-.16,Ge.rotation.z=Ct<0?.18:-.18,h.add(Ge)}t.add(h);let m=new F({color:14870768,metalness:.9,roughness:.14}),E=new F({color:7877903,roughness:.52}),d=new F({color:16096779,metalness:.85,roughness:.22}),_=new F({color:14427686,roughness:.38}),M=new F({color:959977,roughness:.35}),x=new F({color:1976635,roughness:.45}),b={},R=new F({color:16317180,metalness:.72,roughness:.16,emissive:3359061,emissiveIntensity:.35}),A=new ge,C=new ge,w=new y(new oe(.042,.32,.016),R);w.position.set(0,.16,0),C.add(w);let v=new y(new Qe(.048,.014,8,16),_);v.position.set(-.028,-.06,0),C.add(v),A.add(C);let H=new ge,z=new y(new oe(.042,.32,.016),R);z.position.set(0,.16,.008),H.add(z);let G=new y(new Qe(.048,.014,8,16),_);G.position.set(.028,-.06,.008),H.add(G),A.add(H);let J=new y(new be(.018,.018,.032,10),d);J.rotation.x=Math.PI/2,J.position.set(0,.02,.004),A.add(J),A.rotation.x=Math.PI*1.16,A.visible=!1,i.add(A),b.scissors=A;let Y=()=>{let Ct=new ge,vt=new y(new oe(.028,.22,.016),M);vt.position.set(0,.1,0),Ct.add(vt);for(let Ge=-3;Ge<=3;Ge++){let st=new y(new oe(.042,.012,.012),M);st.position.set(.024,.1+Ge*.026,0),Ct.add(st)}return Ct},Z=Y();Z.rotation.x=Math.PI*1.12,Z.visible=!1,i.add(Z),b.comb=Z;let se=Y();se.rotation.x=Math.PI*1.12,se.visible=!1,s.add(se);let B=new ge,te=new y(new Qe(.055,.014,8,16),d);te.position.y=.03,B.add(te);let re=new y(new be(.014,.014,.22,8),d);re.position.y=.16,B.add(re);let j=new y(new oe(.055,.045,.016),d);j.position.set(.032,.24,0),B.add(j),B.rotation.x=Math.PI*.35,B.visible=!1,i.add(B),b.key=B;let xe=new ge,pe=new y(new oe(.11,.2,.018),x);pe.position.set(0,.08,.02),xe.add(pe);let W=new ke({color:3718648}),ue=new y(new rt(.09,.16),W);ue.position.set(0,.08,.03),xe.add(ue),xe.visible=!1,i.add(xe),b.phone=xe;let ee=new ge,le=new y(new be(.018,.02,.28,10),E);le.position.y=.14,ee.add(le);let X=new y(new be(.052,.052,.16,12),E);X.rotation.z=Math.PI/2,X.position.y=.26,ee.add(X);let U=new y(new be(.055,.055,.03,12),d);U.rotation.z=Math.PI/2,U.position.y=.26,ee.add(U),ee.rotation.x=Math.PI*.42,ee.visible=!1,i.add(ee),b.gavel=ee;let D=new ge,fe=new y(new be(.02,.016,.22,10),x);fe.position.y=.11,D.add(fe);let we=new y(new Ie(.048,12,10),m);we.position.y=.23,D.add(we),D.rotation.x=Math.PI*.25,D.visible=!1,i.add(D),b.mic=D;let Oe=new ge,L=new y(new be(.068,.048,.11,14),new F({color:14251782,roughness:.72}));L.position.y=.06,Oe.add(L);let ct=new y(new Lt(.058,12),new F({color:11817737,roughness:.25}));ct.rotation.x=-Math.PI/2,ct.position.y=.112,Oe.add(ct),Oe.visible=!1,i.add(Oe),b.teacup=Oe;let Ce=new ge,Je=new y(new be(.014,.014,.36,8),m);Je.position.y=.18,Ce.add(Je);let Re=new y(new Ie(.065,12,8,0,Math.PI*2,0,Math.PI*.55),m);Re.rotation.x=Math.PI,Re.position.set(0,.36,.03),Ce.add(Re),Ce.rotation.x=Math.PI*.35,Ce.visible=!1,i.add(Ce),b.ladle=Ce;let ze=new ge,Ae=new y(new Qe(.08,.012,8,16,Math.PI*1.4),x);Ae.position.y=.12,ze.add(Ae);let P=new y(new be(.045,.045,.025,12),m);P.rotation.x=Math.PI/2,P.position.set(0,.22,.03),ze.add(P),ze.visible=!1,i.add(ze),b.stethoscope=ze;let T=new ge,V=new y(new be(.038,.038,.22,12),M);V.position.y=.14,T.add(V);let Q=new y(new ot(.012,.12,8),m);Q.position.y=.31,T.add(Q),T.rotation.x=Math.PI*.45,T.visible=!1,i.add(T),b.syringe=T;let ae=new ge,$=new y(new ot(.085,.055,14),d);$.rotation.x=Math.PI,$.position.y=.04,ae.add($);let Me=new y(new ot(.025,.08,10),new ke({color:16707722}));Me.position.y=.1,ae.add(Me),ae.visible=!1,i.add(ae),b.diya=ae;let ne=new ge,ce=new y(new be(.018,.018,.46,10),d);ce.rotation.z=Math.PI/2,ce.position.set(.14,.04,.04),ne.add(ce),ne.visible=!1,i.add(ne),b.flute=ne;let Ue=new ge,he=new y(new oe(.18,.24,.045),_);he.position.set(0,.1,.04),Ue.add(he);let Ee=new y(new oe(.16,.22,.036),new F({color:16710888}));Ee.position.set(.01,.1,.04),Ue.add(Ee),Ue.visible=!1,i.add(Ue),b.book=Ue;let Le=new ge,Ne=new y(new be(.018,.022,.56,10),E);Ne.position.y=.28,Le.add(Ne),Le.rotation.x=Math.PI*.25,Le.visible=!1,i.add(Le),b.baton=Le;let ve=new ge,Ke=new y(new be(.012,.012,.11,8),new F({color:16777215}));Ke.position.y=.06,ve.add(Ke),ve.rotation.x=Math.PI*.35,ve.visible=!1,i.add(ve),b.chalk=ve;let We=new ge,tt=new y(new be(.016,.016,.92,10),d);tt.position.y=.36,We.add(tt);let O=new y(new ot(.032,.16,8),d);O.position.y=.88,We.add(O);for(let Ct of[-1,1]){let vt=new y(new ot(.022,.14,8),d);vt.position.set(Ct*.065,.82,0),vt.rotation.z=-Ct*.25,We.add(vt)}We.visible=!1,i.add(We),b.trishul=We;let _e=new ge,ie=new y(new Qe(.32,.02,8,22,Math.PI),d);ie.rotation.z=-Math.PI/2,ie.position.set(0,.18,.05),_e.add(ie),_e.visible=!1,i.add(_e),b.bow=_e;let de=new ge,Pe=new y(new oe(.14,.08,.025),new F({color:2278750,roughness:.45}));Pe.position.set(0,.05,.04),de.add(Pe),de.visible=!1,i.add(de),b.money=de;let Te=new ge,$e=new y(new be(.016,.016,.65,8),E);$e.position.y=.22,Te.add($e);let ft=new y(new ot(.09,.22,10),new F({color:16638023,roughness:.9}));ft.position.y=-.14,Te.add(ft),Te.visible=!1,i.add(Te),b.broom=Te;let yt=new ge,at=new y(new be(.014,.014,.55,8),x);at.position.y=.26,yt.add(at);let Xt=new y(new ot(.32,.14,14),_);Xt.position.y=.52,yt.add(Xt),yt.visible=!1,i.add(yt),b.umbrella=yt;let Nt=new ge,pi=new y(new be(.12,.09,.022,14),m);pi.position.y=.02,Nt.add(pi);for(let Ct of[-.04,.04,0]){let vt=new y(new Ie(.036,10,8),new F({color:16096779,roughness:.45}));vt.position.set(Ct,.055,Ct===0?.035:-.02),Nt.add(vt)}Nt.visible=!1,i.add(Nt),b.sweetplate=Nt;let An=new ge,rn=new y(new oe(.11,.22,.02),u);rn.position.set(.01,-.15,.015),rn.rotation.x=.04,An.add(rn);let yn=new y(new oe(.114,.035,.023),p);yn.position.set(.01,-.23,.018),yn.rotation.x=.04,An.add(yn),An.visible=!1,i.add(An),b.towel=An;let on=new ge,Cn=new y(new be(.055,.068,.18,12),M);Cn.position.y=.09,on.add(Cn);let Mn=new y(new oe(.09,.04,.035),R);return Mn.position.set(.025,.2,0),on.add(Mn),on.rotation.x=Math.PI*.42,on.visible=!1,i.add(on),b.sprayBottle=on,{rightGroup:i,leftGroup:s,capeGroup:r,towelNeckGroup:h,rightMeshes:b,leftComb:se,scissorUpper:C,scissorLower:H,phoneScreen:W,diyaFlame:Me}}function Lh(n,e,t,i,s,r){if(!n)return;let o=t==="removingTowel"?"towel":e&&e!=="none"?e:null;for(let a of Object.keys(n.rightMeshes))n.rightMeshes[a].visible=a===o;if(n.leftComb.visible=o==="scissors"||o==="comb",n.capeGroup.visible=r&&o!=="scissors",n.towelNeckGroup.visible=r&&o!=="scissors"&&t!=="removingTowel",o==="scissors"&&n.scissorUpper&&n.scissorLower){let l=.05+Math.pow(.5+.5*Math.sin(i*(t==="cutting"||s?18:8.5)),2)*.42;n.scissorUpper.rotation.z=l,n.scissorLower.rotation.z=-l}if(o==="phone"&&n.phoneScreen&&n.phoneScreen.color.setHex(Math.sin(i*9)>0?3718648:8246268),o==="diya"&&n.diyaFlame){let a=.85+.25*Math.sin(i*14);n.diyaFlame.scale.set(a,.9+.3*Math.cos(i*11),a)}}var Oh=["devi","mata","durga","lakshmi","laxmi","saraswati","parvati","sita","radha","\u0926\u0947\u0935\u0940","\u092E\u093E\u0924\u093E","\u0926\u0941\u0930\u094D\u0917\u093E","\u0932\u0915\u094D\u0937\u094D\u092E\u0940","\u0938\u0930\u0938\u094D\u0935\u0924\u0940","\u092A\u093E\u0930\u094D\u0935\u0924\u0940","\u0938\u0940\u0924\u093E","\u0930\u093E\u0927\u093E"];function hm(n,e){return e==="Warrior"||e==="KingCrown"||e==="BrainrotLog"||e==="CupDancer"||e==="CartoonTank"||e==="ComicBobble"||e!=="Narrator"&&(n==="Temple"||n==="ForestAshram"||n==="RiverGhat"||n==="Himalaya")?!0:n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="Battlefield"||n==="PalaceCourt"||n==="ModernCity"||n==="Village"||n==="Archive"}function kl(n){return n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="ModernCity"}function um(n,e,t){let i=2907274,s=new De(t).getHex(),r=15250056,o=!1;switch(n){case"KingCrown":i=10036282,s=16105016;break;case"SageRishi":i=14247960,s=16638082;break;case"Divine":i=2974425,s=16767040,r=10405119,o=!0;break;case"ChildDevotee":i=15376156,s=14239782;break;case"NobleWoman":i=12725078,s=16303174;break;case"Warrior":i=7557683,s=12962774;break;case"BrainrotLog":i=10115880,s=16436245,r=12088894;break;case"CupDancer":i=16317180,s=16020150,r=16777215;break;case"CartoonTank":i=5078079,s=16436245,r=3560212;break;case"ComicBobble":i=16347926,s=3718648,r=15843995;break;default:i=3104660;break}return e&&/^#?[0-9a-fA-F]{6}$/.test(e.trim())&&(i=new De(e.startsWith("#")?e:`#${e}`).getHex()),{robe:i,sash:s,skin:r,isDivine:o}}function dm(n,e,t,i){let s=[new ye(n*.68,-.05),new ye(n,.02),new ye(n*.98,i*.22),new ye(e,i*.48),new ye(t,i*.82),new ye(t*.62,i*.98),new ye(.01,i)];return new ai(s,24)}function fm(n){let e=new ge,t=new F({color:3876421,roughness:.45,metalness:.3}),i=new y(new be(.42,.48,.08,24),t);i.position.y=.04,i.receiveShadow=!0,i.castShadow=!0,e.add(i);let s=new F({color:16020150,emissive:n,emissiveIntensity:.22,roughness:.35});for(let a=0;a<12;a++){let l=a/12*Math.PI*2,c=new y(new Ie(.11,10,8),s);c.scale.set(1.2,.45,2),c.position.set(Math.cos(l)*.36,.08,Math.sin(l)*.36),c.rotation.y=-l+Math.PI*.5,c.rotation.x=.22,e.add(c)}let r=new ke({color:n,transparent:!0,opacity:.35,side:xt,depthWrite:!1}),o=new y(new In(.32,.52,32),r);return o.rotation.x=-Math.PI/2,o.position.y=.015,e.add(o),{group:e,glowMesh:o}}function pm(n,e,t,i,s,r,o){let a=new F({color:1972516,roughness:.72}),l=new F({color:14277862,roughness:.6}),c=new F({color:16103470,metalness:.85,roughness:.22}),h=t.toLowerCase(),u=e==="SageRishi"&&(h.includes("narad")||h.includes("\u0928\u093E\u0930\u0926")),p=e==="NobleWoman"&&Oh.some(g=>h.includes(g));if(e==="KingCrown"&&(o==="turban"||i==="PalaceCourt"||/sartaaj|sufi|shayar|prince|dulha|singer/i.test(h))&&!/maharaj|raja|samrat|emperor/i.test(h)){let g=new y(new Ie(s*1.02,20,14,0,Math.PI*2,0,Math.PI*.42),a);g.rotation.x=-.32,n.add(g);let m=new ge,E=i==="PalaceCourt"?16117734:r??10036282,d=new F({color:E,roughness:.62}),_=new y(new Ie(s*1.08,22,16,0,Math.PI*2,0,Math.PI*.52),d);_.scale.set(1.04,.78,1.06),_.position.set(0,s*.48,-s*.06),_.castShadow=!0,m.add(_);for(let A=0;A<3;A++){let C=new y(new Qe(s*(.94+(A===1?.04:0)),s*.105,10,24),A===1?d:new F({color:E,roughness:.55}));C.rotation.x=Math.PI/2-.28+A*.1,C.rotation.z=(A-1)*.14,C.position.set(0,s*(.6+A*.14),-s*.02),C.castShadow=!0,m.add(C)}let M=new y(new xn(s*.15,0),c);M.position.set(s*.16,s*1.02,s*.74),m.add(M);let x=new y(new ot(s*.12,s*.44,8),new F({color:16708551,emissive:14251782,emissiveIntensity:.25,roughness:.45}));x.position.set(s*.19,s*1.26,s*.64),x.rotation.z=-.2,x.rotation.x=-.16,m.add(x),n.add(m);let b=new y(new Ie(s*.46,14,10),a);b.scale.set(1.22,.65,.78),b.position.set(0,-s*.72,s*.54),n.add(b);let R=new y(new bt(s*.036,s*.28,4,8),a);R.rotation.z=Math.PI/2,R.position.set(0,-s*.2,s*.94),n.add(R);return}if(e==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(h)){let g=new F({color:3875604,roughness:.72}),m=new y(new Ie(s*1.04,20,14,0,Math.PI*2,0,Math.PI*.48),g);m.scale.set(1.02,1.12,1),m.rotation.x=-.34,n.add(m);let E=new y(new Ie(s*.46,16,14),g);E.scale.set(.88,1.32,.88),E.position.set(0,s*1.24,-s*.12),E.castShadow=!0,n.add(E);let d=new F({color:16317180,emissive:14742270,emissiveIntensity:.85,metalness:.45,roughness:.15}),_=new y(new Qe(s*.25,s*.048,8,20,Math.PI*1.22),d);_.position.set(-s*.36,s*1.12,s*.26),_.rotation.z=Math.PI*.68,_.rotation.y=.22,n.add(_);let M=new y(new Qe(s*.42,s*.042,8,16),c);M.rotation.x=Math.PI/2,M.position.set(0,s*.96,-s*.12),n.add(M);return}if(e==="KingCrown"||e==="Divine"||e==="NobleWoman"&&(p||i!=="PalaceCourt"&&(h.includes("rani")||h.includes("\u0930\u093E\u0928\u0940")))){let g=new y(new Ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);g.scale.set(1.01,1.11,.99),g.rotation.x=-.34,n.add(g);let m=new ge;m.position.y=s*.88;let E=new y(new be(s*.82,s*.86,s*.35,20),c);E.castShadow=!0,m.add(E);let d=e==="Divine"?3:2;for(let x=0;x<d;x++){let b=new y(new ot(s*(.65-x*.16),s*(.55-x*.08),16),c);b.position.y=s*(.32+x*.32),b.castShadow=!0,m.add(b)}let _=new F({color:e==="Divine"?2282478:16007006,emissive:e==="Divine"?959977:14753096,emissiveIntensity:.65,metalness:.2,roughness:.1}),M=new y(new xn(s*.15,0),_);if(M.position.set(0,s*.08,s*.82),m.add(M),n.add(m),e==="NobleWoman"){let x=new y(new bt(s*.22,s*1.4,8,12),a);x.position.set(0,-s*.85,-s*.82),x.rotation.x=.24,n.add(x)}return}if(e==="SageRishi"){let g=u?new F({color:2892339,roughness:.7}):l,m=new y(new Ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),g);m.scale.set(1.01,1.11,.99),m.rotation.x=-.36,n.add(m);let E=new y(new Ie(s*.42,14,12),g);if(E.scale.set(.9,1.15,.9),E.position.set(0,s*1.24,-s*.16),E.castShadow=!0,n.add(E),!u){let d=new y(new ot(s*.52,s*.95,14),g);d.rotation.x=Math.PI,d.position.set(0,-s*.88,s*.48),n.add(d)}return}if(e==="ChildDevotee"){let g=new y(new Ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),a);g.scale.set(1.01,1.11,.99),g.rotation.x=-.36,n.add(g);let m=new y(new Ie(s*.22,10,8),a);if(m.scale.set(1.3,.65,.85),m.position.set(-s*.12,s*.78,s*.68),n.add(m),!kl(i)){let E=new y(new Qe(s*.9,s*.065,10,24),c);E.rotation.x=Math.PI/2-.34,E.position.set(0,s*.55,s*.06),n.add(E);let d=new y(new xn(s*.13,0),new F({color:1096065,emissive:366185,emissiveIntensity:.6}));d.position.set(0,s*.62,s*.92),n.add(d)}return}if(e==="NobleWoman"){let g=new y(new Ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);g.scale.set(1.01,1.11,.99),g.rotation.x=-.34,n.add(g);let m=new y(new bt(s*.24,s*1.45,8,12),a);m.position.set(0,-s*.85,-s*.85),m.rotation.x=.25,n.add(m);let E=new y(new Ie(s*.1,10,8),c);E.position.set(0,s*.5,s*.94),n.add(E);return}if(e==="Warrior"){let g=new F({color:10594485,metalness:.78,roughness:.28}),m=new y(new Ie(s*1.05,20,14,0,Math.PI*2,0,Math.PI*.47),g);m.scale.set(1.02,1.12,1),m.rotation.x=-.32,n.add(m);let E=new y(new Qe(s*.7,s*.12,8,16,Math.PI),new F({color:14427686,roughness:.6}));E.rotation.y=Math.PI/2,E.position.y=s*.86,n.add(E);return}if(e==="ComicBobble"||kl(i)){let g=new ge,m=new y(new Ie(s*1.06,20,14,0,Math.PI*2,0,Math.PI*.5),a);if(m.scale.set(1.04,1.15,1.05),m.position.set(0,s*.06,-s*.02),m.rotation.x=-.15,g.add(m),e==="ComicBobble"){for(let R of[-.35,0,.35]){let A=new y(new ot(s*.15,s*.4,8),a);A.position.set(R*s*.85,s*1.14,s*.2),A.rotation.z=-R*.65,A.rotation.x=.24,g.add(A)}let b=new y(new Ie(s*.38,12,10),a);b.scale.set(1.38,.56,.98),b.position.set(0,s*.92,s*.52),g.add(b)}else{let b=new y(new Ie(s*.46,14,12),a);b.scale.set(1.48,.78,1.38),b.position.set(0,s*1.1,s*.36),g.add(b);let R=new y(new Ie(s*.36,12,10),a);R.scale.set(1.42,.54,.96),R.position.set(0,s*.92,s*.56),g.add(R);for(let A of[-1,1]){let C=new y(new ot(s*.14,s*.34,8),a);C.position.set(A*s*.42,s*1.16,s*.26),C.rotation.z=-A*.48,C.rotation.x=.28,g.add(C)}}n.add(g);let E=new ge;E.visible=!1;let d=new y(new Qe(s*.88,s*.11,8,22,Math.PI*1.15),a);d.rotation.x=Math.PI/2+.18,d.rotation.z=-Math.PI*.075,d.position.set(0,s*.16,-s*.1),E.add(d);let _=new y(new ot(s*.06,s*.16,6),a);_.position.set(0,s*1.08,-s*.12),E.add(_);let M=new F({color:16775399,emissive:16770229,emissiveIntensity:.48,roughness:.1}),x=new y(new Ie(s*.25,12,10),M);return x.scale.set(1.3,.32,.92),x.position.set(.08*s,s*.92,s*.34),x.rotation.z=-.18,x.rotation.x=.28,E.add(x),n.add(E),{hairFullGroup:g,hairShavedGroup:E}}else{let g=new y(new Ie(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),a);g.scale.set(1.01,1.11,.99),g.rotation.x=-.35,n.add(g)}}function Gh(n,e,t,i,s,r){let o=new F({color:16317180,roughness:.18}),a=new F({color:1971218,roughness:.12}),l=new F({color:t,roughness:.48}),c=new F({color:i,roughness:.55}),h=r?1.38:1,u=x=>{let b=x*e*(r?.38:.36),R=e*.09,A=s,C=new y(new Ie(e*.17*h,14,12),o);C.scale.set(1,1.05,.6),C.position.set(b,R,A),n.add(C);let w=new y(new Ie(e*.105*(r?1.15:1),12,10),a);w.scale.set(1,1,.65),w.position.set(b,R,A+e*.07*h),n.add(w);let v=new y(new Ie(e*.036*h,8,6),new ke({color:16777215}));v.position.set(b+e*.032,R+e*.035,A+e*.115*h),n.add(v);let H=new y(new Ie(e*.18*h,12,10,0,Math.PI*2,0,Math.PI*.52),l);H.scale.set(1.02,1.05,.65),H.position.set(b,R,A),H.rotation.x=-Math.PI*.48,n.add(H);let z=new y(new bt(e*.034*h,e*.22*h,4,8),c);return z.rotation.z=Math.PI/2,z.position.set(b,R+e*.25*h,A+e*.08*h),n.add(z),{sclera:C,pupil:w,eyelid:H,brow:z}},p=u(-1),f=u(1),g=-e*.36,m=s+e*.02,E=new y(new Ie(e*(r?.22:.16),12,10),new ke({color:5509406}));E.scale.set(1.1,.2,.45),E.position.set(0,g,m-.01),n.add(E);let d=new F({color:10896452,roughness:.42}),_=new y(new bt(e*.032,e*.22,4,8),d);_.rotation.z=Math.PI/2,_.position.set(0,g+e*.03,m+.03),n.add(_);let M=new y(new bt(e*.034,e*.19,4,8),d);return M.rotation.z=Math.PI/2,M.position.set(0,g-e*.03,m+.03),n.add(M),{leftEye:p,rightEye:f,mouthCavity:E,upperLip:_,lowerLip:M,mouthBaseY:g}}function mm(n,e,t,i,s,r,o,a){let l=new ge,c=new ge;l.add(c);let h=new y(new In(.46,.58,36),new ke({color:a,transparent:!0,opacity:.22,side:xt,depthWrite:!1}));h.rotation.x=-Math.PI/2,h.position.y=.012,l.add(h);let u=new y(new Lt(.45,32),new ke({color:a,transparent:!0,opacity:.08,side:xt,depthWrite:!1}));u.rotation.x=-Math.PI/2,u.position.y=.01,l.add(u);let p=new F({color:s,roughness:.48,metalness:n==="CartoonTank"?.35:.06}),f=new F({color:r,roughness:.35,metalness:.35}),g=new F({color:2042167,roughness:.72}),m=new ge,E=n==="CartoonTank"?.26:.44;m.position.y=E,c.add(m);let d=new ge,_,M,x,b,R;if(n==="CartoonTank"){for(let pe of[-.36,.36]){let W=new y(new oe(.22,.26,.92),g);W.position.set(pe,-.1,0),W.castShadow=!0,m.add(W);for(let ue of[-.3,0,.3]){let ee=new y(new be(.11,.11,.25,12),f);ee.rotation.z=Math.PI/2,ee.position.set(pe,-.12,ue),m.add(ee)}}let re=new y(new oe(.68,.3,.84),p);re.position.set(0,.14,0),re.castShadow=!0,m.add(re),_=new ge,_.position.set(0,.42,-.02),m.add(_);let j=new y(new oe(.56,.34,.56),p);j.castShadow=!0,_.add(j);let xe=new y(new oe(.58,.07,.58),f);xe.position.y=-.1,_.add(xe),M=new y(new be(.065,.08,.66,14),g),M.rotation.x=Math.PI/2,M.position.set(0,.04,.5),M.castShadow=!0,_.add(M),d.position.set(0,.1,0),_.add(d)}else if(n==="BrainrotLog"){let re=W=>{let ue=new ge;ue.position.set(W*.14,-.05,0),m.add(ue);let ee=new y(new bt(.065,.28,6,8),p);ee.position.set(0,-.17,0),ue.add(ee);let le=new y(new Ie(.1,10,8),f);return le.scale.set(.9,.5,1.5),le.position.set(0,-.34,.05),ue.add(le),ue};b=re(-1),R=re(1);let j=new y(new be(.21,.25,.96,18),p);j.position.y=.44,j.castShadow=!0,m.add(j);let xe=new y(new be(.18,.18,.04,16),new F({color:16639626}));xe.position.y=.93,m.add(xe);let pe=new y(new be(.025,.04,.18,8),p);pe.position.set(.06,1,0),pe.rotation.z=-.35,m.add(pe),d.position.set(0,.72,0),m.add(d)}else{let re=ue=>{let ee=new ge;ee.position.set(ue*.13,-.05,0),m.add(ee);let le=new y(new bt(.055,.3,6,8),g);le.position.set(0,-.17,0),ee.add(le);let X=new y(new Ie(.095,10,8),f);return X.scale.set(.95,.5,1.45),X.position.set(0,-.34,.05),ee.add(X),ee};b=re(-1),R=re(1);let j=new y(new be(.32,.22,.62,24),p);j.position.y=.34,j.castShadow=!0,m.add(j);let xe=new y(new Qe(.315,.025,10,24),f);xe.rotation.x=Math.PI/2,xe.position.y=.65,m.add(xe);let pe=new y(new Lt(.295,24),new F({color:4137748,roughness:.2}));pe.rotation.x=-Math.PI/2,pe.position.y=.62,m.add(pe);let W=new y(new Qe(.14,.034,8,16,Math.PI),p);W.rotation.z=-Math.PI/2,W.position.set(-.3,.36,0),m.add(W),d.position.set(0,.42,0),m.add(d)}let w=Gh(d,n==="CartoonTank"?.26:.24,o,1120295,n==="CartoonTank"?.29:n==="CupDancer"?.28:.21,!0),v=n==="CupDancer"?new F({color:16777215,roughness:.4}):p,H=new bt(.048,.2,6,8),z=new bt(.042,.18,6,8),G=re=>{let j=new ge;j.position.set(re*(n==="CartoonTank"?.33:.27),n==="CartoonTank"?.24:.45,0),m.add(j);let xe=new y(H,v);xe.position.y=-.11,j.add(xe);let pe=new ge;pe.position.y=-.22,j.add(pe);let W=new y(z,v);W.position.y=-.1,pe.add(W);let ue=new y(new Ie(.068,10,8),f);return ue.position.y=-.22,pe.add(ue),{shoulder:j,elbow:pe,glove:ue}},J=G(-1),Y=G(1),Z=new ge;Z.position.set(0,-.25,.06);let se=new y(new be(.11,.07,.08,14),new F({color:16317180,roughness:.35}));Z.add(se);let B=new y(new Ie(.075,10,8),new F({color:16707722,roughness:.45}));B.scale.set(1.1,.55,1.1),B.position.y=.035,Z.add(B),Z.visible=!1,Y.elbow.add(Z);let te=Ol(Y.elbow,J.elbow,m);if(n==="BrainrotLog"){x=new ge,x.position.set(0,-.22,.04);let re=new y(new be(.065,.025,.65,10),new F({color:14251782,roughness:.45}));re.position.y=-.28,re.castShadow=!0,x.add(re),Y.elbow.add(x)}return l.rotation.y=t*.36,{root:l,bodyPivot:c,torsoGroup:m,headPivot:d,leftShoulder:J.shoulder,leftElbow:J.elbow,rightShoulder:Y.shoulder,rightElbow:Y.elbow,leftHip:b,rightHip:R,snackProp:Z,handProps:te,headY:n==="CartoonTank"?.78:n==="CupDancer"?.86:1.16,leftEyelid:w.leftEye.eyelid,rightEyelid:w.rightEye.eyelid,leftBrow:w.leftEye.brow,rightBrow:w.rightEye.brow,leftSclera:w.leftEye.sclera,rightSclera:w.rightEye.sclera,leftPupil:w.leftEye.pupil,rightPupil:w.rightEye.pupil,mouthCavity:w.mouthCavity,upperLip:w.upperLip,lowerLip:w.lowerLip,auraRing:h,auraDisc:u,turretGroup:_,cannonBarrel:M,propPivot:x,mouthBaseY:w.mouthBaseY,baseTorsoY:E,restScale:1,topY:n==="CartoonTank"?1.05:n==="CupDancer"?1.14:1.54,role:n,name:e,facingSign:t,standing:!0,seedOffset:i}}function ha(n,e,t,i,s){let r=n.role,o=hm(t,r),{robe:a,sash:l,skin:c,isDivine:h}=um(r,n.robeHex,e),u=new De(e);if(r==="BrainrotLog"||r==="CupDancer"||r==="CartoonTank")return mm(r,n.name,i,s,a,l,c,u);let p=new ge,f=new ge;p.add(f);let m=kl(t),E=r==="ChildDevotee"?.82:1;f.scale.setScalar(E);let d=new F({color:a,roughness:.58,metalness:.08}),_=new F({color:new De(a).multiplyScalar(.75),roughness:.65}),M=new F({color:l,roughness:.42,metalness:.25}),x=new F({color:c,roughness:.48,metalness:.02}),b=new F({color:16236088,metalness:.85,roughness:.22}),R=new y(new In(.46,.58,36),new ke({color:u,transparent:!0,opacity:m?0:.22,side:xt,depthWrite:!1}));R.rotation.x=-Math.PI/2,R.position.y=.012,R.visible=!m,p.add(R);let A=new y(new Lt(.45,32),new ke({color:u,transparent:!0,opacity:m?0:.08,side:xt,depthWrite:!1}));A.rotation.x=-Math.PI/2,A.position.y=.01,A.visible=!m,p.add(A);let C,w,v,H,z,G=.14,J=m?new F({color:i>0?1976635:3223169,roughness:.72}):_;if(o){G=.66;let ne=new y(new Ie(.245,16,12),J);ne.scale.set(1.06,.65,.88),ne.position.set(0,G-.01,0),ne.castShadow=!0,f.add(ne);let ce=new bt(.104,.2,6,10),Ue=new bt(.092,.18,6,10),he=new F({color:m?16317180:3875862,roughness:.45}),Ee=ve=>{let Ke=new ge;Ke.position.set(ve*.13,G-.04,0),f.add(Ke);let We=new y(ce,J);We.position.set(0,-.15,0),We.castShadow=!0,We.receiveShadow=!0,Ke.add(We);let tt=new ge;tt.position.set(0,-.3,0),Ke.add(tt);let O=new y(Ue,J);O.position.set(0,-.14,0),O.castShadow=!0,O.receiveShadow=!0,tt.add(O);let _e=new y(new Ie(.105,12,8),he);return _e.scale.set(.95,.55,1.55),_e.position.set(0,-.265,.05),_e.castShadow=!0,tt.add(_e),{hip:Ke,knee:tt}},Le=Ee(-1),Ne=Ee(1);w=Le.hip,H=Le.knee,v=Ne.hip,z=Ne.knee}else{let ne=fm(u);C=ne.glowMesh,f.add(ne.group),G=.15;let ce=new y(new Ie(.36,20,12),_);ce.scale.set(1.15,.45,.92),ce.position.set(0,G+.06,.03),ce.castShadow=!0,ce.receiveShadow=!0,f.add(ce)}let Y=new ge;Y.position.y=G,f.add(Y);let Z=dm(.28,.21,.27,.62),se=new y(Z,d);if(se.castShadow=!0,se.receiveShadow=!0,Y.add(se),m){let ne=new y(new Qe(.132,.026,8,20),M);ne.rotation.x=Math.PI/2+.2,ne.position.set(0,.58,.03),Y.add(ne);let ce=new y(new Qe(.255,.022,8,22),new F({color:988970,roughness:.65}));ce.rotation.x=Math.PI/2,ce.position.y=.04,Y.add(ce)}else{if(t!=="PalaceCourt"){let Ue=new ss([new I(-.16,.55,.1),new I(-.02,.39,.21),new I(.18,.22,.14),new I(.14,.18,-.16)]),he=new y(new qs(Ue,18,.024,8,!1),M);he.castShadow=!0,Y.add(he)}let ne=new y(new Qe(.22,.022,8,22),b);ne.rotation.x=Math.PI/2,ne.position.y=.24,Y.add(ne);let ce=new y(new Qe(.142,.018,8,20),b);if(ce.rotation.x=Math.PI/2+.25,ce.position.set(0,.57,.04),Y.add(ce),o&&r==="NobleWoman"){let Ue=[new ye(.18,.25),new ye(.24,.08),new ye(.36,-.18),new ye(.45,-.44),new ye(.42,-.46)],he=new ai(Ue,28),Ee=new F({color:a,roughness:.45,metalness:.14,side:xt}),Le=new y(he,Ee);Le.castShadow=!0,Le.receiveShadow=!0,Y.add(Le);let Ne=new y(new Qe(.44,.024,8,32),b);Ne.rotation.x=Math.PI/2,Ne.position.y=-.44,Y.add(Ne)}else if(o&&r==="KingCrown"&&(t==="PalaceCourt"||n.attire==="turban")){let Ue=[new ye(.22,.24),new ye(.27,.02),new ye(.31,-.26),new ye(.32,-.34)],he=new y(new ai(Ue,24),new F({color:a,roughness:.5,metalness:.12,side:xt}));he.castShadow=!0,Y.add(he);for(let Ee=0;Ee<4;Ee++){let Le=new y(new Ie(.022,8,8),b);Le.position.set(0,.5-Ee*.075,Ee<2?.248:.225),Y.add(Le)}}}let B=n.name.toLowerCase();if(r==="SageRishi"&&(B.includes("narad")||B.includes("\u0928\u093E\u0930\u0926"))){let ne=new ge,ce=new F({color:9584654,roughness:.42}),Ue=new y(new be(.025,.025,.85,10),ce);Ue.rotation.z=-.68,ne.add(Ue);let he=new y(new Ie(.11,14,10),ce);he.position.set(-.26,-.32,.04),ne.add(he);let Ee=new y(new Ie(.08,12,10),ce);Ee.position.set(.24,.3,.04),ne.add(Ee),ne.position.set(0,.34,.28),Y.add(ne)}else if(r==="Warrior"){let ne=new y(new be(.22,.22,.04,20),b);ne.rotation.x=Math.PI/2,ne.position.set(-.34,.28,.08),Y.add(ne);let ce=new y(new be(.016,.016,1.45,8),new F({color:7029795}));ce.position.set(.36,.55,.02),Y.add(ce);let Ue=new y(new ot(.04,.14,8),new F({color:14870768,metalness:.85}));Ue.position.set(.36,1.32,.02),Y.add(Ue)}let te=new bt(.072,.21,6,10),re=new bt(.06,.19,6,10),j=ne=>{let ce=new ge;ce.position.set(ne*.245,.52,0),Y.add(ce);let Ue=new y(new Ie(.088,12,10),d);Ue.castShadow=!0,ce.add(Ue);let he=new y(te,d);he.position.y=-.13,he.castShadow=!0,ce.add(he);let Ee=new ge;Ee.position.y=-.26,ce.add(Ee);let Le=new y(new Ie(.062,10,8),d);Le.castShadow=!0,Ee.add(Le);let Ne=new y(re,d);Ne.position.y=-.115,Ne.castShadow=!0,Ee.add(Ne);let ve=new y(new Ie(.066,12,10),x);return ve.scale.set(.95,1.15,.8),ve.position.y=-.24,ve.castShadow=!0,Ee.add(ve),{shoulder:ce,elbow:Ee}},xe=j(-1),pe=j(1),W=new ge;W.position.set(0,-.25,.06);let ue=new y(new be(.11,.07,.08,14),new F({color:16317180,roughness:.35}));W.add(ue);let ee=new y(new Ie(.075,10,8),new F({color:16707722,roughness:.45}));ee.scale.set(1.1,.55,1.1),ee.position.y=.035,W.add(ee),W.visible=!1,pe.elbow.add(W);let le=Ol(pe.elbow,xe.elbow,Y),X=r==="ComicBobble"?.345:r==="ChildDevotee"?.265:.245,U=new y(new be(.075,.095,.14,14),x);U.position.y=.65,Y.add(U);let D=new ge;D.position.y=.68+X*.92,Y.add(D);let fe=new y(new Ie(X,26,20),x);fe.scale.set(.98,1.08,.95),fe.castShadow=!0,fe.receiveShadow=!0,D.add(fe);let we=new y(new Ie(X*.14,10,8),x);we.scale.set(.85,1.05,1.2),we.position.set(0,-X*.04,X*.94),D.add(we);for(let ne of[-1,1]){let ce=new y(new Ie(X*.18,10,8),x);if(ce.scale.set(.5,1.2,.8),ce.position.set(ne*X*.96,-X*.04,0),D.add(ce),!m){let Ue=new y(new Qe(X*.1,X*.025,8,14),b);Ue.rotation.y=Math.PI/2,Ue.position.set(ne*X*.98,-X*.2,.01),D.add(Ue)}}let Oe=ne=>{let ce=new y(new Ie(X*.19,10,8),new ke({color:15680580,transparent:!0,opacity:0,depthWrite:!1}));return ce.scale.set(1.2,.75,.35),ce.position.set(ne*X*.56,-X*.16,X*.84),D.add(ce),ce},L=m?Oe(-1):void 0,ct=m?Oe(1):void 0,Ce,Je=X*.08;if(m){Ce=new ge,Ce.position.set(0,Je,X*.97);let ne=new F({color:988970,metalness:.45,roughness:.25}),ce=new ke({color:12248829,transparent:!0,opacity:.24}),Ue=new y(new oe(X*1.18,X*.09,X*.05),ne);Ue.position.set(0,X*.16,.01),Ce.add(Ue);for(let Ee of[-1,1]){let Le=new y(new Qe(X*.19,X*.028,8,18),ne);Le.position.set(Ee*X*.36,0,0),Ce.add(Le);let Ne=new y(new Lt(X*.175,16),ce);Ne.position.set(Ee*X*.36,0,-.005),Ce.add(Ne);let ve=new y(new oe(X*.03,X*.035,X*.92),ne);ve.position.set(Ee*X*.56,X*.11,-X*.44),Ce.add(ve)}let he=new y(new be(X*.022,X*.022,X*.36,6),ne);he.rotation.z=Math.PI/2,he.position.set(0,X*.02,0),Ce.add(he),Ce.visible=n.hasGlasses!==void 0&&n.hasGlasses!==null?!!n.hasGlasses:i>0,D.add(Ce)}if(r==="NobleWoman"){let ne=new y(new Ie(X*.08,10,8),new F({color:14427686,roughness:.4}));ne.scale.z=.4,ne.position.set(0,X*.24,X*.96),D.add(ne)}else if(r==="Divine"&&/shiv|mahadev|neelkanth|shambho|शिव|महादेव|नीलकंठ|शंभो/i.test(B)){let ne=new F({color:16317180,emissive:14870768,emissiveIntensity:.45,roughness:.6});for(let Ue of[-.045,0,.045]){let he=new y(new oe(X*.36,X*.025,X*.04),ne);he.position.set(0,X*(.28+Ue),X*.95),D.add(he)}let ce=new y(new Ie(X*.045,8,8),new F({color:14427686}));ce.position.set(0,X*.28,X*.975),D.add(ce)}else if(r!=="Warrior"&&!m){let ne=new y(new bt(X*.036,X*.16,4,8),new F({color:r==="Divine"?16498468:15357964,emissive:8138002,emissiveIntensity:.2}));ne.position.set(0,X*.28,X*.95),D.add(ne)}let Re=pm(D,r,n.name,t,X,a,n.attire),ze,Ae,P=r==="NobleWoman"&&Oh.some(ne=>B.includes(ne));if(h||r==="SageRishi"||P){ze=new ge,ze.position.set(0,.04,-X*.72),Ae=new ke({color:h?16769126:u,transparent:!0,opacity:h?.65:.28,side:xt,depthWrite:!1});let ne=new y(new In(X*1.45,X*1.62,32),Ae);ze.add(ne);for(let ce=0;ce<8;ce++){let Ue=new y(new rt(X*.08,X*.45),Ae),he=ce/8*Math.PI*2;Ue.position.set(Math.cos(he)*X*1.54,Math.sin(he)*X*1.54,0),Ue.rotation.z=he+Math.PI/2,ze.add(Ue)}D.add(ze)}let T=r==="SageRishi"?14277862:1840930,V=r==="ComicBobble"||t==="DoorwaySet"||t==="SkyGauntlet",Q=Gh(D,X,c,T,X*.85,V);p.rotation.y=i*.42;let ae=G+.68+X*.92,$=(o?ae:1.04)*E,Me=(o?ae+X*1.48:1.4)*E;return{root:p,bodyPivot:f,torsoGroup:Y,headPivot:D,leftShoulder:xe.shoulder,leftElbow:xe.elbow,rightShoulder:pe.shoulder,rightElbow:pe.elbow,leftHip:w,rightHip:v,leftKnee:H,rightKnee:z,snackProp:W,handProps:le,headY:$,leftEyelid:Q.leftEye.eyelid,rightEyelid:Q.rightEye.eyelid,leftBrow:Q.leftEye.brow,rightBrow:Q.rightEye.brow,leftSclera:Q.leftEye.sclera,rightSclera:Q.rightEye.sclera,leftPupil:Q.leftEye.pupil,rightPupil:Q.rightEye.pupil,mouthCavity:Q.mouthCavity,upperLip:Q.upperLip,lowerLip:Q.lowerLip,glassesGroup:Ce,glassesBaseY:Je,hairFullGroup:Re?.hairFullGroup,hairShavedGroup:Re?.hairShavedGroup,leftCheekFlush:L,rightCheekFlush:ct,haloGroup:ze,haloMaterial:Ae,auraRing:R,auraDisc:A,pedestalGlow:C,mouthBaseY:Q.mouthBaseY,baseTorsoY:o?.66:.15,restScale:E,topY:Me,role:r,name:n.name,facingSign:i,standing:o,hasFloorAura:!m,seedOffset:s}}function ua(n,e,t,i,s,r,o="none",a=.5,l=!1,c=null,h=!1,u=!1,p=null,f=0){let g=e+n.seedOffset,m=o||"none",E=n.role==="BrainrotLog"||n.role==="CupDancer"||n.role==="CartoonTank"||n.role==="ComicBobble";if(n.snackProp&&(n.snackProp.visible=m==="eating"&&(!c||c==="none")),Lh(n.handProps,c,m,g,t,u),n.hairFullGroup&&n.hairShavedGroup&&(n.hairFullGroup.visible=f<2,n.hairShavedGroup.visible=f>=2,f===1?(n.hairFullGroup.scale.set(.96,.95,.96),n.hairFullGroup.position.set(.015,.01,0),n.hairFullGroup.rotation.z=.22):(n.hairFullGroup.scale.setScalar(1),n.hairFullGroup.position.set(0,0,0),n.hairFullGroup.rotation.z=0)),n.glassesGroup){let U=(p??"normal").trim().toLowerCase();if(U==="none")n.glassesGroup.visible=!1;else{n.glassesGroup.visible=!0;let D=n.glassesBaseY??.028,fe=0,we=0,Oe=D;if(U==="ulta")fe=Math.PI,Oe=D-.012;else if(U==="flipping"){let L=Math.max(0,Math.min(1,(a-.35)/.25)),ct=L*L*(3-2*L);fe=Math.PI*(1-ct),Oe=D-.012*(1-ct)+Math.sin(ct*Math.PI)*.04}else U==="crooked"?(fe=.28+Math.sin(g*9)*.04,Oe=D-.01):U==="forehead"&&(we=-.35,Oe=D+.105);n.glassesGroup.rotation.z=fe,n.glassesGroup.rotation.x=we,n.glassesGroup.position.y=Oe}}if(n.leftCheekFlush&&n.rightCheekFlush){let U=s==="angry"?.68:s==="laughing"?.36:0,D=s==="angry"?14427686:16478597;[n.leftCheekFlush,n.rightCheekFlush].forEach(fe=>{let we=fe.material;we.opacity=U,we.color.setHex(D)})}let d=0,_=0,M=0,x=0,b=0,R=0,A=0,C=0,w=0,v=Math.sin(g*2.1)*(t?.018:.008);n.torsoGroup.position.y=n.baseTorsoY+v;let H=n.hasFloorAura!==!1;if(m==="sleeping")d=-Math.PI*.48,M=n.standing?.06:.16,R=.14,A=.08,C=.28,w=.16,n.auraRing.visible=!1,n.auraDisc.visible=!1;else if(n.auraRing.visible=H,n.auraDisc.visible=H,m==="wakingUp"){let U=Math.max(0,Math.min(1,(a-.04)/.36)),D=1-Math.pow(1-U,3);d=-Math.PI*.48*(1-D)-.1*Math.sin(U*Math.PI),M=(n.standing?.06:.16)*(1-D)+Math.sin(U*Math.PI)*.12,x=-.14*Math.sin(U*Math.PI)}else if(m==="sitting"||h)M=n.standing?-.26:0,R=-Math.PI*.46,A=-Math.PI*.46,C=Math.PI*.46,w=Math.PI*.46,x=t?Math.sin(g*3.8)*.08:-.05;else if(m==="walking"||m==="running"){let U=m==="running"?14:7.5,D=Math.sin(e*U),fe=m==="running"?.85:.52,we=m==="running"?1.05:.55;R=D*fe,A=-D*fe,C=Math.max(0,-D)*we,w=Math.max(0,D)*we,M=Math.abs(Math.cos(e*U))*(m==="running"?.095:.045),x=m==="running"?.24:.1,b=D*.06}else if(m==="praying")x=.16+Math.sin(g*2.2)*.035,M=0;else if(m==="shockedFall"){let U=Math.max(0,Math.min(1,a/.35));d=.18*Math.sin(U*Math.PI*.7),_=n.facingSign*-.05*U,M=U<.35?Math.sin(U/.35*Math.PI)*.12:-.04*U,R=-.18*U,A=.14*U,C=.24*U}else if(m==="jumping"||m==="dancing"||m==="adaab"||m==="sufiSpin")if(m==="jumping"){let U=Math.abs(Math.sin(g*6.2));M=U*.22,R=-U*.35,A=-U*.35,C=U*.55,w=U*.55}else{let D=Fh(g,E?"viralBounce":"sufiKathak",m,n.facingSign<0,0);M=D.liftY,_=D.bodyRotZ,x=D.torsoRotX,b=D.torsoRotZ,R=D.leftHipX,A=D.rightHipX,C=D.leftKneeX,w=D.rightKneeX,n.bodyPivot.rotation.y+=(D.bodyRotY-n.bodyPivot.rotation.y)*(l?1:.35)}else if(m==="punching"){let{extend:U}=Jn(e,"punching");x=.1+U*.2,_=n.facingSign*-.05*U,M=-.03+U*.02,R=-.22,A=.16,C=.3,w=.22}else if(m==="kicking"){let{extend:U}=Jn(e,"kicking");A=-1.25*U,w=1.1*(1-U)*Math.min(1,U*3),C=.18,x=-.16*U,M=.02*U}else if(m==="hitReact"){let{recoil:U}=Jn(e,"punching");d=-.24*U,x=-.2*U,_=n.facingSign*.1*U+Math.sin(g*11)*.03,M=-.02*U,C=.22*U,w=.18*U}else m==="pointing"?(x=.14+Math.sin(g*6.5)*.04,M=t?Math.abs(Math.sin(g*7.5))*.035:0):M=t&&n.standing?Math.abs(Math.sin(g*(E?9.2:7.2)))*(E?.055:.035):0;let G=l?1:m==="punching"||m==="kicking"||m==="hitReact"?.62:m==="wakingUp"||m==="shockedFall"||m==="walking"||m==="running"?.45:.28;if(n.bodyPivot.rotation.x+=(d-n.bodyPivot.rotation.x)*G,n.bodyPivot.rotation.z+=(_-n.bodyPivot.rotation.z)*G,n.bodyPivot.position.y+=(M-n.bodyPivot.position.y)*G,n.torsoGroup.rotation.x+=(x-n.torsoGroup.rotation.x)*G,n.torsoGroup.rotation.z+=(b-n.torsoGroup.rotation.z)*G,n.leftHip&&(n.leftHip.rotation.x+=(R-n.leftHip.rotation.x)*G),n.rightHip&&(n.rightHip.rotation.x+=(A-n.rightHip.rotation.x)*G),n.leftKnee&&(n.leftKnee.rotation.x+=(C-n.leftKnee.rotation.x)*G),n.rightKnee&&(n.rightKnee.rotation.x+=(w-n.rightKnee.rotation.x)*G),m!=="dancing"&&m!=="adaab"&&m!=="sufiSpin"&&(n.bodyPivot.rotation.y+=(0-n.bodyPivot.rotation.y)*G),m==="sleeping"){let U=1+Math.sin(g*2.2)*.025;n.bodyPivot.scale.set(n.restScale,n.restScale*U,n.restScale)}else if(E&&t){let U=1+Math.max(0,M)*.85,D=1-Math.max(0,M)*.35;n.bodyPivot.scale.set(n.restScale*D,n.restScale*U,n.restScale*D)}else n.bodyPivot.scale.setScalar(n.restScale);if(n.standing&&m!=="sleeping"&&m!=="wakingUp"&&m!=="sitting"&&!h&&gm(n,Math.max(0,M)),n.turretGroup&&(n.turretGroup.rotation.y=t?Math.sin(g*2.4)*.18:n.facingSign*-.15,n.turretGroup.rotation.x=m==="sleeping"?.28:0),n.cannonBarrel){let U=t&&(s==="angry"||s==="proud")?Math.max(0,Math.sin(g*10.5))*.14:0;n.cannonBarrel.position.z=.5-U}n.propPivot&&(n.propPivot.rotation.x=t?Math.sin(g*8.5)*.65:Math.sin(g*2)*.12);let J=s==="surprised"||m==="shockedFall"||m==="hitReact"||m==="wakingUp"&&a>.25,Y=J?1.38:s==="angry"||m==="punching"||m==="kicking"?1.18:1;n.leftSclera.scale.set(Y,Y*1.05,.6*Y),n.rightSclera.scale.set(Y,Y*1.05,.6*Y);let Z=s==="confused"||m==="slapForehead"?Math.sin(g*9)*.016:0,se=J?.65:1;if(n.leftPupil.scale.set(se,se,.65),n.rightPupil.scale.set(se,se,.65),n.leftPupil.rotation.y=Z*8,n.rightPupil.rotation.y=-Z*8,m==="sleeping")n.headPivot.rotation.set(.18,n.facingSign*.28,.24);else if(m==="lookInMirror"){let U=Math.sin(a*Math.PI*1.4);n.headPivot.rotation.set(.06,-n.facingSign*(.68+U*.28),U*.08)}else if(m==="eating")n.headPivot.rotation.set(.14+Math.sin(g*5.4)*.12,0,Math.sin(g*2.7)*.08);else if(m==="slapForehead")n.headPivot.rotation.set(.18,n.facingSign*-.1,-.22+Math.sin(g*6.5)*.06);else if(m==="hitReact"){let{recoil:U}=Jn(e,"punching");n.headPivot.rotation.set(-.3*U,n.facingSign*.35*U,n.facingSign*.18*U)}else if(m==="punching"||m==="kicking")n.headPivot.rotation.set(.1,n.facingSign*-.12,0);else if(s==="laughing")n.headPivot.rotation.set(-.18+Math.abs(Math.sin(g*13.5))*.16,n.facingSign*-.06,Math.sin(g*6.8)*.11);else if(s==="angry")n.headPivot.rotation.set(.14+Math.sin(g*22)*.04,n.facingSign*-.14,Math.sin(g*28)*.05);else{let U=t?Math.sin(g*5.2)*.085:Math.sin(g*1.4)*.025,D=s==="confused"?.16:t?Math.sin(g*2.6)*.065:0;n.headPivot.rotation.x=U,n.headPivot.rotation.z=D,n.headPivot.rotation.y=m==="walking"||m==="running"?Math.sin(g*3)*.08:n.facingSign*(t?-.14:.1)}let te=g*.28%1>.955,re=-Math.PI*.48;m==="sleeping"||m==="praying"?re=.26:m==="wakingUp"&&a<.2?re=.24:te?re=.15:s==="laughing"?re=.12:s==="sad"?re=-Math.PI*.28:(J||s==="angry")&&(re=-Math.PI*.64),n.leftEyelid.rotation.x=re,n.rightEyelid.rotation.x=re;let j=.085,xe=t?.012:0,pe=0;J?(xe=.046,pe=-.08):s==="angry"?(xe=-.026,pe=.52):s==="sad"||m==="slapForehead"?(xe=.012,pe=-.26):(s==="laughing"||s==="happy")&&(xe=.038,pe=-.06),n.leftBrow.position.y=j+xe,n.rightBrow.position.y=j+xe,n.leftBrow.rotation.z=Math.PI/2-pe,n.rightBrow.rotation.z=Math.PI/2+pe;let W=t&&i>.028,ue=W?Math.min(1,i*1.45):0,ee=.5+.5*Math.sin(e*24+n.seedOffset),le=W?.12+ue*(.68+.32*ee):.02;m==="sleeping"&&!W?le=.04+.14*Math.max(0,Math.sin(g*2.1)):m==="eating"&&!W?le=.08+.32*Math.max(0,Math.sin(g*5.2)):J&&!t&&a<.42&&(le=.58);let X=W?.88+.34*(1-ee):s==="happy"||s==="laughing"?1.24:.96;if(n.mouthCavity.scale.set(1.12*X,le,.55),n.upperLip.position.y=n.mouthBaseY+le*.024,n.lowerLip.position.y=n.mouthBaseY-le*.048,m==="sleeping")n.leftShoulder.rotation.set(-.2,0,.25),n.leftElbow.rotation.set(-.6,0,-.35),n.rightShoulder.rotation.set(-.2,0,-.25),n.rightElbow.rotation.set(-.6,0,.35);else if(m==="wakingUp"||m==="shockedFall"){let U=Math.sin(g*14)*.22;n.leftShoulder.rotation.set(-1.38+U,.25,.62),n.leftElbow.rotation.set(-.55,0,0),n.rightShoulder.rotation.set(-1.38-U,-.25,-.62),n.rightElbow.rotation.set(-.55,0,0)}else if(m==="praying"||r&&!n.standing)n.leftShoulder.rotation.set(-.95,.25,-.42),n.leftElbow.rotation.set(-1.35,0,-.5),n.rightShoulder.rotation.set(-.95,-.25,.42),n.rightElbow.rotation.set(-1.35,0,.5);else if(m==="slapForehead")n.rightShoulder.rotation.set(-1.85,-.35,.32),n.rightElbow.rotation.set(-1.45,0,.45),n.leftShoulder.rotation.set(-.25,.2,.42),n.leftElbow.rotation.set(-.9,0,-.55);else if(m==="eating"){let U=.5+.5*Math.sin(g*5.2);n.rightShoulder.rotation.set(-.55-U*.78,-.22,.22),n.rightElbow.rotation.set(-.85-U*.72,0,.24),n.leftShoulder.rotation.set(-.32,.15,.22),n.leftElbow.rotation.set(-.85,0,-.2)}else if(m==="walking"||m==="running"){let D=Math.sin(e*(m==="running"?14:7.5))*(m==="running"?.95:.55);n.leftShoulder.rotation.set(-D,.1,.16),n.leftElbow.rotation.set(m==="running"?-1.45:-.45,0,0),n.rightShoulder.rotation.set(D,-.1,-.16),n.rightElbow.rotation.set(m==="running"?-1.45:-.45,0,0)}else if(m==="pointing"){let U=Math.sin(g*8.5)*.14;n.rightShoulder.rotation.set(-1.42+U,-.15*n.facingSign,-.22),n.rightElbow.rotation.set(-.22,0,0),n.leftShoulder.rotation.set(-.25,.18,.42),n.leftElbow.rotation.set(-.95,0,-.48)}else if(m==="punching"){let U=Math.floor(e*Nl.punching.rate),{extend:D}=Jn(e,"punching"),fe=U%2===0,we=fe?n.rightShoulder:n.leftShoulder,Oe=fe?n.rightElbow:n.leftElbow,L=fe?n.leftShoulder:n.rightShoulder,ct=fe?n.leftElbow:n.rightElbow,Ce=fe?-1:1;we.rotation.set(-.9-D*.68,Ce*.18*(1-D),Ce*-.12),Oe.rotation.set(-1.55*(1-D)-.08,0,0),L.rotation.set(-1.05,-Ce*.3,-Ce*.3),ct.rotation.set(-1.75,0,-Ce*.25)}else if(m==="kicking")n.leftShoulder.rotation.set(-1,.3,.38),n.leftElbow.rotation.set(-1.7,0,.25),n.rightShoulder.rotation.set(-.95,-.3,-.38),n.rightElbow.rotation.set(-1.7,0,-.25);else if(m==="hitReact"){let{recoil:U}=Jn(e,"punching"),D=Math.sin(g*15)*.18*U;n.leftShoulder.rotation.set(-.55-U*.75+D,.25,.55+U*.35),n.leftElbow.rotation.set(-.5,0,0),n.rightShoulder.rotation.set(-.55-U*.75-D,-.25,-.55-U*.35),n.rightElbow.rotation.set(-.5,0,0)}else if(m==="cutting"||c==="scissors"){let U=Math.sin(g*8)*.11;n.rightShoulder.rotation.set(-2.06+U,.1,.14),n.rightElbow.rotation.set(-.24+Math.cos(g*16)*.08,0,-.06),n.leftShoulder.rotation.set(-1.76,.18,.18),n.leftElbow.rotation.set(-.42+Math.sin(g*4.8)*.1,0,-.1)}else if(m==="combing"||c==="comb"){let U=Math.sin(g*6.5)*.24;n.rightShoulder.rotation.set(-1.82+U,.12,.18),n.rightElbow.rotation.set(-.48-U*.35,0,-.08),n.leftShoulder.rotation.set(-.4,.12,.2),n.leftElbow.rotation.set(-.85,0,-.2)}else if(m==="removingTowel"){let U=Math.sin(Math.min(1,a*1.35)*Math.PI*.82);n.leftShoulder.rotation.set(-.62-U*.22,.25,.55),n.leftElbow.rotation.set(-.72,0,-.22),n.rightShoulder.rotation.set(-.92-U*.26,-.36,-.68-U*.34),n.rightElbow.rotation.set(-.56,0,.24)}else if(m==="adjustingGlasses"){let U=Math.sin(a*Math.PI);n.rightShoulder.rotation.set(-1.72-U*.25,.18,.38),n.rightElbow.rotation.set(-1.42,0,.28),n.leftShoulder.rotation.set(-.42,.14,.22),n.leftElbow.rotation.set(-.9,0,-.22)}else if(m==="spraying"||c==="sprayBottle"){let U=Math.sin(g*14)*.12;n.rightShoulder.rotation.set(-1.58+U,.14,.18),n.rightElbow.rotation.set(-.46,0,-.1),n.leftShoulder.rotation.set(-.85,.18,.25),n.leftElbow.rotation.set(-.85,0,-.15)}else if(m==="lookInMirror"){let U=Math.sin(g*6)*.12;n.leftShoulder.rotation.set(-1.78+U,.25,.28),n.leftElbow.rotation.set(-1.55,0,-.2),n.rightShoulder.rotation.set(-1.78-U,-.25,-.28),n.rightElbow.rotation.set(-1.55,0,.2)}else if(m==="callingPhone"||c==="phone")n.rightShoulder.rotation.set(-1.08,-.22,.25),n.rightElbow.rotation.set(-1.95,0,.25),n.leftShoulder.rotation.set(-.38,.14,.2),n.leftElbow.rotation.set(-.88,0,-.22);else if(m==="showingKey"||c==="key"){let U=Math.sin(g*6.5)*.18;n.rightShoulder.rotation.set(-1.28,-.15,-.18+U),n.rightElbow.rotation.set(-.42,0,0),n.leftShoulder.rotation.set(-.32,.12,.2),n.leftElbow.rotation.set(-.85,0,-.22)}else if(m==="bangingGavel"||c==="gavel"){let U=Math.pow(Math.max(0,Math.sin(g*7.2)),3);n.rightShoulder.rotation.set(-.65-U*.85,-.15,-.18),n.rightElbow.rotation.set(-.85+U*.45,0,0),n.leftShoulder.rotation.set(-.35,.14,.22),n.leftElbow.rotation.set(-.85,0,-.22)}else if(m==="holdingMic"||c==="mic"){let U=t?Math.sin(g*5.2)*.08:0;n.rightShoulder.rotation.set(-.92+U,-.25,.28),n.rightElbow.rotation.set(-1.62,0,.22),n.leftShoulder.rotation.set(-.42,.18,.22),n.leftElbow.rotation.set(-.9,0,-.22)}else if(m==="examining"||c==="stethoscope"||c==="syringe"){let U=Math.sin(g*4.5)*.16;n.rightShoulder.rotation.set(-1.18+U,-.16,-.22),n.rightElbow.rotation.set(-.55-U*.4,0,0),n.leftShoulder.rotation.set(-.38,.15,.2),n.leftElbow.rotation.set(-.88,0,-.2)}else if(m==="stirring"||c==="ladle"){let U=Math.sin(g*7)*.26,D=Math.cos(g*7)*.18;n.rightShoulder.rotation.set(-.95+D,-.18+U,-.24),n.rightElbow.rotation.set(-.78-D*.5,0,U*.5),n.leftShoulder.rotation.set(-.35,.15,.24),n.leftElbow.rotation.set(-.88,0,-.2)}else if(m==="sipping"||c==="teacup"){let U=.5+.5*Math.sin(g*3.8);n.rightShoulder.rotation.set(-.68-U*.52,-.18,.22),n.rightElbow.rotation.set(-1.05-U*.65,0,.18),n.leftShoulder.rotation.set(-.34,.12,.2),n.leftElbow.rotation.set(-.85,0,-.22)}else if(m==="aarti"||c==="diya"){let U=Math.cos(g*3.6)*.26,D=Math.sin(g*3.6)*.28;n.rightShoulder.rotation.set(-1.15+D,-.15,-.18+U),n.rightElbow.rotation.set(-.65,0,0),n.leftShoulder.rotation.set(-.52,.2,.3),n.leftElbow.rotation.set(-1.1,0,-.35)}else if(m==="playingFlute"||c==="flute")n.rightShoulder.rotation.set(-1.15,-.28,.35),n.rightElbow.rotation.set(-1.75,0,.28),n.leftShoulder.rotation.set(-1.08,.28,-.15),n.leftElbow.rotation.set(-1.65,0,.22);else if(m==="sweeping"||c==="broom"){let U=Math.sin(g*6)*.38;n.rightShoulder.rotation.set(-.65,-.15,-.22+U),n.rightElbow.rotation.set(-.8,0,U*.4),n.leftShoulder.rotation.set(-.55,.15,.22+U*.5),n.leftElbow.rotation.set(-.85,0,0)}else if(m==="dancing"||m==="adaab"||m==="sufiSpin"){let D=Fh(g,E?"viralBounce":"sufiKathak",m,n.facingSign<0,0);n.leftShoulder.rotation.set(D.leftShoulder[0],D.leftShoulder[1],D.leftShoulder[2]),n.leftElbow.rotation.set(D.leftElbow[0],D.leftElbow[1],D.leftElbow[2]),n.rightShoulder.rotation.set(D.rightShoulder[0],D.rightShoulder[1],D.rightShoulder[2]),n.rightElbow.rotation.set(D.rightElbow[0],D.rightElbow[1],D.rightElbow[2]),n.torsoGroup.rotation.y+=(D.torsoRotY-n.torsoGroup.rotation.y)*.35,n.headPivot.rotation.z+=(D.headRotZ-n.headPivot.rotation.z)*.35}else if(m==="jumping"){let U=Math.sin(g*8.5)*.48;n.leftShoulder.rotation.set(-1.4+U,.2,.48),n.leftElbow.rotation.set(-.6,0,.2),n.rightShoulder.rotation.set(-1.4-U,-.2,-.48),n.rightElbow.rotation.set(-.6,0,-.2)}else if(t)if(s==="surprised")n.leftShoulder.rotation.set(-1.3,.2,.55),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.35,-.2,-.55),n.rightElbow.rotation.set(-.65,0,0);else if(s==="angry"){let U=Math.sin(g*16)*.26;n.leftShoulder.rotation.set(-1.25+U,.25,.38),n.leftElbow.rotation.set(-1.28,0,-.24),n.rightShoulder.rotation.set(-1.25-U,-.25,-.38),n.rightElbow.rotation.set(-1.28,0,.24)}else if(s==="laughing"){let U=Math.sin(g*14)*.24;n.leftShoulder.rotation.set(-1.05+U*.5,.22,.32),n.leftElbow.rotation.set(-.52,0,-.12),n.rightShoulder.rotation.set(-.58+U,-.22,-.28),n.rightElbow.rotation.set(-1.25-U*.4,0,-.32)}else{let U=Math.sin(g*4.8)*.32,D=Math.cos(g*3.9)*.24;n.rightShoulder.rotation.set(-.85+U,-.2,-.26),n.rightElbow.rotation.set(-.95+D,0,0),n.leftShoulder.rotation.set(-.42+D*.4,.15,.18),n.leftElbow.rotation.set(-.85,0,-.15)}else n.leftShoulder.rotation.set(-.32,.12,.18),n.leftElbow.rotation.set(-.85,0,-.25),n.rightShoulder.rotation.set(-.32,-.12,-.18),n.rightElbow.rotation.set(-.85,0,.25);if(H){let U=n.auraRing.material,D=n.auraDisc.material;U.opacity=t?.55+.15*Math.sin(g*5):.18,D.opacity=t?.22:.06;let fe=t?1.08+.06*Math.sin(g*4.5):.92;n.auraRing.scale.setScalar(fe)}if(n.haloGroup&&n.haloMaterial&&(n.haloGroup.visible=n.hasFloorAura!==!1,n.haloGroup.rotation.z=e*.45,n.haloMaterial.opacity=n.role==="Divine"?.72:t?.42:.18),n.pedestalGlow){let U=n.pedestalGlow.material;U.opacity=t?.48:.22}}var Uh=(n,e,t)=>n+(e-n)*t,Bh=n=>{let e=Math.max(0,Math.min(1,n));return e*e*(3-2*e)};function Fh(n,e,t="dancing",i=!1,s=0){let r=i?-1:1;if(e==="viralBounce"){let g=Math.abs(Math.sin(n*7.2)),m=Math.sin(n*3.6);return{hipOffsetX:m*.14*r,liftY:Math.pow(g,2.4)*.06,bodyRotY:Math.sin(n*1.8)*.24*r,bodyRotZ:m*.08*r,torsoRotX:.06+g*.06,torsoRotY:-m*.14*r,torsoRotZ:-m*.07*r,headRotZ:m*.1*r,leftHipX:-g*.24+m*.16,rightHipX:-g*.24-m*.16,leftKneeX:g*.44,rightKneeX:g*.44,leftShoulder:[-.95+m*.55,.22*r,.52*r],leftElbow:[-.85+g*.35,0,.22*r],rightShoulder:[-.95-m*.55,-.22*r,-.52*r],rightElbow:[-.85+g*.35,0,-.22*r]}}let o=e==="bhangra"?1.32:.92,a=n*o%4,l=t==="adaab"?0:t==="sufiSpin"?3:Math.floor(a),c=t==="dancing"?a-Math.floor(a):n*o%1,h=s>0?Math.pow(1-s,2)*.16:Math.abs(Math.sin(n*Math.PI*o*2))*.14,u=Math.sin(c*Math.PI*2);if(l===0){let g=Bh(Math.sin(c*Math.PI));return{hipOffsetX:-.09*r*g,liftY:0,bodyRotY:.16*r*g,bodyRotZ:.04*r*g,torsoRotX:.09*g,torsoRotY:-.12*r*g,torsoRotZ:-.07*r*g,headRotZ:.1*r*g,leftHipX:-.14-h*.25,rightHipX:-.06-h*.15,leftKneeX:.24+h*.55,rightKneeX:.12+h*.35,leftShoulder:[-.78*g-.24,.28*r,(.42+.18*g)*r],leftElbow:[-.48-.28*g,0,-.18*r],rightShoulder:[Uh(-.45,-1.42,g),-.32*r,(-.36-.16*g)*r],rightElbow:[Uh(-.55,-1.28,g),0,.24*g*r]}}if(l===1){let g=Math.sin(c*Math.PI*2);return{hipOffsetX:g*.15*r,liftY:0,bodyRotY:g*.22*r,bodyRotZ:g*.05*r,torsoRotX:.05,torsoRotY:-g*.22*r,torsoRotZ:-g*.09*r,headRotZ:g*.14*r,leftHipX:-.16+Math.max(0,g)*.18,rightHipX:-.16+Math.max(0,-g)*.18,leftKneeX:.26+Math.abs(g)*.24+h,rightKneeX:.26+Math.abs(g)*.24+h,leftShoulder:[-1.18+g*.52,.32*r,(.58+g*.32)*r],leftElbow:[-.72+Math.cos(c*Math.PI*2)*.35,0,.26*r],rightShoulder:[-1.18-g*.52,-.32*r,(-.58+g*.32)*r],rightElbow:[-.72-Math.cos(c*Math.PI*2)*.35,0,-.26*r]}}if(l===2){let g=u,m=e==="bhangra"?.35:0;return{hipOffsetX:g*.16*r,liftY:e==="bhangra"?Math.max(0,Math.abs(g)-.6)*.12:0,bodyRotY:g*.2*r,bodyRotZ:g*.06*r,torsoRotX:.08+h*.25,torsoRotY:-g*.18*r,torsoRotZ:-g*.07*r,headRotZ:g*.11*r,leftHipX:-.12+g*.28,rightHipX:-.12-g*.28,leftKneeX:.2+Math.max(0,-g)*.48+h,rightKneeX:.2+Math.max(0,g)*.48+h,leftShoulder:[-1.45-m+g*.38,.24*r,(.64+g*.24)*r],leftElbow:[-.88+g*.24,0,.18*r],rightShoulder:[-1.05-m-g*.42,-.24*r,(-.52+g*.24)*r],rightElbow:[-.88-g*.24,0,-.18*r]}}let p=Bh(c),f=Math.sin(p*Math.PI);return{hipOffsetX:Math.sin(p*Math.PI)*.08*r,liftY:e==="bhangra"?f*.08:0,bodyRotY:p*Math.PI*2*r,bodyRotZ:.04*r*f,torsoRotX:-.05*f,torsoRotY:0,torsoRotZ:0,headRotZ:-.08*r*f,leftHipX:-.12,rightHipX:-.12,leftKneeX:.22+h*.4,rightKneeX:.22+h*.4,leftShoulder:[-1.55-.35*f,.28*r,(.68+.32*f)*r],leftElbow:[-.42-.22*f,0,.24*r],rightShoulder:[-1.55-.35*f,-.28*r,(-.68-.32*f)*r],rightElbow:[-.42-.22*f,0,-.24*r]}}function gm(n,e=0){let t=xm(n);n.bodyPivot.position.y=0,n.bodyPivot.updateMatrixWorld(!0);let i=1/0;for(let r of[t.left,t.right])r&&(r.getWorldPosition(Gl),n.root.worldToLocal(Gl),i=Math.min(i,Gl.y));let s=Number.isFinite(i)?Math.max(-.55,Math.min(.45,-i)):0;n.bodyPivot.position.y=s+Math.max(0,Math.min(.6,e))}var ey=new I(0,-1,0),ty=new I(0,1,0),Em=new I(1,0,0),ny=new At,iy=new At().setFromAxisAngle(Em,-.3),sy=new At().setFromEuler(new Qt(-.1,0,-.18)),ry=new At().setFromEuler(new Qt(-.1,0,.18)),oy=new At().setFromEuler(new Qt(-.25,0,0)),ay=new At,ly=new At,cy=new At,hy=new At,uy=new At,dy=new At,fy=new I,py=new I,my=new I,gy=new I,Ey=new I,Gl=new I,xy=new pt,Nh=new WeakMap;function xm(n){let e=Nh.get(n);if(!e){let t=(i,s)=>{let r=s??i;if(!r)return null;let o=new Tt;return o.position.set(0,s?-.323:-.39,.04),r.add(o),o};e={left:t(n.leftHip,n.leftKnee),right:t(n.rightHip,n.rightKnee)},Nh.set(n,e)}return e}function kh(n){let e=n.width/n.height,t=n.height>n.width,i=t?37:36,s=new Dt(i,e,.1,100),r=t?4.65:4.8,o=t?1.24:1.05,a=t?1.04:.92;return s.position.set(0,o,r),s.lookAt(0,a,0),{camera:s,currentPos:new I(0,o,r),currentLook:new I(0,a,0),baseFov:i}}function zh(n,e,t,i,s,r,o,a,l,c="auto",h="none",u=!1,p=.5,f=1.38,g="Auto"){let m=e.height>e.width,E=g==="PalaceCourt",d=E?m?5.95:5.45:m?4.65:4.8,_=E?m?1.32:1.18:m?1.24:1.05,M=E?m?1.04:.96:m?1.04:.92;if(e.stageLayout?.templateBackdrop){n.camera.position.set(0,_,d),n.camera.lookAt(0,M,0);return}let x=(r+o)*.45,b=_,R=d,A=(r+o)*.48,C=M,w=(r+o)*.5;if(!e.enableDynamicCamera||l){let se=l?Math.min(1,t/2.6)*.45:0;R=d-se,b=_+(l?(1-Math.min(1,t/2.6))*.25:0)}else i>.88?(R=d+.35,b=_+.12):s==="Left"?(x=w*.72+r*.28,R=d*.92,b=_+.03,A=w*.65+r*.35,C=M+.05):s==="Right"&&(x=w*.72+o*.28,R=d*.92,b=_+.03,A=w*.65+o*.35,C=M+.05);let v=!!e.isComedyMode,H=Math.sin(t*(v?1.8:.9))*(v?.045:.03),z=Math.cos(t*(v?1.4:.7))*(v?.032:.02),G=0;if(a==="surprised"||a==="angry"){let se=v&&c==="auto"&&!l&&s!=="Narrator"&&h!=="cutting"&&h!=="lookInMirror";if(R*=v?a==="angry"&&se?.66:.72:.93,v){let B=s==="Left"?r:s==="Right"?o:w;se&&a==="angry"?(x=w*.4+B*.6,A=w*.25+B*.75,C=Math.max(m?1.08:1.18,f*.94)):(x=w*.65+B*.35,A=w*.55+B*.45,C=m?1.08:1.18),b=m?1.24:1.25,G=Math.sin(t*5.2)*(a==="angry"?.045:-.035)}H+=Math.sin(t*28)*(v?.042:.02),z+=Math.cos(t*33)*(v?.032:.015)}else v&&a==="laughing"&&(R*=.82,z+=Math.abs(Math.sin(t*9.5))*.035,G=Math.sin(t*7.5)*.024);E&&(R=Math.max(R,m?5.65:5.05),b=Math.max(b,_),C=Math.min(C,1.04));let J=!!e.stageLayout?.templateBackdrop;if(!J&&!l&&!E){let se=s==="Left"?r:s==="Right"?o:(r+o)*.5;if(c==="closeUpSpeaker"&&s!=="Narrator")x=se,b=Math.max(m?1.08:.92,f*.98),R=m?2.68:2.55,A=se,C=Math.max(.76,f*.88);else if(c==="crashPunch"&&s!=="Narrator"){let B=Math.max(0,1-Math.min(1,p/.28));x=se,b=Math.max(m?1.08:.92,f*.98),R=(m?2.48:2.35)-B*.28,A=se,C=Math.max(.78,f*.88),G+=Math.sin(t*28)*.025*B,H+=Math.cos(t*42)*.028*B,z+=Math.sin(t*36)*.022*B}else if(c==="twoShot")x=w,b=m?1.2:1.18,R=m?3.35:3.05,A=w,C=m?1.05:1;else if(c==="reactionZoom"){let B=se*.65+w*.35;x=B*.9,b=m?1.22:1.26,R=m?2.85:2.45,A=B,C=Math.max(m?1.06:1.14,f*.94)}else if(c==="wideEstablishing")x=(r+o)*.25,b=m?1.32:1.44,R=m?4.85:4.45,A=(r+o)*.35,C=m?1.02:.92;else if(c==="lowDramatic")x=se*.45,b=m?.92:.68,R=m?2.85:2.95,A=se*.8,C=Math.max(1.12,f*.9);else if(c==="overShoulder"&&s!=="Narrator"){let B=s==="Left"?o:r;x=m?(r+o)*.45:B*.9,b=m?1.24:1.38,R=m?3.25:2.75,A=m?se*.68+B*.32:se,C=Math.max(m?1.04:.9,f*.92)}(h==="walking"||h==="running")&&(x=se*.65,A=se*.85)}let Y=new I(x+H,b+z,R),Z=new I(A,C,0);if(e.isSeamlessLoop){let se=new I(0,_,d),B=new I(0,M,0);if(i>.86){let te=Math.min(1,(i-.86)/.14);Y.lerp(se,te),Z.lerp(B,te),G*=1-te}else if(i<.06){let te=1-i/.06;Y.lerp(se,te),Z.lerp(B,te),G*=1-te}}if(u&&!J&&(v||c==="crashPunch"||c==="closeUpSpeaker"))n.currentPos.lerp(Y,.94),n.currentLook.lerp(Z,.94);else{let B=1-Math.exp(-(v?13:c==="wideEstablishing"?4.2:6.4)/Math.max(1,e.fps));n.currentPos.lerp(Y,B),n.currentLook.lerp(Z,B)}n.camera.position.copy(n.currentPos),n.camera.lookAt(n.currentLook),n.camera.rotation.z+=G}var lr=class n extends y{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new Dt;let i=this,s=t.color!==void 0?new De(t.color):new De(8355711),r=t.textureWidth||512,o=t.textureHeight||512,a=t.clipBias||0,l=t.shader||n.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new gn,u=new I,p=new I,f=new I,g=new pt,m=new I(0,0,-1),E=new dt,d=new I,_=new I,M=new dt,x=new pt,b=this.camera,R=new En(r,o,{samples:c,type:di}),A=new zt({name:l.name!==void 0?l.name:"unspecified",uniforms:ia.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});A.uniforms.tDiffuse.value=R.texture,A.uniforms.color.value=s,A.uniforms.textureMatrix.value=x,this.material=A,this.onBeforeRender=function(C,w,v){if(p.setFromMatrixPosition(i.matrixWorld),f.setFromMatrixPosition(v.matrixWorld),g.extractRotation(i.matrixWorld),u.set(0,0,1),u.applyMatrix4(g),d.subVectors(p,f),d.dot(u)>0===!0&&this.forceUpdate===!1)return;d.reflect(u).negate(),d.add(p),g.extractRotation(v.matrixWorld),m.set(0,0,-1),m.applyMatrix4(g),m.add(f),_.subVectors(p,m),_.reflect(u).negate(),_.add(p),b.position.copy(d),b.up.set(0,1,0),b.up.applyMatrix4(g),b.up.reflect(u),b.lookAt(_),b.far=v.far,b.updateMatrixWorld(),b.projectionMatrix.copy(v.projectionMatrix),x.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),x.multiply(b.projectionMatrix),x.multiply(b.matrixWorldInverse),x.multiply(i.matrixWorld),h.setFromNormalAndCoplanarPoint(u,p),h.applyMatrix4(b.matrixWorldInverse),E.set(h.normal.x,h.normal.y,h.normal.z,h.constant);let z=b.projectionMatrix;M.x=(Math.sign(E.x)+z.elements[8])/z.elements[0],M.y=(Math.sign(E.y)+z.elements[9])/z.elements[5],M.z=-1,M.w=(1+z.elements[10])/z.elements[14],E.multiplyScalar(2/E.dot(M)),z.elements[2]=E.x,z.elements[6]=E.y,z.elements[10]=E.z+1-a,z.elements[14]=E.w,i.visible=!1;let G=C.getRenderTarget(),J=C.xr.enabled,Y=C.shadowMap.autoUpdate;C.xr.enabled=!1,C.shadowMap.autoUpdate=!1,C.setRenderTarget(R),C.state.buffers.depth.setMask(!0),C.autoClear===!1&&C.clear(),C.render(w,b),C.xr.enabled=J,C.shadowMap.autoUpdate=Y,C.setRenderTarget(G);let Z=v.viewport;Z!==void 0&&C.state.viewport(Z),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return R},this.dispose=function(){R.dispose(),i.material.dispose()}}};lr.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function ym(n,e){let t=new De(e.topBackdropHex),i=new De(e.midBackdropHex),s=new De(e.botBackdropHex);return n==="Night"?(t.lerp(new De(395545),.72),i.lerp(new De(1252674),.72),s.lerp(new De(658716),.72),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:10859772,sunIntensity:1.05,fogDensity:.055}):n==="Sunset"?(t.lerp(new De(3216445),.65),i.lerp(new De(12732717),.65),s.lerp(new De(2625560),.65),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16754268,sunIntensity:1.75,fogDensity:.042}):n==="Day"?(t.lerp(new De(3718648),.55),i.lerp(new De(9684477),.55),s.lerp(new De(1981023),.55),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16774624,sunIntensity:2,fogDensity:.025}):(t.lerp(new De(1970486),.48),i.lerp(new De(12076580),.42),s.lerp(new De(1707800),.48),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16764807,sunIntensity:1.85,fogDensity:.036})}function sn(n,e,t,i,s,r,o){let a=new F({color:14251782,metalness:.8,roughness:.25}),l=new y(new ot(.11,.07,14),a);l.rotation.x=Math.PI,l.position.set(e,t+.035,i),n.add(l);let c=new y(new ot(.032,.1,10),new ke({color:16768875}));c.position.set(e,t+.11,i),n.add(c);let h=new y(new Ie(.11,10,8),new ke({color:16752412,transparent:!0,opacity:.3,depthWrite:!1}));if(h.position.set(e,t+.11,i),n.add(h),r.animatedProps.push({object:c,kind:"diya",baseY:t+.11,phase:s,speed:7.5}),o){let u=new Vt(16752440,1.4,5.5,1.6);u.position.set(e,t+.22,i),n.add(u),r.ambientFireLights.push({light:u,baseIntensity:1.4,phase:s})}}function cr(n,e,t,i,s,r,o){let a=new ge;a.position.set(e,0,t);let l=new F({color:4861725,roughness:.85}),c=new y(new be(.08*i,.15*i,1.5*i,10),l);c.position.y=.75*i,c.castShadow=!0,a.add(c);let h=new F({color:s,roughness:.72}),u=[[0,1.65,0,.65],[-.36,1.42,.15,.48],[.38,1.45,-.1,.48],[0,1.95,.08,.44]];for(let[p,f,g,m]of u){let E=new y(new Ys(m*i,1),h);E.position.set(p*i,f*i,g*i),E.castShadow=!0,E.receiveShadow=!0,a.add(E)}n.add(a),o.animatedProps.push({object:a,kind:"sway",baseRotZ:0,phase:r,speed:1.1})}function Mm(n,e){let t=new F({color:7027244,roughness:.78}),i=new F({color:16103470,metalness:.82,roughness:.25}),s=new y(new be(5.5,5.8,.25,36),t);s.position.y=-.125,s.receiveShadow=!0,n.add(s);let r=new y(new In(1.4,1.55,48),new ke({color:16103470,transparent:!0,opacity:.45,side:xt}));r.rotation.x=-Math.PI/2,r.position.y=.01,n.add(r);for(let M of[-2.4,-1.65,1.65,2.4]){let x=Math.abs(M)>2?-1.4:-2.6,b=new y(new be(.14,.18,3.6,12),t);b.position.set(M,1.8,x),b.castShadow=!0,b.receiveShadow=!0,n.add(b);let R=new y(new be(.24,.16,.18,12),i);R.position.set(M,3.5,x),n.add(R)}let o=new y(new oe(1.5,.9,1.5),t);o.position.set(0,.45,-4.8),n.add(o);for(let M=0;M<3;M++){let x=1.25-M*.28,b=new y(new oe(x,.48,x),t);b.position.set(0,1.1+M*.46,-4.8),n.add(b)}let a=new y(new Ie(.16,12,10),i);a.position.set(0,2.38,-4.8),n.add(a);let l=new y(new ot(.08,.24,12),i);l.position.set(0,2.6,-4.8),n.add(l);for(let[M,x]of[[-1.35,0],[1.35,1.3]]){let b=new ge;b.position.set(M,3.35,-.6);let R=new y(new be(.014,.014,.65,8),i);R.position.y=-.32,b.add(R);let A=new y(new ot(.16,.25,16,1,!0),i);A.position.y=-.72,A.castShadow=!0,b.add(A),n.add(b),e.animatedProps.push({object:b,kind:"bell",baseRotZ:0,phase:x,speed:1.5})}let c=new ge;c.position.set(0,1.85,-3.1);let h=new y(new Qe(1.15,.025,10,48),i),u=new y(new Qe(.82,.022,10,36),i);c.add(h,u),n.add(c),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.35}),e.animatedProps.push({object:u,kind:"ring",phase:1.4,speed:-.52}),sn(n,-1.25,0,-.5,.2,e,!0),sn(n,1.25,0,-.5,1.9,e,!0),sn(n,-.45,0,-1.4,3.1,e,!1),sn(n,.45,0,-1.4,4.4,e,!1);let p=new ge;p.position.set(0,0,-1.58);let f=new F({color:1974316,metalness:.35,roughness:.22}),g=new y(new be(.42,.5,.26,24),t);g.position.y=.13,g.castShadow=!0,g.receiveShadow=!0,p.add(g);let m=new y(new Qe(.32,.06,10,24),i);m.rotation.x=Math.PI/2,m.position.y=.27,p.add(m);let E=new y(new bt(.16,.36,12,20),f);E.position.y=.5,E.castShadow=!0,p.add(E);for(let M of[.54,.58,.62]){let x=new y(new oe(.14,.015,.02),new ke({color:16708551}));x.position.set(0,M,.155),p.add(x)}let d=new F({color:16347926,roughness:.55});for(let M=0;M<10;M++){let x=M/10*Math.PI*2,b=new y(new Ie(.055,8,6),d);b.position.set(Math.cos(x)*.28,.3,Math.sin(x)*.28),p.add(b)}let _=new Vt(16758605,1.9,4.5,1.5);_.position.set(0,1.05,.25),p.add(_),n.add(p)}function _m(n,e){let t=new F({color:2507300,roughness:.92}),i=new y(new Lt(9,40),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new ge;s.position.set(.1,0,-3.2);let r=new y(new be(.95,1,1.05,18),new F({color:10251846,roughness:.85}));r.position.y=.52,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new y(new ot(1.38,.95,20),new F({color:12558414,roughness:.9}));o.position.y=1.42,o.castShadow=!0,s.add(o);let a=new y(new rt(.42,.65),new ke({color:16758605}));a.position.set(0,.34,.96),s.add(a),n.add(s),cr(n,-2.1,-1.8,1.45,3108407,.3,e),cr(n,2.2,-1.9,1.38,3635775,1.6,e),cr(n,-1.65,-3.9,1.65,2314793,2.8,e),cr(n,1.75,-4.1,1.55,2711344,4.1,e),sn(n,0,0,-1.4,.5,e,!0)}function vm(n,e){let t=new F({color:6047544,roughness:.8}),i=new y(new oe(8,.3,2.6),t);i.position.set(0,-.15,0),i.receiveShadow=!0,n.add(i);let s=new y(new oe(8,.2,.8),t);s.position.set(0,-.25,-1.6),n.add(s);let r=new F({color:1265263,metalness:.68,roughness:.22}),o=new y(new rt(18,10,24,16),r);o.rotation.x=-Math.PI/2,o.position.set(0,-.32,-6.5),o.receiveShadow=!0,n.add(o),e.animatedProps.push({object:o,kind:"water",phase:0,speed:1.8}),sn(n,-1.1,0,-.9,.4,e,!0),sn(n,1.1,0,-.9,2.1,e,!0),sn(n,-.6,-.3,-2.5,3.4,e,!1),sn(n,.7,-.3,-3.3,4.9,e,!1)}function wm(n,e,t){let i=new F({color:1053482,metalness:.7,roughness:.24}),s=new y(new be(5.5,5.5,.2,48),i);s.position.y=-.1,s.receiveShadow=!0,n.add(s);let r=new ke({color:t,transparent:!0,opacity:.75}),o=new F({color:16498468,metalness:.85,roughness:.2}),a=new ge;a.position.set(0,2.05,-3.3);let l=new y(new Qe(1.58,.032,10,64),o),c=new y(new Qe(1.16,.026,10,48),r),h=new y(new Qe(.76,.022,10,48),o);c.rotation.x=.7,h.rotation.y=.55;let u=new y(new Ie(.28,20,16),new ke({color:16638023}));a.add(l,c,h,u),n.add(a);let p=new Vt(16498468,3,9,1.4);p.position.set(0,2.1,-2.5),n.add(p),e.ambientFireLights.push({light:p,baseIntensity:3,phase:.3}),e.animatedProps.push({object:l,kind:"ring",phase:.2,speed:.35}),e.animatedProps.push({object:c,kind:"ring",phase:1.5,speed:-.55}),e.animatedProps.push({object:h,kind:"ring",phase:.9,speed:.48});let f=new ge;f.position.set(0,2.75,-2.8);let g=new ke({color:16774589,transparent:!0,opacity:0}),m=new y(new xn(.18,0),g),E=new y(new ot(.95,3.6,24,1,!0),new ke({color:16770180,transparent:!0,opacity:0,side:xt,depthWrite:!1,blending:Dn}));E.position.y=-1.6,f.add(m,E),n.add(f),e.poleStarGroup=f,e.poleStarMat=E.material}function Tm(n,e){let t=new F({color:6371360,roughness:.45,metalness:.1}),i=new y(new be(5.2,5.4,.25,40),t);i.position.y=-.125,i.receiveShadow=!0,n.add(i);let s=new y(new oe(8.5,4.5,.25),new F({color:4528676,roughness:.85}));s.position.set(0,2.1,-3.5),s.receiveShadow=!0,n.add(s);let r=new F({color:10033947,roughness:.8});for(let f of[-1,1])for(let g=0;g<3;g++){let m=new y(new be(.24,.28,4.4,12),r);m.position.set(f*(2.2+g*.36),2.1,-2.8+g*.12),m.castShadow=!0,n.add(m)}let o=new F({color:14870768,metalness:.92,roughness:.15}),a=new y(new be(.016,.024,1.18,8),o);a.position.set(0,.59,.58),a.castShadow=!0,n.add(a);let l=new y(new be(.14,.15,.04,16),o);l.position.set(0,.02,.58),n.add(l);let c=new y(new Ie(.055,12,10),o);c.position.set(0,1.21,.58),n.add(c);let h=new y(new Qe(.65,.028,10,40),new ke({color:16486972}));h.position.set(0,2.25,-3.3),n.add(h);let u=new Ai(16638023,4.2,12,.42,.55,1.2);u.position.set(-1.6,4.2,2.2),n.add(u,u.target),e.animatedProps.push({object:u,kind:"spotlight",phase:0,speed:1.3});let p=new Ai(16020150,3.6,12,.42,.55,1.2);p.position.set(1.6,4.2,2.2),n.add(p,p.target),e.animatedProps.push({object:p,kind:"spotlight",phase:1.7,speed:1.5})}function Sm(n,e){let t=new F({color:2959666,roughness:.9}),i=new y(new rt(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new F({color:8145446,roughness:.72}),r=new ge;r.position.set(0,0,-2);let o=new y(new oe(2.1,.85,.7),s);o.position.y=.425,o.castShadow=!0,o.receiveShadow=!0,r.add(o);for(let p of[-.98,.98]){let f=new y(new oe(.08,2.15,.08),s);f.position.set(p,1.075,-.25),r.add(f)}let a=new y(new oe(2.4,.08,1.1),new F({color:14251782,roughness:.75}));a.position.set(0,2.15,.05),a.rotation.x=.2,a.castShadow=!0,r.add(a);let l=new F({color:16096779,metalness:.75,roughness:.25}),c=new y(new Ie(.14,14,12),l);c.position.set(-.35,.98,.05),r.add(c);let h=new F({color:11817737,roughness:.85});for(let p of[.1,.28,.46]){let f=new y(new be(.05,.035,.09,12),h);f.position.set(p,.9,.08),r.add(f)}for(let p=0;p<4;p++){let f=new y(new Ie(.06,8,8),new ke({color:16708551,transparent:!0,opacity:.28,depthWrite:!1}));f.position.set(-.35+p%2*.06,1.18+p*.14,.05),r.add(f),e.animatedProps.push({object:f,kind:"steam",baseY:1.16,phase:p*1.4,speed:1.8})}e.spots.counter={x:.25,y:0,z:-.9,rotY:.12};let u=new Vt(16758605,2.6,7,1.5);u.position.set(0,1.88,.25),r.add(u),e.ambientFireLights.push({light:u,baseIntensity:2.6,phase:.4}),n.add(r)}function bm(n,e){let t=new y(new Lt(9,32),new F({color:13358561,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new F({color:3359061,roughness:.82}),s=new F({color:15857145,roughness:.55}),r=[[-2.4,-4.5,2.6,1.8],[0,-5.6,3.8,2.3],[2.5,-4.4,2.4,1.7]];for(let[o,a,l,c]of r){let h=new y(new ot(c,l,7),i);h.position.set(o,l*.5-.1,a),n.add(h);let u=new y(new ot(c*.45,l*.42,7),s);u.position.set(o,l*.78-.1,a),n.add(u)}sn(n,0,0,-1.1,.8,e,!0)}function Rm(n,e){let t=new F({color:15127221,roughness:.72}),i=new F({color:13284758,roughness:.58}),s=new F({color:16041038,metalness:.85,roughness:.22}),r=new F({color:7017510,roughness:.8}),o=new F({color:2822922,emissive:14251782,emissiveIntensity:.42,roughness:.6}),a=new y(new Lt(10.5,48),i);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,n.add(a);let l=new y(new oe(8.8,.06,5.2),t);l.position.set(0,-.02,-.6),l.receiveShadow=!0,n.add(l);let c=new y(new oe(3.75,.016,2.35),s);c.position.set(0,.012,.15),c.receiveShadow=!0,n.add(c);let h=new y(new oe(3.45,.022,2.08),r);h.position.set(0,.015,.15),h.receiveShadow=!0,n.add(h);let u=new y(new oe(10.8,4.4,.28),i);u.position.set(0,2.2,-3.55),u.receiveShadow=!0,n.add(u);let p=new y(new oe(10.4,.24,.72),t);p.position.set(0,.12,-2.55),p.receiveShadow=!0,n.add(p);let f=[-3.6,-1.25,1.25,3.6];for(let E of f){let d=new y(new oe(.42,.34,.42),t);d.position.set(E,.26,-2.55),d.castShadow=!0,n.add(d);let _=new y(new be(.15,.17,2.75,14),t);_.position.set(E,1.78,-2.55),_.castShadow=!0,n.add(_);let M=new y(new oe(.46,.22,.46),s);M.position.set(E,3.2,-2.55),n.add(M)}let g=[-2.42,0,2.42];for(let E=0;E<g.length;E++){let d=g[E],_=E===1?2.42:2.28,M=new y(new oe(_,.65,.26),t);M.position.set(d,3.55,-2.55),M.castShadow=!0,n.add(M);let x=new y(new Qe(.88,.065,8,20,Math.PI),t);x.position.set(d,2.52,-2.52),n.add(x);let b=new y(new oe(1.18,1.72,.08),s);b.position.set(d,1.56,-3.38),n.add(b);let R=new y(new oe(1.02,1.56,.1),o);R.position.set(d,1.56,-3.35),n.add(R);for(let C of[-1,1]){let w=new y(new be(.09,.14,1.95,10),r);w.position.set(d+C*.54,1.55,-3.28),w.rotation.z=C*.06,n.add(w)}let A=new y(new oe(1.22,.56,.12),o);A.position.set(d,3.12,-3.32),n.add(A)}let m=[-2.18,2.18];for(let E=0;E<m.length;E++){let d=m[E],_=-.35,M=new ge;M.position.set(d,0,_);let x=new y(new be(.1,.22,.16,14),s);x.position.y=.08,M.add(x);let b=new y(new be(.025,.036,1.18,10),s);b.position.y=.74,b.castShadow=!0,M.add(b);for(let[A,C]of[[-.14,0],[.14,0],[0,.12],[0,-.1]]){let w=new y(new be(.042,.024,.05,8),s);w.position.set(A,1.34,C),M.add(w);let v=new y(new ot(.022,.09,8),new ke({color:16707722}));v.position.set(A,1.4,C),M.add(v),e.animatedProps.push({object:v,kind:"diya",phase:E*1.4+A*3,speed:12.5})}let R=new Vt(16757844,1.9,6.2,1.6);R.position.set(0,1.48,0),M.add(R),e.ambientFireLights.push({light:R,baseIntensity:1.9,phase:E*1.7}),n.add(M)}sn(n,-1.65,.24,-2.2,.3,e,!1),sn(n,1.65,.24,-2.2,1.9,e,!0)}function Am(n,e,t,i){if(e==="ModernCity"){let l=new y(new rt(24,24),new F({color:593183,roughness:.35,metalness:.6}));l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new os(20,28,new De(i),1976635);c.position.y=.01,n.add(c);let h=new y(new xn(.55,0),new F({color:i,wireframe:!0,emissive:i,emissiveIntensity:.6}));h.position.set(0,1.9,-2.5),n.add(h),t.animatedProps.push({object:h,kind:"ring",phase:0,speed:.6});return}let s=e==="PalaceCourt"?6038067:e==="Battlefield"?4140322:4535592,r=new y(new Lt(8.5,36),new F({color:s,roughness:.78}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,n.add(r);let o=e==="PalaceCourt"?14264170:e==="Archive"?6898214:7033664,a=new F({color:o,roughness:.72});for(let l of[-2.1,2.1]){let c=new y(new oe(.35,3.4,.35),a);c.position.set(l,1.7,-2.4),c.castShadow=!0,n.add(c)}sn(n,-1.5,0,-1.2,.4,t,!0),sn(n,1.5,0,-1.2,2,t,!0)}function Cm(n,e,t){let i=new F({color:1976635,roughness:.35,metalness:.55}),s=new F({color:t%2===0?2282478:11032055,emissive:959977,emissiveIntensity:.55}),r=new y(new oe(3.8,.22,9.5),i);r.position.set(0,-.11,-1.5),r.receiveShadow=!0,n.add(r);for(let c of[-1.85,1.85]){let h=new y(new oe(.12,.25,9.5),s);h.position.set(c,-.09,-1.5),n.add(h)}let o=[[-1.08,2282478],[1.08,16007006]];for(let c=0;c<o.length;c++){let[h,u]=o[c],p=new ge;p.position.set(h,1.15,-2.5);let f=new y(new Qe(.75,.08,12,32),new F({color:u,emissive:u,emissiveIntensity:.85,roughness:.2}));p.add(f);let g=new y(new Lt(.7,24),new ke({color:u,transparent:!0,opacity:.24,side:xt}));p.add(g),n.add(p),e.animatedProps.push({object:f,kind:"portal",phase:c*1.4,speed:1.6})}let a=new F({color:16317180,roughness:.9});for(let c=0;c<6;c++){let h=(c-2.5)*2.1,u=-1.2+c%2*.45,p=new y(new Ie(.95+c%3*.25,12,10),a);p.scale.set(1.8,.55,1.1),p.position.set(h,u,-5.2-c%2*1.2),n.add(p)}let l=new y(new be(.14,.14,1.6,12),new F({color:16436245,roughness:.35}));l.rotation.z=Math.PI/2,l.position.set(0,.35,-1),n.add(l),e.animatedProps.push({object:l,kind:"hazard",phase:0,speed:1.9})}function Pm(n,e){let t=new F({color:10576438,roughness:.92}),i=new y(new Lt(11,36),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new F({color:8142627,roughness:.88});for(let[l,c,h,u]of[[-3.4,-4.6,2.2,1.4],[.4,-5.8,2.8,1.9],[3.5,-4.3,2,1.3]]){let p=new y(new be(u*.72,u,h,8),s);p.position.set(l,h*.5-.1,c),p.castShadow=!0,n.add(p)}let r=new F({color:12753761,roughness:.85});for(let l=-2;l<=2;l++){let c=new y(new bt(.18,.34,6,8),r);c.rotation.z=Math.PI/2,c.position.set(l*.56,.18,-2.3),c.castShadow=!0,n.add(c)}let o=new F({color:16436245,roughness:.5});for(let l of[-2.2,2.2]){let c=new y(new ot(.22,.58,12),o);c.position.set(l,.29,-1.6),c.castShadow=!0,n.add(c)}let a=new Vt(16347926,2.4,8,1.5);a.position.set(0,1.4,-2.6),n.add(a),e.ambientFireLights.push({light:a,baseIntensity:2.4,phase:.6})}function Im(n,e,t){let i=new F({color:15857145,roughness:.55}),s=new F({color:t%2===0?3359061:4988309,roughness:.55});for(let p=-4;p<=4;p++)for(let f=-3;f<=3;f++){let g=new y(new oe(.98,.06,.98),(p+f)%2===0?i:s);g.position.set(p,-.03,f),g.receiveShadow=!0,n.add(g)}let r=new F({color:t%3===0?5195493:t%3===1?1013358:11817737,roughness:.78});for(let p of[-2.45,2.45]){let f=new y(new oe(3.4,4.2,.25),r);f.position.set(p,2.1,-2.8),f.receiveShadow=!0,n.add(f)}let o=new y(new oe(1.7,1.4,.25),r);o.position.set(0,3.5,-2.8),n.add(o);let a=new F({color:8138002,roughness:.6});for(let p of[-.78,.78]){let f=new y(new oe(.14,2.85,.34),a);f.position.set(p,1.425,-2.8),n.add(f)}let l=new y(new oe(1.72,.16,.36),a);l.position.set(0,2.86,-2.8),n.add(l);let c=new ge;c.position.set(-.7,0,-2.76);let h=new y(new oe(1.38,2.75,.08),new F({color:14251782,roughness:.5}));h.position.set(.69,1.375,0),h.castShadow=!0,c.add(h);let u=new y(new Ie(.08,12,10),new F({color:16436245,metalness:.85,roughness:.2}));u.position.set(1.22,1.25,.07),c.add(u),n.add(c),e.animatedProps.push({object:c,kind:"door",phase:.3,speed:2.2})}function fi(n,e){let t=e.width??12.6,i=e.height??5.4,s=e.backZ??-2.9,r=e.depth??10.5,o=new F({color:e.backColor,roughness:.82}),a=new F({color:e.sideColor??e.backColor,roughness:.84}),l=new y(new oe(t,i,.18),o);l.position.set(0,i*.5,s),l.receiveShadow=!0,n.add(l);let c=new y(new oe(.18,i,r),a);c.position.set(-t*.5+.09,i*.5,s+r*.5-.1),c.receiveShadow=!0,n.add(c);let h=new y(new oe(.18,i,r),a);h.position.set(t*.5-.09,i*.5,s+r*.5-.1),h.receiveShadow=!0,n.add(h);let u=e.trimColor??4674921,p=new F({color:u,roughness:.65}),f=new y(new oe(t,.16,.22),p);f.position.set(0,.08,s+.04),n.add(f);let g=new y(new oe(t,.35,r),p);g.position.set(0,i+.1,s+r*.5-.1),n.add(g);let m=new y(new oe(t,i,.2),o);m.position.set(0,i*.5,s+r-.15),n.add(m);let E=new y(new oe(t,.72,.22),p);return E.position.set(0,.36,s+r-.16),n.add(E),o}function Hm(n,e){let t=new F({color:6044968,roughness:.78}),i=new y(new rt(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new y(new oe(3.6,.02,2.6),new F({color:10424889,roughness:.88}));s.position.set(0,.01,-.4),s.receiveShadow=!0,n.add(s),fi(n,{backColor:3878738,sideColor:3221063,trimColor:6044968,backZ:-2.9});let r=new Vt(14412542,2.2,9.5,1.3);r.position.set(.75,2.65,.65),n.add(r),e.ambientFireLights.push({light:r,baseIntensity:2.2,phase:.1});let o=new y(new oe(1.5,1.55,.08),new F({color:8145446,roughness:.65}));o.position.set(1.15,2.25,-2.78),n.add(o);let a=new y(new rt(1.28,1.32),new ke({color:12248829}));a.position.set(1.15,2.25,-2.73),n.add(a);let l=new F({color:7877903,roughness:.62}),c=new ge;c.position.set(-.88,0,-.58);let h=new y(new oe(1.52,.14,2.1),l);h.position.y=.24,h.castShadow=!0,h.receiveShadow=!0,c.add(h);for(let[_,M]of[[-.68,-.95],[.68,-.95],[-.68,.95],[.68,.95]]){let x=new y(new be(.055,.045,.26,8),l);x.position.set(_,.13,M),x.castShadow=!0,c.add(x)}let u=new y(new oe(1.54,.72,.1),l);u.position.set(0,.56,-1),u.castShadow=!0,c.add(u);let p=new y(new oe(1.42,.16,1.94),new F({color:16708551,roughness:.8}));p.position.set(0,.38,.02),p.receiveShadow=!0,c.add(p);let f=new y(new oe(1.44,.18,1.24),new F({color:15357964,roughness:.75}));f.position.set(0,.39,.34),f.castShadow=!0,c.add(f);let g=new y(new oe(1.04,.14,.42),new F({color:16777215,roughness:.68}));g.position.set(0,.51,-.72),c.add(g),n.add(c);let m=new y(new oe(.55,.52,.52),l);m.position.set(-1.98,.26,-.82),m.castShadow=!0,n.add(m);let E=new y(new ot(.18,.24,16,1,!0),new F({color:16638023,emissive:16096779,emissiveIntensity:.55,side:xt}));E.position.set(-1.98,.72,-.82),n.add(E);let d=new Vt(16758605,2.4,6.5,1.5);d.position.set(-1.98,.66,-.82),n.add(d),e.ambientFireLights.push({light:d,baseIntensity:2.4,phase:.7}),e.spots.bed={x:-.88,y:.47,z:.16,rotY:.16},e.spots.door={x:1.45,y:0,z:-1.35,rotY:-.35}}function Dm(n,e){let t=new y(new rt(14,14),new F({color:4141901,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new y(new oe(4,.02,2.8),new F({color:1013358,roughness:.86}));i.position.set(0,.01,-.2),i.receiveShadow=!0,n.add(i),fi(n,{backColor:3359061,sideColor:2503236,trimColor:7027230,backZ:-2.95});let s=new F({color:14251782,roughness:.7}),r=new F({color:16707722,roughness:.68}),o=new ge;o.position.set(-.78,0,-.95);let a=new y(new oe(1.9,.36,.85),s);a.position.y=.22,a.castShadow=!0,a.receiveShadow=!0,o.add(a);let l=new y(new oe(1.9,.68,.22),s);l.position.set(0,.56,-.34),l.castShadow=!0,o.add(l);for(let d of[-.92,.92]){let _=new y(new oe(.18,.48,.86),s);_.position.set(d,.38,0),o.add(_)}let c=new y(new oe(.32,.28,.14),r);c.position.set(-.55,.48,-.14),c.rotation.z=.18,o.add(c),n.add(o);let h=new F({color:7027230,roughness:.55}),u=new y(new oe(1.15,.08,.65),h);u.position.set(.08,.34,.12),u.castShadow=!0,n.add(u);let p=new y(new be(.14,.09,.08,16),new F({color:16317180,roughness:.35}));p.position.set(.08,.42,.12),n.add(p);let f=new y(new oe(1.1,.78,.06),h);f.position.set(-.7,2.15,-2.84),n.add(f);let g=new y(new rt(.92,.62),new F({color:16498468,roughness:.5}));g.position.set(-.7,2.15,-2.8),n.add(g);let m=new ge;m.position.set(1.25,0,-2.7);let E=new y(new oe(.95,2.25,.08),h);E.position.set(.475,1.125,0),E.castShadow=!0,m.add(E),n.add(m),e.animatedProps.push({object:m,kind:"door",phase:.4,speed:.85}),e.spots.sofa={x:-.78,y:.38,z:-.74,rotY:.25},e.spots.door={x:1.45,y:0,z:-1.4,rotY:-.4}}function Lm(n,e){let t=new y(new rt(14,14),new F({color:3359061,roughness:.6}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new os(12,16,9741240,4674921);i.position.y=.01,n.add(i),fi(n,{backColor:10105874,sideColor:8138002,trimColor:16639626,backZ:-2.85});let s=new y(new oe(6.8,.92,.05),new F({color:16708551,roughness:.55}));s.position.set(0,1.32,-2.74),n.add(s);let r=new F({color:4674921,roughness:.55}),o=new F({color:14870768,roughness:.3}),a=new y(new oe(3.2,.88,.9),r);a.position.set(0,.44,-1.45),a.castShadow=!0,a.receiveShadow=!0,n.add(a);let l=new y(new oe(3.28,.07,.96),o);l.position.set(0,.91,-1.45),n.add(l);let c=new ke({color:3718648}),h=new y(new Qe(.18,.025,8,20),c);h.rotation.x=Math.PI/2,h.position.set(-.22,.96,-1.4),n.add(h),e.animatedProps.push({object:h,kind:"diya",phase:0,speed:9});let u=new F({color:14251782,metalness:.72,roughness:.25}),p=new y(new be(.32,.22,.26,20),u);p.position.set(-.22,1.1,-1.4),p.castShadow=!0,n.add(p);let f=new y(new Lt(.3,20),new F({color:16708551,roughness:.28}));f.rotation.x=-Math.PI/2,f.position.set(-.22,1.22,-1.4),n.add(f);for(let E=0;E<5;E++){let d=new y(new Ie(.075,8,8),new ke({color:16777215,transparent:!0,opacity:.3,depthWrite:!1}));d.position.set(-.22+(E%3-1)*.08,1.32+E*.14,-1.4),n.add(d),e.animatedProps.push({object:d,kind:"steam",baseY:1.28,phase:E*1.1,speed:1.7})}let g=new y(new oe(2.6,.08,.32),new F({color:7877903,roughness:.65}));g.position.set(0,1.85,-2.6),n.add(g);for(let E=-2;E<=2;E++){let d=[15680580,16096779,2278750,3900150,15381256][E+2],_=new y(new be(.075,.075,.22,12),new F({color:d,roughness:.35}));_.position.set(E*.42,2,-2.58),n.add(_)}let m=new Vt(16775149,3.3,9.5,1.25);m.position.set(0,2.75,.45),n.add(m),e.ambientFireLights.push({light:m,baseIntensity:3.3,phase:.2}),e.spots.counter={x:-.42,y:0,z:-.68,rotY:.3},e.spots.door={x:1.35,y:0,z:-1.15,rotY:-.45}}function hr(n,e,t,i,s,r,o="#0f172a",a="#f59e0b"){let l=document.createElement("canvas");l.width=512,l.height=192;let c=l.getContext("2d");c.fillStyle=o,c.fillRect(0,0,512,192),c.strokeStyle=a,c.lineWidth=10,c.strokeRect(10,10,492,172),c.fillStyle=a,c.font="bold 42px sans-serif",c.textAlign="center",c.fillText(e,256,86),c.fillStyle="#e2e8f0",c.font="600 24px sans-serif",c.fillText(t,256,138);let h=new Xn(l);h.colorSpace=Ut;let u=new y(new oe(1.48,.56,.05),new F({color:1976635,roughness:.45,metalness:.4}));u.position.set(i,s,r-.02),n.add(u);let p=new y(new rt(1.38,.48),new ke({map:h}));p.position.set(i,s,r+.01),n.add(p)}function Um(n,e){let t=new y(new rt(14,14),new F({color:4860970,roughness:.75}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),fi(n,{backColor:8138002,sideColor:6037518,trimColor:16096779,backZ:-2.9}),hr(n,"MITHAI & KESHAV","FRESH SHAHI HALWAI",0,2.75,-2.76,"#431407","#fbbf24");let i=new F({color:8138002,roughness:.58}),s=new y(new oe(2.8,.92,.85),i);s.position.set(0,.46,-1.45),s.castShadow=!0,s.receiveShadow=!0,n.add(s);let r=new F({color:14870768,metalness:.85,roughness:.2}),o=new F({color:16096779,roughness:.45}),a=new F({color:16708551,roughness:.38});for(let h of[-.65,0,.65]){let u=new y(new oe(.52,.04,.48),r);u.position.set(h,.94,-1.42),n.add(u);for(let p=-.14;p<=.15;p+=.14)for(let f=-.1;f<=.12;f+=.14){let g=h===0?new y(new oe(.11,.08,.11),a):new y(new Ie(.06,10,8),o);g.position.set(h+p,1,-1.42+f),n.add(g)}}let l=new y(new oe(3.2,.1,1.2),new F({color:15357964,roughness:.65}));l.position.set(0,2.35,-1.35),l.rotation.x=.18,n.add(l);for(let h=-5;h<=5;h++){let u=new y(new Ie(.075,10,8),new F({color:h%2===0?16096779:16436245,roughness:.6}));u.position.set(h*.28,2.15-Math.cos(h*.35)*.14,-.82),n.add(u)}let c=new Vt(16758605,3,8,1.4);c.position.set(0,2.15,-1),n.add(c),e.ambientFireLights.push({light:c,baseIntensity:3,phase:.5}),e.spots.counter={x:.38,y:0,z:-.62,rotY:.22}}function Vh(n,e,t,i,s,r,o,a,l=512,c=256){let h=new ge;h.position.set(i,s,r),h.rotation.y=o;let u=new y(new oe(e+.2,t+.2,.08),a);u.position.z=-.045,h.add(u);let p=new lr(new rt(e,t),{clipBias:.003,textureWidth:l,textureHeight:c,color:14412542,multisample:0});p.position.z=.002,h.add(p);let f=new y(new rt(.07,t*.92),new ke({color:16777215,transparent:!0,opacity:.16}));f.position.set(-e*.34,0,.006),f.rotation.z=-.35,h.add(f),n.add(h)}function Bm(n,e){let t=new F({color:3359061,roughness:.42,metalness:.12}),i=new F({color:6583435,roughness:.45,metalness:.08}),s=new y(new rt(14,14),t);s.rotation.x=-Math.PI/2,s.receiveShadow=!0,n.add(s);for(let B=-4;B<=4;B++)for(let te=-4;te<=3;te++){if((B+te)%2!==0)continue;let re=new y(new rt(.95,.95),i);re.rotation.x=-Math.PI/2,re.position.set(B*1,.004,te*1),re.receiveShadow=!0,n.add(re)}fi(n,{backColor:16051425,sideColor:15129288,trimColor:1013358,backZ:-2.9});let r=new y(new oe(12.6,1.02,.21),new F({color:1013358,roughness:.45}));r.position.set(0,.51,-2.86),n.add(r),hr(n,"SHAHI SALON","KESHAV STUDIO \u2022 VIP CUTS",2.34,2.26,-2.75,"#0f172a","#f59e0b"),hr(n,"STYLE CHART","1. BAHUBALI  2. FADE  3. KATORA",2.34,1.64,-2.75,"#1e293b","#38bdf8");let o=new F({color:14870768,metalness:.88,roughness:.16});Vh(n,3.25,1.38,-.25,1.92,-2.7,0,o,512,256);let a=new y(new be(.032,.032,.65,10),o);a.rotation.z=Math.PI/2,a.position.set(-2.5,1.62,-.88),n.add(a),Vh(n,1.42,1.18,-2.14,1.62,-.78,1.04,o,384,320);let l=new y(new oe(2.8,.08,.14),new ke({color:16776171}));l.position.set(-.25,2.78,-2.7),n.add(l);let c=new Vt(16776171,3.2,9.5,1.3);c.position.set(-.25,2.65,-1.25),n.add(c);let h=new y(new oe(3.6,.08,.22),new ke({color:16708551}));h.position.set(0,3.85,1.2),n.add(h);let u=new F({color:1013358,roughness:.48}),p=new y(new oe(6.4,1.2,.12),u);p.position.set(0,1.85,7.25),n.add(p);let f=new y(new oe(2.6,.015,2.2),new F({color:1013358,roughness:.9}));f.position.set(-.55,.008,-.78),f.receiveShadow=!0,n.add(f);let g=new ge;g.position.set(3.48,1.68,-2.55);let m=new y(new be(.11,.11,.92,16),new F({color:16317180,roughness:.25}));g.add(m),[14427686,2450411,14427686].forEach((B,te)=>{let re=new y(new Qe(.112,.028,8,18),new F({color:B,roughness:.3}));re.rotation.x=Math.PI/2+.42,re.position.y=-.26+te*.26,g.add(re)});let E=new F({color:13948120,metalness:.85,roughness:.2});for(let B of[-.5,.5]){let te=new y(new Ie(.125,12,10),E);te.position.y=B,g.add(te)}n.add(g),e.animatedProps.push({object:g,kind:"hazard",phase:0,speed:3.2});let d=new y(new oe(.75,.72,.56),new F({color:16317180,roughness:.32}));d.position.set(-2.98,.36,-2.42),n.add(d);let _=new y(new be(.28,.2,.18,16),new F({color:16777215,roughness:.22}));_.position.set(-2.98,.78,-2.38),n.add(_);let M=new y(new be(.02,.02,.24,8),o);M.position.set(-2.98,.92,-2.58),n.add(M);let x=new y(new oe(3.3,.08,.36),new F({color:7029795,roughness:.6}));x.position.set(-.25,1.02,-2.6),n.add(x),[14753096,959977,16096779,1096065,9133302].forEach((B,te)=>{let re=new y(new be(.055,.055,.22,10),new F({color:B,roughness:.3}));re.position.set(-1.2+te*.48,1.17,-2.55),n.add(re)});let b=new ge;b.position.set(.96,0,-1.26);let R=new y(new oe(.46,.8,.36),new F({color:1976635,roughness:.5}));R.position.y=.42,b.add(R);let A=new y(new oe(.5,.05,.4),o);A.position.y=.84,b.add(A);let C=new y(new be(.04,.052,.16,10),new F({color:959977,roughness:.3}));C.position.set(-.14,.94,.04),b.add(C);let w=new y(new oe(.05,.05,.14),o);w.position.set(0,.89,.06),b.add(w),[16708551,14742270].forEach((B,te)=>{let re=new y(new oe(.2,.055,.22),new F({color:B,roughness:.85}));re.position.set(.11,.895+te*.056,-.02),b.add(re)}),n.add(b);let v=new ge;v.position.set(-.44,0,-.78),v.rotation.y=.2;let H=new F({color:12131356,roughness:.42}),z=new y(new be(.36,.4,.08,18),o);z.position.y=.04,v.add(z);let G=new y(new be(.08,.1,.42,12),o);G.position.y=.25,v.add(G);let J=new y(new oe(.76,.16,.72),H);J.position.y=.46,J.castShadow=!0,v.add(J);let Y=new y(new oe(.74,.76,.14),H);Y.position.set(0,.84,-.32),Y.rotation.x=-.14,Y.castShadow=!0,v.add(Y);for(let B of[-.41,.41]){let te=new y(new oe(.08,.08,.62),o);te.position.set(B,.68,0),v.add(te)}let Z=new y(new oe(.46,.05,.22),o);Z.position.set(0,.22,.48),v.add(Z),n.add(v);let se=new y(new oe(1.9,.42,.68),new F({color:2450411,roughness:.6}));se.position.set(1.76,.21,-1.68),se.castShadow=!0,n.add(se),e.spots.sofa={x:-.44,y:.28,z:-.66,rotY:.18},e.spots.counter={x:.34,y:0,z:-.96,rotY:-.36},e.spots.door={x:1.76,y:0,z:-1.45,rotY:-.35}}function Fm(n,e){let t=new y(new rt(14,14),new F({color:4927003,roughness:.68}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new F({color:7029795,roughness:.62});fi(n,{backColor:7029795,sideColor:5715482,trimColor:9584654,backZ:-2.9}),hr(n,"SATYAMEVA JAYATE","KESHAV DISTRICT COURT",0,3.05,-2.76,"#451a03","#f59e0b");let s=new y(new oe(3.4,1.25,1),i);s.position.set(0,.62,-1.9),s.castShadow=!0,n.add(s);let r=new y(new Qe(.32,.04,10,24),new F({color:16096779,metalness:.85,roughness:.2}));r.position.set(0,2.4,-2.76),n.add(r);let o=new y(new oe(1.1,.92,.9),i);o.position.set(-.95,.46,-.55),o.castShadow=!0,n.add(o),e.spots.sofa={x:0,y:.42,z:-1.45,rotY:.08},e.spots.counter={x:-.95,y:.1,z:-.35,rotY:.38}}function Nm(n,e){let t=new y(new rt(14,14),new F({color:14412542,roughness:.52}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),fi(n,{backColor:16317180,sideColor:14870768,trimColor:165063,backZ:-2.9}),hr(n,"CITY CLINIC","DR. DIAGNOSTICS \u2022 OPD 1",2.25,2.35,-2.75,"#0c4a6e","#38bdf8");let i=new ke({color:15680580}),s=new y(new oe(.22,.72,.05),i);s.position.set(0,2.35,-2.78),n.add(s);let r=new y(new oe(.72,.22,.05),i);r.position.set(0,2.35,-2.78),n.add(r);let o=new y(new oe(1.8,.52,.88),new F({color:959977,roughness:.6}));o.position.set(-.95,.26,-.88),o.castShadow=!0,n.add(o);let a=new y(new oe(1.4,.75,.72),new F({color:6583435,roughness:.5}));a.position.set(.85,.38,-.85),a.castShadow=!0,n.add(a),e.spots.bed={x:-.95,y:.52,z:-.82,rotY:.32},e.spots.sofa={x:.85,y:0,z:-.45,rotY:-.35}}function Om(n,e){let t=new y(new rt(14,14),new F({color:7887420,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),fi(n,{backColor:16708551,sideColor:16639626,trimColor:7877903,backZ:-2.9});let i=new y(new oe(4.2,1.55,.08),new F({color:7877903,roughness:.6}));i.position.set(0,1.95,-2.78),n.add(i);let s=new y(new rt(3.95,1.32),new F({color:1332013,roughness:.9}));s.position.set(0,1.95,-2.73),n.add(s);let r=[16750899,16777215,1280008];for(let a=-5;a<=5;a++){let l=new y(new ot(.11,.22,4),new F({color:r[(a+5)%3],roughness:.5}));l.rotation.x=Math.PI,l.position.set(a*.42,3.05-Math.cos(a*.28)*.16,-1.6),n.add(l),e.animatedProps.push({object:l,kind:"sway",phase:a*.4,speed:2.1})}let o=new y(new oe(.9,.85,.65),new F({color:7877903,roughness:.6}));o.position.set(-.85,.42,-.75),n.add(o),e.spots.sofa={x:.8,y:0,z:-.45,rotY:-.4},e.spots.counter={x:-.85,y:0,z:-.45,rotY:.35}}function Gm(n,e){let t=new y(new rt(14,14),new F({color:593188,roughness:.35,metalness:.3}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new ke({color:3718648}),s=new y(new Qe(2.15,.06,12,48),i);s.rotation.x=Math.PI/2,s.position.set(0,.04,0),n.add(s),e.animatedProps.push({object:s,kind:"ring",phase:0,speed:.4});let r=new y(new Qe(2.7,.08,12,48),new ke({color:11032055}));r.position.set(0,1.9,-2.5),n.add(r),e.animatedProps.push({object:r,kind:"portal",phase:.4,speed:.8});let o=new F({color:1976635,metalness:.55,roughness:.3});[-.95,.95].forEach(l=>{let c=new y(new be(.38,.44,.82,16),o);c.position.set(l,.41,-.35),c.castShadow=!0,n.add(c)});let a=new Ai(3718648,8.5,16,Math.PI/5,.4);a.position.set(0,4.6,1.5),n.add(a),n.add(a.target),e.animatedProps.push({object:a,kind:"spotlight",phase:0,speed:1.5})}function km(n,e){let t=new y(new rt(14,14),new F({color:7041664,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new F({color:10105874,roughness:.82}),s=new F({color:16708551,roughness:.55}),r=new ke({color:16638023});[-2.6,2.6].forEach(h=>{let u=new y(new oe(3,2.2,.28),i);u.position.set(h,1.1,-2.4),u.castShadow=!0,n.add(u)}),[-1.08,1.08].forEach(h=>{let u=new y(new oe(.38,2.55,.38),i);u.position.set(h,1.28,-2.35),u.castShadow=!0,n.add(u);let p=new y(new oe(.46,.12,.46),s);p.position.set(h,2.58,-2.35),n.add(p);let f=new y(new Ie(.11,10,8),r);f.position.set(h,2.74,-2.35),n.add(f)});let o=new ge;o.position.set(-.92,0,-2.35);let a=new F({color:1976635,metalness:.65,roughness:.35});for(let h of[.35,1.85]){let u=new y(new oe(1.84,.08,.08),a);u.position.set(.92,h,0),o.add(u)}for(let h=0;h<=7;h++){let u=new y(new be(.025,.025,2.05,8),a);u.position.set(.08+h*.24,1.05,0),u.castShadow=!0,o.add(u)}let l=new y(new oe(.14,.16,.08),new F({color:16096779,metalness:.85,roughness:.2}));l.position.set(1.72,1.12,.08),o.add(l),n.add(o),e.animatedProps.push({object:o,kind:"door",phase:.1,speed:.7});let c=new y(new be(.09,.11,3.8,12),new F({color:4674921,metalness:.5,roughness:.5}));c.position.set(2.15,1.9,-1.6),n.add(c),cr(n,-2.75,-1.25,1.05,1409085,.3,e),e.spots.door={x:0,y:0,z:-1.35,rotY:.1}}function zm(n,e){let t=new F({color:3875606,roughness:.72}),i=new F({color:6042653,roughness:.65}),s=new F({color:16041038,metalness:.85,roughness:.25}),r=new F({color:1920728,roughness:.45,metalness:.2}),o=new F({color:8330525,roughness:.82}),a=new y(new Lt(10,44),t);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,n.add(a);let l=new y(new oe(3.6,.02,2.2),o);l.position.set(0,.015,.1),l.receiveShadow=!0,n.add(l);for(let m of[-2.4,2.4]){let E=new y(new oe(2,3.1,.45),i);E.position.set(m,1.55,-2.9),E.castShadow=!0,n.add(E);for(let d of[.85,1.65,2.45]){let _=new y(new oe(1.75,.22,.48),s);_.position.set(m,d,-2.9),n.add(_)}}let c=new y(new be(.42,.56,1.05,20),i);c.position.set(0,.525,-2.35),c.castShadow=!0,n.add(c);let h=new ge;h.position.set(0,1.55,-2.35);let u=new y(new Ie(.46,24,18),r);h.add(u);let p=new y(new Qe(.55,.032,10,42),s);h.add(p);let f=new y(new Qe(.51,.024,10,42),s);f.rotation.x=Math.PI/2,h.add(f),n.add(h),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.45});let g=new Vt(16639626,3.2,8,1.4);g.position.set(0,2.65,-1.65),n.add(g),e.ambientFireLights.push({light:g,baseIntensity:3.2,phase:.4})}function Vm(n,e,t){let i=new F({color:988970,roughness:.5,metalness:.25}),s=new F({color:1976635,roughness:.45,metalness:.35}),r=new ke({color:t||"#38bdf8"}),o=new y(new Lt(10,44),i);o.rotation.x=-Math.PI/2,o.receiveShadow=!0,n.add(o);let a=new y(new Qe(2.3,.04,10,48),r);a.rotation.x=Math.PI/2,a.position.y=.02,n.add(a);let l=[[-3.6,-4.2,1.1,4.2],[-2.1,-4.6,1,5.1],[-.4,-5,1.25,5.8],[1.4,-4.6,1,4.8],[3.1,-4.2,1.15,4]];for(let[u,p,f,g]of l){let m=new y(new oe(f,g,.9),s);m.position.set(u,g*.5,p),n.add(m);for(let E=1;E<g-.5;E+=.95){let d=new y(new oe(f*.72,.14,.94),r);d.position.set(u,E,p),n.add(d)}}let c=new y(new Qe(1.8,.035,10,48),r);c.position.set(0,2.6,-3.1),n.add(c),e.animatedProps.push({object:c,kind:"ring",phase:.4,speed:.35});let h=new Vt(t||"#38bdf8",2.8,9,1.4);h.position.set(0,2.8,-1.8),n.add(h),e.ambientFireLights.push({light:h,baseIntensity:2.8,phase:.6})}function Wh(n,e,t,i,s){let{top:r,mid:o,bot:a,sunColor:l,sunIntensity:c,fogDensity:h}=ym(i,e.palette);n.fog=new Bs(o,h);let u=new Ie(28,32,20),p=new zt({side:Wt,depthWrite:!1,uniforms:{uTop:{value:new De(r)},uMid:{value:new De(o)},uBot:{value:new De(a)}},vertexShader:`
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
    `}),f=new y(u,p);n.add(f);let g=new Ks(l,a,.85);n.add(g);let m=new rs(l,c);m.position.set(2.8,5.2,3.8),m.castShadow=!0,m.shadow.mapSize.set(1024,1024),m.shadow.camera.near=.5,m.shadow.camera.far=16,m.shadow.camera.left=-4,m.shadow.camera.right=4,m.shadow.camera.top=4,m.shadow.camera.bottom=-4,m.shadow.bias=-8e-4,n.add(m);let E=new rs(e.palette.secondaryHex,.65);E.position.set(-3,3.4,-3.5),n.add(E);let d=new ge;n.add(d);let _={group:d,skyMaterial:p,keyLight:m,hemiLight:g,ambientFireLights:[],animatedProps:[],backdropTextures:s,spots:{}};if(s.length>0&&e.stageLayout?.templateBackdrop){let M=new y(new rt(14,14),new Zs({opacity:.42}));M.rotation.x=-Math.PI/2,M.receiveShadow=!0,d.add(M);let x=e.width/e.height,b=6.2,R=b*x,A=new y(new rt(R,b),new ke({map:s[0],depthWrite:!1}));return A.position.set(0,1.32,-2.1),d.add(A),_.backdropMesh=A,_}if(s.length>0){let M=e.width/e.height,x=11.2,b=x*M,R=new y(new rt(b,x),new ke({map:s[0],depthWrite:!1,fog:!1}));R.position.set(0,2.75,-6.5),d.add(R),_.backdropMesh=R}switch(t){case"Temple":Mm(d,_);break;case"ForestAshram":_m(d,_);break;case"RiverGhat":vm(d,_);break;case"Cosmos":wm(d,_,e.palette.primaryHex);break;case"ComedyStage":Tm(d,_);break;case"ChaiStall":Sm(d,_);break;case"SkyGauntlet":Cm(d,_,e.uniqueVariant??e.seed??0);break;case"TankArena":Pm(d,_);break;case"DoorwaySet":Im(d,_,e.uniqueVariant??e.seed??0);break;case"Himalaya":bm(d,_);break;case"PalaceCourt":Rm(d,_);break;case"Bedroom":Hm(d,_);break;case"LivingRoom":Dm(d,_);break;case"Kitchen":Lm(d,_);break;case"SweetShop":Um(d,_);break;case"BarberShop":Bm(d,_);break;case"Courtroom":Fm(d,_);break;case"DoctorClinic":Nm(d,_);break;case"Classroom":Om(d,_);break;case"QuizStudio":Gm(d,_);break;case"Archive":zm(d,_);break;case"ModernCity":Vm(d,_,e.palette.primaryHex);break;case"NeighborhoodGate":km(d,_);break;default:Am(d,t,_,e.palette.primaryHex);break}return _}function Xh(n,e,t,i,s,r){for(let o of n.ambientFireLights)o.light.intensity=o.baseIntensity*(.86+.14*Math.sin(e*9.5+o.phase));for(let o of n.animatedProps)if(o.kind==="bell")o.object.rotation.z=Math.sin(e*o.speed+o.phase)*.16;else if(o.kind==="sway")o.object.rotation.z=Math.sin(e*o.speed+o.phase)*.035;else if(o.kind==="ring")o.object.rotation.z=e*o.speed+o.phase,o.object.rotation.y=Math.sin(e*.4+o.phase)*.25;else if(o.kind==="diya")o.object.scale.y=.85+.22*Math.sin(e*o.speed+o.phase),o.object.scale.x=.92+.12*Math.cos(e*o.speed*1.1+o.phase);else if(o.kind==="steam"){let a=(e*.55+o.phase)%1;o.object.position.y=(o.baseY??1.16)+a*.65,o.object.scale.setScalar(.75+a*1.15);let l=o.object.material;l.opacity=Math.sin(a*Math.PI)*.28}else if(o.kind==="spotlight"){let a=o.object;a.target.position.set(Math.sin(e*o.speed+o.phase)*1.1,.8,0),a.target.updateMatrixWorld()}else if(o.kind==="portal"){o.object.rotation.z=e*o.speed+o.phase;let a=.94+.08*Math.sin(e*3.8+o.phase);o.object.scale.setScalar(a)}else o.kind==="door"?o.object.rotation.y=.35+Math.sin(e*o.speed+o.phase)*.48:o.kind==="hazard"&&(o.object.rotation.y=e*o.speed+o.phase);if(n.poleStarGroup&&n.poleStarMat){let o=Math.max(0,Math.min(1,(t-.55)/.35));n.poleStarGroup.visible=o>.02,n.poleStarGroup.rotation.y=e*.8,n.poleStarMat.opacity=o*.28}if(n.backdropMesh&&n.backdropTextures.length>0){let o=Math.max(0,i)%n.backdropTextures.length,a=n.backdropMesh.material;if(a.map!==n.backdropTextures[o]&&(a.map=n.backdropTextures[o],a.needsUpdate=!0),r?.templateBackdrop)if(r.templateMotion==="GentleZoom"){let l=1+.06*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(l),n.backdropMesh.position.x=0}else r.templateMotion==="SlowPan"?(n.backdropMesh.scale.setScalar(1.08),n.backdropMesh.position.x=Math.sin(e*Math.PI*2/32)*.16):(n.backdropMesh.scale.setScalar(1),n.backdropMesh.position.x=0);else{let l=s*s*(3-2*s);n.backdropMesh.scale.setScalar(1.04+.09*l),n.backdropMesh.position.x=(o%2===0?1:-1)*.14*(l-.5)}}}function Yh(n,e,t,i,s,r){let o=new ge;n.add(o);let a=document.createElement("canvas");a.width=64,a.height=64;let l=a.getContext("2d"),c=l.createRadialGradient(32,32,2,32,32,30);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.35,"rgba(255,255,255,0.75)"),c.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);let h=new Xn(a),u="upward";t==="ComedyBurst"||e==="ComedyStage"?u="star":e==="ForestAshram"?u="firefly":e==="Himalaya"?u="snow":(t==="DivineAura"||e==="PalaceCourt")&&(u="petal");let p=110,f=new Float32Array(p*3),g=new Float32Array(p*3),m=new Float32Array(p*3),E=new De(i),d=new De(s),_=new De(16775126),M=(r^2654435769)>>>0,x=()=>(M=Math.imul(1664525,M)+1013904223>>>0,M/4294967296);for(let D=0;D<p;D++){let fe=(x()-.5)*6.2,we=x()*4.2,Oe=(x()-.5)*4.5-.4;f[D*3]=fe,f[D*3+1]=we,f[D*3+2]=Oe,m[D*3]=x()*6.283,m[D*3+1]=.4+x()*.9,m[D*3+2]=fe;let L=D%3===0?E:D%3===1?d:_;g[D*3]=L.r,g[D*3+1]=L.g,g[D*3+2]=L.b}let b=new St;b.setAttribute("position",new kt(f,3)),b.setAttribute("color",new kt(g,3));let R=new Si({size:u==="star"?.065:.12,map:h,vertexColors:!0,transparent:!0,opacity:u==="star"?.16:.78,blending:Dn,depthWrite:!1}),A=new ns(b,R);u==="star"&&(A.visible=!1),o.add(A);let C=36,w=new Float32Array(C*3),v=new St;v.setAttribute("position",new kt(w,3));let H=new Si({size:.16,map:h,color:16638023,transparent:!0,opacity:0,blending:Dn,depthWrite:!1}),z=new ns(v,H);o.add(z);let G=[];if(e!=="ModernCity"&&u!=="star")for(let D=0;D<4;D++){let fe=new zt({transparent:!0,depthWrite:!1,side:xt,blending:Dn,uniforms:{uColor:{value:new De(i)},uOpacity:{value:.08}},vertexShader:`
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
        `}),we=new y(new ot(.85,7.2,20,1,!0),fe);we.position.set(-1.6+D*1.05,2.6,-1.9),we.rotation.z=-.32+D*.1,o.add(we),G.push(we)}let J=[];for(let D=0;D<7;D++){let fe=new y(new Ie(.036,10,8),new ke({color:s,transparent:!0,opacity:0,blending:Dn,depthWrite:!1}));o.add(fe),J.push(fe)}let Y=new ge,Z=new ke({color:8246268,transparent:!0,opacity:.85});for(let D=0;D<3;D++){let fe=new ge,we=.06+D*.028,Oe=new y(new oe(we*1.6,we*.35,we*.35),Z);Oe.position.y=we*.7;let L=new y(new oe(we*1.8,we*.32,we*.35),Z);L.rotation.z=.72;let ct=new y(new oe(we*1.6,we*.35,we*.35),Z);ct.position.y=-we*.7,fe.add(Oe,L,ct),Y.add(fe)}Y.visible=!1,o.add(Y);let se=new ge,B=new ke({color:16436245,side:xt});for(let D=0;D<6;D++){let fe=D/6*Math.PI*2,we=new y(new ot(.036,.16,4),B);we.position.set(Math.cos(fe)*.22,Math.sin(fe)*.22,0),we.rotation.z=fe-Math.PI/2,se.add(we)}se.visible=!1,o.add(se);let te=new ge,re=new ke({color:16638023});for(let D=0;D<3;D++){let fe=new y(new xn(.068,0),re);te.add(fe)}te.visible=!1,o.add(te);let j=new ge,xe=new ke({color:14870768,transparent:!0,opacity:.55});for(let D=0;D<4;D++){let fe=new y(new Ie(.085,8,6),xe);j.add(fe)}j.visible=!1,o.add(j);let pe=new ge,W=new ke({color:1120295,transparent:!0,opacity:.94});for(let D=0;D<12;D++){let fe=new y(new oe(.068,.022,.024),W);pe.add(fe)}pe.visible=!1,o.add(pe);let ue=new ge,ee=new ke({color:16708338,transparent:!0,opacity:.85}),le=new ke({color:15680580,transparent:!0,opacity:.92});for(let D=0;D<6;D++){let fe=new y(new Ie(.065+D%2*.022,8,6),D%3===2?le:ee);ue.add(fe)}ue.visible=!1,o.add(ue);let X=new ge,U=new ke({color:8246268,transparent:!0,opacity:.82});for(let D=0;D<10;D++){let fe=new y(new Ie(.024,6,5),U);X.add(fe)}return X.visible=!1,o.add(X),{group:o,ambientPoints:A,ambientPositions:f,ambientSeeds:m,burstPoints:z,burstPositions:w,burstMat:H,streamDots:J,godRays:G,particleMode:u,sleepZGroup:Y,shockBurstGroup:se,dizzyStarsGroup:te,dustGroup:j,hairCutGroup:pe,angrySteamGroup:ue,sprayMistGroup:X}}function qh(n,e,t,i,s,r,o,a,l,c,h="none",u="none",p=0,f=0,g=!1,m="calm",E="calm"){let d=n.ambientPositions.length/3,_=n.particleMode==="snow"||n.particleMode==="petal"&&t>.6;for(let ee=0;ee<d;ee++){let le=n.ambientSeeds[ee*3],X=n.ambientSeeds[ee*3+1],U=n.ambientSeeds[ee*3+2];if(n.particleMode==="firefly")n.ambientPositions[ee*3]=U+Math.sin(e*.9*X+le)*.45,n.ambientPositions[ee*3+1]=.4+((ee*.17+Math.sin(e*.65+le)*.6)%2.8+2.8)%2.8;else{let D=((e*.14*X+le*.15)%1+1)%1;n.ambientPositions[ee*3]=U+Math.sin(e*1.1+le)*.25,n.ambientPositions[ee*3+1]=_?3.9-D*3.8:.15+D*3.8}}n.ambientPoints.geometry.attributes.position.needsUpdate=!0;for(let ee=0;ee<n.godRays.length;ee++){let X=n.godRays[ee].material;X.uniforms.uOpacity.value=.075+.04*Math.sin(e*.8+ee*1.1)}let M=n.particleMode==="star",x=i==="Left"||i==="Right",b=i==="Left"?l:c;for(let ee=0;ee<n.streamDots.length;ee++){let le=n.streamDots[ee],X=le.material;if(!x||M){X.opacity=0;continue}let U=i==="Left"?s+.2:r-.2,D=i==="Left"?r-.2:s+.2,fe=(e*1.35+ee/n.streamDots.length)%1;le.position.set(U+(D-U)*fe,1.38+Math.sin(fe*Math.PI)*.42+Math.sin(e*7+ee)*.03,-.38+Math.cos(e*6+ee)*.06),X.color.set(b),X.opacity=Math.sin(fe*Math.PI)*.22}if(x&&(M?g:(o==="laughing"||o==="surprised"||o==="proud"||g)&&(a<.4||g))){let ee=Math.min(1,a/.4),le=i==="Left"?s:r;n.burstMat.color.setHex(o==="angry"?16347926:16638023);let X=n.burstPositions.length/3;for(let U=0;U<X;U++){let D=U/X*Math.PI*2,fe=.68+ee*.92;n.burstPositions[U*3]=le+Math.cos(D)*fe,n.burstPositions[U*3+1]=1.55+Math.sin(D)*fe*.85-ee*.16,n.burstPositions[U*3+2]=M?-1.08:-.42}n.burstPoints.geometry.attributes.position.needsUpdate=!0,n.burstMat.opacity=(1-ee*.82)*(M?.36:.45)}else n.burstMat.opacity=0;let A=h==="sleeping";if(A||u==="sleeping"){n.sleepZGroup.visible=!0;let ee=A?s:r,le=(A?p:f)+.62,X=A&&p>.25?-.78:-.35;n.sleepZGroup.children.forEach((U,D)=>{let fe=(e*.55+D*.33)%1;U.position.set(ee+Math.sin(e*2.2+D)*.12+fe*.14,le+fe*.65,X),U.rotation.z=Math.sin(e*1.8+D)*.22;let we=Math.sin(fe*Math.PI)*.85;U.scale.setScalar(Math.max(.01,we))})}else n.sleepZGroup.visible=!1;let w=i==="Right"?r:s,v=i==="Right"?f:p,H=i==="Right"?u:h,z=g||(H==="shockedFall"||H==="wakingUp"||o==="surprised")&&a<.42,G=h==="punching"||h==="kicking",J=u==="punching"||u==="kicking",Y=G?h:u,Z=G||J?Jn(e,Y).recoil:0;if(Z>.08){let ee=G?r:s,le=G?f:p;n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(ee+(G?-.28:.28),le+(Y==="kicking"?.95:1.45),-.05),n.shockBurstGroup.rotation.z=e*3.1,n.shockBurstGroup.scale.setScalar(.45+Z*.85)}else if(z){n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(w,v+2.08,-.18),n.shockBurstGroup.rotation.z=e*2.2;let ee=.88+.18*Math.sin(e*16);n.shockBurstGroup.scale.setScalar(ee)}else n.shockBurstGroup.visible=!1;if(h==="slapForehead"||u==="slapForehead"||o==="confused"){n.dizzyStarsGroup.visible=!0;let ee=u==="slapForehead"?r:h==="slapForehead"?s:w,le=(u==="slapForehead"?f:h==="slapForehead"?p:v)+1.82;n.dizzyStarsGroup.children.forEach((X,U)=>{let D=e*4.5+U/3*Math.PI*2;X.position.set(ee+Math.cos(D)*.28,le+Math.sin(D*2)*.04,Math.sin(D)*.24),X.rotation.y=e*5})}else n.dizzyStarsGroup.visible=!1;let B=h==="walking"||h==="running";if(B||(u==="walking"||u==="running")){n.dustGroup.visible=!0;let ee=B?s:r,le=(B?p:f)+.06;n.dustGroup.children.forEach((X,U)=>{let D=(e*(h==="running"||u==="running"?3.2:1.8)+U*.25)%1;X.position.set(ee-D*.35+(U%2===0?-.1:.1),le+D*.28,-.05),X.scale.setScalar(Math.max(.01,Math.sin(D*Math.PI)*1.25))})}else n.dustGroup.visible=!1;let re=h==="cutting";if(re||u==="cutting"){n.hairCutGroup.visible=!0;let ee=re?r:s,le=(re?f:p)+1.44,X=-.6;n.hairCutGroup.children.forEach((U,D)=>{let fe=(e*2.25+D*.13)%1,we=(D%2===0?1:-1)*(.09+fe*.28);U.position.set(ee+we+Math.sin(e*7+D)*.04,le-fe*1.12,X+.08),U.rotation.set(e*6+D,D*.9,e*8),U.scale.setScalar(Math.max(.08,Math.sin(fe*Math.PI)*1.25))})}else n.hairCutGroup.visible=!1;let xe=m==="angry",pe=E==="angry";if(xe||pe){n.angrySteamGroup.visible=!0;let ee=pe?r:s,le=(pe?f:p)+1.56,X=pe?-.68:-.58;n.angrySteamGroup.children.forEach((U,D)=>{let fe=D%2===0?-1:1,we=(e*2.4+Math.floor(D/2)*.34)%1;U.position.set(ee+fe*(.28+we*.36),le+we*.45,X),U.scale.setScalar(Math.max(.05,Math.sin(we*Math.PI)*1.35))})}else n.angrySteamGroup.visible=!1;let W=h==="spraying";if(W||u==="spraying"){n.sprayMistGroup.visible=!0;let ee=W?r:s,le=(W?f:p)+1.48,X=W?s:r;n.sprayMistGroup.children.forEach((U,D)=>{let fe=(e*3.6+D*.1)%1,we=(D%5-2)*.055;U.position.set(X+(ee-X)*(.35+fe*.65),le+we+Math.sin(fe*3)*.04,-.62),U.scale.setScalar(Math.max(.1,(1-fe*.4)*1.15))})}else n.sprayMistGroup.visible=!1}function Wm(n){let e=(n??"calm").trim().toLowerCase();return e==="laugh"||e==="laughing"||e==="excited"?"laughing":e==="surprised"||e==="shocked"||e==="gasp"?"surprised":e==="angry"||e==="shouting"||e==="determined"?"angry":e==="sad"||e==="worried"||e==="scared"?"sad":e==="happy"||e==="loving"||e==="hopeful"||e==="relieved"?"happy":e==="proud"||e==="dramatic"?"proud":e==="confused"||e==="shy"?"confused":"calm"}function Zh(n){switch(n){case"CosmosSacred3D":return"Cosmos";case"HistoryChronicle3D":return"Archive";case"NeonCyberGrid3D":return"ModernCity";case"SereneNatureGlow":return"ForestAshram";case"ComedyStage3D":return"ComedyStage";default:return"Temple"}}function Xm(n,e){let t=n.sceneRuns??[];if(t.length===0){let l=Math.max(0,Math.min(1,e/Math.max(1,n.durationSeconds))),c=Zh(n.theme);return n.hasCharacters&&n.turns.length>=5&&n.theme==="VedicTempleSunrise3D"&&(c=l<.34?"Temple":l<.68?"ForestAshram":"Cosmos"),{setting:c,timeOfDay:"Dawn",sceneIndex:0,startSeconds:0,localProgress:l}}let i=0;for(;i+1<t.length&&e>=t[i+1].startSeconds;)i++;let s=t[i],r=s.endSeconds>0?s.endSeconds:n.durationSeconds,o=Math.max(0,Math.min(1,(e-s.startSeconds)/Math.max(.5,r-s.startSeconds)));return{setting:s.setting==="Auto"?Zh(n.theme):s.setting,timeOfDay:s.timeOfDay==="Auto"?"Dawn":s.timeOfDay,sceneIndex:Math.max(0,s.sceneIndex),startSeconds:s.startSeconds,localProgress:o,activeCharacters:s.activeCharacters,characterEntryAt:s.characterEntryAt}}async function Ym(n){let e=[];for(let t=0;t<n.backdropCount;t++){let i=await fetch(`/backdrop/${t}.rgba`);if(!i.ok)continue;let s=new Uint8Array(await i.arrayBuffer());if(s.byteLength!==n.width*n.height*4)continue;let r=new Fs(s,n.width,n.height,nn);r.flipY=!0,r.colorSpace=Ut,r.needsUpdate=!0,e.push(r)}return e}function qm(n,e){let t=n.speechEnvelope;if(!t||t.length===0)return .35;let i=Math.max(0,Math.min(t.length-1,e));return t[i]??0}function Zm(n,e){return n.turns.find(t=>!t.isTitleHook&&e>=t.startSeconds-.005&&e<=t.endSeconds+.005)}function Jm(n,e,t,i){if(t)return t;let s=n.turns.filter(r=>!r.isTitleHook);if(s.length!==0){if(e<s[0].startSeconds)return s[0].action==="sleeping"||s[0].action==="sitting"?s[0]:void 0;for(let r=s.length-1;r>=0;r--)if(s[r].endSeconds<=e){let o=s[r],a=r+1<s.length?s[r+1]:void 0;return a&&a.sceneBackdropCue!==o.sceneBackdropCue&&e>=a.startSeconds-.1?a:!o.sceneBackdropCue||o.sceneBackdropCue.startsWith(i)?o:void 0}}}function Jh(n,e){let t=e?1.55:2.55,i=(n.x-.5)*2*t,s=Math.max(0,(.72-n.y)*2.2);return{x:i,y:s,scale:Math.max(.5,Math.min(1.8,n.scale||1))}}function Km(n){n.traverse(e=>{let t=e;t.isReflector&&t.dispose&&t.dispose();let i=e;i.geometry&&i.geometry.dispose();let s=i.material;Array.isArray(s)?s.forEach(r=>r?.dispose()):s&&s.dispose()})}async function $m(){try{let n=await fetch("/job.json");if(!n.ok)throw new Error(`Failed to load /job.json: ${n.status}`);let e=await n.json(),t=document.getElementById("stage");t.width=e.width,t.height=e.height;let i=new la({canvas:t,antialias:!0,preserveDrawingBuffer:!0,powerPreference:"high-performance"});i.setSize(e.width,e.height,!1),i.setPixelRatio(1),i.shadowMap.enabled=!0,i.shadowMap.type=fo,i.toneMapping=_o,i.toneMappingExposure=1.08,i.outputColorSpace=Ut;let s=await Ym(e),r=i.getContext(),o=e.width*e.height*4,a=new Uint8Array(o),l=e.height>e.width,c=kh(e),h=null,u=null;if(e.showWatermark!==!1&&(e.footerLabel||e.isComedyMode)){let B=Math.round(Math.max(158,Math.min(212,e.width*.17))),te=Math.round(B*.26),re=document.createElement("canvas");re.width=512,re.height=132;let j=re.getContext("2d");j.fillStyle="rgba(15, 23, 42, 0.78)",j.beginPath(),j.roundRect(6,6,500,120,26),j.fill(),j.strokeStyle="#f59e0b",j.lineWidth=4,j.stroke(),j.fillStyle="#f59e0b",j.beginPath(),j.arc(64,66,36,0,Math.PI*2),j.fill(),j.fillStyle="#0f172a",j.font="bold 34px sans-serif",j.textAlign="center",j.textBaseline="middle",j.fillText("KS",64,68);let xe=(e.footerLabel&&e.footerLabel.trim().length>0?e.footerLabel.trim():"KESHAV STUDIO").toUpperCase().slice(0,18);j.fillStyle="#f8fafc",j.font="bold 28px sans-serif",j.textAlign="left",j.fillText(xe,118,54),j.fillStyle="#fbbf24",j.font="600 18px sans-serif",j.fillText("ANIMSTUDIO 3D",118,90);let pe=new Xn(re);pe.colorSpace=Ut;let W=new ke({map:pe,transparent:!0,depthTest:!1,depthWrite:!1}),ue=new y(new rt(B,te),W),ee=l?18:22,le=l?62:16;ue.position.set(e.width-B*.5-ee,e.height-te*.5-le,0),h=new Ti,h.add(ue),u=new Ci(0,e.width,e.height,0,-10,10),i.autoClear=!1}let p=null,f=null,g=new Ti,m=null,E=null,d=null,_=null,M=[],x=l?-.6:-1.05,b=l?.6:1.05,R=0,A=(B,te)=>{g&&Km(g);let re=new Ti,j=Wh(re,e,B,te,s),xe=Yh(re,B,e.vfxStyle,e.palette.primaryHex,e.palette.secondaryHex,e.seed),pe=null,W=null,ue=[];if(e.hasCharacters&&e.leftCharacter&&e.rightCharacter){let ee=e.stageLayout?.left,le=e.stageLayout?.right,X=ee?Jh(ee,l):{x,y:R,scale:1},U=le?Jh(le,l):{x:b,y:R,scale:1},D=.12,fe=.12,we=.42,Oe=-.42;if(B==="BarberShop"&&!e.stageLayout?.templateBackdrop&&j.spots.sofa&&j.spots.counter){let Je=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(e.leftCharacter.name??""),Re=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(e.rightCharacter.name??""),ze=Je&&!Re,Ae=j.spots.counter,P=j.spots.sofa;X=ze?{x:Ae.x,y:Ae.y,scale:1}:{x:P.x,y:P.y,scale:1},U=ze?{x:P.x,y:P.y,scale:1}:{x:Ae.x,y:Ae.y,scale:1},D=ze?Ae.z:P.z,fe=ze?P.z:Ae.z,we=ze?Ae.rotY??-.92:P.rotY??.22,Oe=ze?P.rotY??.22:Ae.rotY??-.92}let L=X.x<=U.x?1:-1;pe=ha(e.leftCharacter,e.palette.speakerAHex,B,L,0),pe.root.position.set(X.x,X.y,D),pe.root.rotation.y=we,pe.root.scale.setScalar(X.scale),re.add(pe.root),W=ha(e.rightCharacter,e.palette.speakerBHex,B,-L,1.7),W.root.position.set(U.x,U.y,fe),W.root.rotation.y=Oe,W.root.scale.setScalar(U.scale),re.add(W.root);let ct=B==="BarberShop"?l?e.supportingCast.length===1?[.78]:e.supportingCast.length===2?[.68,-1.22]:[.68,-1.22,1.08,-1.48,.34]:e.supportingCast.length===1?[1.76]:e.supportingCast.length===2?[1.38,2.12]:e.supportingCast.length===3?[1.14,1.72,2.3]:[.92,1.4,1.88,2.36,.48]:e.supportingCast.length===1?[0]:e.supportingCast.length===2?[-.48,.48]:e.supportingCast.length===3?[0,-.68,.68]:[-.36,.36,-.96,.96,0],Ce=B==="BarberShop"?l?-1.62:-1.48:-.86;ue=e.supportingCast.slice(0,5).map((Je,Re)=>{let ze=ha(Je,e.palette.secondaryHex,B,ct[Re]<=0?1:-1,3.1+Re*1.4),Ae=Re>=3?-.34:0;return ze.root.position.set(ct[Re],R+(B==="BarberShop"?.36:.05),Ce+Ae),ze.root.scale.setScalar(Re>=3?.72:.76),re.add(ze.root),ze})}g=re,m=j,E=xe,d=pe,_=W,M=ue,p=B,f=te},C=e.turns.find(B=>!B.isTitleHook&&B.action==="cutting")??e.turns.find(B=>!B.isTitleHook&&B.listenerAction==="cutting"),w=e.turns.find(B=>!B.isTitleHook&&(B.action==="removingTowel"||/तौलिया तो हटा|तौलिया हटा|remove towel/i.test(B.text??""))),v=e.turns.find(B=>!B.isTitleHook&&(B.action==="lookInMirror"||B.action==="removingTowel"||/टकला|कटोरा|मैदान साफ़|चाँद|चांद|शीशे में|mirror/i.test(B.text??""))),H=C?C.endSeconds:9999,z=w?w.startSeconds:9999,G=v?v.startSeconds+.08:Math.max(H+2.5,e.durationSeconds*.56),J=-1,Y=Math.max(1,e.totalFrames),Z=Math.max(0,Math.min(Y,e.startFrame??0)),se=Math.max(Z,Math.min(Y,e.endFrame??Y));for(let B=Z;B<se;B++){let te=B/e.fps,re=Math.max(0,Math.min(1,te/Math.max(1,e.durationSeconds))),j=Xm(e,te),xe=j.setting!==p||j.timeOfDay!==f;xe&&A(j.setting,j.timeOfDay);let pe=Zm(e,te),W=Jm(e,te,pe,j.setting),ue=!pe&&e.turns.some(Ge=>Ge.isTitleHook&&te>=Ge.startSeconds&&te<=Ge.endSeconds)&&te<(e.turns.find(Ge=>!Ge.isTitleHook)?.startSeconds??99),ee=pe?pe.index:-1,le=ee!==J;J=ee;let X=qm(e,B),U=Wm((pe??W)?.emotion),D=(pe??W)?.action||"none",fe=(pe??W)?.listenerAction||"none",we=(pe??W)?.speakerProp??null,Oe=(pe??W)?.listenerProp??null,L=(pe??W)?.cameraShot||"auto",ct=(pe??W)?.stageTarget||"default",Ce=pe??W,Je=Ce?Math.max(.2,Ce.endSeconds-Ce.startSeconds):1,Re=Ce?Math.max(0,Math.min(1,(te-Ce.startSeconds)/Je)):0,ze=Ce?M.findIndex(Ge=>Ge.name.toLowerCase()===Ce.speakerName.toLowerCase()):-1,Ae=ze<0&&!!pe&&pe.slot==="Left",P=ze<0&&!!pe&&pe.slot==="Right",T=ze<0&&Ce?.slot==="Left"?"Left":ze<0&&Ce?.slot==="Right"?"Right":"Narrator",V=Ce?.slot,Q=d,ae=_,$=V==="Left"?D:V==="Right"?fe:"none",Me=V==="Right"?D:V==="Left"?fe:"none";if(j.setting==="PalaceCourt"&&($==="dancing"||Me==="dancing"||$==="sufiSpin"||Me==="sufiSpin"||$==="adaab"||Me==="adaab")){let st=$==="dancing"||$==="adaab"||$==="sufiSpin"?$:Me;$==="none"&&($=st),Me==="none"&&(Me=st)}let ne=V==="Left"?we:V==="Right"?Oe:null,ce=V==="Right"?we:V==="Left"?Oe:null,Ue=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(Q?.name??""),he=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(ae?.name??""),Ee=Ue&&!he?"Left":he?"Right":ct==="barberStand"&&V==="Left"?"Left":"Right";j.setting==="BarberShop"&&(Ee==="Left"?(ne||(ne="scissors"),(ce==="scissors"||ce==="comb")&&(ce="cape"),($==="lookInMirror"||Me==="lookInMirror")&&(Me="lookInMirror",$==="lookInMirror"&&($="pointing"))):(ce||(ce="scissors"),(ne==="scissors"||ne==="comb")&&(ne="cape"),($==="lookInMirror"||Me==="lookInMirror")&&($="lookInMirror",Me==="lookInMirror"&&(Me="pointing"))));let Le=(Ge,st,Jt,dn,_n)=>{let Rt=R;if(e.stageLayout?.templateBackdrop)return{x:dn,y:Rt,z:.12,rotY:_n,seated:!1,showCape:!1};let Ve=m?.spots??{},Pt=Jt?ct:"default";if(j.setting==="BarberShop"){if(Ge===Ee)return{x:Ve.counter?.x??-.22,y:Rt,z:Ve.counter?.z??-.92,rotY:Ve.counter?.rotY??-.92,seated:!1,showCape:!1};if(Ve.sofa){let N=st!=="removingTowel"&&te<z-.1,q=st==="lookInMirror"||D==="lookInMirror"||fe==="lookInMirror",K=Re<.45?-.64+Math.sin(Re*Math.PI*2.2)*.22:.28;return{x:Ve.sofa.x,y:Ve.sofa.y,z:Ve.sofa.z,rotY:q?K:Ve.sofa.rotY??.22,seated:!0,showCape:N}}}if(j.setting==="Courtroom"){if(Pt==="judgeBench"&&Ve.sofa)return{x:Ve.sofa.x,y:Ve.sofa.y,z:Ve.sofa.z,rotY:Ve.sofa.rotY??.08,seated:!0,showCape:!1};if(Pt==="witnessStand"&&Ve.counter)return{x:Ve.counter.x,y:Ve.counter.y,z:Ve.counter.z,rotY:Ve.counter.rotY??.38,seated:!1,showCape:!1}}if(j.setting==="DoctorClinic"){if(Pt==="doctorDesk"&&Ve.sofa)return{x:Ve.sofa.x,y:Ve.sofa.y,z:Ve.sofa.z,rotY:Ve.sofa.rotY??-.35,seated:!1,showCape:!1};if(Pt==="patientBed"&&Ve.bed)return{x:Ve.bed.x+.15,y:.32,z:-.32,rotY:.32,seated:!0,showCape:!1}}if(st==="sleeping"&&Ve.bed)return{x:Ve.bed.x,y:Ve.bed.y,z:Ve.bed.z,rotY:Ve.bed.rotY??_n,seated:!1,showCape:!1};if(Pt==="bed"&&(st==="wakingUp"||st==="sitting")&&Ve.bed)return{x:Ve.bed.x+.28,y:.34,z:-.05,rotY:.35,seated:!0,showCape:!1};if((st==="sitting"||Pt==="sofa")&&Ve.sofa)return{x:Ve.sofa.x,y:Ve.sofa.y,z:Ve.sofa.z,rotY:Ve.sofa.rotY??_n,seated:!0,showCape:!1};if((Pt==="counter"||st==="eating"||st==="stirring")&&Ve.counter)return Ge==="Left"?{x:Ve.counter.x,y:Ve.counter.y,z:Ve.counter.z,rotY:Ve.counter.rotY??.3,seated:!1,showCape:!1}:{x:Math.max(.55,Ve.counter.x+.96),y:Ve.counter.y,z:-.22,rotY:-.48,seated:!1,showCape:!1};if(j.setting==="Kitchen"||j.setting==="SweetShop")return Ge==="Left"?{x:Ve.counter?.x??-.45,y:Rt,z:-.52,rotY:.34,seated:!1,showCape:!1}:{x:.6,y:Rt,z:-.18,rotY:-.46,seated:!1,showCape:!1};if(st==="walking"||st==="running"){let S=Re<.85?Math.min(1,Re/.85):1,N=S*S*(3-2*S),q=Pt==="door"&&Ve.door?Ve.door.x:dn*1.45,K=Pt==="door"&&Ve.door?Ve.door.z:-.35,k=Pt==="center"?dn*.45:dn,me=.22,Se=q+(k-q)*N,Be=K+(me-K)*N,Fe=k-q,Ze=Math.abs(Fe)>.05?Math.atan2(Fe,me-K)*.65:_n;return{x:Se,y:Rt,z:Be,rotY:Ze,seated:!1,showCape:!1}}return Pt==="center"||Jt&&st==="pointing"?{x:dn*.84,y:Rt,z:.18,rotY:_n*.78,seated:!1,showCape:!1}:{x:dn,y:Rt,z:.12,rotY:_n,seated:!1,showCape:!1}},Ne=1-Math.exp(-(e.isComedyMode?13.5:8.5)/Math.max(1,e.fps)),ve=!1,Ke=!1;if(Q&&!e.stageLayout?.templateBackdrop){let Ge=Le("Left",$,V==="Left",x,.42);ve=Ge.seated,Ke=Ge.showCape;let st=xe||le&&($==="sleeping"||$==="sitting"||Ge.seated)?1:Ne;Q.root.position.x+=(Ge.x-Q.root.position.x)*st,Q.root.position.y+=(Ge.y-Q.root.position.y)*st,Q.root.position.z+=(Ge.z-Q.root.position.z)*st,Q.root.rotation.y+=(Ge.rotY-Q.root.rotation.y)*st}let We=!1,tt=!1;if(ae&&!e.stageLayout?.templateBackdrop){let Ge=Le("Right",Me,V==="Right",b,-.42);We=Ge.seated,tt=Ge.showCape;let st=xe||le&&(Me==="sleeping"||Me==="sitting"||Ge.seated)?1:Ne;ae.root.position.x+=(Ge.x-ae.root.position.x)*st,ae.root.position.y+=(Ge.y-ae.root.position.y)*st,ae.root.position.z+=(Ge.z-ae.root.position.z)*st,ae.root.rotation.y+=(Ge.rotY-ae.root.rotation.y)*st}let O=Q?Q.root.position.x:x,_e=ae?ae.root.position.x:b,ie=Q?Q.root.position.y:R,de=ae?ae.root.position.y:R,Pe=Ae?U:$==="lookInMirror"||$==="shockedFall"?"surprised":"calm",Te=P?U:Me==="shockedFall"?"surprised":"calm",$e=e.turns.find(Ge=>!Ge.isTitleHook),ft=Ce&&!Ce.isTitleHook?Ce:$e,yt=ft?.slot,at=yt==="Left"?ft?.speakerGlasses??null:yt==="Right"?ft?.listenerGlasses??null:null,Xt=yt==="Right"?ft?.speakerGlasses??null:yt==="Left"?ft?.listenerGlasses??null:null,Nt=j.setting!=="BarberShop"?0:te>=G||$==="lookInMirror"||Me==="lookInMirror"?2:C&&te>=C.startSeconds?1:0,pi=Ee==="Left"?0:Nt,An=Ee==="Right"?0:Nt;m&&Xh(m,te,re,j.sceneIndex,j.localProgress,e.stageLayout),Q&&ua(Q,te,Ae,X,Pe,ue,$,Re,xe,ne,ve,Ke,at,pi),ae&&ua(ae,te,P,X,Te,ue,Me,Re,xe,ce,We,tt,Xt,An),M.forEach((Ge,st)=>{let Jt=st===ze;if(j.setting==="BarberShop")Ge.root.position.z=-1.52,Ge.root.position.y=Jt?.34:.3,Ge.root.scale.setScalar(Jt?.8:.76);else if(j.setting==="PalaceCourt"){let Pt=st%2===0?-1:1,S=Math.floor(st/2);Ge.root.position.x=Pt*(1.82+S*.72),Ge.root.position.z=-.68-S*.44,Ge.root.position.y=0,Ge.root.scale.setScalar(.94)}else Ge.root.position.z=Jt?-.35:-.82,Ge.root.scale.setScalar(Jt?.94:.88);let dn=Jt?U:U==="angry"||U==="surprised"?"surprised":U==="laughing"?"laughing":"calm",Rt=Jt?D:($==="dancing"||Me==="dancing"||$==="adaab"||$==="sufiSpin")&&j.setting==="PalaceCourt"?$==="dancing"||$==="adaab"||$==="sufiSpin"?$:Me:D==="punching"||D==="kicking"?"shockedFall":"none",Ve=Jt&&j.setting!=="BarberShop"?we:null;ua(Ge,te,Jt,X,dn,!1,Rt,Re,xe,Ve,j.setting==="BarberShop",!1,"none",0)});let rn=!e.isComedyMode&&!e.stageLayout?.templateBackdrop&&(e.sceneRuns?.length??0)>1,yn=O,on=_e,Cn=T,Mn=T==="Left"?ie+(Q?.headY??1.4):T==="Right"?de+(ae?.headY??1.4):1.38;if(rn){let Ge=e.sceneRuns?.[1]?.activeCharacters?.slice(0,2)??[Q?.name,ae?.name].filter(S=>!!S),st=(j.activeCharacters?.length??0)>0?j.activeCharacters:Ge,Jt=j.characterEntryAt??{},dn=S=>{let N=st.find(k=>k.toLowerCase()===S.toLowerCase()),q=!!pe&&pe.speakerName.toLowerCase()===S.toLowerCase();return!N&&!q?null:Object.entries(Jt).find(([k])=>k.toLowerCase()===S.toLowerCase())?.[1]??j.startSeconds},_n=[...Q?[Q]:[],...ae?[ae]:[],...M],Rt=[];for(let S of _n){let N=dn(S.name),q=N!==null&&te>=N-.04;S.root.visible=q,q&&N!==null&&Rt.push({rig:S,entryAt:N})}let Ve=Rt.length,Pt=l?.56:.88;if(Rt.forEach(({rig:S,entryAt:N},q)=>{let K=0,k=.14,me=0;Ve===1?(K=0,k=.16,me=.12):Ve===2?(K=q===0?-Pt:Pt,k=.16,me=q===0?.42:-.42):(K=[-Pt*1.15,.04,Pt*1.15][q]??(q-1)*.65,k=q===1?-.18:.16,me=K<-.1?.44:K>.1?-.44:.08);let Se=Math.max(0,te-N),Be=Se<.72?Math.sin(Se/.72*Math.PI*.5):1,Ze=S.role==="Divine"&&N>j.startSeconds+.25&&Se<.9?(1-Be)*.85:0,Ye=xe||Se<.06?1:Ne;S.root.position.x+=(K-S.root.position.x)*Ye,S.root.position.y+=(Ze-S.root.position.y)*Ye,S.root.position.z+=(k-S.root.position.z)*Ye,S.root.rotation.y+=(me-S.root.rotation.y)*Ye;let Xe=Se<.55?.78+.22*Be:1;S.root.scale.setScalar(Xe)}),Rt.length>0){yn=Math.min(...Rt.map(N=>N.rig.root.position.x)),on=Math.max(...Rt.map(N=>N.rig.root.position.x));let S=Ce?Rt.find(N=>N.rig.name.toLowerCase()===Ce.speakerName.toLowerCase())?.rig:void 0;S?(Cn=S.root.position.x<=.05?"Left":"Right",Mn=S.root.position.y+S.headY):(Cn="Narrator",Mn=Rt[0].rig.root.position.y+Rt[0].rig.headY)}}let Ct=!!e.memeCues?.some(Ge=>te>=Ge.startSeconds-.05&&te<=Ge.startSeconds+Math.min(.75,Ge.seconds));E&&qh(E,te,re,Cn,yn,on,U,Re,e.palette.primaryHex,e.palette.secondaryHex,$,Me,ie,de,Ct,Pe,Te),zh(c,e,te,re,Cn,yn,on,U,ue,Ct?"crashPunch":L,D,le||xe,Re,Mn,j.setting),h&&u?(i.clear(),i.render(g,c.camera),i.clearDepth(),i.render(h,u)):i.render(g,c.camera),r.readPixels(0,0,e.width,e.height,r.RGBA,r.UNSIGNED_BYTE,a);let vt=await fetch(`/frame/${B}`,{method:"POST",headers:{"Content-Type":"application/octet-stream"},body:a});if(!vt.ok)throw new Error(`Frame ${B} upload failed: ${vt.status}`)}await fetch("/done",{method:"POST"}),document.title="DONE"}catch(n){let e=n instanceof Error?n.stack||n.message:String(n);await fetch("/error",{method:"POST",body:e}).catch(()=>{}),document.title="ERROR"}}$m();})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
