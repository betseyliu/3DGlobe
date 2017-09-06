
/* ribbon_vs */

uniform float u_pi;
uniform vec3 u_color;
varying vec3 v_color;
varying vec2 v_uv;
varying vec3 v_pos;
varying vec3 v_camera_pos;

void main() {

    v_color = u_color;
    v_uv = uv;
    v_pos = position;
    v_camera_pos = cameraPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

/* ribbon_fs */

# define RADIUS 180.0

uniform float u_pi;
uniform sampler2D u_texture;

varying vec3 v_color;
varying vec2 v_uv;
varying vec3 v_pos;
varying vec3 v_camera_pos;

void main() {


    float intensity = dot(normalize(v_camera_pos - v_pos), normalize(v_pos));
    if (intensity < 0.0) {

        float angle = acos(intensity) - u_pi / 2.0;
        float pos_len = pow(RADIUS / cos(angle), 2.0);
        if (pos_len > pow(v_pos.x, 2.0) + pow(v_pos.y, 2.0) + pow(v_pos.z, 2.0)) {

            discard;
        }
    }

	gl_FragColor = texture2D(u_texture, v_uv) * vec4(v_color, 1.0);
 }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////