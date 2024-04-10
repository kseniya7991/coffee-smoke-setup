uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
    vec2 newUv = vUv;
    newUv.x *= 0.4;
    newUv.y *= 0.3;
    newUv.y += uTime * 0.08;

    float smoke = texture(uTexture, newUv).r;

    //Remap
    smoke = smoothstep(0.4, 1.0, smoke);

    //Edges
    smoke *= smoothstep(0.0, 0.1, vUv.x);
    smoke *= smoothstep(1.0, 0.9, vUv.x);
    smoke *= smoothstep(1.0, 0.4, vUv.y);
    smoke *= smoothstep(0.0, 0.1, vUv.y);

    gl_FragColor = vec4(0.6, 0.3, 0.2, smoke);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(vUv, 1.0, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}