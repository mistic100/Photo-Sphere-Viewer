varying vec3 vPos;
uniform sampler2D map;
uniform float opacity;

const float PI = 3.1415926535897932384626433832795;
const float C = 0.946; // Calibration factor for dual-fisheye disc mapping

void main() {
    vec3 dir = normalize(vPos);
    float r = sqrt(dir.x * dir.x + dir.y * dir.y);

    vec2 uv;
    if (dir.z > 0.0) {
        // Front hemisphere -> left half of the texture, centered at (0.25, 0.5)
        float correction = r > 0.0 ? acos(dir.z) / r * (2.0 / PI) : 1.0;
        uv.x = -dir.x * (C / 4.0) * correction + 0.25;
        uv.y =  dir.y * (C / 2.0) * correction + 0.5;
    } else {
        // Back hemisphere -> right half of the texture, centered at (0.75, 0.5)
        float correction = r > 0.0 ? acos(-dir.z) / r * (2.0 / PI) : 1.0;
        uv.x =  dir.x * (C / 4.0) * correction + 0.75;
        uv.y =  dir.y * (C / 2.0) * correction + 0.5;
    }

    gl_FragColor = texture2D(map, uv);
    gl_FragColor.a *= opacity;
}
