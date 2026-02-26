
uniform sampler2D uTexturePosition;
uniform sampler2D uTextureVelocity;
uniform float uTime;

attribute vec2 reference;

varying vec2 vUv;
varying vec3 vColor;
varying float vDepth;

// Rotation matrix from axis and angle
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main() {
    vUv = uv;
    
    // Read simulation data
    // gl_InstanceID gives us the index, but we need UV coordinates for the simulation texture
    // We assume the geometry has an attribute 'reference' that stores the UV for picking data
    // Since R3F/Three doesn't auto-add this, we will calculate it or expect 'aReference' attribute.
    // For GPGPU particles, typically we pass a vec2 'reference' attribute.
    
    // Let's assume we pass 'reference' attribute
    vec4 posData = texture2D(uTexturePosition, reference);
    vec4 velData = texture2D(uTextureVelocity, reference);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    
    // Orientation logic (natural airflow)
    // Avoid full tumbling/flipping; instead use a stable tilt + gentle sway.
    float id = posData.w;
    float speed = clamp(length(vel), 0.0, 1.0);

    // Small yaw bias from sideways wind (x) + subtle periodic sway
    float flowYaw = clamp(vel.x, -0.6, 0.6) * 0.18;
    float sway = sin(uTime * 0.75 + id * 6.283) * (0.10 + 0.08 * speed);

    // Stable forward tilt with tiny breathing motion
    float tilt = 0.22 + sin(uTime * 0.35 + id * 4.1) * 0.06;

    mat4 rotYaw = rotationMatrix(vec3(0.0, 0.0, 1.0), flowYaw + sway);
    mat4 rotTilt = rotationMatrix(vec3(1.0, 0.0, 0.0), tilt);
    mat4 rot = rotYaw * rotTilt;
    
    // Apply rotation to the simulated vertex position (local space)
    // Per-leaf scale variation (seeded by pos.w)
    float scale = 0.7 + posData.w * 0.7;
    vec3 scaled = position * scale;

    // Subtle leaf curvature for realism
    float bend = sin((uv.y + uTime * 0.2) * 3.1415) * 0.05;
    scaled.z += bend * (0.5 - abs(uv.x - 0.5));

    vec4 localPos = rot * vec4(scaled, 1.0);
    
    // Move to world simulation position
    vec4 worldPosition = modelMatrix * vec4(pos + localPos.xyz, 1.0);
    
    // Pass depth for simple fog/fading
    vDepth = -worldPosition.z;
    
    // Variant color (greenshift) based on position
    float variant = sin(pos.x * 0.4 + pos.y * 0.25 + posData.w * 6.283);
    vColor = mix(vec3(0.12, 0.55, 0.22), vec3(0.32, 0.78, 0.28), variant * 0.5 + 0.5);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
