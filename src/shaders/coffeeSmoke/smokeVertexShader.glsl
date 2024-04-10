varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uTime;

#include ../includes/rotate2D.glsl;
#include ../includes/logarithmicSpiral.glsl;

void main() {
    vec3 newPosition = position;

    //Twist
    float twistPerlin = texture(uTexture, vec2(0.5, uv.y * 0.3 - uTime * 0.01)).r;
    float angle = twistPerlin * 7.0;
    newPosition.xz = rotate2D(newPosition.xz, angle);

    //Wind
    vec2 windOffset = vec2((texture(uTexture, vec2(0.25, uTime * 0.015)).r - 0.5) * 0.5, (texture(uTexture, vec2(0.46, uTime * 0.02)).r - 0.5) * 0.5);
    windOffset *= pow(uv.y, 2.0) * 2.0;
    newPosition.xz += windOffset; 

    // Параметры спирали
    // float a = 0.1; // Коэффициент масштаба
    // float b = 0.2; // Коэффициент скручивания
    // float thetaMax = uTime; // Максимальный угол

    // Преобразование координат в логарифмическую спираль
    // vec2 spiralUV = logarithmicSpiral(uv, a, b, thetaMax);
    // newPosition.xz += spiralUV;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    //Varyings
    vUv = uv;
}