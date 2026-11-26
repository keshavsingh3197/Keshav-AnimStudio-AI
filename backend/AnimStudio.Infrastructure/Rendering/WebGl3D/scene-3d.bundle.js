"use strict";(()=>{var $c=0,Sl=1,Qc=2;var vl=1,Go=2,Vn=3,ti=0,jt=1,Mt=2,ri=0,ki=1,Wn=2,bl=3,Rl=4,jc=5,Ti=100,eh=101,th=102,nh=103,ih=104,sh=200,rh=201,oh=202,ah=203,ro=204,oo=205,lh=206,ch=207,hh=208,dh=209,uh=210,fh=211,ph=212,mh=213,Eh=214,Uo=0,Fo=1,No=2,Oi=3,ko=4,Oo=5,zo=6,Vo=7,Cl=0,gh=1,Mh=2,oi=0,yh=1,xh=2,Th=3,Wo=4,wh=5,_h=6,Sh=7;var Al=300,$i=301,Qi=302,Xo=303,Yo=304,xr=306,ni=1e3,xi=1001,ao=1002,pn=1003,vh=1004;var Tr=1005;var Gn=1006,qo=1007;var bi=1008;var Xn=1009,Hl=1010,Pl=1011,Is=1012,Zo=1013,Ri=1014,Yn=1015,Ci=1016,Jo=1017,Ko=1018,Ds=1020,Il=35902,Dl=1021,Ll=1022,En=1023,Bl=1024,Gl=1025,_s=1026,Ls=1027,Ul=1028,$o=1029,Fl=1030,Qo=1031;var jo=1033,wr=33776,_r=33777,Sr=33778,vr=33779,ea=35840,ta=35841,na=35842,ia=35843,sa=36196,ra=37492,oa=37496,aa=37808,la=37809,ca=37810,ha=37811,da=37812,ua=37813,fa=37814,pa=37815,ma=37816,Ea=37817,ga=37818,Ma=37819,ya=37820,xa=37821,br=36492,Ta=36494,wa=36495,Nl=36283,_a=36284,Sa=36285,va=36286;var Ks=2300,lo=2301,so=2302,ul=2400,fl=2401,pl=2402;var bh=3200,Rh=3201;var kl=0,Ch=1,ai="",At="srgb",zi="srgb-linear",$s="linear",Rt="srgb";var Ni=7680;var ml=519,Ah=512,Hh=513,Ph=514,Ol=515,Ih=516,Dh=517,Lh=518,Bh=519,El=35044;var zl="300 es",Nn=2e3,Qs=2001;var ii=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},nn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Tc=1234567,Ys=Math.PI/180,Vi=180/Math.PI;function Bs(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(nn[n&255]+nn[n>>8&255]+nn[n>>16&255]+nn[n>>24&255]+"-"+nn[e&255]+nn[e>>8&255]+"-"+nn[e>>16&15|64]+nn[e>>24&255]+"-"+nn[t&63|128]+nn[t>>8&255]+"-"+nn[t>>16&255]+nn[t>>24&255]+nn[i&255]+nn[i>>8&255]+nn[i>>16&255]+nn[i>>24&255]).toLowerCase()}function ht(n,e,t){return Math.max(e,Math.min(t,n))}function Vl(n,e){return(n%e+e)%e}function Zd(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function Jd(n,e,t){return n!==e?(t-n)/(e-n):0}function qs(n,e,t){return(1-t)*n+t*e}function Kd(n,e,t,i){return qs(n,e,1-Math.exp(-t*i))}function $d(n,e=1){return e-Math.abs(Vl(n,e*2)-e)}function Qd(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function jd(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function eu(n,e){return n+Math.floor(Math.random()*(e-n+1))}function tu(n,e){return n+Math.random()*(e-n)}function nu(n){return n*(.5-Math.random())}function iu(n){n!==void 0&&(Tc=n);let e=Tc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function su(n){return n*Ys}function ru(n){return n*Vi}function ou(n){return(n&n-1)===0&&n!==0}function au(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function lu(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function cu(n,e,t,i,s){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+i)/2),h=o((e+i)/2),d=r((e-i)/2),u=o((e-i)/2),p=r((i-e)/2),f=o((i-e)/2);switch(s){case"XYX":n.set(a*h,l*d,l*u,a*c);break;case"YZY":n.set(l*u,a*h,l*d,a*c);break;case"ZXZ":n.set(l*d,l*u,a*h,a*c);break;case"XZX":n.set(a*h,l*f,l*p,a*c);break;case"YXY":n.set(l*p,a*h,l*f,a*c);break;case"ZYZ":n.set(l*f,l*p,a*h,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ts(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function ln(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var Rr={DEG2RAD:Ys,RAD2DEG:Vi,generateUUID:Bs,clamp:ht,euclideanModulo:Vl,mapLinear:Zd,inverseLerp:Jd,lerp:qs,damp:Kd,pingpong:$d,smoothstep:Qd,smootherstep:jd,randInt:eu,randFloat:tu,randFloatSpread:nu,seededRandom:iu,degToRad:su,radToDeg:ru,isPowerOfTwo:ou,ceilPowerOfTwo:au,floorPowerOfTwo:lu,setQuaternionFromProperEuler:cu,normalize:ln,denormalize:Ts},Be=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ht(this.x,e.x,t.x),this.y=ht(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ht(this.x,e,t),this.y=ht(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ht(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ht(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},at=class n{constructor(e,t,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],d=i[7],u=i[2],p=i[5],f=i[8],E=s[0],M=s[3],m=s[6],w=s[1],y=s[4],x=s[7],b=s[2],v=s[5],R=s[8];return r[0]=o*E+a*w+l*b,r[3]=o*M+a*y+l*v,r[6]=o*m+a*x+l*R,r[1]=c*E+h*w+d*b,r[4]=c*M+h*y+d*v,r[7]=c*m+h*x+d*R,r[2]=u*E+p*w+f*b,r[5]=u*M+p*y+f*v,r[8]=u*m+p*x+f*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=h*o-a*c,u=a*l-h*r,p=c*r-o*l,f=t*d+i*u+s*p;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);let E=1/f;return e[0]=d*E,e[1]=(s*c-h*i)*E,e[2]=(a*i-s*o)*E,e[3]=u*E,e[4]=(h*t-s*l)*E,e[5]=(s*r-a*t)*E,e[6]=p*E,e[7]=(i*l-c*t)*E,e[8]=(o*t-i*r)*E,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(ka.makeScale(e,t)),this}rotate(e){return this.premultiply(ka.makeRotation(-e)),this}translate(e,t){return this.premultiply(ka.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},ka=new at;function Wl(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function js(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Gh(){let n=js("canvas");return n.style.display="block",n}var wc={};function Cr(n){n in wc||(wc[n]=!0,console.warn(n))}function Uh(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function Fh(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Nh(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var _c=new at().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Sc=new at().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function hu(){let n={enabled:!0,workingColorSpace:zi,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===Rt&&(s.r=ei(s.r),s.g=ei(s.g),s.b=ei(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Rt&&(s.r=ws(s.r),s.g=ws(s.g),s.b=ws(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ai?$s:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[zi]:{primaries:e,whitePoint:i,transfer:$s,toXYZ:_c,fromXYZ:Sc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:At},outputColorSpaceConfig:{drawingBufferColorSpace:At}},[At]:{primaries:e,whitePoint:i,transfer:Rt,toXYZ:_c,fromXYZ:Sc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:At}}}),n}var wt=hu();function ei(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ws(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var cs,co=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{cs===void 0&&(cs=js("canvas")),cs.width=e.width,cs.height=e.height;let s=cs.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=cs}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=js("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=ei(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(ei(t[i]/255)*255):t[i]=ei(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},du=0,Ss=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:du++}),this.uuid=Bs(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Oa(s[o].image)):r.push(Oa(s[o]))}else r=Oa(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function Oa(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?co.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var uu=0,cn=class n extends ii{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=xi,s=xi,r=Gn,o=bi,a=En,l=Xn,c=n.DEFAULT_ANISOTROPY,h=ai){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:uu++}),this.uuid=Bs(),this.name="",this.source=new Ss(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Be(0,0),this.repeat=new Be(1,1),this.center=new Be(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new at,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Al)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ni:e.x=e.x-Math.floor(e.x);break;case xi:e.x=e.x<0?0:1;break;case ao:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ni:e.y=e.y-Math.floor(e.y);break;case xi:e.y=e.y<0?0:1;break;case ao:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};cn.DEFAULT_IMAGE=null;cn.DEFAULT_MAPPING=Al;cn.DEFAULT_ANISOTROPY=1;var vt=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],d=l[8],u=l[1],p=l[5],f=l[9],E=l[2],M=l[6],m=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-E)<.01&&Math.abs(f-M)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+E)<.1&&Math.abs(f+M)<.1&&Math.abs(c+p+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let y=(c+1)/2,x=(p+1)/2,b=(m+1)/2,v=(h+u)/4,R=(d+E)/4,C=(f+M)/4;return y>x&&y>b?y<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(y),s=v/i,r=R/i):x>b?x<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),i=v/s,r=C/s):b<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),i=R/r,s=C/r),this.set(i,s,r,t),this}let w=Math.sqrt((M-f)*(M-f)+(d-E)*(d-E)+(u-h)*(u-h));return Math.abs(w)<.001&&(w=1),this.x=(M-f)/w,this.y=(d-E)/w,this.z=(u-h)/w,this.w=Math.acos((c+p+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ht(this.x,e.x,t.x),this.y=ht(this.y,e.y,t.y),this.z=ht(this.z,e.z,t.z),this.w=ht(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ht(this.x,e,t),this.y=ht(this.y,e,t),this.z=ht(this.z,e,t),this.w=ht(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ht(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},ho=class extends ii{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new vt(0,0,e,t),this.scissorTest=!1,this.viewport=new vt(0,0,e,t);let s={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Gn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new cn(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ss(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Cn=class extends ho{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},er=class extends cn{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=pn,this.minFilter=pn,this.wrapR=xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var uo=class extends cn{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=pn,this.minFilter=pn,this.wrapR=xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Nt=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],d=i[s+3],u=r[o+0],p=r[o+1],f=r[o+2],E=r[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d;return}if(a===1){e[t+0]=u,e[t+1]=p,e[t+2]=f,e[t+3]=E;return}if(d!==E||l!==u||c!==p||h!==f){let M=1-a,m=l*u+c*p+h*f+d*E,w=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){let b=Math.sqrt(y),v=Math.atan2(b,m*w);M=Math.sin(M*v)/b,a=Math.sin(a*v)/b}let x=a*w;if(l=l*M+u*x,c=c*M+p*x,h=h*M+f*x,d=d*M+E*x,M===1-a){let b=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=b,c*=b,h*=b,d*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],d=r[o],u=r[o+1],p=r[o+2],f=r[o+3];return e[t]=a*f+h*d+l*p-c*u,e[t+1]=l*f+h*u+c*d-a*p,e[t+2]=c*f+h*p+a*u-l*d,e[t+3]=h*f-a*d-l*u-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),d=a(r/2),u=l(i/2),p=l(s/2),f=l(r/2);switch(o){case"XYZ":this._x=u*h*d+c*p*f,this._y=c*p*d-u*h*f,this._z=c*h*f+u*p*d,this._w=c*h*d-u*p*f;break;case"YXZ":this._x=u*h*d+c*p*f,this._y=c*p*d-u*h*f,this._z=c*h*f-u*p*d,this._w=c*h*d+u*p*f;break;case"ZXY":this._x=u*h*d-c*p*f,this._y=c*p*d+u*h*f,this._z=c*h*f+u*p*d,this._w=c*h*d-u*p*f;break;case"ZYX":this._x=u*h*d-c*p*f,this._y=c*p*d+u*h*f,this._z=c*h*f-u*p*d,this._w=c*h*d+u*p*f;break;case"YZX":this._x=u*h*d+c*p*f,this._y=c*p*d+u*h*f,this._z=c*h*f-u*p*d,this._w=c*h*d-u*p*f;break;case"XZY":this._x=u*h*d-c*p*f,this._y=c*p*d-u*h*f,this._z=c*h*f+u*p*d,this._w=c*h*d+u*p*f;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],d=t[10],u=i+a+d;if(u>0){let p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(o-s)*p}else if(i>a&&i>d){let p=2*Math.sqrt(1+i-a-d);this._w=(h-l)/p,this._x=.25*p,this._y=(s+o)/p,this._z=(r+c)/p}else if(a>d){let p=2*Math.sqrt(1+a-i-d);this._w=(r-c)/p,this._x=(s+o)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+d-i-a);this._w=(o-s)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ht(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+i*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let p=1-t;return this._w=p*o+t*this._w,this._x=p*i+t*this._x,this._y=p*s+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),d=Math.sin((1-t)*h)/c,u=Math.sin(t*h)/c;return this._w=o*d+this._w*u,this._x=i*d+this._x*u,this._y=s*d+this._y*u,this._z=r*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(vc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(vc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),h=2*(a*t-r*s),d=2*(r*i-o*t);return this.x=t+l*c+o*d-a*h,this.y=i+l*h+a*c-r*d,this.z=s+l*d+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ht(this.x,e.x,t.x),this.y=ht(this.y,e.y,t.y),this.z=ht(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ht(this.x,e,t),this.y=ht(this.y,e,t),this.z=ht(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(ht(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return za.copy(this).projectOnVector(e),this.sub(za)}reflect(e){return this.sub(za.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(ht(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},za=new D,vc=new Nt,kn=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Dn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Dn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Dn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Dn):Dn.fromBufferAttribute(r,o),Dn.applyMatrix4(e.matrixWorld),this.expandByPoint(Dn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Br.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Br.copy(i.boundingBox)),Br.applyMatrix4(e.matrixWorld),this.union(Br)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Dn),Dn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ks),Gr.subVectors(this.max,ks),hs.subVectors(e.a,ks),ds.subVectors(e.b,ks),us.subVectors(e.c,ks),fi.subVectors(ds,hs),pi.subVectors(us,ds),Bi.subVectors(hs,us);let t=[0,-fi.z,fi.y,0,-pi.z,pi.y,0,-Bi.z,Bi.y,fi.z,0,-fi.x,pi.z,0,-pi.x,Bi.z,0,-Bi.x,-fi.y,fi.x,0,-pi.y,pi.x,0,-Bi.y,Bi.x,0];return!Va(t,hs,ds,us,Gr)||(t=[1,0,0,0,1,0,0,0,1],!Va(t,hs,ds,us,Gr))?!1:(Ur.crossVectors(fi,pi),t=[Ur.x,Ur.y,Ur.z],Va(t,hs,ds,us,Gr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Dn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Dn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Jn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Jn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Jn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Jn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Jn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Jn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Jn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Jn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Jn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Jn=[new D,new D,new D,new D,new D,new D,new D,new D],Dn=new D,Br=new kn,hs=new D,ds=new D,us=new D,fi=new D,pi=new D,Bi=new D,ks=new D,Gr=new D,Ur=new D,Gi=new D;function Va(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){Gi.fromArray(n,r);let a=s.x*Math.abs(Gi.x)+s.y*Math.abs(Gi.y)+s.z*Math.abs(Gi.z),l=e.dot(Gi),c=t.dot(Gi),h=i.dot(Gi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var fu=new kn,Os=new D,Wa=new D,On=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):fu.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Os.subVectors(e,this.center);let t=Os.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Os,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Wa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Os.copy(e.center).add(Wa)),this.expandByPoint(Os.copy(e.center).sub(Wa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Kn=new D,Xa=new D,Fr=new D,mi=new D,Ya=new D,Nr=new D,qa=new D,Wi=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Kn.copy(this.origin).addScaledVector(this.direction,t),Kn.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Xa.copy(e).add(t).multiplyScalar(.5),Fr.copy(t).sub(e).normalize(),mi.copy(this.origin).sub(Xa);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Fr),a=mi.dot(this.direction),l=-mi.dot(Fr),c=mi.lengthSq(),h=Math.abs(1-o*o),d,u,p,f;if(h>0)if(d=o*l-a,u=o*a-l,f=r*h,d>=0)if(u>=-f)if(u<=f){let E=1/h;d*=E,u*=E,p=d*(d+o*u+2*a)+u*(o*d+u+2*l)+c}else u=r,d=Math.max(0,-(o*u+a)),p=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(o*u+a)),p=-d*d+u*(u+2*l)+c;else u<=-f?(d=Math.max(0,-(-o*r+a)),u=d>0?-r:Math.min(Math.max(-r,-l),r),p=-d*d+u*(u+2*l)+c):u<=f?(d=0,u=Math.min(Math.max(-r,-l),r),p=u*(u+2*l)+c):(d=Math.max(0,-(o*r+a)),u=d>0?r:Math.min(Math.max(-r,-l),r),p=-d*d+u*(u+2*l)+c);else u=o>0?-r:r,d=Math.max(0,-(o*u+a)),p=-d*d+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Xa).addScaledVector(Fr,u),p}intersectSphere(e,t){Kn.subVectors(e.center,this.origin);let i=Kn.dot(this.direction),s=Kn.dot(Kn)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,s=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,s=(e.min.x-u.x)*c),h>=0?(r=(e.min.y-u.y)*h,o=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,o=(e.min.y-u.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-u.z)*d,l=(e.max.z-u.z)*d):(a=(e.max.z-u.z)*d,l=(e.min.z-u.z)*d),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Kn)!==null}intersectTriangle(e,t,i,s,r){Ya.subVectors(t,e),Nr.subVectors(i,e),qa.crossVectors(Ya,Nr);let o=this.direction.dot(qa),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;mi.subVectors(this.origin,e);let l=a*this.direction.dot(Nr.crossVectors(mi,Nr));if(l<0)return null;let c=a*this.direction.dot(Ya.cross(mi));if(c<0||l+c>o)return null;let h=-a*mi.dot(qa);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},xt=class n{constructor(e,t,i,s,r,o,a,l,c,h,d,u,p,f,E,M){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,h,d,u,p,f,E,M)}set(e,t,i,s,r,o,a,l,c,h,d,u,p,f,E,M){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=s,m[1]=r,m[5]=o,m[9]=a,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=p,m[7]=f,m[11]=E,m[15]=M,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/fs.setFromMatrixColumn(e,0).length(),r=1/fs.setFromMatrixColumn(e,1).length(),o=1/fs.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let u=o*h,p=o*d,f=a*h,E=a*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=p+f*c,t[5]=u-E*c,t[9]=-a*l,t[2]=E-u*c,t[6]=f+p*c,t[10]=o*l}else if(e.order==="YXZ"){let u=l*h,p=l*d,f=c*h,E=c*d;t[0]=u+E*a,t[4]=f*a-p,t[8]=o*c,t[1]=o*d,t[5]=o*h,t[9]=-a,t[2]=p*a-f,t[6]=E+u*a,t[10]=o*l}else if(e.order==="ZXY"){let u=l*h,p=l*d,f=c*h,E=c*d;t[0]=u-E*a,t[4]=-o*d,t[8]=f+p*a,t[1]=p+f*a,t[5]=o*h,t[9]=E-u*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let u=o*h,p=o*d,f=a*h,E=a*d;t[0]=l*h,t[4]=f*c-p,t[8]=u*c+E,t[1]=l*d,t[5]=E*c+u,t[9]=p*c-f,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let u=o*l,p=o*c,f=a*l,E=a*c;t[0]=l*h,t[4]=E-u*d,t[8]=f*d+p,t[1]=d,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=p*d+f,t[10]=u-E*d}else if(e.order==="XZY"){let u=o*l,p=o*c,f=a*l,E=a*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=u*d+E,t[5]=o*h,t[9]=p*d-f,t[2]=f*d-p,t[6]=a*h,t[10]=E*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(pu,e,mu)}lookAt(e,t,i){let s=this.elements;return xn.subVectors(e,t),xn.lengthSq()===0&&(xn.z=1),xn.normalize(),Ei.crossVectors(i,xn),Ei.lengthSq()===0&&(Math.abs(i.z)===1?xn.x+=1e-4:xn.z+=1e-4,xn.normalize(),Ei.crossVectors(i,xn)),Ei.normalize(),kr.crossVectors(xn,Ei),s[0]=Ei.x,s[4]=kr.x,s[8]=xn.x,s[1]=Ei.y,s[5]=kr.y,s[9]=xn.y,s[2]=Ei.z,s[6]=kr.z,s[10]=xn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],d=i[5],u=i[9],p=i[13],f=i[2],E=i[6],M=i[10],m=i[14],w=i[3],y=i[7],x=i[11],b=i[15],v=s[0],R=s[4],C=s[8],_=s[12],T=s[1],I=s[5],G=s[9],F=s[13],k=s[2],Y=s[6],X=s[10],ie=s[14],O=s[3],re=s[7],ee=s[11],be=s[15];return r[0]=o*v+a*T+l*k+c*O,r[4]=o*R+a*I+l*Y+c*re,r[8]=o*C+a*G+l*X+c*ee,r[12]=o*_+a*F+l*ie+c*be,r[1]=h*v+d*T+u*k+p*O,r[5]=h*R+d*I+u*Y+p*re,r[9]=h*C+d*G+u*X+p*ee,r[13]=h*_+d*F+u*ie+p*be,r[2]=f*v+E*T+M*k+m*O,r[6]=f*R+E*I+M*Y+m*re,r[10]=f*C+E*G+M*X+m*ee,r[14]=f*_+E*F+M*ie+m*be,r[3]=w*v+y*T+x*k+b*O,r[7]=w*R+y*I+x*Y+b*re,r[11]=w*C+y*G+x*X+b*ee,r[15]=w*_+y*F+x*ie+b*be,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],d=e[6],u=e[10],p=e[14],f=e[3],E=e[7],M=e[11],m=e[15];return f*(+r*l*d-s*c*d-r*a*u+i*c*u+s*a*p-i*l*p)+E*(+t*l*p-t*c*u+r*o*u-s*o*p+s*c*h-r*l*h)+M*(+t*c*d-t*a*p-r*o*d+i*o*p+r*a*h-i*c*h)+m*(-s*a*h-t*l*d+t*a*u+s*o*d-i*o*u+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=e[9],u=e[10],p=e[11],f=e[12],E=e[13],M=e[14],m=e[15],w=d*M*c-E*u*c+E*l*p-a*M*p-d*l*m+a*u*m,y=f*u*c-h*M*c-f*l*p+o*M*p+h*l*m-o*u*m,x=h*E*c-f*d*c+f*a*p-o*E*p-h*a*m+o*d*m,b=f*d*l-h*E*l-f*a*u+o*E*u+h*a*M-o*d*M,v=t*w+i*y+s*x+r*b;if(v===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/v;return e[0]=w*R,e[1]=(E*u*r-d*M*r-E*s*p+i*M*p+d*s*m-i*u*m)*R,e[2]=(a*M*r-E*l*r+E*s*c-i*M*c-a*s*m+i*l*m)*R,e[3]=(d*l*r-a*u*r-d*s*c+i*u*c+a*s*p-i*l*p)*R,e[4]=y*R,e[5]=(h*M*r-f*u*r+f*s*p-t*M*p-h*s*m+t*u*m)*R,e[6]=(f*l*r-o*M*r-f*s*c+t*M*c+o*s*m-t*l*m)*R,e[7]=(o*u*r-h*l*r+h*s*c-t*u*c-o*s*p+t*l*p)*R,e[8]=x*R,e[9]=(f*d*r-h*E*r-f*i*p+t*E*p+h*i*m-t*d*m)*R,e[10]=(o*E*r-f*a*r+f*i*c-t*E*c-o*i*m+t*a*m)*R,e[11]=(h*a*r-o*d*r-h*i*c+t*d*c+o*i*p-t*a*p)*R,e[12]=b*R,e[13]=(h*E*s-f*d*s+f*i*u-t*E*u-h*i*M+t*d*M)*R,e[14]=(f*a*s-o*E*s-f*i*l+t*E*l+o*i*M-t*a*M)*R,e[15]=(o*d*s-h*a*s+h*i*l-t*d*l-o*i*u+t*a*u)*R,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,d=a+a,u=r*c,p=r*h,f=r*d,E=o*h,M=o*d,m=a*d,w=l*c,y=l*h,x=l*d,b=i.x,v=i.y,R=i.z;return s[0]=(1-(E+m))*b,s[1]=(p+x)*b,s[2]=(f-y)*b,s[3]=0,s[4]=(p-x)*v,s[5]=(1-(u+m))*v,s[6]=(M+w)*v,s[7]=0,s[8]=(f+y)*R,s[9]=(M-w)*R,s[10]=(1-(u+E))*R,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=fs.set(s[0],s[1],s[2]).length(),o=fs.set(s[4],s[5],s[6]).length(),a=fs.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Ln.copy(this);let c=1/r,h=1/o,d=1/a;return Ln.elements[0]*=c,Ln.elements[1]*=c,Ln.elements[2]*=c,Ln.elements[4]*=h,Ln.elements[5]*=h,Ln.elements[6]*=h,Ln.elements[8]*=d,Ln.elements[9]*=d,Ln.elements[10]*=d,t.setFromRotationMatrix(Ln),i.x=r,i.y=o,i.z=a,this}makePerspective(e,t,i,s,r,o,a=Nn){let l=this.elements,c=2*r/(t-e),h=2*r/(i-s),d=(t+e)/(t-e),u=(i+s)/(i-s),p,f;if(a===Nn)p=-(o+r)/(o-r),f=-2*o*r/(o-r);else if(a===Qs)p=-o/(o-r),f=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=f,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=Nn){let l=this.elements,c=1/(t-e),h=1/(i-s),d=1/(o-r),u=(t+e)*c,p=(i+s)*h,f,E;if(a===Nn)f=(o+r)*d,E=-2*d;else if(a===Qs)f=r*d,E=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=E,l[14]=-f,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},fs=new D,Ln=new xt,pu=new D(0,0,0),mu=new D(1,1,1),Ei=new D,kr=new D,xn=new D,bc=new xt,Rc=new Nt,hn=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],p=s[10];switch(t){case"XYZ":this._y=Math.asin(ht(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ht(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(ht(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ht(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(ht(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-ht(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return bc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(bc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Rc.setFromEuler(this),this.setFromQuaternion(Rc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};hn.DEFAULT_ORDER="XYZ";var vs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Eu=0,Cc=new D,ps=new Nt,$n=new xt,Or=new D,zs=new D,gu=new D,Mu=new Nt,Ac=new D(1,0,0),Hc=new D(0,1,0),Pc=new D(0,0,1),Ic={type:"added"},yu={type:"removed"},ms={type:"childadded",child:null},Za={type:"childremoved",child:null},Bt=class n extends ii{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Eu++}),this.uuid=Bs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new D,t=new hn,i=new Nt,s=new D(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new xt},normalMatrix:{value:new at}}),this.matrix=new xt,this.matrixWorld=new xt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new vs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ps.setFromAxisAngle(e,t),this.quaternion.multiply(ps),this}rotateOnWorldAxis(e,t){return ps.setFromAxisAngle(e,t),this.quaternion.premultiply(ps),this}rotateX(e){return this.rotateOnAxis(Ac,e)}rotateY(e){return this.rotateOnAxis(Hc,e)}rotateZ(e){return this.rotateOnAxis(Pc,e)}translateOnAxis(e,t){return Cc.copy(e).applyQuaternion(this.quaternion),this.position.add(Cc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ac,e)}translateY(e){return this.translateOnAxis(Hc,e)}translateZ(e){return this.translateOnAxis(Pc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4($n.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Or.copy(e):Or.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),zs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?$n.lookAt(zs,Or,this.up):$n.lookAt(Or,zs,this.up),this.quaternion.setFromRotationMatrix($n),s&&($n.extractRotation(s.matrixWorld),ps.setFromRotationMatrix($n),this.quaternion.premultiply(ps.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ic),ms.child=e,this.dispatchEvent(ms),ms.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(yu),Za.child=e,this.dispatchEvent(Za),Za.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),$n.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),$n.multiply(e.parent.matrixWorld)),e.applyMatrix4($n),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ic),ms.child=e,this.dispatchEvent(ms),ms.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(zs,e,gu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(zs,Mu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),d=o(e.shapes),u=o(e.skeletons),p=o(e.animations),f=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),p.length>0&&(i.animations=p),f.length>0&&(i.nodes=f)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Bt.DEFAULT_UP=new D(0,1,0);Bt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Bt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Bn=new D,Qn=new D,Ja=new D,jn=new D,Es=new D,gs=new D,Dc=new D,Ka=new D,$a=new D,Qa=new D,ja=new vt,el=new vt,tl=new vt,yi=class n{constructor(e=new D,t=new D,i=new D){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Bn.subVectors(e,t),s.cross(Bn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){Bn.subVectors(s,t),Qn.subVectors(i,t),Ja.subVectors(e,t);let o=Bn.dot(Bn),a=Bn.dot(Qn),l=Bn.dot(Ja),c=Qn.dot(Qn),h=Qn.dot(Ja),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let u=1/d,p=(c*l-a*h)*u,f=(o*h-a*l)*u;return r.set(1-p-f,f,p)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,jn)===null?!1:jn.x>=0&&jn.y>=0&&jn.x+jn.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,jn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,jn.x),l.addScaledVector(o,jn.y),l.addScaledVector(a,jn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return ja.setScalar(0),el.setScalar(0),tl.setScalar(0),ja.fromBufferAttribute(e,t),el.fromBufferAttribute(e,i),tl.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(ja,r.x),o.addScaledVector(el,r.y),o.addScaledVector(tl,r.z),o}static isFrontFacing(e,t,i,s){return Bn.subVectors(i,t),Qn.subVectors(e,t),Bn.cross(Qn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Bn.subVectors(this.c,this.b),Qn.subVectors(this.a,this.b),Bn.cross(Qn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;Es.subVectors(s,i),gs.subVectors(r,i),Ka.subVectors(e,i);let l=Es.dot(Ka),c=gs.dot(Ka);if(l<=0&&c<=0)return t.copy(i);$a.subVectors(e,s);let h=Es.dot($a),d=gs.dot($a);if(h>=0&&d<=h)return t.copy(s);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector(Es,o);Qa.subVectors(e,r);let p=Es.dot(Qa),f=gs.dot(Qa);if(f>=0&&p<=f)return t.copy(r);let E=p*c-l*f;if(E<=0&&c>=0&&f<=0)return a=c/(c-f),t.copy(i).addScaledVector(gs,a);let M=h*f-p*d;if(M<=0&&d-h>=0&&p-f>=0)return Dc.subVectors(r,s),a=(d-h)/(d-h+(p-f)),t.copy(s).addScaledVector(Dc,a);let m=1/(M+E+u);return o=E*m,a=u*m,t.copy(i).addScaledVector(Es,o).addScaledVector(gs,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},kh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gi={h:0,s:0,l:0},zr={h:0,s:0,l:0};function nl(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ne=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=At){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,wt.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=wt.workingColorSpace){return this.r=e,this.g=t,this.b=i,wt.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=wt.workingColorSpace){if(e=Vl(e,1),t=ht(t,0,1),i=ht(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=nl(o,r,e+1/3),this.g=nl(o,r,e),this.b=nl(o,r,e-1/3)}return wt.toWorkingColorSpace(this,s),this}setStyle(e,t=At){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=At){let i=kh[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ei(e.r),this.g=ei(e.g),this.b=ei(e.b),this}copyLinearToSRGB(e){return this.r=ws(e.r),this.g=ws(e.g),this.b=ws(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=At){return wt.fromWorkingColorSpace(sn.copy(this),e),Math.round(ht(sn.r*255,0,255))*65536+Math.round(ht(sn.g*255,0,255))*256+Math.round(ht(sn.b*255,0,255))}getHexString(e=At){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=wt.workingColorSpace){wt.fromWorkingColorSpace(sn.copy(this),t);let i=sn.r,s=sn.g,r=sn.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=h<=.5?d/(o+a):d/(2-o-a),o){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=wt.workingColorSpace){return wt.fromWorkingColorSpace(sn.copy(this),t),e.r=sn.r,e.g=sn.g,e.b=sn.b,e}getStyle(e=At){wt.fromWorkingColorSpace(sn.copy(this),e);let t=sn.r,i=sn.g,s=sn.b;return e!==At?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(gi),this.setHSL(gi.h+e,gi.s+t,gi.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(gi),e.getHSL(zr);let i=qs(gi.h,zr.h,t),s=qs(gi.s,zr.s,t),r=qs(gi.l,zr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},sn=new Ne;Ne.NAMES=kh;var xu=0,Un=class extends ii{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:xu++}),this.uuid=Bs(),this.name="",this.type="Material",this.blending=ki,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ro,this.blendDst=oo,this.blendEquation=Ti,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ne(0,0,0),this.blendAlpha=0,this.depthFunc=Oi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ml,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ni,this.stencilZFail=Ni,this.stencilZPass=Ni,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ki&&(i.blending=this.blending),this.side!==ti&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==ro&&(i.blendSrc=this.blendSrc),this.blendDst!==oo&&(i.blendDst=this.blendDst),this.blendEquation!==Ti&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Oi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ml&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ni&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ni&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ni&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},De=class extends Un{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ne(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hn,this.combine=Cl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Wt=new D,Vr=new Be,Tu=0,Kt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Tu++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=El,this.updateRanges=[],this.gpuType=Yn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Vr.fromBufferAttribute(this,t),Vr.applyMatrix3(e),this.setXY(t,Vr.x,Vr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Wt.fromBufferAttribute(this,t),Wt.applyMatrix3(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Wt.fromBufferAttribute(this,t),Wt.applyMatrix4(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Wt.fromBufferAttribute(this,t),Wt.applyNormalMatrix(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Wt.fromBufferAttribute(this,t),Wt.transformDirection(e),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ts(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=ln(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ts(t,this.array)),t}setX(e,t){return this.normalized&&(t=ln(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ts(t,this.array)),t}setY(e,t){return this.normalized&&(t=ln(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ts(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ln(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ts(t,this.array)),t}setW(e,t){return this.normalized&&(t=ln(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=ln(t,this.array),i=ln(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=ln(t,this.array),i=ln(i,this.array),s=ln(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=ln(t,this.array),i=ln(i,this.array),s=ln(s,this.array),r=ln(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==El&&(e.usage=this.usage),e}};var tr=class extends Kt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var nr=class extends Kt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var ut=class extends Kt{constructor(e,t,i){super(new Float32Array(e),t,i)}},wu=0,bn=new xt,il=new Bt,Ms=new D,Tn=new kn,Vs=new kn,Zt=new D,Gt=class n extends ii{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:wu++}),this.uuid=Bs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Wl(e)?nr:tr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new at().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return bn.makeRotationFromQuaternion(e),this.applyMatrix4(bn),this}rotateX(e){return bn.makeRotationX(e),this.applyMatrix4(bn),this}rotateY(e){return bn.makeRotationY(e),this.applyMatrix4(bn),this}rotateZ(e){return bn.makeRotationZ(e),this.applyMatrix4(bn),this}translate(e,t,i){return bn.makeTranslation(e,t,i),this.applyMatrix4(bn),this}scale(e,t,i){return bn.makeScale(e,t,i),this.applyMatrix4(bn),this}lookAt(e){return il.lookAt(e),il.updateMatrix(),this.applyMatrix4(il.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ms).negate(),this.translate(Ms.x,Ms.y,Ms.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new ut(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new kn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];Tn.setFromBufferAttribute(r),this.morphTargetsRelative?(Zt.addVectors(this.boundingBox.min,Tn.min),this.boundingBox.expandByPoint(Zt),Zt.addVectors(this.boundingBox.max,Tn.max),this.boundingBox.expandByPoint(Zt)):(this.boundingBox.expandByPoint(Tn.min),this.boundingBox.expandByPoint(Tn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new On);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let i=this.boundingSphere.center;if(Tn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Vs.setFromBufferAttribute(a),this.morphTargetsRelative?(Zt.addVectors(Tn.min,Vs.min),Tn.expandByPoint(Zt),Zt.addVectors(Tn.max,Vs.max),Tn.expandByPoint(Zt)):(Tn.expandByPoint(Vs.min),Tn.expandByPoint(Vs.max))}Tn.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)Zt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Zt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Zt.fromBufferAttribute(a,c),l&&(Ms.fromBufferAttribute(e,c),Zt.add(Ms)),s=Math.max(s,i.distanceToSquared(Zt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Kt(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let C=0;C<i.count;C++)a[C]=new D,l[C]=new D;let c=new D,h=new D,d=new D,u=new Be,p=new Be,f=new Be,E=new D,M=new D;function m(C,_,T){c.fromBufferAttribute(i,C),h.fromBufferAttribute(i,_),d.fromBufferAttribute(i,T),u.fromBufferAttribute(r,C),p.fromBufferAttribute(r,_),f.fromBufferAttribute(r,T),h.sub(c),d.sub(c),p.sub(u),f.sub(u);let I=1/(p.x*f.y-f.x*p.y);isFinite(I)&&(E.copy(h).multiplyScalar(f.y).addScaledVector(d,-p.y).multiplyScalar(I),M.copy(d).multiplyScalar(p.x).addScaledVector(h,-f.x).multiplyScalar(I),a[C].add(E),a[_].add(E),a[T].add(E),l[C].add(M),l[_].add(M),l[T].add(M))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let C=0,_=w.length;C<_;++C){let T=w[C],I=T.start,G=T.count;for(let F=I,k=I+G;F<k;F+=3)m(e.getX(F+0),e.getX(F+1),e.getX(F+2))}let y=new D,x=new D,b=new D,v=new D;function R(C){b.fromBufferAttribute(s,C),v.copy(b);let _=a[C];y.copy(_),y.sub(b.multiplyScalar(b.dot(_))).normalize(),x.crossVectors(v,_);let I=x.dot(l[C])<0?-1:1;o.setXYZW(C,y.x,y.y,y.z,I)}for(let C=0,_=w.length;C<_;++C){let T=w[C],I=T.start,G=T.count;for(let F=I,k=I+G;F<k;F+=3)R(e.getX(F+0)),R(e.getX(F+1)),R(e.getX(F+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Kt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,p=i.count;u<p;u++)i.setXYZ(u,0,0,0);let s=new D,r=new D,o=new D,a=new D,l=new D,c=new D,h=new D,d=new D;if(e)for(let u=0,p=e.count;u<p;u+=3){let f=e.getX(u+0),E=e.getX(u+1),M=e.getX(u+2);s.fromBufferAttribute(t,f),r.fromBufferAttribute(t,E),o.fromBufferAttribute(t,M),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(i,f),l.fromBufferAttribute(i,E),c.fromBufferAttribute(i,M),a.add(h),l.add(h),c.add(h),i.setXYZ(f,a.x,a.y,a.z),i.setXYZ(E,l.x,l.y,l.z),i.setXYZ(M,c.x,c.y,c.z)}else for(let u=0,p=t.count;u<p;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),o.fromBufferAttribute(t,u+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Zt.fromBufferAttribute(e,t),Zt.normalize(),e.setXYZ(t,Zt.x,Zt.y,Zt.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,d=a.normalized,u=new c.constructor(l.length*h),p=0,f=0;for(let E=0,M=l.length;E<M;E++){a.isInterleavedBufferAttribute?p=l[E]*a.data.stride+a.offset:p=l[E]*h;for(let m=0;m<h;m++)u[f++]=c[p++]}return new Kt(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,d=c.length;h<d;h++){let u=c[h],p=e(u,i);l.push(p)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let p=c[d];h.push(p.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],d=r[c];for(let u=0,p=d.length;u<p;u++)h.push(d[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Lc=new xt,Ui=new Wi,Wr=new On,Bc=new D,Xr=new D,Yr=new D,qr=new D,sl=new D,Zr=new D,Gc=new D,Jr=new D,g=class extends Bt{constructor(e=new Gt,t=new De){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){Zr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],d=r[l];h!==0&&(sl.fromBufferAttribute(d,e),o?Zr.addScaledVector(sl,h):Zr.addScaledVector(sl.sub(t),h))}t.add(Zr)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Wr.copy(i.boundingSphere),Wr.applyMatrix4(r),Ui.copy(e.ray).recast(e.near),!(Wr.containsPoint(Ui.origin)===!1&&(Ui.intersectSphere(Wr,Bc)===null||Ui.origin.distanceToSquared(Bc)>(e.far-e.near)**2))&&(Lc.copy(r).invert(),Ui.copy(e.ray).applyMatrix4(Lc),!(i.boundingBox!==null&&Ui.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ui)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,p=r.drawRange;if(a!==null)if(Array.isArray(o))for(let f=0,E=u.length;f<E;f++){let M=u[f],m=o[M.materialIndex],w=Math.max(M.start,p.start),y=Math.min(a.count,Math.min(M.start+M.count,p.start+p.count));for(let x=w,b=y;x<b;x+=3){let v=a.getX(x),R=a.getX(x+1),C=a.getX(x+2);s=Kr(this,m,e,i,c,h,d,v,R,C),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=M.materialIndex,t.push(s))}}else{let f=Math.max(0,p.start),E=Math.min(a.count,p.start+p.count);for(let M=f,m=E;M<m;M+=3){let w=a.getX(M),y=a.getX(M+1),x=a.getX(M+2);s=Kr(this,o,e,i,c,h,d,w,y,x),s&&(s.faceIndex=Math.floor(M/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let f=0,E=u.length;f<E;f++){let M=u[f],m=o[M.materialIndex],w=Math.max(M.start,p.start),y=Math.min(l.count,Math.min(M.start+M.count,p.start+p.count));for(let x=w,b=y;x<b;x+=3){let v=x,R=x+1,C=x+2;s=Kr(this,m,e,i,c,h,d,v,R,C),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=M.materialIndex,t.push(s))}}else{let f=Math.max(0,p.start),E=Math.min(l.count,p.start+p.count);for(let M=f,m=E;M<m;M+=3){let w=M,y=M+1,x=M+2;s=Kr(this,o,e,i,c,h,d,w,y,x),s&&(s.faceIndex=Math.floor(M/3),t.push(s))}}}};function _u(n,e,t,i,s,r,o,a){let l;if(e.side===jt?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===ti,a),l===null)return null;Jr.copy(a),Jr.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Jr);return c<t.near||c>t.far?null:{distance:c,point:Jr.clone(),object:n}}function Kr(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,Xr),n.getVertexPosition(l,Yr),n.getVertexPosition(c,qr);let h=_u(n,e,t,i,Xr,Yr,qr,Gc);if(h){let d=new D;yi.getBarycoord(Gc,Xr,Yr,qr,d),s&&(h.uv=yi.getInterpolatedAttribute(s,a,l,c,d,new Be)),r&&(h.uv1=yi.getInterpolatedAttribute(r,a,l,c,d,new Be)),o&&(h.normal=yi.getInterpolatedAttribute(o,a,l,c,d,new D),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:l,c,normal:new D,materialIndex:0};yi.getNormal(Xr,Yr,qr,u.normal),h.face=u,h.barycoord=d}return h}var W=class n extends Gt{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],d=[],u=0,p=0;f("z","y","x",-1,-1,i,t,e,o,r,0),f("z","y","x",1,-1,i,t,-e,o,r,1),f("x","z","y",1,1,e,i,t,s,o,2),f("x","z","y",1,-1,e,i,-t,s,o,3),f("x","y","z",1,-1,e,t,i,s,r,4),f("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new ut(c,3)),this.setAttribute("normal",new ut(h,3)),this.setAttribute("uv",new ut(d,2));function f(E,M,m,w,y,x,b,v,R,C,_){let T=x/R,I=b/C,G=x/2,F=b/2,k=v/2,Y=R+1,X=C+1,ie=0,O=0,re=new D;for(let ee=0;ee<X;ee++){let be=ee*I-F;for(let he=0;he<Y;he++){let ue=he*T-G;re[E]=ue*w,re[M]=be*y,re[m]=k,c.push(re.x,re.y,re.z),re[E]=0,re[M]=0,re[m]=v>0?1:-1,h.push(re.x,re.y,re.z),d.push(he/R),d.push(1-ee/C),ie+=1}}for(let ee=0;ee<C;ee++)for(let be=0;be<R;be++){let he=u+be+Y*ee,ue=u+be+Y*(ee+1),$=u+(be+1)+Y*(ee+1),ge=u+(be+1)+Y*ee;l.push(he,ue,ge),l.push(ue,$,ge),O+=6}a.addGroup(p,O,_),p+=O,u+=ie}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function ji(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function rn(n){let e={};for(let t=0;t<n.length;t++){let i=ji(n[t]);for(let s in i)e[s]=i[s]}return e}function Su(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Xl(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:wt.workingColorSpace}var ba={clone:ji,merge:rn},vu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,bu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,$t=class extends Un{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=vu,this.fragmentShader=bu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ji(e.uniforms),this.uniformsGroups=Su(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},ir=class extends Bt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new xt,this.projectionMatrix=new xt,this.projectionMatrixInverse=new xt,this.coordinateSystem=Nn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Mi=new D,Uc=new Be,Fc=new Be,Lt=class extends ir{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Vi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ys*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Vi*2*Math.atan(Math.tan(Ys*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Mi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Mi.x,Mi.y).multiplyScalar(-e/Mi.z),Mi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Mi.x,Mi.y).multiplyScalar(-e/Mi.z)}getViewSize(e,t){return this.getViewBounds(e,Uc,Fc),t.subVectors(Fc,Uc)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ys*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ys=-90,xs=1,fo=class extends Bt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Lt(ys,xs,e,t);s.layers=this.layers,this.add(s);let r=new Lt(ys,xs,e,t);r.layers=this.layers,this.add(r);let o=new Lt(ys,xs,e,t);o.layers=this.layers,this.add(o);let a=new Lt(ys,xs,e,t);a.layers=this.layers,this.add(a);let l=new Lt(ys,xs,e,t);l.layers=this.layers,this.add(l);let c=new Lt(ys,xs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===Nn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Qs)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),f=e.xr.enabled;e.xr.enabled=!1;let E=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,a),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=E,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(d,u,p),e.xr.enabled=f,i.texture.needsPMREMUpdate=!0}},sr=class extends cn{constructor(e=[],t=$i,i,s,r,o,a,l,c,h){super(e,t,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},po=class extends Cn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new sr(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Gn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new W(5,5,5),r=new $t({name:"CubemapFromEquirect",uniforms:ji(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:jt,blending:ri});r.uniforms.tEquirect.value=t;let o=new g(s,r),a=t.minFilter;return t.minFilter===bi&&(t.minFilter=Gn),new fo(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}},le=class extends Bt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ru={type:"move"},bs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new le,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new le,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new le,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let E of e.hand.values()){let M=t.getJointPose(E,i),m=this._getHandJoint(c,E);M!==null&&(m.matrix.fromArray(M.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=M.radius),m.visible=M!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),p=.02,f=.005;c.inputState.pinching&&u>p+f?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=p-f&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ru)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new le;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},rr=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ne(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Xi=class extends Bt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new hn,this.environmentIntensity=1,this.environmentRotation=new hn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var or=class extends cn{constructor(e=null,t=1,i=1,s,r,o,a,l,c=pn,h=pn,d,u){super(null,o,a,l,c,h,s,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var rl=new D,Cu=new D,Au=new at,Rn=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=rl.subVectors(i,t).cross(Cu.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(rl),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Au.getNormalMatrix(e),s=this.coplanarPoint(rl).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Fi=new On,$r=new D,wi=class{constructor(e=new Rn,t=new Rn,i=new Rn,s=new Rn,r=new Rn,o=new Rn){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Nn){let i=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],d=s[6],u=s[7],p=s[8],f=s[9],E=s[10],M=s[11],m=s[12],w=s[13],y=s[14],x=s[15];if(i[0].setComponents(l-r,u-c,M-p,x-m).normalize(),i[1].setComponents(l+r,u+c,M+p,x+m).normalize(),i[2].setComponents(l+o,u+h,M+f,x+w).normalize(),i[3].setComponents(l-o,u-h,M-f,x-w).normalize(),i[4].setComponents(l-a,u-d,M-E,x-y).normalize(),t===Nn)i[5].setComponents(l+a,u+d,M+E,x+y).normalize();else if(t===Qs)i[5].setComponents(a,d,E,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Fi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Fi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Fi)}intersectsSprite(e){return Fi.center.set(0,0,0),Fi.radius=.7071067811865476,Fi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Fi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if($r.x=s.normal.x>0?e.max.x:e.min.x,$r.y=s.normal.y>0?e.max.y:e.min.y,$r.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint($r)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ar=class extends Un{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ne(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},mo=new D,Eo=new D,Nc=new xt,Ws=new Wi,Qr=new On,ol=new D,kc=new D,go=class extends Bt{constructor(e=new Gt,t=new ar){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)mo.fromBufferAttribute(t,s-1),Eo.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=mo.distanceTo(Eo);e.setAttribute("lineDistance",new ut(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Qr.copy(i.boundingSphere),Qr.applyMatrix4(s),Qr.radius+=r,e.ray.intersectsSphere(Qr)===!1)return;Nc.copy(s).invert(),Ws.copy(e.ray).applyMatrix4(Nc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let p=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let E=p,M=f-1;E<M;E+=c){let m=h.getX(E),w=h.getX(E+1),y=jr(this,e,Ws,l,m,w,E);y&&t.push(y)}if(this.isLineLoop){let E=h.getX(f-1),M=h.getX(p),m=jr(this,e,Ws,l,E,M,f-1);m&&t.push(m)}}else{let p=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let E=p,M=f-1;E<M;E+=c){let m=jr(this,e,Ws,l,E,E+1,E);m&&t.push(m)}if(this.isLineLoop){let E=jr(this,e,Ws,l,f-1,p,f-1);E&&t.push(E)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function jr(n,e,t,i,s,r,o){let a=n.geometry.attributes.position;if(mo.fromBufferAttribute(a,s),Eo.fromBufferAttribute(a,r),t.distanceSqToSegment(mo,Eo,ol,kc)>i)return;ol.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(ol);if(!(c<e.near||c>e.far))return{distance:c,point:kc.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}var Oc=new D,zc=new D,Mo=class extends go{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)Oc.fromBufferAttribute(t,s),zc.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Oc.distanceTo(zc);e.setAttribute("lineDistance",new ut(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Yi=class extends Un{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ne(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Vc=new xt,gl=new Wi,eo=new On,to=new D,Rs=class extends Bt{constructor(e=new Gt,t=new Yi){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),eo.copy(i.boundingSphere),eo.applyMatrix4(s),eo.radius+=r,e.ray.intersectsSphere(eo)===!1)return;Vc.copy(s).invert(),gl.copy(e.ray).applyMatrix4(Vc);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,o.start),p=Math.min(c.count,o.start+o.count);for(let f=u,E=p;f<E;f++){let M=c.getX(f);to.fromBufferAttribute(d,M),Wc(to,M,l,s,e,t,this)}}else{let u=Math.max(0,o.start),p=Math.min(d.count,o.start+o.count);for(let f=u,E=p;f<E;f++)to.fromBufferAttribute(d,f),Wc(to,f,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Wc(n,e,t,i,s,r,o){let a=gl.distanceSqToPoint(n);if(a<t){let l=new D;gl.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var Qt=class extends cn{constructor(e,t,i,s,r,o,a,l,c){super(e,t,i,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},lr=class extends cn{constructor(e,t,i=Ri,s,r,o,a=pn,l=pn,c,h=_s){if(h!==_s&&h!==Ls)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ss(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},wn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],u=i[s+1]-h,p=(o-h)/u;return(s+p)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new Be:new D);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new D,s=[],r=[],o=[],a=new D,l=new xt;for(let p=0;p<=e;p++){let f=p/e;s[p]=this.getTangentAt(f,new D)}r[0]=new D,o[0]=new D;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),u<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let p=1;p<=e;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),a.crossVectors(s[p-1],s[p]),a.length()>Number.EPSILON){a.normalize();let f=Math.acos(ht(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(a,f))}o[p].crossVectors(s[p],r[p])}if(t===!0){let p=Math.acos(ht(r[0].dot(r[e]),-1,1));p/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(p=-p);for(let f=1;f<=e;f++)r[f].applyMatrix4(l.makeRotationAxis(s[f],p*f)),o[f].crossVectors(s[f],r[f])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Cs=class extends wn{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new Be){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,p=c-this.aY;l=u*h-p*d+this.aX,c=u*d+p*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},yo=class extends Cs{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Yl(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,d){let u=(o-r)/c-(a-r)/(c+h)+(a-o)/h,p=(a-o)/h-(l-o)/(h+d)+(l-a)/d;u*=h,p*=h,s(o,a,u,p)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var no=new D,al=new Yl,ll=new Yl,cl=new Yl,mn=class extends wn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new D){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(no.subVectors(s[0],s[1]).add(s[0]),c=no);let d=s[a%r],u=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(no.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=no),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,f=Math.pow(c.distanceToSquared(d),p),E=Math.pow(d.distanceToSquared(u),p),M=Math.pow(u.distanceToSquared(h),p);E<1e-4&&(E=1),f<1e-4&&(f=E),M<1e-4&&(M=E),al.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,f,E,M),ll.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,f,E,M),cl.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,f,E,M)}else this.curveType==="catmullrom"&&(al.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),ll.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),cl.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return i.set(al.calc(l),ll.calc(l),cl.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new D().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Xc(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function Hu(n,e){let t=1-n;return t*t*e}function Pu(n,e){return 2*(1-n)*n*e}function Iu(n,e){return n*n*e}function Zs(n,e,t,i){return Hu(n,e)+Pu(n,t)+Iu(n,i)}function Du(n,e){let t=1-n;return t*t*t*e}function Lu(n,e){let t=1-n;return 3*t*t*n*e}function Bu(n,e){return 3*(1-n)*n*n*e}function Gu(n,e){return n*n*n*e}function Js(n,e,t,i,s){return Du(n,e)+Lu(n,t)+Bu(n,i)+Gu(n,s)}var cr=class extends wn{constructor(e=new Be,t=new Be,i=new Be,s=new Be){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new Be){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Js(e,s.x,r.x,o.x,a.x),Js(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},xo=class extends wn{constructor(e=new D,t=new D,i=new D,s=new D){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new D){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Js(e,s.x,r.x,o.x,a.x),Js(e,s.y,r.y,o.y,a.y),Js(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},hr=class extends wn{constructor(e=new Be,t=new Be){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new Be){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Be){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},To=class extends wn{constructor(e=new D,t=new D){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new D){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new D){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},dr=class extends wn{constructor(e=new Be,t=new Be,i=new Be){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new Be){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Zs(e,s.x,r.x,o.x),Zs(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ur=class extends wn{constructor(e=new D,t=new D,i=new D){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new D){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Zs(e,s.x,r.x,o.x),Zs(e,s.y,r.y,o.y),Zs(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},fr=class extends wn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new Be){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return i.set(Xc(a,l.x,c.x,h.x,d.x),Xc(a,l.y,c.y,h.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new Be().fromArray(s))}return this}},Ml=Object.freeze({__proto__:null,ArcCurve:yo,CatmullRomCurve3:mn,CubicBezierCurve:cr,CubicBezierCurve3:xo,EllipseCurve:Cs,LineCurve:hr,LineCurve3:To,QuadraticBezierCurve:dr,QuadraticBezierCurve3:ur,SplineCurve:fr}),wo=class extends wn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ml[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new Ml[s.type]().fromJSON(s))}return this}},_o=class extends wo{constructor(e){super(),this.type="Path",this.currentPoint=new Be,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new hr(this.currentPoint.clone(),new Be(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new dr(this.currentPoint.clone(),new Be(e,t),new Be(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new cr(this.currentPoint.clone(),new Be(e,t),new Be(i,s),new Be(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new fr(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,o,a,l),this}absellipse(e,t,i,s,r,o,a,l){let c=new Cs(e,t,i,s,r,o,a,l);if(this.curves.length>0){let d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},si=class n extends Gt{constructor(e=[new Be(0,-.5),new Be(.5,0),new Be(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=ht(s,0,Math.PI*2);let r=[],o=[],a=[],l=[],c=[],h=1/t,d=new D,u=new Be,p=new D,f=new D,E=new D,M=0,m=0;for(let w=0;w<=e.length-1;w++)switch(w){case 0:M=e[w+1].x-e[w].x,m=e[w+1].y-e[w].y,p.x=m*1,p.y=-M,p.z=m*0,E.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(E.x,E.y,E.z);break;default:M=e[w+1].x-e[w].x,m=e[w+1].y-e[w].y,p.x=m*1,p.y=-M,p.z=m*0,f.copy(p),p.x+=E.x,p.y+=E.y,p.z+=E.z,p.normalize(),l.push(p.x,p.y,p.z),E.copy(f)}for(let w=0;w<=t;w++){let y=i+w*h*s,x=Math.sin(y),b=Math.cos(y);for(let v=0;v<=e.length-1;v++){d.x=e[v].x*x,d.y=e[v].y,d.z=e[v].x*b,o.push(d.x,d.y,d.z),u.x=w/t,u.y=v/(e.length-1),a.push(u.x,u.y);let R=l[3*v+0]*x,C=l[3*v+1],_=l[3*v+0]*b;c.push(R,C,_)}}for(let w=0;w<t;w++)for(let y=0;y<e.length-1;y++){let x=y+w*e.length,b=x,v=x+e.length,R=x+e.length+1,C=x+1;r.push(b,v,C),r.push(R,C,v)}this.setIndex(r),this.setAttribute("position",new ut(o,3)),this.setAttribute("uv",new ut(a,2)),this.setAttribute("normal",new ut(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},gt=class n extends si{constructor(e=1,t=1,i=4,s=8){let r=new _o;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(i),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:s}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},Ct=class n extends Gt{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new D,h=new Be;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let d=0,u=3;d<=t;d++,u+=3){let p=i+d/t*s;c.x=e*Math.cos(p),c.y=e*Math.sin(p),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[u]/e+1)/2,h.y=(o[u+1]/e+1)/2,l.push(h.x,h.y)}for(let d=1;d<=t;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new ut(o,3)),this.setAttribute("normal",new ut(a,3)),this.setAttribute("uv",new ut(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Ee=class n extends Gt{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],u=[],p=[],f=0,E=[],M=i/2,m=0;w(),o===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new ut(d,3)),this.setAttribute("normal",new ut(u,3)),this.setAttribute("uv",new ut(p,2));function w(){let x=new D,b=new D,v=0,R=(t-e)/i;for(let C=0;C<=r;C++){let _=[],T=C/r,I=T*(t-e)+e;for(let G=0;G<=s;G++){let F=G/s,k=F*l+a,Y=Math.sin(k),X=Math.cos(k);b.x=I*Y,b.y=-T*i+M,b.z=I*X,d.push(b.x,b.y,b.z),x.set(Y,R,X).normalize(),u.push(x.x,x.y,x.z),p.push(F,1-T),_.push(f++)}E.push(_)}for(let C=0;C<s;C++)for(let _=0;_<r;_++){let T=E[_][C],I=E[_+1][C],G=E[_+1][C+1],F=E[_][C+1];(e>0||_!==0)&&(h.push(T,I,F),v+=3),(t>0||_!==r-1)&&(h.push(I,G,F),v+=3)}c.addGroup(m,v,0),m+=v}function y(x){let b=f,v=new Be,R=new D,C=0,_=x===!0?e:t,T=x===!0?1:-1;for(let G=1;G<=s;G++)d.push(0,M*T,0),u.push(0,T,0),p.push(.5,.5),f++;let I=f;for(let G=0;G<=s;G++){let k=G/s*l+a,Y=Math.cos(k),X=Math.sin(k);R.x=_*X,R.y=M*T,R.z=_*Y,d.push(R.x,R.y,R.z),u.push(0,T,0),v.x=Y*.5+.5,v.y=X*.5*T+.5,p.push(v.x,v.y),f++}for(let G=0;G<s;G++){let F=b+G,k=I+G;x===!0?h.push(k,k+1,F):h.push(k+1,k,F),C+=3}c.addGroup(m,C,x===!0?1:2),m+=C}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},$e=class n extends Ee{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},As=class n extends Gt{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new ut(r,3)),this.setAttribute("normal",new ut(r.slice(),3)),this.setAttribute("uv",new ut(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(w){let y=new D,x=new D,b=new D;for(let v=0;v<t.length;v+=3)p(t[v+0],y),p(t[v+1],x),p(t[v+2],b),l(y,x,b,w)}function l(w,y,x,b){let v=b+1,R=[];for(let C=0;C<=v;C++){R[C]=[];let _=w.clone().lerp(x,C/v),T=y.clone().lerp(x,C/v),I=v-C;for(let G=0;G<=I;G++)G===0&&C===v?R[C][G]=_:R[C][G]=_.clone().lerp(T,G/I)}for(let C=0;C<v;C++)for(let _=0;_<2*(v-C)-1;_++){let T=Math.floor(_/2);_%2===0?(u(R[C][T+1]),u(R[C+1][T]),u(R[C][T])):(u(R[C][T+1]),u(R[C+1][T+1]),u(R[C+1][T]))}}function c(w){let y=new D;for(let x=0;x<r.length;x+=3)y.x=r[x+0],y.y=r[x+1],y.z=r[x+2],y.normalize().multiplyScalar(w),r[x+0]=y.x,r[x+1]=y.y,r[x+2]=y.z}function h(){let w=new D;for(let y=0;y<r.length;y+=3){w.x=r[y+0],w.y=r[y+1],w.z=r[y+2];let x=M(w)/2/Math.PI+.5,b=m(w)/Math.PI+.5;o.push(x,1-b)}f(),d()}function d(){for(let w=0;w<o.length;w+=6){let y=o[w+0],x=o[w+2],b=o[w+4],v=Math.max(y,x,b),R=Math.min(y,x,b);v>.9&&R<.1&&(y<.2&&(o[w+0]+=1),x<.2&&(o[w+2]+=1),b<.2&&(o[w+4]+=1))}}function u(w){r.push(w.x,w.y,w.z)}function p(w,y){let x=w*3;y.x=e[x+0],y.y=e[x+1],y.z=e[x+2]}function f(){let w=new D,y=new D,x=new D,b=new D,v=new Be,R=new Be,C=new Be;for(let _=0,T=0;_<r.length;_+=9,T+=6){w.set(r[_+0],r[_+1],r[_+2]),y.set(r[_+3],r[_+4],r[_+5]),x.set(r[_+6],r[_+7],r[_+8]),v.set(o[T+0],o[T+1]),R.set(o[T+2],o[T+3]),C.set(o[T+4],o[T+5]),b.copy(w).add(y).add(x).divideScalar(3);let I=M(b);E(v,T+0,w,I),E(R,T+2,y,I),E(C,T+4,x,I)}}function E(w,y,x,b){b<0&&w.x===1&&(o[y]=w.x-1),x.x===0&&x.z===0&&(o[y]=b/2/Math.PI+.5)}function M(w){return Math.atan2(w.z,-w.x)}function m(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}},_i=class n extends As{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=1/i,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-i,0,-s,i,0,s,-i,0,s,i,-s,-i,0,-s,i,0,s,-i,0,s,i,0,-i,0,-s,i,0,-s,-i,0,s,i,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var pr=class n extends As{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},kt=class n extends As{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},rt=class n extends Gt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,d=e/a,u=t/l,p=[],f=[],E=[],M=[];for(let m=0;m<h;m++){let w=m*u-o;for(let y=0;y<c;y++){let x=y*d-r;f.push(x,-w,0),E.push(0,0,1),M.push(y/a),M.push(1-m/l)}}for(let m=0;m<l;m++)for(let w=0;w<a;w++){let y=w+c*m,x=w+c*(m+1),b=w+1+c*(m+1),v=w+1+c*m;p.push(y,x,v),p.push(x,b,v)}this.setIndex(p),this.setAttribute("position",new ut(f,3)),this.setAttribute("normal",new ut(E,3)),this.setAttribute("uv",new ut(M,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},zn=class n extends Gt{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],d=e,u=(t-e)/s,p=new D,f=new Be;for(let E=0;E<=s;E++){for(let M=0;M<=i;M++){let m=r+M/i*o;p.x=d*Math.cos(m),p.y=d*Math.sin(m),l.push(p.x,p.y,p.z),c.push(0,0,1),f.x=(p.x/t+1)/2,f.y=(p.y/t+1)/2,h.push(f.x,f.y)}d+=u}for(let E=0;E<s;E++){let M=E*(i+1);for(let m=0;m<i;m++){let w=m+M,y=w,x=w+i+1,b=w+i+2,v=w+1;a.push(y,x,v),a.push(x,b,v)}}this.setIndex(a),this.setAttribute("position",new ut(l,3)),this.setAttribute("normal",new ut(c,3)),this.setAttribute("uv",new ut(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var ce=class n extends Gt{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],d=new D,u=new D,p=[],f=[],E=[],M=[];for(let m=0;m<=i;m++){let w=[],y=m/i,x=0;m===0&&o===0?x=.5/t:m===i&&l===Math.PI&&(x=-.5/t);for(let b=0;b<=t;b++){let v=b/t;d.x=-e*Math.cos(s+v*r)*Math.sin(o+y*a),d.y=e*Math.cos(o+y*a),d.z=e*Math.sin(s+v*r)*Math.sin(o+y*a),f.push(d.x,d.y,d.z),u.copy(d).normalize(),E.push(u.x,u.y,u.z),M.push(v+x,1-y),w.push(c++)}h.push(w)}for(let m=0;m<i;m++)for(let w=0;w<t;w++){let y=h[m][w+1],x=h[m][w],b=h[m+1][w],v=h[m+1][w+1];(m!==0||o>0)&&p.push(y,x,v),(m!==i-1||l<Math.PI)&&p.push(x,b,v)}this.setIndex(p),this.setAttribute("position",new ut(f,3)),this.setAttribute("normal",new ut(E,3)),this.setAttribute("uv",new ut(M,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var We=class n extends Gt{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let o=[],a=[],l=[],c=[],h=new D,d=new D,u=new D;for(let p=0;p<=i;p++)for(let f=0;f<=s;f++){let E=f/s*r,M=p/i*Math.PI*2;d.x=(e+t*Math.cos(M))*Math.cos(E),d.y=(e+t*Math.cos(M))*Math.sin(E),d.z=t*Math.sin(M),a.push(d.x,d.y,d.z),h.x=e*Math.cos(E),h.y=e*Math.sin(E),u.subVectors(d,h).normalize(),l.push(u.x,u.y,u.z),c.push(f/s),c.push(p/i)}for(let p=1;p<=i;p++)for(let f=1;f<=s;f++){let E=(s+1)*p+f-1,M=(s+1)*(p-1)+f-1,m=(s+1)*(p-1)+f,w=(s+1)*p+f;o.push(E,M,w),o.push(M,m,w)}this.setIndex(o),this.setAttribute("position",new ut(a,3)),this.setAttribute("normal",new ut(l,3)),this.setAttribute("uv",new ut(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var An=class n extends Gt{constructor(e=new ur(new D(-1,-1,0),new D(-1,1,0),new D(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let a=new D,l=new D,c=new Be,h=new D,d=[],u=[],p=[],f=[];E(),this.setIndex(f),this.setAttribute("position",new ut(d,3)),this.setAttribute("normal",new ut(u,3)),this.setAttribute("uv",new ut(p,2));function E(){for(let y=0;y<t;y++)M(y);M(r===!1?t:0),w(),m()}function M(y){h=e.getPointAt(y/t,h);let x=o.normals[y],b=o.binormals[y];for(let v=0;v<=s;v++){let R=v/s*Math.PI*2,C=Math.sin(R),_=-Math.cos(R);l.x=_*x.x+C*b.x,l.y=_*x.y+C*b.y,l.z=_*x.z+C*b.z,l.normalize(),u.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,d.push(a.x,a.y,a.z)}}function m(){for(let y=1;y<=t;y++)for(let x=1;x<=s;x++){let b=(s+1)*(y-1)+(x-1),v=(s+1)*y+(x-1),R=(s+1)*y+x,C=(s+1)*(y-1)+x;f.push(b,v,C),f.push(v,R,C)}}function w(){for(let y=0;y<=t;y++)for(let x=0;x<=s;x++)c.x=y/t,c.y=x/s,p.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new Ml[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var mr=class extends Un{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Ne(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var H=class extends Un{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ne(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ne(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=kl,this.normalScale=new Be(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var So=class extends Un{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=bh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},vo=class extends Un{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function io(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Uu(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var qi=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},bo=class extends qi{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ul,endingEnd:ul}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case fl:r=e,a=2*t-i;break;case pl:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case fl:o=e,l=2*i-t;break;case pl:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,p=this._weightNext,f=(i-t)/(s-t),E=f*f,M=E*f,m=-u*M+2*u*E-u*f,w=(1+u)*M+(-1.5-2*u)*E+(-.5+u)*f+1,y=(-1-p)*M+(1.5+p)*E+.5*f,x=p*M-p*E;for(let b=0;b!==a;++b)r[b]=m*o[h+b]+w*o[c+b]+y*o[l+b]+x*o[d+b];return r}},Ro=class extends qi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(s-t),d=1-h;for(let u=0;u!==a;++u)r[u]=o[c+u]*d+o[l+u]*h;return r}},Co=class extends qi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},_n=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=io(t,this.TimeBufferType),this.values=io(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:io(e.times,Array),values:io(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Co(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ro(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new bo(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ks:t=this.InterpolantFactoryMethodDiscrete;break;case lo:t=this.InterpolantFactoryMethodLinear;break;case so:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ks;case this.InterpolantFactoryMethodLinear:return lo;case this.InterpolantFactoryMethodSmooth:return so}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Uu(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===so,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let d=a*i,u=d-i,p=d+i;for(let f=0;f!==i;++f){let E=t[d+f];if(E!==t[u+f]||E!==t[p+f]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let d=a*i,u=o*i;for(let p=0;p!==i;++p)t[u+p]=t[d+p]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};_n.prototype.ValueTypeName="";_n.prototype.TimeBufferType=Float32Array;_n.prototype.ValueBufferType=Float32Array;_n.prototype.DefaultInterpolation=lo;var Si=class extends _n{constructor(e,t,i){super(e,t,i)}};Si.prototype.ValueTypeName="bool";Si.prototype.ValueBufferType=Array;Si.prototype.DefaultInterpolation=Ks;Si.prototype.InterpolantFactoryMethodLinear=void 0;Si.prototype.InterpolantFactoryMethodSmooth=void 0;var Ao=class extends _n{constructor(e,t,i,s){super(e,t,i,s)}};Ao.prototype.ValueTypeName="color";var Ho=class extends _n{constructor(e,t,i,s){super(e,t,i,s)}};Ho.prototype.ValueTypeName="number";var Po=class extends qi{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)Nt.slerpFlat(r,0,o,c-a,o,c,l);return r}},Er=class extends _n{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new Po(this.times,this.values,this.getValueSize(),e)}};Er.prototype.ValueTypeName="quaternion";Er.prototype.InterpolantFactoryMethodSmooth=void 0;var vi=class extends _n{constructor(e,t,i){super(e,t,i)}};vi.prototype.ValueTypeName="string";vi.prototype.ValueBufferType=Array;vi.prototype.DefaultInterpolation=Ks;vi.prototype.InterpolantFactoryMethodLinear=void 0;vi.prototype.InterpolantFactoryMethodSmooth=void 0;var Io=class extends _n{constructor(e,t,i,s){super(e,t,i,s)}};Io.prototype.ValueTypeName="vector";var Do=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let p=c[d],f=c[d+1];if(p.global&&(p.lastIndex=0),p.test(h))return f}return null}}},Oh=new Do,Lo=class{constructor(e){this.manager=e!==void 0?e:Oh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Lo.DEFAULT_MATERIAL_NAME="__DEFAULT";var Zi=class extends Bt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ne(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},gr=class extends Zi{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Bt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ne(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},hl=new xt,Yc=new D,qc=new D,Mr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Be(512,512),this.map=null,this.mapPass=null,this.matrix=new xt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new wi,this._frameExtents=new Be(1,1),this._viewportCount=1,this._viewports=[new vt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;Yc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Yc),qc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(qc),t.updateMatrixWorld(),hl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(hl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(hl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},yl=class extends Mr{constructor(){super(new Lt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,i=Vi*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(i!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=i,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},Ji=class extends Zi{constructor(e,t,i=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Bt.DEFAULT_UP),this.updateMatrix(),this.target=new Bt,this.distance=i,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new yl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Zc=new xt,Xs=new D,dl=new D,xl=class extends Mr{constructor(){super(new Lt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Be(4,2),this._viewportCount=6,this._viewports=[new vt(2,1,1,1),new vt(0,1,1,1),new vt(3,1,1,1),new vt(1,1,1,1),new vt(3,0,1,1),new vt(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),Xs.setFromMatrixPosition(e.matrixWorld),i.position.copy(Xs),dl.copy(i.position),dl.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(dl),i.updateMatrixWorld(),s.makeTranslation(-Xs.x,-Xs.y,-Xs.z),Zc.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Zc)}},Ut=class extends Zi{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new xl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},Ki=class extends ir{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Tl=class extends Mr{constructor(){super(new Ki(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Hs=class extends Zi{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Bt.DEFAULT_UP),this.updateMatrix(),this.target=new Bt,this.shadow=new Tl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Bo=class extends Lt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e,this.index=0}};var ql="\\[\\]\\.:\\/",Fu=new RegExp("["+ql+"]","g"),Zl="[^"+ql+"]",Nu="[^"+ql.replace("\\.","")+"]",ku=/((?:WC+[\/:])*)/.source.replace("WC",Zl),Ou=/(WCOD+)?/.source.replace("WCOD",Nu),zu=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Zl),Vu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Zl),Wu=new RegExp("^"+ku+Ou+zu+Vu+"$"),Xu=["material","materials","bones","map"],wl=class{constructor(e,t,i){let s=i||Pt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},Pt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Fu,"")}static parseTrackName(e){let t=Wu.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);Xu.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Pt.Composite=wl;Pt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Pt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Pt.prototype.GetterByBindingType=[Pt.prototype._getValue_direct,Pt.prototype._getValue_array,Pt.prototype._getValue_arrayElement,Pt.prototype._getValue_toArray];Pt.prototype.SetterByBindingTypeAndVersioning=[[Pt.prototype._setValue_direct,Pt.prototype._setValue_direct_setNeedsUpdate,Pt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Pt.prototype._setValue_array,Pt.prototype._setValue_array_setNeedsUpdate,Pt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Pt.prototype._setValue_arrayElement,Pt.prototype._setValue_arrayElement_setNeedsUpdate,Pt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Pt.prototype._setValue_fromArray,Pt.prototype._setValue_fromArray_setNeedsUpdate,Pt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var bg=new Float32Array(1);var Jc=new xt,yr=class{constructor(e,t,i=0,s=1/0){this.ray=new Wi(e,t),this.near=i,this.far=s,this.camera=null,this.layers=new vs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Jc.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Jc),this}intersectObject(e,t=!0,i=[]){return _l(e,this,i,t),i.sort(Kc),i}intersectObjects(e,t=!0,i=[]){for(let s=0,r=e.length;s<r;s++)_l(e[s],this,i,t);return i.sort(Kc),i}};function Kc(n,e){return n.distance-e.distance}function _l(n,e,t,i){let s=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(s=!1),s===!0&&i===!0){let r=n.children;for(let o=0,a=r.length;o<a;o++)_l(r[o],e,t,!0)}}var Ps=class extends Mo{constructor(e=10,t=10,i=4473924,s=8947848){i=new Ne(i),s=new Ne(s);let r=t/2,o=e/t,a=e/2,l=[],c=[];for(let u=0,p=0,f=-a;u<=t;u++,f+=o){l.push(-a,0,f,a,0,f),l.push(f,0,-a,f,0,a);let E=u===r?i:s;E.toArray(c,p),p+=3,E.toArray(c,p),p+=3,E.toArray(c,p),p+=3,E.toArray(c,p),p+=3}let h=new Gt;h.setAttribute("position",new ut(l,3)),h.setAttribute("color",new ut(c,3));let d=new ar({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}};function Jl(n,e,t,i){let s=Yu(i);switch(t){case Dl:return n*e;case Bl:return n*e;case Gl:return n*e*2;case Ul:return n*e/s.components*s.byteLength;case $o:return n*e/s.components*s.byteLength;case Fl:return n*e*2/s.components*s.byteLength;case Qo:return n*e*2/s.components*s.byteLength;case Ll:return n*e*3/s.components*s.byteLength;case En:return n*e*4/s.components*s.byteLength;case jo:return n*e*4/s.components*s.byteLength;case wr:case _r:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Sr:case vr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ta:case ia:return Math.max(n,16)*Math.max(e,8)/4;case ea:case na:return Math.max(n,8)*Math.max(e,8)/2;case sa:case ra:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case oa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case aa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case la:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case ca:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case ha:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case da:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case ua:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case fa:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case pa:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case ma:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ea:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case ga:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Ma:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case ya:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case xa:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case br:case Ta:case wa:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Nl:case _a:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Sa:case va:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Yu(n){switch(n){case Xn:case Hl:return{byteLength:1,components:1};case Is:case Pl:case Ci:return{byteLength:2,components:1};case Jo:case Ko:return{byteLength:2,components:4};case Ri:case Zo:case Yn:return{byteLength:4,components:1};case Il:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"175"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="175");function dd(){let n=null,e=!1,t=null,i=null;function s(r,o){t(r,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Zu(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,d=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,h),a.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let h=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,h);else{d.sort((p,f)=>p.start-f.start);let u=0;for(let p=1;p<d.length;p++){let f=d[u],E=d[p];E.start<=f.start+f.count+1?f.count=Math.max(f.count,E.start+E.count-f.start):(++u,d[u]=E)}d.length=u+1;for(let p=0,f=d.length;p<f;p++){let E=d[p];n.bufferSubData(c,E.start*h.BYTES_PER_ELEMENT,h,E.start,E.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Ju=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ku=`#ifdef USE_ALPHAHASH
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
#endif`,$u=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Qu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ju=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ef=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,tf=`#ifdef USE_AOMAP
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
#endif`,nf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,sf=`#ifdef USE_BATCHING
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
#endif`,rf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,of=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,af=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,lf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,cf=`#ifdef USE_IRIDESCENCE
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
#endif`,hf=`#ifdef USE_BUMPMAP
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
#endif`,df=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,uf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ff=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,pf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,mf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ef=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,gf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Mf=`#if defined( USE_COLOR_ALPHA )
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
#endif`,yf=`#define PI 3.141592653589793
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
} // validated`,xf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Tf=`vec3 transformedNormal = objectNormal;
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
#endif`,wf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_f=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Sf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,bf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Rf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Cf=`#ifdef USE_ENVMAP
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
#endif`,Af=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Hf=`#ifdef USE_ENVMAP
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
#endif`,Pf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,If=`#ifdef USE_ENVMAP
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
#endif`,Df=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Lf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Uf=`#ifdef USE_GRADIENTMAP
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
}`,Ff=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Nf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,kf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Of=`uniform bool receiveShadow;
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
#endif`,zf=`#ifdef USE_ENVMAP
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
#endif`,Vf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Wf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Xf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Yf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,qf=`PhysicalMaterial material;
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
#endif`,Zf=`struct PhysicalMaterial {
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
}`,Jf=`
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
#endif`,Kf=`#if defined( RE_IndirectDiffuse )
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
#endif`,$f=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Qf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,jf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ep=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,tp=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,np=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ip=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,sp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,rp=`#if defined( USE_POINTS_UV )
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
#endif`,op=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ap=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,lp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,cp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,hp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,dp=`#ifdef USE_MORPHTARGETS
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
#endif`,up=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,fp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,pp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,mp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ep=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Mp=`#ifdef USE_NORMALMAP
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
#endif`,yp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,xp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Tp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,wp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_p=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Sp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,vp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Rp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Cp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ap=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Hp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Pp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Ip=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Dp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Lp=`float getShadowMask() {
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
}`,Bp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Gp=`#ifdef USE_SKINNING
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
#endif`,Up=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Fp=`#ifdef USE_SKINNING
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
#endif`,Np=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,kp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Op=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,zp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vp=`#ifdef USE_TRANSMISSION
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
#endif`,Wp=`#ifdef USE_TRANSMISSION
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
#endif`,Xp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Yp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,qp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Zp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Jp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Kp=`uniform sampler2D t2D;
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
}`,$p=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Qp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,jp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,e0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,t0=`#include <common>
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
}`,n0=`#if DEPTH_PACKING == 3200
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
}`,i0=`#define DISTANCE
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
}`,s0=`#define DISTANCE
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
}`,r0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,o0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,a0=`uniform float scale;
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
}`,l0=`uniform vec3 diffuse;
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
}`,c0=`#include <common>
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
}`,h0=`uniform vec3 diffuse;
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
}`,d0=`#define LAMBERT
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
}`,u0=`#define LAMBERT
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
}`,f0=`#define MATCAP
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
}`,p0=`#define MATCAP
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
}`,m0=`#define NORMAL
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
}`,E0=`#define NORMAL
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
}`,g0=`#define PHONG
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
}`,M0=`#define PHONG
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
}`,y0=`#define STANDARD
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
}`,x0=`#define STANDARD
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
}`,T0=`#define TOON
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
}`,w0=`#define TOON
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
}`,_0=`uniform float size;
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
}`,S0=`uniform vec3 diffuse;
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
}`,v0=`#include <common>
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
}`,b0=`uniform vec3 color;
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
}`,R0=`uniform float rotation;
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
}`,C0=`uniform vec3 diffuse;
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
}`,ct={alphahash_fragment:Ju,alphahash_pars_fragment:Ku,alphamap_fragment:$u,alphamap_pars_fragment:Qu,alphatest_fragment:ju,alphatest_pars_fragment:ef,aomap_fragment:tf,aomap_pars_fragment:nf,batching_pars_vertex:sf,batching_vertex:rf,begin_vertex:of,beginnormal_vertex:af,bsdfs:lf,iridescence_fragment:cf,bumpmap_pars_fragment:hf,clipping_planes_fragment:df,clipping_planes_pars_fragment:uf,clipping_planes_pars_vertex:ff,clipping_planes_vertex:pf,color_fragment:mf,color_pars_fragment:Ef,color_pars_vertex:gf,color_vertex:Mf,common:yf,cube_uv_reflection_fragment:xf,defaultnormal_vertex:Tf,displacementmap_pars_vertex:wf,displacementmap_vertex:_f,emissivemap_fragment:Sf,emissivemap_pars_fragment:vf,colorspace_fragment:bf,colorspace_pars_fragment:Rf,envmap_fragment:Cf,envmap_common_pars_fragment:Af,envmap_pars_fragment:Hf,envmap_pars_vertex:Pf,envmap_physical_pars_fragment:zf,envmap_vertex:If,fog_vertex:Df,fog_pars_vertex:Lf,fog_fragment:Bf,fog_pars_fragment:Gf,gradientmap_pars_fragment:Uf,lightmap_pars_fragment:Ff,lights_lambert_fragment:Nf,lights_lambert_pars_fragment:kf,lights_pars_begin:Of,lights_toon_fragment:Vf,lights_toon_pars_fragment:Wf,lights_phong_fragment:Xf,lights_phong_pars_fragment:Yf,lights_physical_fragment:qf,lights_physical_pars_fragment:Zf,lights_fragment_begin:Jf,lights_fragment_maps:Kf,lights_fragment_end:$f,logdepthbuf_fragment:Qf,logdepthbuf_pars_fragment:jf,logdepthbuf_pars_vertex:ep,logdepthbuf_vertex:tp,map_fragment:np,map_pars_fragment:ip,map_particle_fragment:sp,map_particle_pars_fragment:rp,metalnessmap_fragment:op,metalnessmap_pars_fragment:ap,morphinstance_vertex:lp,morphcolor_vertex:cp,morphnormal_vertex:hp,morphtarget_pars_vertex:dp,morphtarget_vertex:up,normal_fragment_begin:fp,normal_fragment_maps:pp,normal_pars_fragment:mp,normal_pars_vertex:Ep,normal_vertex:gp,normalmap_pars_fragment:Mp,clearcoat_normal_fragment_begin:yp,clearcoat_normal_fragment_maps:xp,clearcoat_pars_fragment:Tp,iridescence_pars_fragment:wp,opaque_fragment:_p,packing:Sp,premultiplied_alpha_fragment:vp,project_vertex:bp,dithering_fragment:Rp,dithering_pars_fragment:Cp,roughnessmap_fragment:Ap,roughnessmap_pars_fragment:Hp,shadowmap_pars_fragment:Pp,shadowmap_pars_vertex:Ip,shadowmap_vertex:Dp,shadowmask_pars_fragment:Lp,skinbase_vertex:Bp,skinning_pars_vertex:Gp,skinning_vertex:Up,skinnormal_vertex:Fp,specularmap_fragment:Np,specularmap_pars_fragment:kp,tonemapping_fragment:Op,tonemapping_pars_fragment:zp,transmission_fragment:Vp,transmission_pars_fragment:Wp,uv_pars_fragment:Xp,uv_pars_vertex:Yp,uv_vertex:qp,worldpos_vertex:Zp,background_vert:Jp,background_frag:Kp,backgroundCube_vert:$p,backgroundCube_frag:Qp,cube_vert:jp,cube_frag:e0,depth_vert:t0,depth_frag:n0,distanceRGBA_vert:i0,distanceRGBA_frag:s0,equirect_vert:r0,equirect_frag:o0,linedashed_vert:a0,linedashed_frag:l0,meshbasic_vert:c0,meshbasic_frag:h0,meshlambert_vert:d0,meshlambert_frag:u0,meshmatcap_vert:f0,meshmatcap_frag:p0,meshnormal_vert:m0,meshnormal_frag:E0,meshphong_vert:g0,meshphong_frag:M0,meshphysical_vert:y0,meshphysical_frag:x0,meshtoon_vert:T0,meshtoon_frag:w0,points_vert:_0,points_frag:S0,shadow_vert:v0,shadow_frag:b0,sprite_vert:R0,sprite_frag:C0},ze={common:{diffuse:{value:new Ne(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new at},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new at}},envmap:{envMap:{value:null},envMapRotation:{value:new at},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new at}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new at}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new at},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new at},normalScale:{value:new Be(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new at},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new at}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new at}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new at}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ne(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ne(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0},uvTransform:{value:new at}},sprite:{diffuse:{value:new Ne(16777215)},opacity:{value:1},center:{value:new Be(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new at},alphaMap:{value:null},alphaMapTransform:{value:new at},alphaTest:{value:0}}},qn={basic:{uniforms:rn([ze.common,ze.specularmap,ze.envmap,ze.aomap,ze.lightmap,ze.fog]),vertexShader:ct.meshbasic_vert,fragmentShader:ct.meshbasic_frag},lambert:{uniforms:rn([ze.common,ze.specularmap,ze.envmap,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.fog,ze.lights,{emissive:{value:new Ne(0)}}]),vertexShader:ct.meshlambert_vert,fragmentShader:ct.meshlambert_frag},phong:{uniforms:rn([ze.common,ze.specularmap,ze.envmap,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.fog,ze.lights,{emissive:{value:new Ne(0)},specular:{value:new Ne(1118481)},shininess:{value:30}}]),vertexShader:ct.meshphong_vert,fragmentShader:ct.meshphong_frag},standard:{uniforms:rn([ze.common,ze.envmap,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.roughnessmap,ze.metalnessmap,ze.fog,ze.lights,{emissive:{value:new Ne(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ct.meshphysical_vert,fragmentShader:ct.meshphysical_frag},toon:{uniforms:rn([ze.common,ze.aomap,ze.lightmap,ze.emissivemap,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.gradientmap,ze.fog,ze.lights,{emissive:{value:new Ne(0)}}]),vertexShader:ct.meshtoon_vert,fragmentShader:ct.meshtoon_frag},matcap:{uniforms:rn([ze.common,ze.bumpmap,ze.normalmap,ze.displacementmap,ze.fog,{matcap:{value:null}}]),vertexShader:ct.meshmatcap_vert,fragmentShader:ct.meshmatcap_frag},points:{uniforms:rn([ze.points,ze.fog]),vertexShader:ct.points_vert,fragmentShader:ct.points_frag},dashed:{uniforms:rn([ze.common,ze.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ct.linedashed_vert,fragmentShader:ct.linedashed_frag},depth:{uniforms:rn([ze.common,ze.displacementmap]),vertexShader:ct.depth_vert,fragmentShader:ct.depth_frag},normal:{uniforms:rn([ze.common,ze.bumpmap,ze.normalmap,ze.displacementmap,{opacity:{value:1}}]),vertexShader:ct.meshnormal_vert,fragmentShader:ct.meshnormal_frag},sprite:{uniforms:rn([ze.sprite,ze.fog]),vertexShader:ct.sprite_vert,fragmentShader:ct.sprite_frag},background:{uniforms:{uvTransform:{value:new at},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ct.background_vert,fragmentShader:ct.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new at}},vertexShader:ct.backgroundCube_vert,fragmentShader:ct.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ct.cube_vert,fragmentShader:ct.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ct.equirect_vert,fragmentShader:ct.equirect_frag},distanceRGBA:{uniforms:rn([ze.common,ze.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ct.distanceRGBA_vert,fragmentShader:ct.distanceRGBA_frag},shadow:{uniforms:rn([ze.lights,ze.fog,{color:{value:new Ne(0)},opacity:{value:1}}]),vertexShader:ct.shadow_vert,fragmentShader:ct.shadow_frag}};qn.physical={uniforms:rn([qn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new at},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new at},clearcoatNormalScale:{value:new Be(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new at},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new at},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new at},sheen:{value:0},sheenColor:{value:new Ne(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new at},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new at},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new at},transmissionSamplerSize:{value:new Be},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new at},attenuationDistance:{value:0},attenuationColor:{value:new Ne(0)},specularColor:{value:new Ne(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new at},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new at},anisotropyVector:{value:new Be},anisotropyMap:{value:null},anisotropyMapTransform:{value:new at}}]),vertexShader:ct.meshphysical_vert,fragmentShader:ct.meshphysical_frag};var Ra={r:0,b:0,g:0},es=new hn,A0=new xt;function H0(n,e,t,i,s,r,o){let a=new Ne(0),l=r===!0?0:1,c,h,d=null,u=0,p=null;function f(y){let x=y.isScene===!0?y.background:null;return x&&x.isTexture&&(x=(y.backgroundBlurriness>0?t:e).get(x)),x}function E(y){let x=!1,b=f(y);b===null?m(a,l):b&&b.isColor&&(m(b,1),x=!0);let v=n.xr.getEnvironmentBlendMode();v==="additive"?i.buffers.color.setClear(0,0,0,1,o):v==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||x)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function M(y,x){let b=f(x);b&&(b.isCubeTexture||b.mapping===xr)?(h===void 0&&(h=new g(new W(1,1,1),new $t({name:"BackgroundCubeMaterial",uniforms:ji(qn.backgroundCube.uniforms),vertexShader:qn.backgroundCube.vertexShader,fragmentShader:qn.backgroundCube.fragmentShader,side:jt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(v,R,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),es.copy(x.backgroundRotation),es.x*=-1,es.y*=-1,es.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(es.y*=-1,es.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(A0.makeRotationFromEuler(es)),h.material.toneMapped=wt.getTransfer(b.colorSpace)!==Rt,(d!==b||u!==b.version||p!==n.toneMapping)&&(h.material.needsUpdate=!0,d=b,u=b.version,p=n.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new g(new rt(2,2),new $t({name:"BackgroundMaterial",uniforms:ji(qn.background.uniforms),vertexShader:qn.background.vertexShader,fragmentShader:qn.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.toneMapped=wt.getTransfer(b.colorSpace)!==Rt,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(d!==b||u!==b.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,d=b,u=b.version,p=n.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function m(y,x){y.getRGB(Ra,Xl(n)),i.buffers.color.setClear(Ra.r,Ra.g,Ra.b,x,o)}function w(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(y,x=1){a.set(y),l=x,m(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,m(a,l)},render:E,addToRenderList:M,dispose:w}}function P0(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=u(null),r=s,o=!1;function a(T,I,G,F,k){let Y=!1,X=d(F,G,I);r!==X&&(r=X,c(r.object)),Y=p(T,F,G,k),Y&&f(T,F,G,k),k!==null&&e.update(k,n.ELEMENT_ARRAY_BUFFER),(Y||o)&&(o=!1,x(T,I,G,F),k!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(k).buffer))}function l(){return n.createVertexArray()}function c(T){return n.bindVertexArray(T)}function h(T){return n.deleteVertexArray(T)}function d(T,I,G){let F=G.wireframe===!0,k=i[T.id];k===void 0&&(k={},i[T.id]=k);let Y=k[I.id];Y===void 0&&(Y={},k[I.id]=Y);let X=Y[F];return X===void 0&&(X=u(l()),Y[F]=X),X}function u(T){let I=[],G=[],F=[];for(let k=0;k<t;k++)I[k]=0,G[k]=0,F[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:G,attributeDivisors:F,object:T,attributes:{},index:null}}function p(T,I,G,F){let k=r.attributes,Y=I.attributes,X=0,ie=G.getAttributes();for(let O in ie)if(ie[O].location>=0){let ee=k[O],be=Y[O];if(be===void 0&&(O==="instanceMatrix"&&T.instanceMatrix&&(be=T.instanceMatrix),O==="instanceColor"&&T.instanceColor&&(be=T.instanceColor)),ee===void 0||ee.attribute!==be||be&&ee.data!==be.data)return!0;X++}return r.attributesNum!==X||r.index!==F}function f(T,I,G,F){let k={},Y=I.attributes,X=0,ie=G.getAttributes();for(let O in ie)if(ie[O].location>=0){let ee=Y[O];ee===void 0&&(O==="instanceMatrix"&&T.instanceMatrix&&(ee=T.instanceMatrix),O==="instanceColor"&&T.instanceColor&&(ee=T.instanceColor));let be={};be.attribute=ee,ee&&ee.data&&(be.data=ee.data),k[O]=be,X++}r.attributes=k,r.attributesNum=X,r.index=F}function E(){let T=r.newAttributes;for(let I=0,G=T.length;I<G;I++)T[I]=0}function M(T){m(T,0)}function m(T,I){let G=r.newAttributes,F=r.enabledAttributes,k=r.attributeDivisors;G[T]=1,F[T]===0&&(n.enableVertexAttribArray(T),F[T]=1),k[T]!==I&&(n.vertexAttribDivisor(T,I),k[T]=I)}function w(){let T=r.newAttributes,I=r.enabledAttributes;for(let G=0,F=I.length;G<F;G++)I[G]!==T[G]&&(n.disableVertexAttribArray(G),I[G]=0)}function y(T,I,G,F,k,Y,X){X===!0?n.vertexAttribIPointer(T,I,G,k,Y):n.vertexAttribPointer(T,I,G,F,k,Y)}function x(T,I,G,F){E();let k=F.attributes,Y=G.getAttributes(),X=I.defaultAttributeValues;for(let ie in Y){let O=Y[ie];if(O.location>=0){let re=k[ie];if(re===void 0&&(ie==="instanceMatrix"&&T.instanceMatrix&&(re=T.instanceMatrix),ie==="instanceColor"&&T.instanceColor&&(re=T.instanceColor)),re!==void 0){let ee=re.normalized,be=re.itemSize,he=e.get(re);if(he===void 0)continue;let ue=he.buffer,$=he.type,ge=he.bytesPerElement,Ae=$===n.INT||$===n.UNSIGNED_INT||re.gpuType===Zo;if(re.isInterleavedBufferAttribute){let xe=re.data,J=xe.stride,Me=re.offset;if(xe.isInstancedInterleavedBuffer){for(let j=0;j<O.locationSize;j++)m(O.location+j,xe.meshPerAttribute);T.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=xe.meshPerAttribute*xe.count)}else for(let j=0;j<O.locationSize;j++)M(O.location+j);n.bindBuffer(n.ARRAY_BUFFER,ue);for(let j=0;j<O.locationSize;j++)y(O.location+j,be/O.locationSize,$,ee,J*ge,(Me+be/O.locationSize*j)*ge,Ae)}else{if(re.isInstancedBufferAttribute){for(let xe=0;xe<O.locationSize;xe++)m(O.location+xe,re.meshPerAttribute);T.isInstancedMesh!==!0&&F._maxInstanceCount===void 0&&(F._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let xe=0;xe<O.locationSize;xe++)M(O.location+xe);n.bindBuffer(n.ARRAY_BUFFER,ue);for(let xe=0;xe<O.locationSize;xe++)y(O.location+xe,be/O.locationSize,$,ee,be*ge,be/O.locationSize*xe*ge,Ae)}}else if(X!==void 0){let ee=X[ie];if(ee!==void 0)switch(ee.length){case 2:n.vertexAttrib2fv(O.location,ee);break;case 3:n.vertexAttrib3fv(O.location,ee);break;case 4:n.vertexAttrib4fv(O.location,ee);break;default:n.vertexAttrib1fv(O.location,ee)}}}}w()}function b(){C();for(let T in i){let I=i[T];for(let G in I){let F=I[G];for(let k in F)h(F[k].object),delete F[k];delete I[G]}delete i[T]}}function v(T){if(i[T.id]===void 0)return;let I=i[T.id];for(let G in I){let F=I[G];for(let k in F)h(F[k].object),delete F[k];delete I[G]}delete i[T.id]}function R(T){for(let I in i){let G=i[I];if(G[T.id]===void 0)continue;let F=G[T.id];for(let k in F)h(F[k].object),delete F[k];delete G[T.id]}}function C(){_(),o=!0,r!==s&&(r=s,c(r.object))}function _(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:C,resetDefaultState:_,dispose:b,releaseStatesOfGeometry:v,releaseStatesOfProgram:R,initAttributes:E,enableAttribute:M,disableUnusedAttributes:w}}function I0(n,e,t){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function o(c,h,d){d!==0&&(n.drawArraysInstanced(i,c,h,d),t.update(h,i,d))}function a(c,h,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,d);let p=0;for(let f=0;f<d;f++)p+=h[f];t.update(p,i,1)}function l(c,h,d,u){if(d===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<c.length;f++)o(c[f],h[f],u[f]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,h,0,u,0,d);let f=0;for(let E=0;E<d;E++)f+=h[E]*u[E];t.update(f,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function D0(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(R){return!(R!==En&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(R){let C=R===Ci&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Xn&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==Yn&&!C)}function l(R){if(R==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,u=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),f=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),E=n.getParameter(n.MAX_TEXTURE_SIZE),M=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),y=n.getParameter(n.MAX_VARYING_VECTORS),x=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),b=f>0,v=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:p,maxVertexTextures:f,maxTextureSize:E,maxCubemapSize:M,maxAttributes:m,maxVertexUniforms:w,maxVaryings:y,maxFragmentUniforms:x,vertexTextures:b,maxSamples:v}}function L0(n){let e=this,t=null,i=0,s=!1,r=!1,o=new Rn,a=new at,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let p=d.length!==0||u||i!==0||s;return s=u,i=d.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,p){let f=d.clippingPlanes,E=d.clipIntersection,M=d.clipShadows,m=n.get(d);if(!s||f===null||f.length===0||r&&!M)r?h(null):c();else{let w=r?0:i,y=w*4,x=m.clippingState||null;l.value=x,x=h(f,u,y,p);for(let b=0;b!==y;++b)x[b]=t[b];m.clippingState=x,this.numIntersection=E?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,u,p,f){let E=d!==null?d.length:0,M=null;if(E!==0){if(M=l.value,f!==!0||M===null){let m=p+E*4,w=u.matrixWorldInverse;a.getNormalMatrix(w),(M===null||M.length<m)&&(M=new Float32Array(m));for(let y=0,x=p;y!==E;++y,x+=4)o.copy(d[y]).applyMatrix4(w,a),o.normal.toArray(M,x),M[x+3]=o.constant}l.value=M,l.needsUpdate=!0}return e.numPlanes=E,e.numIntersection=0,M}}function B0(n){let e=new WeakMap;function t(o,a){return a===Xo?o.mapping=$i:a===Yo&&(o.mapping=Qi),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===Xo||a===Yo)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new po(l.height);return c.fromEquirectangularTexture(n,o),e.set(o,c),o.addEventListener("dispose",s),t(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var Us=4,zh=[.125,.215,.35,.446,.526,.582],is=20,Kl=new Ki,Vh=new Ne,$l=null,Ql=0,jl=0,ec=!1,ns=(1+Math.sqrt(5))/2,Gs=1/ns,Wh=[new D(-ns,Gs,0),new D(ns,Gs,0),new D(-Gs,0,ns),new D(Gs,0,ns),new D(0,ns,-Gs),new D(0,ns,Gs),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],G0=new D,Ha=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=G0}=r;$l=this._renderer.getRenderTarget(),Ql=this._renderer.getActiveCubeFace(),jl=this._renderer.getActiveMipmapLevel(),ec=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=qh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Yh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget($l,Ql,jl),this._renderer.xr.enabled=ec,e.scissorTest=!1,Ca(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===$i||e.mapping===Qi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),$l=this._renderer.getRenderTarget(),Ql=this._renderer.getActiveCubeFace(),jl=this._renderer.getActiveMipmapLevel(),ec=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Gn,minFilter:Gn,generateMipmaps:!1,type:Ci,format:En,colorSpace:zi,depthBuffer:!1},s=Xh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Xh(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=U0(r)),this._blurMaterial=F0(r,e,t)}return s}_compileMaterial(e){let t=new g(this._lodPlanes[0],e);this._renderer.compile(t,Kl)}_sceneToCubeUV(e,t,i,s,r){let l=new Lt(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,p=d.toneMapping;d.getClearColor(Vh),d.toneMapping=oi,d.autoClear=!1;let f=new De({name:"PMREM.Background",side:jt,depthWrite:!1,depthTest:!1}),E=new g(new W,f),M=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,M=!0):(f.color.copy(Vh),M=!0);for(let w=0;w<6;w++){let y=w%3;y===0?(l.up.set(0,c[w],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[w],r.y,r.z)):y===1?(l.up.set(0,0,c[w]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[w],r.z)):(l.up.set(0,c[w],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[w]));let x=this._cubeSize;Ca(s,y*x,w>2?x:0,x,x),d.setRenderTarget(s),M&&d.render(E,l),d.render(e,l)}E.geometry.dispose(),E.material.dispose(),d.toneMapping=p,d.autoClear=u,e.background=m}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===$i||e.mapping===Qi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=qh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Yh());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new g(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Ca(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Kl)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Wh[(s-r-1)%Wh.length];this._blur(e,r-1,r,o,a)}t.autoClear=i}_blur(e,t,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",r),this._halfBlur(o,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,d=new g(this._lodPlanes[s],c),u=c.uniforms,p=this._sizeLods[i]-1,f=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*is-1),E=r/f,M=isFinite(r)?1+Math.floor(h*E):is;M>is&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${M} samples when the maximum is set to ${is}`);let m=[],w=0;for(let R=0;R<is;++R){let C=R/E,_=Math.exp(-C*C/2);m.push(_),R===0?w+=_:R<M&&(w+=2*_)}for(let R=0;R<m.length;R++)m[R]=m[R]/w;u.envMap.value=e.texture,u.samples.value=M,u.weights.value=m,u.latitudinal.value=o==="latitudinal",a&&(u.poleAxis.value=a);let{_lodMax:y}=this;u.dTheta.value=f,u.mipInt.value=y-i;let x=this._sizeLods[s],b=3*x*(s>y-Us?s-y+Us:0),v=4*(this._cubeSize-x);Ca(t,b,v,3*x,2*x),l.setRenderTarget(t),l.render(d,Kl)}};function U0(n){let e=[],t=[],i=[],s=n,r=n-Us+1+zh.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let l=1/a;o>n-Us?l=zh[o-n+Us-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],p=6,f=6,E=3,M=2,m=1,w=new Float32Array(E*f*p),y=new Float32Array(M*f*p),x=new Float32Array(m*f*p);for(let v=0;v<p;v++){let R=v%3*2/3-1,C=v>2?0:-1,_=[R,C,0,R+2/3,C,0,R+2/3,C+1,0,R,C,0,R+2/3,C+1,0,R,C+1,0];w.set(_,E*f*v),y.set(u,M*f*v);let T=[v,v,v,v,v,v];x.set(T,m*f*v)}let b=new Gt;b.setAttribute("position",new Kt(w,E)),b.setAttribute("uv",new Kt(y,M)),b.setAttribute("faceIndex",new Kt(x,m)),e.push(b),s>Us&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Xh(n,e,t){let i=new Cn(n,e,t);return i.texture.mapping=xr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ca(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function F0(n,e,t){let i=new Float32Array(is),s=new D(0,1,0);return new $t({name:"SphericalGaussianBlur",defines:{n:is,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:hc(),fragmentShader:`

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
		`,blending:ri,depthTest:!1,depthWrite:!1})}function Yh(){return new $t({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:hc(),fragmentShader:`

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
		`,blending:ri,depthTest:!1,depthWrite:!1})}function qh(){return new $t({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:hc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ri,depthTest:!1,depthWrite:!1})}function hc(){return`

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
	`}function N0(n){let e=new WeakMap,t=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===Xo||l===Yo,h=l===$i||l===Qi;if(c||h){let d=e.get(a),u=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==u)return t===null&&(t=new Ha(n)),d=c?t.fromEquirectangular(a,d):t.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),d.texture;if(d!==void 0)return d.texture;{let p=a.image;return c&&p&&p.height>0||h&&p&&s(p)?(t===null&&(t=new Ha(n)),d=c?t.fromEquirectangular(a):t.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),a.addEventListener("dispose",r),d.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function k0(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&Cr("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function O0(n,e,t,i){let s={},r=new WeakMap;function o(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let f in u.attributes)e.remove(u.attributes[f]);u.removeEventListener("dispose",o),delete s[u.id];let p=r.get(u);p&&(e.remove(p),r.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function a(d,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,t.memory.geometries++),u}function l(d){let u=d.attributes;for(let p in u)e.update(u[p],n.ARRAY_BUFFER)}function c(d){let u=[],p=d.index,f=d.attributes.position,E=0;if(p!==null){let w=p.array;E=p.version;for(let y=0,x=w.length;y<x;y+=3){let b=w[y+0],v=w[y+1],R=w[y+2];u.push(b,v,v,R,R,b)}}else if(f!==void 0){let w=f.array;E=f.version;for(let y=0,x=w.length/3-1;y<x;y+=3){let b=y+0,v=y+1,R=y+2;u.push(b,v,v,R,R,b)}}else return;let M=new(Wl(u)?nr:tr)(u,1);M.version=E;let m=r.get(d);m&&e.remove(m),r.set(d,M)}function h(d){let u=r.get(d);if(u){let p=d.index;p!==null&&u.version<p.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function z0(n,e,t){let i;function s(u){i=u}let r,o;function a(u){r=u.type,o=u.bytesPerElement}function l(u,p){n.drawElements(i,p,r,u*o),t.update(p,i,1)}function c(u,p,f){f!==0&&(n.drawElementsInstanced(i,p,r,u*o,f),t.update(p,i,f))}function h(u,p,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,r,u,0,f);let M=0;for(let m=0;m<f;m++)M+=p[m];t.update(M,i,1)}function d(u,p,f,E){if(f===0)return;let M=e.get("WEBGL_multi_draw");if(M===null)for(let m=0;m<u.length;m++)c(u[m]/o,p[m],E[m]);else{M.multiDrawElementsInstancedWEBGL(i,p,0,r,u,0,E,0,f);let m=0;for(let w=0;w<f;w++)m+=p[w]*E[w];t.update(m,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function V0(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function W0(n,e,t){let i=new WeakMap,s=new vt;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(a);if(u===void 0||u.count!==d){let _=function(){R.dispose(),i.delete(a),a.removeEventListener("dispose",_)};u!==void 0&&u.texture.dispose();let p=a.morphAttributes.position!==void 0,f=a.morphAttributes.normal!==void 0,E=a.morphAttributes.color!==void 0,M=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],w=a.morphAttributes.color||[],y=0;p===!0&&(y=1),f===!0&&(y=2),E===!0&&(y=3);let x=a.attributes.position.count*y,b=1;x>e.maxTextureSize&&(b=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);let v=new Float32Array(x*b*4*d),R=new er(v,x,b,d);R.type=Yn,R.needsUpdate=!0;let C=y*4;for(let T=0;T<d;T++){let I=M[T],G=m[T],F=w[T],k=x*b*4*T;for(let Y=0;Y<I.count;Y++){let X=Y*C;p===!0&&(s.fromBufferAttribute(I,Y),v[k+X+0]=s.x,v[k+X+1]=s.y,v[k+X+2]=s.z,v[k+X+3]=0),f===!0&&(s.fromBufferAttribute(G,Y),v[k+X+4]=s.x,v[k+X+5]=s.y,v[k+X+6]=s.z,v[k+X+7]=0),E===!0&&(s.fromBufferAttribute(F,Y),v[k+X+8]=s.x,v[k+X+9]=s.y,v[k+X+10]=s.z,v[k+X+11]=F.itemSize===4?s.w:1)}}u={count:d,texture:R,size:new Be(x,b)},i.set(a,u),a.addEventListener("dispose",_)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let p=0;for(let E=0;E<c.length;E++)p+=c[E];let f=a.morphTargetsRelative?1:1-p;l.getUniforms().setValue(n,"morphTargetBaseInfluence",f),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:r}}function X0(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,d=e.get(l,h);if(s.get(d)!==c&&(e.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let u=l.skeleton;s.get(u)!==c&&(u.update(),s.set(u,c))}return d}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:o}}var ud=new cn,Zh=new lr(1,1),fd=new er,pd=new uo,md=new sr,Jh=[],Kh=[],$h=new Float32Array(16),Qh=new Float32Array(9),jh=new Float32Array(4);function Ns(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Jh[s];if(r===void 0&&(r=new Float32Array(s),Jh[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function Yt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function qt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Ia(n,e){let t=Kh[e];t===void 0&&(t=new Int32Array(e),Kh[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Y0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function q0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Yt(t,e))return;n.uniform2fv(this.addr,e),qt(t,e)}}function Z0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Yt(t,e))return;n.uniform3fv(this.addr,e),qt(t,e)}}function J0(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Yt(t,e))return;n.uniform4fv(this.addr,e),qt(t,e)}}function K0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Yt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),qt(t,e)}else{if(Yt(t,i))return;jh.set(i),n.uniformMatrix2fv(this.addr,!1,jh),qt(t,i)}}function $0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Yt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),qt(t,e)}else{if(Yt(t,i))return;Qh.set(i),n.uniformMatrix3fv(this.addr,!1,Qh),qt(t,i)}}function Q0(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Yt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),qt(t,e)}else{if(Yt(t,i))return;$h.set(i),n.uniformMatrix4fv(this.addr,!1,$h),qt(t,i)}}function j0(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function em(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Yt(t,e))return;n.uniform2iv(this.addr,e),qt(t,e)}}function tm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Yt(t,e))return;n.uniform3iv(this.addr,e),qt(t,e)}}function nm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Yt(t,e))return;n.uniform4iv(this.addr,e),qt(t,e)}}function im(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function sm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Yt(t,e))return;n.uniform2uiv(this.addr,e),qt(t,e)}}function rm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Yt(t,e))return;n.uniform3uiv(this.addr,e),qt(t,e)}}function om(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Yt(t,e))return;n.uniform4uiv(this.addr,e),qt(t,e)}}function am(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Zh.compareFunction=Ol,r=Zh):r=ud,t.setTexture2D(e||r,s)}function lm(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||pd,s)}function cm(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||md,s)}function hm(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||fd,s)}function dm(n){switch(n){case 5126:return Y0;case 35664:return q0;case 35665:return Z0;case 35666:return J0;case 35674:return K0;case 35675:return $0;case 35676:return Q0;case 5124:case 35670:return j0;case 35667:case 35671:return em;case 35668:case 35672:return tm;case 35669:case 35673:return nm;case 5125:return im;case 36294:return sm;case 36295:return rm;case 36296:return om;case 35678:case 36198:case 36298:case 36306:case 35682:return am;case 35679:case 36299:case 36307:return lm;case 35680:case 36300:case 36308:case 36293:return cm;case 36289:case 36303:case 36311:case 36292:return hm}}function um(n,e){n.uniform1fv(this.addr,e)}function fm(n,e){let t=Ns(e,this.size,2);n.uniform2fv(this.addr,t)}function pm(n,e){let t=Ns(e,this.size,3);n.uniform3fv(this.addr,t)}function mm(n,e){let t=Ns(e,this.size,4);n.uniform4fv(this.addr,t)}function Em(n,e){let t=Ns(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function gm(n,e){let t=Ns(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Mm(n,e){let t=Ns(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function ym(n,e){n.uniform1iv(this.addr,e)}function xm(n,e){n.uniform2iv(this.addr,e)}function Tm(n,e){n.uniform3iv(this.addr,e)}function wm(n,e){n.uniform4iv(this.addr,e)}function _m(n,e){n.uniform1uiv(this.addr,e)}function Sm(n,e){n.uniform2uiv(this.addr,e)}function vm(n,e){n.uniform3uiv(this.addr,e)}function bm(n,e){n.uniform4uiv(this.addr,e)}function Rm(n,e,t){let i=this.cache,s=e.length,r=Ia(t,s);Yt(i,r)||(n.uniform1iv(this.addr,r),qt(i,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||ud,r[o])}function Cm(n,e,t){let i=this.cache,s=e.length,r=Ia(t,s);Yt(i,r)||(n.uniform1iv(this.addr,r),qt(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||pd,r[o])}function Am(n,e,t){let i=this.cache,s=e.length,r=Ia(t,s);Yt(i,r)||(n.uniform1iv(this.addr,r),qt(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||md,r[o])}function Hm(n,e,t){let i=this.cache,s=e.length,r=Ia(t,s);Yt(i,r)||(n.uniform1iv(this.addr,r),qt(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||fd,r[o])}function Pm(n){switch(n){case 5126:return um;case 35664:return fm;case 35665:return pm;case 35666:return mm;case 35674:return Em;case 35675:return gm;case 35676:return Mm;case 5124:case 35670:return ym;case 35667:case 35671:return xm;case 35668:case 35672:return Tm;case 35669:case 35673:return wm;case 5125:return _m;case 36294:return Sm;case 36295:return vm;case 36296:return bm;case 35678:case 36198:case 36298:case 36306:case 35682:return Rm;case 35679:case 36299:case 36307:return Cm;case 35680:case 36300:case 36308:case 36293:return Am;case 36289:case 36303:case 36311:case 36292:return Hm}}var nc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=dm(t.type)}},ic=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Pm(t.type)}},sc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},tc=/(\w+)(\])?(\[|\.)?/g;function ed(n,e){n.seq.push(e),n.map[e.id]=e}function Im(n,e,t){let i=n.name,s=i.length;for(tc.lastIndex=0;;){let r=tc.exec(i),o=tc.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){ed(t,c===void 0?new nc(a,n,e):new ic(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new sc(a),ed(t,d)),t=d}}}var Fs=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);Im(r,o,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function td(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var Dm=37297,Lm=0;function Bm(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var nd=new at;function Gm(n){wt._getMatrix(nd,wt.workingColorSpace,n);let e=`mat3( ${nd.elements.map(t=>t.toFixed(4))} )`;switch(wt.getTransfer(n)){case $s:return[e,"LinearTransferOETF"];case Rt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function id(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+Bm(n.getShaderSource(e),o)}else return s}function Um(n,e){let t=Gm(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Fm(n,e){let t;switch(e){case yh:t="Linear";break;case xh:t="Reinhard";break;case Th:t="Cineon";break;case Wo:t="ACESFilmic";break;case _h:t="AgX";break;case Sh:t="Neutral";break;case wh:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Aa=new D;function Nm(){wt.getLuminanceCoefficients(Aa);let n=Aa.x.toFixed(4),e=Aa.y.toFixed(4),t=Aa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function km(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ar).join(`
`)}function Om(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function zm(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function Ar(n){return n!==""}function sd(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function rd(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Vm=/^[ \t]*#include +<([\w\d./]+)>/gm;function rc(n){return n.replace(Vm,Xm)}var Wm=new Map;function Xm(n,e){let t=ct[e];if(t===void 0){let i=Wm.get(e);if(i!==void 0)t=ct[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return rc(t)}var Ym=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function od(n){return n.replace(Ym,qm)}function qm(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ad(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}function Zm(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===vl?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===Go?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Vn&&(e="SHADOWMAP_TYPE_VSM"),e}function Jm(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case $i:case Qi:e="ENVMAP_TYPE_CUBE";break;case xr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Km(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Qi:e="ENVMAP_MODE_REFRACTION";break}return e}function $m(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Cl:e="ENVMAP_BLENDING_MULTIPLY";break;case gh:e="ENVMAP_BLENDING_MIX";break;case Mh:e="ENVMAP_BLENDING_ADD";break}return e}function Qm(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function jm(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=Zm(t),c=Jm(t),h=Km(t),d=$m(t),u=Qm(t),p=km(t),f=Om(r),E=s.createProgram(),M,m,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(M=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(Ar).join(`
`),M.length>0&&(M+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(Ar).join(`
`),m.length>0&&(m+=`
`)):(M=[ad(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ar).join(`
`),m=[ad(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==oi?"#define TONE_MAPPING":"",t.toneMapping!==oi?ct.tonemapping_pars_fragment:"",t.toneMapping!==oi?Fm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ct.colorspace_pars_fragment,Um("linearToOutputTexel",t.outputColorSpace),Nm(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ar).join(`
`)),o=rc(o),o=sd(o,t),o=rd(o,t),a=rc(a),a=sd(a,t),a=rd(a,t),o=od(o),a=od(a),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,M=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+M,m=["#define varying in",t.glslVersion===zl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===zl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let y=w+M+o,x=w+m+a,b=td(s,s.VERTEX_SHADER,y),v=td(s,s.FRAGMENT_SHADER,x);s.attachShader(E,b),s.attachShader(E,v),t.index0AttributeName!==void 0?s.bindAttribLocation(E,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(E,0,"position"),s.linkProgram(E);function R(I){if(n.debug.checkShaderErrors){let G=s.getProgramInfoLog(E).trim(),F=s.getShaderInfoLog(b).trim(),k=s.getShaderInfoLog(v).trim(),Y=!0,X=!0;if(s.getProgramParameter(E,s.LINK_STATUS)===!1)if(Y=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,E,b,v);else{let ie=id(s,b,"vertex"),O=id(s,v,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(E,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+G+`
`+ie+`
`+O)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(F===""||k==="")&&(X=!1);X&&(I.diagnostics={runnable:Y,programLog:G,vertexShader:{log:F,prefix:M},fragmentShader:{log:k,prefix:m}})}s.deleteShader(b),s.deleteShader(v),C=new Fs(s,E),_=zm(s,E)}let C;this.getUniforms=function(){return C===void 0&&R(this),C};let _;this.getAttributes=function(){return _===void 0&&R(this),_};let T=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=s.getProgramParameter(E,Dm)),T},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(E),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Lm++,this.cacheKey=e,this.usedTimes=1,this.program=E,this.vertexShader=b,this.fragmentShader=v,this}var eE=0,oc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new ac(e),t.set(e,i)),i}},ac=class{constructor(e){this.id=eE++,this.code=e,this.usedTimes=0}};function tE(n,e,t,i,s,r,o){let a=new vs,l=new oc,c=new Set,h=[],d=s.logarithmicDepthBuffer,u=s.vertexTextures,p=s.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function E(_){return c.add(_),_===0?"uv":`uv${_}`}function M(_,T,I,G,F){let k=G.fog,Y=F.geometry,X=_.isMeshStandardMaterial?G.environment:null,ie=(_.isMeshStandardMaterial?t:e).get(_.envMap||X),O=ie&&ie.mapping===xr?ie.image.height:null,re=f[_.type];_.precision!==null&&(p=s.getMaxPrecision(_.precision),p!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",p,"instead."));let ee=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,be=ee!==void 0?ee.length:0,he=0;Y.morphAttributes.position!==void 0&&(he=1),Y.morphAttributes.normal!==void 0&&(he=2),Y.morphAttributes.color!==void 0&&(he=3);let ue,$,ge,Ae;if(re){let it=qn[re];ue=it.vertexShader,$=it.fragmentShader}else ue=_.vertexShader,$=_.fragmentShader,l.update(_),ge=l.getVertexShaderID(_),Ae=l.getFragmentShaderID(_);let xe=n.getRenderTarget(),J=n.state.buffers.depth.getReversed(),Me=F.isInstancedMesh===!0,j=F.isBatchedMesh===!0,te=!!_.map,ve=!!_.matcap,de=!!ie,B=!!_.aoMap,we=!!_.lightMap,N=!!_.bumpMap,Ge=!!_.normalMap,P=!!_.displacementMap,ae=!!_.emissiveMap,He=!!_.metalnessMap,L=!!_.roughnessMap,S=_.anisotropy>0,z=_.clearcoat>0,oe=_.dispersion>0,me=_.iridescence>0,fe=_.sheen>0,Ve=_.transmission>0,Le=S&&!!_.anisotropyMap,pe=z&&!!_.clearcoatMap,Ze=z&&!!_.clearcoatNormalMap,_e=z&&!!_.clearcoatRoughnessMap,ke=me&&!!_.iridescenceMap,Ke=me&&!!_.iridescenceThicknessMap,je=fe&&!!_.sheenColorMap,Oe=fe&&!!_.sheenRoughnessMap,Pe=!!_.specularMap,Te=!!_.specularColorMap,Ie=!!_.specularIntensityMap,U=Ve&&!!_.transmissionMap,ye=Ve&&!!_.thicknessMap,Z=!!_.gradientMap,K=!!_.alphaMap,Se=_.alphaTest>0,Re=!!_.alphaHash,Ue=!!_.extensions,ot=oi;_.toneMapped&&(xe===null||xe.isXRRenderTarget===!0)&&(ot=n.toneMapping);let ft={shaderID:re,shaderType:_.type,shaderName:_.name,vertexShader:ue,fragmentShader:$,defines:_.defines,customVertexShaderID:ge,customFragmentShaderID:Ae,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:p,batching:j,batchingColor:j&&F._colorsTexture!==null,instancing:Me,instancingColor:Me&&F.instanceColor!==null,instancingMorph:Me&&F.morphTexture!==null,supportsVertexTextures:u,outputColorSpace:xe===null?n.outputColorSpace:xe.isXRRenderTarget===!0?xe.texture.colorSpace:zi,alphaToCoverage:!!_.alphaToCoverage,map:te,matcap:ve,envMap:de,envMapMode:de&&ie.mapping,envMapCubeUVHeight:O,aoMap:B,lightMap:we,bumpMap:N,normalMap:Ge,displacementMap:u&&P,emissiveMap:ae,normalMapObjectSpace:Ge&&_.normalMapType===Ch,normalMapTangentSpace:Ge&&_.normalMapType===kl,metalnessMap:He,roughnessMap:L,anisotropy:S,anisotropyMap:Le,clearcoat:z,clearcoatMap:pe,clearcoatNormalMap:Ze,clearcoatRoughnessMap:_e,dispersion:oe,iridescence:me,iridescenceMap:ke,iridescenceThicknessMap:Ke,sheen:fe,sheenColorMap:je,sheenRoughnessMap:Oe,specularMap:Pe,specularColorMap:Te,specularIntensityMap:Ie,transmission:Ve,transmissionMap:U,thicknessMap:ye,gradientMap:Z,opaque:_.transparent===!1&&_.blending===ki&&_.alphaToCoverage===!1,alphaMap:K,alphaTest:Se,alphaHash:Re,combine:_.combine,mapUv:te&&E(_.map.channel),aoMapUv:B&&E(_.aoMap.channel),lightMapUv:we&&E(_.lightMap.channel),bumpMapUv:N&&E(_.bumpMap.channel),normalMapUv:Ge&&E(_.normalMap.channel),displacementMapUv:P&&E(_.displacementMap.channel),emissiveMapUv:ae&&E(_.emissiveMap.channel),metalnessMapUv:He&&E(_.metalnessMap.channel),roughnessMapUv:L&&E(_.roughnessMap.channel),anisotropyMapUv:Le&&E(_.anisotropyMap.channel),clearcoatMapUv:pe&&E(_.clearcoatMap.channel),clearcoatNormalMapUv:Ze&&E(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:_e&&E(_.clearcoatRoughnessMap.channel),iridescenceMapUv:ke&&E(_.iridescenceMap.channel),iridescenceThicknessMapUv:Ke&&E(_.iridescenceThicknessMap.channel),sheenColorMapUv:je&&E(_.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&E(_.sheenRoughnessMap.channel),specularMapUv:Pe&&E(_.specularMap.channel),specularColorMapUv:Te&&E(_.specularColorMap.channel),specularIntensityMapUv:Ie&&E(_.specularIntensityMap.channel),transmissionMapUv:U&&E(_.transmissionMap.channel),thicknessMapUv:ye&&E(_.thicknessMap.channel),alphaMapUv:K&&E(_.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(Ge||S),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!Y.attributes.uv&&(te||K),fog:!!k,useFog:_.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:J,skinning:F.isSkinnedMesh===!0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:be,morphTextureStride:he,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:ot,decodeVideoTexture:te&&_.map.isVideoTexture===!0&&wt.getTransfer(_.map.colorSpace)===Rt,decodeVideoTextureEmissive:ae&&_.emissiveMap.isVideoTexture===!0&&wt.getTransfer(_.emissiveMap.colorSpace)===Rt,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Mt,flipSided:_.side===jt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:Ue&&_.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ue&&_.extensions.multiDraw===!0||j)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return ft.vertexUv1s=c.has(1),ft.vertexUv2s=c.has(2),ft.vertexUv3s=c.has(3),c.clear(),ft}function m(_){let T=[];if(_.shaderID?T.push(_.shaderID):(T.push(_.customVertexShaderID),T.push(_.customFragmentShaderID)),_.defines!==void 0)for(let I in _.defines)T.push(I),T.push(_.defines[I]);return _.isRawShaderMaterial===!1&&(w(T,_),y(T,_),T.push(n.outputColorSpace)),T.push(_.customProgramCacheKey),T.join()}function w(_,T){_.push(T.precision),_.push(T.outputColorSpace),_.push(T.envMapMode),_.push(T.envMapCubeUVHeight),_.push(T.mapUv),_.push(T.alphaMapUv),_.push(T.lightMapUv),_.push(T.aoMapUv),_.push(T.bumpMapUv),_.push(T.normalMapUv),_.push(T.displacementMapUv),_.push(T.emissiveMapUv),_.push(T.metalnessMapUv),_.push(T.roughnessMapUv),_.push(T.anisotropyMapUv),_.push(T.clearcoatMapUv),_.push(T.clearcoatNormalMapUv),_.push(T.clearcoatRoughnessMapUv),_.push(T.iridescenceMapUv),_.push(T.iridescenceThicknessMapUv),_.push(T.sheenColorMapUv),_.push(T.sheenRoughnessMapUv),_.push(T.specularMapUv),_.push(T.specularColorMapUv),_.push(T.specularIntensityMapUv),_.push(T.transmissionMapUv),_.push(T.thicknessMapUv),_.push(T.combine),_.push(T.fogExp2),_.push(T.sizeAttenuation),_.push(T.morphTargetsCount),_.push(T.morphAttributeCount),_.push(T.numDirLights),_.push(T.numPointLights),_.push(T.numSpotLights),_.push(T.numSpotLightMaps),_.push(T.numHemiLights),_.push(T.numRectAreaLights),_.push(T.numDirLightShadows),_.push(T.numPointLightShadows),_.push(T.numSpotLightShadows),_.push(T.numSpotLightShadowsWithMaps),_.push(T.numLightProbes),_.push(T.shadowMapType),_.push(T.toneMapping),_.push(T.numClippingPlanes),_.push(T.numClipIntersection),_.push(T.depthPacking)}function y(_,T){a.disableAll(),T.supportsVertexTextures&&a.enable(0),T.instancing&&a.enable(1),T.instancingColor&&a.enable(2),T.instancingMorph&&a.enable(3),T.matcap&&a.enable(4),T.envMap&&a.enable(5),T.normalMapObjectSpace&&a.enable(6),T.normalMapTangentSpace&&a.enable(7),T.clearcoat&&a.enable(8),T.iridescence&&a.enable(9),T.alphaTest&&a.enable(10),T.vertexColors&&a.enable(11),T.vertexAlphas&&a.enable(12),T.vertexUv1s&&a.enable(13),T.vertexUv2s&&a.enable(14),T.vertexUv3s&&a.enable(15),T.vertexTangents&&a.enable(16),T.anisotropy&&a.enable(17),T.alphaHash&&a.enable(18),T.batching&&a.enable(19),T.dispersion&&a.enable(20),T.batchingColor&&a.enable(21),_.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reverseDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),_.push(a.mask)}function x(_){let T=f[_.type],I;if(T){let G=qn[T];I=ba.clone(G.uniforms)}else I=_.uniforms;return I}function b(_,T){let I;for(let G=0,F=h.length;G<F;G++){let k=h[G];if(k.cacheKey===T){I=k,++I.usedTimes;break}}return I===void 0&&(I=new jm(n,T,_,r),h.push(I)),I}function v(_){if(--_.usedTimes===0){let T=h.indexOf(_);h[T]=h[h.length-1],h.pop(),_.destroy()}}function R(_){l.remove(_)}function C(){l.dispose()}return{getParameters:M,getProgramCacheKey:m,getUniforms:x,acquireProgram:b,releaseProgram:v,releaseShaderCache:R,programs:h,dispose:C}}function nE(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function iE(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function ld(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function cd(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(d,u,p,f,E,M){let m=n[e];return m===void 0?(m={id:d.id,object:d,geometry:u,material:p,groupOrder:f,renderOrder:d.renderOrder,z:E,group:M},n[e]=m):(m.id=d.id,m.object=d,m.geometry=u,m.material=p,m.groupOrder=f,m.renderOrder=d.renderOrder,m.z=E,m.group=M),e++,m}function a(d,u,p,f,E,M){let m=o(d,u,p,f,E,M);p.transmission>0?i.push(m):p.transparent===!0?s.push(m):t.push(m)}function l(d,u,p,f,E,M){let m=o(d,u,p,f,E,M);p.transmission>0?i.unshift(m):p.transparent===!0?s.unshift(m):t.unshift(m)}function c(d,u){t.length>1&&t.sort(d||iE),i.length>1&&i.sort(u||ld),s.length>1&&s.sort(u||ld)}function h(){for(let d=e,u=n.length;d<u;d++){let p=n[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function sE(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new cd,n.set(i,[o])):s>=r.length?(o=new cd,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function rE(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new Ne};break;case"SpotLight":t={position:new D,direction:new D,color:new Ne,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new Ne,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new Ne,groundColor:new Ne};break;case"RectAreaLight":t={color:new Ne,position:new D,halfWidth:new D,halfHeight:new D};break}return n[e.id]=t,t}}}function oE(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var aE=0;function lE(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function cE(n){let e=new rE,t=oE(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new D);let s=new D,r=new xt,o=new xt;function a(c){let h=0,d=0,u=0;for(let _=0;_<9;_++)i.probe[_].set(0,0,0);let p=0,f=0,E=0,M=0,m=0,w=0,y=0,x=0,b=0,v=0,R=0;c.sort(lE);for(let _=0,T=c.length;_<T;_++){let I=c[_],G=I.color,F=I.intensity,k=I.distance,Y=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)h+=G.r*F,d+=G.g*F,u+=G.b*F;else if(I.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(I.sh.coefficients[X],F);R++}else if(I.isDirectionalLight){let X=e.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let ie=I.shadow,O=t.get(I);O.shadowIntensity=ie.intensity,O.shadowBias=ie.bias,O.shadowNormalBias=ie.normalBias,O.shadowRadius=ie.radius,O.shadowMapSize=ie.mapSize,i.directionalShadow[p]=O,i.directionalShadowMap[p]=Y,i.directionalShadowMatrix[p]=I.shadow.matrix,w++}i.directional[p]=X,p++}else if(I.isSpotLight){let X=e.get(I);X.position.setFromMatrixPosition(I.matrixWorld),X.color.copy(G).multiplyScalar(F),X.distance=k,X.coneCos=Math.cos(I.angle),X.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),X.decay=I.decay,i.spot[E]=X;let ie=I.shadow;if(I.map&&(i.spotLightMap[b]=I.map,b++,ie.updateMatrices(I),I.castShadow&&v++),i.spotLightMatrix[E]=ie.matrix,I.castShadow){let O=t.get(I);O.shadowIntensity=ie.intensity,O.shadowBias=ie.bias,O.shadowNormalBias=ie.normalBias,O.shadowRadius=ie.radius,O.shadowMapSize=ie.mapSize,i.spotShadow[E]=O,i.spotShadowMap[E]=Y,x++}E++}else if(I.isRectAreaLight){let X=e.get(I);X.color.copy(G).multiplyScalar(F),X.halfWidth.set(I.width*.5,0,0),X.halfHeight.set(0,I.height*.5,0),i.rectArea[M]=X,M++}else if(I.isPointLight){let X=e.get(I);if(X.color.copy(I.color).multiplyScalar(I.intensity),X.distance=I.distance,X.decay=I.decay,I.castShadow){let ie=I.shadow,O=t.get(I);O.shadowIntensity=ie.intensity,O.shadowBias=ie.bias,O.shadowNormalBias=ie.normalBias,O.shadowRadius=ie.radius,O.shadowMapSize=ie.mapSize,O.shadowCameraNear=ie.camera.near,O.shadowCameraFar=ie.camera.far,i.pointShadow[f]=O,i.pointShadowMap[f]=Y,i.pointShadowMatrix[f]=I.shadow.matrix,y++}i.point[f]=X,f++}else if(I.isHemisphereLight){let X=e.get(I);X.skyColor.copy(I.color).multiplyScalar(F),X.groundColor.copy(I.groundColor).multiplyScalar(F),i.hemi[m]=X,m++}}M>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ze.LTC_FLOAT_1,i.rectAreaLTC2=ze.LTC_FLOAT_2):(i.rectAreaLTC1=ze.LTC_HALF_1,i.rectAreaLTC2=ze.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let C=i.hash;(C.directionalLength!==p||C.pointLength!==f||C.spotLength!==E||C.rectAreaLength!==M||C.hemiLength!==m||C.numDirectionalShadows!==w||C.numPointShadows!==y||C.numSpotShadows!==x||C.numSpotMaps!==b||C.numLightProbes!==R)&&(i.directional.length=p,i.spot.length=E,i.rectArea.length=M,i.point.length=f,i.hemi.length=m,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=y,i.pointShadowMap.length=y,i.spotShadow.length=x,i.spotShadowMap.length=x,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=y,i.spotLightMatrix.length=x+b-v,i.spotLightMap.length=b,i.numSpotLightShadowsWithMaps=v,i.numLightProbes=R,C.directionalLength=p,C.pointLength=f,C.spotLength=E,C.rectAreaLength=M,C.hemiLength=m,C.numDirectionalShadows=w,C.numPointShadows=y,C.numSpotShadows=x,C.numSpotMaps=b,C.numLightProbes=R,i.version=aE++)}function l(c,h){let d=0,u=0,p=0,f=0,E=0,M=h.matrixWorldInverse;for(let m=0,w=c.length;m<w;m++){let y=c[m];if(y.isDirectionalLight){let x=i.directional[d];x.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(M),d++}else if(y.isSpotLight){let x=i.spot[p];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(M),x.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),x.direction.sub(s),x.direction.transformDirection(M),p++}else if(y.isRectAreaLight){let x=i.rectArea[f];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(M),o.identity(),r.copy(y.matrixWorld),r.premultiply(M),o.extractRotation(r),x.halfWidth.set(y.width*.5,0,0),x.halfHeight.set(0,y.height*.5,0),x.halfWidth.applyMatrix4(o),x.halfHeight.applyMatrix4(o),f++}else if(y.isPointLight){let x=i.point[u];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(M),u++}else if(y.isHemisphereLight){let x=i.hemi[E];x.direction.setFromMatrixPosition(y.matrixWorld),x.direction.transformDirection(M),E++}}}return{setup:a,setupView:l,state:i}}function hd(n){let e=new cE(n),t=[],i=[];function s(h){c.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function o(h){i.push(h)}function a(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function hE(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new hd(n),e.set(s,[a])):r>=o.length?(a=new hd(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var dE=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,uE=`uniform sampler2D shadow_pass;
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
}`;function fE(n,e,t){let i=new wi,s=new Be,r=new Be,o=new vt,a=new So({depthPacking:Rh}),l=new vo,c={},h=t.maxTextureSize,d={[ti]:jt,[jt]:ti,[Mt]:Mt},u=new $t({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Be},radius:{value:4}},vertexShader:dE,fragmentShader:uE}),p=u.clone();p.defines.HORIZONTAL_PASS=1;let f=new Gt;f.setAttribute("position",new Kt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let E=new g(f,u),M=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=vl;let m=this.type;this.render=function(v,R,C){if(M.enabled===!1||M.autoUpdate===!1&&M.needsUpdate===!1||v.length===0)return;let _=n.getRenderTarget(),T=n.getActiveCubeFace(),I=n.getActiveMipmapLevel(),G=n.state;G.setBlending(ri),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);let F=m!==Vn&&this.type===Vn,k=m===Vn&&this.type!==Vn;for(let Y=0,X=v.length;Y<X;Y++){let ie=v[Y],O=ie.shadow;if(O===void 0){console.warn("THREE.WebGLShadowMap:",ie,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;s.copy(O.mapSize);let re=O.getFrameExtents();if(s.multiply(re),r.copy(O.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/re.x),s.x=r.x*re.x,O.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/re.y),s.y=r.y*re.y,O.mapSize.y=r.y)),O.map===null||F===!0||k===!0){let be=this.type!==Vn?{minFilter:pn,magFilter:pn}:{};O.map!==null&&O.map.dispose(),O.map=new Cn(s.x,s.y,be),O.map.texture.name=ie.name+".shadowMap",O.camera.updateProjectionMatrix()}n.setRenderTarget(O.map),n.clear();let ee=O.getViewportCount();for(let be=0;be<ee;be++){let he=O.getViewport(be);o.set(r.x*he.x,r.y*he.y,r.x*he.z,r.y*he.w),G.viewport(o),O.updateMatrices(ie,be),i=O.getFrustum(),x(R,C,O.camera,ie,this.type)}O.isPointLightShadow!==!0&&this.type===Vn&&w(O,C),O.needsUpdate=!1}m=this.type,M.needsUpdate=!1,n.setRenderTarget(_,T,I)};function w(v,R){let C=e.update(E);u.defines.VSM_SAMPLES!==v.blurSamples&&(u.defines.VSM_SAMPLES=v.blurSamples,p.defines.VSM_SAMPLES=v.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),v.mapPass===null&&(v.mapPass=new Cn(s.x,s.y)),u.uniforms.shadow_pass.value=v.map.texture,u.uniforms.resolution.value=v.mapSize,u.uniforms.radius.value=v.radius,n.setRenderTarget(v.mapPass),n.clear(),n.renderBufferDirect(R,null,C,u,E,null),p.uniforms.shadow_pass.value=v.mapPass.texture,p.uniforms.resolution.value=v.mapSize,p.uniforms.radius.value=v.radius,n.setRenderTarget(v.map),n.clear(),n.renderBufferDirect(R,null,C,p,E,null)}function y(v,R,C,_){let T=null,I=C.isPointLight===!0?v.customDistanceMaterial:v.customDepthMaterial;if(I!==void 0)T=I;else if(T=C.isPointLight===!0?l:a,n.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){let G=T.uuid,F=R.uuid,k=c[G];k===void 0&&(k={},c[G]=k);let Y=k[F];Y===void 0&&(Y=T.clone(),k[F]=Y,R.addEventListener("dispose",b)),T=Y}if(T.visible=R.visible,T.wireframe=R.wireframe,_===Vn?T.side=R.shadowSide!==null?R.shadowSide:R.side:T.side=R.shadowSide!==null?R.shadowSide:d[R.side],T.alphaMap=R.alphaMap,T.alphaTest=R.alphaTest,T.map=R.map,T.clipShadows=R.clipShadows,T.clippingPlanes=R.clippingPlanes,T.clipIntersection=R.clipIntersection,T.displacementMap=R.displacementMap,T.displacementScale=R.displacementScale,T.displacementBias=R.displacementBias,T.wireframeLinewidth=R.wireframeLinewidth,T.linewidth=R.linewidth,C.isPointLight===!0&&T.isMeshDistanceMaterial===!0){let G=n.properties.get(T);G.light=C}return T}function x(v,R,C,_,T){if(v.visible===!1)return;if(v.layers.test(R.layers)&&(v.isMesh||v.isLine||v.isPoints)&&(v.castShadow||v.receiveShadow&&T===Vn)&&(!v.frustumCulled||i.intersectsObject(v))){v.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,v.matrixWorld);let F=e.update(v),k=v.material;if(Array.isArray(k)){let Y=F.groups;for(let X=0,ie=Y.length;X<ie;X++){let O=Y[X],re=k[O.materialIndex];if(re&&re.visible){let ee=y(v,re,_,T);v.onBeforeShadow(n,v,R,C,F,ee,O),n.renderBufferDirect(C,null,F,ee,v,O),v.onAfterShadow(n,v,R,C,F,ee,O)}}}else if(k.visible){let Y=y(v,k,_,T);v.onBeforeShadow(n,v,R,C,F,Y,null),n.renderBufferDirect(C,null,F,Y,v,null),v.onAfterShadow(n,v,R,C,F,Y,null)}}let G=v.children;for(let F=0,k=G.length;F<k;F++)x(G[F],R,C,_,T)}function b(v){v.target.removeEventListener("dispose",b);for(let C in c){let _=c[C],T=v.target.uuid;T in _&&(_[T].dispose(),delete _[T])}}}var pE={[Uo]:Fo,[No]:zo,[ko]:Vo,[Oi]:Oo,[Fo]:Uo,[zo]:No,[Vo]:ko,[Oo]:Oi};function mE(n,e){function t(){let U=!1,ye=new vt,Z=null,K=new vt(0,0,0,0);return{setMask:function(Se){Z!==Se&&!U&&(n.colorMask(Se,Se,Se,Se),Z=Se)},setLocked:function(Se){U=Se},setClear:function(Se,Re,Ue,ot,ft){ft===!0&&(Se*=ot,Re*=ot,Ue*=ot),ye.set(Se,Re,Ue,ot),K.equals(ye)===!1&&(n.clearColor(Se,Re,Ue,ot),K.copy(ye))},reset:function(){U=!1,Z=null,K.set(-1,0,0,0)}}}function i(){let U=!1,ye=!1,Z=null,K=null,Se=null;return{setReversed:function(Re){if(ye!==Re){let Ue=e.get("EXT_clip_control");Re?Ue.clipControlEXT(Ue.LOWER_LEFT_EXT,Ue.ZERO_TO_ONE_EXT):Ue.clipControlEXT(Ue.LOWER_LEFT_EXT,Ue.NEGATIVE_ONE_TO_ONE_EXT),ye=Re;let ot=Se;Se=null,this.setClear(ot)}},getReversed:function(){return ye},setTest:function(Re){Re?xe(n.DEPTH_TEST):J(n.DEPTH_TEST)},setMask:function(Re){Z!==Re&&!U&&(n.depthMask(Re),Z=Re)},setFunc:function(Re){if(ye&&(Re=pE[Re]),K!==Re){switch(Re){case Uo:n.depthFunc(n.NEVER);break;case Fo:n.depthFunc(n.ALWAYS);break;case No:n.depthFunc(n.LESS);break;case Oi:n.depthFunc(n.LEQUAL);break;case ko:n.depthFunc(n.EQUAL);break;case Oo:n.depthFunc(n.GEQUAL);break;case zo:n.depthFunc(n.GREATER);break;case Vo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}K=Re}},setLocked:function(Re){U=Re},setClear:function(Re){Se!==Re&&(ye&&(Re=1-Re),n.clearDepth(Re),Se=Re)},reset:function(){U=!1,Z=null,K=null,Se=null,ye=!1}}}function s(){let U=!1,ye=null,Z=null,K=null,Se=null,Re=null,Ue=null,ot=null,ft=null;return{setTest:function(it){U||(it?xe(n.STENCIL_TEST):J(n.STENCIL_TEST))},setMask:function(it){ye!==it&&!U&&(n.stencilMask(it),ye=it)},setFunc:function(it,Dt,Xt){(Z!==it||K!==Dt||Se!==Xt)&&(n.stencilFunc(it,Dt,Xt),Z=it,K=Dt,Se=Xt)},setOp:function(it,Dt,Xt){(Re!==it||Ue!==Dt||ot!==Xt)&&(n.stencilOp(it,Dt,Xt),Re=it,Ue=Dt,ot=Xt)},setLocked:function(it){U=it},setClear:function(it){ft!==it&&(n.clearStencil(it),ft=it)},reset:function(){U=!1,ye=null,Z=null,K=null,Se=null,Re=null,Ue=null,ot=null,ft=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},d={},u=new WeakMap,p=[],f=null,E=!1,M=null,m=null,w=null,y=null,x=null,b=null,v=null,R=new Ne(0,0,0),C=0,_=!1,T=null,I=null,G=null,F=null,k=null,Y=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),X=!1,ie=0,O=n.getParameter(n.VERSION);O.indexOf("WebGL")!==-1?(ie=parseFloat(/^WebGL (\d)/.exec(O)[1]),X=ie>=1):O.indexOf("OpenGL ES")!==-1&&(ie=parseFloat(/^OpenGL ES (\d)/.exec(O)[1]),X=ie>=2);let re=null,ee={},be=n.getParameter(n.SCISSOR_BOX),he=n.getParameter(n.VIEWPORT),ue=new vt().fromArray(be),$=new vt().fromArray(he);function ge(U,ye,Z,K){let Se=new Uint8Array(4),Re=n.createTexture();n.bindTexture(U,Re),n.texParameteri(U,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(U,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ue=0;Ue<Z;Ue++)U===n.TEXTURE_3D||U===n.TEXTURE_2D_ARRAY?n.texImage3D(ye,0,n.RGBA,1,1,K,0,n.RGBA,n.UNSIGNED_BYTE,Se):n.texImage2D(ye+Ue,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Se);return Re}let Ae={};Ae[n.TEXTURE_2D]=ge(n.TEXTURE_2D,n.TEXTURE_2D,1),Ae[n.TEXTURE_CUBE_MAP]=ge(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ae[n.TEXTURE_2D_ARRAY]=ge(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Ae[n.TEXTURE_3D]=ge(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),xe(n.DEPTH_TEST),o.setFunc(Oi),N(!1),Ge(Sl),xe(n.CULL_FACE),B(ri);function xe(U){h[U]!==!0&&(n.enable(U),h[U]=!0)}function J(U){h[U]!==!1&&(n.disable(U),h[U]=!1)}function Me(U,ye){return d[U]!==ye?(n.bindFramebuffer(U,ye),d[U]=ye,U===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=ye),U===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=ye),!0):!1}function j(U,ye){let Z=p,K=!1;if(U){Z=u.get(ye),Z===void 0&&(Z=[],u.set(ye,Z));let Se=U.textures;if(Z.length!==Se.length||Z[0]!==n.COLOR_ATTACHMENT0){for(let Re=0,Ue=Se.length;Re<Ue;Re++)Z[Re]=n.COLOR_ATTACHMENT0+Re;Z.length=Se.length,K=!0}}else Z[0]!==n.BACK&&(Z[0]=n.BACK,K=!0);K&&n.drawBuffers(Z)}function te(U){return f!==U?(n.useProgram(U),f=U,!0):!1}let ve={[Ti]:n.FUNC_ADD,[eh]:n.FUNC_SUBTRACT,[th]:n.FUNC_REVERSE_SUBTRACT};ve[nh]=n.MIN,ve[ih]=n.MAX;let de={[sh]:n.ZERO,[rh]:n.ONE,[oh]:n.SRC_COLOR,[ro]:n.SRC_ALPHA,[uh]:n.SRC_ALPHA_SATURATE,[hh]:n.DST_COLOR,[lh]:n.DST_ALPHA,[ah]:n.ONE_MINUS_SRC_COLOR,[oo]:n.ONE_MINUS_SRC_ALPHA,[dh]:n.ONE_MINUS_DST_COLOR,[ch]:n.ONE_MINUS_DST_ALPHA,[fh]:n.CONSTANT_COLOR,[ph]:n.ONE_MINUS_CONSTANT_COLOR,[mh]:n.CONSTANT_ALPHA,[Eh]:n.ONE_MINUS_CONSTANT_ALPHA};function B(U,ye,Z,K,Se,Re,Ue,ot,ft,it){if(U===ri){E===!0&&(J(n.BLEND),E=!1);return}if(E===!1&&(xe(n.BLEND),E=!0),U!==jc){if(U!==M||it!==_){if((m!==Ti||x!==Ti)&&(n.blendEquation(n.FUNC_ADD),m=Ti,x=Ti),it)switch(U){case ki:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Wn:n.blendFunc(n.ONE,n.ONE);break;case bl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Rl:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}else switch(U){case ki:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Wn:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case bl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Rl:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",U);break}w=null,y=null,b=null,v=null,R.set(0,0,0),C=0,M=U,_=it}return}Se=Se||ye,Re=Re||Z,Ue=Ue||K,(ye!==m||Se!==x)&&(n.blendEquationSeparate(ve[ye],ve[Se]),m=ye,x=Se),(Z!==w||K!==y||Re!==b||Ue!==v)&&(n.blendFuncSeparate(de[Z],de[K],de[Re],de[Ue]),w=Z,y=K,b=Re,v=Ue),(ot.equals(R)===!1||ft!==C)&&(n.blendColor(ot.r,ot.g,ot.b,ft),R.copy(ot),C=ft),M=U,_=!1}function we(U,ye){U.side===Mt?J(n.CULL_FACE):xe(n.CULL_FACE);let Z=U.side===jt;ye&&(Z=!Z),N(Z),U.blending===ki&&U.transparent===!1?B(ri):B(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),r.setMask(U.colorWrite);let K=U.stencilWrite;a.setTest(K),K&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),ae(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?xe(n.SAMPLE_ALPHA_TO_COVERAGE):J(n.SAMPLE_ALPHA_TO_COVERAGE)}function N(U){T!==U&&(U?n.frontFace(n.CW):n.frontFace(n.CCW),T=U)}function Ge(U){U!==$c?(xe(n.CULL_FACE),U!==I&&(U===Sl?n.cullFace(n.BACK):U===Qc?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):J(n.CULL_FACE),I=U}function P(U){U!==G&&(X&&n.lineWidth(U),G=U)}function ae(U,ye,Z){U?(xe(n.POLYGON_OFFSET_FILL),(F!==ye||k!==Z)&&(n.polygonOffset(ye,Z),F=ye,k=Z)):J(n.POLYGON_OFFSET_FILL)}function He(U){U?xe(n.SCISSOR_TEST):J(n.SCISSOR_TEST)}function L(U){U===void 0&&(U=n.TEXTURE0+Y-1),re!==U&&(n.activeTexture(U),re=U)}function S(U,ye,Z){Z===void 0&&(re===null?Z=n.TEXTURE0+Y-1:Z=re);let K=ee[Z];K===void 0&&(K={type:void 0,texture:void 0},ee[Z]=K),(K.type!==U||K.texture!==ye)&&(re!==Z&&(n.activeTexture(Z),re=Z),n.bindTexture(U,ye||Ae[U]),K.type=U,K.texture=ye)}function z(){let U=ee[re];U!==void 0&&U.type!==void 0&&(n.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function oe(){try{n.compressedTexImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function me(){try{n.compressedTexImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function fe(){try{n.texSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ve(){try{n.texSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Le(){try{n.compressedTexSubImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function pe(){try{n.compressedTexSubImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ze(){try{n.texStorage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function _e(){try{n.texStorage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function ke(){try{n.texImage2D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function Ke(){try{n.texImage3D(...arguments)}catch(U){console.error("THREE.WebGLState:",U)}}function je(U){ue.equals(U)===!1&&(n.scissor(U.x,U.y,U.z,U.w),ue.copy(U))}function Oe(U){$.equals(U)===!1&&(n.viewport(U.x,U.y,U.z,U.w),$.copy(U))}function Pe(U,ye){let Z=c.get(ye);Z===void 0&&(Z=new WeakMap,c.set(ye,Z));let K=Z.get(U);K===void 0&&(K=n.getUniformBlockIndex(ye,U.name),Z.set(U,K))}function Te(U,ye){let K=c.get(ye).get(U);l.get(ye)!==K&&(n.uniformBlockBinding(ye,K,U.__bindingPointIndex),l.set(ye,K))}function Ie(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},re=null,ee={},d={},u=new WeakMap,p=[],f=null,E=!1,M=null,m=null,w=null,y=null,x=null,b=null,v=null,R=new Ne(0,0,0),C=0,_=!1,T=null,I=null,G=null,F=null,k=null,ue.set(0,0,n.canvas.width,n.canvas.height),$.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:xe,disable:J,bindFramebuffer:Me,drawBuffers:j,useProgram:te,setBlending:B,setMaterial:we,setFlipSided:N,setCullFace:Ge,setLineWidth:P,setPolygonOffset:ae,setScissorTest:He,activeTexture:L,bindTexture:S,unbindTexture:z,compressedTexImage2D:oe,compressedTexImage3D:me,texImage2D:ke,texImage3D:Ke,updateUBOMapping:Pe,uniformBlockBinding:Te,texStorage2D:Ze,texStorage3D:_e,texSubImage2D:fe,texSubImage3D:Ve,compressedTexSubImage2D:Le,compressedTexSubImage3D:pe,scissor:je,viewport:Oe,reset:Ie}}function EE(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Be,h=new WeakMap,d,u=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(L,S){return p?new OffscreenCanvas(L,S):js("canvas")}function E(L,S,z){let oe=1,me=He(L);if((me.width>z||me.height>z)&&(oe=z/Math.max(me.width,me.height)),oe<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){let fe=Math.floor(oe*me.width),Ve=Math.floor(oe*me.height);d===void 0&&(d=f(fe,Ve));let Le=S?f(fe,Ve):d;return Le.width=fe,Le.height=Ve,Le.getContext("2d").drawImage(L,0,0,fe,Ve),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+me.width+"x"+me.height+") to ("+fe+"x"+Ve+")."),Le}else return"data"in L&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+me.width+"x"+me.height+")."),L;return L}function M(L){return L.generateMipmaps}function m(L){n.generateMipmap(L)}function w(L){return L.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?n.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function y(L,S,z,oe,me=!1){if(L!==null){if(n[L]!==void 0)return n[L];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let fe=S;if(S===n.RED&&(z===n.FLOAT&&(fe=n.R32F),z===n.HALF_FLOAT&&(fe=n.R16F),z===n.UNSIGNED_BYTE&&(fe=n.R8)),S===n.RED_INTEGER&&(z===n.UNSIGNED_BYTE&&(fe=n.R8UI),z===n.UNSIGNED_SHORT&&(fe=n.R16UI),z===n.UNSIGNED_INT&&(fe=n.R32UI),z===n.BYTE&&(fe=n.R8I),z===n.SHORT&&(fe=n.R16I),z===n.INT&&(fe=n.R32I)),S===n.RG&&(z===n.FLOAT&&(fe=n.RG32F),z===n.HALF_FLOAT&&(fe=n.RG16F),z===n.UNSIGNED_BYTE&&(fe=n.RG8)),S===n.RG_INTEGER&&(z===n.UNSIGNED_BYTE&&(fe=n.RG8UI),z===n.UNSIGNED_SHORT&&(fe=n.RG16UI),z===n.UNSIGNED_INT&&(fe=n.RG32UI),z===n.BYTE&&(fe=n.RG8I),z===n.SHORT&&(fe=n.RG16I),z===n.INT&&(fe=n.RG32I)),S===n.RGB_INTEGER&&(z===n.UNSIGNED_BYTE&&(fe=n.RGB8UI),z===n.UNSIGNED_SHORT&&(fe=n.RGB16UI),z===n.UNSIGNED_INT&&(fe=n.RGB32UI),z===n.BYTE&&(fe=n.RGB8I),z===n.SHORT&&(fe=n.RGB16I),z===n.INT&&(fe=n.RGB32I)),S===n.RGBA_INTEGER&&(z===n.UNSIGNED_BYTE&&(fe=n.RGBA8UI),z===n.UNSIGNED_SHORT&&(fe=n.RGBA16UI),z===n.UNSIGNED_INT&&(fe=n.RGBA32UI),z===n.BYTE&&(fe=n.RGBA8I),z===n.SHORT&&(fe=n.RGBA16I),z===n.INT&&(fe=n.RGBA32I)),S===n.RGB&&z===n.UNSIGNED_INT_5_9_9_9_REV&&(fe=n.RGB9_E5),S===n.RGBA){let Ve=me?$s:wt.getTransfer(oe);z===n.FLOAT&&(fe=n.RGBA32F),z===n.HALF_FLOAT&&(fe=n.RGBA16F),z===n.UNSIGNED_BYTE&&(fe=Ve===Rt?n.SRGB8_ALPHA8:n.RGBA8),z===n.UNSIGNED_SHORT_4_4_4_4&&(fe=n.RGBA4),z===n.UNSIGNED_SHORT_5_5_5_1&&(fe=n.RGB5_A1)}return(fe===n.R16F||fe===n.R32F||fe===n.RG16F||fe===n.RG32F||fe===n.RGBA16F||fe===n.RGBA32F)&&e.get("EXT_color_buffer_float"),fe}function x(L,S){let z;return L?S===null||S===Ri||S===Ds?z=n.DEPTH24_STENCIL8:S===Yn?z=n.DEPTH32F_STENCIL8:S===Is&&(z=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===Ri||S===Ds?z=n.DEPTH_COMPONENT24:S===Yn?z=n.DEPTH_COMPONENT32F:S===Is&&(z=n.DEPTH_COMPONENT16),z}function b(L,S){return M(L)===!0||L.isFramebufferTexture&&L.minFilter!==pn&&L.minFilter!==Gn?Math.log2(Math.max(S.width,S.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?S.mipmaps.length:1}function v(L){let S=L.target;S.removeEventListener("dispose",v),C(S),S.isVideoTexture&&h.delete(S)}function R(L){let S=L.target;S.removeEventListener("dispose",R),T(S)}function C(L){let S=i.get(L);if(S.__webglInit===void 0)return;let z=L.source,oe=u.get(z);if(oe){let me=oe[S.__cacheKey];me.usedTimes--,me.usedTimes===0&&_(L),Object.keys(oe).length===0&&u.delete(z)}i.remove(L)}function _(L){let S=i.get(L);n.deleteTexture(S.__webglTexture);let z=L.source,oe=u.get(z);delete oe[S.__cacheKey],o.memory.textures--}function T(L){let S=i.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),i.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let oe=0;oe<6;oe++){if(Array.isArray(S.__webglFramebuffer[oe]))for(let me=0;me<S.__webglFramebuffer[oe].length;me++)n.deleteFramebuffer(S.__webglFramebuffer[oe][me]);else n.deleteFramebuffer(S.__webglFramebuffer[oe]);S.__webglDepthbuffer&&n.deleteRenderbuffer(S.__webglDepthbuffer[oe])}else{if(Array.isArray(S.__webglFramebuffer))for(let oe=0;oe<S.__webglFramebuffer.length;oe++)n.deleteFramebuffer(S.__webglFramebuffer[oe]);else n.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&n.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&n.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let oe=0;oe<S.__webglColorRenderbuffer.length;oe++)S.__webglColorRenderbuffer[oe]&&n.deleteRenderbuffer(S.__webglColorRenderbuffer[oe]);S.__webglDepthRenderbuffer&&n.deleteRenderbuffer(S.__webglDepthRenderbuffer)}let z=L.textures;for(let oe=0,me=z.length;oe<me;oe++){let fe=i.get(z[oe]);fe.__webglTexture&&(n.deleteTexture(fe.__webglTexture),o.memory.textures--),i.remove(z[oe])}i.remove(L)}let I=0;function G(){I=0}function F(){let L=I;return L>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+L+" texture units while this GPU supports only "+s.maxTextures),I+=1,L}function k(L){let S=[];return S.push(L.wrapS),S.push(L.wrapT),S.push(L.wrapR||0),S.push(L.magFilter),S.push(L.minFilter),S.push(L.anisotropy),S.push(L.internalFormat),S.push(L.format),S.push(L.type),S.push(L.generateMipmaps),S.push(L.premultiplyAlpha),S.push(L.flipY),S.push(L.unpackAlignment),S.push(L.colorSpace),S.join()}function Y(L,S){let z=i.get(L);if(L.isVideoTexture&&P(L),L.isRenderTargetTexture===!1&&L.version>0&&z.__version!==L.version){let oe=L.image;if(oe===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(oe.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(z,L,S);return}}t.bindTexture(n.TEXTURE_2D,z.__webglTexture,n.TEXTURE0+S)}function X(L,S){let z=i.get(L);if(L.version>0&&z.__version!==L.version){$(z,L,S);return}t.bindTexture(n.TEXTURE_2D_ARRAY,z.__webglTexture,n.TEXTURE0+S)}function ie(L,S){let z=i.get(L);if(L.version>0&&z.__version!==L.version){$(z,L,S);return}t.bindTexture(n.TEXTURE_3D,z.__webglTexture,n.TEXTURE0+S)}function O(L,S){let z=i.get(L);if(L.version>0&&z.__version!==L.version){ge(z,L,S);return}t.bindTexture(n.TEXTURE_CUBE_MAP,z.__webglTexture,n.TEXTURE0+S)}let re={[ni]:n.REPEAT,[xi]:n.CLAMP_TO_EDGE,[ao]:n.MIRRORED_REPEAT},ee={[pn]:n.NEAREST,[vh]:n.NEAREST_MIPMAP_NEAREST,[Tr]:n.NEAREST_MIPMAP_LINEAR,[Gn]:n.LINEAR,[qo]:n.LINEAR_MIPMAP_NEAREST,[bi]:n.LINEAR_MIPMAP_LINEAR},be={[Ah]:n.NEVER,[Bh]:n.ALWAYS,[Hh]:n.LESS,[Ol]:n.LEQUAL,[Ph]:n.EQUAL,[Lh]:n.GEQUAL,[Ih]:n.GREATER,[Dh]:n.NOTEQUAL};function he(L,S){if(S.type===Yn&&e.has("OES_texture_float_linear")===!1&&(S.magFilter===Gn||S.magFilter===qo||S.magFilter===Tr||S.magFilter===bi||S.minFilter===Gn||S.minFilter===qo||S.minFilter===Tr||S.minFilter===bi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(L,n.TEXTURE_WRAP_S,re[S.wrapS]),n.texParameteri(L,n.TEXTURE_WRAP_T,re[S.wrapT]),(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)&&n.texParameteri(L,n.TEXTURE_WRAP_R,re[S.wrapR]),n.texParameteri(L,n.TEXTURE_MAG_FILTER,ee[S.magFilter]),n.texParameteri(L,n.TEXTURE_MIN_FILTER,ee[S.minFilter]),S.compareFunction&&(n.texParameteri(L,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(L,n.TEXTURE_COMPARE_FUNC,be[S.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===pn||S.minFilter!==Tr&&S.minFilter!==bi||S.type===Yn&&e.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){let z=e.get("EXT_texture_filter_anisotropic");n.texParameterf(L,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function ue(L,S){let z=!1;L.__webglInit===void 0&&(L.__webglInit=!0,S.addEventListener("dispose",v));let oe=S.source,me=u.get(oe);me===void 0&&(me={},u.set(oe,me));let fe=k(S);if(fe!==L.__cacheKey){me[fe]===void 0&&(me[fe]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,z=!0),me[fe].usedTimes++;let Ve=me[L.__cacheKey];Ve!==void 0&&(me[L.__cacheKey].usedTimes--,Ve.usedTimes===0&&_(S)),L.__cacheKey=fe,L.__webglTexture=me[fe].texture}return z}function $(L,S,z){let oe=n.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(oe=n.TEXTURE_2D_ARRAY),S.isData3DTexture&&(oe=n.TEXTURE_3D);let me=ue(L,S),fe=S.source;t.bindTexture(oe,L.__webglTexture,n.TEXTURE0+z);let Ve=i.get(fe);if(fe.version!==Ve.__version||me===!0){t.activeTexture(n.TEXTURE0+z);let Le=wt.getPrimaries(wt.workingColorSpace),pe=S.colorSpace===ai?null:wt.getPrimaries(S.colorSpace),Ze=S.colorSpace===ai||Le===pe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ze);let _e=E(S.image,!1,s.maxTextureSize);_e=ae(S,_e);let ke=r.convert(S.format,S.colorSpace),Ke=r.convert(S.type),je=y(S.internalFormat,ke,Ke,S.colorSpace,S.isVideoTexture);he(oe,S);let Oe,Pe=S.mipmaps,Te=S.isVideoTexture!==!0,Ie=Ve.__version===void 0||me===!0,U=fe.dataReady,ye=b(S,_e);if(S.isDepthTexture)je=x(S.format===Ls,S.type),Ie&&(Te?t.texStorage2D(n.TEXTURE_2D,1,je,_e.width,_e.height):t.texImage2D(n.TEXTURE_2D,0,je,_e.width,_e.height,0,ke,Ke,null));else if(S.isDataTexture)if(Pe.length>0){Te&&Ie&&t.texStorage2D(n.TEXTURE_2D,ye,je,Pe[0].width,Pe[0].height);for(let Z=0,K=Pe.length;Z<K;Z++)Oe=Pe[Z],Te?U&&t.texSubImage2D(n.TEXTURE_2D,Z,0,0,Oe.width,Oe.height,ke,Ke,Oe.data):t.texImage2D(n.TEXTURE_2D,Z,je,Oe.width,Oe.height,0,ke,Ke,Oe.data);S.generateMipmaps=!1}else Te?(Ie&&t.texStorage2D(n.TEXTURE_2D,ye,je,_e.width,_e.height),U&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,_e.width,_e.height,ke,Ke,_e.data)):t.texImage2D(n.TEXTURE_2D,0,je,_e.width,_e.height,0,ke,Ke,_e.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Te&&Ie&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ye,je,Pe[0].width,Pe[0].height,_e.depth);for(let Z=0,K=Pe.length;Z<K;Z++)if(Oe=Pe[Z],S.format!==En)if(ke!==null)if(Te){if(U)if(S.layerUpdates.size>0){let Se=Jl(Oe.width,Oe.height,S.format,S.type);for(let Re of S.layerUpdates){let Ue=Oe.data.subarray(Re*Se/Oe.data.BYTES_PER_ELEMENT,(Re+1)*Se/Oe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Z,0,0,Re,Oe.width,Oe.height,1,ke,Ue)}S.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Z,0,0,0,Oe.width,Oe.height,_e.depth,ke,Oe.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Z,je,Oe.width,Oe.height,_e.depth,0,Oe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Te?U&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Z,0,0,0,Oe.width,Oe.height,_e.depth,ke,Ke,Oe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Z,je,Oe.width,Oe.height,_e.depth,0,ke,Ke,Oe.data)}else{Te&&Ie&&t.texStorage2D(n.TEXTURE_2D,ye,je,Pe[0].width,Pe[0].height);for(let Z=0,K=Pe.length;Z<K;Z++)Oe=Pe[Z],S.format!==En?ke!==null?Te?U&&t.compressedTexSubImage2D(n.TEXTURE_2D,Z,0,0,Oe.width,Oe.height,ke,Oe.data):t.compressedTexImage2D(n.TEXTURE_2D,Z,je,Oe.width,Oe.height,0,Oe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Te?U&&t.texSubImage2D(n.TEXTURE_2D,Z,0,0,Oe.width,Oe.height,ke,Ke,Oe.data):t.texImage2D(n.TEXTURE_2D,Z,je,Oe.width,Oe.height,0,ke,Ke,Oe.data)}else if(S.isDataArrayTexture)if(Te){if(Ie&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ye,je,_e.width,_e.height,_e.depth),U)if(S.layerUpdates.size>0){let Z=Jl(_e.width,_e.height,S.format,S.type);for(let K of S.layerUpdates){let Se=_e.data.subarray(K*Z/_e.data.BYTES_PER_ELEMENT,(K+1)*Z/_e.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,K,_e.width,_e.height,1,ke,Ke,Se)}S.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,_e.width,_e.height,_e.depth,ke,Ke,_e.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,je,_e.width,_e.height,_e.depth,0,ke,Ke,_e.data);else if(S.isData3DTexture)Te?(Ie&&t.texStorage3D(n.TEXTURE_3D,ye,je,_e.width,_e.height,_e.depth),U&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,_e.width,_e.height,_e.depth,ke,Ke,_e.data)):t.texImage3D(n.TEXTURE_3D,0,je,_e.width,_e.height,_e.depth,0,ke,Ke,_e.data);else if(S.isFramebufferTexture){if(Ie)if(Te)t.texStorage2D(n.TEXTURE_2D,ye,je,_e.width,_e.height);else{let Z=_e.width,K=_e.height;for(let Se=0;Se<ye;Se++)t.texImage2D(n.TEXTURE_2D,Se,je,Z,K,0,ke,Ke,null),Z>>=1,K>>=1}}else if(Pe.length>0){if(Te&&Ie){let Z=He(Pe[0]);t.texStorage2D(n.TEXTURE_2D,ye,je,Z.width,Z.height)}for(let Z=0,K=Pe.length;Z<K;Z++)Oe=Pe[Z],Te?U&&t.texSubImage2D(n.TEXTURE_2D,Z,0,0,ke,Ke,Oe):t.texImage2D(n.TEXTURE_2D,Z,je,ke,Ke,Oe);S.generateMipmaps=!1}else if(Te){if(Ie){let Z=He(_e);t.texStorage2D(n.TEXTURE_2D,ye,je,Z.width,Z.height)}U&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ke,Ke,_e)}else t.texImage2D(n.TEXTURE_2D,0,je,ke,Ke,_e);M(S)&&m(oe),Ve.__version=fe.version,S.onUpdate&&S.onUpdate(S)}L.__version=S.version}function ge(L,S,z){if(S.image.length!==6)return;let oe=ue(L,S),me=S.source;t.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture,n.TEXTURE0+z);let fe=i.get(me);if(me.version!==fe.__version||oe===!0){t.activeTexture(n.TEXTURE0+z);let Ve=wt.getPrimaries(wt.workingColorSpace),Le=S.colorSpace===ai?null:wt.getPrimaries(S.colorSpace),pe=S.colorSpace===ai||Ve===Le?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,pe);let Ze=S.isCompressedTexture||S.image[0].isCompressedTexture,_e=S.image[0]&&S.image[0].isDataTexture,ke=[];for(let K=0;K<6;K++)!Ze&&!_e?ke[K]=E(S.image[K],!0,s.maxCubemapSize):ke[K]=_e?S.image[K].image:S.image[K],ke[K]=ae(S,ke[K]);let Ke=ke[0],je=r.convert(S.format,S.colorSpace),Oe=r.convert(S.type),Pe=y(S.internalFormat,je,Oe,S.colorSpace),Te=S.isVideoTexture!==!0,Ie=fe.__version===void 0||oe===!0,U=me.dataReady,ye=b(S,Ke);he(n.TEXTURE_CUBE_MAP,S);let Z;if(Ze){Te&&Ie&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ye,Pe,Ke.width,Ke.height);for(let K=0;K<6;K++){Z=ke[K].mipmaps;for(let Se=0;Se<Z.length;Se++){let Re=Z[Se];S.format!==En?je!==null?Te?U&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se,0,0,Re.width,Re.height,je,Re.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se,Pe,Re.width,Re.height,0,Re.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Te?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se,0,0,Re.width,Re.height,je,Oe,Re.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se,Pe,Re.width,Re.height,0,je,Oe,Re.data)}}}else{if(Z=S.mipmaps,Te&&Ie){Z.length>0&&ye++;let K=He(ke[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ye,Pe,K.width,K.height)}for(let K=0;K<6;K++)if(_e){Te?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,ke[K].width,ke[K].height,je,Oe,ke[K].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Pe,ke[K].width,ke[K].height,0,je,Oe,ke[K].data);for(let Se=0;Se<Z.length;Se++){let Ue=Z[Se].image[K].image;Te?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se+1,0,0,Ue.width,Ue.height,je,Oe,Ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se+1,Pe,Ue.width,Ue.height,0,je,Oe,Ue.data)}}else{Te?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,je,Oe,ke[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Pe,je,Oe,ke[K]);for(let Se=0;Se<Z.length;Se++){let Re=Z[Se];Te?U&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se+1,0,0,je,Oe,Re.image[K]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+K,Se+1,Pe,je,Oe,Re.image[K])}}}M(S)&&m(n.TEXTURE_CUBE_MAP),fe.__version=me.version,S.onUpdate&&S.onUpdate(S)}L.__version=S.version}function Ae(L,S,z,oe,me,fe){let Ve=r.convert(z.format,z.colorSpace),Le=r.convert(z.type),pe=y(z.internalFormat,Ve,Le,z.colorSpace),Ze=i.get(S),_e=i.get(z);if(_e.__renderTarget=S,!Ze.__hasExternalTextures){let ke=Math.max(1,S.width>>fe),Ke=Math.max(1,S.height>>fe);me===n.TEXTURE_3D||me===n.TEXTURE_2D_ARRAY?t.texImage3D(me,fe,pe,ke,Ke,S.depth,0,Ve,Le,null):t.texImage2D(me,fe,pe,ke,Ke,0,Ve,Le,null)}t.bindFramebuffer(n.FRAMEBUFFER,L),Ge(S)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,oe,me,_e.__webglTexture,0,N(S)):(me===n.TEXTURE_2D||me>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&me<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,oe,me,_e.__webglTexture,fe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function xe(L,S,z){if(n.bindRenderbuffer(n.RENDERBUFFER,L),S.depthBuffer){let oe=S.depthTexture,me=oe&&oe.isDepthTexture?oe.type:null,fe=x(S.stencilBuffer,me),Ve=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Le=N(S);Ge(S)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Le,fe,S.width,S.height):z?n.renderbufferStorageMultisample(n.RENDERBUFFER,Le,fe,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,fe,S.width,S.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ve,n.RENDERBUFFER,L)}else{let oe=S.textures;for(let me=0;me<oe.length;me++){let fe=oe[me],Ve=r.convert(fe.format,fe.colorSpace),Le=r.convert(fe.type),pe=y(fe.internalFormat,Ve,Le,fe.colorSpace),Ze=N(S);z&&Ge(S)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ze,pe,S.width,S.height):Ge(S)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ze,pe,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,pe,S.width,S.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function J(L,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,L),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let oe=i.get(S.depthTexture);oe.__renderTarget=S,(!oe.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),Y(S.depthTexture,0);let me=oe.__webglTexture,fe=N(S);if(S.depthTexture.format===_s)Ge(S)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,me,0,fe):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,me,0);else if(S.depthTexture.format===Ls)Ge(S)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,me,0,fe):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,me,0);else throw new Error("Unknown depthTexture format")}function Me(L){let S=i.get(L),z=L.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==L.depthTexture){let oe=L.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),oe){let me=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,oe.removeEventListener("dispose",me)};oe.addEventListener("dispose",me),S.__depthDisposeCallback=me}S.__boundDepthTexture=oe}if(L.depthTexture&&!S.__autoAllocateDepthBuffer){if(z)throw new Error("target.depthTexture not supported in Cube render targets");J(S.__webglFramebuffer,L)}else if(z){S.__webglDepthbuffer=[];for(let oe=0;oe<6;oe++)if(t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer[oe]),S.__webglDepthbuffer[oe]===void 0)S.__webglDepthbuffer[oe]=n.createRenderbuffer(),xe(S.__webglDepthbuffer[oe],L,!1);else{let me=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,fe=S.__webglDepthbuffer[oe];n.bindRenderbuffer(n.RENDERBUFFER,fe),n.framebufferRenderbuffer(n.FRAMEBUFFER,me,n.RENDERBUFFER,fe)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=n.createRenderbuffer(),xe(S.__webglDepthbuffer,L,!1);else{let oe=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,me=S.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,me),n.framebufferRenderbuffer(n.FRAMEBUFFER,oe,n.RENDERBUFFER,me)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function j(L,S,z){let oe=i.get(L);S!==void 0&&Ae(oe.__webglFramebuffer,L,L.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),z!==void 0&&Me(L)}function te(L){let S=L.texture,z=i.get(L),oe=i.get(S);L.addEventListener("dispose",R);let me=L.textures,fe=L.isWebGLCubeRenderTarget===!0,Ve=me.length>1;if(Ve||(oe.__webglTexture===void 0&&(oe.__webglTexture=n.createTexture()),oe.__version=S.version,o.memory.textures++),fe){z.__webglFramebuffer=[];for(let Le=0;Le<6;Le++)if(S.mipmaps&&S.mipmaps.length>0){z.__webglFramebuffer[Le]=[];for(let pe=0;pe<S.mipmaps.length;pe++)z.__webglFramebuffer[Le][pe]=n.createFramebuffer()}else z.__webglFramebuffer[Le]=n.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){z.__webglFramebuffer=[];for(let Le=0;Le<S.mipmaps.length;Le++)z.__webglFramebuffer[Le]=n.createFramebuffer()}else z.__webglFramebuffer=n.createFramebuffer();if(Ve)for(let Le=0,pe=me.length;Le<pe;Le++){let Ze=i.get(me[Le]);Ze.__webglTexture===void 0&&(Ze.__webglTexture=n.createTexture(),o.memory.textures++)}if(L.samples>0&&Ge(L)===!1){z.__webglMultisampledFramebuffer=n.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let Le=0;Le<me.length;Le++){let pe=me[Le];z.__webglColorRenderbuffer[Le]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,z.__webglColorRenderbuffer[Le]);let Ze=r.convert(pe.format,pe.colorSpace),_e=r.convert(pe.type),ke=y(pe.internalFormat,Ze,_e,pe.colorSpace,L.isXRRenderTarget===!0),Ke=N(L);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ke,ke,L.width,L.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Le,n.RENDERBUFFER,z.__webglColorRenderbuffer[Le])}n.bindRenderbuffer(n.RENDERBUFFER,null),L.depthBuffer&&(z.__webglDepthRenderbuffer=n.createRenderbuffer(),xe(z.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(fe){t.bindTexture(n.TEXTURE_CUBE_MAP,oe.__webglTexture),he(n.TEXTURE_CUBE_MAP,S);for(let Le=0;Le<6;Le++)if(S.mipmaps&&S.mipmaps.length>0)for(let pe=0;pe<S.mipmaps.length;pe++)Ae(z.__webglFramebuffer[Le][pe],L,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Le,pe);else Ae(z.__webglFramebuffer[Le],L,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Le,0);M(S)&&m(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ve){for(let Le=0,pe=me.length;Le<pe;Le++){let Ze=me[Le],_e=i.get(Ze);t.bindTexture(n.TEXTURE_2D,_e.__webglTexture),he(n.TEXTURE_2D,Ze),Ae(z.__webglFramebuffer,L,Ze,n.COLOR_ATTACHMENT0+Le,n.TEXTURE_2D,0),M(Ze)&&m(n.TEXTURE_2D)}t.unbindTexture()}else{let Le=n.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(Le=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Le,oe.__webglTexture),he(Le,S),S.mipmaps&&S.mipmaps.length>0)for(let pe=0;pe<S.mipmaps.length;pe++)Ae(z.__webglFramebuffer[pe],L,S,n.COLOR_ATTACHMENT0,Le,pe);else Ae(z.__webglFramebuffer,L,S,n.COLOR_ATTACHMENT0,Le,0);M(S)&&m(Le),t.unbindTexture()}L.depthBuffer&&Me(L)}function ve(L){let S=L.textures;for(let z=0,oe=S.length;z<oe;z++){let me=S[z];if(M(me)){let fe=w(L),Ve=i.get(me).__webglTexture;t.bindTexture(fe,Ve),m(fe),t.unbindTexture()}}}let de=[],B=[];function we(L){if(L.samples>0){if(Ge(L)===!1){let S=L.textures,z=L.width,oe=L.height,me=n.COLOR_BUFFER_BIT,fe=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ve=i.get(L),Le=S.length>1;if(Le)for(let pe=0;pe<S.length;pe++)t.bindFramebuffer(n.FRAMEBUFFER,Ve.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ve.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ve.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ve.__webglFramebuffer);for(let pe=0;pe<S.length;pe++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(me|=n.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(me|=n.STENCIL_BUFFER_BIT)),Le){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ve.__webglColorRenderbuffer[pe]);let Ze=i.get(S[pe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ze,0)}n.blitFramebuffer(0,0,z,oe,0,0,z,oe,me,n.NEAREST),l===!0&&(de.length=0,B.length=0,de.push(n.COLOR_ATTACHMENT0+pe),L.depthBuffer&&L.resolveDepthBuffer===!1&&(de.push(fe),B.push(fe),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,B)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,de))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Le)for(let pe=0;pe<S.length;pe++){t.bindFramebuffer(n.FRAMEBUFFER,Ve.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,Ve.__webglColorRenderbuffer[pe]);let Ze=i.get(S[pe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ve.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,Ze,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ve.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.resolveDepthBuffer===!1&&l){let S=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[S])}}}function N(L){return Math.min(s.maxSamples,L.samples)}function Ge(L){let S=i.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function P(L){let S=o.render.frame;h.get(L)!==S&&(h.set(L,S),L.update())}function ae(L,S){let z=L.colorSpace,oe=L.format,me=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||z!==zi&&z!==ai&&(wt.getTransfer(z)===Rt?(oe!==En||me!==Xn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",z)),S}function He(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=F,this.resetTextureUnits=G,this.setTexture2D=Y,this.setTexture2DArray=X,this.setTexture3D=ie,this.setTextureCube=O,this.rebindTextures=j,this.setupRenderTarget=te,this.updateRenderTargetMipmap=ve,this.updateMultisampleRenderTarget=we,this.setupDepthRenderbuffer=Me,this.setupFrameBufferTexture=Ae,this.useMultisampledRTT=Ge}function gE(n,e){function t(i,s=ai){let r,o=wt.getTransfer(s);if(i===Xn)return n.UNSIGNED_BYTE;if(i===Jo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Ko)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Il)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Hl)return n.BYTE;if(i===Pl)return n.SHORT;if(i===Is)return n.UNSIGNED_SHORT;if(i===Zo)return n.INT;if(i===Ri)return n.UNSIGNED_INT;if(i===Yn)return n.FLOAT;if(i===Ci)return n.HALF_FLOAT;if(i===Dl)return n.ALPHA;if(i===Ll)return n.RGB;if(i===En)return n.RGBA;if(i===Bl)return n.LUMINANCE;if(i===Gl)return n.LUMINANCE_ALPHA;if(i===_s)return n.DEPTH_COMPONENT;if(i===Ls)return n.DEPTH_STENCIL;if(i===Ul)return n.RED;if(i===$o)return n.RED_INTEGER;if(i===Fl)return n.RG;if(i===Qo)return n.RG_INTEGER;if(i===jo)return n.RGBA_INTEGER;if(i===wr||i===_r||i===Sr||i===vr)if(o===Rt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===wr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===_r)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Sr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===vr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===wr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===_r)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Sr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===vr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ea||i===ta||i===na||i===ia)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===ea)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ta)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===na)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ia)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===sa||i===ra||i===oa)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===sa||i===ra)return o===Rt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===oa)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===aa||i===la||i===ca||i===ha||i===da||i===ua||i===fa||i===pa||i===ma||i===Ea||i===ga||i===Ma||i===ya||i===xa)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===aa)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===la)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===ca)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ha)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===da)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===ua)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===fa)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===pa)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ma)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ea)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ga)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ma)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===ya)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===xa)return o===Rt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===br||i===Ta||i===wa)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===br)return o===Rt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ta)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===wa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Nl||i===_a||i===Sa||i===va)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===br)return r.COMPRESSED_RED_RGTC1_EXT;if(i===_a)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Sa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===va)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Ds?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var ME=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,yE=`
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

}`,lc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let s=new cn,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==i.depthNear||t.depthFar!==i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new $t({vertexShader:ME,fragmentShader:yE,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new g(new rt(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},cc=class extends ii{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,d=null,u=null,p=null,f=null,E=new lc,M=t.getContextAttributes(),m=null,w=null,y=[],x=[],b=new Be,v=null,R=new Lt;R.viewport=new vt;let C=new Lt;C.viewport=new vt;let _=[R,C],T=new Bo,I=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ge=y[$];return ge===void 0&&(ge=new bs,y[$]=ge),ge.getTargetRaySpace()},this.getControllerGrip=function($){let ge=y[$];return ge===void 0&&(ge=new bs,y[$]=ge),ge.getGripSpace()},this.getHand=function($){let ge=y[$];return ge===void 0&&(ge=new bs,y[$]=ge),ge.getHandSpace()};function F($){let ge=x.indexOf($.inputSource);if(ge===-1)return;let Ae=y[ge];Ae!==void 0&&(Ae.update($.inputSource,$.frame,c||o),Ae.dispatchEvent({type:$.type,data:$.inputSource}))}function k(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",Y);for(let $=0;$<y.length;$++){let ge=x[$];ge!==null&&(x[$]=null,y[$].disconnect(ge))}I=null,G=null,E.reset(),e.setRenderTarget(m),p=null,u=null,d=null,s=null,w=null,ue.stop(),i.isPresenting=!1,e.setPixelRatio(v),e.setSize(b.width,b.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){a=$,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return d},this.getFrame=function(){return f},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(m=e.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",k),s.addEventListener("inputsourceschange",Y),M.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(b),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ae=null,xe=null,J=null;M.depth&&(J=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Ae=M.stencil?Ls:_s,xe=M.stencil?Ds:Ri);let Me={colorFormat:t.RGBA8,depthFormat:J,scaleFactor:r};d=new XRWebGLBinding(s,t),u=d.createProjectionLayer(Me),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),w=new Cn(u.textureWidth,u.textureHeight,{format:En,type:Xn,depthTexture:new lr(u.textureWidth,u.textureHeight,xe,void 0,void 0,void 0,void 0,void 0,void 0,Ae),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let Ae={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,t,Ae),s.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),w=new Cn(p.framebufferWidth,p.framebufferHeight,{format:En,type:Xn,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),ue.setContext(s),ue.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return E.getDepthTexture()};function Y($){for(let ge=0;ge<$.removed.length;ge++){let Ae=$.removed[ge],xe=x.indexOf(Ae);xe>=0&&(x[xe]=null,y[xe].disconnect(Ae))}for(let ge=0;ge<$.added.length;ge++){let Ae=$.added[ge],xe=x.indexOf(Ae);if(xe===-1){for(let Me=0;Me<y.length;Me++)if(Me>=x.length){x.push(Ae),xe=Me;break}else if(x[Me]===null){x[Me]=Ae,xe=Me;break}if(xe===-1)break}let J=y[xe];J&&J.connect(Ae)}}let X=new D,ie=new D;function O($,ge,Ae){X.setFromMatrixPosition(ge.matrixWorld),ie.setFromMatrixPosition(Ae.matrixWorld);let xe=X.distanceTo(ie),J=ge.projectionMatrix.elements,Me=Ae.projectionMatrix.elements,j=J[14]/(J[10]-1),te=J[14]/(J[10]+1),ve=(J[9]+1)/J[5],de=(J[9]-1)/J[5],B=(J[8]-1)/J[0],we=(Me[8]+1)/Me[0],N=j*B,Ge=j*we,P=xe/(-B+we),ae=P*-B;if(ge.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(ae),$.translateZ(P),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),J[10]===-1)$.projectionMatrix.copy(ge.projectionMatrix),$.projectionMatrixInverse.copy(ge.projectionMatrixInverse);else{let He=j+P,L=te+P,S=N-ae,z=Ge+(xe-ae),oe=ve*te/L*He,me=de*te/L*He;$.projectionMatrix.makePerspective(S,z,oe,me,He,L),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function re($,ge){ge===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ge.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let ge=$.near,Ae=$.far;E.texture!==null&&(E.depthNear>0&&(ge=E.depthNear),E.depthFar>0&&(Ae=E.depthFar)),T.near=C.near=R.near=ge,T.far=C.far=R.far=Ae,(I!==T.near||G!==T.far)&&(s.updateRenderState({depthNear:T.near,depthFar:T.far}),I=T.near,G=T.far),R.layers.mask=$.layers.mask|2,C.layers.mask=$.layers.mask|4,T.layers.mask=R.layers.mask|C.layers.mask;let xe=$.parent,J=T.cameras;re(T,xe);for(let Me=0;Me<J.length;Me++)re(J[Me],xe);J.length===2?O(T,R,C):T.projectionMatrix.copy(R.projectionMatrix),ee($,T,xe)};function ee($,ge,Ae){Ae===null?$.matrix.copy(ge.matrixWorld):($.matrix.copy(Ae.matrixWorld),$.matrix.invert(),$.matrix.multiply(ge.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ge.projectionMatrix),$.projectionMatrixInverse.copy(ge.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Vi*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return T},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function($){l=$,u!==null&&(u.fixedFoveation=$),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=$)},this.hasDepthSensing=function(){return E.texture!==null},this.getDepthSensingMesh=function(){return E.getMesh(T)};let be=null;function he($,ge){if(h=ge.getViewerPose(c||o),f=ge,h!==null){let Ae=h.views;p!==null&&(e.setRenderTargetFramebuffer(w,p.framebuffer),e.setRenderTarget(w));let xe=!1;Ae.length!==T.cameras.length&&(T.cameras.length=0,xe=!0);for(let j=0;j<Ae.length;j++){let te=Ae[j],ve=null;if(p!==null)ve=p.getViewport(te);else{let B=d.getViewSubImage(u,te);ve=B.viewport,j===0&&(e.setRenderTargetTextures(w,B.colorTexture,B.depthStencilTexture),e.setRenderTarget(w))}let de=_[j];de===void 0&&(de=new Lt,de.layers.enable(j),de.viewport=new vt,_[j]=de),de.matrix.fromArray(te.transform.matrix),de.matrix.decompose(de.position,de.quaternion,de.scale),de.projectionMatrix.fromArray(te.projectionMatrix),de.projectionMatrixInverse.copy(de.projectionMatrix).invert(),de.viewport.set(ve.x,ve.y,ve.width,ve.height),j===0&&(T.matrix.copy(de.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale)),xe===!0&&T.cameras.push(de)}let J=s.enabledFeatures;if(J&&J.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&d){let j=d.getDepthInformation(Ae[0]);j&&j.isValid&&j.texture&&E.init(e,j,s.renderState)}}for(let Ae=0;Ae<y.length;Ae++){let xe=x[Ae],J=y[Ae];xe!==null&&J!==void 0&&J.update(xe,ge,c||o)}be&&be($,ge),ge.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ge}),f=null}let ue=new dd;ue.setAnimationLoop(he),this.setAnimationLoop=function($){be=$},this.dispose=function(){}}},ts=new hn,xE=new xt;function TE(n,e){function t(M,m){M.matrixAutoUpdate===!0&&M.updateMatrix(),m.value.copy(M.matrix)}function i(M,m){m.color.getRGB(M.fogColor.value,Xl(n)),m.isFog?(M.fogNear.value=m.near,M.fogFar.value=m.far):m.isFogExp2&&(M.fogDensity.value=m.density)}function s(M,m,w,y,x){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(M,m):m.isMeshToonMaterial?(r(M,m),d(M,m)):m.isMeshPhongMaterial?(r(M,m),h(M,m)):m.isMeshStandardMaterial?(r(M,m),u(M,m),m.isMeshPhysicalMaterial&&p(M,m,x)):m.isMeshMatcapMaterial?(r(M,m),f(M,m)):m.isMeshDepthMaterial?r(M,m):m.isMeshDistanceMaterial?(r(M,m),E(M,m)):m.isMeshNormalMaterial?r(M,m):m.isLineBasicMaterial?(o(M,m),m.isLineDashedMaterial&&a(M,m)):m.isPointsMaterial?l(M,m,w,y):m.isSpriteMaterial?c(M,m):m.isShadowMaterial?(M.color.value.copy(m.color),M.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(M,m){M.opacity.value=m.opacity,m.color&&M.diffuse.value.copy(m.color),m.emissive&&M.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(M.map.value=m.map,t(m.map,M.mapTransform)),m.alphaMap&&(M.alphaMap.value=m.alphaMap,t(m.alphaMap,M.alphaMapTransform)),m.bumpMap&&(M.bumpMap.value=m.bumpMap,t(m.bumpMap,M.bumpMapTransform),M.bumpScale.value=m.bumpScale,m.side===jt&&(M.bumpScale.value*=-1)),m.normalMap&&(M.normalMap.value=m.normalMap,t(m.normalMap,M.normalMapTransform),M.normalScale.value.copy(m.normalScale),m.side===jt&&M.normalScale.value.negate()),m.displacementMap&&(M.displacementMap.value=m.displacementMap,t(m.displacementMap,M.displacementMapTransform),M.displacementScale.value=m.displacementScale,M.displacementBias.value=m.displacementBias),m.emissiveMap&&(M.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,M.emissiveMapTransform)),m.specularMap&&(M.specularMap.value=m.specularMap,t(m.specularMap,M.specularMapTransform)),m.alphaTest>0&&(M.alphaTest.value=m.alphaTest);let w=e.get(m),y=w.envMap,x=w.envMapRotation;y&&(M.envMap.value=y,ts.copy(x),ts.x*=-1,ts.y*=-1,ts.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(ts.y*=-1,ts.z*=-1),M.envMapRotation.value.setFromMatrix4(xE.makeRotationFromEuler(ts)),M.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,M.reflectivity.value=m.reflectivity,M.ior.value=m.ior,M.refractionRatio.value=m.refractionRatio),m.lightMap&&(M.lightMap.value=m.lightMap,M.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,M.lightMapTransform)),m.aoMap&&(M.aoMap.value=m.aoMap,M.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,M.aoMapTransform))}function o(M,m){M.diffuse.value.copy(m.color),M.opacity.value=m.opacity,m.map&&(M.map.value=m.map,t(m.map,M.mapTransform))}function a(M,m){M.dashSize.value=m.dashSize,M.totalSize.value=m.dashSize+m.gapSize,M.scale.value=m.scale}function l(M,m,w,y){M.diffuse.value.copy(m.color),M.opacity.value=m.opacity,M.size.value=m.size*w,M.scale.value=y*.5,m.map&&(M.map.value=m.map,t(m.map,M.uvTransform)),m.alphaMap&&(M.alphaMap.value=m.alphaMap,t(m.alphaMap,M.alphaMapTransform)),m.alphaTest>0&&(M.alphaTest.value=m.alphaTest)}function c(M,m){M.diffuse.value.copy(m.color),M.opacity.value=m.opacity,M.rotation.value=m.rotation,m.map&&(M.map.value=m.map,t(m.map,M.mapTransform)),m.alphaMap&&(M.alphaMap.value=m.alphaMap,t(m.alphaMap,M.alphaMapTransform)),m.alphaTest>0&&(M.alphaTest.value=m.alphaTest)}function h(M,m){M.specular.value.copy(m.specular),M.shininess.value=Math.max(m.shininess,1e-4)}function d(M,m){m.gradientMap&&(M.gradientMap.value=m.gradientMap)}function u(M,m){M.metalness.value=m.metalness,m.metalnessMap&&(M.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,M.metalnessMapTransform)),M.roughness.value=m.roughness,m.roughnessMap&&(M.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,M.roughnessMapTransform)),m.envMap&&(M.envMapIntensity.value=m.envMapIntensity)}function p(M,m,w){M.ior.value=m.ior,m.sheen>0&&(M.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),M.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(M.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,M.sheenColorMapTransform)),m.sheenRoughnessMap&&(M.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,M.sheenRoughnessMapTransform))),m.clearcoat>0&&(M.clearcoat.value=m.clearcoat,M.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(M.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,M.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(M.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,M.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(M.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,M.clearcoatNormalMapTransform),M.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===jt&&M.clearcoatNormalScale.value.negate())),m.dispersion>0&&(M.dispersion.value=m.dispersion),m.iridescence>0&&(M.iridescence.value=m.iridescence,M.iridescenceIOR.value=m.iridescenceIOR,M.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],M.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(M.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,M.iridescenceMapTransform)),m.iridescenceThicknessMap&&(M.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,M.iridescenceThicknessMapTransform))),m.transmission>0&&(M.transmission.value=m.transmission,M.transmissionSamplerMap.value=w.texture,M.transmissionSamplerSize.value.set(w.width,w.height),m.transmissionMap&&(M.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,M.transmissionMapTransform)),M.thickness.value=m.thickness,m.thicknessMap&&(M.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,M.thicknessMapTransform)),M.attenuationDistance.value=m.attenuationDistance,M.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(M.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(M.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,M.anisotropyMapTransform))),M.specularIntensity.value=m.specularIntensity,M.specularColor.value.copy(m.specularColor),m.specularColorMap&&(M.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,M.specularColorMapTransform)),m.specularIntensityMap&&(M.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,M.specularIntensityMapTransform))}function f(M,m){m.matcap&&(M.matcap.value=m.matcap)}function E(M,m){let w=e.get(m).light;M.referencePosition.value.setFromMatrixPosition(w.matrixWorld),M.nearDistance.value=w.shadow.camera.near,M.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function wE(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,y){let x=y.program;i.uniformBlockBinding(w,x)}function c(w,y){let x=s[w.id];x===void 0&&(f(w),x=h(w),s[w.id]=x,w.addEventListener("dispose",M));let b=y.program;i.updateUBOMapping(w,b);let v=e.render.frame;r[w.id]!==v&&(u(w),r[w.id]=v)}function h(w){let y=d();w.__bindingPointIndex=y;let x=n.createBuffer(),b=w.__size,v=w.usage;return n.bindBuffer(n.UNIFORM_BUFFER,x),n.bufferData(n.UNIFORM_BUFFER,b,v),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,y,x),x}function d(){for(let w=0;w<a;w++)if(o.indexOf(w)===-1)return o.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(w){let y=s[w.id],x=w.uniforms,b=w.__cache;n.bindBuffer(n.UNIFORM_BUFFER,y);for(let v=0,R=x.length;v<R;v++){let C=Array.isArray(x[v])?x[v]:[x[v]];for(let _=0,T=C.length;_<T;_++){let I=C[_];if(p(I,v,_,b)===!0){let G=I.__offset,F=Array.isArray(I.value)?I.value:[I.value],k=0;for(let Y=0;Y<F.length;Y++){let X=F[Y],ie=E(X);typeof X=="number"||typeof X=="boolean"?(I.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,G+k,I.__data)):X.isMatrix3?(I.__data[0]=X.elements[0],I.__data[1]=X.elements[1],I.__data[2]=X.elements[2],I.__data[3]=0,I.__data[4]=X.elements[3],I.__data[5]=X.elements[4],I.__data[6]=X.elements[5],I.__data[7]=0,I.__data[8]=X.elements[6],I.__data[9]=X.elements[7],I.__data[10]=X.elements[8],I.__data[11]=0):(X.toArray(I.__data,k),k+=ie.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,G,I.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(w,y,x,b){let v=w.value,R=y+"_"+x;if(b[R]===void 0)return typeof v=="number"||typeof v=="boolean"?b[R]=v:b[R]=v.clone(),!0;{let C=b[R];if(typeof v=="number"||typeof v=="boolean"){if(C!==v)return b[R]=v,!0}else if(C.equals(v)===!1)return C.copy(v),!0}return!1}function f(w){let y=w.uniforms,x=0,b=16;for(let R=0,C=y.length;R<C;R++){let _=Array.isArray(y[R])?y[R]:[y[R]];for(let T=0,I=_.length;T<I;T++){let G=_[T],F=Array.isArray(G.value)?G.value:[G.value];for(let k=0,Y=F.length;k<Y;k++){let X=F[k],ie=E(X),O=x%b,re=O%ie.boundary,ee=O+re;x+=re,ee!==0&&b-ee<ie.storage&&(x+=b-ee),G.__data=new Float32Array(ie.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=x,x+=ie.storage}}}let v=x%b;return v>0&&(x+=b-v),w.__size=x,w.__cache={},this}function E(w){let y={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(y.boundary=4,y.storage=4):w.isVector2?(y.boundary=8,y.storage=8):w.isVector3||w.isColor?(y.boundary=16,y.storage=12):w.isVector4?(y.boundary=16,y.storage=16):w.isMatrix3?(y.boundary=48,y.storage=48):w.isMatrix4?(y.boundary=64,y.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),y}function M(w){let y=w.target;y.removeEventListener("dispose",M);let x=o.indexOf(y.__bindingPointIndex);o.splice(x,1),n.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function m(){for(let w in s)n.deleteBuffer(s[w]);o=[],s={},r={}}return{bind:l,update:c,dispose:m}}var Pa=class{constructor(e={}){let{canvas:t=Gh(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:u=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;let f=new Uint32Array(4),E=new Int32Array(4),M=null,m=null,w=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=oi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let x=this,b=!1;this._outputColorSpace=At;let v=0,R=0,C=null,_=-1,T=null,I=new vt,G=new vt,F=null,k=new Ne(0),Y=0,X=t.width,ie=t.height,O=1,re=null,ee=null,be=new vt(0,0,X,ie),he=new vt(0,0,X,ie),ue=!1,$=new wi,ge=!1,Ae=!1,xe=new xt,J=new xt,Me=new D,j=new vt,te={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ve=!1;function de(){return C===null?O:1}let B=i;function we(A,q){return t.getContext(A,q)}try{let A={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"175"}`),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",Se,!1),t.addEventListener("webglcontextcreationerror",Re,!1),B===null){let q="webgl2";if(B=we(q,A),B===null)throw we(q)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let N,Ge,P,ae,He,L,S,z,oe,me,fe,Ve,Le,pe,Ze,_e,ke,Ke,je,Oe,Pe,Te,Ie,U;function ye(){N=new k0(B),N.init(),Te=new gE(B,N),Ge=new D0(B,N,e,Te),P=new mE(B,N),Ge.reverseDepthBuffer&&u&&P.buffers.depth.setReversed(!0),ae=new V0(B),He=new nE,L=new EE(B,N,P,He,Ge,Te,ae),S=new B0(x),z=new N0(x),oe=new Zu(B),Ie=new P0(B,oe),me=new O0(B,oe,ae,Ie),fe=new X0(B,me,oe,ae),je=new W0(B,Ge,L),_e=new L0(He),Ve=new tE(x,S,z,N,Ge,Ie,_e),Le=new TE(x,He),pe=new sE,Ze=new hE(N),Ke=new H0(x,S,z,P,fe,p,l),ke=new fE(x,fe,Ge),U=new wE(B,ae,Ge,P),Oe=new I0(B,N,ae),Pe=new z0(B,N,ae),ae.programs=Ve.programs,x.capabilities=Ge,x.extensions=N,x.properties=He,x.renderLists=pe,x.shadowMap=ke,x.state=P,x.info=ae}ye();let Z=new cc(x,B);this.xr=Z,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let A=N.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){let A=N.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return O},this.setPixelRatio=function(A){A!==void 0&&(O=A,this.setSize(X,ie,!1))},this.getSize=function(A){return A.set(X,ie)},this.setSize=function(A,q,se=!0){if(Z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}X=A,ie=q,t.width=Math.floor(A*O),t.height=Math.floor(q*O),se===!0&&(t.style.width=A+"px",t.style.height=q+"px"),this.setViewport(0,0,A,q)},this.getDrawingBufferSize=function(A){return A.set(X*O,ie*O).floor()},this.setDrawingBufferSize=function(A,q,se){X=A,ie=q,O=se,t.width=Math.floor(A*se),t.height=Math.floor(q*se),this.setViewport(0,0,A,q)},this.getCurrentViewport=function(A){return A.copy(I)},this.getViewport=function(A){return A.copy(be)},this.setViewport=function(A,q,se,Q){A.isVector4?be.set(A.x,A.y,A.z,A.w):be.set(A,q,se,Q),P.viewport(I.copy(be).multiplyScalar(O).round())},this.getScissor=function(A){return A.copy(he)},this.setScissor=function(A,q,se,Q){A.isVector4?he.set(A.x,A.y,A.z,A.w):he.set(A,q,se,Q),P.scissor(G.copy(he).multiplyScalar(O).round())},this.getScissorTest=function(){return ue},this.setScissorTest=function(A){P.setScissorTest(ue=A)},this.setOpaqueSort=function(A){re=A},this.setTransparentSort=function(A){ee=A},this.getClearColor=function(A){return A.copy(Ke.getClearColor())},this.setClearColor=function(){Ke.setClearColor(...arguments)},this.getClearAlpha=function(){return Ke.getClearAlpha()},this.setClearAlpha=function(){Ke.setClearAlpha(...arguments)},this.clear=function(A=!0,q=!0,se=!0){let Q=0;if(A){let V=!1;if(C!==null){let Ce=C.texture.format;V=Ce===jo||Ce===Qo||Ce===$o}if(V){let Ce=C.texture.type,Fe=Ce===Xn||Ce===Ri||Ce===Is||Ce===Ds||Ce===Jo||Ce===Ko,Xe=Ke.getClearColor(),Ye=Ke.getClearAlpha(),nt=Xe.r,tt=Xe.g,Qe=Xe.b;Fe?(f[0]=nt,f[1]=tt,f[2]=Qe,f[3]=Ye,B.clearBufferuiv(B.COLOR,0,f)):(E[0]=nt,E[1]=tt,E[2]=Qe,E[3]=Ye,B.clearBufferiv(B.COLOR,0,E))}else Q|=B.COLOR_BUFFER_BIT}q&&(Q|=B.DEPTH_BUFFER_BIT),se&&(Q|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B.clear(Q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",Se,!1),t.removeEventListener("webglcontextcreationerror",Re,!1),Ke.dispose(),pe.dispose(),Ze.dispose(),He.dispose(),S.dispose(),z.dispose(),fe.dispose(),Ie.dispose(),U.dispose(),Ve.dispose(),Z.dispose(),Z.removeEventListener("sessionstart",on),Z.removeEventListener("sessionend",Hi),gn.stop()};function K(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function Se(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let A=ae.autoReset,q=ke.enabled,se=ke.autoUpdate,Q=ke.needsUpdate,V=ke.type;ye(),ae.autoReset=A,ke.enabled=q,ke.autoUpdate=se,ke.needsUpdate=Q,ke.type=V}function Re(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function Ue(A){let q=A.target;q.removeEventListener("dispose",Ue),ot(q)}function ot(A){ft(A),He.remove(A)}function ft(A){let q=He.get(A).programs;q!==void 0&&(q.forEach(function(se){Ve.releaseProgram(se)}),A.isShaderMaterial&&Ve.releaseShaderCache(A))}this.renderBufferDirect=function(A,q,se,Q,V,Ce){q===null&&(q=te);let Fe=V.isMesh&&V.matrixWorld.determinant()<0,Xe=Pn(A,q,se,Q,V);P.setMaterial(Q,Fe);let Ye=se.index,nt=1;if(Q.wireframe===!0){if(Ye=me.getWireframeAttribute(se),Ye===void 0)return;nt=2}let tt=se.drawRange,Qe=se.attributes.position,lt=tt.start*nt,pt=(tt.start+tt.count)*nt;Ce!==null&&(lt=Math.max(lt,Ce.start*nt),pt=Math.min(pt,(Ce.start+Ce.count)*nt)),Ye!==null?(lt=Math.max(lt,0),pt=Math.min(pt,Ye.count)):Qe!=null&&(lt=Math.max(lt,0),pt=Math.min(pt,Qe.count));let It=pt-lt;if(It<0||It===1/0)return;Ie.setup(V,Q,Xe,se,Ye);let Ht,yt=Oe;if(Ye!==null&&(Ht=oe.get(Ye),yt=Pe,yt.setIndex(Ht)),V.isMesh)Q.wireframe===!0?(P.setLineWidth(Q.wireframeLinewidth*de()),yt.setMode(B.LINES)):yt.setMode(B.TRIANGLES);else if(V.isLine){let et=Q.linewidth;et===void 0&&(et=1),P.setLineWidth(et*de()),V.isLineSegments?yt.setMode(B.LINES):V.isLineLoop?yt.setMode(B.LINE_LOOP):yt.setMode(B.LINE_STRIP)}else V.isPoints?yt.setMode(B.POINTS):V.isSprite&&yt.setMode(B.TRIANGLES);if(V.isBatchedMesh)if(V._multiDrawInstances!==null)Cr("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),yt.renderMultiDrawInstances(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount,V._multiDrawInstances);else if(N.get("WEBGL_multi_draw"))yt.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let et=V._multiDrawStarts,Ot=V._multiDrawCounts,_t=V._multiDrawCount,fn=Ye?oe.get(Ye).bytesPerElement:1,di=He.get(Q).currentProgram.getUniforms();for(let tn=0;tn<_t;tn++)di.setValue(B,"_gl_DrawID",tn),yt.render(et[tn]/fn,Ot[tn])}else if(V.isInstancedMesh)yt.renderInstances(lt,It,V.count);else if(se.isInstancedBufferGeometry){let et=se._maxInstanceCount!==void 0?se._maxInstanceCount:1/0,Ot=Math.min(se.instanceCount,et);yt.renderInstances(lt,It,Ot)}else yt.render(lt,It)};function it(A,q,se){A.transparent===!0&&A.side===Mt&&A.forceSinglePass===!1?(A.side=jt,A.needsUpdate=!0,un(A,q,se),A.side=ti,A.needsUpdate=!0,un(A,q,se),A.side=Mt):un(A,q,se)}this.compile=function(A,q,se=null){se===null&&(se=A),m=Ze.get(se),m.init(q),y.push(m),se.traverseVisible(function(V){V.isLight&&V.layers.test(q.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),A!==se&&A.traverseVisible(function(V){V.isLight&&V.layers.test(q.layers)&&(m.pushLight(V),V.castShadow&&m.pushShadow(V))}),m.setupLights();let Q=new Set;return A.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let Ce=V.material;if(Ce)if(Array.isArray(Ce))for(let Fe=0;Fe<Ce.length;Fe++){let Xe=Ce[Fe];it(Xe,se,V),Q.add(Xe)}else it(Ce,se,V),Q.add(Ce)}),m=y.pop(),Q},this.compileAsync=function(A,q,se=null){let Q=this.compile(A,q,se);return new Promise(V=>{function Ce(){if(Q.forEach(function(Fe){He.get(Fe).currentProgram.isReady()&&Q.delete(Fe)}),Q.size===0){V(A);return}setTimeout(Ce,10)}N.get("KHR_parallel_shader_compile")!==null?Ce():setTimeout(Ce,10)})};let Dt=null;function Xt(A){Dt&&Dt(A)}function on(){gn.stop()}function Hi(){gn.start()}let gn=new dd;gn.setAnimationLoop(Xt),typeof self<"u"&&gn.setContext(self),this.setAnimationLoop=function(A){Dt=A,Z.setAnimationLoop(A),A===null?gn.stop():gn.start()},Z.addEventListener("sessionstart",on),Z.addEventListener("sessionend",Hi),this.render=function(A,q){if(q!==void 0&&q.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),q.parent===null&&q.matrixWorldAutoUpdate===!0&&q.updateMatrixWorld(),Z.enabled===!0&&Z.isPresenting===!0&&(Z.cameraAutoUpdate===!0&&Z.updateCamera(q),q=Z.getCamera()),A.isScene===!0&&A.onBeforeRender(x,A,q,C),m=Ze.get(A,y.length),m.init(q),y.push(m),J.multiplyMatrices(q.projectionMatrix,q.matrixWorldInverse),$.setFromProjectionMatrix(J),Ae=this.localClippingEnabled,ge=_e.init(this.clippingPlanes,Ae),M=pe.get(A,w.length),M.init(),w.push(M),Z.enabled===!0&&Z.isPresenting===!0){let Ce=x.xr.getDepthSensingMesh();Ce!==null&&dn(Ce,q,-1/0,x.sortObjects)}dn(A,q,0,x.sortObjects),M.finish(),x.sortObjects===!0&&M.sort(re,ee),ve=Z.enabled===!1||Z.isPresenting===!1||Z.hasDepthSensing()===!1,ve&&Ke.addToRenderList(M,A),this.info.render.frame++,ge===!0&&_e.beginShadows();let se=m.state.shadowsArray;ke.render(se,A,q),ge===!0&&_e.endShadows(),this.info.autoReset===!0&&this.info.reset();let Q=M.opaque,V=M.transmissive;if(m.setupLights(),q.isArrayCamera){let Ce=q.cameras;if(V.length>0)for(let Fe=0,Xe=Ce.length;Fe<Xe;Fe++){let Ye=Ce[Fe];Jt(Q,V,A,Ye)}ve&&Ke.render(A);for(let Fe=0,Xe=Ce.length;Fe<Xe;Fe++){let Ye=Ce[Fe];ci(M,A,Ye,Ye.viewport)}}else V.length>0&&Jt(Q,V,A,q),ve&&Ke.render(A),ci(M,A,q);C!==null&&R===0&&(L.updateMultisampleRenderTarget(C),L.updateRenderTargetMipmap(C)),A.isScene===!0&&A.onAfterRender(x,A,q),Ie.resetDefaultState(),_=-1,T=null,y.pop(),y.length>0?(m=y[y.length-1],ge===!0&&_e.setGlobalState(x.clippingPlanes,m.state.camera)):m=null,w.pop(),w.length>0?M=w[w.length-1]:M=null};function dn(A,q,se,Q){if(A.visible===!1)return;if(A.layers.test(q.layers)){if(A.isGroup)se=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(q);else if(A.isLight)m.pushLight(A),A.castShadow&&m.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||$.intersectsSprite(A)){Q&&j.setFromMatrixPosition(A.matrixWorld).applyMatrix4(J);let Fe=fe.update(A),Xe=A.material;Xe.visible&&M.push(A,Fe,Xe,se,j.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||$.intersectsObject(A))){let Fe=fe.update(A),Xe=A.material;if(Q&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),j.copy(A.boundingSphere.center)):(Fe.boundingSphere===null&&Fe.computeBoundingSphere(),j.copy(Fe.boundingSphere.center)),j.applyMatrix4(A.matrixWorld).applyMatrix4(J)),Array.isArray(Xe)){let Ye=Fe.groups;for(let nt=0,tt=Ye.length;nt<tt;nt++){let Qe=Ye[nt],lt=Xe[Qe.materialIndex];lt&&lt.visible&&M.push(A,Fe,lt,se,j.z,Qe)}}else Xe.visible&&M.push(A,Fe,Xe,se,j.z,null)}}let Ce=A.children;for(let Fe=0,Xe=Ce.length;Fe<Xe;Fe++)dn(Ce[Fe],q,se,Q)}function ci(A,q,se,Q){let V=A.opaque,Ce=A.transmissive,Fe=A.transparent;m.setupLightsView(se),ge===!0&&_e.setGlobalState(x.clippingPlanes,se),Q&&P.viewport(I.copy(Q)),V.length>0&&Hn(V,q,se),Ce.length>0&&Hn(Ce,q,se),Fe.length>0&&Hn(Fe,q,se),P.buffers.depth.setTest(!0),P.buffers.depth.setMask(!0),P.buffers.color.setMask(!0),P.setPolygonOffset(!1)}function Jt(A,q,se,Q){if((se.isScene===!0?se.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[Q.id]===void 0&&(m.state.transmissionRenderTarget[Q.id]=new Cn(1,1,{generateMipmaps:!0,type:N.has("EXT_color_buffer_half_float")||N.has("EXT_color_buffer_float")?Ci:Xn,minFilter:bi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:wt.workingColorSpace}));let Ce=m.state.transmissionRenderTarget[Q.id],Fe=Q.viewport||I;Ce.setSize(Fe.z*x.transmissionResolutionScale,Fe.w*x.transmissionResolutionScale);let Xe=x.getRenderTarget();x.setRenderTarget(Ce),x.getClearColor(k),Y=x.getClearAlpha(),Y<1&&x.setClearColor(16777215,.5),x.clear(),ve&&Ke.render(se);let Ye=x.toneMapping;x.toneMapping=oi;let nt=Q.viewport;if(Q.viewport!==void 0&&(Q.viewport=void 0),m.setupLightsView(Q),ge===!0&&_e.setGlobalState(x.clippingPlanes,Q),Hn(A,se,Q),L.updateMultisampleRenderTarget(Ce),L.updateRenderTargetMipmap(Ce),N.has("WEBGL_multisampled_render_to_texture")===!1){let tt=!1;for(let Qe=0,lt=q.length;Qe<lt;Qe++){let pt=q[Qe],It=pt.object,Ht=pt.geometry,yt=pt.material,et=pt.group;if(yt.side===Mt&&It.layers.test(Q.layers)){let Ot=yt.side;yt.side=jt,yt.needsUpdate=!0,Zn(It,se,Q,Ht,yt,et),yt.side=Ot,yt.needsUpdate=!0,tt=!0}}tt===!0&&(L.updateMultisampleRenderTarget(Ce),L.updateRenderTargetMipmap(Ce))}x.setRenderTarget(Xe),x.setClearColor(k,Y),nt!==void 0&&(Q.viewport=nt),x.toneMapping=Ye}function Hn(A,q,se){let Q=q.isScene===!0?q.overrideMaterial:null;for(let V=0,Ce=A.length;V<Ce;V++){let Fe=A[V],Xe=Fe.object,Ye=Fe.geometry,nt=Fe.group,tt=Fe.material;tt.allowOverride===!0&&Q!==null&&(tt=Q),Xe.layers.test(se.layers)&&Zn(Xe,q,se,Ye,tt,nt)}}function Zn(A,q,se,Q,V,Ce){A.onBeforeRender(x,q,se,Q,V,Ce),A.modelViewMatrix.multiplyMatrices(se.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),V.onBeforeRender(x,q,se,Q,A,Ce),V.transparent===!0&&V.side===Mt&&V.forceSinglePass===!1?(V.side=jt,V.needsUpdate=!0,x.renderBufferDirect(se,q,Q,V,A,Ce),V.side=ti,V.needsUpdate=!0,x.renderBufferDirect(se,q,Q,V,A,Ce),V.side=Mt):x.renderBufferDirect(se,q,Q,V,A,Ce),A.onAfterRender(x,q,se,Q,V,Ce)}function un(A,q,se){q.isScene!==!0&&(q=te);let Q=He.get(A),V=m.state.lights,Ce=m.state.shadowsArray,Fe=V.state.version,Xe=Ve.getParameters(A,V.state,Ce,q,se),Ye=Ve.getProgramCacheKey(Xe),nt=Q.programs;Q.environment=A.isMeshStandardMaterial?q.environment:null,Q.fog=q.fog,Q.envMap=(A.isMeshStandardMaterial?z:S).get(A.envMap||Q.environment),Q.envMapRotation=Q.environment!==null&&A.envMap===null?q.environmentRotation:A.envMapRotation,nt===void 0&&(A.addEventListener("dispose",Ue),nt=new Map,Q.programs=nt);let tt=nt.get(Ye);if(tt!==void 0){if(Q.currentProgram===tt&&Q.lightsStateVersion===Fe)return Pi(A,Xe),tt}else Xe.uniforms=Ve.getUniforms(A),A.onBeforeCompile(Xe,x),tt=Ve.acquireProgram(Xe,Ye),nt.set(Ye,tt),Q.uniforms=Xe.uniforms;let Qe=Q.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Qe.clippingPlanes=_e.uniform),Pi(A,Xe),Q.needsLights=Di(A),Q.lightsStateVersion=Fe,Q.needsLights&&(Qe.ambientLightColor.value=V.state.ambient,Qe.lightProbe.value=V.state.probe,Qe.directionalLights.value=V.state.directional,Qe.directionalLightShadows.value=V.state.directionalShadow,Qe.spotLights.value=V.state.spot,Qe.spotLightShadows.value=V.state.spotShadow,Qe.rectAreaLights.value=V.state.rectArea,Qe.ltc_1.value=V.state.rectAreaLTC1,Qe.ltc_2.value=V.state.rectAreaLTC2,Qe.pointLights.value=V.state.point,Qe.pointLightShadows.value=V.state.pointShadow,Qe.hemisphereLights.value=V.state.hemi,Qe.directionalShadowMap.value=V.state.directionalShadowMap,Qe.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Qe.spotShadowMap.value=V.state.spotShadowMap,Qe.spotLightMatrix.value=V.state.spotLightMatrix,Qe.spotLightMap.value=V.state.spotLightMap,Qe.pointShadowMap.value=V.state.pointShadowMap,Qe.pointShadowMatrix.value=V.state.pointShadowMatrix),Q.currentProgram=tt,Q.uniformsList=null,tt}function hi(A){if(A.uniformsList===null){let q=A.currentProgram.getUniforms();A.uniformsList=Fs.seqWithValue(q.seq,A.uniforms)}return A.uniformsList}function Pi(A,q){let se=He.get(A);se.outputColorSpace=q.outputColorSpace,se.batching=q.batching,se.batchingColor=q.batchingColor,se.instancing=q.instancing,se.instancingColor=q.instancingColor,se.instancingMorph=q.instancingMorph,se.skinning=q.skinning,se.morphTargets=q.morphTargets,se.morphNormals=q.morphNormals,se.morphColors=q.morphColors,se.morphTargetsCount=q.morphTargetsCount,se.numClippingPlanes=q.numClippingPlanes,se.numIntersection=q.numClipIntersection,se.vertexAlphas=q.vertexAlphas,se.vertexTangents=q.vertexTangents,se.toneMapping=q.toneMapping}function Pn(A,q,se,Q,V){q.isScene!==!0&&(q=te),L.resetTextureUnits();let Ce=q.fog,Fe=Q.isMeshStandardMaterial?q.environment:null,Xe=C===null?x.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:zi,Ye=(Q.isMeshStandardMaterial?z:S).get(Q.envMap||Fe),nt=Q.vertexColors===!0&&!!se.attributes.color&&se.attributes.color.itemSize===4,tt=!!se.attributes.tangent&&(!!Q.normalMap||Q.anisotropy>0),Qe=!!se.morphAttributes.position,lt=!!se.morphAttributes.normal,pt=!!se.morphAttributes.color,It=oi;Q.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(It=x.toneMapping);let Ht=se.morphAttributes.position||se.morphAttributes.normal||se.morphAttributes.color,yt=Ht!==void 0?Ht.length:0,et=He.get(Q),Ot=m.state.lights;if(ge===!0&&(Ae===!0||A!==T)){let mt=A===T&&Q.id===_;_e.setState(Q,A,mt)}let _t=!1;Q.version===et.__version?(et.needsLights&&et.lightsStateVersion!==Ot.state.version||et.outputColorSpace!==Xe||V.isBatchedMesh&&et.batching===!1||!V.isBatchedMesh&&et.batching===!0||V.isBatchedMesh&&et.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&et.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&et.instancing===!1||!V.isInstancedMesh&&et.instancing===!0||V.isSkinnedMesh&&et.skinning===!1||!V.isSkinnedMesh&&et.skinning===!0||V.isInstancedMesh&&et.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&et.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&et.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&et.instancingMorph===!1&&V.morphTexture!==null||et.envMap!==Ye||Q.fog===!0&&et.fog!==Ce||et.numClippingPlanes!==void 0&&(et.numClippingPlanes!==_e.numPlanes||et.numIntersection!==_e.numIntersection)||et.vertexAlphas!==nt||et.vertexTangents!==tt||et.morphTargets!==Qe||et.morphNormals!==lt||et.morphColors!==pt||et.toneMapping!==It||et.morphTargetsCount!==yt)&&(_t=!0):(_t=!0,et.__version=Q.version);let fn=et.currentProgram;_t===!0&&(fn=un(Q,q,V));let di=!1,tn=!1,ui=!1,ne=fn.getUniforms(),qe=et.uniforms;if(P.useProgram(fn.program)&&(di=!0,tn=!0,ui=!0),Q.id!==_&&(_=Q.id,tn=!0),di||T!==A){P.buffers.depth.getReversed()?(xe.copy(A.projectionMatrix),Fh(xe),Nh(xe),ne.setValue(B,"projectionMatrix",xe)):ne.setValue(B,"projectionMatrix",A.projectionMatrix),ne.setValue(B,"viewMatrix",A.matrixWorldInverse);let Et=ne.map.cameraPosition;Et!==void 0&&Et.setValue(B,Me.setFromMatrixPosition(A.matrixWorld)),Ge.logarithmicDepthBuffer&&ne.setValue(B,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(Q.isMeshPhongMaterial||Q.isMeshToonMaterial||Q.isMeshLambertMaterial||Q.isMeshBasicMaterial||Q.isMeshStandardMaterial||Q.isShaderMaterial)&&ne.setValue(B,"isOrthographic",A.isOrthographicCamera===!0),T!==A&&(T=A,tn=!0,ui=!0)}if(V.isSkinnedMesh){ne.setOptional(B,V,"bindMatrix"),ne.setOptional(B,V,"bindMatrixInverse");let mt=V.skeleton;mt&&(mt.boneTexture===null&&mt.computeBoneTexture(),ne.setValue(B,"boneTexture",mt.boneTexture,L))}V.isBatchedMesh&&(ne.setOptional(B,V,"batchingTexture"),ne.setValue(B,"batchingTexture",V._matricesTexture,L),ne.setOptional(B,V,"batchingIdTexture"),ne.setValue(B,"batchingIdTexture",V._indirectTexture,L),ne.setOptional(B,V,"batchingColorTexture"),V._colorsTexture!==null&&ne.setValue(B,"batchingColorTexture",V._colorsTexture,L));let dt=se.morphAttributes;if((dt.position!==void 0||dt.normal!==void 0||dt.color!==void 0)&&je.update(V,se,fn),(tn||et.receiveShadow!==V.receiveShadow)&&(et.receiveShadow=V.receiveShadow,ne.setValue(B,"receiveShadow",V.receiveShadow)),Q.isMeshGouraudMaterial&&Q.envMap!==null&&(qe.envMap.value=Ye,qe.flipEnvMap.value=Ye.isCubeTexture&&Ye.isRenderTargetTexture===!1?-1:1),Q.isMeshStandardMaterial&&Q.envMap===null&&q.environment!==null&&(qe.envMapIntensity.value=q.environmentIntensity),tn&&(ne.setValue(B,"toneMappingExposure",x.toneMappingExposure),et.needsLights&&Ii(qe,ui),Ce&&Q.fog===!0&&Le.refreshFogUniforms(qe,Ce),Le.refreshMaterialUniforms(qe,Q,O,ie,m.state.transmissionRenderTarget[A.id]),Fs.upload(B,hi(et),qe,L)),Q.isShaderMaterial&&Q.uniformsNeedUpdate===!0&&(Fs.upload(B,hi(et),qe,L),Q.uniformsNeedUpdate=!1),Q.isSpriteMaterial&&ne.setValue(B,"center",V.center),ne.setValue(B,"modelViewMatrix",V.modelViewMatrix),ne.setValue(B,"normalMatrix",V.normalMatrix),ne.setValue(B,"modelMatrix",V.matrixWorld),Q.isShaderMaterial||Q.isRawShaderMaterial){let mt=Q.uniformsGroups;for(let Et=0,zt=mt.length;Et<zt;Et++){let an=mt[Et];U.update(an,fn),U.bind(an,fn)}}return fn}function Ii(A,q){A.ambientLightColor.needsUpdate=q,A.lightProbe.needsUpdate=q,A.directionalLights.needsUpdate=q,A.directionalLightShadows.needsUpdate=q,A.pointLights.needsUpdate=q,A.pointLightShadows.needsUpdate=q,A.spotLights.needsUpdate=q,A.spotLightShadows.needsUpdate=q,A.rectAreaLights.needsUpdate=q,A.hemisphereLights.needsUpdate=q}function Di(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return v},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(A,q,se){let Q=He.get(A);Q.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,Q.__autoAllocateDepthBuffer===!1&&(Q.__useRenderToTexture=!1),He.get(A.texture).__webglTexture=q,He.get(A.depthTexture).__webglTexture=Q.__autoAllocateDepthBuffer?void 0:se,Q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,q){let se=He.get(A);se.__webglFramebuffer=q,se.__useDefaultFramebuffer=q===void 0};let os=B.createFramebuffer();this.setRenderTarget=function(A,q=0,se=0){C=A,v=q,R=se;let Q=!0,V=null,Ce=!1,Fe=!1;if(A){let Ye=He.get(A);if(Ye.__useDefaultFramebuffer!==void 0)P.bindFramebuffer(B.FRAMEBUFFER,null),Q=!1;else if(Ye.__webglFramebuffer===void 0)L.setupRenderTarget(A);else if(Ye.__hasExternalTextures)L.rebindTextures(A,He.get(A.texture).__webglTexture,He.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){let Qe=A.depthTexture;if(Ye.__boundDepthTexture!==Qe){if(Qe!==null&&He.has(Qe)&&(A.width!==Qe.image.width||A.height!==Qe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");L.setupDepthRenderbuffer(A)}}let nt=A.texture;(nt.isData3DTexture||nt.isDataArrayTexture||nt.isCompressedArrayTexture)&&(Fe=!0);let tt=He.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(tt[q])?V=tt[q][se]:V=tt[q],Ce=!0):A.samples>0&&L.useMultisampledRTT(A)===!1?V=He.get(A).__webglMultisampledFramebuffer:Array.isArray(tt)?V=tt[se]:V=tt,I.copy(A.viewport),G.copy(A.scissor),F=A.scissorTest}else I.copy(be).multiplyScalar(O).floor(),G.copy(he).multiplyScalar(O).floor(),F=ue;if(se!==0&&(V=os),P.bindFramebuffer(B.FRAMEBUFFER,V)&&Q&&P.drawBuffers(A,V),P.viewport(I),P.scissor(G),P.setScissorTest(F),Ce){let Ye=He.get(A.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+q,Ye.__webglTexture,se)}else if(Fe){let Ye=He.get(A.texture),nt=q;B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,Ye.__webglTexture,se,nt)}else if(A!==null&&se!==0){let Ye=He.get(A.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,Ye.__webglTexture,se)}_=-1},this.readRenderTargetPixels=function(A,q,se,Q,V,Ce,Fe){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Xe=He.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Fe!==void 0&&(Xe=Xe[Fe]),Xe){P.bindFramebuffer(B.FRAMEBUFFER,Xe);try{let Ye=A.texture,nt=Ye.format,tt=Ye.type;if(!Ge.textureFormatReadable(nt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ge.textureTypeReadable(tt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}q>=0&&q<=A.width-Q&&se>=0&&se<=A.height-V&&B.readPixels(q,se,Q,V,Te.convert(nt),Te.convert(tt),Ce)}finally{let Ye=C!==null?He.get(C).__webglFramebuffer:null;P.bindFramebuffer(B.FRAMEBUFFER,Ye)}}},this.readRenderTargetPixelsAsync=async function(A,q,se,Q,V,Ce,Fe){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Xe=He.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Fe!==void 0&&(Xe=Xe[Fe]),Xe)if(q>=0&&q<=A.width-Q&&se>=0&&se<=A.height-V){P.bindFramebuffer(B.FRAMEBUFFER,Xe);let Ye=A.texture,nt=Ye.format,tt=Ye.type;if(!Ge.textureFormatReadable(nt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ge.textureTypeReadable(tt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Qe=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,Qe),B.bufferData(B.PIXEL_PACK_BUFFER,Ce.byteLength,B.STREAM_READ),B.readPixels(q,se,Q,V,Te.convert(nt),Te.convert(tt),0);let lt=C!==null?He.get(C).__webglFramebuffer:null;P.bindFramebuffer(B.FRAMEBUFFER,lt);let pt=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Uh(B,pt,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,Qe),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,Ce),B.deleteBuffer(Qe),B.deleteSync(pt),Ce}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,q=null,se=0){let Q=Math.pow(2,-se),V=Math.floor(A.image.width*Q),Ce=Math.floor(A.image.height*Q),Fe=q!==null?q.x:0,Xe=q!==null?q.y:0;L.setTexture2D(A,0),B.copyTexSubImage2D(B.TEXTURE_2D,se,0,0,Fe,Xe,V,Ce),P.unbindTexture()};let Li=B.createFramebuffer(),In=B.createFramebuffer();this.copyTextureToTexture=function(A,q,se=null,Q=null,V=0,Ce=null){Ce===null&&(V!==0?(Cr("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),Ce=V,V=0):Ce=0);let Fe,Xe,Ye,nt,tt,Qe,lt,pt,It,Ht=A.isCompressedTexture?A.mipmaps[Ce]:A.image;if(se!==null)Fe=se.max.x-se.min.x,Xe=se.max.y-se.min.y,Ye=se.isBox3?se.max.z-se.min.z:1,nt=se.min.x,tt=se.min.y,Qe=se.isBox3?se.min.z:0;else{let dt=Math.pow(2,-V);Fe=Math.floor(Ht.width*dt),Xe=Math.floor(Ht.height*dt),A.isDataArrayTexture?Ye=Ht.depth:A.isData3DTexture?Ye=Math.floor(Ht.depth*dt):Ye=1,nt=0,tt=0,Qe=0}Q!==null?(lt=Q.x,pt=Q.y,It=Q.z):(lt=0,pt=0,It=0);let yt=Te.convert(q.format),et=Te.convert(q.type),Ot;q.isData3DTexture?(L.setTexture3D(q,0),Ot=B.TEXTURE_3D):q.isDataArrayTexture||q.isCompressedArrayTexture?(L.setTexture2DArray(q,0),Ot=B.TEXTURE_2D_ARRAY):(L.setTexture2D(q,0),Ot=B.TEXTURE_2D),B.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,q.flipY),B.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,q.premultiplyAlpha),B.pixelStorei(B.UNPACK_ALIGNMENT,q.unpackAlignment);let _t=B.getParameter(B.UNPACK_ROW_LENGTH),fn=B.getParameter(B.UNPACK_IMAGE_HEIGHT),di=B.getParameter(B.UNPACK_SKIP_PIXELS),tn=B.getParameter(B.UNPACK_SKIP_ROWS),ui=B.getParameter(B.UNPACK_SKIP_IMAGES);B.pixelStorei(B.UNPACK_ROW_LENGTH,Ht.width),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,Ht.height),B.pixelStorei(B.UNPACK_SKIP_PIXELS,nt),B.pixelStorei(B.UNPACK_SKIP_ROWS,tt),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Qe);let ne=A.isDataArrayTexture||A.isData3DTexture,qe=q.isDataArrayTexture||q.isData3DTexture;if(A.isDepthTexture){let dt=He.get(A),mt=He.get(q),Et=He.get(dt.__renderTarget),zt=He.get(mt.__renderTarget);P.bindFramebuffer(B.READ_FRAMEBUFFER,Et.__webglFramebuffer),P.bindFramebuffer(B.DRAW_FRAMEBUFFER,zt.__webglFramebuffer);for(let an=0;an<Ye;an++)ne&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,He.get(A).__webglTexture,V,Qe+an),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,He.get(q).__webglTexture,Ce,It+an)),B.blitFramebuffer(nt,tt,Fe,Xe,lt,pt,Fe,Xe,B.DEPTH_BUFFER_BIT,B.NEAREST);P.bindFramebuffer(B.READ_FRAMEBUFFER,null),P.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(V!==0||A.isRenderTargetTexture||He.has(A)){let dt=He.get(A),mt=He.get(q);P.bindFramebuffer(B.READ_FRAMEBUFFER,Li),P.bindFramebuffer(B.DRAW_FRAMEBUFFER,In);for(let Et=0;Et<Ye;Et++)ne?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,dt.__webglTexture,V,Qe+Et):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,dt.__webglTexture,V),qe?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,mt.__webglTexture,Ce,It+Et):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,mt.__webglTexture,Ce),V!==0?B.blitFramebuffer(nt,tt,Fe,Xe,lt,pt,Fe,Xe,B.COLOR_BUFFER_BIT,B.NEAREST):qe?B.copyTexSubImage3D(Ot,Ce,lt,pt,It+Et,nt,tt,Fe,Xe):B.copyTexSubImage2D(Ot,Ce,lt,pt,nt,tt,Fe,Xe);P.bindFramebuffer(B.READ_FRAMEBUFFER,null),P.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else qe?A.isDataTexture||A.isData3DTexture?B.texSubImage3D(Ot,Ce,lt,pt,It,Fe,Xe,Ye,yt,et,Ht.data):q.isCompressedArrayTexture?B.compressedTexSubImage3D(Ot,Ce,lt,pt,It,Fe,Xe,Ye,yt,Ht.data):B.texSubImage3D(Ot,Ce,lt,pt,It,Fe,Xe,Ye,yt,et,Ht):A.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,Ce,lt,pt,Fe,Xe,yt,et,Ht.data):A.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,Ce,lt,pt,Ht.width,Ht.height,yt,Ht.data):B.texSubImage2D(B.TEXTURE_2D,Ce,lt,pt,Fe,Xe,yt,et,Ht);B.pixelStorei(B.UNPACK_ROW_LENGTH,_t),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,fn),B.pixelStorei(B.UNPACK_SKIP_PIXELS,di),B.pixelStorei(B.UNPACK_SKIP_ROWS,tn),B.pixelStorei(B.UNPACK_SKIP_IMAGES,ui),Ce===0&&q.generateMipmaps&&B.generateMipmap(Ot),P.unbindTexture()},this.copyTextureToTexture3D=function(A,q,se=null,Q=null,V=0){return Cr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,q,se,Q,V)},this.initRenderTarget=function(A){He.get(A).__webglFramebuffer===void 0&&L.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?L.setTextureCube(A,0):A.isData3DTexture?L.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?L.setTexture2DArray(A,0):L.setTexture2D(A,0),P.unbindTexture()},this.resetState=function(){v=0,R=0,C=null,P.reset(),Ie.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Nn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=wt._getDrawingBufferColorSpace(e),t.unpackColorSpace=wt._getUnpackColorSpace()}};function dc(n){switch(n){case"hazardWire":return"wireSpark";case"hazardTruck":return"truckRickshaw";case"hazardTank":return"waterTank";case"hazardPit":return"roadPit";case"hazardSnake":return"giantSnake";case"hazardFood":return"chokeFood";case"hazardPhone":return"nightPhone";default:return"none"}}var uc={punching:{rate:2.2,impact:.35},kicking:{rate:1.6,impact:.4}};function li(n,e){let{rate:t,impact:i}=uc[e],s=(n*t%1+1)%1,r=s<i?1-Math.pow(1-s/i,3):Math.max(0,1-(s-i)/(1-i))**2,o=s>=i?Math.exp(-(s-i)*9):0;return{extend:r,recoil:o}}function fc(n,e,t){let i=new le;i.position.set(0,-.24,.05),n.add(i);let s=new le;s.position.set(0,-.24,.05),e.add(s);let r=new le;r.visible=!1;let o=new H({color:16317180,roughness:.65,side:Mt}),a=new H({color:14427686,roughness:.55}),l=new g(new Ee(.18,.34,.44,18,1,!1,-Math.PI*.65,Math.PI*1.3),o);l.position.set(0,.36,.03),l.castShadow=!0,r.add(l);let c=new g(new We(.165,.025,8,20),a);c.rotation.x=Math.PI/2+.14,c.position.set(0,.57,.02),r.add(c),t.add(r);let h=new le;h.visible=!1;let d=new H({color:16708551,roughness:.88}),u=new H({color:165063,roughness:.72}),p=new g(new We(.142,.022,8,20),d);p.rotation.x=Math.PI/2+.22,p.position.set(0,.505,-.01),h.add(p);let f=new g(new Ee(.165,.255,.34,14,1,!1,-Math.PI*.45,Math.PI*.9),d);f.position.set(0,.35,.03),f.rotation.y=Math.PI*.02,h.add(f);for(let Q of[-.095,.095]){let V=new g(new W(.072,.19,.014),d);V.position.set(Q,.34,.145),V.rotation.x=-.16,V.rotation.z=Q<0?.18:-.18,h.add(V);let Ce=new g(new W(.074,.024,.016),u);Ce.position.set(Q*1.06,.245,.16),Ce.rotation.x=-.16,Ce.rotation.z=Q<0?.18:-.18,h.add(Ce)}t.add(h);let E=new H({color:14870768,metalness:.9,roughness:.14}),M=new H({color:7877903,roughness:.52}),m=new H({color:16096779,metalness:.85,roughness:.22}),w=new H({color:14427686,roughness:.38}),y=new H({color:959977,roughness:.35}),x=new H({color:1976635,roughness:.45}),b={},v=new H({color:16317180,metalness:.72,roughness:.16,emissive:3359061,emissiveIntensity:.35}),R=new le,C=new le,_=new g(new W(.042,.32,.016),v);_.position.set(0,.16,0),C.add(_);let T=new g(new We(.048,.014,8,16),w);T.position.set(-.028,-.06,0),C.add(T),R.add(C);let I=new le,G=new g(new W(.042,.32,.016),v);G.position.set(0,.16,.008),I.add(G);let F=new g(new We(.048,.014,8,16),w);F.position.set(.028,-.06,.008),I.add(F),R.add(I);let k=new g(new Ee(.018,.018,.032,10),m);k.rotation.x=Math.PI/2,k.position.set(0,.02,.004),R.add(k),R.rotation.x=Math.PI*1.16,R.visible=!1,i.add(R),b.scissors=R;let Y=()=>{let Q=new le,V=new g(new W(.028,.22,.016),y);V.position.set(0,.1,0),Q.add(V);for(let Ce=-3;Ce<=3;Ce++){let Fe=new g(new W(.042,.012,.012),y);Fe.position.set(.024,.1+Ce*.026,0),Q.add(Fe)}return Q},X=Y();X.rotation.x=Math.PI*1.12,X.visible=!1,i.add(X),b.comb=X;let ie=Y();ie.rotation.x=Math.PI*1.12,ie.visible=!1,s.add(ie);let O=new le,re=new g(new We(.055,.014,8,16),m);re.position.y=.03,O.add(re);let ee=new g(new Ee(.014,.014,.22,8),m);ee.position.y=.16,O.add(ee);let be=new g(new W(.055,.045,.016),m);be.position.set(.032,.24,0),O.add(be),O.rotation.x=Math.PI*.35,O.visible=!1,i.add(O),b.key=O;let he=new le,ue=new g(new W(.11,.2,.018),x);ue.position.set(0,.08,.02),he.add(ue);let $=new De({color:3718648}),ge=new g(new rt(.09,.16),$);ge.position.set(0,.08,.03),he.add(ge),he.visible=!1,i.add(he),b.phone=he;let Ae=new le,xe=new g(new Ee(.018,.02,.28,10),M);xe.position.y=.14,Ae.add(xe);let J=new g(new Ee(.052,.052,.16,12),M);J.rotation.z=Math.PI/2,J.position.y=.26,Ae.add(J);let Me=new g(new Ee(.055,.055,.03,12),m);Me.rotation.z=Math.PI/2,Me.position.y=.26,Ae.add(Me),Ae.rotation.x=Math.PI*.42,Ae.visible=!1,i.add(Ae),b.gavel=Ae;let j=new le,te=new g(new Ee(.02,.016,.22,10),x);te.position.y=.11,j.add(te);let ve=new g(new ce(.048,12,10),E);ve.position.y=.23,j.add(ve),j.rotation.x=Math.PI*.25,j.visible=!1,i.add(j),b.mic=j;let de=new le,B=new g(new Ee(.068,.048,.11,14),new H({color:14251782,roughness:.72}));B.position.y=.06,de.add(B);let we=new g(new Ct(.058,12),new H({color:11817737,roughness:.25}));we.rotation.x=-Math.PI/2,we.position.y=.112,de.add(we),de.visible=!1,i.add(de),b.teacup=de;let N=new le,Ge=new g(new Ee(.014,.014,.36,8),E);Ge.position.y=.18,N.add(Ge);let P=new g(new ce(.065,12,8,0,Math.PI*2,0,Math.PI*.55),E);P.rotation.x=Math.PI,P.position.set(0,.36,.03),N.add(P),N.rotation.x=Math.PI*.35,N.visible=!1,i.add(N),b.ladle=N;let ae=new le,He=new g(new We(.08,.012,8,16,Math.PI*1.4),x);He.position.y=.12,ae.add(He);let L=new g(new Ee(.045,.045,.025,12),E);L.rotation.x=Math.PI/2,L.position.set(0,.22,.03),ae.add(L),ae.visible=!1,i.add(ae),b.stethoscope=ae;let S=new le,z=new g(new Ee(.038,.038,.22,12),y);z.position.y=.14,S.add(z);let oe=new g(new $e(.012,.12,8),E);oe.position.y=.31,S.add(oe),S.rotation.x=Math.PI*.45,S.visible=!1,i.add(S),b.syringe=S;let me=new le,fe=new g(new $e(.085,.055,14),m);fe.rotation.x=Math.PI,fe.position.y=.04,me.add(fe);let Ve=new g(new $e(.025,.08,10),new De({color:16707722}));Ve.position.y=.1,me.add(Ve),me.visible=!1,i.add(me),b.diya=me;let Le=new le,pe=new g(new Ee(.018,.018,.46,10),m);pe.rotation.z=Math.PI/2,pe.position.set(.14,.04,.04),Le.add(pe),Le.visible=!1,i.add(Le),b.flute=Le;let Ze=new le,_e=new g(new W(.18,.24,.045),w);_e.position.set(0,.1,.04),Ze.add(_e);let ke=new g(new W(.16,.22,.036),new H({color:16710888}));ke.position.set(.01,.1,.04),Ze.add(ke),Ze.visible=!1,i.add(Ze),b.book=Ze;let Ke=new le,je=new g(new Ee(.018,.022,.56,10),M);je.position.y=.28,Ke.add(je),Ke.rotation.x=Math.PI*.25,Ke.visible=!1,i.add(Ke),b.baton=Ke;let Oe=new le,Pe=new g(new Ee(.012,.012,.11,8),new H({color:16777215}));Pe.position.y=.06,Oe.add(Pe),Oe.rotation.x=Math.PI*.35,Oe.visible=!1,i.add(Oe),b.chalk=Oe;let Te=new le,Ie=new g(new Ee(.016,.016,.92,10),m);Ie.position.y=.36,Te.add(Ie);let U=new g(new $e(.032,.16,8),m);U.position.y=.88,Te.add(U);for(let Q of[-1,1]){let V=new g(new $e(.022,.14,8),m);V.position.set(Q*.065,.82,0),V.rotation.z=-Q*.25,Te.add(V)}Te.visible=!1,i.add(Te),b.trishul=Te;let ye=new le,Z=new g(new We(.32,.02,8,22,Math.PI),m);Z.rotation.z=-Math.PI/2,Z.position.set(0,.18,.05),ye.add(Z),ye.visible=!1,i.add(ye),b.bow=ye;let K=new le,Se=new g(new Ee(.02,.028,.56,10),m);Se.position.y=.24,K.add(Se);let Re=new g(new ce(.115,14,12),m);Re.scale.set(1,1.18,1),Re.position.y=.56,K.add(Re);let Ue=new g(new We(.112,.016,6,14),m);Ue.rotation.x=Math.PI/2,Ue.position.y=.56,K.add(Ue),K.rotation.x=Math.PI*.28,K.visible=!1,i.add(K),b.gada=K;let ot=new le,ft=new g(new W(.14,.08,.025),new H({color:2278750,roughness:.45}));ft.position.set(0,.05,.04),ot.add(ft),ot.visible=!1,i.add(ot),b.money=ot;let it=new le,Dt=new g(new Ee(.016,.016,.65,8),M);Dt.position.y=.22,it.add(Dt);let Xt=new g(new $e(.09,.22,10),new H({color:16638023,roughness:.9}));Xt.position.y=-.14,it.add(Xt),it.visible=!1,i.add(it),b.broom=it;let on=new le,Hi=new g(new Ee(.014,.014,.55,8),x);Hi.position.y=.26,on.add(Hi);let gn=new g(new $e(.32,.14,14),w);gn.position.y=.52,on.add(gn),on.visible=!1,i.add(on),b.umbrella=on;let dn=new le,ci=new g(new Ee(.12,.09,.022,14),E);ci.position.y=.02,dn.add(ci);for(let Q of[-.04,.04,0]){let V=new g(new ce(.036,10,8),new H({color:16096779,roughness:.45}));V.position.set(Q,.055,Q===0?.035:-.02),dn.add(V)}dn.visible=!1,i.add(dn),b.sweetplate=dn;let Jt=new le,Hn=new g(new W(.11,.22,.02),d);Hn.position.set(.01,-.15,.015),Hn.rotation.x=.04,Jt.add(Hn);let Zn=new g(new W(.114,.035,.023),u);Zn.position.set(.01,-.23,.018),Zn.rotation.x=.04,Jt.add(Zn),Jt.visible=!1,i.add(Jt),b.towel=Jt;let un=new le,hi=new g(new Ee(.055,.068,.18,12),y);hi.position.y=.09,un.add(hi);let Pi=new g(new W(.09,.04,.035),v);Pi.position.set(.025,.2,0),un.add(Pi),un.rotation.x=Math.PI*.42,un.visible=!1,i.add(un),b.sprayBottle=un;let Pn=new le,Ii=new g(new Ee(.014,.018,.24,8),new H({color:1409085,roughness:.65}));Ii.position.y=.08,Pn.add(Ii);let Di=new H({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.28}),os=new H({color:16020150,emissive:14362487,emissiveIntensity:.25,roughness:.34});for(let Q=0;Q<8;Q++){let V=Q/8*Math.PI*2,Ce=new g(new $e(.042,.13,6),Q%2===0?os:Di);Ce.position.set(Math.cos(V)*.068,.22,Math.sin(V)*.068),Ce.rotation.z=-Math.cos(V)*.62,Ce.rotation.x=Math.sin(V)*.62,Pn.add(Ce)}let Li=new g(new ce(.048,10,8),Di);Li.position.y=.22,Pn.add(Li),Pn.rotation.x=Math.PI*.18,Pn.visible=!1,i.add(Pn),b.lotus=Pn;let In=new le,A=new H({color:16498468,emissive:16096779,emissiveIntensity:.78,metalness:.85,roughness:.14}),q=new g(new We(.14,.022,8,22),A);q.position.y=.2,In.add(q);let se=new g(new kt(.055,0),A);se.position.y=.2,In.add(se);for(let Q=0;Q<10;Q++){let V=Q/10*Math.PI*2,Ce=new g(new $e(.022,.065,4),A);Ce.position.set(Math.cos(V)*.165,.2+Math.sin(V)*.165,0),Ce.rotation.z=V-Math.PI/2,In.add(Ce)}return In.visible=!1,i.add(In),b.chakra=In,{rightGroup:i,leftGroup:s,capeGroup:r,towelNeckGroup:h,rightMeshes:b,leftComb:ie,scissorUpper:C,scissorLower:I,phoneScreen:$,diyaFlame:Ve}}function Ed(n,e,t,i,s,r){if(!n)return;let o=t==="removingTowel"?"towel":e&&e!=="none"?e:null;for(let a of Object.keys(n.rightMeshes))n.rightMeshes[a].visible=a===o;if(n.leftComb.visible=o==="scissors"||o==="comb",n.capeGroup.visible=r&&o!=="scissors",n.towelNeckGroup.visible=r&&o!=="scissors"&&t!=="removingTowel",o==="scissors"&&n.scissorUpper&&n.scissorLower){let l=.05+Math.pow(.5+.5*Math.sin(i*(t==="cutting"||s?18:8.5)),2)*.42;n.scissorUpper.rotation.z=l,n.scissorLower.rotation.z=-l}if(o==="phone"&&n.phoneScreen&&n.phoneScreen.color.setHex(Math.sin(i*9)>0?3718648:8246268),o==="diya"&&n.diyaFlame){let a=.85+.25*Math.sin(i*14);n.diyaFlame.scale.set(a,.9+.3*Math.cos(i*11),a)}o==="chakra"&&n.rightMeshes.chakra&&(n.rightMeshes.chakra.rotation.z=i*5.2)}function gd(n,e,t,i){if(i||n==="BrainrotLog"||n==="CupDancer"||n==="CartoonTank"||n==="ComicBobble")return null;let s=(e||"").toLowerCase();return/narasimha|narsimha|narsingh|नरसिंह|नृसिंह/.test(s)?"narasimha":/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/.test(s)?"asuraKing":/hanuman|maruti|bajrang|pavanputra|हनुमान|मारुति|बजरंग/.test(s)?"hanuman":/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/.test(s)?"shiv":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/.test(s)?"krishna":/ram|raghav|raghunath|राम|राघव/.test(s)?"ram":/vishnu|hari|narayan|vasudev|विष्णु|हरि|नारायण|वासुदेव/.test(s)?"vishnu":n==="NobleWoman"?"devi":n==="ChildDevotee"?"prahladChild":n==="SageRishi"?"rishi":(t==="Temple"||t==="ForestAshram"||t==="RiverGhat"||t==="Himalaya"||t==="PalaceCourt"||t==="Cosmos")&&(n==="KingCrown"||n==="Divine"||n==="Warrior")?"genericSacred":null}function Md(n,e){switch(n){case"narasimha":return{skin:14261851,robe:14251782,sash:12131356,scale:1.18};case"asuraKing":return{skin:8867380,robe:8330525,sash:16096779,scale:1.07};case"hanuman":return{skin:14711612,robe:15357964,sash:16436245,scale:1.08};case"shiv":return{skin:13358561,robe:9584654,sash:16347926,scale:1.1};case"krishna":return{skin:6000370,robe:15381256,sash:14427686,scale:1.04};case"ram":return{skin:8234216,robe:14251782,sash:12131356,scale:1.05};case"vishnu":return{skin:6788331,robe:16096779,sash:14427686,scale:1.12};case"prahladChild":return{skin:15250056,robe:15357964,sash:16498468,scale:.78};case"rishi":return{skin:e.skin,robe:12735506,sash:16638082,scale:.98};default:return{skin:e.skin,robe:e.robe,sash:e.sash,scale:1}}}function yd(n,e,t){let i=new H({color:t,roughness:.44,metalness:.04}),s=new H({color:15119740,roughness:.48}),r=new H({color:5972257,roughness:.35}),o=new H({color:8138002,roughness:.62}),a=new H({color:14251782,emissive:7877903,emissiveIntensity:.18,roughness:.52}),l=new H({color:16498468,emissive:11817737,emissiveIntensity:.25,roughness:.42}),c=new H({color:16776693,roughness:.18,metalness:.05}),h=new H({color:16236088,metalness:.88,roughness:.2}),d=new g(new ce(e*1.04,24,18),i);d.scale.set(1.06,1.04,1.04),d.castShadow=!0,n.add(d);for(let ie of[-1,1]){let O=new g(new ce(e*.42,12,10),s);O.scale.set(1.05,.82,.95),O.position.set(ie*e*.54,-e*.12,e*.68),n.add(O);let re=new g(new $e(e*.24,e*.44,8),i);re.position.set(ie*e*.88,e*.72,-e*.04),re.rotation.z=-ie*.48,re.rotation.x=.12,n.add(re)}let u=new g(new W(e*.52,e*.54,e*.62),s);u.position.set(0,-e*.04,e*.86),u.rotation.x=.22,n.add(u);for(let ie of[-1,1]){let O=new g(new ce(e*.27,14,10),s);O.scale.set(1.1,.78,1.15),O.position.set(ie*e*.24,-e*.25,e*1.08),n.add(O);for(let re=0;re<3;re++){let ee=new g(new Ee(.004,.0015,e*.65,4),c);ee.rotation.z=ie*(Math.PI*.44+(re-1)*.16),ee.rotation.y=ie*-.22,ee.position.set(ie*e*.58,-e*(.2+re*.06),e*1.12),n.add(ee)}}let p=new g(new $e(e*.22,e*.24,4),r);p.rotation.x=Math.PI*.52,p.rotation.z=Math.PI*.25,p.position.set(0,-e*.11,e*1.26),n.add(p);let f=-e*.46,E=new g(new ce(e*.34,14,10),new De({color:7016218}));E.scale.set(1.05,.48,.85),E.position.set(0,f+e*.04,e*.96),n.add(E);let M=new g(new gt(e*.052,e*.42,4,8),s);M.rotation.z=Math.PI/2,M.position.set(0,f+e*.14,e*1.16),n.add(M);let m=new le;m.position.set(0,f+e*.02,e*.72),n.add(m);let w=new g(new ce(e*.32,14,10),s);w.scale.set(1.06,.65,1.18),w.position.set(0,-e*.14,e*.34),m.add(w);let y=new g(new gt(e*.052,e*.38,4,8),s);y.rotation.z=Math.PI/2,y.position.set(0,-e*.04,e*.46),m.add(y);for(let ie of[-1,1]){let O=new g(new $e(e*.068,e*.3,8),c);O.rotation.x=Math.PI,O.position.set(ie*e*.24,f+e*.02,e*1.22),n.add(O);let re=new g(new $e(e*.056,e*.24,8),c);re.position.set(ie*e*.2,e*.02,e*.48),m.add(re)}let x=new H({color:16707722,emissive:16096779,emissiveIntensity:.72,roughness:.15}),b=new H({color:1705218,emissive:8133904,emissiveIntensity:.25,roughness:.1}),v=new H({color:t,roughness:.46}),R=new H({color:8138002,roughness:.55}),C=ie=>{let O=ie*e*.4,re=e*.14,ee=e*.92,be=new g(new ce(e*.175,14,12),x);be.scale.set(1.05,.92,.65),be.position.set(O,re,ee),n.add(be);let he=new g(new ce(e*.095,12,10),b);he.scale.set(.68,1.15,.7),he.position.set(O,re,ee+e*.125),n.add(he);let ue=new g(new ce(e*.185,12,10,0,Math.PI*2,0,Math.PI*.52),v);ue.scale.set(1.05,.95,.68),ue.position.set(O,re,ee),ue.rotation.x=-Math.PI*.56,n.add(ue);let $=new g(new gt(e*.06,e*.28,5,8),R);return $.rotation.z=Math.PI/2-ie*.38,$.position.set(O,re+e*.24,ee+e*.1),n.add($),{sclera:be,pupil:he,eyelid:ue,brow:$}},_=C(-1),T=C(1),I=new H({color:16776171,emissive:16639626,emissiveIntensity:.45}),G=new H({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let ie of[-1,1]){let O=new g(new W(e*.055,e*.44,e*.05),I);O.position.set(ie*e*.095,e*.48,e*.96),O.rotation.z=-ie*.1,n.add(O)}let F=new g(new W(e*.22,e*.07,e*.05),I);F.position.set(0,e*.27,e*.98),n.add(F);let k=new g(new gt(e*.032,e*.32,4,8),G);k.position.set(0,e*.48,e*.99),n.add(k);let Y=new le;for(let ie=0;ie<2;ie++){let O=ie===0?16:14,re=e*(ie===0?1.18:1.02),ee=ie===0?-e*.08:-e*.34;for(let be=0;be<O;be++){let he=be/O*Math.PI*2;if(Math.sin(he)<-.78&&Math.abs(Math.cos(he))<.38&&ie===0)continue;let ue=(be+ie)%3===0?l:be%2===0?a:o,$=new g(new $e(e*(ie===0?.32:.36),e*(ie===0?.88:1.04),7),ue);$.position.set(Math.cos(he)*re,Math.sin(he)*re*1.04,ee),$.rotation.z=he-Math.PI/2,$.rotation.x=ie===0?-.18:-.35,$.castShadow=!0,Y.add($)}}let X=new g(new ce(e*1.16,16,12),o);return X.scale.set(1.22,1.26,.82),X.position.set(0,-e*.12,-e*.48),Y.add(X),n.add(Y),pc(n,e*.96,h,"narasimha"),{leftEye:_,rightEye:T,mouthCavity:E,upperLip:M,lowerLip:y,mouthBaseY:f,lowerJawPivot:m}}function pc(n,e,t,i){let s=new le;s.position.y=i==="narasimha"?e*.84:e*.86;let r=i==="asuraKing",o=r?new H({color:11817737,metalness:.88,roughness:.24}):t,a=new g(new Ee(e*.78,e*.86,e*.3,20),o);a.castShadow=!0,s.add(a);let l=r?7:5;for(let f=0;f<l;f++){let E=(f-(l-1)/2)/l*Math.PI*.85,M=r?e*(.45+f%2*.22):e*(.42-Math.abs(f-2)*.08),m=new g(new $e(e*.13,M,8),t);m.position.set(Math.sin(E)*e*.76,e*.22,Math.cos(E)*e*.76),m.rotation.z=-Math.sin(E)*(r?.42:.16),s.add(m)}if(r){let f=new H({color:16096779,metalness:.9,roughness:.18});for(let E of[-1,1]){let M=new g(new $e(e*.16,e*.92,10),f);M.position.set(E*e*.88,e*.48,0),M.rotation.z=-E*.62,M.rotation.x=-.18,s.add(M)}}let c=new g(new Ee(e*.46,e*.68,e*.34,16),o);c.position.y=e*.3,s.add(c);let h=new g(new $e(e*.42,e*.56,16),t);h.position.y=e*.7,s.add(h);let d=new g(new ce(e*.11,10,8),t);d.position.y=e*1,s.add(d);let u=r?14427686:i==="narasimha"?16096779:i==="krishna"?1096065:2282478,p=new g(new kt(e*.16,0),new H({color:u,emissive:u,emissiveIntensity:.65,metalness:.25,roughness:.1}));if(p.position.set(0,e*.06,e*.84),s.add(p),i==="krishna"){let f=new g(new Ee(.012,.012,e*1.1,6),t);f.position.set(e*.28,e*.85,e*.12),f.rotation.z=-.35,s.add(f);let E=new g(new ce(e*.2,12,10),new H({color:366185,emissive:959977,emissiveIntensity:.45}));E.scale.set(.85,1.3,.35),E.position.set(e*.46,e*1.32,e*.14),E.rotation.z=-.35,s.add(E)}n.add(s)}function xd(n,e,t,i){let s=new H({color:1315098,roughness:.68}),r=new H({color:16776171,roughness:.22}),o=new H({color:4528669,metalness:.65,roughness:.32});for(let h of[-1,1]){let d=new g(new $e(t*.14,t*.36,8),o);d.position.set(h*t*1.02,t*.04,0),d.rotation.z=-h*.95,n.add(d)}for(let h of[-1,1]){let d=new g(new gt(t*.055,t*.26,4,8),s);d.rotation.z=Math.PI*.5+h*.38,d.position.set(h*t*.19,-t*.2,t*.94),n.add(d);let u=new g(new $e(t*.045,t*.19,8),r);u.position.set(h*t*.24,-t*.29,t*.92),u.rotation.z=-h*.22,n.add(u)}let a=new g(new $e(t*.28,t*.54,10),s);a.rotation.x=Math.PI,a.position.set(0,-t*.72,t*.58),n.add(a);let l=new g(new W(t*.42,t*.075,t*.04),new H({color:14427686,emissive:8330525,emissiveIntensity:.4}));l.position.set(0,t*.26,t*.95),n.add(l);for(let h of[-1,1]){let d=new g(new ce(.145,14,10,0,Math.PI*2,0,Math.PI*.58),i);d.scale.set(1.15,.82,1.05),d.position.set(h*.26,.57,.02),d.rotation.z=-h*.32,e.add(d)}let c=new g(new Ee(.275,.225,.34,16),o);c.position.set(0,.4,.015),e.add(c)}function Td(n,e,t,i,s,r,o,a,l,c,h){let d={pattaEnds:[]};if(!o)return d;let u=o==="narasimha"?12131356:o==="prahladChild"?16498468:l,p=o==="narasimha"||o==="vishnu"||o==="krishna"?16096779:a,f=new H({color:u,roughness:.46,metalness:.14,side:Mt}),E=new H({color:p,roughness:.5,metalness:.12});if(h&&t&&i){for(let v of[t,i]){let R=new g(new Ee(.122,.114,.28,14),E);R.position.y=-.14,R.castShadow=!0,v.add(R);let C=new g(new We(.114,.015,6,16),c);C.rotation.x=Math.PI/2,C.position.y=-.27,v.add(C)}let x=new g(new Ee(.06,.135,.42,12,1,!1,-Math.PI*.35,Math.PI*.7),E);x.position.set(0,.02,.16),e.add(x);let b=new g(new W(.055,.42,.02),c);b.position.set(0,.02,.21),e.add(b)}let M=new mn([new D(-.28,.05,.18),new D(-.25,.48,.08),new D(0,.62,-.18),new D(.25,.48,.08),new D(.28,.05,.18)]),m=new g(new An(M,24,.036,8,!1),f);m.castShadow=!0,e.add(m);for(let x of[-1,1]){let b=new g(new W(.08,.36,.015),f);b.position.set(x*.26,.16,.15),b.rotation.z=x*.12;let v=new g(new W(.085,.045,.018),c);v.position.y=-.16,b.add(v),e.add(b),d.pattaEnds.push(b)}let w=new g(new ce(.055,10,8),new H({color:14427686,emissive:8330525,emissiveIntensity:.45}));w.scale.set(1.2,1,.55),w.position.set(0,.24,.235),e.add(w);let y=new g(new We(.17,.019,8,22),c);y.rotation.x=Math.PI/2+.38,y.position.set(0,.46,.08),e.add(y);for(let x of[s,r]){let b=new g(new We(.068,.016,8,16),c);b.rotation.x=Math.PI/2,b.position.y=-.18,x.add(b)}if(o==="vishnu"||o==="narasimha"){let x=new g(new kt(.056,0),new H({color:14753096,emissive:10424889,emissiveIntensity:.65,metalness:.35,roughness:.14}));x.scale.set(1,1.25,.55),x.position.set(0,.44,.255),e.add(x)}if(o==="shiv"){let x=new g(new We(.098,.022,8,20),new H({color:2450411,emissive:1920728,emissiveIntensity:.72,roughness:.28}));x.rotation.x=Math.PI/2+.15,x.position.set(0,.64,.02),e.add(x);let b=new H({color:1976635,metalness:.35,roughness:.32}),v=new g(new We(.165,.026,8,22,Math.PI*1.48),b);v.rotation.x=Math.PI/2+.22,v.rotation.z=-.35,v.position.set(0,.59,.02),e.add(v);let R=new g(new ce(.055,10,8),b);R.scale.set(.95,1.35,.55),R.position.set(.165,.68,.08),e.add(R);for(let T of[-.016,.016]){let I=new g(new ce(.009,6,6),c);I.position.set(.165+T,.695,.11),e.add(I)}let C=new H({color:8138002,roughness:.62});for(let T=0;T<14;T++){let I=T/14*Math.PI*2,G=new g(new ce(.022,8,6),C);G.position.set(Math.sin(I)*.155,.5-Math.cos(I)*.06,Math.cos(I)*.18),e.add(G)}let _=new H({color:2694420,roughness:.78});for(let[T,I,G]of[[-.14,.14,.22],[.12,.1,.23],[-.04,.02,.24],[.16,-.02,.18]]){let F=new g(new ce(.036,8,6),_);F.scale.set(1.2,.7,.35),F.position.set(T,I,G),e.add(F)}}if(o==="narasimha"||o==="vishnu"||o==="krishna"||o==="ram"||o==="hanuman"){let b=new mn([new D(-.18,.58,.11),new D(-.22,.22,.24),new D(0,-.02,.27),new D(.22,.22,.24),new D(.18,.58,.11)]).getPoints(18),v=new H({color:16710888,roughness:.55}),R=new H({color:16007006,roughness:.45});b.forEach((C,_)=>{let T=new g(new ce(_%3===0?.038:.026,8,6),_%3===0?R:v);T.position.copy(C),e.add(T)})}if(o==="narasimha"||o==="vishnu"){let x=o==="vishnu"?6788331:14261851,b=new H({color:x,roughness:.44}),v=new H({color:16776693,emissive:16708551,emissiveIntensity:.2,metalness:.25,roughness:.2});if(o==="narasimha")for(let R of[s,r])for(let C=-2;C<=2;C++){let _=new g(new $e(.012,.095,6),v);_.position.set(C*.022,-.31,.035),_.rotation.x=Math.PI+.35,R.add(_)}for(let R of[-1,1]){let C=new le;C.position.set(R*.27,.54,-.1),C.rotation.set(-.22,0,-R*.48),e.add(C);let _=new g(new gt(.056,.28,6,8),b);_.position.y=.22,C.add(_);let T=new le;if(T.position.set(0,.44,.02),C.add(T),R===1){let I=new le,G=new g(new We(.18,.025,8,24),new H({color:16498468,emissive:16096779,emissiveIntensity:.72,metalness:.85,roughness:.15}));I.add(G);for(let F=0;F<12;F++){let k=F/12*Math.PI*2,Y=new g(new $e(.026,.07,4),c);Y.position.set(Math.cos(k)*.21,Math.sin(k)*.21,0),Y.rotation.z=k-Math.PI/2,I.add(Y)}T.add(I),d.chakraWheel=I}else{let I=new le,G=new H({color:16710888,emissive:16708551,emissiveIntensity:.18,roughness:.28}),F=new g(new $e(.095,.26,14),G);F.rotation.x=.35,I.add(F);let k=new g(new We(.088,.015,6,14),c);k.rotation.x=Math.PI/2,I.add(k),T.add(I)}}}return d}var bd=["devi","mata","durga","lakshmi","laxmi","saraswati","parvati","sita","radha","\u0926\u0947\u0935\u0940","\u092E\u093E\u0924\u093E","\u0926\u0941\u0930\u094D\u0917\u093E","\u0932\u0915\u094D\u0937\u094D\u092E\u0940","\u0938\u0930\u0938\u094D\u0935\u0924\u0940","\u092A\u093E\u0930\u094D\u0935\u0924\u0940","\u0938\u0940\u0924\u093E","\u0930\u093E\u0927\u093E"];function _E(n,e){return e==="Warrior"||e==="KingCrown"||e==="BrainrotLog"||e==="CupDancer"||e==="CartoonTank"||e==="ComicBobble"||e!=="Narrator"&&(n==="Temple"||n==="ForestAshram"||n==="RiverGhat"||n==="Himalaya")?!0:n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="Battlefield"||n==="PalaceCourt"||n==="ModernCity"||n==="Village"||n==="Archive"}function Ec(n){return n==="ComedyStage"||n==="ChaiStall"||n==="SkyGauntlet"||n==="TankArena"||n==="DoorwaySet"||n==="Bedroom"||n==="LivingRoom"||n==="Kitchen"||n==="SweetShop"||n==="BarberShop"||n==="Courtroom"||n==="DoctorClinic"||n==="Classroom"||n==="QuizStudio"||n==="NeighborhoodGate"||n==="ModernCity"}function SE(n,e,t){let i=2907274,s=new Ne(t).getHex(),r=15250056,o=!1;switch(n){case"KingCrown":i=10036282,s=16105016;break;case"SageRishi":i=14247960,s=16638082;break;case"Divine":i=2974425,s=16767040,r=6000111,o=!0;break;case"ChildDevotee":i=15376156,s=14239782;break;case"NobleWoman":i=12725078,s=16303174;break;case"Warrior":i=7557683,s=12962774;break;case"BrainrotLog":i=10115880,s=16436245,r=12088894;break;case"CupDancer":i=16317180,s=16020150,r=16777215;break;case"CartoonTank":i=5078079,s=16436245,r=3560212;break;case"ComicBobble":i=16347926,s=3718648,r=15843995;break;default:i=3104660;break}return e&&/^#?[0-9a-fA-F]{6}$/.test(e.trim())&&(i=new Ne(e.startsWith("#")?e:`#${e}`).getHex()),{robe:i,sash:s,skin:r,isDivine:o}}function vE(n,e,t,i){let s=[new Be(n*.68,-.05),new Be(n,.02),new Be(n*.98,i*.22),new Be(e,i*.48),new Be(t,i*.82),new Be(t*.62,i*.98),new Be(.01,i)];return new si(s,24)}function bE(n){let e=new le,t=new H({color:3876421,roughness:.45,metalness:.3}),i=new g(new Ee(.42,.48,.08,24),t);i.position.y=.04,i.receiveShadow=!0,i.castShadow=!0,e.add(i);let s=new H({color:16020150,emissive:n,emissiveIntensity:.22,roughness:.35});for(let a=0;a<12;a++){let l=a/12*Math.PI*2,c=new g(new ce(.11,10,8),s);c.scale.set(1.2,.45,2),c.position.set(Math.cos(l)*.36,.08,Math.sin(l)*.36),c.rotation.y=-l+Math.PI*.5,c.rotation.x=.22,e.add(c)}let r=new De({color:n,transparent:!0,opacity:.35,side:Mt,depthWrite:!1}),o=new g(new zn(.32,.52,32),r);return o.rotation.x=-Math.PI/2,o.position.y=.015,e.add(o),{group:e,glowMesh:o}}function RE(n,e,t,i,s,r,o,a,l){let c=new H({color:l&&/^#?[0-9a-fA-F]{6}$/.test(l.trim())?new Ne(l.startsWith("#")?l:`#${l}`):1972516,roughness:.72}),h=new H({color:14277862,roughness:.6}),d=new H({color:16103470,metalness:.85,roughness:.22}),u=t.toLowerCase(),p=e==="SageRishi"&&(u.includes("narad")||u.includes("\u0928\u093E\u0930\u0926")),f=e==="NobleWoman"&&bd.some(m=>u.includes(m)),E=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|harishchandra|dashrath|yudhishthir|duryodhan|bali|bhasmasur|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य|हरिश्चंद्र|दशरथ|युधिष्ठिर|दुर्योधन|बलि/i.test(u);if(e==="KingCrown"&&!E&&(o==="turban"||i==="PalaceCourt"||/sartaaj|sufi|shayar|prince|dulha|singer/i.test(u))&&!/maharaj|raja|samrat|emperor/i.test(u)){let m=new g(new ce(s*1.02,20,14,0,Math.PI*2,0,Math.PI*.42),c);m.rotation.x=-.32,n.add(m);let w=new le,y=i==="PalaceCourt"?16117734:r??10036282,x=new H({color:y,roughness:.62}),b=new g(new ce(s*1.08,22,16,0,Math.PI*2,0,Math.PI*.52),x);b.scale.set(1.04,.78,1.06),b.position.set(0,s*.48,-s*.06),b.castShadow=!0,w.add(b);for(let T=0;T<3;T++){let I=new g(new We(s*(.94+(T===1?.04:0)),s*.105,10,24),T===1?x:new H({color:y,roughness:.55}));I.rotation.x=Math.PI/2-.28+T*.1,I.rotation.z=(T-1)*.14,I.position.set(0,s*(.6+T*.14),-s*.02),I.castShadow=!0,w.add(I)}let v=new g(new kt(s*.15,0),d);v.position.set(s*.16,s*1.02,s*.74),w.add(v);let R=new g(new $e(s*.12,s*.44,8),new H({color:16708551,emissive:14251782,emissiveIntensity:.25,roughness:.45}));R.position.set(s*.19,s*1.26,s*.64),R.rotation.z=-.2,R.rotation.x=-.16,w.add(R),n.add(w);let C=new g(new ce(s*.46,14,10),c);C.scale.set(1.22,.65,.78),C.position.set(0,-s*.72,s*.54),n.add(C);let _=new g(new gt(s*.036,s*.28,4,8),c);_.rotation.z=Math.PI/2,_.position.set(0,-s*.2,s*.94),n.add(_);return}if(e==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test(u)){let m=new H({color:3875604,roughness:.72}),w=new g(new ce(s*1.04,20,14,0,Math.PI*2,0,Math.PI*.48),m);w.scale.set(1.02,1.12,1),w.rotation.x=-.34,n.add(w);let y=new g(new ce(s*.46,16,14),m);y.scale.set(.88,1.32,.88),y.position.set(0,s*1.24,-s*.12),y.castShadow=!0,n.add(y);let x=new H({color:16317180,emissive:14742270,emissiveIntensity:.85,metalness:.45,roughness:.15}),b=new g(new We(s*.25,s*.048,8,20,Math.PI*1.22),x);b.position.set(-s*.36,s*1.12,s*.26),b.rotation.z=Math.PI*.68,b.rotation.y=.22,n.add(b);let v=new H({color:3718648,emissive:8246268,emissiveIntensity:.65,roughness:.18}),R=new mn([new D(.02,s*1.62,-s*.08),new D(s*.22,s*1.78,-s*.16),new D(s*.42,s*1.48,-s*.34),new D(s*.48,s*.96,-s*.56)]);n.add(new g(new An(R,16,s*.055,8,!1),v));let C=new g(new We(s*.42,s*.042,8,16),d);C.rotation.x=Math.PI/2,C.position.set(0,s*.96,-s*.12),n.add(C);return}if(e==="KingCrown"||e==="Divine"||e==="NobleWoman"&&(f||i!=="PalaceCourt"&&(u.includes("rani")||u.includes("\u0930\u093E\u0928\u0940")))){let m=new g(new ce(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),c);m.scale.set(1.01,1.11,.99),m.rotation.x=-.34,n.add(m);let y=/hiranyakashipu|hiranyakashyap|ravan|kansa|kans|mahishasur|asur|daitya|हिरण्यकशिपु|हिरण्यकश्यप|रावण|कंस|महिषासुर|असुर|दैत्य/i.test(u)?"asuraKing":/krishna|madhav|govind|keshav|gopal|murlidhar|कृष्ण|माधव|गोविंद|गोपाल/i.test(u)?"krishna":/ram|raghav|raghunath|राम|राघव/i.test(u)?"ram":e==="Divine"?"vishnu":"sacred";if(pc(n,s,d,y),e==="NobleWoman"){let x=new g(new gt(s*.22,s*1.4,8,12),c);x.position.set(0,-s*.85,-s*.82),x.rotation.x=.24,n.add(x)}return}if(e==="SageRishi"){let m=p?new H({color:2892339,roughness:.7}):h,w=new g(new ce(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),m);w.scale.set(1.01,1.11,.99),w.rotation.x=-.36,n.add(w);let y=new g(new ce(s*.42,14,12),m);if(y.scale.set(.9,1.15,.9),y.position.set(0,s*1.24,-s*.16),y.castShadow=!0,n.add(y),!p){let x=new g(new $e(s*.52,s*.95,14),m);x.rotation.x=Math.PI,x.position.set(0,-s*.88,s*.48),n.add(x)}return}if(e==="ChildDevotee"){let m=new g(new ce(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.47),c);m.scale.set(1.01,1.11,.99),m.rotation.x=-.36,n.add(m);let w=new g(new ce(s*.22,10,8),c);if(w.scale.set(1.3,.65,.85),w.position.set(-s*.12,s*.78,s*.68),n.add(w),!Ec(i)){let y=new g(new We(s*.9,s*.065,10,24),d);y.rotation.x=Math.PI/2-.34,y.position.set(0,s*.55,s*.06),n.add(y);let x=new g(new kt(s*.13,0),new H({color:1096065,emissive:366185,emissiveIntensity:.6}));x.position.set(0,s*.62,s*.92),n.add(x)}return}if(e==="NobleWoman"){let m=new g(new ce(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),c);m.scale.set(1.01,1.11,.99),m.rotation.x=-.34,n.add(m);let w=new g(new gt(s*.24,s*1.45,8,12),c);w.position.set(0,-s*.85,-s*.85),w.rotation.x=.25,n.add(w);let y=new g(new ce(s*.1,10,8),d);y.position.set(0,s*.5,s*.94),n.add(y);return}if(e==="Warrior"){let m=new H({color:10594485,metalness:.78,roughness:.28}),w=new g(new ce(s*1.05,20,14,0,Math.PI*2,0,Math.PI*.47),m);w.scale.set(1.02,1.12,1),w.rotation.x=-.32,n.add(w);let y=new g(new We(s*.7,s*.12,8,16,Math.PI),new H({color:14427686,roughness:.6}));y.rotation.y=Math.PI/2,y.position.y=s*.86,n.add(y);return}if(e==="ComicBobble"||Ec(i)){let m=new le,w=(a??"").trim().toLowerCase();if(e==="ComicBobble"&&w==="bald"){for(let T of[-1,1]){let I=new g(new ce(s*.26,12,10),c);I.scale.set(.38,.8,1.2),I.position.set(T*s*.92,-s*.06,-s*.26),m.add(I)}let _=new g(new ce(s*.6,14,10),c);return _.scale.set(1.25,.42,.55),_.position.set(0,-s*.2,-s*.66),m.add(_),n.add(m),{hairFullGroup:m}}let y=new g(new ce(s*1.06,20,14,0,Math.PI*2,0,Math.PI*.5),c);if(y.scale.set(1.04,1.15,1.05),y.position.set(0,s*.06,-s*.02),y.rotation.x=-.15,m.add(y),e==="ComicBobble"&&w==="parted"){let _=new g(new ce(s*.5,14,10),c);_.scale.set(1.5,.5,1),_.position.set(s*.22,s*.9,s*.5),_.rotation.z=-.25,m.add(_)}else if(e==="ComicBobble"&&w==="curly"){for(let T=0;T<14;T++){let I=T/14*Math.PI*2,G=new g(new ce(s*.22,10,8),c);G.position.set(Math.cos(I)*s*.78,s*(.78+.12*Math.sin(T*1.7)),Math.sin(I)*s*.78),m.add(G)}let _=new g(new ce(s*.42,12,10),c);_.position.set(0,s*1.08,0),m.add(_)}else if(e==="ComicBobble"&&w==="ponytail"){let _=new g(new gt(s*.16,s*.7,6,10),c);_.position.set(0,s*.55,-s*1.05),_.rotation.x=.55,m.add(_);let T=new g(new We(s*.17,s*.05,6,12),new H({color:14753096,roughness:.5}));T.position.set(0,s*.86,-s*.86),T.rotation.x=.9,m.add(T);for(let I of[-1,1]){let G=new g(new gt(s*.09,s*.5,4,8),c);G.position.set(I*s*.78,s*.15,s*.42),m.add(G)}}else if(e==="ComicBobble"&&w==="short"){let _=new g(new ce(s*.4,12,10),c);_.scale.set(1.5,.4,1),_.position.set(0,s*.88,s*.5),m.add(_)}else if(e==="ComicBobble"){for(let T of[-.35,0,.35]){let I=new g(new $e(s*.15,s*.4,8),c);I.position.set(T*s*.85,s*1.14,s*.2),I.rotation.z=-T*.65,I.rotation.x=.24,m.add(I)}let _=new g(new ce(s*.38,12,10),c);_.scale.set(1.38,.56,.98),_.position.set(0,s*.92,s*.52),m.add(_)}else{let _=new g(new ce(s*.46,14,12),c);_.scale.set(1.48,.78,1.38),_.position.set(0,s*1.1,s*.36),m.add(_);let T=new g(new ce(s*.36,12,10),c);T.scale.set(1.42,.54,.96),T.position.set(0,s*.92,s*.56),m.add(T);for(let I of[-1,1]){let G=new g(new $e(s*.14,s*.34,8),c);G.position.set(I*s*.42,s*1.16,s*.26),G.rotation.z=-I*.48,G.rotation.x=.28,m.add(G)}}n.add(m);let x=new le;x.visible=!1;let b=new g(new We(s*.88,s*.11,8,22,Math.PI*1.15),c);b.rotation.x=Math.PI/2+.18,b.rotation.z=-Math.PI*.075,b.position.set(0,s*.16,-s*.1),x.add(b);let v=new g(new $e(s*.06,s*.16,6),c);v.position.set(0,s*1.08,-s*.12),x.add(v);let R=new H({color:16775399,emissive:16770229,emissiveIntensity:.48,roughness:.1}),C=new g(new ce(s*.25,12,10),R);return C.scale.set(1.3,.32,.92),C.position.set(.08*s,s*.92,s*.34),C.rotation.z=-.18,C.rotation.x=.28,x.add(C),n.add(x),{hairFullGroup:m,hairShavedGroup:x}}else{let m=new g(new ce(s*1.03,20,14,0,Math.PI*2,0,Math.PI*.48),c);m.scale.set(1.01,1.11,.99),m.rotation.x=-.35,n.add(m)}}function Rd(n,e,t,i,s,r){let o=new H({color:16317180,roughness:.18}),a=new H({color:1971218,roughness:.12}),l=new H({color:t,roughness:.48}),c=new H({color:i,roughness:.55}),h=r?1.38:1,d=R=>{let C=R*e*(r?.38:.36),_=e*.09,T=s,I=new g(new ce(e*.165*h,14,12),o);I.scale.set(1.06,.9,.56),I.position.set(C,_,T),n.add(I);let G=new g(new ce(e*.098*(r?1.15:1),12,10),a);G.scale.set(1,.95,.62),G.position.set(C,_,T+e*.068*h),n.add(G);let F=new g(new ce(e*.036*h,8,6),new De({color:16777215}));F.position.set(C+e*.032,_+e*.035,T+e*.115*h),n.add(F);let k=new g(new ce(e*.18*h,12,10,0,Math.PI*2,0,Math.PI*.52),l);k.scale.set(1.02,1.05,.65),k.position.set(C,_,T),k.rotation.x=-Math.PI*.48,n.add(k);let Y=new g(new gt(e*.034*h,e*.22*h,4,8),c);return Y.rotation.z=Math.PI/2,Y.position.set(C,_+e*.25*h,T+e*.08*h),n.add(Y),{sclera:I,pupil:G,eyelid:k,brow:Y}},u=d(-1),p=d(1),f=new H({color:t,roughness:.45}),E=new g(new ce(e*.085,10,8),f);E.scale.set(.8,1.15,.9),E.position.set(0,-e*.08,s+e*.065),n.add(E);let M=new H({color:16172100,metalness:.85,roughness:.22});for(let R of[-1,1]){let C=new g(new We(e*.085,e*.025,8,14),M);C.position.set(R*e*.94,-e*.14,e*.04),C.rotation.y=R*Math.PI*.42,n.add(C)}let m=-e*.36,w=s+e*.02,y=new g(new ce(e*(r?.22:.16),12,10),new De({color:5509406}));y.scale.set(1.1,.2,.45),y.position.set(0,m,w-.01),n.add(y);let x=new H({color:10896452,roughness:.42}),b=new g(new gt(e*.032,e*.22,4,8),x);b.rotation.z=Math.PI/2,b.position.set(0,m+e*.03,w+.03),n.add(b);let v=new g(new gt(e*.034,e*.19,4,8),x);return v.rotation.z=Math.PI/2,v.position.set(0,m-e*.03,w+.03),n.add(v),{leftEye:u,rightEye:p,mouthCavity:y,upperLip:b,lowerLip:v,mouthBaseY:m}}function CE(n,e,t,i,s,r,o,a){let l=new le,c=new le;l.add(c);let h=new g(new zn(.46,.58,36),new De({color:a,transparent:!0,opacity:.22,side:Mt,depthWrite:!1}));h.rotation.x=-Math.PI/2,h.position.y=.012,l.add(h);let d=new g(new Ct(.45,32),new De({color:a,transparent:!0,opacity:.08,side:Mt,depthWrite:!1}));d.rotation.x=-Math.PI/2,d.position.y=.01,l.add(d);let u=new H({color:s,roughness:.48,metalness:n==="CartoonTank"?.35:.06}),p=new H({color:r,roughness:.35,metalness:.35}),f=new H({color:2042167,roughness:.72}),E=new le,M=n==="CartoonTank"?.26:.44;E.position.y=M,c.add(E);let m=new le,w,y,x,b,v;if(n==="CartoonTank"){for(let ue of[-.36,.36]){let $=new g(new W(.22,.26,.92),f);$.position.set(ue,-.1,0),$.castShadow=!0,E.add($);for(let ge of[-.3,0,.3]){let Ae=new g(new Ee(.11,.11,.25,12),p);Ae.rotation.z=Math.PI/2,Ae.position.set(ue,-.12,ge),E.add(Ae)}}let ee=new g(new W(.68,.3,.84),u);ee.position.set(0,.14,0),ee.castShadow=!0,E.add(ee),w=new le,w.position.set(0,.42,-.02),E.add(w);let be=new g(new W(.56,.34,.56),u);be.castShadow=!0,w.add(be);let he=new g(new W(.58,.07,.58),p);he.position.y=-.1,w.add(he),y=new g(new Ee(.065,.08,.66,14),f),y.rotation.x=Math.PI/2,y.position.set(0,.04,.5),y.castShadow=!0,w.add(y),m.position.set(0,.1,0),w.add(m)}else if(n==="BrainrotLog"){let ee=$=>{let ge=new le;ge.position.set($*.14,-.05,0),E.add(ge);let Ae=new g(new gt(.065,.28,6,8),u);Ae.position.set(0,-.17,0),ge.add(Ae);let xe=new g(new ce(.1,10,8),p);return xe.scale.set(.9,.5,1.5),xe.position.set(0,-.34,.05),ge.add(xe),ge};b=ee(-1),v=ee(1);let be=new g(new Ee(.21,.25,.96,18),u);be.position.y=.44,be.castShadow=!0,E.add(be);let he=new g(new Ee(.18,.18,.04,16),new H({color:16639626}));he.position.y=.93,E.add(he);let ue=new g(new Ee(.025,.04,.18,8),u);ue.position.set(.06,1,0),ue.rotation.z=-.35,E.add(ue),m.position.set(0,.72,0),E.add(m)}else{let ee=ge=>{let Ae=new le;Ae.position.set(ge*.13,-.05,0),E.add(Ae);let xe=new g(new gt(.055,.3,6,8),f);xe.position.set(0,-.17,0),Ae.add(xe);let J=new g(new ce(.095,10,8),p);return J.scale.set(.95,.5,1.45),J.position.set(0,-.34,.05),Ae.add(J),Ae};b=ee(-1),v=ee(1);let be=new g(new Ee(.32,.22,.62,24),u);be.position.y=.34,be.castShadow=!0,E.add(be);let he=new g(new We(.315,.025,10,24),p);he.rotation.x=Math.PI/2,he.position.y=.65,E.add(he);let ue=new g(new Ct(.295,24),new H({color:4137748,roughness:.2}));ue.rotation.x=-Math.PI/2,ue.position.y=.62,E.add(ue);let $=new g(new We(.14,.034,8,16,Math.PI),u);$.rotation.z=-Math.PI/2,$.position.set(-.3,.36,0),E.add($),m.position.set(0,.42,0),E.add(m)}let _=Rd(m,n==="CartoonTank"?.26:.24,o,1120295,n==="CartoonTank"?.29:n==="CupDancer"?.28:.21,!0),T=n==="CupDancer"?new H({color:16777215,roughness:.4}):u,I=new gt(.048,.2,6,8),G=new gt(.042,.18,6,8),F=ee=>{let be=new le;be.position.set(ee*(n==="CartoonTank"?.33:.27),n==="CartoonTank"?.24:.45,0),E.add(be);let he=new g(I,T);he.position.y=-.11,be.add(he);let ue=new le;ue.position.y=-.22,be.add(ue);let $=new g(G,T);$.position.y=-.1,ue.add($);let ge=new g(new ce(.068,10,8),p);return ge.position.y=-.22,ue.add(ge),{shoulder:be,elbow:ue,glove:ge}},k=F(-1),Y=F(1),X=new le;X.position.set(0,-.25,.06);let ie=new g(new Ee(.11,.07,.08,14),new H({color:16317180,roughness:.35}));X.add(ie);let O=new g(new ce(.075,10,8),new H({color:16707722,roughness:.45}));O.scale.set(1.1,.55,1.1),O.position.y=.035,X.add(O),X.visible=!1,Y.elbow.add(X);let re=fc(Y.elbow,k.elbow,E);if(n==="BrainrotLog"){x=new le,x.position.set(0,-.22,.04);let ee=new g(new Ee(.065,.025,.65,10),new H({color:14251782,roughness:.45}));ee.position.y=-.28,ee.castShadow=!0,x.add(ee),Y.elbow.add(x)}return l.rotation.y=t*.36,{root:l,bodyPivot:c,torsoGroup:E,headPivot:m,leftShoulder:k.shoulder,leftElbow:k.elbow,rightShoulder:Y.shoulder,rightElbow:Y.elbow,leftHip:b,rightHip:v,snackProp:X,handProps:re,headY:n==="CartoonTank"?.78:n==="CupDancer"?.86:1.16,leftEyelid:_.leftEye.eyelid,rightEyelid:_.rightEye.eyelid,leftBrow:_.leftEye.brow,rightBrow:_.rightEye.brow,leftSclera:_.leftEye.sclera,rightSclera:_.rightEye.sclera,leftPupil:_.leftEye.pupil,rightPupil:_.rightEye.pupil,mouthCavity:_.mouthCavity,upperLip:_.upperLip,lowerLip:_.lowerLip,auraRing:h,auraDisc:d,turretGroup:w,cannonBarrel:y,propPivot:x,mouthBaseY:_.mouthBaseY,baseTorsoY:M,restScale:1,topY:n==="CartoonTank"?1.05:n==="CupDancer"?1.14:1.54,role:n,name:e,facingSign:t,standing:!0,seedOffset:i}}function Da(n,e,t,i,s){let r=n.role,o=_E(t,r),a=SE(r,n.robeHex,e);n.skinHex&&/^#?[0-9a-fA-F]{6}$/.test(n.skinHex.trim())&&(a.skin=new Ne(n.skinHex.startsWith("#")?n.skinHex:`#${n.skinHex}`).getHex());let{isDivine:l}=a,c=new Ne(e);if(r==="BrainrotLog"||r==="CupDancer"||r==="CartoonTank")return CE(r,n.name,i,s,a.robe,a.sash,a.skin,c);let h=new le,d=new le;h.add(d);let p=Ec(t),f=gd(r,n.name,t,p),E=Md(f,a),M=E.robe,m=E.sash,w=E.skin,y=n.scale&&n.scale>0?n.scale:f?E.scale:r==="ChildDevotee"?.82:1;d.scale.setScalar(y);let x=(Pe,Te)=>{let Ie=document.createElement("canvas");Ie.width=256,Ie.height=256;let U=Ie.getContext("2d"),ye="#"+new Ne(Te).getHexString();if(U.fillStyle=ye,U.fillRect(0,0,256,256),Pe==="colorful"){let K=["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7","#ec4899","#14b8a6","#eab308"];for(let Se=0;Se<42;Se++){U.fillStyle=K[Se%K.length];let Re=Se*53%240,Ue=Se*79%240;U.beginPath(),U.moveTo(Re,Ue),U.lineTo(Re+36,Ue+12),U.lineTo(Re+22,Ue+42),U.lineTo(Re-10,Ue+28),U.closePath(),U.fill()}}else if(Pe==="striped"){U.fillStyle="rgba(255,255,255,0.28)";for(let K=0;K<256;K+=28)U.fillRect(K,0,10,256)}else if(Pe==="checked"){U.fillStyle="rgba(255,255,255,0.22)";for(let K=0;K<256;K+=32)U.fillRect(K,0,12,256);for(let K=0;K<256;K+=32)U.fillRect(0,K,256,12)}let Z=new Qt(Ie);return Z.colorSpace=At,Z},b=n.shirtPattern??"solid",v=b!=="solid"?new H({map:x(b,M),roughness:.56,metalness:.05}):new H({color:M,roughness:.58,metalness:.08}),R=new H({color:new Ne(M).multiplyScalar(.75),roughness:.65}),C=new H({color:m,roughness:.42,metalness:.25}),_=new H({color:w,roughness:.48,metalness:.02}),T=new H({color:16236088,metalness:.85,roughness:.22}),I=new g(new zn(.46,.58,36),new De({color:c,transparent:!0,opacity:p?0:.22,side:Mt,depthWrite:!1}));I.rotation.x=-Math.PI/2,I.position.y=.012,I.visible=!p,h.add(I);let G=new g(new Ct(.45,32),new De({color:c,transparent:!0,opacity:p?0:.08,side:Mt,depthWrite:!1}));G.rotation.x=-Math.PI/2,G.position.y=.01,G.visible=!p,h.add(G);let F,k,Y,X,ie,O=.14,re=p?new H({color:i>0?1976635:3223169,roughness:.72}):R;if(o){O=.66;let Pe=new g(new ce(.245,16,12),re);Pe.scale.set(1.06,.65,.88),Pe.position.set(0,O-.01,0),Pe.castShadow=!0,d.add(Pe);let Te=new gt(.104,.2,6,10),Ie=new gt(.092,.18,6,10),U=new H({color:p?16317180:3875862,roughness:.45}),ye=Se=>{let Re=new le;Re.position.set(Se*.13,O-.04,0),d.add(Re);let Ue=new g(Te,re);Ue.position.set(0,-.15,0),Ue.castShadow=!0,Ue.receiveShadow=!0,Re.add(Ue);let ot=new le;ot.position.set(0,-.3,0),Re.add(ot);let ft=new g(Ie,re);ft.position.set(0,-.14,0),ft.castShadow=!0,ft.receiveShadow=!0,ot.add(ft);let it=new g(new ce(.105,12,8),U);return it.scale.set(.95,.55,1.55),it.position.set(0,-.265,.05),it.castShadow=!0,ot.add(it),{hip:Re,knee:ot}},Z=ye(-1),K=ye(1);k=Z.hip,X=Z.knee,Y=K.hip,ie=K.knee}else{let Pe=bE(c);F=Pe.glowMesh,d.add(Pe.group),O=.15;let Te=new g(new ce(.36,20,12),R);Te.scale.set(1.15,.45,.92),Te.position.set(0,O+.06,.03),Te.castShadow=!0,Te.receiveShadow=!0,d.add(Te)}let ee=new le;ee.position.y=O,d.add(ee);let be=vE(.28,.21,.27,.62),he=f==="narasimha"||f==="hanuman"||f==="shiv"||f==="vishnu"||f==="krishna"||f==="ram",ue=new g(be,he?_:v);if(ue.castShadow=!0,ue.receiveShadow=!0,ee.add(ue),p)if(o&&r==="Scholar"&&(t==="Village"||t==="ChaiStall"||t==="SweetShop"||t==="NeighborhoodGate"||t==="ComedyStage"||t==="PalaceCourt")){let Pe=[new Be(.21,.24),new Be(.25,.02),new Be(.28,-.24),new Be(.29,-.32)],Te=new g(new si(Pe,20),new H({color:M,roughness:.58,side:Mt}));Te.castShadow=!0,ee.add(Te);let Ie=new g(new Ee(.125,.132,.06,16),C);Ie.position.set(0,.6,.02),ee.add(Ie);let U=new g(new W(.09,.44,.26),C);U.position.set(.16,.36,.02),U.rotation.z=.08,ee.add(U)}else{let Pe=new g(new We(.132,.026,8,20),C);Pe.rotation.x=Math.PI/2+.2,Pe.position.set(0,.58,.03),ee.add(Pe);let Te=new g(new We(.255,.022,8,22),new H({color:988970,roughness:.65}));Te.rotation.x=Math.PI/2,Te.position.y=.04,ee.add(Te)}else{if(t!=="PalaceCourt"){let Ie=new mn([new D(-.16,.55,.1),new D(-.02,.39,.21),new D(.18,.22,.14),new D(.14,.18,-.16)]),U=new g(new An(Ie,18,.024,8,!1),C);U.castShadow=!0,ee.add(U)}let Pe=new g(new We(.22,.022,8,22),T);Pe.rotation.x=Math.PI/2,Pe.position.y=.24,ee.add(Pe);let Te=new g(new We(.142,.018,8,20),T);if(Te.rotation.x=Math.PI/2+.25,Te.position.set(0,.57,.04),ee.add(Te),o&&r==="NobleWoman"){let Ie=[new Be(.18,.25),new Be(.24,.08),new Be(.36,-.18),new Be(.45,-.44),new Be(.42,-.46)],U=new si(Ie,28),ye=new H({color:M,roughness:.45,metalness:.14,side:Mt}),Z=new g(U,ye);Z.castShadow=!0,Z.receiveShadow=!0,ee.add(Z);let K=new g(new We(.44,.024,8,32),T);K.rotation.x=Math.PI/2,K.position.y=-.44,ee.add(K);let Se=new W(.14,.62,.28),Re=new H({color:M,roughness:.42,metalness:.16}),Ue=new g(Se,Re);Ue.position.set(-.08,.34,.06),Ue.rotation.z=-.52,Ue.castShadow=!0,ee.add(Ue);let ot=new g(new W(.028,.63,.29),T);ot.position.set(-.02,.34,.062),ot.rotation.z=-.52,ee.add(ot)}else if(o&&r==="KingCrown"&&(!f||f==="genericSacred")&&(t==="PalaceCourt"||n.attire==="turban")){let Ie=[new Be(.22,.24),new Be(.27,.02),new Be(.31,-.26),new Be(.32,-.34)],U=new g(new si(Ie,24),new H({color:M,roughness:.5,metalness:.12,side:Mt}));U.castShadow=!0,ee.add(U);for(let ye=0;ye<4;ye++){let Z=new g(new ce(.022,8,8),T);Z.position.set(0,.5-ye*.075,ye<2?.248:.225),ee.add(Z)}}}let $=n.name.toLowerCase();if(r==="SageRishi"&&($.includes("narad")||$.includes("\u0928\u093E\u0930\u0926"))){let Pe=new le,Te=new H({color:9584654,roughness:.42}),Ie=new g(new Ee(.025,.025,.85,10),Te);Ie.rotation.z=-.68,Pe.add(Ie);let U=new g(new ce(.11,14,10),Te);U.position.set(-.26,-.32,.04),Pe.add(U);let ye=new g(new ce(.08,12,10),Te);ye.position.set(.24,.3,.04),Pe.add(ye),Pe.position.set(0,.34,.28),ee.add(Pe)}else if(r==="Warrior"){let Pe=new g(new Ee(.22,.22,.04,20),T);Pe.rotation.x=Math.PI/2,Pe.position.set(-.34,.28,.08),ee.add(Pe);let Te=new g(new Ee(.016,.016,1.45,8),new H({color:7029795}));Te.position.set(.36,.55,.02),ee.add(Te);let Ie=new g(new $e(.04,.14,8),new H({color:14870768,metalness:.85}));Ie.position.set(.36,1.32,.02),ee.add(Ie)}let ge=new gt(.072,.21,6,10),Ae=new gt(.06,.19,6,10),xe=he||f==="asuraKing"?_:v,J=Pe=>{let Te=new le;Te.position.set(Pe*.245,.52,0),ee.add(Te);let Ie=new g(new ce(.088,12,10),xe);Ie.castShadow=!0,Te.add(Ie);let U=new g(ge,xe);U.position.y=-.13,U.castShadow=!0,Te.add(U);let ye=new le;ye.position.y=-.26,Te.add(ye);let Z=new g(new ce(.062,10,8),xe);Z.castShadow=!0,ye.add(Z);let K=new g(Ae,xe);K.position.y=-.115,K.castShadow=!0,ye.add(K);let Se=new g(new ce(.066,12,10),_);return Se.scale.set(.95,1.15,.8),Se.position.y=-.24,Se.castShadow=!0,ye.add(Se),{shoulder:Te,elbow:ye}},Me=J(-1),j=J(1),te=Td(d,ee,k,Y,Me.elbow,j.elbow,f,M,m,T,o),ve=new le;ve.position.set(0,-.25,.06);let de=new g(new Ee(.11,.07,.08,14),new H({color:16317180,roughness:.35}));ve.add(de);let B=new g(new ce(.075,10,8),new H({color:16707722,roughness:.45}));B.scale.set(1.1,.55,1.1),B.position.y=.035,ve.add(B),ve.visible=!1,j.elbow.add(ve);let we=fc(j.elbow,Me.elbow,ee),N=r==="ComicBobble"?.345:r==="ChildDevotee"?.265:.245,Ge=new g(new Ee(.075,.095,.14,14),_);Ge.position.y=.65,ee.add(Ge);let P=new le;P.position.y=.68+N*.92,ee.add(P);let ae,He=N*.08,L,S,z,oe,me,fe,Ve,Le,pe;if(f==="narasimha"){let Pe=yd(P,N,w);pe=Pe,Le=Pe.lowerJawPivot}else{let Pe=new g(new ce(N,26,20),_);Pe.scale.set(.98,1.08,.95),Pe.castShadow=!0,Pe.receiveShadow=!0,P.add(Pe);let Te=new g(new ce(N*.14,10,8),_);Te.scale.set(.85,1.05,1.2),Te.position.set(0,-N*.04,N*.94),P.add(Te);for(let Z of[-1,1]){let K=new g(new ce(N*.18,10,8),_);if(K.scale.set(.5,1.2,.8),K.position.set(Z*N*.96,-N*.04,0),P.add(K),!p){let Se=new g(new We(N*.1,N*.025,8,14),T);Se.rotation.y=Math.PI/2,Se.position.set(Z*N*.98,-N*.2,.01),P.add(Se)}}let Ie=Z=>{let K=new g(new ce(N*.19,10,8),new De({color:15680580,transparent:!0,opacity:0,depthWrite:!1}));return K.scale.set(1.2,.75,.35),K.position.set(Z*N*.56,-N*.16,N*.84),P.add(K),K};if(L=p?Ie(-1):void 0,S=p?Ie(1):void 0,p){let Z=new De({color:3718648,transparent:!0,opacity:.92,depthWrite:!1}),K=ot=>{let ft=new g(new ce(N*.056,8,8),Z);return ft.scale.set(.75,1.38,.46),ft.position.set(ot*N*.34,-N*.02,N*.93),ft.visible=!1,P.add(ft),ft};z=K(-1),oe=K(1),me=new le;let Se=new g(new ce(N*.075,8,8),Z);Se.scale.set(.85,1.05,.55);let Re=new g(new $e(N*.068,N*.14,8),Z);Re.position.y=N*.085,me.add(Se,Re),me.position.set(N*.58,N*.42,N*.8),me.visible=!1,P.add(me),fe=new le;let Ue=new De({color:15680580});for(let[ot,ft,it]of[[.45,-N*.055,N*.045],[-.45,N*.055,N*.045],[-.45,-N*.055,-N*.045],[.45,N*.055,-N*.045]]){let Dt=new g(new W(N*.11,N*.032,N*.03),Ue);Dt.rotation.z=ot,Dt.position.set(ft,it,0),fe.add(Dt)}fe.position.set(-N*.46,N*.44,N*.86),fe.visible=!1,P.add(fe)}if(p){ae=new le,ae.position.set(0,He,N*.97);let Z=new H({color:988970,metalness:.45,roughness:.25}),K=new De({color:12248829,transparent:!0,opacity:.24}),Se=new g(new W(N*1.18,N*.09,N*.05),Z);Se.position.set(0,N*.16,.01),ae.add(Se);for(let Ue of[-1,1]){let ot=new g(new We(N*.19,N*.028,8,18),Z);ot.position.set(Ue*N*.36,0,0),ae.add(ot);let ft=new g(new Ct(N*.175,16),K);ft.position.set(Ue*N*.36,0,-.005),ae.add(ft);let it=new g(new W(N*.03,N*.035,N*.5),Z);it.position.set(Ue*N*.58,N*.06,-N*.22),ae.add(it)}let Re=new g(new Ee(N*.022,N*.022,N*.36,6),Z);Re.rotation.z=Math.PI/2,Re.position.set(0,N*.02,0),ae.add(Re),ae.visible=n.hasGlasses!==void 0&&n.hasGlasses!==null?!!n.hasGlasses:i>0,ae.userData.wearsByDefault=ae.visible,P.add(ae)}if(n.mustache&&n.mustache!=="none"){let Z=new H({color:1120295,roughness:.65});if(n.mustache==="brush"){let K=new g(new W(N*.42,N*.14,N*.08),Z);K.position.set(0,-N*.18,N*.96),P.add(K)}else if(n.mustache==="handlebar")for(let K of[-1,1]){let Se=new g(new gt(N*.04,N*.22,4,8),Z);Se.rotation.z=K*1.15,Se.position.set(K*N*.16,-N*.19,N*.95),P.add(Se)}}if(r==="NobleWoman"){let Z=new g(new ce(N*.08,10,8),new H({color:14427686,roughness:.4}));Z.scale.z=.4,Z.position.set(0,N*.24,N*.96),P.add(Z)}else if(r==="Divine"&&/shiv|mahadev|neelkanth|shambho|rudra|शिव|महादेव|नीलकंठ|शंभो/i.test($)){let Z=new H({color:16317180,emissive:14870768,emissiveIntensity:.45,roughness:.6});for(let Re of[-.045,0,.045]){let Ue=new g(new W(N*.36,N*.025,N*.04),Z);Ue.position.set(0,N*(.28+Re),N*.95),P.add(Ue)}let K=new g(new gt(N*.028,N*.09,4,8),new H({color:16096779,emissive:14427686,emissiveIntensity:.65}));K.position.set(0,N*.42,N*.965),P.add(K);let Se=new g(new ce(N*.045,8,8),new H({color:14427686}));Se.position.set(0,N*.28,N*.975),P.add(Se)}else if(f==="vishnu"||f==="krishna"||f==="ram"){let Z=new H({color:16710888,emissive:16708551,emissiveIntensity:.25}),K=new H({color:14427686,emissive:10033947,emissiveIntensity:.35});for(let Re of[-1,1]){let Ue=new g(new W(N*.042,N*.28,N*.04),Z);Ue.position.set(Re*N*.072,N*.36,N*.955),Ue.rotation.z=-Re*.09,P.add(Ue)}let Se=new g(new gt(N*.022,N*.2,4,8),K);Se.position.set(0,N*.36,N*.97),P.add(Se)}else if(r!=="Warrior"&&!p&&f!=="asuraKing"){let Z=new g(new gt(N*.036,N*.16,4,8),new H({color:r==="Divine"?16498468:15357964,emissive:8138002,emissiveIntensity:.2}));Z.position.set(0,N*.28,N*.95),P.add(Z)}Ve=RE(P,r,n.name,t,N,M,n.attire,n.hairStyle,n.hairHex),f==="asuraKing"&&xd(P,ee,N,T);let U=r==="SageRishi"?14277862:1840930,ye=r==="ComicBobble"||t==="DoorwaySet"||t==="SkyGauntlet";pe=Rd(P,N,w,U,N*.85,ye)}let Ze,_e,ke=r==="NobleWoman"&&bd.some(Pe=>$.includes(Pe));if(l||r==="SageRishi"||ke||f==="narasimha"){Ze=new le,Ze.position.set(0,.04,-N*(f==="narasimha"?.92:.72)),_e=new De({color:l||f==="narasimha"?16769126:c,transparent:!0,opacity:l||f==="narasimha"?.65:.28,side:Mt,depthWrite:!1});let Pe=new g(new zn(N*1.45,N*1.62,32),_e);Ze.add(Pe);for(let Te=0;Te<8;Te++){let Ie=new g(new rt(N*.08,N*.45),_e),U=Te/8*Math.PI*2;Ie.position.set(Math.cos(U)*N*1.54,Math.sin(U)*N*1.54,0),Ie.rotation.z=U+Math.PI/2,Ze.add(Ie)}P.add(Ze)}h.rotation.y=i*.42;let Ke=O+.68+N*.92,je=(o?Ke:1.04)*y,Oe=(o?Ke+N*1.48:1.4)*y;return{root:h,bodyPivot:d,torsoGroup:ee,headPivot:P,leftShoulder:Me.shoulder,leftElbow:Me.elbow,rightShoulder:j.shoulder,rightElbow:j.elbow,leftHip:k,rightHip:Y,leftKnee:X,rightKnee:ie,snackProp:ve,handProps:we,headY:je,leftEyelid:pe.leftEye.eyelid,rightEyelid:pe.rightEye.eyelid,leftBrow:pe.leftEye.brow,rightBrow:pe.rightEye.brow,leftSclera:pe.leftEye.sclera,rightSclera:pe.rightEye.sclera,leftPupil:pe.leftEye.pupil,rightPupil:pe.rightEye.pupil,mouthCavity:pe.mouthCavity,upperLip:pe.upperLip,lowerLip:pe.lowerLip,glassesGroup:ae,glassesBaseY:He,hairFullGroup:Ve?.hairFullGroup,hairShavedGroup:Ve?.hairShavedGroup,leftCheekFlush:L,rightCheekFlush:S,leftTearBead:z,rightTearBead:oe,sweatDropGroup:me,angerMarkGroup:fe,haloGroup:Ze,haloMaterial:_e,auraRing:I,auraDisc:G,pedestalGlow:F,chakraWheel:te.chakraWheel,lowerJawPivot:Le,pattaEnds:te.pattaEnds,isNarasimha:f==="narasimha",isAsuraKing:f==="asuraKing",isHolika:/holika|होलिका/i.test(n.name),mouthBaseY:pe.mouthBaseY,baseTorsoY:o?.66:.15,restScale:y,topY:Oe,role:r,name:n.name,facingSign:i,standing:o,hasFloorAura:!p,seedOffset:s}}function La(n,e,t,i,s,r,o="none",a=.5,l=!1,c=null,h=!1,d=!1,u=null,p=0){let f=e+n.seedOffset,E=o||"none",M=n.role==="BrainrotLog"||n.role==="CupDancer"||n.role==="CartoonTank"||n.role==="ComicBobble";if(n.snackProp&&(n.snackProp.visible=E==="eating"&&(!c||c==="none")),Ed(n.handProps,c,E,f,t,d),n.hairFullGroup&&n.hairShavedGroup&&(n.hairFullGroup.visible=p<2,n.hairShavedGroup.visible=p>=2,p===1?(n.hairFullGroup.scale.set(.96,.95,.96),n.hairFullGroup.position.set(.015,.01,0),n.hairFullGroup.rotation.z=.22):(n.hairFullGroup.scale.setScalar(1),n.hairFullGroup.position.set(0,0,0),n.hairFullGroup.rotation.z=0)),n.glassesGroup){let P=(u??"normal").trim().toLowerCase(),ae=n.glassesGroup.userData.wearsByDefault!==!1;if(P==="none"||!u&&!ae)n.glassesGroup.visible=!1;else{n.glassesGroup.visible=!0;let He=n.glassesBaseY??.028,L=0,S=0,z=He;if(P==="ulta")L=Math.PI,z=He-.012;else if(P==="flipping"){let oe=Math.max(0,Math.min(1,(a-.35)/.25)),me=oe*oe*(3-2*oe);L=Math.PI*(1-me),z=He-.012*(1-me)+Math.sin(me*Math.PI)*.04}else P==="crooked"?(L=.28+Math.sin(f*9)*.04,z=He-.01):P==="forehead"&&(S=-.35,z=He+.105);n.glassesGroup.rotation.z=L,n.glassesGroup.rotation.x=S,n.glassesGroup.position.y=z}}if(n.leftCheekFlush&&n.rightCheekFlush){let P=s==="angry"||E==="corpseSnapUp",ae=s==="scared"||E==="brakeStop"||E==="lapSubdued",He=P?.78:s==="laughing"||E==="celebrate"?.44:s==="surprised"||E==="shockedFall"||ae?.3:s==="proud"||s==="happy"||s==="smug"?.22:0,L=P?14427686:s==="laughing"||E==="celebrate"||s==="proud"?16478597:ae?6333946:16281969;[n.leftCheekFlush,n.rightCheekFlush].forEach(S=>{let z=S.material;z.opacity=He,z.color.setHex(L)})}let m=n.role==="ComicBobble"?.345:n.role==="ChildDevotee"?.265:.245;if(n.leftTearBead&&n.rightTearBead){let P=s==="sad";if(n.leftTearBead.visible=P,n.rightTearBead.visible=P,P){let ae=f*1.65%1,He=(f*1.65+.42)%1;n.leftTearBead.position.y=-m*(.02+ae*.24),n.rightTearBead.position.y=-m*(.02+He*.24),n.leftTearBead.scale.setScalar(.65+Math.sin(ae*Math.PI)*.65),n.rightTearBead.scale.setScalar(.65+Math.sin(He*Math.PI)*.65)}}if(n.sweatDropGroup){let P=s==="scared"||E==="brakeStop"||E==="lapSubdued";if(n.sweatDropGroup.visible=P,P){let ae=f*2.15%1;n.sweatDropGroup.position.y=m*(.44-ae*.16),n.sweatDropGroup.scale.setScalar(.82+Math.sin(ae*Math.PI)*.42)}}if(n.angerMarkGroup){let P=s==="angry"||E==="corpseSnapUp";if(n.angerMarkGroup.visible=P,P){let ae=.86+.34*Math.abs(Math.sin(f*11.5));n.angerMarkGroup.scale.setScalar(ae)}}let w=0,y=0,x=0,b=0,v=0,R=0,C=0,_=0,T=0,I=0,G=0,F=0,k=0,Y=Math.sin(f*2.1)*(t?.018:.008);n.torsoGroup.position.y=n.baseTorsoY+Y;let X=n.hasFloorAura!==!1;if(E==="sleeping"||E==="lyingShroud")w=-Math.PI*.48,v=E==="lyingShroud"?.14:n.standing?.06:.16,_=E==="lyingShroud"?.04:.14,T=E==="lyingShroud"?.04:.08,F=E==="lyingShroud"?.06:.28,k=E==="lyingShroud"?.06:.16,n.auraRing.visible=!1,n.auraDisc.visible=!1;else if(n.auraRing.visible=X,n.auraDisc.visible=X,E==="corpseSnapUp"){let P=Math.max(0,Math.min(1,a/.24)),ae=1-Math.pow(1-P,3);w=-Math.PI*.48*(1-ae)+.08*Math.sin(P*Math.PI),v=.14*(1-ae)+Math.sin(P*Math.PI)*.18,R=.1*ae}else if(E==="wakingUp"){let P=Math.max(0,Math.min(1,(a-.04)/.36)),ae=1-Math.pow(1-P,3);w=-Math.PI*.48*(1-ae)-.1*Math.sin(P*Math.PI),v=(n.standing?.06:.16)*(1-ae)+Math.sin(P*Math.PI)*.12,R=-.14*Math.sin(P*Math.PI)}else if(E==="sitting"||E==="placingBook"||E==="deskSleep"||h)v=n.standing?-.26:0,_=-Math.PI*.46,T=-Math.PI*.46,F=Math.PI*.46,k=Math.PI*.46,R=E==="deskSleep"?.5+Math.sin(f*1.6)*.02:E==="placingBook"?.18:t?Math.sin(f*2.4)*.05:-.05;else if(E==="walking"||E==="running"){let P=E==="running"?14:7.5,ae=Math.sin(e*P),He=E==="running"?.85:.52,L=E==="running"?1.05:.55;_=ae*He,T=-ae*He,F=Math.max(0,-ae)*L,k=Math.max(0,ae)*L,v=Math.abs(Math.cos(e*P))*(E==="running"?.095:.045),R=E==="running"?.24:.1,C=ae*.06}else if(E==="praying")R=.16+Math.sin(f*2.2)*.035,v=0;else if(E==="shockedFall"){let P=Math.max(0,Math.min(1,a/.35));w=.18*Math.sin(P*Math.PI*.7),y=n.facingSign*-.05*P,v=P<.35?Math.sin(P/.35*Math.PI)*.12:-.04*P,_=-.18*P,T=.14*P,F=.24*P}else if(E==="jumping"||E==="dancing"||E==="adaab"||E==="sufiSpin")if(E==="jumping"){let P=Math.abs(Math.sin(f*6.2));v=P*.22,_=-P*.35,T=-P*.35,F=P*.55,k=P*.55}else{let ae=Sd(f,M?"viralBounce":"sufiKathak",E,n.facingSign<0,0);v=ae.liftY,y=ae.bodyRotZ,R=ae.torsoRotX,C=ae.torsoRotZ,_=ae.leftHipX,T=ae.rightHipX,F=ae.leftKneeX,k=ae.rightKneeX,n.bodyPivot.rotation.y+=(ae.bodyRotY-n.bodyPivot.rotation.y)*(l?1:.35)}else if(E==="punching"){let{extend:P}=li(e,"punching");R=.1+P*.2,y=n.facingSign*-.05*P,v=-.03+P*.02,_=-.22,T=.16,F=.3,k=.22}else if(E==="kicking"){let{extend:P}=li(e,"kicking");T=-1.25*P,k=1.1*(1-P)*Math.min(1,P*3),F=.18,R=-.16*P,v=.02*P}else if(E==="hitReact"){let{recoil:P}=li(e,"punching");w=-.24*P,R=-.2*P,y=n.facingSign*.1*P+Math.sin(f*11)*.03,v=-.02*P,F=.22*P,k=.18*P}else if(E==="lapSubdue")v=-.22,_=-1.36,T=-1.36,I=-.44,G=.44,F=1.42,k=1.42,R=.14+Math.sin(f*7.5)*.03;else if(E==="lapSubdued"){let P=Math.sin(f*9)*.04;y=Math.PI*.48+P*.45,w=-.26,x=.92,b=.25,v=.7+Math.sin(f*11)*.015,_=.25+P*2.2,T=-.15-P*2.2,F=.85,k=1.05,R=-.1}else if(E==="pillarBurst")v=.02,_=-.28,T=.22,I=-.18,G=.18,F=.36,k=.18,R=-.06;else if(E==="clubStrike"){let P=Math.sin(a*Math.PI);v=-.04*P,_=-.24*P,T=.2*P,F=.28*P,R=.24*P}else if(E==="cliffRescue")n.role==="ChildDevotee"?(v=.32+Math.sin(f*3.4)*.08,R=.06):R=.14;else if(E==="fireTrial")(n.role==="ChildDevotee"||n.isHolika)&&(v=n.standing?-.24:0,_=-Math.PI*.46,T=-Math.PI*.46,F=Math.PI*.46,k=Math.PI*.46,R=n.isHolika&&s!=="proud"?-.18+Math.sin(f*16)*.06:.08);else if(E==="blessing")v=t?Math.abs(Math.sin(f*4.5))*.02:0,R=.04;else if(E==="brakeStop"){let P=a<.34?Math.sin(a/.34*Math.PI):0;R=a<.34?.26*P:-.14*Math.exp(-(a-.34)*3.5),C=Math.sin(f*26)*.045,b=a<.34?.12*P:-.14,v=-.05,F=.34,k=.24}else E==="celebrate"?(v=Math.abs(Math.sin(f*8.4))*.16,R=-.09,C=Math.sin(f*4.2)*.07):E==="pointing"||E==="hazardWire"||E==="hazardTruck"||E==="hazardTank"||E==="hazardPit"||E==="hazardSnake"||E==="hazardFood"||E==="hazardPhone"?E==="hazardPit"?(v=Math.abs(Math.sin(f*5.6))*.16,R=.12):E==="hazardWire"?(R=.08,C=Math.sin(f*26)*.06,v=t?Math.abs(Math.sin(f*8.5))*.04:0):(R=.1+Math.sin(f*5.8)*.04,v=t?Math.abs(Math.sin(f*7.5))*.038:0):s==="scared"?(v=n.standing?-.04:0,R=.07,C=Math.sin(f*28)*.045):s==="smug"?(R=-.06,C=n.facingSign*.07,v=t?Math.abs(Math.sin(f*6))*.03:0):s==="proud"?(R=-.09,v=t?Math.abs(Math.sin(f*7.2))*.045:.02):v=t&&n.standing?Math.abs(Math.sin(f*(M?9.2:7.2)))*(M?.055:.035):0;let O=l?1:E==="punching"||E==="kicking"||E==="hitReact"||E==="lapSubdue"||E==="lapSubdued"||E==="pillarBurst"||E==="corpseSnapUp"?.68:E==="wakingUp"||E==="shockedFall"||E==="walking"||E==="running"?.45:.28;if(n.bodyPivot.rotation.x+=(w-n.bodyPivot.rotation.x)*O,n.bodyPivot.rotation.z+=(y-n.bodyPivot.rotation.z)*O,n.bodyPivot.position.x+=(x-n.bodyPivot.position.x)*O,n.bodyPivot.position.z+=(b-n.bodyPivot.position.z)*O,n.bodyPivot.position.y+=(v-n.bodyPivot.position.y)*O,n.torsoGroup.rotation.x+=(R-n.torsoGroup.rotation.x)*O,n.torsoGroup.rotation.z+=(C-n.torsoGroup.rotation.z)*O,n.leftHip&&(n.leftHip.rotation.x+=(_-n.leftHip.rotation.x)*O,n.leftHip.rotation.z+=(I-n.leftHip.rotation.z)*O),n.rightHip&&(n.rightHip.rotation.x+=(T-n.rightHip.rotation.x)*O,n.rightHip.rotation.z+=(G-n.rightHip.rotation.z)*O),n.leftKnee&&(n.leftKnee.rotation.x+=(F-n.leftKnee.rotation.x)*O),n.rightKnee&&(n.rightKnee.rotation.x+=(k-n.rightKnee.rotation.x)*O),E!=="dancing"&&E!=="adaab"&&E!=="sufiSpin"&&(n.bodyPivot.rotation.y+=(0-n.bodyPivot.rotation.y)*O),E==="sleeping"){let P=1+Math.sin(f*2.2)*.025;n.bodyPivot.scale.set(n.restScale,n.restScale*P,n.restScale)}else if(E==="fireTrial"&&n.isHolika&&s!=="proud"){let P=Math.max(.28,1-Math.max(0,a-.25)*.85);n.bodyPivot.scale.setScalar(n.restScale*P)}else if(M&&t){let P=1+Math.max(0,v)*.85,ae=1-Math.max(0,v)*.35;n.bodyPivot.scale.set(n.restScale*ae,n.restScale*P,n.restScale*ae)}else n.bodyPivot.scale.setScalar(n.restScale);let re=E==="fireTrial"&&(n.role==="ChildDevotee"||n.isHolika),ee=E==="corpseSnapUp"&&a<.24;if(n.standing&&E!=="sleeping"&&E!=="lyingShroud"&&!ee&&E!=="wakingUp"&&E!=="sitting"&&E!=="lapSubdued"&&!h&&!re&&AE(n,Math.max(0,v)),n.turretGroup&&(n.turretGroup.rotation.y=t?Math.sin(f*2.4)*.18:n.facingSign*-.15,n.turretGroup.rotation.x=E==="sleeping"?.28:0),n.cannonBarrel){let P=t&&(s==="angry"||s==="proud")?Math.max(0,Math.sin(f*10.5))*.14:0;n.cannonBarrel.position.z=.5-P}n.propPivot&&(n.propPivot.rotation.x=t?Math.sin(f*8.5)*.65:Math.sin(f*2)*.12);let be=s==="surprised"||s==="scared"||E==="brakeStop"||E==="shockedFall"||E==="hitReact"||E==="corpseSnapUp"||E==="wakingUp"&&a>.25,he=s==="scared"||E==="brakeStop"?1.44:be?1.4:s==="angry"||E==="punching"||E==="kicking"?1.24:1;n.leftSclera.scale.set(he,he*1.08,.5),n.rightSclera.scale.set(he,he*1.08,.5);let ue=s==="confused"||s==="scared"||E==="slapForehead"?Math.sin(f*(s==="scared"?16:9))*.02:s==="smug"?n.facingSign*.012:0,$=s==="scared"||E==="brakeStop"?.58:be?.86:s==="angry"?.88:s==="smug"?.94:1;if(n.leftPupil.scale.set($,$,.92),n.rightPupil.scale.set($,$,.92),n.leftPupil.rotation.y=ue*8,n.rightPupil.rotation.y=-ue*8,E==="sleeping")n.headPivot.rotation.set(.18,n.facingSign*.28,.24);else if(E==="deskSleep")n.headPivot.rotation.set(.32,0,.32+Math.sin(f*1.6)*.03);else if(E==="lyingShroud"){let P=s==="angry"?Math.sin(f*8)*.08:0;n.headPivot.rotation.set(.14,.52+P,Math.sin(f*1.2)*.04)}else if(E==="corpseSnapUp")n.headPivot.rotation.set(.12+Math.sin(f*20)*.04,0,Math.sin(f*24)*.05);else if(E==="brakeStop")n.headPivot.rotation.set(-.22+Math.sin(f*24)*.05,n.facingSign*-.14,Math.sin(f*30)*.06);else if(E==="celebrate")n.headPivot.rotation.set(-.1+Math.sin(f*8.4)*.09,n.facingSign*-.06,Math.sin(f*4.2)*.09);else if(E==="lookInMirror"){let P=Math.sin(a*Math.PI*1.4);n.headPivot.rotation.set(.06,-n.facingSign*(.68+P*.28),P*.08)}else if(E==="eating")n.headPivot.rotation.set(.14+Math.sin(f*5.4)*.12,0,Math.sin(f*2.7)*.08);else if(E==="slapForehead")n.headPivot.rotation.set(.18,n.facingSign*-.1,-.22+Math.sin(f*6.5)*.06);else if(E==="lapSubdue"||E==="pillarBurst"){let P=Math.sin(f*10.5)*.05;n.headPivot.rotation.set(E==="lapSubdue"?.24+P:-.1+P,0,Math.sin(f*7.2)*.04)}else if(E==="lapSubdued"){let P=Math.sin(f*13)*.14;n.headPivot.rotation.set(-.22+P,-.35+P*.5,.12)}else if(E==="hitReact"){let{recoil:P}=li(e,"punching");n.headPivot.rotation.set(-.3*P,n.facingSign*.35*P,n.facingSign*.18*P)}else if(E==="punching"||E==="kicking")n.headPivot.rotation.set(.1,n.facingSign*-.12,0);else if(s==="laughing")n.headPivot.rotation.set(-.18+Math.abs(Math.sin(f*13.5))*.16,n.facingSign*-.06,Math.sin(f*6.8)*.11);else if(s==="angry")n.headPivot.rotation.set(.14+(t?Math.sin(f*3.2)*.05:0),n.facingSign*-.14,Math.sin(f*1.3)*.02);else if(s==="scared")n.headPivot.rotation.set(-.08,n.facingSign*-.18+Math.sin(f*1.9)*.16,Math.sin(f*1.1)*.03);else if(s==="smug")n.headPivot.rotation.set(-.08+(t?Math.sin(f*4.5)*.04:0),n.facingSign*-.08,n.facingSign*.13);else if(s==="proud")n.headPivot.rotation.set(-.07+(t?Math.sin(f*5)*.06:0),n.facingSign*(t?-.1:.06),0);else{let P=t?Math.sin(f*3.4)*.055:Math.sin(f*.9)*.012,ae=s==="confused"?.16:t?Math.sin(f*1.7)*.045:0;n.headPivot.rotation.x=P,n.headPivot.rotation.z=ae,n.headPivot.rotation.y=E==="walking"||E==="running"?Math.sin(f*3)*.08:n.facingSign*(t?-.14:.1)}let Ae=f*.28%1>.955,xe=-Math.PI*.48;E==="sleeping"||E==="praying"||E==="deskSleep"?xe=.26:E==="lyingShroud"?xe=s==="angry"?-.18:.28:E==="corpseSnapUp"?xe=-Math.PI*.66:E==="wakingUp"&&a<.2?xe=.24:E==="lapSubdue"||E==="pillarBurst"?xe=-Math.PI*.64:Ae?xe=.15:s==="laughing"?xe=.12:s==="sad"?xe=-Math.PI*.28:s==="smug"?xe=-.1:s==="scared"||E==="brakeStop"?xe=-Math.PI*.68:(be||s==="angry")&&(xe=-Math.PI*.64),n.leftEyelid.rotation.x=s==="smug"?-.06:xe,n.rightEyelid.rotation.x=s==="smug"?-.16:xe;let J=.085,Me=t?.014:0,j=Me,te=0,ve=0;s==="angry"||E==="corpseSnapUp"?(Me=j=-.032,te=ve=.62):s==="scared"||E==="brakeStop"?(Me=j=.062,te=ve=-.34):be?(Me=j=.054,te=ve=-.1):s==="smug"?(Me=.052,j=-.012,te=-.2,ve=.26):s==="sad"||E==="slapForehead"?(Me=j=.012,te=ve=-.34):(s==="laughing"||s==="happy"||s==="proud")&&(Me=j=.042,te=ve=-.08),n.leftBrow.position.y=J+Me,n.rightBrow.position.y=J+j,n.leftBrow.rotation.z=Math.PI/2-te,n.rightBrow.rotation.z=Math.PI/2+ve;let de=t&&i>.028,B=de?Math.min(1,i*1.5):0,we=.5+.5*Math.sin(e*24+n.seedOffset),N=de?.16+B*(.7+.3*we):.02;E==="sleeping"&&!de?N=.04+.14*Math.max(0,Math.sin(f*2.1)):E==="eating"&&!de?N=.08+.32*Math.max(0,Math.sin(f*5.2)):E==="corpseSnapUp"||s==="angry"&&t?N=Math.max(N,E==="corpseSnapUp"?.88:.52):be&&!t&&a<.16||E==="brakeStop"?N=Math.max(N,.72):s==="laughing"||E==="celebrate"?N=Math.max(N,.44+.18*Math.abs(Math.sin(f*11))):s==="proud"&&!t?N=Math.max(N,.22):s==="smug"&&!t?N=.08:s==="sad"&&t&&(N=Math.max(N,.12));let Ge=de?.9+.36*(1-we):s==="happy"||s==="laughing"||s==="proud"||E==="celebrate"?1.44:s==="smug"?1.24:s==="scared"||E==="brakeStop"?.74:s==="angry"||E==="corpseSnapUp"?1.22:.96;if(n.mouthCavity.scale.set(1.16*Ge,N*1.22,.58),n.mouthCavity.rotation.z=s==="smug"?n.facingSign*.1:0,n.upperLip.position.y=n.mouthBaseY+N*.028,n.lowerLip.position.y=n.mouthBaseY-N*.056,E==="deskSleep")n.leftShoulder.rotation.set(-1.25,0,.18),n.leftElbow.rotation.set(-1.1,0,-.5),n.rightShoulder.rotation.set(-1.25,0,-.18),n.rightElbow.rotation.set(-1.1,0,.5);else if(E==="sleeping")n.leftShoulder.rotation.set(-.2,0,.25),n.leftElbow.rotation.set(-.6,0,-.35),n.rightShoulder.rotation.set(-.2,0,-.25),n.rightElbow.rotation.set(-.6,0,.35);else if(E==="lyingShroud")n.leftShoulder.rotation.set(-.52,.24,.34),n.leftElbow.rotation.set(-.88,0,-.26),n.rightShoulder.rotation.set(-.52,-.24,-.34),n.rightElbow.rotation.set(-.88,0,.26);else if(E==="corpseSnapUp"){let P=Math.sin(f*16)*.26;n.leftShoulder.rotation.set(-1.45+P,.22,.55),n.leftElbow.rotation.set(-.62,0,-.12),n.rightShoulder.rotation.set(-1.45-P,-.22,-.55),n.rightElbow.rotation.set(-.62,0,.12)}else if(E==="wakingUp"||E==="shockedFall"){let P=Math.sin(f*14)*.22;n.leftShoulder.rotation.set(-1.38+P,.25,.62),n.leftElbow.rotation.set(-.55,0,0),n.rightShoulder.rotation.set(-1.38-P,-.25,-.62),n.rightElbow.rotation.set(-.55,0,0)}else if(E==="praying"||r&&!n.standing)n.leftShoulder.rotation.set(-.95,.25,-.42),n.leftElbow.rotation.set(-1.35,0,-.5),n.rightShoulder.rotation.set(-.95,-.25,.42),n.rightElbow.rotation.set(-1.35,0,.5);else if(E==="slapForehead")n.rightShoulder.rotation.set(-1.85,-.35,.32),n.rightElbow.rotation.set(-1.45,0,.45),n.leftShoulder.rotation.set(-.25,.2,.42),n.leftElbow.rotation.set(-.9,0,-.55);else if(E==="eating"){let P=.5+.5*Math.sin(f*5.2);n.rightShoulder.rotation.set(-.55-P*.78,-.22,.22),n.rightElbow.rotation.set(-.85-P*.72,0,.24),n.leftShoulder.rotation.set(-.32,.15,.22),n.leftElbow.rotation.set(-.85,0,-.2)}else if(E==="walking"||E==="running"){let ae=Math.sin(e*(E==="running"?14:7.5))*(E==="running"?.95:.55);n.leftShoulder.rotation.set(-ae,.1,.16),n.leftElbow.rotation.set(E==="running"?-1.45:-.45,0,0),n.rightShoulder.rotation.set(ae,-.1,-.16),n.rightElbow.rotation.set(E==="running"?-1.45:-.45,0,0)}else if(E==="pointing"){let P=Math.sin(f*8.5)*.14;n.rightShoulder.rotation.set(-1.42+P,-.15*n.facingSign,-.22),n.rightElbow.rotation.set(-.22,0,0),n.leftShoulder.rotation.set(-.25,.18,.42),n.leftElbow.rotation.set(-.95,0,-.48)}else if(E==="punching"){let P=Math.floor(e*uc.punching.rate),{extend:ae}=li(e,"punching"),He=P%2===0,L=He?n.rightShoulder:n.leftShoulder,S=He?n.rightElbow:n.leftElbow,z=He?n.leftShoulder:n.rightShoulder,oe=He?n.leftElbow:n.rightElbow,me=He?-1:1;L.rotation.set(-.9-ae*.68,me*.18*(1-ae),me*-.12),S.rotation.set(-1.55*(1-ae)-.08,0,0),z.rotation.set(-1.05,-me*.3,-me*.3),oe.rotation.set(-1.75,0,-me*.25)}else if(E==="kicking")n.leftShoulder.rotation.set(-1,.3,.38),n.leftElbow.rotation.set(-1.7,0,.25),n.rightShoulder.rotation.set(-.95,-.3,-.38),n.rightElbow.rotation.set(-1.7,0,-.25);else if(E==="hitReact"){let{recoil:P}=li(e,"punching"),ae=Math.sin(f*15)*.18*P;n.leftShoulder.rotation.set(-.55-P*.75+ae,.25,.55+P*.35),n.leftElbow.rotation.set(-.5,0,0),n.rightShoulder.rotation.set(-.55-P*.75-ae,-.25,-.55-P*.35),n.rightElbow.rotation.set(-.5,0,0)}else if(E==="cutting"||c==="scissors"){let P=Math.sin(f*8)*.11;n.rightShoulder.rotation.set(-2.06+P,.1,.14),n.rightElbow.rotation.set(-.24+Math.cos(f*16)*.08,0,-.06),n.leftShoulder.rotation.set(-1.76,.18,.18),n.leftElbow.rotation.set(-.42+Math.sin(f*4.8)*.1,0,-.1)}else if(E==="combing"||c==="comb"){let P=Math.sin(f*6.5)*.24;n.rightShoulder.rotation.set(-1.82+P,.12,.18),n.rightElbow.rotation.set(-.48-P*.35,0,-.08),n.leftShoulder.rotation.set(-.4,.12,.2),n.leftElbow.rotation.set(-.85,0,-.2)}else if(E==="removingTowel"){let P=Math.sin(Math.min(1,a*1.35)*Math.PI*.82);n.leftShoulder.rotation.set(-.62-P*.22,.25,.55),n.leftElbow.rotation.set(-.72,0,-.22),n.rightShoulder.rotation.set(-.92-P*.26,-.36,-.68-P*.34),n.rightElbow.rotation.set(-.56,0,.24)}else if(E==="adjustingGlasses"){let P=Math.sin(a*Math.PI);n.rightShoulder.rotation.set(-1.72-P*.25,.18,.38),n.rightElbow.rotation.set(-1.42,0,.28),n.leftShoulder.rotation.set(-.42,.14,.22),n.leftElbow.rotation.set(-.9,0,-.22)}else if(E==="spraying"||c==="sprayBottle"){let P=Math.sin(f*14)*.12;n.rightShoulder.rotation.set(-1.58+P,.14,.18),n.rightElbow.rotation.set(-.46,0,-.1),n.leftShoulder.rotation.set(-.85,.18,.25),n.leftElbow.rotation.set(-.85,0,-.15)}else if(E==="lookInMirror"){let P=Math.sin(f*6)*.12;n.leftShoulder.rotation.set(-1.78+P,.25,.28),n.leftElbow.rotation.set(-1.55,0,-.2),n.rightShoulder.rotation.set(-1.78-P,-.25,-.28),n.rightElbow.rotation.set(-1.55,0,.2)}else if(E==="callingPhone"||c==="phone")n.rightShoulder.rotation.set(-1.08,-.22,.25),n.rightElbow.rotation.set(-1.95,0,.25),n.leftShoulder.rotation.set(-.38,.14,.2),n.leftElbow.rotation.set(-.88,0,-.22);else if(E==="showingKey"||c==="key"){let P=Math.sin(f*6.5)*.18;n.rightShoulder.rotation.set(-1.28,-.15,-.18+P),n.rightElbow.rotation.set(-.42,0,0),n.leftShoulder.rotation.set(-.32,.12,.2),n.leftElbow.rotation.set(-.85,0,-.22)}else if(E==="bangingGavel"||c==="gavel"){let P=Math.pow(Math.max(0,Math.sin(f*7.2)),3);n.rightShoulder.rotation.set(-.65-P*.85,-.15,-.18),n.rightElbow.rotation.set(-.85+P*.45,0,0),n.leftShoulder.rotation.set(-.35,.14,.22),n.leftElbow.rotation.set(-.85,0,-.22)}else if(E==="holdingMic"||c==="mic"){let P=t?Math.sin(f*5.2)*.08:0;n.rightShoulder.rotation.set(-.92+P,-.25,.28),n.rightElbow.rotation.set(-1.62,0,.22),n.leftShoulder.rotation.set(-.42,.18,.22),n.leftElbow.rotation.set(-.9,0,-.22)}else if(E==="examining"||c==="stethoscope"||c==="syringe"){let P=Math.sin(f*4.5)*.16;n.rightShoulder.rotation.set(-1.18+P,-.16,-.22),n.rightElbow.rotation.set(-.55-P*.4,0,0),n.leftShoulder.rotation.set(-.38,.15,.2),n.leftElbow.rotation.set(-.88,0,-.2)}else if(E==="stirring"||c==="ladle"){let P=Math.sin(f*7)*.26,ae=Math.cos(f*7)*.18;n.rightShoulder.rotation.set(-.95+ae,-.18+P,-.24),n.rightElbow.rotation.set(-.78-ae*.5,0,P*.5),n.leftShoulder.rotation.set(-.35,.15,.24),n.leftElbow.rotation.set(-.88,0,-.2)}else if(E==="sipping"||c==="teacup"){let P=.5+.5*Math.sin(f*3.8);n.rightShoulder.rotation.set(-.68-P*.52,-.18,.22),n.rightElbow.rotation.set(-1.05-P*.65,0,.18),n.leftShoulder.rotation.set(-.34,.12,.2),n.leftElbow.rotation.set(-.85,0,-.22)}else if(E==="aarti"||c==="diya"){let P=Math.cos(f*3.6)*.26,ae=Math.sin(f*3.6)*.28;n.rightShoulder.rotation.set(-1.15+ae,-.15,-.18+P),n.rightElbow.rotation.set(-.65,0,0),n.leftShoulder.rotation.set(-.52,.2,.3),n.leftElbow.rotation.set(-1.1,0,-.35)}else if(E==="playingFlute"||c==="flute")n.rightShoulder.rotation.set(-1.15,-.28,.35),n.rightElbow.rotation.set(-1.75,0,.28),n.leftShoulder.rotation.set(-1.08,.28,-.15),n.leftElbow.rotation.set(-1.65,0,.22);else if(E==="sweeping"||c==="broom"){let P=Math.sin(f*6)*.38;n.rightShoulder.rotation.set(-.65,-.15,-.22+P),n.rightElbow.rotation.set(-.8,0,P*.4),n.leftShoulder.rotation.set(-.55,.15,.22+P*.5),n.leftElbow.rotation.set(-.85,0,0)}else if(E==="lapSubdue"){let P=Math.sin(f*7.5)*.08;n.leftShoulder.rotation.set(-1.12+P,.12,.1),n.leftElbow.rotation.set(-.75,0,-.14),n.rightShoulder.rotation.set(-1.12-P,-.12,-.1),n.rightElbow.rotation.set(-.75,0,.14)}else if(E==="lapSubdued"){let P=Math.sin(f*14.5)*.28;n.leftShoulder.rotation.set(-1.45+P,.25,.65),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.45-P,-.25,-.65),n.rightElbow.rotation.set(-.65,0,0)}else if(E==="pillarBurst"){let P=Math.sin(f*5.5)*.1;n.leftShoulder.rotation.set(-.85,.22,.92+P),n.leftElbow.rotation.set(-.55,0,-.18),n.rightShoulder.rotation.set(-.85,-.22,-.92-P),n.rightElbow.rotation.set(-.55,0,.18)}else if(E==="clubStrike"){let P=Math.sin(Math.min(1,a*1.45)*Math.PI);n.rightShoulder.rotation.set(-2.15+P*1.55,-.14,-.22),n.rightElbow.rotation.set(-.35,0,0),n.leftShoulder.rotation.set(-.65,.2,.35),n.leftElbow.rotation.set(-.85,0,-.22)}else if(E==="fireTrial"||E==="serpentAttack"||E==="elephantCharge"||E==="cliffRescue")if(n.isHolika&&s!=="proud"){let P=Math.sin(f*15)*.26;n.leftShoulder.rotation.set(-1.55+P,.22,.52),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.55-P,-.22,-.52),n.rightElbow.rotation.set(-.65,0,0)}else if(n.role==="ChildDevotee")n.leftShoulder.rotation.set(-.95,.25,-.42),n.leftElbow.rotation.set(-1.35,0,-.5),n.rightShoulder.rotation.set(-.95,-.25,.42),n.rightElbow.rotation.set(-1.35,0,.5);else{let P=Math.sin(f*7.5)*.14;n.rightShoulder.rotation.set(-1.38+P,-.15*n.facingSign,-.22),n.rightElbow.rotation.set(-.22,0,0),n.leftShoulder.rotation.set(-.28,.18,.38),n.leftElbow.rotation.set(-.9,0,-.45)}else if(E==="blessing")n.rightShoulder.rotation.set(-1.35,-.14,-.16),n.rightElbow.rotation.set(-1.05,0,.14),n.leftShoulder.rotation.set(-.32,.12,.18),n.leftElbow.rotation.set(-.85,0,-.2);else if(E==="dancing"||E==="adaab"||E==="sufiSpin"){let ae=Sd(f,M?"viralBounce":"sufiKathak",E,n.facingSign<0,0);n.leftShoulder.rotation.set(ae.leftShoulder[0],ae.leftShoulder[1],ae.leftShoulder[2]),n.leftElbow.rotation.set(ae.leftElbow[0],ae.leftElbow[1],ae.leftElbow[2]),n.rightShoulder.rotation.set(ae.rightShoulder[0],ae.rightShoulder[1],ae.rightShoulder[2]),n.rightElbow.rotation.set(ae.rightElbow[0],ae.rightElbow[1],ae.rightElbow[2]),n.torsoGroup.rotation.y+=(ae.torsoRotY-n.torsoGroup.rotation.y)*.35,n.headPivot.rotation.z+=(ae.headRotZ-n.headPivot.rotation.z)*.35}else if(E==="celebrate"){let P=Math.sin(f*9)*.3;n.leftShoulder.rotation.set(-2.42+P,.18,.3),n.leftElbow.rotation.set(-.38,0,-.1),n.rightShoulder.rotation.set(-2.42-P,-.18,-.3),n.rightElbow.rotation.set(-.38,0,.1)}else if(E==="brakeStop"){let P=Math.sin(f*22)*.07;n.leftShoulder.rotation.set(-1.32+P,.18,.26),n.leftElbow.rotation.set(-.26,0,-.12),n.rightShoulder.rotation.set(-1.32-P,-.18,-.26),n.rightElbow.rotation.set(-.26,0,.12)}else if(E==="jumping"){let P=Math.sin(f*8.5)*.48;n.leftShoulder.rotation.set(-1.4+P,.2,.48),n.leftElbow.rotation.set(-.6,0,.2),n.rightShoulder.rotation.set(-1.4-P,-.2,-.48),n.rightElbow.rotation.set(-.6,0,-.2)}else if(t)if(s==="surprised"||s==="scared"){let P=s==="scared"?Math.sin(f*19)*.12:0;n.leftShoulder.rotation.set(-1.3+P,.2,.55),n.leftElbow.rotation.set(-.65,0,0),n.rightShoulder.rotation.set(-1.35-P,-.2,-.55),n.rightElbow.rotation.set(-.65,0,0)}else if(s==="angry"){let P=Math.sin(f*16)*.26;n.leftShoulder.rotation.set(-1.25+P,.25,.38),n.leftElbow.rotation.set(-1.28,0,-.24),n.rightShoulder.rotation.set(-1.25-P,-.25,-.38),n.rightElbow.rotation.set(-1.28,0,.24)}else if(s==="laughing"){let P=Math.sin(f*14)*.24;n.leftShoulder.rotation.set(-1.05+P*.5,.22,.32),n.leftElbow.rotation.set(-.52,0,-.12),n.rightShoulder.rotation.set(-.58+P,-.22,-.28),n.rightElbow.rotation.set(-1.25-P*.4,0,-.32)}else if(s==="smug")n.leftShoulder.rotation.set(-.48,.22,-.25),n.leftElbow.rotation.set(-1.28,0,-.45),n.rightShoulder.rotation.set(-.92+Math.sin(f*4.2)*.16,-.18,-.28),n.rightElbow.rotation.set(-.85,0,.12);else if(s==="proud")n.leftShoulder.rotation.set(-.42,.22,.36),n.leftElbow.rotation.set(-1.05,0,-.45),n.rightShoulder.rotation.set(-1.22+Math.sin(f*5)*.15,-.18,-.3),n.rightElbow.rotation.set(-.62,0,.18);else{let P=Math.sin(f*4.8)*.32,ae=Math.cos(f*3.9)*.24;n.rightShoulder.rotation.set(-.85+P,-.2,-.26),n.rightElbow.rotation.set(-.95+ae,0,0),n.leftShoulder.rotation.set(-.42+ae*.4,.15,.18),n.leftElbow.rotation.set(-.85,0,-.15)}else if(s==="scared"||s==="surprised"){let P=Math.sin(f*18)*.08;n.leftShoulder.rotation.set(-.95+P,.2,.38),n.leftElbow.rotation.set(-1.12,0,-.18),n.rightShoulder.rotation.set(-.95-P,-.2,-.38),n.rightElbow.rotation.set(-1.12,0,.18)}else s==="angry"?(n.leftShoulder.rotation.set(-.42,.2,.42),n.leftElbow.rotation.set(-1.08,0,-.46),n.rightShoulder.rotation.set(-.42,-.2,-.42),n.rightElbow.rotation.set(-1.08,0,.46)):s==="smug"?(n.leftShoulder.rotation.set(-.48,.24,-.32),n.leftElbow.rotation.set(-1.35,0,-.52),n.rightShoulder.rotation.set(-.48,-.24,.32),n.rightElbow.rotation.set(-1.35,0,.52)):s==="sad"?(n.leftShoulder.rotation.set(-.18,.06,.14),n.leftElbow.rotation.set(-.55,0,-.15),n.rightShoulder.rotation.set(-.18,-.06,-.14),n.rightElbow.rotation.set(-.55,0,.15)):(n.leftShoulder.rotation.set(-.32,.12,.18),n.leftElbow.rotation.set(-.85,0,-.25),n.rightShoulder.rotation.set(-.32,-.12,-.18),n.rightElbow.rotation.set(-.85,0,.25));if(X){let P=n.auraRing.material,ae=n.auraDisc.material;P.opacity=t?.55+.15*Math.sin(f*5):.18,ae.opacity=t?.22:.06;let He=t?1.08+.06*Math.sin(f*4.5):.92;n.auraRing.scale.setScalar(He)}if(n.haloGroup&&n.haloMaterial&&(n.haloGroup.visible=n.hasFloorAura!==!1,n.haloGroup.rotation.z=e*.45,n.haloMaterial.opacity=n.role==="Divine"?.72:t?.42:.18),n.pedestalGlow){let P=n.pedestalGlow.material;P.opacity=t?.48:.22}if(n.chakraWheel&&(n.chakraWheel.rotation.z=e*(E==="lapSubdue"||E==="pillarBurst"?6.5:2.8)),n.lowerJawPivot){let P=E==="lapSubdue"||E==="pillarBurst"?Math.max(.26,N*.42):N*.36;n.lowerJawPivot.rotation.x=P}n.pattaEnds&&n.pattaEnds.length>0&&n.pattaEnds.forEach((P,ae)=>{if(E==="lapSubdued"){P.visible=!1;return}P.visible=!0;let He=ae===0?-1:1,L=E==="pillarBurst"||E==="lapSubdue"?.14:.05;P.rotation.z=He*(.14+Math.sin(f*3.4+ae)*L),P.rotation.x=Math.cos(f*2.8+ae)*L*.7})}var wd=(n,e,t)=>n+(e-n)*t,_d=n=>{let e=Math.max(0,Math.min(1,n));return e*e*(3-2*e)};function Sd(n,e,t="dancing",i=!1,s=0){let r=i?-1:1;if(e==="viralBounce"){let f=Math.abs(Math.sin(n*7.2)),E=Math.sin(n*3.6);return{hipOffsetX:E*.14*r,liftY:Math.pow(f,2.4)*.06,bodyRotY:Math.sin(n*1.8)*.24*r,bodyRotZ:E*.08*r,torsoRotX:.06+f*.06,torsoRotY:-E*.14*r,torsoRotZ:-E*.07*r,headRotZ:E*.1*r,leftHipX:-f*.24+E*.16,rightHipX:-f*.24-E*.16,leftKneeX:f*.44,rightKneeX:f*.44,leftShoulder:[-.95+E*.55,.22*r,.52*r],leftElbow:[-.85+f*.35,0,.22*r],rightShoulder:[-.95-E*.55,-.22*r,-.52*r],rightElbow:[-.85+f*.35,0,-.22*r]}}let o=e==="bhangra"?1.32:.92,a=n*o%4,l=t==="adaab"?0:t==="sufiSpin"?3:Math.floor(a),c=t==="dancing"?a-Math.floor(a):n*o%1,h=s>0?Math.pow(1-s,2)*.16:Math.abs(Math.sin(n*Math.PI*o*2))*.14,d=Math.sin(c*Math.PI*2);if(l===0){let f=_d(Math.sin(c*Math.PI));return{hipOffsetX:-.09*r*f,liftY:0,bodyRotY:.16*r*f,bodyRotZ:.04*r*f,torsoRotX:.09*f,torsoRotY:-.12*r*f,torsoRotZ:-.07*r*f,headRotZ:.1*r*f,leftHipX:-.14-h*.25,rightHipX:-.06-h*.15,leftKneeX:.24+h*.55,rightKneeX:.12+h*.35,leftShoulder:[-.78*f-.24,.28*r,(.42+.18*f)*r],leftElbow:[-.48-.28*f,0,-.18*r],rightShoulder:[wd(-.45,-1.42,f),-.32*r,(-.36-.16*f)*r],rightElbow:[wd(-.55,-1.28,f),0,.24*f*r]}}if(l===1){let f=Math.sin(c*Math.PI*2);return{hipOffsetX:f*.15*r,liftY:0,bodyRotY:f*.22*r,bodyRotZ:f*.05*r,torsoRotX:.05,torsoRotY:-f*.22*r,torsoRotZ:-f*.09*r,headRotZ:f*.14*r,leftHipX:-.16+Math.max(0,f)*.18,rightHipX:-.16+Math.max(0,-f)*.18,leftKneeX:.26+Math.abs(f)*.24+h,rightKneeX:.26+Math.abs(f)*.24+h,leftShoulder:[-1.18+f*.52,.32*r,(.58+f*.32)*r],leftElbow:[-.72+Math.cos(c*Math.PI*2)*.35,0,.26*r],rightShoulder:[-1.18-f*.52,-.32*r,(-.58+f*.32)*r],rightElbow:[-.72-Math.cos(c*Math.PI*2)*.35,0,-.26*r]}}if(l===2){let f=d,E=e==="bhangra"?.35:0;return{hipOffsetX:f*.16*r,liftY:e==="bhangra"?Math.max(0,Math.abs(f)-.6)*.12:0,bodyRotY:f*.2*r,bodyRotZ:f*.06*r,torsoRotX:.08+h*.25,torsoRotY:-f*.18*r,torsoRotZ:-f*.07*r,headRotZ:f*.11*r,leftHipX:-.12+f*.28,rightHipX:-.12-f*.28,leftKneeX:.2+Math.max(0,-f)*.48+h,rightKneeX:.2+Math.max(0,f)*.48+h,leftShoulder:[-1.45-E+f*.38,.24*r,(.64+f*.24)*r],leftElbow:[-.88+f*.24,0,.18*r],rightShoulder:[-1.05-E-f*.42,-.24*r,(-.52+f*.24)*r],rightElbow:[-.88-f*.24,0,-.18*r]}}let u=_d(c),p=Math.sin(u*Math.PI);return{hipOffsetX:Math.sin(u*Math.PI)*.08*r,liftY:e==="bhangra"?p*.08:0,bodyRotY:u*Math.PI*2*r,bodyRotZ:.04*r*p,torsoRotX:-.05*p,torsoRotY:0,torsoRotZ:0,headRotZ:-.08*r*p,leftHipX:-.12,rightHipX:-.12,leftKneeX:.22+h*.4,rightKneeX:.22+h*.4,leftShoulder:[-1.55-.35*p,.28*r,(.68+.32*p)*r],leftElbow:[-.42-.22*p,0,.24*r],rightShoulder:[-1.55-.35*p,-.28*r,(-.68-.32*p)*r],rightElbow:[-.42-.22*p,0,-.24*r]}}function AE(n,e=0){let t=PE(n);n.bodyPivot.position.y=0,n.bodyPivot.updateMatrixWorld(!0);let i=1/0;for(let r of[t.left,t.right])r&&(r.getWorldPosition(mc),n.root.worldToLocal(mc),i=Math.min(i,mc.y));let s=Number.isFinite(i)?Math.max(-.55,Math.min(.45,-i)):0;n.bodyPivot.position.y=s+Math.max(0,Math.min(.6,e))}var Rx=new D(0,-1,0),Cx=new D(0,1,0),HE=new D(1,0,0),Ax=new Nt,Hx=new Nt().setFromAxisAngle(HE,-.3),Px=new Nt().setFromEuler(new hn(-.1,0,-.18)),Ix=new Nt().setFromEuler(new hn(-.1,0,.18)),Dx=new Nt().setFromEuler(new hn(-.25,0,0)),Lx=new Nt,Bx=new Nt,Gx=new Nt,Ux=new Nt,Fx=new Nt,Nx=new Nt,kx=new D,Ox=new D,zx=new D,Vx=new D,Wx=new D,mc=new D,Xx=new xt,vd=new WeakMap;function PE(n){let e=vd.get(n);if(!e){let t=(i,s)=>{let r=s??i;if(!r)return null;let o=new Bt;return o.position.set(0,s?-.323:-.39,.04),r.add(o),o};e={left:t(n.leftHip,n.leftKnee),right:t(n.rightHip,n.rightKnee)},vd.set(n,e)}return e}function Cd(n){let e=n.width/n.height,t=n.height>n.width,i=t?37:36,s=new Lt(i,e,.1,100),r=t?4.65:4.8,o=t?1.24:1.05,a=t?1.04:.92;return s.position.set(0,o,r),s.lookAt(0,a,0),{camera:s,currentPos:new D(0,o,r),currentLook:new D(0,a,0),baseFov:i}}function Ad(n,e,t,i,s,r,o,a,l,c="auto",h="none",d=!1,u=.5,p=1.38,f="Auto",E,M){let m=e.height>e.width,w=f==="PalaceCourt",y=w?m?5.95:5.45:m?4.65:4.8,x=w?m?1.32:1.18:m?1.24:1.05,b=w?m?1.04:.96:m?1.04:.92;if(e.stageLayout?.templateBackdrop&&!e.sceneBlueprint&&f!=="Classroom"){n.camera.position.set(0,x,y),n.camera.lookAt(0,b,0);return}let v=(r+o)*.45,R=x,C=y,_=(r+o)*.48,T=b,I=0,G=(r+o)*.5;if(!e.enableDynamicCamera||l){let he=l?Math.min(1,t/2.6)*.45:0;C=y-he,R=x+(l?(1-Math.min(1,t/2.6))*.25:0)}else i>.88?(C=y+.35,R=x+.12):s==="Left"?(v=G*.72+r*.28,C=y*.92,R=x+.03,_=G*.65+r*.35,T=b+.05):s==="Right"&&(v=G*.72+o*.28,C=y*.92,R=x+.03,_=G*.65+o*.35,T=b+.05);let F=!!e.isComedyMode,k=Math.sin(t*.35)*.006,Y=Math.cos(t*.28)*.004,X=0;if(a==="surprised"||a==="angry"){let he=F&&c==="auto"&&!l&&s!=="Narrator"&&h!=="cutting"&&h!=="lookInMirror";if(C*=F?a==="angry"&&he?.66:.72:.93,F){let ue=s==="Left"?r:s==="Right"?o:G;he&&a==="angry"?(v=G*.4+ue*.6,_=G*.25+ue*.75,T=Math.max(m?1.08:1.18,p*.94)):(v=G*.65+ue*.35,_=G*.55+ue*.45,T=m?1.08:1.18),R=m?1.24:1.25}}else F&&a==="laughing"&&(C*=.82);let ie=h==="lapSubdue"||h==="lapSubdued"||h==="pillarBurst",O=h==="serpentAttack"||h==="elephantCharge"||h==="fireTrial"||h==="cliffRescue";(w||O)&&!ie&&(C=Math.max(C,m?5.65:5.05),R=Math.max(R,x),T=Math.min(T,1.04),O&&(v=0,_=0));let re=!!e.stageLayout?.templateBackdrop;if(!re&&!l&&(!w&&!O||ie)){let he=s==="Left"?r:s==="Right"?o:(r+o)*.5;if(h==="corpseSnapUp"){let ue=Math.max(0,1-Math.min(1,u/.28));v=0,R=Math.max(m?1.18:1.06,p*.96),C=(m?2.48:2.32)-ue*.24,_=0,T=Math.max(.88,p*.88),X+=Math.sin(t*28)*.024*ue,k+=Math.cos(t*42)*.026*ue,Y+=Math.sin(t*36)*.02*ue}else if(F&&f==="LivingRoom"&&h.startsWith("hazard"))v=G*.12,R=m?1.8:1.62,C=m?5.35:4.25,_=G*.12,T=m?1.18:1.04;else if(F&&f==="LivingRoom"&&m&&(c==="twoShot"||c==="wideEstablishing"))v=G*.12,R=1.66,C=5.1,_=G*.12,T=1.06;else if(ie)v=0,R=m?1.16:1.04,C=m?5.2:4.45,_=0,T=1.06;else if(c==="closeUpSpeaker"&&s!=="Narrator"){let ue=f==="Temple"||f==="RiverGhat"||f==="PalaceCourt";v=ue?he*.65:he,R=ue?1.16:Math.max(m?1.08:.92,p*.98),C=ue?m?3.25:3.15:m?2.68:2.55,_=ue?he*.55:he,T=ue?.92:Math.max(.76,p*.88)}else if(c==="crashPunch"&&s!=="Narrator"){let ue=Math.max(0,1-Math.min(1,u/.28));v=he,R=Math.max(m?1.08:.92,p*.98),C=(m?2.48:2.35)-ue*.28,_=he,T=Math.max(.78,p*.88),X+=Math.sin(t*28)*.025*ue,k+=Math.cos(t*42)*.028*ue,Y+=Math.sin(t*36)*.022*ue}else if(c==="twoShot")v=G,R=m?1.2:1.18,C=m?3.35:3.05,_=G,T=m?1.05:1;else if(c==="reactionZoom"){let ue=he*.65+G*.35;v=ue*.9,R=m?1.22:1.26,C=m?2.85:2.45,_=ue,T=Math.max(m?1.06:1.14,p*.94)}else if(c==="wideEstablishing")v=(r+o)*.25,R=m?1.32:1.44,C=m?4.85:4.45,_=(r+o)*.35,T=m?1.02:.92;else if(c==="lowDramatic")v=he*.45,R=m?.92:.68,C=m?2.85:2.95,_=he*.8,T=Math.max(1.12,p*.9);else if(c==="overShoulder"&&s!=="Narrator"){let ue=s==="Left"?o:r;v=m?(r+o)*.45:ue*.9,R=m?1.24:1.38,C=m?3.25:2.75,_=m?he*.68+ue*.32:he,T=Math.max(m?1.04:.9,p*.92)}(h==="walking"||h==="running")&&(v=he*.65,_=he*.85)}if(l&&F&&f==="LivingRoom"&&m&&(v=0,R=1.62,C=5.15,_=0,T=1.04),E){let he=E,ue=M??{x:he.x,y:he.y,z:he.z+2.2,rotY:he.rotY+Math.PI},$=Math.sin(he.rotY),ge=Math.cos(he.rotY),Ae=Math.max(.85,he.y+p-.08);if(c==="closeUpSpeaker"||c==="crashPunch"||c==="reactionZoom"){let xe=c==="crashPunch"?1.35:1.62;v=he.x+$*xe,R=Ae+.02,C=he.z+ge*xe,_=he.x,T=Ae-.04,I=he.z}else if(c==="lowDramatic")v=he.x+$*1.78+.22,R=Math.max(.62,Ae-.62),C=he.z+ge*1.78,_=he.x,T=Ae+.04,I=he.z;else if(c==="overShoulder"){let xe=Math.sin(ue.rotY),J=Math.cos(ue.rotY),Me=Math.cos(ue.rotY),j=-Math.sin(ue.rotY);v=ue.x-xe*.92+Me*.85,R=Math.max(1.42,ue.y+1.46),C=ue.z-J*.92+j*.85,_=he.x*.85+ue.x*.15,T=Ae*.88,I=he.z*.88+ue.z*.12}else if(c==="twoShot"){let xe=(he.x+ue.x)*.5,J=(he.z+ue.z)*.5;v=xe+2.25,R=1.48,C=J+2.35,_=xe,T=.98,I=J}else v=.35,R=1.85,C=3.55,_=-.15,T=1.05,I=-1.15}let ee=new D(v+k,R+Y,C),be=new D(_,T,I);if(e.isSeamlessLoop){let he=new D(0,x,y),ue=new D(0,b,0);if(i>.86){let $=Math.min(1,(i-.86)/.14);ee.lerp(he,$),be.lerp(ue,$),X*=1-$}else if(i<.06){let $=1-i/.06;ee.lerp(he,$),be.lerp(ue,$),X*=1-$}}if(d&&!re&&(F||c==="crashPunch"||c==="closeUpSpeaker"))n.currentPos.lerp(ee,.94),n.currentLook.lerp(be,.94);else{let ue=1-Math.exp(-(F?13:c==="wideEstablishing"?4.2:6.4)/Math.max(1,e.fps));n.currentPos.lerp(ee,ue),n.currentLook.lerp(be,ue)}n.camera.position.copy(n.currentPos),n.camera.lookAt(n.currentLook),n.camera.rotation.z+=X}function Pd(n){return{plan:null}}var Ba=new yr,Hr=new kn,Ga=new D,Sn=new Lt,gc=new wi,Hd=new xt,ss=new D(0,1,0);function IE(n,e){let t=n;for(;t;){if(t===e)return!0;t=t.parent}return!1}function DE(n){let e=n;for(;e;){if(!e.visible)return!1;e=e.parent}return!0}function Mc(n){if(n.headPivot.updateWorldMatrix(!0,!0),Hr.makeEmpty(),n.headPivot.traverseVisible(i=>{let s=i;if(!s.isMesh||!s.geometry)return;s.geometry.boundingBox||s.geometry.computeBoundingBox();let r=s.geometry.boundingBox.clone().applyMatrix4(s.matrixWorld);[r.min.x,r.min.y,r.min.z,r.max.x,r.max.y,r.max.z].every(Number.isFinite)&&Hr.union(r)}),Hr.isEmpty())return{rig:n,center:n.headPivot.getWorldPosition(new D),radius:.28};let e=Hr.getCenter(new D);Hr.getSize(Ga);let t=Math.max(.12,Math.min(.6,Math.max(Ga.x,Ga.y,Ga.z)*.5));return{rig:n,center:e,radius:t}}function Id(n){return n.root.rotation.y+n.bodyPivot.rotation.y}function Ua(n){let e=Id(n);return new D(Math.sin(e),0,Math.cos(e))}function LE(n,e){return Math.abs(n.x)<e.halfWidth-.25&&Math.abs(n.z)<e.halfDepth-.25&&n.y>.35&&n.y<e.height-.15}function BE(n,e,t,i,s){let r=t.clone().sub(e),o=r.length();if(o<.001)return!0;r.divideScalar(o),Ba.set(e,r),Ba.near=.05,Ba.far=Math.max(.1,o-i);for(let a of Ba.intersectObjects(n.children,!0)){let l=a.object;if(l.isPoints||l.isSprite||!DE(l))continue;let c=l.material,h=Array.isArray(c)?c[0]:c;if(!(h&&h.transparent&&(h.opacity??1)<.5)&&!s.some(d=>IE(l,d)))return!1}return!0}function GE(n,e,t,i){let s=t.radius;return[t.center,t.center.clone().addScaledVector(ss,s*.55),t.center.clone().addScaledVector(ss,-s*.85)].every(o=>BE(n,e,o,s*.45,i))}function Fa(n,e,t,i,s,r,o={}){if(!LE(e,n.room))return null;let a=o.allowNear??[],c=[...i.map(u=>u.rig.root),...a.map(u=>u.root)];Sn.fov=r,Sn.aspect=n.aspect,Sn.near=.05,Sn.far=60,Sn.position.copy(e),Sn.up.copy(ss),Sn.lookAt(t),Sn.updateMatrixWorld(!0),Sn.updateProjectionMatrix(),Hd.multiplyMatrices(Sn.projectionMatrix,Sn.matrixWorldInverse),gc.setFromProjectionMatrix(Hd);let h=0,d=1/0;for(let u of i){if(!gc.containsPoint(u.center))return null;let p=e.clone().sub(u.center),f=p.length();if(o.maxElevation!==void 0){let M=Math.hypot(p.x,p.z);if(Math.atan2(p.y,Math.max(.001,M))>o.maxElevation)return null}d=Math.min(d,f),p.y=0,p.normalize();let E=Ua(u.rig).dot(p);if(E<(o.minFacing??.15)||(h+=E,!GE(n.scene,e,u,c)))return null}for(let u of s){if(i.some(f=>f.rig===u.rig)||a.includes(u.rig))continue;let p=e.distanceTo(u.center);if(o.relaxed?.includes(u.rig)){if(p<u.radius*2.8)return null;continue}if(p<u.radius*(o.master?4.5:3.6))return null;if(!o.master&&gc.intersectsSphere(new On(u.center,u.radius))){if(p<d*.8)return null;if(p<d*(o.foreground??.8)){let f=Math.tan(Rr.degToRad(r*.5)),E=u.center.clone().project(Sn),M=u.radius/p/f;if(Math.abs(E.x)+M/n.aspect>.96||Math.abs(E.y)+M>.96)return null;for(let m of i){let w=m.center.clone().project(Sn),y=m.radius/e.distanceTo(m.center)/f,x=(E.x-w.x)*n.aspect,b=E.y-w.y;if(Math.hypot(x,b)<(M+y)*.9)return null}}}}return h/Math.max(1,i.length)}function Pr(n,e,t,i,s,r){let o=e.radius,a=Math.tan(Rr.degToRad(r*.5)),l=i*o/a,c=Id(e.rig),h=new D(0,-o*.35,0),d=e.center.clone().add(h),u=[.22,-.22,.45,-.45,0,.7,-.7,.95,-.95],p=[1,.86,1.15,.74,.62],f=[0,o*.5,o*1.1,o*1.9,o*3];for(let E of f)for(let M of p)for(let m of u){let w=c+m,y=l*M,x=new D(d.x+Math.sin(w)*y,d.y+o*s+E,d.z+Math.cos(w)*y);if(Fa(n,x,d,[e],t,r,{minFacing:.3,foreground:1.08,maxElevation:.42,relaxed:n.listener?[n.listener]:[]})!==null)return{offset:x.sub(e.center),lookOffset:h,pushIn:.05,punch:!1}}return null}function UE(n,e,t,i,s){let r=e.center.clone().add(t.center).multiplyScalar(.5),o=new D(t.center.x-e.center.x,0,t.center.z-e.center.z),a=o.length(),l=a>.001?new D(-o.z,0,o.x).divideScalar(a):Ua(e.rig);l.dot(Ua(e.rig))+l.dot(Ua(t.rig))<0&&l.negate();let c=Math.max(e.radius,t.radius),h=Math.tan(Rr.degToRad(s*.5)),d=h*n.aspect,u=Math.max((a*.5+c*2.4)/d,(Math.abs(e.center.y-t.center.y)*.5+c*2.6)/h),p=r.clone().addScaledVector(ss,-c*.6),f=null;for(let E of[0,.25,-.25,.5,-.5,.75,-.75]){for(let M of[1,1.15,.9])for(let m of[c*.5,c*1.6,c*2.8]){let w=l.clone().applyAxisAngle(ss,E),y=p.clone().addScaledVector(w,u*M);y.y+=m;let x=Fa(n,y,p,[e,t],i,s,{minFacing:-.05});if(x===null)continue;let b=x-Math.abs(E)*.2;(!f||b>f.score)&&(f={pos:y,score:b})}if(f&&f.score>.5)break}return f?{offset:f.pos.sub(e.center),lookOffset:p.sub(e.center),pushIn:.03,punch:!1}:null}function FE(n,e,t,i,s){let r=t.center.clone().sub(e.center);if(r.y=0,r.lengthSq()<1e-4)return null;r.normalize();let o=new D(r.z,0,-r.x),a=e.center.clone().addScaledVector(ss,-e.radius*.3);for(let l of[1,-1])for(let c of[2.8,3.4]){let h=t.center.clone().addScaledVector(r,t.radius*c).addScaledVector(o,l*t.radius*1.6);if(h.y+=t.radius*.6,Fa(n,h,a,[e],i,s,{allowNear:[t.rig],minFacing:.2})!==null)return{offset:h.sub(e.center),lookOffset:a.sub(e.center),pushIn:.02,punch:!1}}return null}function NE(n,e,t,i){let{room:s}=n,r=s.height-.45,o=s.halfWidth-.5,a=s.halfDepth-.5,l=[new D(o,r,a),new D(-o,r,a),new D(.6,r,a),new D(o,r,-a),new D(-o,r,-a),new D(-.6,r,-a+.2),new D(o,r-.4,0),new D(-o,r-.4,0)],c=t.reduce((d,u)=>d.add(u.center),new D).divideScalar(Math.max(1,t.length)),h=null;for(let d of l){let u=e.center.clone().multiplyScalar(.6).add(c.clone().multiplyScalar(.4));u.y=Math.min(e.center.y,1.05);let p=Fa(n,d,u,[e],t,i,{minFacing:.2,master:!0});p!==null&&(!h||p>h.score)&&(h={pos:d,look:u,score:p})}if(!h){let d=l[0],u=e.center.clone();u.y=1,h={pos:d,look:u,score:0}}return{offset:new D,lookOffset:new D,fixedPos:h.pos,fixedLook:h.look,pushIn:.025,punch:!1}}function Dd(n,e,t,i){let s=n.baseFov;i.scene.updateMatrixWorld(!0);let r=Mc(i.speaker),o=i.shot||"auto";if(i.cut||!e.plan){let u=i.everyone.filter(E=>E.root.visible).map(Mc),p=i.listener?Mc(i.listener):void 0,f=null;o==="closeUpSpeaker"?f=Pr(i,r,u,1.6,.1,s):o==="reactionZoom"?f=Pr(i,r,u,1.3,.05,s):o==="crashPunch"?(f=Pr(i,r,u,1.4,.05,s),f&&(f.punch=!0)):o==="lowDramatic"?f=Pr(i,r,u,1.9,-1.2,s):o==="twoShot"&&p?f=UE(i,r,p,u,s):o==="overShoulder"&&p&&(f=FE(i,r,p,u,s)),!f&&o!=="wideEstablishing"&&o!=="auto"&&(f=Pr(i,r,u,2.2,.3,s)),e.plan=f??NE(i,r,u,s)}let a=e.plan,l,c;a.fixedPos&&a.fixedLook?(l=a.fixedPos.clone(),c=a.fixedLook.clone()):(l=r.center.clone().add(a.offset),c=r.center.clone().add(a.lookOffset));let h=u=>u*u*(3-2*u),d=a.pushIn*h(Math.max(0,Math.min(1,i.turnLocal)));if(a.punch){let u=Math.min(1,i.turnLocal/.2);d=-.25+.31*(1-Math.pow(1-u,3))}if(l.lerp(c,d),i.cut)n.currentPos.copy(l),n.currentLook.copy(c);else{let u=1-Math.exp(-2.2/Math.max(1,t.fps));n.currentPos.lerp(l,u),n.currentLook.lerp(c,u)}n.camera.fov=s,n.camera.updateProjectionMatrix(),n.camera.position.copy(n.currentPos),n.camera.up.copy(ss),n.camera.lookAt(n.currentLook)}var Ir=class n extends g{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this.camera=new Lt;let i=this,s=t.color!==void 0?new Ne(t.color):new Ne(8355711),r=t.textureWidth||512,o=t.textureHeight||512,a=t.clipBias||0,l=t.shader||n.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new Rn,d=new D,u=new D,p=new D,f=new xt,E=new D(0,0,-1),M=new vt,m=new D,w=new D,y=new vt,x=new xt,b=this.camera,v=new Cn(r,o,{samples:c,type:Ci}),R=new $t({name:l.name!==void 0?l.name:"unspecified",uniforms:ba.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});R.uniforms.tDiffuse.value=v.texture,R.uniforms.color.value=s,R.uniforms.textureMatrix.value=x,this.material=R,this.onBeforeRender=function(C,_,T){if(u.setFromMatrixPosition(i.matrixWorld),p.setFromMatrixPosition(T.matrixWorld),f.extractRotation(i.matrixWorld),d.set(0,0,1),d.applyMatrix4(f),m.subVectors(u,p),m.dot(d)>0===!0&&this.forceUpdate===!1)return;m.reflect(d).negate(),m.add(u),f.extractRotation(T.matrixWorld),E.set(0,0,-1),E.applyMatrix4(f),E.add(p),w.subVectors(u,E),w.reflect(d).negate(),w.add(u),b.position.copy(m),b.up.set(0,1,0),b.up.applyMatrix4(f),b.up.reflect(d),b.lookAt(w),b.far=T.far,b.updateMatrixWorld(),b.projectionMatrix.copy(T.projectionMatrix),x.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),x.multiply(b.projectionMatrix),x.multiply(b.matrixWorldInverse),x.multiply(i.matrixWorld),h.setFromNormalAndCoplanarPoint(d,u),h.applyMatrix4(b.matrixWorldInverse),M.set(h.normal.x,h.normal.y,h.normal.z,h.constant);let G=b.projectionMatrix;y.x=(Math.sign(M.x)+G.elements[8])/G.elements[0],y.y=(Math.sign(M.y)+G.elements[9])/G.elements[5],y.z=-1,y.w=(1+G.elements[10])/G.elements[14],M.multiplyScalar(2/M.dot(y)),G.elements[2]=M.x,G.elements[6]=M.y,G.elements[10]=M.z+1-a,G.elements[14]=M.w,i.visible=!1;let F=C.getRenderTarget(),k=C.xr.enabled,Y=C.shadowMap.autoUpdate;C.xr.enabled=!1,C.shadowMap.autoUpdate=!1,C.setRenderTarget(v),C.state.buffers.depth.setMask(!0),C.autoClear===!1&&C.clear(),C.render(_,b),C.xr.enabled=k,C.shadowMap.autoUpdate=Y,C.setRenderTarget(F);let X=T.viewport;X!==void 0&&C.state.viewport(X),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return v},this.dispose=function(){v.dispose(),i.material.dispose()}}};Ir.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function kE(n){let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.fillStyle=n,t.fillRect(0,0,256,256);for(let s=0;s<420;s++)t.fillStyle=s%2===0?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",t.fillRect(s*73%256,s*137%256,3,3);t.strokeStyle="rgba(0,0,0,0.16)",t.lineWidth=3;for(let s=0;s<=256;s+=64)t.beginPath(),t.moveTo(s,0),t.lineTo(s,256),t.stroke(),t.beginPath(),t.moveTo(0,s),t.lineTo(256,s),t.stroke();let i=new Qt(e);return i.wrapS=ni,i.wrapT=ni,i.repeat.set(5,5),i.colorSpace=At,i}function OE(n="#9a6234"){let e=document.createElement("canvas");e.width=256,e.height=256;let t=e.getContext("2d");t.fillStyle=n,t.fillRect(0,0,256,256);for(let s=0;s<256;s+=4)t.fillStyle=s%8===0?"rgba(60,30,10,0.12)":"rgba(255,220,175,0.06)",t.fillRect(0,s,256,2);let i=new Qt(e);return i.wrapS=ni,i.wrapT=ni,i.colorSpace=At,i}function zE(){let n=document.createElement("canvas");n.width=256,n.height=256;let e=n.getContext("2d");e.fillStyle="#f8fafc",e.beginPath(),e.arc(128,128,122,0,Math.PI*2),e.fill(),e.strokeStyle="#334155",e.lineWidth=8,e.stroke(),e.fillStyle="#0f172a",e.font="bold 24px sans-serif",e.textAlign="center",e.textBaseline="middle";for(let i=1;i<=12;i++){let s=i/12*Math.PI*2-Math.PI/2;e.fillText(String(i),128+Math.cos(s)*90,128+Math.sin(s)*90)}e.strokeStyle="#0f172a",e.lineWidth=6,e.beginPath(),e.moveTo(128,128),e.lineTo(84,88),e.stroke(),e.lineWidth=4,e.beginPath(),e.moveTo(128,128),e.lineTo(186,98),e.stroke(),e.strokeStyle="#dc2626",e.lineWidth=2,e.beginPath(),e.moveTo(128,128),e.lineTo(175,165),e.stroke();let t=new Qt(n);return t.colorSpace=At,t}function VE(){let n=document.createElement("canvas");n.width=512,n.height=256;let e=n.getContext("2d");e.fillStyle="#182420",e.fillRect(0,0,512,256);for(let i=0;i<18;i++)e.fillStyle="rgba(255,255,255,0.03)",e.beginPath(),e.arc(i*67%512,i*43%256,34,0,Math.PI*2),e.fill();e.strokeStyle="rgba(241,245,249,0.55)",e.lineWidth=3,e.beginPath(),e.moveTo(60,190),e.lineTo(150,190),e.lineTo(60,95),e.closePath(),e.stroke(),e.beginPath(),e.arc(380,130,48,0,Math.PI*2),e.stroke(),e.fillStyle="rgba(248,250,252,0.75)",e.font="bold 26px sans-serif",e.fillText("EXAM HALL \u2014 NO CHEATING",120,46);let t=new Qt(n);return t.colorSpace=At,t}function WE(){let n=document.createElement("canvas");n.width=256,n.height=192;let e=n.getContext("2d");e.fillStyle="#4a321f",e.fillRect(0,0,256,192);let t=[[26,26,42,46,"#fde047"],[92,34,40,44,"#fef08a"],[164,24,44,48,"#bbf7d0"],[40,96,46,48,"#fed7aa"],[118,102,42,46,"#fde047"],[182,92,40,44,"#bfdbfe"]];for(let[s,r,o,a,l]of t)e.fillStyle=l,e.fillRect(s,r,o,a);let i=new Qt(n);return i.colorSpace=At,i}function XE(n,e){let t=new le;t.position.set(e.x,e.y,e.z),t.rotation.y=e.rotY??0;let i=e.width??1.2,s=e.height??1;if(e.kind==="blackboard"){let r=new g(new W(i+.16,s+.16,.08),new H({color:6044193,roughness:.65}));t.add(r);let o=new g(new rt(i,s),new H({map:VE(),roughness:.92}));o.position.z=.045,t.add(o);let a=new g(new W(i+.16,.06,.14),new H({color:6044193,roughness:.65}));a.position.set(0,-s/2-.05,.05),t.add(a)}else if(e.kind==="clock"){let r=new g(new Ee(i*.52,i*.52,.06,28),new H({color:4674921,metalness:.5,roughness:.35}));r.rotation.x=Math.PI/2,t.add(r);let o=new g(new Ct(i*.48,28),new De({map:zE()}));o.position.z=.035,t.add(o)}else if(e.kind==="portraitFrame"){let r=new g(new W(i+.08,s+.08,.05),new H({color:7028251,roughness:.55}));t.add(r);let o=new g(new rt(i,s),new H({color:e.color??"#cbd5e1",roughness:.8}));o.position.z=.03,t.add(o);let a=new g(new Ct(Math.min(i,s)*.22,16),new H({color:10105874,roughness:.7}));a.position.set(0,s*.06,.035),t.add(a)}else if(e.kind==="noticeBoard"){let r=new g(new W(i+.08,s+.08,.05),new H({color:3876374,roughness:.65}));t.add(r);let o=new g(new rt(i,s),new H({map:WE(),roughness:.9}));o.position.z=.03,t.add(o)}else if(e.kind==="window"){let r=new H({color:7877903,roughness:.55}),o=new g(new rt(i,s),new De({color:16710083}));o.position.z=.01,t.add(o);let a=new g(new W(i+.1,.07,.08),r);a.position.y=s/2;let l=a.clone();l.position.y=-s/2;let c=new g(new W(.05,s,.07),r);t.add(a,l,c)}else if(e.kind==="door"){let r=new g(new W(i,s,.08),new H({color:e.color??"#94a3b8",roughness:.5}));t.add(r);let o=new g(new W(i+.12,s+.08,.05),new H({color:4674921,roughness:.6}));o.position.z=-.02,t.add(o)}n.add(t)}function YE(n,e,t){let i=new le;i.position.set(e.x,e.y??0,e.z),i.rotation.y=e.rotY??0;let s=new H({map:t,color:e.color??"#c88a55",roughness:.62}),r=new H({color:3359061,metalness:.55,roughness:.45}),o=e.width??1.1,a=e.height??.72,l=e.depth??.55;if(e.kind==="desk"||e.kind==="table"){let c=new g(new W(o,.05,l),s);c.position.y=a,c.castShadow=!0,c.receiveShadow=!0,i.add(c);let h=new g(new W(o-.08,.22,.04),s);h.position.set(0,a-.14,l/2-.06),i.add(h);let d=new W(.05,a,.05);for(let u of[-o/2+.06,o/2-.06])for(let p of[-l/2+.06,l/2-.06]){let f=new g(d,r);f.position.set(u,a/2,p),f.castShadow=!0,i.add(f)}}else if(e.kind==="bench"||e.kind==="chair"){let c=e.seatHeight??.42,h=new g(new W(o,.045,l),s);h.position.y=c,h.castShadow=!0,h.receiveShadow=!0,i.add(h);let d=new g(new W(o,.36,.04),s);d.position.set(0,c+.22,-l/2+.03),d.castShadow=!0,i.add(d);let u=new W(.045,c,.045);for(let p of[-o/2+.06,o/2-.06])for(let f of[-l/2+.06,l/2-.06]){let E=new g(u,r);E.position.set(p,c/2,f),i.add(E)}}else if(e.kind==="podium"){let c=new g(new W(o,a,l),s);c.position.y=a/2,c.castShadow=!0,c.receiveShadow=!0,i.add(c)}n.add(i)}function qE(n,e){let t=new le;t.position.set(e.x,e.y,e.z),t.rotation.y=e.rotY??0;let i=e.scale??1;if(t.scale.setScalar(i),e.kind==="examPaper"){let s=new g(new W(.24,.006,.3),new H({color:16317180,roughness:.9}));t.add(s)}else if(e.kind==="pen"){let s=new g(new Ee(.008,.006,.14,8),new H({color:e.color??"#0284c7",roughness:.4}));s.rotation.z=Math.PI/2,s.position.y=.01,t.add(s)}else if(e.kind==="book"){let s=new g(new W(.22,.04,.28),new H({color:e.color??"#1d4ed8",roughness:.7}));s.position.y=.02,t.add(s)}else if(e.kind==="duster"){let s=new g(new W(.14,.04,.06),new H({color:7877903,roughness:.8}));s.position.y=.02,t.add(s)}n.add(t)}function yc(n,e,t){let i=e.room??{},s=i.width??9.6,r=i.depth??8.4,o=i.height??3.6,a=-r/2,l=r/2,c=kE(i.floorColor??"#d6b4a1"),h=OE("#a86b3a"),d=new g(new rt(s,r),new H({map:c,roughness:.78}));d.rotation.x=-Math.PI/2,d.receiveShadow=!0,n.add(d);let u=new H({color:i.wallColor??"#dcd795",roughness:.88}),p=new H({color:i.wallTrimColor??"#a3a86b",roughness:.85}),f=new g(new rt(s,o),u);f.position.set(0,o/2,a),n.add(f);let E=new g(new rt(s,o),u);E.position.set(0,o/2,l),E.rotation.y=Math.PI,n.add(E);let M=new g(new rt(r,o),u);M.position.set(-s/2,o/2,0),M.rotation.y=Math.PI/2,n.add(M);let m=new g(new rt(r,o),u);m.position.set(s/2,o/2,0),m.rotation.y=-Math.PI/2,n.add(m);let w=new g(new W(s,.25,.04),p);w.position.set(0,.125,a+.02),n.add(w);let y=new g(new rt(s,r),new H({color:i.ceilingColor??"#b4c6b8",roughness:.92}));y.rotation.x=Math.PI/2,y.position.y=o,n.add(y);let x=new Ut(16776171,1.35,14);x.position.set(0,o-.35,0),n.add(x);for(let b of e.wallFixtures??[])XE(n,b);for(let b of e.furniture??[])YE(n,b,h);for(let b of e.props??[])qE(n,b);e.spots&&Object.assign(t,e.spots)}function Ld(){let n=[{id:"teacher_podium",kind:"podium",x:.85,z:-2.05,width:1.05,height:.84,depth:.62,color:"#8b4513"}],e=[{kind:"book",x:.72,y:.85,z:-2.02,rotY:.15,color:"#991b1b"},{kind:"duster",x:1.1,y:.85,z:-2.05,rotY:-.2}],t=[-1.55,1.35],i=[-.45,1.05,2.55],s={teacher_podium:{x:.15,y:0,z:-2.55,rotY:.05,pose:"standing"},teacher_aisle:{x:-.1,y:0,z:-1.35,rotY:0,pose:"standing"},door_exit:{x:4.1,y:1.15,z:-4.05,rotY:Math.PI,pose:"standing"}},r=1;return i.forEach((o,a)=>{t.forEach((l,c)=>{n.push({id:`desk_r${a}_c${c}`,kind:"desk",x:l,z:o,width:1.5,height:.72,depth:.56,color:"#b4743e"}),n.push({id:`bench_r${a}_c${c}`,kind:"bench",x:l,z:o+.52,rotY:Math.PI,width:1.5,depth:.42,seatHeight:.42,color:"#b4743e"});for(let h of[-.38,.38])e.push({kind:"examPaper",x:l+h,y:.73,z:o+.04,rotY:h*.12}),e.push({kind:"pen",x:l+h+.16,y:.73,z:o+.02,rotY:.4}),s[`student_${r}`]={x:l+h,y:0,z:o+.38,rotY:Math.PI,pose:"sitting",seatHeight:.42},r++})}),i.forEach((o,a)=>{s[`aisle_r${a}_faceLeft`]={x:-.32,y:0,z:o+.42,rotY:-Math.PI/2,pose:"standing"},s[`aisle_r${a}_faceRight`]={x:.12,y:0,z:o+.42,rotY:Math.PI/2,pose:"standing"},s[`aisle_r${a}_faceFront`]={x:-.1,y:0,z:o+.42,rotY:Math.PI,pose:"standing"}}),s.door_inside={x:3.55,y:0,z:-3.2,rotY:-.8,pose:"standing"},s.front_center={x:-.1,y:0,z:-1.75,rotY:0,pose:"standing"},s.student_front_left=s.student_1,s.student_front_right=s.student_2,s.student_side_left=s.student_3,s.student_side_right=s.student_4,s.student_back_left=s.student_5,s.student_back_right=s.student_6,{room:{width:9.6,depth:8.4,height:3.6,floorColor:"#caa594",floorPattern:"tiles",wallColor:"#dcd795",wallTrimColor:"#a3a86b",ceilingColor:"#9fb4a6"},wallFixtures:[{kind:"blackboard",x:-.35,y:1.85,z:-4.16,width:4,height:1.55},{kind:"clock",x:-2.05,y:2.95,z:-4.15,width:.62,height:.62},{kind:"portraitFrame",x:-.75,y:2.98,z:-4.15,width:.48,height:.62,color:"#fde68a"},{kind:"portraitFrame",x:.05,y:2.98,z:-4.15,width:.48,height:.62,color:"#e2e8f0"},{kind:"noticeBoard",x:2.45,y:2.05,z:-4.16,width:1.35,height:1.05},{kind:"door",x:4.1,y:1.25,z:-4.15,width:1.15,height:2.45,color:"#cbd5e1"},{kind:"window",x:-4.76,y:1.95,z:-1.4,rotY:Math.PI/2,width:1.5,height:1.3},{kind:"window",x:-4.76,y:1.95,z:1.3,rotY:Math.PI/2,width:1.5,height:1.3}],furniture:n,props:e,spots:s}}function Bd(n){let e=new H({color:16236088,metalness:.85,roughness:.2}),t=new le;t.visible=!1;let i=new H({color:1976635,roughness:.35,metalness:.25}),s=new H({color:14251782,emissive:7877903,emissiveIntensity:.35}),r=new De({color:16707722}),o=new De({color:16777215}),a=new De({color:15680580}),l=[],c=[{side:-1,z:.36,scale:1.05,phase:0},{side:1,z:.28,scale:.96,phase:1.9},{side:-1,z:-.18,scale:1.15,phase:3.4}];for(let J of c){let Me=new le;Me.position.set(J.side*1.15,0,J.z),Me.scale.setScalar(J.scale);let j=new mn([new D(-J.side*.26,.05,-.1),new D(0,.07,.16),new D(J.side*.22,.08,-.08),new D(0,.16,-.12),new D(0,.42,.02)]),te=new g(new An(j,22,.052,10,!1),i);te.castShadow=!0,Me.add(te);let ve=new le;ve.position.set(0,.42,.02);let de=new g(new Ee(.048,.062,.44,10),i);de.position.y=.2,ve.add(de);let B=new g(new ce(.16,14,10),i);B.scale.set(1.28,1.48,.38),B.position.set(0,.44,.02),B.castShadow=!0,ve.add(B);let we=new g(new We(.08,.015,6,14),s);we.position.set(0,.44,-.04),ve.add(we);let N=new g(new ce(.082,12,10),i);N.scale.set(1.05,.72,1.45),N.position.set(0,.56,.11),ve.add(N);for(let P of[-1,1]){let ae=new g(new ce(.022,8,6),r);ae.position.set(P*.048,.58,.19),ve.add(ae);let He=new g(new $e(.01,.045,5),o);He.rotation.x=Math.PI,He.position.set(P*.028,.5,.21),ve.add(He)}let Ge=new g(new W(.016,.008,.12),a);Ge.position.set(0,.52,.27),ve.add(Ge),Me.add(ve),Me.rotation.y=-J.side*.95,t.add(Me),l.push({root:Me,neckPivot:ve,sideSign:J.side,phase:J.phase})}n.add(t);let h=new le;h.visible=!1;let d=new H({color:5396582,roughness:.78}),u=new H({color:3883085,roughness:.84}),p=new H({color:12131356,roughness:.52}),f=new H({color:16776171,roughness:.22}),E=new g(new ce(.56,20,16),d);E.scale.set(1.38,1.05,.96),E.position.set(0,.96,0),E.castShadow=!0,h.add(E);let M=new g(new Ee(.58,.62,.65,16,1,!1,-Math.PI*.45,Math.PI*.9),p);M.rotation.z=Math.PI/2,M.position.set(0,1.02,0),h.add(M);let m=new g(new W(.76,.08,1.12),e);m.position.set(0,.74,0),h.add(m);let w=[];for(let[J,Me]of[[-.44,-.28],[-.44,.28],[.42,-.28],[.42,.28]]){let j=new g(new Ee(.145,.165,.74,12),u);j.position.set(J,.37,Me),j.castShadow=!0;let te=new g(new We(.165,.022,6,14),e);te.rotation.x=Math.PI/2,te.position.y=-.28,j.add(te),h.add(j),w.push(j)}let y=new le;y.position.set(.78,1.18,0),h.add(y);let x=new g(new ce(.38,18,14),d);x.scale.set(1.06,1.15,.96),x.castShadow=!0,y.add(x);let b=new g(new W(.28,.42,.42),e);b.position.set(.24,.06,0),b.rotation.z=-.22,y.add(b);let v=new g(new $e(.12,.28,12),e);v.position.set(.06,.46,0),y.add(v);for(let J of[-1,1]){let Me=new g(new ce(.042,8,6),r);Me.position.set(.28,.08,J*.24),y.add(Me)}let R=[];for(let J of[-1,1]){let Me=new g(new ce(.32,12,10),u);Me.scale.set(.18,1.12,.92),Me.position.set(-.08,.02,J*.42),Me.rotation.y=J*.35,y.add(Me),R.push(Me);let j=new mn([new D(.24,-.18,J*.16),new D(.56,-.26,J*.2),new D(.76,-.05,J*.18)]),te=new g(new An(j,14,.036,8,!1),f);te.castShadow=!0,y.add(te)}let C=new le;C.position.set(.34,-.1,0);let _=new mn([new D(0,0,0),new D(.24,-.28,0),new D(.36,-.62,0),new D(.52,-.58,0)]),T=new g(new An(_,18,.085,10,!1),d);T.castShadow=!0,C.add(T),y.add(C);let I=new g(new Ee(.022,.015,.55,6),u);I.position.set(-.76,.72,0),I.rotation.z=-.35,h.add(I),h.position.set(-1.35,0,.12),n.add(h);let G=new le;G.visible=!1,G.position.set(0,0,.16);let F=new H({color:7893356,roughness:.85}),k=new H({color:16347926,emissive:14427686,emissiveIntensity:1.4,roughness:.4}),Y=new g(new We(.95,.12,8,28),F);Y.rotation.x=Math.PI/2,Y.position.y=.08,Y.castShadow=!0,G.add(Y);let X=new g(new Ee(.9,.94,.1,24),k);X.position.y=.05,G.add(X);let ie=[];for(let J=0;J<16;J++){let Me=J/16*Math.PI*2,j=Math.sin(Me)>.2,te=j?1.02:J%2===0?.88:1.08,ve=j?.28+J%3*.08:.95+J%4*.25,de=new De({color:J%3===0?16707722:J%2===0?16347926:15680580,transparent:!0,opacity:j?.65:.84,depthWrite:!1}),B=new g(new $e(j?.14:.2+J%3*.05,ve,7),de);B.position.set(Math.cos(Me)*te,ve*.5+.06,Math.sin(Me)*te),G.add(B),ie.push({mesh:B,baseH:ve,phase:J*.85,radius:te,angle:Me})}let O=new Ut(16743196,0,8.5,1.5);O.position.set(0,1.45,.45),G.add(O),n.add(G);let re=new le;re.visible=!1;let ee=new H({color:4674921,roughness:.92});for(let[J,Me,j,te]of[[-1.3,.22,-.35,1.1],[1.25,.16,-.25,.95],[0,.1,-.65,1.35]]){let ve=new g(new _i(.45*te,0),ee);ve.position.set(J,Me,j),ve.scale.set(1.4,.75,1.1),re.add(ve)}let be=[],he=new De({color:14742270,transparent:!0,opacity:.32,depthWrite:!1});for(let J=0;J<6;J++){let Me=new g(new ce(.48,12,10),he);Me.scale.set(1.9,.42,1.3),Me.position.set((J-2.5)*.85,.14+J%2*.12,.25-J%3*.35),re.add(Me),be.push(Me)}n.add(re);let ue=new le;ue.visible=!1;let $=new De({color:16638023,transparent:!0,opacity:.2,side:Mt,depthWrite:!1}),ge=new g(new ce(.58,24,18),$);ge.scale.set(1,1.35,1),ge.position.y=.78,ue.add(ge);let Ae=new De({color:16498468,transparent:!0,opacity:.72,side:Mt,depthWrite:!1}),xe=new g(new We(.62,.024,8,36),Ae);xe.rotation.x=Math.PI/2,xe.position.y=.1,ue.add(xe);for(let J=0;J<8;J++){let Me=J/8*Math.PI*2,j=new g(new ce(.14,10,8),new H({color:16020150,emissive:16498468,emissiveIntensity:.4}));j.scale.set(1.1,.38,1.8),j.position.set(Math.cos(Me)*.42,.08,Math.sin(Me)*.42),j.rotation.y=-Me+Math.PI/2,ue.add(j)}return n.add(ue),{serpentGroup:t,cobras:l,elephantGroup:h,elephantTrunk:C,elephantHead:y,elephantEars:R,elephantLegs:w,fireTrialGroup:G,flames:ie,fireLight:O,cliffGroup:re,cliffClouds:be,devoteeShieldGroup:ue,shieldDome:ge,shieldRing:xe}}function Gd(n,e,t,i,s){let r=t!=="none";if(n.devoteeShieldGroup.visible=r,r){n.devoteeShieldGroup.position.set(i,0,.16),n.shieldRing.rotation.z=e*1.4;let o=.96+Math.sin(e*5)*.05;n.shieldDome.scale.setScalar(o)}if(n.serpentGroup.visible=t==="serpentAttack",t==="serpentAttack"&&n.cobras.forEach(o=>{let a=Math.max(0,Math.sin(e*4.2+o.phase)),l=Math.exp(-Math.pow(a-.85,2)*8)*.24;o.root.position.x=i+o.sideSign*(.98-a*.16+l),o.neckPivot.rotation.x=.38*a-.18,o.neckPivot.rotation.z=Math.sin(e*7.5+o.phase)*.14}),n.elephantGroup.visible=t==="elephantCharge",t==="elephantCharge"){let o=i>=0?1:-1,a=i-o*(1.75-Math.min(1,s*1.6)*.65);n.elephantGroup.position.x=a,n.elephantGroup.rotation.y=o>=0?0:Math.PI;let l=Math.sin(e*8.5)*(s<.65?.25:.05);n.elephantLegs.forEach((h,d)=>{h.rotation.z=(d%2===0?1:-1)*l}),n.elephantEars.forEach((h,d)=>{h.rotation.y=(d===0?-1:1)*(.35+Math.sin(e*6)*.25)});let c=s>.45?Math.min(1,(s-.45)*2.4)*.65:Math.sin(e*4.5)*.18;n.elephantTrunk.rotation.z=c,n.elephantHead.rotation.z=Math.sin(e*3.5)*.08}n.fireTrialGroup.visible=t==="fireTrial",n.fireLight.intensity=t==="fireTrial"?3.2+Math.sin(e*14)*.7:0,t==="fireTrial"&&(n.fireTrialGroup.position.x=0,n.flames.forEach(o=>{let a=.8+.32*Math.sin(e*13.5+o.phase);o.mesh.scale.set(.92+.12*Math.cos(e*9+o.phase),a,1),o.mesh.position.y=o.baseH*a*.5+.05,o.mesh.position.x=Math.cos(o.angle)*o.radius,o.mesh.position.z=Math.sin(o.angle)*o.radius})),n.cliffGroup.visible=t==="cliffRescue",t==="cliffRescue"&&n.cliffClouds.forEach((o,a)=>{o.position.x=(a-2.5)*.85+Math.sin(e*1.4+a)*.22})}function Ud(n){let e=new le;e.visible=!1;let t=new H({color:16317180,roughness:.78}),i=new H({color:16708551,roughness:.72}),s=new H({color:16096779,roughness:.55}),r=new H({color:15357964,roughness:.58}),o=new H({color:14251782,metalness:.75,roughness:.25}),a=new g(new W(1.56,.12,.86),t);a.position.set(.08,.06,.25),a.receiveShadow=!0,e.add(a);let l=new g(new W(.36,.14,.62),i);l.position.set(-.44,.18,.25),l.castShadow=!0,e.add(l);let c=new g(new Ee(.08,.1,.05,12),o);c.position.set(-.68,.025,.56),e.add(c);let h=new g(new Ee(.008,.008,.24,6),new H({color:4140577}));h.position.set(-.68,.15,.56),h.rotation.z=-.15,e.add(h);let d=new g(new ce(.016,8,6),new De({color:16347926}));d.position.set(-.66,.265,.56),e.add(d);let u=new le,p=new g(new Ee(.3,.27,1.04,18,1,!1,-Math.PI*.5,Math.PI),t);p.rotation.z=-Math.PI/2,p.scale.set(.92,1,1.15),p.position.set(.24,.26,.25),p.castShadow=!0,u.add(p);let f=new g(new W(1.06,.24,.64),t);f.position.set(.24,.22,.25),u.add(f);let E=new le;for(let S=0;S<9;S++){let z=(S-4)/4,oe=new g(new ce(.044,8,6),S%2===0?s:r);oe.position.set(.14+Math.abs(z)*.14,.54-Math.abs(z)*.1,.25+z*.22),E.add(oe)}u.add(E),e.add(u),n.add(e);let M=new le;M.position.set(0,2.22,-1.16),M.visible=!1;let m=new g(new Ct(.72,32),new De({color:988970,transparent:!0,opacity:.84}));m.position.z=-.18,M.add(m);let w=new g(new We(.74,.04,12,40),new De({color:16436245}));w.position.z=-.16,M.add(w);let y=()=>{let S=new le;return S.visible=!1,M.add(S),S},x=y(),b=new H({color:4674921,metalness:.4,roughness:.5});for(let S of[-.36,.36]){let z=new g(new Ee(.032,.036,.65,8),b);z.position.set(S,-.05,0),x.add(z)}let v=new g(new We(.36,.025,8,20,Math.PI*.72),new H({color:1120295,roughness:.7}));v.position.set(0,.25,0),v.rotation.z=Math.PI*1.14,x.add(v);let R=new g(new Ee(.024,.024,.16,8),new H({color:14251782,metalness:.85,roughness:.2}));R.rotation.z=Math.PI/2,R.position.set(0,-.08,.04),x.add(R);let C=[],_=new De({color:3718648}),T=new De({color:16707722});for(let S=0;S<6;S++){let z=new g(new kt(.058,0),S%2===0?T:_);x.add(z),C.push(z)}let I=y(),G=new le;G.position.set(-.22,-.08,0);let F=new g(new W(.36,.34,.32),new H({color:16347926,roughness:.45}));F.position.y=.08,G.add(F);let k=new g(new W(.3,.13,.34),new De({color:12248829}));k.position.set(0,.15,.01),G.add(k);for(let S of[-.11,.11]){let z=new g(new ce(.036,8,6),T);z.position.set(S,-.02,.17),G.add(z)}let Y=new g(new W(.4,.4,.32),new H({color:15381256,roughness:.55}));Y.position.set(-.18,.12,-.18),G.add(Y),I.add(G);let X=new le;X.position.set(.28,-.12,.14);let ie=new g(new W(.24,.16,.24),new H({color:1483594,roughness:.45}));X.add(ie);let O=new g(new $e(.18,.18,4),new H({color:16436245,roughness:.5}));O.rotation.y=Math.PI/4,O.position.y=.16,X.add(O),I.add(X);let re=y(),ee=new H({color:165063,roughness:.4}),be=new g(new Ee(.24,.24,.48,18),ee);be.position.set(.06,.04,0),re.add(be);for(let S of[-.08,.04,.16]){let z=new g(new We(.245,.014,8,20),ee);z.rotation.x=Math.PI/2,z.position.set(.06,S,0),re.add(z)}let he=new g(new Ee(.12,.12,.05,12),new H({color:988970}));he.position.set(.06,.3,0),re.add(he);let ue=new g(new Ct(.4,20),new De({color:8246268,transparent:!0,opacity:.85}));ue.rotation.x=-Math.PI/2,ue.position.set(0,-.24,0),re.add(ue);for(let S of[-.3,-.18]){let z=new g(new Ee(.015,.015,.56,8),b);z.position.set(S,-.02,.08),z.rotation.z=-.24,re.add(z)}let $=y(),ge=new g(new Ee(.46,.46,.06,20),new H({color:3359061,roughness:.8}));ge.position.set(0,-.22,0),$.add(ge);let Ae=new g(new Ct(.28,20),new De({color:132631}));Ae.rotation.x=-Math.PI/2,Ae.position.set(0,-.185,0),$.add(Ae);for(let S of[-.32,.32]){let z=new g(new $e(.085,.24,12),r);z.position.set(S,-.06,.12),$.add(z);let oe=new g(new We(.055,.012,6,12),new De({color:16777215}));oe.rotation.x=Math.PI/2,oe.position.set(S,-.06,.12),$.add(oe)}let xe=y(),J=new H({color:1483594,roughness:.35}),Me=new H({color:16638023,roughness:.45}),j=[];for(let S=0;S<8;S++){let z=.075-S*.0055,oe=new g(new ce(Math.max(.025,z),10,8),S%2===0?J:Me);xe.add(oe),j.push(oe)}let te=new g(new ce(.11,12,10),J);te.scale.set(1.25,1.35,.65),te.position.set(-.24,.16,.08),xe.add(te);for(let S of[-.048,.048]){let z=new g(new ce(.032,8,6),new De({color:16777215}));z.position.set(S,.04,.09),te.add(z);let oe=new g(new ce(.016,6,6),new De({color:593174}));oe.position.set(S,.04,.115),te.add(oe)}let ve=new g(new W(.018,.01,.14),new De({color:15680580}));ve.position.set(-.24,.12,.22),xe.add(ve),j.push(te);let de=y(),B=new g(new Ee(.32,.26,.04,24),new H({color:14870768,metalness:.85,roughness:.2}));B.position.set(-.08,-.14,.04),de.add(B);let we=new g(new ce(.11,14,10),s);we.position.set(-.08,-.02,.06),de.add(we);let N=new g(new Ee(.09,.065,.28,16),new H({color:3718648,transparent:!0,opacity:.78,roughness:.15}));N.position.set(.28,-.02,.08),de.add(N);let Ge=y(),P=new g(new W(.28,.48,.045),new H({color:988970,roughness:.3}));P.rotation.z=-.12,Ge.add(P);let ae=new De({color:3718648}),He=new g(new rt(.24,.42),ae);He.position.set(0,0,.026),He.rotation.z=-.12,Ge.add(He);let L=new g(new ce(.11,12,10),T);return L.position.set(-.32,.24,-.05),Ge.add(L),n.add(M),{funeralGroup:e,shroudMesh:u,shroudGarland:E,bubbleGroup:M,hazards:{wireSpark:x,truckRickshaw:I,waterTank:re,roadPit:$,giantSnake:xe,chokeFood:de,nightPhone:Ge},wireSparks:C,truckGroup:G,rickshawGroup:X,snakeBody:j,snakeTongue:ve,phoneGlowMat:ae}}function Fd(n,e,t,i,s,r){if(n.funeralGroup.visible=t,n.shroudMesh.visible=t&&!i,s==="none"){n.bubbleGroup.visible=!1;return}n.bubbleGroup.visible=!0,n.bubbleGroup.position.y=2.22+Math.sin(e*3.2)*.045;let o=r<.16?.65+r/.16*.38:1+Math.sin(e*5)*.025;n.bubbleGroup.scale.setScalar(o);for(let[a,l]of Object.entries(n.hazards))l.visible=a===s;s==="wireSpark"?n.wireSparks.forEach((a,l)=>{let c=e*9+l/n.wireSparks.length*Math.PI*2,h=.08+(e*3.2+l*.2)%.22;a.position.set(Math.cos(c)*h,-.08+Math.sin(c)*h,.06),a.scale.setScalar(.65+.55*Math.abs(Math.sin(e*22+l)))}):s==="truckRickshaw"&&n.truckGroup&&n.rickshawGroup?(n.truckGroup.position.y=-.08+Math.abs(Math.sin(e*14))*.022,n.rickshawGroup.position.y=-.12+Math.abs(Math.sin(e*16+.8))*.028,n.truckGroup.rotation.y=Math.sin(e*2.5)*.15,n.rickshawGroup.rotation.y=Math.sin(e*2.5)*.15):s==="giantSnake"?(n.snakeBody.forEach((a,l)=>{if(l===n.snakeBody.length-1)a.position.set(-.22,.14+Math.sin(e*5.2)*.04,.08),a.rotation.z=Math.sin(e*4.2)*.14;else{let c=-.14+l*.068,h=-.12+Math.sin(e*6-l*.7)*.075,d=Math.cos(e*6-l*.7)*.1;a.position.set(c,h,d)}}),n.snakeTongue&&(n.snakeTongue.visible=Math.sin(e*14)>0,n.snakeTongue.position.y=.1+Math.sin(e*5.2)*.04)):s==="nightPhone"&&n.phoneGlowMat&&n.phoneGlowMat.color.setHex(Math.sin(e*8)>0?3718648:8246268)}function ZE(n,e){let t=new Ne(e.topBackdropHex),i=new Ne(e.midBackdropHex),s=new Ne(e.botBackdropHex);return n==="Night"?(t.lerp(new Ne(1448251),.58),i.lerp(new Ne(3482974),.58),s.lerp(new Ne(2495785),.58),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:15127807,sunIntensity:1.48,fogDensity:.024}):n==="Sunset"?(t.lerp(new Ne(2756672),.68),i.lerp(new Ne(14242598),.68),s.lerp(new Ne(3805978),.62),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16752196,sunIntensity:1.92,fogDensity:.036}):n==="Day"?(t.lerp(new Ne(3718648),.55),i.lerp(new Ne(9684477),.55),s.lerp(new Ne(1981023),.55),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16774624,sunIntensity:2,fogDensity:.025}):(t.lerp(new Ne(1970486),.48),i.lerp(new Ne(12076580),.42),s.lerp(new Ne(1707800),.48),{top:t.getHex(),mid:i.getHex(),bot:s.getHex(),sunColor:16764807,sunIntensity:1.85,fogDensity:.036})}function en(n,e,t,i,s,r,o){let a=new H({color:14251782,metalness:.8,roughness:.25}),l=new g(new $e(.11,.07,14),a);l.rotation.x=Math.PI,l.position.set(e,t+.035,i),n.add(l);let c=new g(new $e(.032,.1,10),new De({color:16768875}));c.position.set(e,t+.11,i),n.add(c);let h=new g(new ce(.11,10,8),new De({color:16752412,transparent:!0,opacity:.3,depthWrite:!1}));if(h.position.set(e,t+.11,i),n.add(h),r.animatedProps.push({object:c,kind:"diya",baseY:t+.11,phase:s,speed:7.5}),o){let d=new Ut(16752440,1.4,5.5,1.6);d.position.set(e,t+.22,i),n.add(d),r.ambientFireLights.push({light:d,baseIntensity:1.4,phase:s})}}function Ai(n,e,t,i,s,r,o){let a=new le;a.position.set(e,0,t);let l=new H({color:4861725,roughness:.85}),c=new g(new Ee(.08*i,.15*i,1.5*i,10),l);c.position.y=.75*i,c.castShadow=!0,a.add(c);let h=new H({color:s,roughness:.72}),d=[[0,1.65,0,.65],[-.36,1.42,.15,.48],[.38,1.45,-.1,.48],[0,1.95,.08,.44]];for(let[u,p,f,E]of d){let M=new g(new pr(E*i,1),h);M.position.set(u*i,p*i,f*i),M.castShadow=!0,M.receiveShadow=!0,a.add(M)}n.add(a),o.animatedProps.push({object:a,kind:"sway",baseRotZ:0,phase:r,speed:1.1})}function JE(n,e){let t=new H({color:10380100,roughness:.68}),i=new H({color:15261649,roughness:.42,metalness:.08}),s=new H({color:16172100,metalness:.85,roughness:.22}),r=new H({color:2278750,roughness:.45}),o=new g(new Ee(5.6,5.9,.26,36),t);o.position.y=-.13,o.receiveShadow=!0,n.add(o);let a=new g(new zn(1.38,1.56,48),new De({color:16172100,transparent:!0,opacity:.58,side:Mt}));a.rotation.x=-Math.PI/2,a.position.y=.012,n.add(a);for(let G of[-2.45,-1.68,1.68,2.45]){let F=Math.abs(G)>2?-1.45:-2.45,k=new g(new W(.42,.26,.42),s);k.position.set(G,.13,F),n.add(k);let Y=new g(new Ee(.15,.19,3.55,14),t);Y.position.set(G,1.88,F),Y.castShadow=!0,Y.receiveShadow=!0,n.add(Y);let X=new g(new Ee(.27,.18,.22,14),s);X.position.set(G,3.56,F),n.add(X)}let l=new g(new We(1.75,.085,10,32,Math.PI),s);l.position.set(0,2.55,-2.35),n.add(l);let c=new g(new W(1.75,.95,1.55),t);c.position.set(0,.48,-4.45),n.add(c);for(let G=0;G<3;G++){let F=1.42-G*.28,k=new g(new W(F,.48,F),G===2?s:t);k.position.set(0,1.15+G*.46,-4.45),n.add(k)}let h=new g(new ce(.19,12,10),s);h.position.set(0,2.48,-4.45),n.add(h);let d=new g(new $e(.09,.28,12),s);d.position.set(0,2.74,-4.45),n.add(d);for(let G of[-1.42,1.42]){let F=new g(new Ee(.032,.075,1.05,10),s);F.position.set(G,.52,-.88),n.add(F),en(n,G,1.04,-.88,G>0?1.4:.3,e,!0)}for(let[G,F]of[[-1.35,0],[1.35,1.3]]){let k=new le;k.position.set(G,3.35,-.6);let Y=new g(new Ee(.014,.014,.65,8),s);Y.position.y=-.32,k.add(Y);let X=new g(new $e(.16,.25,16,1,!0),s);X.position.y=-.72,X.castShadow=!0,k.add(X),n.add(k),e.animatedProps.push({object:k,kind:"bell",baseRotZ:0,phase:F,speed:1.5})}let u=new le;u.position.set(0,1.92,-3.05);let p=new g(new We(1.18,.028,10,48),s),f=new g(new We(.84,.024,10,36),s);u.add(p,f),n.add(u),e.animatedProps.push({object:p,kind:"ring",phase:0,speed:.35}),e.animatedProps.push({object:f,kind:"ring",phase:1.4,speed:-.52}),en(n,-1.12,0,-.45,.2,e,!0),en(n,1.12,0,-.45,1.9,e,!0),en(n,-.52,0,-1.05,3.1,e,!1),en(n,.52,0,-1.05,4.4,e,!1);let E=new le;E.position.set(0,.14,-1.32);let M=new H({color:2500922,metalness:.42,roughness:.18}),m=new g(new Ee(.56,.64,.14,24),i);m.position.y=-.07,E.add(m);let w=new g(new Ee(.4,.48,.26,24),i);w.position.y=.13,w.castShadow=!0,w.receiveShadow=!0,E.add(w);let y=new g(new We(.32,.055,10,24),s);y.rotation.x=Math.PI/2,y.position.y=.27,E.add(y);let x=new g(new gt(.17,.4,12,20),M);x.position.y=.54,x.castShadow=!0,E.add(x);let b=new g(new Ee(.025,.032,.88,10),s);b.position.set(0,.54,-.22),E.add(b);let v=new g(new ce(.2,14,10),s);v.scale.set(1.25,.72,.42),v.position.set(0,.98,-.1),v.rotation.x=.35,E.add(v);for(let G of[.58,.62,.66]){let F=new g(new W(.16,.016,.022),new De({color:16708551}));F.position.set(0,G,.165),E.add(F)}let R=new H({color:16638023,emissive:16096779,emissiveIntensity:.42,roughness:.26}),C=new H({color:16020150,emissive:14362487,emissiveIntensity:.3,roughness:.32});for(let G=0;G<14;G++){let F=G/14*Math.PI*2,k=new g(new ce(G%2===0?.068:.06,8,6),G%2===0?R:C);k.position.set(Math.cos(F)*.3,.31,Math.sin(F)*.3),E.add(k)}let _=new g(new kt(.09,1),R);_.scale.set(1.25,.55,1.25),_.position.set(0,.77,0),E.add(_);let T=new g(new ce(.055,8,6),r);T.scale.set(1.2,.35,1.2),T.position.set(.08,.76,.06),E.add(T);for(let G of[-.58,.58]){let F=new g(new Ee(.24,.18,.045,20),s);F.position.set(G,-.1,.24),E.add(F);for(let k=0;k<7;k++){let Y=k/7*Math.PI*2,X=k===0?0:.12,ie=k===0?.04:0,O=new g(new kt(.068,1),k%2===0?R:C);O.scale.set(1.2,.62,1.2),O.position.set(G+Math.cos(Y)*X,-.04+ie,.24+Math.sin(Y)*X),E.add(O)}}let I=new Ut(16763750,2.35,6.2,1.4);I.position.set(0,1.25,.45),E.add(I),n.add(E)}function KE(n,e){let t=new H({color:2507300,roughness:.92}),i=new g(new Ct(9,40),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new le;s.position.set(.1,0,-3.2);let r=new g(new Ee(.95,1,1.05,18),new H({color:10251846,roughness:.85}));r.position.y=.52,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new g(new $e(1.38,.95,20),new H({color:12558414,roughness:.9}));o.position.y=1.42,o.castShadow=!0,s.add(o);let a=new g(new rt(.42,.65),new De({color:16758605}));a.position.set(0,.34,.96),s.add(a),n.add(s),Ai(n,-2.1,-1.8,1.45,3108407,.3,e),Ai(n,2.2,-1.9,1.38,3635775,1.6,e),Ai(n,-1.65,-3.9,1.65,2314793,2.8,e),Ai(n,1.75,-4.1,1.55,2711344,4.1,e),en(n,0,0,-1.4,.5,e,!0)}function $E(n,e){let t=new H({color:10186830,roughness:.72}),i=new H({color:16096779,metalness:.78,roughness:.28}),s=new g(new W(8.5,.3,2.2),t);s.position.set(0,-.15,.1),s.receiveShadow=!0,n.add(s);let r=new g(new W(8.5,.16,.6),t);r.position.set(0,-.16,-1.25),n.add(r);let o=new g(new W(8.5,.12,.55),t);o.position.set(0,-.22,-1.75),n.add(o);for(let c of[-2.4,2.4]){let h=new g(new Ee(.14,.17,2.45,12),t);h.position.set(c,1.15,-2.1),n.add(h);let d=new g(new $e(.42,.55,12),i);d.position.set(c,2.55,-2.1),n.add(d)}let a=new H({color:1994655,emissive:799826,emissiveIntensity:.45,metalness:.72,roughness:.18}),l=new g(new rt(20,11,24,16),a);l.rotation.x=-Math.PI/2,l.position.set(0,-.09,-7.2),l.receiveShadow=!0,n.add(l),e.animatedProps.push({object:l,kind:"water",phase:0,speed:1.8}),en(n,-1.2,0,-.65,.4,e,!0),en(n,1.2,0,-.65,2.1,e,!0),en(n,-.75,-.07,-2.4,3.4,e,!1),en(n,.85,-.07,-3.1,4.9,e,!1),en(n,-.15,-.07,-3.8,1.5,e,!1),en(n,1.45,-.07,-4.4,5.2,e,!1)}function QE(n,e,t){let i=new H({color:1053482,metalness:.7,roughness:.24}),s=new g(new Ee(5.5,5.5,.2,48),i);s.position.y=-.1,s.receiveShadow=!0,n.add(s);let r=new De({color:t,transparent:!0,opacity:.75}),o=new H({color:16498468,metalness:.85,roughness:.2}),a=new le;a.position.set(0,2.05,-3.3);let l=new g(new We(1.58,.032,10,64),o),c=new g(new We(1.16,.026,10,48),r),h=new g(new We(.76,.022,10,48),o);c.rotation.x=.7,h.rotation.y=.55;let d=new g(new ce(.28,20,16),new De({color:16638023}));a.add(l,c,h,d),n.add(a);let u=new Ut(16498468,3,9,1.4);u.position.set(0,2.1,-2.5),n.add(u),e.ambientFireLights.push({light:u,baseIntensity:3,phase:.3}),e.animatedProps.push({object:l,kind:"ring",phase:.2,speed:.35}),e.animatedProps.push({object:c,kind:"ring",phase:1.5,speed:-.55}),e.animatedProps.push({object:h,kind:"ring",phase:.9,speed:.48});let p=new le;p.position.set(0,2.75,-2.8);let f=new De({color:16774589,transparent:!0,opacity:0}),E=new g(new kt(.18,0),f),M=new g(new $e(.95,3.6,24,1,!0),new De({color:16770180,transparent:!0,opacity:0,side:Mt,depthWrite:!1,blending:Wn}));M.position.y=-1.6,p.add(E,M),n.add(p),e.poleStarGroup=p,e.poleStarMat=M.material}function jE(n,e){let t=new H({color:6371360,roughness:.45,metalness:.1}),i=new g(new Ee(5.2,5.4,.25,40),t);i.position.y=-.125,i.receiveShadow=!0,n.add(i);let s=new H({color:6042653,roughness:.72}),r=new g(new W(8.2,.09,.12),s);r.position.set(0,.72,-3.2),r.receiveShadow=!0,n.add(r);for(let f=-3.6;f<=3.6;f+=.9){let E=new g(new Ee(.035,.04,.72,8),s);E.position.set(f,.36,-3.2),n.add(E)}let o=new H({color:10033947,roughness:.8});for(let f of[-1,1]){for(let E=0;E<2;E++){let M=new g(new Ee(.22,.26,4,12),o);M.position.set(f*(3.15+E*.36),2,-2.9+E*.14),M.castShadow=!0,n.add(M)}Ai(n,f*4.4,-5.2,.95,3114330,f>0?1.2:.3,e)}let a=new H({color:14870768,metalness:.92,roughness:.15}),l=new g(new Ee(.016,.024,1.18,8),a);l.position.set(0,.59,.58),l.castShadow=!0,n.add(l);let c=new g(new Ee(.14,.15,.04,16),a);c.position.set(0,.02,.58),n.add(c);let h=new g(new ce(.055,12,10),a);h.position.set(0,1.21,.58),n.add(h);let d=new g(new We(.65,.028,10,40),new De({color:16486972}));d.position.set(0,2.35,-3.25),n.add(d);let u=new Ji(16638023,4.2,12,.42,.55,1.2);u.position.set(-1.6,4.2,2.2),n.add(u,u.target),e.animatedProps.push({object:u,kind:"spotlight",phase:0,speed:1.3});let p=new Ji(16020150,3.6,12,.42,.55,1.2);p.position.set(1.6,4.2,2.2),n.add(p,p.target),e.animatedProps.push({object:p,kind:"spotlight",phase:1.7,speed:1.5})}function eg(n,e){let t=new H({color:2959666,roughness:.9}),i=new g(new rt(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new H({color:8145446,roughness:.72}),r=new le;r.position.set(0,0,-2);let o=new g(new W(2.1,.85,.7),s);o.position.y=.425,o.castShadow=!0,o.receiveShadow=!0,r.add(o);for(let u of[-.98,.98]){let p=new g(new W(.08,2.15,.08),s);p.position.set(u,1.075,-.25),r.add(p)}let a=new g(new W(2.4,.08,1.1),new H({color:14251782,roughness:.75}));a.position.set(0,2.15,.05),a.rotation.x=.2,a.castShadow=!0,r.add(a);let l=new H({color:16096779,metalness:.75,roughness:.25}),c=new g(new ce(.14,14,12),l);c.position.set(-.35,.98,.05),r.add(c);let h=new H({color:11817737,roughness:.85});for(let u of[.1,.28,.46]){let p=new g(new Ee(.05,.035,.09,12),h);p.position.set(u,.9,.08),r.add(p)}for(let u=0;u<4;u++){let p=new g(new ce(.06,8,8),new De({color:16708551,transparent:!0,opacity:.28,depthWrite:!1}));p.position.set(-.35+u%2*.06,1.18+u*.14,.05),r.add(p),e.animatedProps.push({object:p,kind:"steam",baseY:1.16,phase:u*1.4,speed:1.8})}e.spots.counter={x:.25,y:0,z:-.9,rotY:.12};let d=new Ut(16758605,2.6,7,1.5);d.position.set(0,1.88,.25),r.add(d),e.ambientFireLights.push({light:d,baseIntensity:2.6,phase:.4}),n.add(r)}function tg(n,e){let t=new g(new Ct(9,32),new H({color:13358561,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new H({color:3359061,roughness:.82}),s=new H({color:15857145,roughness:.55}),r=[[-2.4,-4.5,2.6,1.8],[0,-5.6,3.8,2.3],[2.5,-4.4,2.4,1.7]];for(let[o,a,l,c]of r){let h=new g(new $e(c,l,7),i);h.position.set(o,l*.5-.1,a),n.add(h);let d=new g(new $e(c*.45,l*.42,7),s);d.position.set(o,l*.78-.1,a),n.add(d)}en(n,0,0,-1.1,.8,e,!0)}function ng(n,e,t=!1){let i=new H({color:15127221,roughness:.72}),s=new H({color:13284758,roughness:.58}),r=new H({color:16041038,metalness:.85,roughness:.22}),o=new H({color:7017510,roughness:.8}),a=new H({color:2822922,emissive:14251782,emissiveIntensity:.42,roughness:.6}),l=new g(new Ct(10.5,48),s);l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new g(new W(8.8,.06,5.2),i);c.position.set(0,-.02,-.6),c.receiveShadow=!0,n.add(c);let h=new g(new W(3.75,.016,2.35),r);h.position.set(0,.012,.15),h.receiveShadow=!0,n.add(h);let d=new g(new W(3.45,.022,2.08),o);d.position.set(0,.015,.15),d.receiveShadow=!0,n.add(d);let u=new g(new W(10.8,4.4,.28),s);u.position.set(0,2.2,-3.55),u.receiveShadow=!0,n.add(u);let p=new g(new W(10.4,.24,.72),i);p.position.set(0,.12,-2.55),p.receiveShadow=!0,n.add(p);let f=[-3.6,-1.25,1.25,3.6];for(let m of f){let w=new g(new W(.42,.34,.42),i);w.position.set(m,.26,-2.55),w.castShadow=!0,n.add(w);let y=new g(new Ee(.15,.17,2.75,14),i);y.position.set(m,1.78,-2.55),y.castShadow=!0,n.add(y);let x=new g(new W(.46,.22,.46),r);x.position.set(m,3.2,-2.55),n.add(x)}let E=[-2.42,0,2.42];for(let m=0;m<E.length;m++){let w=E[m],y=m===1?2.42:2.28,x=new g(new W(y,.65,.26),i);x.position.set(w,3.55,-2.55),x.castShadow=!0,n.add(x);let b=new g(new We(.88,.065,8,20,Math.PI),i);b.position.set(w,2.52,-2.52),n.add(b);let v=new g(new W(1.18,1.72,.08),r);v.position.set(w,1.56,-3.38),n.add(v);let R=new g(new W(1.02,1.56,.1),a);R.position.set(w,1.56,-3.35),n.add(R);for(let _ of[-1,1]){let T=new g(new Ee(.09,.14,1.95,10),o);T.position.set(w+_*.54,1.55,-3.28),T.rotation.z=_*.06,n.add(T)}let C=new g(new W(1.22,.56,.12),a);C.position.set(w,3.12,-3.32),n.add(C)}let M=[-2.18,2.18];for(let m=0;m<M.length;m++){let w=M[m],y=-.35,x=new le;x.position.set(w,0,y);let b=new g(new Ee(.1,.22,.16,14),r);b.position.y=.08,x.add(b);let v=new g(new Ee(.025,.036,1.18,10),r);v.position.y=.74,v.castShadow=!0,x.add(v);for(let[C,_]of[[-.14,0],[.14,0],[0,.12],[0,-.1]]){let T=new g(new Ee(.042,.024,.05,8),r);T.position.set(C,1.34,_),x.add(T);let I=new g(new $e(.022,.09,8),new De({color:16707722}));I.position.set(C,1.4,_),x.add(I),e.animatedProps.push({object:I,kind:"diya",phase:m*1.4+C*3,speed:12.5})}let R=new Ut(16757844,1.9,6.2,1.6);R.position.set(0,1.48,0),x.add(R),e.ambientFireLights.push({light:R,baseIntensity:1.9,phase:m*1.7}),n.add(x)}if(en(n,-1.65,.24,-2.2,.3,e,!1),en(n,1.65,.24,-2.2,1.9,e,!0),t){let m=new g(new W(3.2,.042,.62),i);m.position.set(0,.021,.08),m.receiveShadow=!0,n.add(m);let w=new g(new W(3.08,.014,.06),r);w.position.set(0,.045,.34),n.add(w);for(let F of[-2.95,2.95]){let k=new g(new W(.3,3.2,.34),i);k.position.set(F,1.6,-1.45),k.castShadow=!0,n.add(k);let Y=new g(new W(.38,.16,.42),r);Y.position.set(F,3.22,-1.45),n.add(Y)}let y=new le;y.position.set(0,0,-.78);let x=new g(new W(.68,.38,.68),i);x.position.y=.19,x.castShadow=!0,y.add(x);let b=new g(new Ee(.24,.28,2.75,10),i);b.position.y=1.72,b.castShadow=!0,y.add(b);for(let F of[.85,1.72,2.58]){let k=new g(new We(.27,.032,8,16),r);k.rotation.x=Math.PI/2,k.position.y=F,y.add(k)}let v=new g(new W(.64,.28,.64),r);v.position.y=3.16,y.add(v),n.add(y),e.stambhaWholeGroup=y;let R=new le;R.position.set(0,0,-.78),R.visible=!1;let C=new g(new W(.72,.38,.72),i);C.position.y=.19,R.add(C);let _=new g(new Ee(.2,.28,.72,9),i);_.position.y=.72,R.add(_);let T=new H({color:16707722,emissive:16347926,emissiveIntensity:1.55,roughness:.2}),I=new g(new _i(.32,1),T);I.position.y=1.06,I.scale.set(1.2,1.5,.85),R.add(I);for(let F of[-1,1]){let k=new g(new _i(.24,0),i);k.position.set(F*.78,.14,.18),k.scale.set(1.25,.65,.95),k.rotation.set(.18,.55*F,F*.35),R.add(k);let Y=new g(new W(.26,.16,.22),i);Y.position.set(F*1.12,.09,-.1),Y.rotation.y=F*.48,R.add(Y)}let G=new Ut(16758578,0,7.5,1.4);G.position.set(0,1.35,.35),R.add(G),e.stambhaFireLights=[G],n.add(R),e.stambhaBrokenGroup=R}}function ig(n,e){let t=new H({color:11567190,roughness:.92}),i=new g(new rt(24,24),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new le;s.position.set(-2.9,0,-4.6);let r=new g(new Ee(1.15,1.22,1.35,16),new H({color:12751720,roughness:.9}));r.position.y=.675,r.castShadow=!0,r.receiveShadow=!0,s.add(r);let o=new g(new $e(1.55,.95,16),new H({color:8738861,roughness:.94}));o.position.y=1.78,o.castShadow=!0,s.add(o);let a=new g(new W(.45,.85,.1),new H({color:4860952,roughness:.85}));a.position.set(.32,.44,1.12),s.add(a),n.add(s),Ai(n,3.2,-4.8,1.25,3114330,.4,e),Ai(n,-4.6,-6,1.05,3711337,1.3,e);let l=new le;l.position.set(2.15,0,-1.75);let c=new H({color:7028258,roughness:.78}),h=new g(new W(1.25,.07,.58),c);h.position.y=.62,h.castShadow=!0,h.receiveShadow=!0,l.add(h);for(let v of[-.52,.52])for(let R of[-.22,.22]){let C=new g(new Ee(.032,.032,.62,8),c);C.position.set(v,.31,R),l.add(C)}let d=new H({color:11817737,roughness:.76}),u=new g(new ce(.21,16,14),d);u.position.set(-.36,.84,0),u.castShadow=!0,l.add(u);let p=new g(new Ee(.09,.075,.08,12),d);p.position.set(-.36,1.06,0),l.add(p);let f=new H({color:16096779,metalness:.85,roughness:.22}),E=new H({color:14251782,metalness:.78,roughness:.28}),M=new g(new ce(.11,14,12),f);M.position.set(.02,.76,.04),l.add(M);let m=new g(new Ee(.065,.045,.06,12),f);m.position.set(.02,.88,.04),l.add(m);let w=new g(new ce(.16,14,12),E);w.scale.set(1.05,.78,1.05),w.position.set(.36,.77,-.02),l.add(w);let y=new H({color:14870768,metalness:.9,roughness:.18}),x=new g(new Ee(.16,.13,.024,20),y);x.position.set(.04,.665,-.14),l.add(x),n.add(l);let b=new g(new rt(16,8),new H({color:4160826,roughness:.95}));b.rotation.x=-Math.PI/2,b.position.set(0,.005,-7.5),b.receiveShadow=!0,n.add(b);for(let[v,R,C]of[[-1.6,-5.8,.4],[.4,-6.2,-.35],[2.2,-5.6,.9]]){let _=sg();_.position.set(v,0,R),_.rotation.y=C,n.add(_),e.animatedProps.push({object:_,kind:"sway",baseRotZ:0,phase:v,speed:.85})}}function sg(){let n=new le,e=new H({color:1973796,roughness:.78}),t=new H({color:4144966,roughness:.45,metalness:.2}),i=new g(new gt(.32,.72,8,14),e);i.rotation.z=Math.PI/2,i.position.set(0,.66,0),i.castShadow=!0,n.add(i);let s=new g(new ce(.27,12,10),e);s.position.set(.28,.82,0),n.add(s);let r=new g(new W(.32,.26,.24),e);r.position.set(.62,.68,0),r.rotation.z=-.32,r.castShadow=!0,n.add(r);for(let a of[-1,1]){let l=new g(new We(.16,.032,8,14,Math.PI*.82),t);l.position.set(.54,.82,a*.14),l.rotation.set(a*.45,Math.PI*.5,.25),n.add(l)}for(let a of[-.32,.34])for(let l of[-.15,.15]){let c=new g(new Ee(.06,.048,.56,8),e);c.position.set(a,.28,l),c.castShadow=!0,n.add(c)}let o=new g(new Ee(.018,.012,.42,6),e);return o.position.set(-.56,.54,0),o.rotation.z=.45,n.add(o),n}function rg(n,e,t,i){if(e==="ModernCity"){let l=new g(new rt(24,24),new H({color:593183,roughness:.35,metalness:.6}));l.rotation.x=-Math.PI/2,l.receiveShadow=!0,n.add(l);let c=new Ps(20,28,new Ne(i),1976635);c.position.y=.01,n.add(c);let h=new g(new kt(.55,0),new H({color:i,wireframe:!0,emissive:i,emissiveIntensity:.6}));h.position.set(0,1.9,-2.5),n.add(h),t.animatedProps.push({object:h,kind:"ring",phase:0,speed:.6});return}let s=e==="PalaceCourt"?6038067:e==="Battlefield"?4140322:4535592,r=new g(new Ct(8.5,36),new H({color:s,roughness:.78}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,n.add(r);let o=e==="PalaceCourt"?14264170:e==="Archive"?6898214:7033664,a=new H({color:o,roughness:.72});for(let l of[-2.1,2.1]){let c=new g(new W(.35,3.4,.35),a);c.position.set(l,1.7,-2.4),c.castShadow=!0,n.add(c)}en(n,-1.5,0,-1.2,.4,t,!0),en(n,1.5,0,-1.2,2,t,!0)}function og(n,e,t){let i=new H({color:1976635,roughness:.35,metalness:.55}),s=new H({color:t%2===0?2282478:11032055,emissive:959977,emissiveIntensity:.55}),r=new g(new W(3.8,.22,9.5),i);r.position.set(0,-.11,-1.5),r.receiveShadow=!0,n.add(r);for(let c of[-1.85,1.85]){let h=new g(new W(.12,.25,9.5),s);h.position.set(c,-.09,-1.5),n.add(h)}let o=[[-1.08,2282478],[1.08,16007006]];for(let c=0;c<o.length;c++){let[h,d]=o[c],u=new le;u.position.set(h,1.15,-2.5);let p=new g(new We(.75,.08,12,32),new H({color:d,emissive:d,emissiveIntensity:.85,roughness:.2}));u.add(p);let f=new g(new Ct(.7,24),new De({color:d,transparent:!0,opacity:.24,side:Mt}));u.add(f),n.add(u),e.animatedProps.push({object:p,kind:"portal",phase:c*1.4,speed:1.6})}let a=new H({color:16317180,roughness:.9});for(let c=0;c<6;c++){let h=(c-2.5)*2.1,d=-1.2+c%2*.45,u=new g(new ce(.95+c%3*.25,12,10),a);u.scale.set(1.8,.55,1.1),u.position.set(h,d,-5.2-c%2*1.2),n.add(u)}let l=new g(new Ee(.14,.14,1.6,12),new H({color:16436245,roughness:.35}));l.rotation.z=Math.PI/2,l.position.set(0,.35,-1),n.add(l),e.animatedProps.push({object:l,kind:"hazard",phase:0,speed:1.9})}function ag(n,e){let t=new H({color:10576438,roughness:.92}),i=new g(new Ct(11,36),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new H({color:8142627,roughness:.88});for(let[l,c,h,d]of[[-3.4,-4.6,2.2,1.4],[.4,-5.8,2.8,1.9],[3.5,-4.3,2,1.3]]){let u=new g(new Ee(d*.72,d,h,8),s);u.position.set(l,h*.5-.1,c),u.castShadow=!0,n.add(u)}let r=new H({color:12753761,roughness:.85});for(let l=-2;l<=2;l++){let c=new g(new gt(.18,.34,6,8),r);c.rotation.z=Math.PI/2,c.position.set(l*.56,.18,-2.3),c.castShadow=!0,n.add(c)}let o=new H({color:16436245,roughness:.5});for(let l of[-2.2,2.2]){let c=new g(new $e(.22,.58,12),o);c.position.set(l,.29,-1.6),c.castShadow=!0,n.add(c)}let a=new Ut(16347926,2.4,8,1.5);a.position.set(0,1.4,-2.6),n.add(a),e.ambientFireLights.push({light:a,baseIntensity:2.4,phase:.6})}function lg(n,e,t){let i=new H({color:15857145,roughness:.55}),s=new H({color:t%2===0?3359061:4988309,roughness:.55});for(let u=-4;u<=4;u++)for(let p=-3;p<=3;p++){let f=new g(new W(.98,.06,.98),(u+p)%2===0?i:s);f.position.set(u,-.03,p),f.receiveShadow=!0,n.add(f)}let r=new H({color:t%3===0?5195493:t%3===1?1013358:11817737,roughness:.78});for(let u of[-2.45,2.45]){let p=new g(new W(3.4,4.2,.25),r);p.position.set(u,2.1,-2.8),p.receiveShadow=!0,n.add(p)}let o=new g(new W(1.7,1.4,.25),r);o.position.set(0,3.5,-2.8),n.add(o);let a=new H({color:8138002,roughness:.6});for(let u of[-.78,.78]){let p=new g(new W(.14,2.85,.34),a);p.position.set(u,1.425,-2.8),n.add(p)}let l=new g(new W(1.72,.16,.36),a);l.position.set(0,2.86,-2.8),n.add(l);let c=new le;c.position.set(-.7,0,-2.76);let h=new g(new W(1.38,2.75,.08),new H({color:14251782,roughness:.5}));h.position.set(.69,1.375,0),h.castShadow=!0,c.add(h);let d=new g(new ce(.08,12,10),new H({color:16436245,metalness:.85,roughness:.2}));d.position.set(1.22,1.25,.07),c.add(d),n.add(c),e.animatedProps.push({object:c,kind:"door",phase:.3,speed:2.2})}function rs(n,e){let t=e.width??12.6,i=e.height??5.4,s=e.backZ??-2.9,r=e.depth??10.5,o=new H({color:e.backColor,roughness:.82}),a=new H({color:e.sideColor??e.backColor,roughness:.84}),l=new g(new W(t,i,.18),o);l.position.set(0,i*.5,s),l.receiveShadow=!0,n.add(l);let c=new g(new W(.18,i,r),a);c.position.set(-t*.5+.09,i*.5,s+r*.5-.1),c.receiveShadow=!0,n.add(c);let h=new g(new W(.18,i,r),a);h.position.set(t*.5-.09,i*.5,s+r*.5-.1),h.receiveShadow=!0,n.add(h);let d=e.trimColor??4674921,u=new H({color:d,roughness:.65}),p=new g(new W(t,.16,.22),u);p.position.set(0,.08,s+.04),n.add(p);let f=new g(new W(t,.35,r),u);f.position.set(0,i+.1,s+r*.5-.1),n.add(f);let E=new g(new W(t,i,.2),o);E.position.set(0,i*.5,s+r-.15),n.add(E);let M=new g(new W(t,.72,.22),u);return M.position.set(0,.36,s+r-.16),n.add(M),o}function cg(n,e){let t=new H({color:6044968,roughness:.78}),i=new g(new rt(14,14),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,n.add(i);let s=new g(new W(3.6,.02,2.6),new H({color:10424889,roughness:.88}));s.position.set(0,.01,-.4),s.receiveShadow=!0,n.add(s),rs(n,{backColor:3878738,sideColor:3221063,trimColor:6044968,backZ:-2.9});let r=new Ut(14412542,2.2,9.5,1.3);r.position.set(.75,2.65,.65),n.add(r),e.ambientFireLights.push({light:r,baseIntensity:2.2,phase:.1});let o=new g(new W(1.5,1.55,.08),new H({color:8145446,roughness:.65}));o.position.set(1.15,2.25,-2.78),n.add(o);let a=new g(new rt(1.28,1.32),new De({color:12248829}));a.position.set(1.15,2.25,-2.73),n.add(a);let l=new H({color:7877903,roughness:.62}),c=new le;c.position.set(-.88,0,-.58);let h=new g(new W(1.52,.14,2.1),l);h.position.y=.24,h.castShadow=!0,h.receiveShadow=!0,c.add(h);for(let[w,y]of[[-.68,-.95],[.68,-.95],[-.68,.95],[.68,.95]]){let x=new g(new Ee(.055,.045,.26,8),l);x.position.set(w,.13,y),x.castShadow=!0,c.add(x)}let d=new g(new W(1.54,.72,.1),l);d.position.set(0,.56,-1),d.castShadow=!0,c.add(d);let u=new g(new W(1.42,.16,1.94),new H({color:16708551,roughness:.8}));u.position.set(0,.38,.02),u.receiveShadow=!0,c.add(u);let p=new g(new W(1.44,.18,1.24),new H({color:15357964,roughness:.75}));p.position.set(0,.39,.34),p.castShadow=!0,c.add(p);let f=new g(new W(1.04,.14,.42),new H({color:16777215,roughness:.68}));f.position.set(0,.51,-.72),c.add(f),n.add(c);let E=new g(new W(.55,.52,.52),l);E.position.set(-1.98,.26,-.82),E.castShadow=!0,n.add(E);let M=new g(new $e(.18,.24,16,1,!0),new H({color:16638023,emissive:16096779,emissiveIntensity:.55,side:Mt}));M.position.set(-1.98,.72,-.82),n.add(M);let m=new Ut(16758605,2.4,6.5,1.5);m.position.set(-1.98,.66,-.82),n.add(m),e.ambientFireLights.push({light:m,baseIntensity:2.4,phase:.7}),e.spots.bed={x:-.88,y:.47,z:.16,rotY:.16},e.spots.door={x:1.45,y:0,z:-1.35,rotY:-.35}}function hg(n,e){let t=new g(new rt(14,14),new H({color:4141901,roughness:.72}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new g(new W(4,.02,2.8),new H({color:1013358,roughness:.86}));i.position.set(0,.01,-.2),i.receiveShadow=!0,n.add(i),rs(n,{backColor:3359061,sideColor:2503236,trimColor:7027230,backZ:-2.95});let s=new H({color:14251782,roughness:.7}),r=new H({color:16707722,roughness:.68}),o=new le;o.position.set(-.78,0,-1.28);let a=new g(new W(1.9,.36,.85),s);a.position.y=.22,a.castShadow=!0,a.receiveShadow=!0,o.add(a);let l=new g(new W(1.9,.68,.22),s);l.position.set(0,.56,-.34),l.castShadow=!0,o.add(l);for(let w of[-.92,.92]){let y=new g(new W(.18,.48,.86),s);y.position.set(w,.38,0),o.add(y)}let c=new g(new W(.32,.28,.14),r);c.position.set(-.55,.48,-.14),c.rotation.z=.18,o.add(c),n.add(o);let h=new H({color:7027230,roughness:.55}),d=new le,u=new g(new W(1.15,.08,.65),h);u.position.set(.08,.34,.12),u.castShadow=!0,d.add(u);let p=new g(new Ee(.14,.09,.08,16),new H({color:16317180,roughness:.35}));p.position.set(.08,.42,.12),d.add(p),n.add(d),e.livingRoomTableGroup=d;let f=new g(new W(1.1,.78,.06),h);f.position.set(-.7,2.15,-2.84),n.add(f);let E=new g(new rt(.92,.62),new H({color:16498468,roughness:.5}));E.position.set(-.7,2.15,-2.8),n.add(E);let M=new le;M.position.set(1.25,0,-2.7);let m=new g(new W(.95,2.25,.08),h);m.position.set(.475,1.125,0),m.castShadow=!0,M.add(m),n.add(M),e.animatedProps.push({object:M,kind:"door",phase:.4,speed:.85}),e.spots.sofa={x:-.78,y:.38,z:-.74,rotY:.25},e.spots.door={x:1.45,y:0,z:-1.4,rotY:-.4}}function dg(n,e){let t=new g(new rt(14,14),new H({color:3359061,roughness:.6}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new Ps(12,16,9741240,4674921);i.position.y=.01,n.add(i),rs(n,{backColor:10105874,sideColor:8138002,trimColor:16639626,backZ:-2.85});let s=new g(new W(6.8,.92,.05),new H({color:16708551,roughness:.55}));s.position.set(0,1.32,-2.74),n.add(s);let r=new H({color:4674921,roughness:.55}),o=new H({color:14870768,roughness:.3}),a=new g(new W(3.2,.88,.9),r);a.position.set(0,.44,-1.45),a.castShadow=!0,a.receiveShadow=!0,n.add(a);let l=new g(new W(3.28,.07,.96),o);l.position.set(0,.91,-1.45),n.add(l);let c=new De({color:3718648}),h=new g(new We(.18,.025,8,20),c);h.rotation.x=Math.PI/2,h.position.set(-.22,.96,-1.4),n.add(h),e.animatedProps.push({object:h,kind:"diya",phase:0,speed:9});let d=new H({color:14251782,metalness:.72,roughness:.25}),u=new g(new Ee(.32,.22,.26,20),d);u.position.set(-.22,1.1,-1.4),u.castShadow=!0,n.add(u);let p=new g(new Ct(.3,20),new H({color:16708551,roughness:.28}));p.rotation.x=-Math.PI/2,p.position.set(-.22,1.22,-1.4),n.add(p);for(let M=0;M<5;M++){let m=new g(new ce(.075,8,8),new De({color:16777215,transparent:!0,opacity:.3,depthWrite:!1}));m.position.set(-.22+(M%3-1)*.08,1.32+M*.14,-1.4),n.add(m),e.animatedProps.push({object:m,kind:"steam",baseY:1.28,phase:M*1.1,speed:1.7})}let f=new g(new W(2.6,.08,.32),new H({color:7877903,roughness:.65}));f.position.set(0,1.85,-2.6),n.add(f);for(let M=-2;M<=2;M++){let m=[15680580,16096779,2278750,3900150,15381256][M+2],w=new g(new Ee(.075,.075,.22,12),new H({color:m,roughness:.35}));w.position.set(M*.42,2,-2.58),n.add(w)}let E=new Ut(16775149,3.3,9.5,1.25);E.position.set(0,2.75,.45),n.add(E),e.ambientFireLights.push({light:E,baseIntensity:3.3,phase:.2}),e.spots.counter={x:-.42,y:0,z:-.68,rotY:.3},e.spots.door={x:1.35,y:0,z:-1.15,rotY:-.45}}function Dr(n,e,t,i,s,r,o="#0f172a",a="#f59e0b"){let l=document.createElement("canvas");l.width=512,l.height=192;let c=l.getContext("2d");c.fillStyle=o,c.fillRect(0,0,512,192),c.strokeStyle=a,c.lineWidth=10,c.strokeRect(10,10,492,172),c.fillStyle=a,c.font="bold 42px sans-serif",c.textAlign="center",c.fillText(e,256,86),c.fillStyle="#e2e8f0",c.font="600 24px sans-serif",c.fillText(t,256,138);let h=new Qt(l);h.colorSpace=At;let d=new g(new W(1.48,.56,.05),new H({color:1976635,roughness:.45,metalness:.4}));d.position.set(i,s,r-.02),n.add(d);let u=new g(new rt(1.38,.48),new De({map:h}));u.position.set(i,s,r+.01),n.add(u)}function ug(n,e){let t=new g(new rt(14,14),new H({color:4860970,roughness:.75}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),rs(n,{backColor:8138002,sideColor:6037518,trimColor:16096779,backZ:-2.9}),Dr(n,"MITHAI & KESHAV","FRESH SHAHI HALWAI",0,2.75,-2.76,"#431407","#fbbf24");let i=new H({color:8138002,roughness:.58}),s=new g(new W(2.8,.92,.85),i);s.position.set(0,.46,-1.45),s.castShadow=!0,s.receiveShadow=!0,n.add(s);let r=new H({color:14870768,metalness:.85,roughness:.2}),o=new H({color:16096779,roughness:.45}),a=new H({color:16708551,roughness:.38});for(let h of[-.65,0,.65]){let d=new g(new W(.52,.04,.48),r);d.position.set(h,.94,-1.42),n.add(d);for(let u=-.14;u<=.15;u+=.14)for(let p=-.1;p<=.12;p+=.14){let f=h===0?new g(new W(.11,.08,.11),a):new g(new ce(.06,10,8),o);f.position.set(h+u,1,-1.42+p),n.add(f)}}let l=new g(new W(3.2,.1,1.2),new H({color:15357964,roughness:.65}));l.position.set(0,2.35,-1.35),l.rotation.x=.18,n.add(l);for(let h=-5;h<=5;h++){let d=new g(new ce(.075,10,8),new H({color:h%2===0?16096779:16436245,roughness:.6}));d.position.set(h*.28,2.15-Math.cos(h*.35)*.14,-.82),n.add(d)}let c=new Ut(16758605,3,8,1.4);c.position.set(0,2.15,-1),n.add(c),e.ambientFireLights.push({light:c,baseIntensity:3,phase:.5}),e.spots.counter={x:.38,y:0,z:-.62,rotY:.22}}function Nd(n,e,t,i,s,r,o,a,l=512,c=256){let h=new le;h.position.set(i,s,r),h.rotation.y=o;let d=new g(new W(e+.2,t+.2,.08),a);d.position.z=-.045,h.add(d);let u=new Ir(new rt(e,t),{clipBias:.003,textureWidth:l,textureHeight:c,color:14412542,multisample:0});u.position.z=.002,h.add(u);let p=new g(new rt(.07,t*.92),new De({color:16777215,transparent:!0,opacity:.16}));p.position.set(-e*.34,0,.006),p.rotation.z=-.35,h.add(p),n.add(h)}function fg(n,e){let t=new H({color:3359061,roughness:.42,metalness:.12}),i=new H({color:6583435,roughness:.45,metalness:.08}),s=new g(new rt(14,14),t);s.rotation.x=-Math.PI/2,s.receiveShadow=!0,n.add(s);for(let O=-4;O<=4;O++)for(let re=-4;re<=3;re++){if((O+re)%2!==0)continue;let ee=new g(new rt(.95,.95),i);ee.rotation.x=-Math.PI/2,ee.position.set(O*1,.004,re*1),ee.receiveShadow=!0,n.add(ee)}rs(n,{backColor:16051425,sideColor:15129288,trimColor:1013358,backZ:-2.9});let r=new g(new W(12.6,1.02,.21),new H({color:1013358,roughness:.45}));r.position.set(0,.51,-2.86),n.add(r),Dr(n,"SHAHI SALON","KESHAV STUDIO \u2022 VIP CUTS",2.34,2.26,-2.75,"#0f172a","#f59e0b"),Dr(n,"STYLE CHART","1. BAHUBALI  2. FADE  3. KATORA",2.34,1.64,-2.75,"#1e293b","#38bdf8");let o=new H({color:14870768,metalness:.88,roughness:.16});Nd(n,3.25,1.38,-.25,1.92,-2.7,0,o,512,256);let a=new g(new Ee(.032,.032,.65,10),o);a.rotation.z=Math.PI/2,a.position.set(-2.5,1.62,-.88),n.add(a),Nd(n,1.42,1.18,-2.14,1.62,-.78,1.04,o,384,320);let l=new g(new W(2.8,.08,.14),new De({color:16776171}));l.position.set(-.25,2.78,-2.7),n.add(l);let c=new Ut(16776171,3.2,9.5,1.3);c.position.set(-.25,2.65,-1.25),n.add(c);let h=new g(new W(3.6,.08,.22),new De({color:16708551}));h.position.set(0,3.85,1.2),n.add(h);let d=new H({color:1013358,roughness:.48}),u=new g(new W(6.4,1.2,.12),d);u.position.set(0,1.85,7.25),n.add(u);let p=new g(new W(2.6,.015,2.2),new H({color:1013358,roughness:.9}));p.position.set(-.55,.008,-.78),p.receiveShadow=!0,n.add(p);let f=new le;f.position.set(3.48,1.68,-2.55);let E=new g(new Ee(.11,.11,.92,16),new H({color:16317180,roughness:.25}));f.add(E),[14427686,2450411,14427686].forEach((O,re)=>{let ee=new g(new We(.112,.028,8,18),new H({color:O,roughness:.3}));ee.rotation.x=Math.PI/2+.42,ee.position.y=-.26+re*.26,f.add(ee)});let M=new H({color:13948120,metalness:.85,roughness:.2});for(let O of[-.5,.5]){let re=new g(new ce(.125,12,10),M);re.position.y=O,f.add(re)}n.add(f),e.animatedProps.push({object:f,kind:"hazard",phase:0,speed:3.2});let m=new g(new W(.75,.72,.56),new H({color:16317180,roughness:.32}));m.position.set(-2.98,.36,-2.42),n.add(m);let w=new g(new Ee(.28,.2,.18,16),new H({color:16777215,roughness:.22}));w.position.set(-2.98,.78,-2.38),n.add(w);let y=new g(new Ee(.02,.02,.24,8),o);y.position.set(-2.98,.92,-2.58),n.add(y);let x=new g(new W(3.3,.08,.36),new H({color:7029795,roughness:.6}));x.position.set(-.25,1.02,-2.6),n.add(x),[14753096,959977,16096779,1096065,9133302].forEach((O,re)=>{let ee=new g(new Ee(.055,.055,.22,10),new H({color:O,roughness:.3}));ee.position.set(-1.2+re*.48,1.17,-2.55),n.add(ee)});let b=new le;b.position.set(.96,0,-1.26);let v=new g(new W(.46,.8,.36),new H({color:1976635,roughness:.5}));v.position.y=.42,b.add(v);let R=new g(new W(.5,.05,.4),o);R.position.y=.84,b.add(R);let C=new g(new Ee(.04,.052,.16,10),new H({color:959977,roughness:.3}));C.position.set(-.14,.94,.04),b.add(C);let _=new g(new W(.05,.05,.14),o);_.position.set(0,.89,.06),b.add(_),[16708551,14742270].forEach((O,re)=>{let ee=new g(new W(.2,.055,.22),new H({color:O,roughness:.85}));ee.position.set(.11,.895+re*.056,-.02),b.add(ee)}),n.add(b);let T=new le;T.position.set(-.44,0,-.78),T.rotation.y=.2;let I=new H({color:12131356,roughness:.42}),G=new g(new Ee(.36,.4,.08,18),o);G.position.y=.04,T.add(G);let F=new g(new Ee(.08,.1,.42,12),o);F.position.y=.25,T.add(F);let k=new g(new W(.76,.16,.72),I);k.position.y=.46,k.castShadow=!0,T.add(k);let Y=new g(new W(.74,.76,.14),I);Y.position.set(0,.84,-.32),Y.rotation.x=-.14,Y.castShadow=!0,T.add(Y);for(let O of[-.41,.41]){let re=new g(new W(.08,.08,.62),o);re.position.set(O,.68,0),T.add(re)}let X=new g(new W(.46,.05,.22),o);X.position.set(0,.22,.48),T.add(X),n.add(T);let ie=new g(new W(1.9,.42,.68),new H({color:2450411,roughness:.6}));ie.position.set(1.76,.21,-1.68),ie.castShadow=!0,n.add(ie),e.spots.sofa={x:-.44,y:.28,z:-.66,rotY:.18},e.spots.counter={x:.34,y:0,z:-.96,rotY:-.36},e.spots.door={x:1.76,y:0,z:-1.45,rotY:-.35}}function pg(n,e){let t=new g(new rt(14,14),new H({color:4927003,roughness:.68}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new H({color:7029795,roughness:.62});rs(n,{backColor:7029795,sideColor:5715482,trimColor:9584654,backZ:-2.9}),Dr(n,"SATYAMEVA JAYATE","KESHAV DISTRICT COURT",0,3.05,-2.76,"#451a03","#f59e0b");let s=new g(new W(3.4,1.25,1),i);s.position.set(0,.62,-1.9),s.castShadow=!0,n.add(s);let r=new g(new We(.32,.04,10,24),new H({color:16096779,metalness:.85,roughness:.2}));r.position.set(0,2.4,-2.76),n.add(r);let o=new g(new W(1.1,.92,.9),i);o.position.set(-.95,.46,-.55),o.castShadow=!0,n.add(o),e.spots.sofa={x:0,y:.42,z:-1.45,rotY:.08},e.spots.counter={x:-.95,y:.1,z:-.35,rotY:.38}}function mg(n,e){let t=new g(new rt(14,14),new H({color:14412542,roughness:.52}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t),rs(n,{backColor:16317180,sideColor:14870768,trimColor:165063,backZ:-2.9}),Dr(n,"CITY CLINIC","DR. DIAGNOSTICS \u2022 OPD 1",2.25,2.35,-2.75,"#0c4a6e","#38bdf8");let i=new De({color:15680580}),s=new g(new W(.22,.72,.05),i);s.position.set(0,2.35,-2.78),n.add(s);let r=new g(new W(.72,.22,.05),i);r.position.set(0,2.35,-2.78),n.add(r);let o=new g(new W(1.8,.52,.88),new H({color:959977,roughness:.6}));o.position.set(-.95,.26,-.88),o.castShadow=!0,n.add(o);let a=new g(new W(1.4,.75,.72),new H({color:6583435,roughness:.5}));a.position.set(.85,.38,-.85),a.castShadow=!0,n.add(a),e.spots.bed={x:-.95,y:.52,z:-.82,rotY:.32},e.spots.sofa={x:.85,y:0,z:-.45,rotY:-.35}}function Eg(n,e){let t=new g(new rt(14,14),new H({color:593188,roughness:.35,metalness:.3}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new De({color:3718648}),s=new g(new We(2.15,.06,12,48),i);s.rotation.x=Math.PI/2,s.position.set(0,.04,0),n.add(s),e.animatedProps.push({object:s,kind:"ring",phase:0,speed:.4});let r=new g(new We(2.7,.08,12,48),new De({color:11032055}));r.position.set(0,1.9,-2.5),n.add(r),e.animatedProps.push({object:r,kind:"portal",phase:.4,speed:.8});let o=new H({color:1976635,metalness:.55,roughness:.3});[-.95,.95].forEach(l=>{let c=new g(new Ee(.38,.44,.82,16),o);c.position.set(l,.41,-.35),c.castShadow=!0,n.add(c)});let a=new Ji(3718648,8.5,16,Math.PI/5,.4);a.position.set(0,4.6,1.5),n.add(a),n.add(a.target),e.animatedProps.push({object:a,kind:"spotlight",phase:0,speed:1.5})}function gg(n,e){let t=new g(new rt(14,14),new H({color:7041664,roughness:.85}));t.rotation.x=-Math.PI/2,t.receiveShadow=!0,n.add(t);let i=new H({color:10105874,roughness:.82}),s=new H({color:16708551,roughness:.55}),r=new De({color:16638023});[-2.6,2.6].forEach(h=>{let d=new g(new W(3,2.2,.28),i);d.position.set(h,1.1,-2.4),d.castShadow=!0,n.add(d)}),[-1.08,1.08].forEach(h=>{let d=new g(new W(.38,2.55,.38),i);d.position.set(h,1.28,-2.35),d.castShadow=!0,n.add(d);let u=new g(new W(.46,.12,.46),s);u.position.set(h,2.58,-2.35),n.add(u);let p=new g(new ce(.11,10,8),r);p.position.set(h,2.74,-2.35),n.add(p)});let o=new le;o.position.set(-.92,0,-2.35);let a=new H({color:1976635,metalness:.65,roughness:.35});for(let h of[.35,1.85]){let d=new g(new W(1.84,.08,.08),a);d.position.set(.92,h,0),o.add(d)}for(let h=0;h<=7;h++){let d=new g(new Ee(.025,.025,2.05,8),a);d.position.set(.08+h*.24,1.05,0),d.castShadow=!0,o.add(d)}let l=new g(new W(.14,.16,.08),new H({color:16096779,metalness:.85,roughness:.2}));l.position.set(1.72,1.12,.08),o.add(l),n.add(o),e.animatedProps.push({object:o,kind:"door",phase:.1,speed:.7});let c=new g(new Ee(.09,.11,3.8,12),new H({color:4674921,metalness:.5,roughness:.5}));c.position.set(2.15,1.9,-1.6),n.add(c),Ai(n,-2.75,-1.25,1.05,1409085,.3,e),e.spots.door={x:0,y:0,z:-1.35,rotY:.1}}function Mg(n,e){let t=new H({color:3875606,roughness:.72}),i=new H({color:6042653,roughness:.65}),s=new H({color:16041038,metalness:.85,roughness:.25}),r=new H({color:1920728,roughness:.45,metalness:.2}),o=new H({color:8330525,roughness:.82}),a=new g(new Ct(10,44),t);a.rotation.x=-Math.PI/2,a.receiveShadow=!0,n.add(a);let l=new g(new W(3.6,.02,2.2),o);l.position.set(0,.015,.1),l.receiveShadow=!0,n.add(l);for(let E of[-2.4,2.4]){let M=new g(new W(2,3.1,.45),i);M.position.set(E,1.55,-2.9),M.castShadow=!0,n.add(M);for(let m of[.85,1.65,2.45]){let w=new g(new W(1.75,.22,.48),s);w.position.set(E,m,-2.9),n.add(w)}}let c=new g(new Ee(.42,.56,1.05,20),i);c.position.set(0,.525,-2.35),c.castShadow=!0,n.add(c);let h=new le;h.position.set(0,1.55,-2.35);let d=new g(new ce(.46,24,18),r);h.add(d);let u=new g(new We(.55,.032,10,42),s);h.add(u);let p=new g(new We(.51,.024,10,42),s);p.rotation.x=Math.PI/2,h.add(p),n.add(h),e.animatedProps.push({object:h,kind:"ring",phase:0,speed:.45});let f=new Ut(16639626,3.2,8,1.4);f.position.set(0,2.65,-1.65),n.add(f),e.ambientFireLights.push({light:f,baseIntensity:3.2,phase:.4})}function yg(n,e,t){let i=new H({color:988970,roughness:.5,metalness:.25}),s=new H({color:1976635,roughness:.45,metalness:.35}),r=new De({color:t||"#38bdf8"}),o=new g(new Ct(10,44),i);o.rotation.x=-Math.PI/2,o.receiveShadow=!0,n.add(o);let a=new g(new We(2.3,.04,10,48),r);a.rotation.x=Math.PI/2,a.position.y=.02,n.add(a);let l=[[-3.6,-4.2,1.1,4.2],[-2.1,-4.6,1,5.1],[-.4,-5,1.25,5.8],[1.4,-4.6,1,4.8],[3.1,-4.2,1.15,4]];for(let[d,u,p,f]of l){let E=new g(new W(p,f,.9),s);E.position.set(d,f*.5,u),n.add(E);for(let M=1;M<f-.5;M+=.95){let m=new g(new W(p*.72,.14,.94),r);m.position.set(d,M,u),n.add(m)}}let c=new g(new We(1.8,.035,10,48),r);c.position.set(0,2.6,-3.1),n.add(c),e.animatedProps.push({object:c,kind:"ring",phase:.4,speed:.35});let h=new Ut(t||"#38bdf8",2.8,9,1.4);h.position.set(0,2.8,-1.8),n.add(h),e.ambientFireLights.push({light:h,baseIntensity:2.8,phase:.6})}function kd(n,e,t,i,s){let{top:r,mid:o,bot:a,sunColor:l,sunIntensity:c,fogDensity:h}=ZE(i,e.palette);n.fog=new rr(o,h);let d=new ce(28,32,20),u=new $t({side:jt,depthWrite:!1,uniforms:{uTop:{value:new Ne(r)},uMid:{value:new Ne(o)},uBot:{value:new Ne(a)}},vertexShader:`
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
    `}),p=new g(d,u);if(n.add(p),!(t==="Bedroom"||t==="LivingRoom"||t==="Kitchen"||t==="SweetShop"||t==="BarberShop"||t==="Courtroom"||t==="DoctorClinic"||t==="Classroom"||t==="QuizStudio"||t==="Archive")){let x=i==="Night"?16317180:i==="Sunset"?16752196:16774064,b=new g(new Ct(i==="Night"?.85:1.15,24),new De({color:x,fog:!1}));b.position.set(3.2,i==="Sunset"?3.1:5.2,-16.5),n.add(b);let v=i==="Night"?6583435:i==="Sunset"?16765363:16777215,R=new De({color:v,transparent:!0,opacity:.88,fog:!1}),C=[[-4.2,4.4,-13.5,.72],[-.6,5.1,-15,.85],[2.4,4,-12.5,.65],[4.8,4.8,-14.5,.78]];for(let[_,T,I,G]of C){let F=new le;F.position.set(_,T,I);for(let[k,Y,X]of[[0,0,.55],[-.45,-.08,.42],[.48,-.06,.44],[.15,.22,.4]]){let ie=new g(new ce(X*G,10,8),R);ie.position.set(k*G,Y*G,0),F.add(ie)}n.add(F)}}let E=new gr(l,a,.85);n.add(E);let M=new Hs(l,c);M.position.set(2.8,5.2,3.8),M.castShadow=!0,M.shadow.mapSize.set(1024,1024),M.shadow.camera.near=.5,M.shadow.camera.far=16,M.shadow.camera.left=-4,M.shadow.camera.right=4,M.shadow.camera.top=4,M.shadow.camera.bottom=-4,M.shadow.bias=-8e-4,n.add(M);let m=new Hs(e.palette.secondaryHex,.65);m.position.set(-3,3.4,-3.5),n.add(m);let w=new le;n.add(w);let y={group:w,skyMaterial:u,keyLight:M,hemiLight:E,ambientFireLights:[],animatedProps:[],backdropTextures:s,spots:{},dynamicSpots:{}};if(e.sceneBlueprint)return yc(w,e.sceneBlueprint,y.dynamicSpots),y;if(s.length>0){let x=new g(new rt(14,14),new mr({opacity:.42}));x.rotation.x=-Math.PI/2,x.receiveShadow=!0,w.add(x);let b=!!e.stageLayout?.templateBackdrop,v=e.width/e.height,R=b?6.2:9.4,C=R*v,_=new g(new rt(C,R),new De({map:s[0],depthWrite:!1,fog:!1}));return _.position.set(0,b?1.32:2.15,b?-2.1:-4.8),w.add(_),y.backdropMesh=_,y}switch(t){case"Temple":JE(w,y);break;case"ForestAshram":KE(w,y);break;case"RiverGhat":$E(w,y);break;case"Cosmos":QE(w,y,e.palette.primaryHex);break;case"ComedyStage":jE(w,y);break;case"ChaiStall":eg(w,y);break;case"SkyGauntlet":og(w,y,e.uniqueVariant??e.seed??0);break;case"TankArena":ag(w,y);break;case"DoorwaySet":lg(w,y,e.uniqueVariant??e.seed??0);break;case"Himalaya":tg(w,y);break;case"PalaceCourt":{let x=[e.title,e.leftCharacter?.name,e.rightCharacter?.name,...e.supportingCast.map(v=>v.name)].join(" "),b=/narasimha|narsimha|hiranyakashipu|prahlad|नरसिंह|नृसिंह|हिरण्यकशिपु|प्रह्लाद|खंभ|स्तंभ/i.test(x);ng(w,y,b);break}case"Bedroom":cg(w,y);break;case"LivingRoom":hg(w,y);break;case"Kitchen":dg(w,y);break;case"SweetShop":ug(w,y);break;case"BarberShop":fg(w,y);break;case"Courtroom":pg(w,y);break;case"DoctorClinic":mg(w,y);break;case"Classroom":yc(w,Ld(),y.dynamicSpots);break;case"QuizStudio":Eg(w,y);break;case"Archive":Mg(w,y);break;case"ModernCity":yg(w,y,e.palette.primaryHex);break;case"NeighborhoodGate":gg(w,y);break;case"Village":ig(w,y);break;default:rg(w,t,y,e.palette.primaryHex);break}return(t==="Temple"||t==="PalaceCourt"||t==="Himalaya"||t==="ForestAshram"||t==="RiverGhat"||t==="Cosmos")&&(y.trialProps=Bd(w)),t==="LivingRoom"&&(y.comedyGags=Ud(w)),y}function Od(n,e,t,i,s,r,o=!1,a="none",l=0,c=.5,h){for(let d of n.ambientFireLights)d.light.intensity=d.baseIntensity*(.86+.14*Math.sin(e*9.5+d.phase));for(let d of n.animatedProps)if(d.kind==="bell")d.object.rotation.z=Math.sin(e*d.speed+d.phase)*.16;else if(d.kind==="sway")d.object.rotation.z=Math.sin(e*d.speed+d.phase)*.035;else if(d.kind==="ring")d.object.rotation.z=e*d.speed+d.phase,d.object.rotation.y=Math.sin(e*.4+d.phase)*.25;else if(d.kind==="diya")d.object.scale.y=.85+.22*Math.sin(e*d.speed+d.phase),d.object.scale.x=.92+.12*Math.cos(e*d.speed*1.1+d.phase);else if(d.kind==="steam"){let u=(e*.55+d.phase)%1;d.object.position.y=(d.baseY??1.16)+u*.65,d.object.scale.setScalar(.75+u*1.15);let p=d.object.material;p.opacity=Math.sin(u*Math.PI)*.28}else if(d.kind==="spotlight"){let u=d.object;u.target.position.set(Math.sin(e*d.speed+d.phase)*1.1,.8,0),u.target.updateMatrixWorld()}else if(d.kind==="portal"){d.object.rotation.z=e*d.speed+d.phase;let u=.94+.08*Math.sin(e*3.8+d.phase);d.object.scale.setScalar(u)}else d.kind==="door"?d.object.rotation.y=.35+Math.sin(e*d.speed+d.phase)*.48:d.kind==="hazard"&&(d.object.rotation.y=e*d.speed+d.phase);if(n.poleStarGroup&&n.poleStarMat){let d=Math.max(0,Math.min(1,(t-.55)/.35));n.poleStarGroup.visible=d>.02,n.poleStarGroup.rotation.y=e*.8,n.poleStarMat.opacity=d*.28}if(n.stambhaWholeGroup&&n.stambhaBrokenGroup&&(n.stambhaWholeGroup.visible=!o,n.stambhaBrokenGroup.visible=o),n.stambhaFireLights){let d=o?3.8+Math.sin(e*14)*.55:0;n.stambhaFireLights.forEach(u=>{u.intensity=d})}if(n.trialProps&&Gd(n.trialProps,e,a,l,c),n.livingRoomTableGroup&&(n.livingRoomTableGroup.visible=!h?.hasFuneralShroud),n.comedyGags&&Fd(n.comedyGags,e,h?.hasFuneralShroud??!1,h?.shroudOpen??!1,h?.hazardMode??"none",c),n.backdropMesh&&n.backdropTextures.length>0){let d=Math.max(0,i)%n.backdropTextures.length,u=n.backdropMesh.material;if(u.map!==n.backdropTextures[d]&&(u.map=n.backdropTextures[d],u.needsUpdate=!0),r?.templateBackdrop){let p=r.templateMotion==="AutoSmooth"?["GentleZoom","OrbitRound","ZoomOut","SlowPan","GentleRotate"][Math.max(0,i>=0?i:Math.floor(e/5.5))%5]:r.templateMotion;if(n.backdropMesh.rotation.z=0,n.backdropMesh.position.y=1.32,p==="GentleZoom"){let f=1+.06*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(f),n.backdropMesh.position.x=0}else if(p==="ZoomOut"){let f=1.1-.09*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(f),n.backdropMesh.position.x=0}else if(p==="SlowPan")n.backdropMesh.scale.setScalar(1.08),n.backdropMesh.position.x=Math.sin(e*Math.PI*2/32)*.16;else if(p==="OrbitRound"){let f=e*Math.PI*2/22;n.backdropMesh.scale.setScalar(1.1),n.backdropMesh.position.x=Math.sin(f)*.13,n.backdropMesh.position.y=1.32+(Math.sin(f+1.25)-Math.sin(1.25))*.055}else if(p==="GentleRotate"){let f=1.08+.03*(.5-.5*Math.cos(e*Math.PI*2/20));n.backdropMesh.scale.setScalar(f),n.backdropMesh.position.x=0,n.backdropMesh.rotation.z=.032*Math.sin(e*Math.PI*2/18)}else n.backdropMesh.scale.setScalar(1),n.backdropMesh.position.x=0}else{let p=s*s*(3-2*s);n.backdropMesh.scale.setScalar(1.04+.09*p),n.backdropMesh.position.x=(d%2===0?1:-1)*.14*(p-.5)}}}function zd(n,e,t,i,s,r){let o=new le;n.add(o);let a=document.createElement("canvas");a.width=64,a.height=64;let l=a.getContext("2d"),c=l.createRadialGradient(32,32,2,32,32,30);c.addColorStop(0,"rgba(255,255,255,1)"),c.addColorStop(.35,"rgba(255,255,255,0.75)"),c.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);let h=new Qt(a),d="upward";t==="ComedyBurst"||e==="ComedyStage"?d="star":e==="ForestAshram"?d="firefly":e==="Himalaya"?d="snow":(t==="DivineAura"||e==="PalaceCourt")&&(d="petal");let u=110,p=new Float32Array(u*3),f=new Float32Array(u*3),E=new Float32Array(u*3),M=new Ne(i),m=new Ne(s),w=new Ne(16775126),y=(r^2654435769)>>>0,x=()=>(y=Math.imul(1664525,y)+1013904223>>>0,y/4294967296);for(let we=0;we<u;we++){let N=(x()-.5)*6.2,Ge=x()*4.2,P=(x()-.5)*4.5-.4;p[we*3]=N,p[we*3+1]=Ge,p[we*3+2]=P,E[we*3]=x()*6.283,E[we*3+1]=.4+x()*.9,E[we*3+2]=N;let ae=we%3===0?M:we%3===1?m:w;f[we*3]=ae.r,f[we*3+1]=ae.g,f[we*3+2]=ae.b}let b=new Gt;b.setAttribute("position",new Kt(p,3)),b.setAttribute("color",new Kt(f,3));let v=new Yi({size:d==="star"?.065:.12,map:h,vertexColors:!0,transparent:!0,opacity:d==="star"?.16:.78,blending:Wn,depthWrite:!1}),R=new Rs(b,v);d==="star"&&(R.visible=!1),o.add(R);let C=36,_=new Float32Array(C*3),T=new Gt;T.setAttribute("position",new Kt(_,3));let I=new Yi({size:.16,map:h,color:16638023,transparent:!0,opacity:0,blending:Wn,depthWrite:!1}),G=new Rs(T,I);o.add(G);let F=[];if(e!=="ModernCity"&&d!=="star")for(let we=0;we<4;we++){let N=new $t({transparent:!0,depthWrite:!1,side:Mt,blending:Wn,uniforms:{uColor:{value:new Ne(i)},uOpacity:{value:.08}},vertexShader:`
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
        `}),Ge=new g(new $e(.85,7.2,20,1,!0),N);Ge.position.set(-1.6+we*1.05,2.6,-1.9),Ge.rotation.z=-.32+we*.1,o.add(Ge),F.push(Ge)}let k=[];for(let we=0;we<7;we++){let N=new g(new ce(.036,10,8),new De({color:s,transparent:!0,opacity:0,blending:Wn,depthWrite:!1}));o.add(N),k.push(N)}let Y=new le,X=new De({color:8246268,transparent:!0,opacity:.85});for(let we=0;we<3;we++){let N=new le,Ge=.06+we*.028,P=new g(new W(Ge*1.6,Ge*.35,Ge*.35),X);P.position.y=Ge*.7;let ae=new g(new W(Ge*1.8,Ge*.32,Ge*.35),X);ae.rotation.z=.72;let He=new g(new W(Ge*1.6,Ge*.35,Ge*.35),X);He.position.y=-Ge*.7,N.add(P,ae,He),Y.add(N)}Y.visible=!1,o.add(Y);let ie=new le,O=new De({color:16436245,side:Mt});for(let we=0;we<6;we++){let N=we/6*Math.PI*2,Ge=new g(new $e(.036,.16,4),O);Ge.position.set(Math.cos(N)*.22,Math.sin(N)*.22,0),Ge.rotation.z=N-Math.PI/2,ie.add(Ge)}ie.visible=!1,o.add(ie);let re=new le,ee=new De({color:16638023});for(let we=0;we<3;we++){let N=new g(new kt(.068,0),ee);re.add(N)}re.visible=!1,o.add(re);let be=new le,he=new De({color:14870768,transparent:!0,opacity:.55});for(let we=0;we<4;we++){let N=new g(new ce(.085,8,6),he);be.add(N)}be.visible=!1,o.add(be);let ue=new le,$=new De({color:1120295,transparent:!0,opacity:.94});for(let we=0;we<12;we++){let N=new g(new W(.068,.022,.024),$);ue.add(N)}ue.visible=!1,o.add(ue);let ge=new le,Ae=new De({color:16708338,transparent:!0,opacity:.85}),xe=new De({color:15680580,transparent:!0,opacity:.92});for(let we=0;we<6;we++){let N=new g(new ce(.065+we%2*.022,8,6),we%3===2?xe:Ae);ge.add(N)}ge.visible=!1,o.add(ge);let J=new le,Me=new De({color:8246268,transparent:!0,opacity:.82});for(let we=0;we<10;we++){let N=new g(new ce(.024,6,5),Me);J.add(N)}J.visible=!1,o.add(J);let j=new le,te=[16436245,16638023,3718648,16020150,4906624];for(let we=0;we<10;we++){let N=new g(new kt(.062+we%2*.025,0),new De({color:te[we%te.length],transparent:!0,opacity:.94}));j.add(N)}j.visible=!1,o.add(j);let ve=new le,de=new De({color:13358561,transparent:!0,opacity:.72}),B=new De({color:15857145,transparent:!0,opacity:.78});for(let we=0;we<8;we++){let N=new g(new ce(.095+we%3*.028,8,6),we%2===0?de:B);ve.add(N)}return ve.visible=!1,o.add(ve),{group:o,ambientPoints:R,ambientPositions:p,ambientSeeds:E,burstPoints:G,burstPositions:_,burstMat:I,streamDots:k,godRays:F,particleMode:d,sleepZGroup:Y,shockBurstGroup:ie,dizzyStarsGroup:re,dustGroup:be,hairCutGroup:ue,angrySteamGroup:ge,sprayMistGroup:J,celebrateStarsGroup:j,brakeSmokeGroup:ve}}function Vd(n,e,t,i,s,r,o,a,l,c,h="none",d="none",u=0,p=0,f=!1,E="calm",M="calm",m=!1,w=null){let y=n.ambientPositions.length/3,x=n.particleMode==="snow"||n.particleMode==="petal"&&t>.6;for(let j=0;j<y;j++){let te=n.ambientSeeds[j*3],ve=n.ambientSeeds[j*3+1],de=n.ambientSeeds[j*3+2];if(n.particleMode==="firefly")n.ambientPositions[j*3]=de+Math.sin(e*.9*ve+te)*.45,n.ambientPositions[j*3+1]=.4+((j*.17+Math.sin(e*.65+te)*.6)%2.8+2.8)%2.8;else{let B=((e*.14*ve+te*.15)%1+1)%1;n.ambientPositions[j*3]=de+Math.sin(e*1.1+te)*.25,n.ambientPositions[j*3+1]=x?3.9-B*3.8:.15+B*3.8}}n.ambientPoints.geometry.attributes.position.needsUpdate=!0;for(let j=0;j<n.godRays.length;j++){let ve=n.godRays[j].material;ve.uniforms.uOpacity.value=.075+.04*Math.sin(e*.8+j*1.1)}let b=n.particleMode==="star",v=i==="Left"||i==="Right",R=i==="Left"?l:c;for(let j=0;j<n.streamDots.length;j++){let te=n.streamDots[j],ve=te.material;if(!v||b){ve.opacity=0;continue}let de=i==="Left"?s+.2:r-.2,B=i==="Left"?r-.2:s+.2,we=(e*1.35+j/n.streamDots.length)%1;te.position.set(de+(B-de)*we,1.38+Math.sin(we*Math.PI)*.42+Math.sin(e*7+j)*.03,-.38+Math.cos(e*6+j)*.06),ve.color.set(R),ve.opacity=Math.sin(we*Math.PI)*.22}if(v&&(b?f:(o==="laughing"||o==="surprised"||o==="proud"||f)&&(a<.4||f))){let j=Math.min(1,a/.4),te=i==="Left"?s:r;n.burstMat.color.setHex(o==="angry"?16347926:16638023);let ve=n.burstPositions.length/3;for(let de=0;de<ve;de++){let B=de/ve*Math.PI*2,we=.68+j*.92;n.burstPositions[de*3]=te+Math.cos(B)*we,n.burstPositions[de*3+1]=1.55+Math.sin(B)*we*.85-j*.16,n.burstPositions[de*3+2]=b?-1.08:-.42}n.burstPoints.geometry.attributes.position.needsUpdate=!0,n.burstMat.opacity=(1-j*.82)*(b?.36:.45)}else n.burstMat.opacity=0;let _=h==="sleeping";if(_||d==="sleeping"){n.sleepZGroup.visible=!0;let j=_?s:r,te=(_?u:p)+.62,ve=_&&u>.25?-.78:-.35;n.sleepZGroup.children.forEach((de,B)=>{let we=(e*.55+B*.33)%1;de.position.set(j+Math.sin(e*2.2+B)*.12+we*.14,te+we*.65,ve),de.rotation.z=Math.sin(e*1.8+B)*.22;let N=Math.sin(we*Math.PI)*.85;de.scale.setScalar(Math.max(.01,N))})}else n.sleepZGroup.visible=!1;let I=m?0:i==="Right"?r:s,G=m?.04:i==="Right"?p:u,F=m?"corpseSnapUp":i==="Right"?d:h,k=b&&(m||f||(F==="shockedFall"||F==="wakingUp"||o==="surprised")&&a<.42),Y=b&&(h==="punching"||h==="kicking"),X=b&&(d==="punching"||d==="kicking"),ie=Y?h:d,O=Y||X?li(e,ie).recoil:0;if(O>.08){let j=Y?r:s,te=Y?p:u;n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(j+(Y?-.28:.28),te+(ie==="kicking"?.95:1.45),-.05),n.shockBurstGroup.rotation.z=e*3.1,n.shockBurstGroup.scale.setScalar(.45+O*.85)}else if(k){n.shockBurstGroup.visible=!0,n.shockBurstGroup.position.set(I,G+2.08,-.18),n.shockBurstGroup.rotation.z=e*2.2;let j=.88+.18*Math.sin(e*16);n.shockBurstGroup.scale.setScalar(j)}else n.shockBurstGroup.visible=!1;if(h==="slapForehead"||d==="slapForehead"||o==="confused"){n.dizzyStarsGroup.visible=!0;let j=d==="slapForehead"?r:h==="slapForehead"?s:I,te=(d==="slapForehead"?p:h==="slapForehead"?u:G)+1.82;n.dizzyStarsGroup.children.forEach((ve,de)=>{let B=e*4.5+de/3*Math.PI*2;ve.position.set(j+Math.cos(B)*.28,te+Math.sin(B*2)*.04,Math.sin(B)*.24),ve.rotation.y=e*5})}else n.dizzyStarsGroup.visible=!1;let ee=h==="walking"||h==="running";if(ee||(d==="walking"||d==="running")){n.dustGroup.visible=!0;let j=ee?s:r,te=(ee?u:p)+.06;n.dustGroup.children.forEach((ve,de)=>{let B=(e*(h==="running"||d==="running"?3.2:1.8)+de*.25)%1;ve.position.set(j-B*.35+(de%2===0?-.1:.1),te+B*.28,-.05),ve.scale.setScalar(Math.max(.01,Math.sin(B*Math.PI)*1.25))})}else n.dustGroup.visible=!1;let he=h==="cutting";if(he||d==="cutting"){n.hairCutGroup.visible=!0;let j=he?r:s,te=(he?p:u)+1.44,ve=-.6;n.hairCutGroup.children.forEach((de,B)=>{let we=(e*2.25+B*.13)%1,N=(B%2===0?1:-1)*(.09+we*.28);de.position.set(j+N+Math.sin(e*7+B)*.04,te-we*1.12,ve+.08),de.rotation.set(e*6+B,B*.9,e*8),de.scale.setScalar(Math.max(.08,Math.sin(we*Math.PI)*1.25))})}else n.hairCutGroup.visible=!1;let $=E==="angry",ge=M==="angry";if($||ge||m){n.angrySteamGroup.visible=!0;let j=m?0:ge?r:s,te=(m?.06:ge?p:u)+1.54,ve=m?-.06:ge?-.68:-.58;n.angrySteamGroup.children.forEach((de,B)=>{let we=B%2===0?-1:1,N=(e*2.4+Math.floor(B/2)*.34)%1;de.position.set(j+we*(.24+N*.22),te+N*.36,ve),de.scale.setScalar(Math.max(.05,Math.sin(N*Math.PI)*.68))})}else n.angrySteamGroup.visible=!1;let Ae=h==="spraying";if(Ae||d==="spraying"){n.sprayMistGroup.visible=!0;let j=Ae?r:s,te=(Ae?p:u)+1.48,ve=Ae?s:r;n.sprayMistGroup.children.forEach((de,B)=>{let we=(e*3.6+B*.1)%1,N=(B%5-2)*.055;de.position.set(ve+(j-ve)*(.35+we*.65),te+N+Math.sin(we*3)*.04,-.62),de.scale.setScalar(Math.max(.1,(1-we*.4)*1.15))})}else n.sprayMistGroup.visible=!1;if(h==="celebrate"||d==="celebrate"||E==="proud"||M==="proud"||w==="tada"||w==="coin"){n.celebrateStarsGroup.visible=!0;let j=d==="celebrate"||M==="proud"?r:h==="celebrate"||E==="proud"?s:I,te=(d==="celebrate"||M==="proud"?p:h==="celebrate"||E==="proud"?u:G)+1.55;n.celebrateStarsGroup.children.forEach((ve,de)=>{let B=(e*1.9+de*.12)%1,we=de/10*Math.PI*2+e*2.2,N=.24+B*.46;ve.position.set(j+Math.cos(we)*N,te+Math.sin(we)*.22+B*.44,-.46+Math.sin(we)*.16),ve.rotation.set(e*4+de,e*5,de),ve.scale.setScalar(Math.max(.05,Math.sin(B*Math.PI)*1.25))})}else n.celebrateStarsGroup.visible=!1;if(h==="brakeStop"||d==="brakeStop"||h==="hazardTruck"||d==="hazardTruck"||w==="brake"){n.brakeSmokeGroup.visible=!0;let j=d==="brakeStop"||d==="hazardTruck"?r:h==="brakeStop"||h==="hazardTruck"?s:I,te=(d==="brakeStop"||d==="hazardTruck"?p:h==="brakeStop"||h==="hazardTruck"?u:G)+.12;n.brakeSmokeGroup.children.forEach((ve,de)=>{let B=(e*2.8+de*.14)%1,we=de%2===0?-1:1;ve.position.set(j+we*(.14+B*.62),te+B*.42,-.45+de%3*.08),ve.scale.setScalar(Math.max(.08,Math.sin(B*Math.PI)*1.55))})}else n.brakeSmokeGroup.visible=!1}function Wd(n){let e=(n??"calm").trim().toLowerCase();return e==="laugh"||e==="laughing"||e==="excited"?"laughing":e==="smug"||e==="sarcastic"||e==="mischievous"||e==="deadpan"||e==="playful"?"smug":e==="scared"||e==="panicked"||e==="panic"||e==="nervous"||e==="terrified"?"scared":e==="surprised"||e==="shocked"||e==="gasp"?"surprised":e==="angry"||e==="shouting"||e==="determined"?"angry":e==="sad"||e==="worried"?"sad":e==="happy"||e==="loving"||e==="hopeful"||e==="relieved"?"happy":e==="proud"||e==="dramatic"?"proud":e==="confused"||e==="shy"?"confused":"calm"}function Xd(n){switch(n){case"CosmosSacred3D":return"Cosmos";case"HistoryChronicle3D":return"Archive";case"NeonCyberGrid3D":return"ModernCity";case"SereneNatureGlow":return"ForestAshram";case"ComedyStage3D":return"ComedyStage";default:return"Temple"}}function xg(n,e){let t=n.sceneRuns??[];if(t.length===0){let l=Math.max(0,Math.min(1,e/Math.max(1,n.durationSeconds))),c=Xd(n.theme);return n.hasCharacters&&n.turns.length>=5&&n.theme==="VedicTempleSunrise3D"&&(c=l<.34?"Temple":l<.68?"ForestAshram":"Cosmos"),{setting:c,timeOfDay:"Dawn",sceneIndex:0,startSeconds:0,localProgress:l}}let i=0;for(;i+1<t.length&&e>=t[i+1].startSeconds;)i++;let s=t[i],r=s.endSeconds>0?s.endSeconds:n.durationSeconds,o=Math.max(0,Math.min(1,(e-s.startSeconds)/Math.max(.5,r-s.startSeconds)));return{setting:s.setting==="Auto"?Xd(n.theme):s.setting,timeOfDay:s.timeOfDay==="Auto"?"Dawn":s.timeOfDay,sceneIndex:Math.max(0,s.sceneIndex),startSeconds:s.startSeconds,localProgress:o,activeCharacters:s.activeCharacters,characterEntryAt:s.characterEntryAt}}async function Tg(n){let e=[];for(let t=0;t<n.backdropCount;t++){let i=await fetch(`/backdrop/${t}.rgba`);if(!i.ok)continue;let s=new Uint8Array(await i.arrayBuffer());if(s.byteLength!==n.width*n.height*4)continue;let r=new or(s,n.width,n.height,En);r.flipY=!0,r.colorSpace=At,r.needsUpdate=!0,e.push(r)}return e}function wg(n,e){let t=n.speechEnvelope;if(!t||t.length===0)return .35;let i=Math.max(0,Math.min(t.length-1,e));return t[i]??0}function _g(n,e){return n.turns.find(t=>!t.isTitleHook&&e>=t.startSeconds-.005&&e<=t.endSeconds+.005)}function Yd(n,e,t,i){if(t)return t;let s=n.turns.filter(r=>!r.isTitleHook);if(s.length!==0){if(e<s[0].startSeconds)return s[0].action==="sleeping"||s[0].action==="sitting"?s[0]:void 0;for(let r=s.length-1;r>=0;r--)if(s[r].endSeconds<=e){let o=s[r],a=r+1<s.length?s[r+1]:void 0;return a&&a.sceneBackdropCue!==o.sceneBackdropCue&&e>=a.startSeconds-.1?a:!o.sceneBackdropCue||o.sceneBackdropCue.startsWith(i)?o:void 0}}}function qd(n,e){let t=e?1.55:2.55,i=(n.x-.5)*2*t,s=Math.max(0,(.72-n.y)*2.2);return{x:i,y:s,scale:Math.max(.5,Math.min(1.8,n.scale||1))}}function Sg(n){n.traverse(e=>{let t=e;t.isReflector&&t.dispose&&t.dispose();let i=e;i.geometry&&i.geometry.dispose();let s=i.material;Array.isArray(s)?s.forEach(r=>r?.dispose()):s&&s.dispose()})}async function vg(){try{let n=await fetch("/job.json");if(!n.ok)throw new Error(`Failed to load /job.json: ${n.status}`);let e=await n.json(),t=document.getElementById("stage");t.width=e.width,t.height=e.height;let i=new Pa({canvas:t,antialias:!0,preserveDrawingBuffer:!0,powerPreference:"high-performance"});i.setSize(e.width,e.height,!1),i.setPixelRatio(1),i.shadowMap.enabled=!0,i.shadowMap.type=Go,i.toneMapping=Wo,i.toneMappingExposure=1.08,i.outputColorSpace=At;let s=await Tg(e),r=i.getContext(),o=e.width*e.height*4,a=new Uint8Array(o),l=e.height>e.width,c=Cd(e),h=null,d=null;if(e.showWatermark!==!1&&(e.footerLabel||e.isComedyMode)){let J=Math.round(Math.max(158,Math.min(212,e.width*.17))),Me=Math.round(J*.26),j=document.createElement("canvas");j.width=512,j.height=132;let te=j.getContext("2d");te.fillStyle="rgba(15, 23, 42, 0.78)",te.beginPath(),te.roundRect(6,6,500,120,26),te.fill(),te.strokeStyle="#f59e0b",te.lineWidth=4,te.stroke(),te.fillStyle="#f59e0b",te.beginPath(),te.arc(64,66,36,0,Math.PI*2),te.fill(),te.fillStyle="#0f172a",te.font="bold 34px sans-serif",te.textAlign="center",te.textBaseline="middle",te.fillText("KS",64,68);let ve=(e.footerLabel&&e.footerLabel.trim().length>0?e.footerLabel.trim():"KESHAV STUDIO").toUpperCase().slice(0,18);te.fillStyle="#f8fafc",te.font="bold 28px sans-serif",te.textAlign="left",te.fillText(ve,118,54),te.fillStyle="#fbbf24",te.font="600 18px sans-serif",te.fillText("ANIMSTUDIO 3D",118,90);let de=new Qt(j);de.colorSpace=At;let B=new De({map:de,transparent:!0,depthTest:!1,depthWrite:!1}),we=new g(new rt(J,Me),B),N=l?18:22,Ge=l?62:16;we.position.set(e.width-J*.5-N,e.height-Me*.5-Ge,0),h=new Xi,h.add(we),d=new Ki(0,e.width,e.height,0,-10,10),i.autoClear=!1}let u=null,p=null,f=new Xi,E=null,M=null,m=null,w=null,y=[],x=l?-.6:-1.05,b=l?.6:1.05,v=0,R=(J,Me)=>{f&&Sg(f);let j=new Xi,te=kd(j,e,J,Me,s),ve=zd(j,J,e.vfxStyle,e.palette.primaryHex,e.palette.secondaryHex,e.seed),de=null,B=null,we=[];if(e.hasCharacters&&e.leftCharacter&&e.rightCharacter){let N=e.stageLayout?.left,Ge=e.stageLayout?.right,P=N?qd(N,l):{x,y:v,scale:1},ae=Ge?qd(Ge,l):{x:b,y:v,scale:1},He=.12,L=.12,S=.42,z=-.42;if(J==="BarberShop"&&!e.stageLayout?.templateBackdrop&&te.spots.sofa&&te.spots.counter){let Ve=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(e.leftCharacter.name??""),Le=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(e.rightCharacter.name??""),pe=Ve&&!Le,Ze=te.spots.counter,_e=te.spots.sofa;P=pe?{x:Ze.x,y:Ze.y,scale:1}:{x:_e.x,y:_e.y,scale:1},ae=pe?{x:_e.x,y:_e.y,scale:1}:{x:Ze.x,y:Ze.y,scale:1},He=pe?Ze.z:_e.z,L=pe?_e.z:Ze.z,S=pe?Ze.rotY??-.92:_e.rotY??.22,z=pe?_e.rotY??.22:Ze.rotY??-.92}let oe=P.x<=ae.x?1:-1;de=Da(e.leftCharacter,e.palette.speakerAHex,J,oe,0),de.root.position.set(P.x,P.y,He),de.root.rotation.y=S,de.root.scale.setScalar(P.scale),j.add(de.root),B=Da(e.rightCharacter,e.palette.speakerBHex,J,-oe,1.7),B.root.position.set(ae.x,ae.y,L),B.root.rotation.y=z,B.root.scale.setScalar(ae.scale),j.add(B.root);let me=J==="BarberShop"?l?e.supportingCast.length===1?[.78]:e.supportingCast.length===2?[.68,-1.22]:[.68,-1.22,1.08,-1.48,.34]:e.supportingCast.length===1?[1.76]:e.supportingCast.length===2?[1.38,2.12]:e.supportingCast.length===3?[1.14,1.72,2.3]:[.92,1.4,1.88,2.36,.48]:e.supportingCast.length===1?[0]:e.supportingCast.length===2?[-.48,.48]:e.supportingCast.length===3?[0,-.68,.68]:[-.36,.36,-.96,.96,0],fe=J==="BarberShop"?l?-1.62:-1.48:-.86;we=e.supportingCast.slice(0,16).map((Ve,Le)=>{let pe=me[Le]??(Le%2===0?-1:1)*(.6+.42*Math.floor(Le/2)),Ze=Da(Ve,e.palette.secondaryHex,J,pe<=0?1:-1,3.1+Le*1.4),_e=Le>=3?-.34:0;return Ze.root.position.set(pe,v+(J==="BarberShop"?.36:.05),fe+_e),Ze.root.scale.setScalar(Le>=3?.72:.76),j.add(Ze.root),Ze})}f=j,E=te,M=ve,m=de,w=B,y=we,u=J,p=Me},C=e.turns.find(J=>!J.isTitleHook&&J.action==="cutting")??e.turns.find(J=>!J.isTitleHook&&J.listenerAction==="cutting"),_=e.turns.find(J=>!J.isTitleHook&&(J.action==="removingTowel"||/तौलिया तो हटा|तौलिया हटा|remove towel/i.test(J.text??""))),T=e.turns.find(J=>!J.isTitleHook&&(J.action==="lookInMirror"||J.action==="removingTowel"||/टकला|कटोरा|मैदान साफ़|चाँद|चांद|शीशे में|mirror/i.test(J.text??""))),I=C?C.endSeconds:9999,G=_?_.startSeconds:9999,F=T?T.startSeconds+.08:Math.max(I+2.5,e.durationSeconds*.56),k=e.turns.find(J=>!J.isTitleHook&&(J.action==="pillarBurst"||J.action==="lapSubdue"||J.action==="lapSubdued"||J.listenerAction==="lapSubdue"||J.listenerAction==="lapSubdued")),Y=k?k.startSeconds:Number.POSITIVE_INFINITY,X=e.turns.filter(J=>!J.isTitleHook&&(J.action==="lapSubdue"||J.action==="lapSubdued"||J.listenerAction==="lapSubdue"||J.listenerAction==="lapSubdued")),ie=X.length>0?X[0].startSeconds:Number.POSITIVE_INFINITY,O=X.length>0?X[X.length-1].endSeconds:-1,re=e.turns.some(J=>J.action==="lyingShroud"||J.listenerAction==="lyingShroud"||J.action==="corpseSnapUp"||J.listenerAction==="corpseSnapUp"),ee=e.turns.find(J=>J.action==="corpseSnapUp"||J.listenerAction==="corpseSnapUp"),be=ee?ee.startSeconds:Number.POSITIVE_INFINITY,he=-1,ue=-2,$=Pd(c),ge=Math.max(1,e.totalFrames),Ae=Math.max(0,Math.min(ge,e.startFrame??0)),xe=Math.max(Ae,Math.min(ge,e.endFrame??ge));for(let J=Ae;J<xe;J++){let Me=J/e.fps,j=Math.max(0,Math.min(1,Me/Math.max(1,e.durationSeconds))),te=xg(e,Me),ve=te.setting!==u||te.timeOfDay!==p;ve&&R(te.setting,te.timeOfDay);let de=_g(e,Me),B=Yd(e,Me,de,te.setting),we=!de&&e.turns.some(ne=>ne.isTitleHook&&Me>=ne.startSeconds&&Me<=ne.endSeconds)&&Me<(e.turns.find(ne=>!ne.isTitleHook)?.startSeconds??99),N=de?de.index:-1,Ge=N!==he,P=Object.keys(E?.dynamicSpots??{}).length>0,ae=(de??Yd(e,Me,de,te.setting))?.index??-1,He=P&&ae!==ue;he=N;let L=wg(e,J),S=Wd((de??B)?.emotion),z=(de??B)?.action||"none",oe=(de??B)?.listenerAction||"none",me=(de??B)?.speakerProp??null,fe=(de??B)?.listenerProp??null,Ve=(de??B)?.cameraShot||"auto",Le=(de??B)?.stageTarget||"default",pe=de??B,Ze=pe?Math.max(.2,pe.endSeconds-pe.startSeconds):1,_e=pe?Math.max(0,Math.min(1,(Me-pe.startSeconds)/Ze)):0,ke=pe?y.findIndex(ne=>ne.name.toLowerCase()===pe.speakerName.toLowerCase()):-1,Ke=ke<0&&!!de&&de.slot==="Left",je=ke<0&&!!de&&de.slot==="Right",Oe=ke<0&&pe?.slot==="Left"?"Left":ke<0&&pe?.slot==="Right"?"Right":"Narrator",Pe=pe?.slot,Te=m,Ie=w,U=Pe==="Left"?z:Pe==="Right"?oe:"none",ye=Pe==="Right"?z:Pe==="Left"?oe:"none";if(te.setting==="PalaceCourt"&&(U==="dancing"||ye==="dancing"||U==="sufiSpin"||ye==="sufiSpin"||U==="adaab"||ye==="adaab")){let qe=U==="dancing"||U==="adaab"||U==="sufiSpin"?U:ye;U==="none"&&(U=qe),ye==="none"&&(ye=qe)}let Z=Me>=Y-.04,K=z==="pillarBurst"||oe==="pillarBurst",Se=z==="lapSubdue"||z==="lapSubdued"||oe==="lapSubdue"||oe==="lapSubdued"||!K&&z!=="blessing"&&Me>=ie-.04&&Me<=O+.04,Re=z==="serpentAttack"||oe==="serpentAttack"?"serpentAttack":z==="elephantCharge"||oe==="elephantCharge"?"elephantCharge":z==="fireTrial"||oe==="fireTrial"?"fireTrial":z==="cliffRescue"||oe==="cliffRescue"?"cliffRescue":"none",Ue=Me>=be-.04,ot=dc(z),ft=ot!=="none"?ot:dc(oe),it=(ne,qe)=>{if(!ne)return qe;if(Se){if(ne.isNarasimha)return"lapSubdue";if(ne.isAsuraKing)return"lapSubdued";if(ne.role==="ChildDevotee")return"praying"}else if(K){if(ne.isNarasimha)return"pillarBurst";if(ne.isAsuraKing)return"shockedFall";if(ne.role==="ChildDevotee")return"praying"}else if(Z&&!Se&&!K){if(ne.isNarasimha)return"blessing";if(ne.role==="ChildDevotee"&&(qe==="none"||qe==="praying"))return"praying"}else{if(Re==="fireTrial"&&ne.role==="ChildDevotee")return"fireTrial";if(Re==="cliffRescue"&&ne.role==="ChildDevotee")return"cliffRescue"}return qe};U=it(Te,U),ye=it(Ie,ye);let Dt=pe?.characterActions??{};Te&&Pe!=="Left"&&Dt[Te.name]&&(U=Dt[Te.name]),Ie&&Pe!=="Right"&&Dt[Ie.name]&&(ye=Dt[Ie.name]);let Xt=Pe==="Left"?me:Pe==="Right"?fe:null,on=Pe==="Right"?me:Pe==="Left"?fe:null,Hi=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(Te?.name??""),gn=/नाई|barber|salon|amrendra|अमरेंद्र|stylist|कटिंग मास्टर|हेयर/i.test(Ie?.name??""),dn=Hi&&!gn?"Left":gn?"Right":Le==="barberStand"&&Pe==="Left"?"Left":"Right";te.setting==="BarberShop"&&(dn==="Left"?(Xt||(Xt="scissors"),(on==="scissors"||on==="comb")&&(on="cape"),(U==="lookInMirror"||ye==="lookInMirror")&&(ye="lookInMirror",U==="lookInMirror"&&(U="pointing"))):(on||(on="scissors"),(Xt==="scissors"||Xt==="comb")&&(Xt="cape"),(U==="lookInMirror"||ye==="lookInMirror")&&(U="lookInMirror",ye==="lookInMirror"&&(ye="pointing"))));let ci=(ne,qe,dt,mt,Et)=>{let zt=E?.dynamicSpots??{},an=ne==="Left"?e.leftCharacter:e.rightCharacter,Mn=an?.name??"",st=Mn&&pe?.characterSpots?.[Mn]||(dt?pe?.speakerSpot:pe?.listenerSpot)||an?.defaultSpot||"";if(st==="hidden"||st==="outside")return{x:99,y:-99,z:99,rotY:0,seated:!1,showCape:!1};if(st&&zt[st]){let Vt=zt[st];return{x:Vt.x,y:Vt.y??0,z:Vt.z,rotY:Vt.rotY??Et,seated:Vt.pose==="sitting"||qe==="sitting"||qe==="placingBook",showCape:!1}}let Tt=v;if(e.stageLayout?.templateBackdrop)return{x:mt,y:Tt,z:.12,rotY:Et,seated:!1,showCape:!1};let Je=E?.spots??{},St=dt?Le:"default";if(te.setting==="BarberShop"){if(ne===dn)return{x:Je.counter?.x??-.22,y:Tt,z:Je.counter?.z??-.92,rotY:Je.counter?.rotY??-.92,seated:!1,showCape:!1};if(Je.sofa){let bt=qe!=="removingTowel"&&Me<G-.1,Ft=qe==="lookInMirror"||z==="lookInMirror"||oe==="lookInMirror",yn=_e<.45?-.64+Math.sin(_e*Math.PI*2.2)*.22:.28;return{x:Je.sofa.x,y:Je.sofa.y,z:Je.sofa.z,rotY:Ft?yn:Je.sofa.rotY??.22,seated:!0,showCape:bt}}}if(te.setting==="Courtroom"){if(St==="judgeBench"&&Je.sofa)return{x:Je.sofa.x,y:Je.sofa.y,z:Je.sofa.z,rotY:Je.sofa.rotY??.08,seated:!0,showCape:!1};if(St==="witnessStand"&&Je.counter)return{x:Je.counter.x,y:Je.counter.y,z:Je.counter.z,rotY:Je.counter.rotY??.38,seated:!1,showCape:!1}}if(te.setting==="DoctorClinic"){if(St==="doctorDesk"&&Je.sofa)return{x:Je.sofa.x,y:Je.sofa.y,z:Je.sofa.z,rotY:Je.sofa.rotY??-.35,seated:!1,showCape:!1};if(St==="patientBed"&&Je.bed)return{x:Je.bed.x+.15,y:.32,z:-.32,rotY:.32,seated:!0,showCape:!1}}if(qe==="sleeping"&&Je.bed)return{x:Je.bed.x,y:Je.bed.y,z:Je.bed.z,rotY:Je.bed.rotY??Et,seated:!1,showCape:!1};if(St==="bed"&&(qe==="wakingUp"||qe==="sitting")&&Je.bed)return{x:Je.bed.x+.28,y:.34,z:-.05,rotY:.35,seated:!0,showCape:!1};if((qe==="sitting"||St==="sofa")&&Je.sofa)return{x:Je.sofa.x,y:Je.sofa.y,z:Je.sofa.z,rotY:Je.sofa.rotY??Et,seated:!0,showCape:!1};if((St==="counter"||qe==="eating"||qe==="stirring")&&Je.counter)return ne==="Left"?{x:Je.counter.x,y:Je.counter.y,z:Je.counter.z,rotY:Je.counter.rotY??.3,seated:!1,showCape:!1}:{x:Math.max(.55,Je.counter.x+.96),y:Je.counter.y,z:-.22,rotY:-.48,seated:!1,showCape:!1};if(te.setting==="Kitchen"||te.setting==="SweetShop")return ne==="Left"?{x:Je.counter?.x??-.45,y:Tt,z:-.52,rotY:.34,seated:!1,showCape:!1}:{x:.6,y:Tt,z:-.18,rotY:-.46,seated:!1,showCape:!1};if(qe==="walking"||qe==="running"){let Vt=_e<.85?Math.min(1,_e/.85):1,bt=Vt*Vt*(3-2*Vt),Ft=St==="door"&&Je.door?Je.door.x:mt*1.45,yn=St==="door"&&Je.door?Je.door.z:-.35,vn=St==="center"?mt*.45:mt,as=.22,Na=Ft+(vn-Ft)*bt,ls=yn+(as-yn)*bt,Lr=vn-Ft,xc=Math.abs(Lr)>.05?Math.atan2(Lr,as-yn)*.65:Et;return{x:Na,y:Tt,z:ls,rotY:xc,seated:!1,showCape:!1}}return qe==="lapSubdue"?{x:-.04,y:.04,z:.08,rotY:.06,seated:!1,showCape:!1}:qe==="lapSubdued"?{x:-.04,y:.04,z:.08,rotY:0,seated:!1,showCape:!1}:qe==="pillarBurst"?{x:0,y:.04,z:-.04,rotY:.04,seated:!1,showCape:!1}:Se?{x:l?.72:1.18,y:Tt,z:.16,rotY:-.58,seated:!1,showCape:!1}:te.setting==="LivingRoom"&&re?{x:ne==="Left"?l?-.78:-1.16:l?.78:1.16,y:Tt,z:-.36,rotY:ne==="Left"?.44:-.44,seated:!1,showCape:!1}:St==="center"||dt&&qe==="pointing"?{x:mt*.84,y:Tt,z:.18,rotY:Et*.78,seated:!1,showCape:!1}:{x:mt,y:Tt,z:.12,rotY:Et,seated:!1,showCape:!1}},Jt=1-Math.exp(-(e.isComedyMode?13.5:8.5)/Math.max(1,e.fps)),Hn=!1,Zn=!1;if(Te&&!e.stageLayout?.templateBackdrop){let ne=ci("Left",U,Pe==="Left",x,.42);Hn=ne.seated,Zn=ne.showCape;let qe=ve||He||Ge&&(U==="sleeping"||U==="sitting"||ne.seated)?1:Jt;Te.root.position.x+=(ne.x-Te.root.position.x)*qe,Te.root.position.y+=(ne.y-Te.root.position.y)*qe,Te.root.position.z+=(ne.z-Te.root.position.z)*qe,Te.root.rotation.y+=(ne.rotY-Te.root.rotation.y)*qe}let un=!1,hi=!1;if(Ie&&!e.stageLayout?.templateBackdrop){let ne=ci("Right",ye,Pe==="Right",b,-.42);un=ne.seated,hi=ne.showCape;let qe=ve||He||Ge&&(ye==="sleeping"||ye==="sitting"||ne.seated)?1:Jt;Ie.root.position.x+=(ne.x-Ie.root.position.x)*qe,Ie.root.position.y+=(ne.y-Ie.root.position.y)*qe,Ie.root.position.z+=(ne.z-Ie.root.position.z)*qe,Ie.root.rotation.y+=(ne.rotY-Ie.root.rotation.y)*qe}let Pi=Te?Te.root.position.x:x,Pn=Ie?Ie.root.position.x:b,Ii=Te?Te.root.position.y:v,Di=Ie?Ie.root.position.y:v,os=pe?.listenerEmotion?Wd(pe.listenerEmotion):"calm",Li=(ne,qe,dt)=>ne==="lapSubdue"||ne==="pillarBurst"?"angry":ne==="lapSubdued"?"surprised":qe?S:ne==="brakeStop"?"scared":ne==="celebrate"?"proud":ne==="lookInMirror"||ne==="shockedFall"?"surprised":dt&&os!=="calm"?os:"calm",In=Li(U,Ke,je),A=Li(ye,je,Ke),q=e.turns.find(ne=>!ne.isTitleHook),se=pe&&!pe.isTitleHook?pe:q,Q=se?.slot,V=Q==="Left"?se?.speakerGlasses??null:Q==="Right"?se?.listenerGlasses??null:null,Ce=Q==="Right"?se?.speakerGlasses??null:Q==="Left"?se?.listenerGlasses??null:null,Fe=te.setting!=="BarberShop"?0:Me>=F||U==="lookInMirror"||ye==="lookInMirror"?2:C&&Me>=C.startSeconds?1:0,Xe=dn==="Left"?0:Fe,Ye=dn==="Right"?0:Fe,nt=!e.isComedyMode&&!e.stageLayout?.templateBackdrop&&(e.sceneRuns?.length??0)>1;if(Te){let ne=Te.name&&pe?.characterSpots?.[Te.name]||(Pe==="Left"?pe?.speakerSpot:pe?.listenerSpot)||e.leftCharacter?.defaultSpot||"";Te.root.visible=ne!=="hidden"&&ne!=="outside",Te.root.rotation.z=ne==="door_exit"?Math.min(1,_e*1.4)*Math.PI:0,La(Te,Me,Ke,L,In,we,U,_e,ve,Xt,Hn,Zn,V,Xe)}if(Ie){let ne=Ie.name&&pe?.characterSpots?.[Ie.name]||(Pe==="Right"?pe?.speakerSpot:pe?.listenerSpot)||e.rightCharacter?.defaultSpot||"";Ie.root.visible=ne!=="hidden"&&ne!=="outside",Ie.root.rotation.z=ne==="door_exit"?Math.min(1,_e*1.4)*Math.PI:0,La(Ie,Me,je,L,A,we,ye,_e,ve,on,un,hi,Ce,Ye)}y.forEach((ne,qe)=>{let dt=qe===ke,mt=!nt&&te.setting==="LivingRoom"&&re&&qe===0,Et=!nt&&te.setting==="LivingRoom"&&re&&qe===1,zt=E?.dynamicSpots??{},an=e.supportingCast[qe],Mn=ne.name&&pe?.characterSpots?.[ne.name]||an?.defaultSpot||"",st=Mn?zt[Mn]:void 0,Tt=!1;if(Mn==="hidden"||Mn==="outside")ne.root.visible=!1;else if(st){ne.root.visible=!0;let vn=ve||He?1:Jt;ne.root.position.x+=(st.x-ne.root.position.x)*vn,ne.root.position.y+=((st.y??0)-ne.root.position.y)*vn,ne.root.position.z+=(st.z-ne.root.position.z)*vn,ne.root.rotation.y+=((st.rotY??Math.PI)-ne.root.rotation.y)*vn,ne.root.rotation.z=Mn==="door_exit"?Math.min(1,_e*1.4)*Math.PI:0,ne.root.scale.setScalar(1),Tt=st.pose==="sitting"}else if(mt)Ue?(ne.root.position.x+=(0-ne.root.position.x)*Math.max(Jt,.55),ne.root.position.y+=(.02-ne.root.position.y)*Math.max(Jt,.55),ne.root.position.z=.25,ne.root.rotation.y+=(0-ne.root.rotation.y)*Math.max(Jt,.55)):(ne.root.position.set(.68,.14,.25),ne.root.rotation.y=Math.PI*.5),ne.root.scale.setScalar(.92);else if(Et)ne.root.position.set(.02,.38,-1.24),ne.root.rotation.y=.05,ne.root.scale.setScalar(.84);else if(Se&&ne.isNarasimha)ne.root.position.set(-.04,.04,.08),ne.root.rotation.y=.06,ne.root.scale.setScalar(1);else if(Se&&ne.isAsuraKing)ne.root.position.set(-.04,.04,.08),ne.root.rotation.y=0,ne.root.scale.setScalar(1);else if(K&&ne.isNarasimha)ne.root.position.set(0,.04,-.04),ne.root.rotation.y=.04,ne.root.scale.setScalar(1);else if(!nt)if(te.setting==="BarberShop")ne.root.position.z=-1.52,ne.root.position.y=dt?.34:.3,ne.root.scale.setScalar(dt?.8:.76);else if(te.setting==="PalaceCourt"){let vn=qe%2===0?-1:1,as=Math.floor(qe/2);ne.root.position.x=vn*(1.82+as*.72),ne.root.position.z=-.68-as*.44,ne.root.position.y=0,ne.root.scale.setScalar(.94)}else ne.root.position.z=dt?-.35:-.82,ne.root.scale.setScalar(dt?.94:.88);let Je=U==="dancing"||ye==="dancing"||U==="adaab"||U==="sufiSpin",St=dt?void 0:pe?.characterActions?.[ne.name],Vt=St||(mt?Ue?"corpseSnapUp":"lyingShroud":Et?Ue?"shockedFall":"sitting":dt?z:Je&&te.setting==="PalaceCourt"?U==="dancing"||U==="adaab"||U==="sufiSpin"?U:ye:z==="punching"||z==="kicking"?"shockedFall":Tt?"sitting":"none"),bt=it(ne,Vt),Ft=mt?Ue||j>.54?"angry":"happy":Et?Ue?"surprised":dt?S:"sad":bt==="lapSubdue"||bt==="pillarBurst"?"angry":bt==="lapSubdued"?"surprised":bt==="blessing"?"proud":dt?S:S==="angry"||S==="surprised"?"surprised":S==="laughing"?"laughing":"calm",yn=dt&&te.setting!=="BarberShop"?me:null;Tt=Tt||te.setting==="BarberShop"||Et&&!Ue,La(ne,Me,dt,L,Ft,!1,bt,_e,ve,yn,Tt,!1,null,0)});let tt=Pi,Qe=Pn,lt=Oe,pt=Oe==="Left"?Ii+(Te?.headY??1.4):Oe==="Right"?Di+(Ie?.headY??1.4):1.38;if(nt){let ne=e.sceneRuns?.[1]?.activeCharacters?.slice(0,2)??[Te?.name,Ie?.name].filter(st=>!!st),qe=(te.activeCharacters?.length??0)>0?te.activeCharacters:ne,dt=te.characterEntryAt??{},mt=st=>{let Tt=st.name;if((K||Se)&&(st.isNarasimha||st.isAsuraKing))return Y;if(Re!=="none"&&(st.role==="ChildDevotee"||Re==="fireTrial"&&st.isHolika)||Z&&!Se&&!K&&(st.isNarasimha||st.role==="ChildDevotee")&&qe.some(bt=>/प्रह्लाद|prahlad|नरसिंह|नृसिंह|narasimha|narsimha/i.test(bt)))return te.startSeconds;let Je=qe.find(bt=>bt.toLowerCase()===Tt.toLowerCase()),St=!!de&&de.speakerName.toLowerCase()===Tt.toLowerCase();return!Je&&!St?null:Object.entries(dt).find(([bt])=>bt.toLowerCase()===Tt.toLowerCase())?.[1]??te.startSeconds},Et=[...Te?[Te]:[],...Ie?[Ie]:[],...y],zt=[];for(let st of Et){let Tt=mt(st),Je=Tt!==null&&Me>=Tt-.04;st.root.visible=Je,Je&&Tt!==null&&zt.push({rig:st,entryAt:Tt})}let an=zt.length,Mn=l?.56:.88;if(zt.forEach(({rig:st,entryAt:Tt},Je)=>{let St=0,Vt=0,bt=.14,Ft=0;Se?st.isNarasimha?(St=-.04,Vt=.04,bt=.08,Ft=.06):st.isAsuraKing?(St=-.04,Vt=.04,bt=.08,Ft=0):(St=l?.72:1.18,Vt=0,bt=.16,Ft=-.58):K&&st.isNarasimha?(St=0,Vt=.04,bt=-.04,Ft=.04):Re==="elephantCharge"?st.role==="ChildDevotee"?(St=l?.62:.96,bt=.16,Ft=-.35):(St=l?-.78:-1.52,bt=-.24,Ft=.45):Re==="fireTrial"?st.role==="ChildDevotee"?(St=.42,bt=.24,Ft=-.25):st.isHolika?(St=-.42,bt=.2,Ft=.25):(St=-1.38,bt=.05,Ft=.48):an===1?(St=0,bt=.16,Ft=.12):an===2?(St=Je===0?-Mn:Mn,bt=.16,Ft=Je===0?.42:-.42):(St=[-Mn*1.15,.04,Mn*1.15][Je]??(Je-1)*.65,bt=Je===1?-.18:.16,Ft=St<-.1?.44:St>.1?-.44:.08);let yn=Math.max(0,Me-Tt),vn=yn<.72?Math.sin(yn/.72*Math.PI*.5):1,Na=!Se&&!K&&st.role==="Divine"&&Tt>te.startSeconds+.25&&yn<.9?(1-vn)*.85:0,ls=ve||yn<.06?1:Se?Math.max(Jt,.55):Jt;st.root.position.x+=(St-st.root.position.x)*ls,st.root.position.y+=(Vt+Na-st.root.position.y)*ls,st.root.position.z+=(bt-st.root.position.z)*ls,st.root.rotation.y+=(Ft-st.root.rotation.y)*ls;let Lr=yn<.55?.78+.22*vn:1;st.root.scale.setScalar(Lr)}),Se||K)tt=-.55,Qe=.55,lt="Narrator",pt=1.48;else if(zt.length>0){tt=Math.min(...zt.map(Tt=>Tt.rig.root.position.x)),Qe=Math.max(...zt.map(Tt=>Tt.rig.root.position.x));let st=pe?zt.find(Tt=>Tt.rig.name.toLowerCase()===pe.speakerName.toLowerCase())?.rig:void 0;st?(lt=st.root.position.x<=.05?"Left":"Right",pt=st.root.position.y+st.headY):(lt="Narrator",pt=zt[0].rig.root.position.y+zt[0].rig.headY)}}let It=re&&(z==="corpseSnapUp"||Ue&&ke===0);if(It&&y[0]&&(pt=y[0].root.position.y+y[0].headY),E){let ne=[Te,Ie,...y].find(dt=>!!dt&&dt.role==="ChildDevotee"),qe=ne?ne.root.position.x:0;Od(E,Me,j,te.sceneIndex,te.localProgress,e.stageLayout,Z,Re,qe,_e,{hasFuneralShroud:re,shroudOpen:Ue,hazardMode:ft})}let Ht=!!e.memeCues?.some(ne=>Me>=ne.startSeconds-.05&&Me<=ne.startSeconds+Math.min(.75,ne.seconds));M&&Vd(M,Me,j,lt,tt,Qe,S,_e,e.palette.primaryHex,e.palette.secondaryHex,U,ye,Ii,Di,Ht,In,A,It,pe?.sfxCue??null);let yt=Se?"lapSubdue":K?"pillarBurst":It?"corpseSnapUp":Re!=="none"?Re:z,et=E,Ot=M,_t=!!et&&Object.keys(et.dynamicSpots).length>0,fn=pe?pe.index:-1,di=fn!==ue;ue=fn;let tn=!1;if(_t){Ot&&(Ot.group.visible=!1);let ne=[...Te?[Te]:[],...Ie?[Ie]:[],...y].filter(mt=>mt.root.visible),qe=mt=>mt?ne.find(Et=>Et.name.toLowerCase()===mt.trim().toLowerCase()):void 0,dt=qe(pe?.speakerName)??(lt==="Left"?Te:lt==="Right"?Ie:null)??ne[0];if(dt){let mt=qe(pe?.listenerName)??ne.find(zt=>zt!==dt),Et=e.sceneBlueprint?.room;Dd(c,$,e,{shot:we?"wideEstablishing":Ht?"crashPunch":Ve,speaker:dt,listener:mt,everyone:ne,aspect:e.width/e.height,scene:f,room:{halfWidth:(Et?.width??9.6)/2,halfDepth:(Et?.depth??8.4)/2,height:Et?.height??3.6},turnLocal:_e,cut:di||ve}),tn=!0}}tn||Ad(c,e,Me,j,lt,tt,Qe,S,we,Ht?"crashPunch":Ve,yt,Ge||ve,_e,pt,te.setting),h&&d?(i.clear(),i.render(f,c.camera),i.clearDepth(),i.render(h,d)):i.render(f,c.camera),r.readPixels(0,0,e.width,e.height,r.RGBA,r.UNSIGNED_BYTE,a);let ui=await fetch(`/frame/${J}`,{method:"POST",headers:{"Content-Type":"application/octet-stream"},body:a});if(!ui.ok)throw new Error(`Frame ${J} upload failed: ${ui.status}`)}await fetch("/done",{method:"POST"}),document.title="DONE"}catch(n){let e=n instanceof Error?n.stack||n.message:String(n);await fetch("/error",{method:"POST",body:e}).catch(()=>{}),document.title="ERROR"}}vg();})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2025 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
