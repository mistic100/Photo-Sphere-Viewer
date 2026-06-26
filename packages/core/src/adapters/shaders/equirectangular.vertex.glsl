// Ray-cast inputs in the panorama's local frame, so sphereCorrection and pose
// (both folded into modelMatrix) apply to the sampled direction without
// per-fragment work.
varying vec3 vLocalPos;
varying vec3 vLocalCam;

void main() {
    vLocalPos = position;

    // mat3(modelMatrix) is a pure rotation, so its inverse is its transpose:
    // `cameraPosition * M == transpose(M) * cameraPosition`.
    vLocalCam = cameraPosition * mat3(modelMatrix);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
