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
uniform float u_monochrome;
uniform float u_color;
uniform float u_beat;
uniform float u_blackout;
uniform float u_vignette;
uniform float u_chromatic;

float PI = 3.14159265358979;

float random(vec2 st){
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

mat2 rot(float angle){
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float atan2(float y, float x){
    return x == 0. ? sign(y) * PI / 2. : atan(y, x);
}

vec2 xy2pol(vec2 xy){
    return vec2(atan2(xy.y, xy.x), length(xy));
}

vec2 pol2xy(vec2 pol){
    return pol.y * vec2(cos(pol.x), sin(pol.x));
}

vec2 mosaic(vec2 uv, float n){
    return vec2((floor(uv.x * n) + 0.5) / n, (floor(uv.y * n * 9. / 16.) + 0.5) / (n*9./16.));
}

vec3 hsv2rgb(in float h){
    float s = 1.;
    float v = 1.;

    vec4 K = vec4(1., 2. / 3., 1. / 3., 3.);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6. - K.w);
    vec3 rgb = v * mix(vec3(K.x), clamp(p - K.x, 0., 1.), s);

    return rgb;
}

void main(void) {
    vec2 uv = vTexCoord;

    float beatMod = pow(abs(mod(u_beat, 2.0) - 1.0), 2.0);
    uv -= 0.5;
    uv *= 1.0 - beatMod * 0.001;
    uv += 0.5;

    uv += vec2(random(uv) * .1 - .05) * (u_noise + 0.025);

    if(u_mosaic > 0.){
        uv = mosaic(uv, mix(1000.0, 5.0, pow(u_mosaic, 2.0)));
    }

    if(u_tile > 0.){
        float n = floor(u_tile * 4.0);
        uv = fract(uv * n);
    }

    float cutStrength = clamp(u_cut, 0.0, 1.0);
    vec2 sampleUV = uv;
    if(u_wave > 0.0){
        float waveStrength = clamp(u_wave, 0.0, 1.0);
        float freq = mix(2.0, 14.0, waveStrength);
        sampleUV.y += sin((uv.x + u_time * 0.35) * freq) * 0.035 * waveStrength;
        sampleUV.x += sin((uv.y + u_time * 0.21) * freq * 0.6) * 0.025 * waveStrength;
    }
    if(cutStrength > 0.0){
        float bandIndex = floor(uv.y * mix(6.0, 40.0, cutStrength));
        float glitchOffset = fract(sin(bandIndex * 91.7 + u_time * 2.1) * 43758.5453);
        sampleUV.x += (glitchOffset - 0.5) * 0.05 * cutStrength;
        sampleUV.y += sin((uv.x + glitchOffset) * 20.0 + u_time * 1.5) * 0.01 * cutStrength;
    }

    vec4 drawcol = texture2D(u_tex, sampleUV);

    if(u_mirror > 0.0){
        float mirrorStrength = clamp(u_mirror, 0.0, 1.0);
        vec2 mirroredUV = vec2(1.0 - sampleUV.x, sampleUV.y);
        vec4 mirrorCol = texture2D(u_tex, mirroredUV);
        drawcol.rgb = mix(drawcol.rgb, mirrorCol.rgb, mirrorStrength);
    }

    // モノクロの向きを反転: フェーダー低 = モノクロ、フェーダー高 = カラー
    float monoW = clamp(1.0 - u_monochrome, 0.0, 1.0);
    if(monoW > 0.0){
        float gray = dot(drawcol.rgb, vec3(0.299, 0.587, 0.114));
        gray = floor(gray * 20.0 + 0.5) / 20.0; // 階調を10段階に
        drawcol.rgb = mix(drawcol.rgb, vec3(gray), monoW);
    }

    if(u_color > 0.0){
        float angle = floor(u_color * 6.0) / 6.0;
        vec3 colorful = hsv2rgb(angle);
        drawcol.rgb = drawcol.r > .7 ? colorful : drawcol.rgb;
    }

    if(u_posterize > 0.0){
        float levels = floor(mix(32.0, 4.0, clamp(u_posterize, 0.0, 1.0)) + 0.5);
        drawcol.rgb = floor(drawcol.rgb * levels) / max(levels, 1.0);
    }

    if(u_vignette > 0.0){
        vec2 centered = vTexCoord - vec2(0.5);
        float dist = length(centered);
        float mask = smoothstep(0.8, mix(0.35, 0.55, 1.0 - clamp(u_vignette, 0.0, 1.0)), dist);
        drawcol.rgb *= mix(1.0, 1.0 - mask, clamp(u_vignette, 0.0, 1.0));
    }

    if(u_chromatic > 0.0){
        float strength = clamp(u_chromatic, 0.0, 1.0);
        vec2 chromaOffset = (vTexCoord - vec2(0.5)) * (0.05 * strength);
        vec3 shifted;
        shifted.r = texture2D(u_tex, sampleUV + chromaOffset).r;
        shifted.g = texture2D(u_tex, sampleUV).g;
        shifted.b = texture2D(u_tex, sampleUV - chromaOffset).b;
        drawcol.rgb = mix(drawcol.rgb, shifted, strength);
    }

    if(u_glow > 0.0){
        float glowStrength = clamp(u_glow, 0.0, 1.0);
        vec2 texel = vec2(1.0 / 960.0, 1.0 / 540.0);
        vec3 glowAccum = vec3(0.0);
        for(int x = -1; x <= 1; x++){
            for(int y = -1; y <= 1; y++){
                vec2 offset = vec2(float(x), float(y)) * texel * mix(1.0, 4.0, glowStrength);
                glowAccum += texture2D(u_tex, sampleUV + offset).rgb;
            }
        }
        glowAccum /= 9.0;
        drawcol.rgb = mix(drawcol.rgb, glowAccum, glowStrength * 0.6);
    }

    if(u_scanline > 0.0){
        float scanFreq = mix(140.0, 600.0, clamp(u_scanline, 0.0, 1.0));
        float scan = sin((vTexCoord.y + u_time * 0.35) * scanFreq) * 0.5 + 0.5;
        float scanMix = mix(1.0, 0.6, scan * clamp(u_scanline, 0.0, 1.0));
        drawcol.rgb *= scanMix;
    }

    if(u_invert > 0.5){
        drawcol.rgb = vec3(1.0) - drawcol.rgb;
    }

    vec4 uicol = texture2D(u_uitex, vTexCoord + vec2(random(uv) * .0004 - .00002));
    vec4 col = drawcol * (1.0 - uicol.a) + uicol * uicol.a;

    col.rgb = mix(col.rgb, vec3(0.0), clamp(u_blackout, 0.0, 1.0));

    gl_FragColor = col;
}