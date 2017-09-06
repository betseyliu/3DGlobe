/* map_vs */
attribute float a_polygon_id;
uniform float u_focused_polygon_id;
uniform float u_selected_polygon_id;
uniform vec3 u_sample_color;
uniform vec3 u_focused_color;
uniform vec3 u_selected_color;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_ec_position;

void main() {
   
	vec3 pos = position;

   	if (a_polygon_id == u_selected_polygon_id){

   		pos.z -= 20.0;
		v_color = u_selected_color;
   	} else if (a_polygon_id == u_focused_polygon_id){

   		v_color = u_focused_color;
   	} else {

   		v_color = u_sample_color;
   	}

    v_normal = normalize(normalMatrix * normal);
    v_ec_position = vec3(modelViewMatrix * vec4( pos, 1.0 ));

    gl_Position = projectionMatrix * vec4(v_ec_position, 1.0);
}

/* map_fs */
uniform float u_light_intensity;
uniform vec3 u_light_color;
uniform vec3 u_light_position;
uniform vec3 u_ambient_color;
uniform vec3 u_specular_color;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_ec_position;

void main() {

	// 视图坐标系--position
	vec3 neg_ec_position = normalize( -v_ec_position );
	// 归一化法线
	vec3 normal = normalize(v_normal);
	// 光照方向
	vec3 light_direction = normalize(u_light_position - v_ec_position);
	// 反射光方向
	vec3 reflect_light_direction = reflect(-light_direction, normal);
	// 光照方向与法线的夹角--漫反射强度因子
	float n_dot_l = max(dot(light_direction, normal), 0.0);
	// 环境颜色
	vec3 ambient = u_ambient_color * v_color;
	// 漫反射颜色
	vec3 diffuse = u_light_color * v_color * n_dot_l * u_light_intensity;
	// 镜面反射颜色
	vec3 specular = vec3(0.0, 0.0, 0.0);
	// 反射光方向与负视图坐标的夹角--镜面反射强度因子
	float reflect_light_direction_dot_neg_ec_position = 0.0;

	if (n_dot_l > 0.0){

		reflect_light_direction_dot_neg_ec_position = pow(
			max(dot( reflect_light_direction, neg_ec_position ), 0.0),
			16.0
		);
	}

	specular = u_specular_color * v_color * reflect_light_direction_dot_neg_ec_position * u_light_intensity;

	// 深度计算
	// float depth = pow(smoothstep( 10000.0, 1000.0, gl_FragCoord.z / gl_FragCoord.w ), 5.0);
	float depth = gl_FragCoord.z / gl_FragCoord.w;

	// 颜色叠加
    gl_FragColor = vec4(v_color, depth);// vec4(diffuse + ambient + specular, depth);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
