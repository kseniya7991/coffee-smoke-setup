vec2 logarithmicSpiral(vec2 uv, float a, float b, float thetaMax) {
    float theta = length(uv) * thetaMax; // Угол в радианах, основанный на расстоянии от центра
    float radius = a * exp(b * theta); // Радиус спирали на данном угле
    return vec2(radius * cos(theta), radius * sin(theta)); // Преобразование в декартовы координаты
}