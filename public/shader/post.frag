precision mediump float;

varying vec2 vTexCoord;

uniform float u_time;
uniform sampler2D u_tex;
uniform sampler2D u_uitex;
uniform float u_mosaic;

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

void main(void) {
    vec2 uv = vTexCoord;

    // モザイク
    if(u_mosaic > 0.0){
        uv = mosaic(uv, mix(1.0, 100.0, u_mosaic));
    }

    vec4 drawcol = texture2D(u_tex, uv);

    // UIオーバーレイ合成
    vec4 uicol = texture2D(u_uitex, vTexCoord);
    vec4 col = drawcol * (1.0 - uicol.a) + uicol * uicol.a;

    gl_FragColor = col;
}