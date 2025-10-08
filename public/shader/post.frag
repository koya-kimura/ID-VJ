precision mediump float;

varying vec2 vTexCoord;

uniform float u_time;
uniform sampler2D u_tex;
uniform sampler2D u_uitex;
uniform float u_invert;
uniform float u_mosaic;
uniform float u_noise;
uniform float u_tile;
uniform float u_cut;
uniform float u_color;

float PI = 3.14159265358979;

float random(vec2 st){
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

mat2 rot(float angle){
    return mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
}

float atan2(float y,float x){
    return x==0.?sign(y)*PI/2.:atan(y,x);
}

vec2 xy2pol(vec2 xy){
    return vec2(atan2(xy.y,xy.x),length(xy));
}

vec2 pol2xy(vec2 pol){
    return pol.y*vec2(cos(pol.x),sin(pol.x));
}

vec2 mosaic(vec2 uv, float n){
    return (floor(uv*n)+0.5)/n;
}

vec3 hsv2rgb(in float h){
    float s=1.;
    float v=1.;
    
    // hueのセグメント計算
    vec4 K=vec4(1.,2./3.,1./3.,3.);
    
    vec3 p=abs(fract(vec3(h)+K.xyz)*6.-K.w);
    vec3 rgb=v*mix(vec3(K.x),clamp(p-K.x,0.,1.),s);
    
    return rgb;
}

void main(void) {
    vec2 uv = vTexCoord;

    uv+=vec2(random(uv)*.1-.05)*(u_noise + 0.025);

    // モザイク
    if(u_mosaic > 0.){
        uv = mosaic(uv, mix(1000.0, 5.0, pow(u_mosaic, 2.0)));
    }
    // if(u_cut > 0.){
    //     float index = floor(uv.x*8.0);
    //     float dir = mod(index, 2.0) == 0.0 ? 1.0 : -1.0;
    //     uv.y = mod((uv.y + dir * u_cut * 0.3), 1.0);
    // }
    if(u_tile > 0.){
        float n = floor(u_tile*4.0);
        uv = fract(uv*n);
    }

    vec4 drawcol = texture2D(u_tex, uv);

    if(u_color > 0.0){
        float angle = floor(u_color * 6.0) / 6.0;
        vec3 colorful = hsv2rgb(angle);
        drawcol.rgb = drawcol.r>.7 ? colorful : drawcol.rgb;
    }

    if(u_invert == 1.0){
        drawcol.rgb = vec3(1.0) - drawcol.rgb;
    }

    // UIオーバーレイ合成
    vec4 uicol = texture2D(u_uitex, vTexCoord);
    vec4 col = drawcol * (1.0 - uicol.a) + uicol * uicol.a;

    gl_FragColor = col;
}