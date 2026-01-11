// Alpine Skiing Game - Physics-Driven Realism

class SkiPhysics {
    constructor() {
        // Physics constants
        this.gravity = 9.81;
        this.air_density = 1.2;
        this.snow_density = 300; // kg/m³
        
        // Ski properties
        this.ski_length = 1.7; // meters
        this.ski_width = 0.08; // meters
        this.ski_mass = 2.0; // kg per ski
        
        // Player state - will be set after terrain is generated
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        
        // Two independent skis
        this.left_ski = {
            edge_angle: 0, // radians, 0 = flat, positive = right edge down
            weight_distribution: 0.5,
            contact_point: new THREE.Vector3(),
            grip: 1.0,
            on_ground: false
        };
        
        this.right_ski = {
            edge_angle: 0,
            weight_distribution: 0.5,
            contact_point: new THREE.Vector3(),
            grip: 1.0,
            on_ground: false
        };
        
        // Control inputs
        this.weight_transfer = 0; // -1 (left) to 1 (right)
        this.stance_width = 0.4; // meters
        this.target_edge_angle = 0;
        this.turn_input = 0; // -1 (left) to 1 (right) for carving
        
        // Balance and stability
        this.balance = 0; // -1 (falling left) to 1 (falling right)
        this.angular_velocity = new THREE.Vector3(0, 0, 0);
        this.game_start_time = null; // Track when game started for grace period
        this.started_skiing = false; // Flag to track if player has started skiing
        
        // Terrain interaction
        this.terrain_normal = new THREE.Vector3(0, 1, 0);
        this.terrain_type = 'groomed'; // groomed, ice, powder, mogul
        this.slope_pitch = 0;
    }
    
    update(delta_time, terrain_data, controls, on_lift, lift_position, lift_bottom, lift_top) {
        // If on lift, position is controlled by lift
        if (on_lift && lift_bottom && lift_top) {
            // Interpolate position along lift path
            const lift_pos = lift_bottom.clone().lerp(lift_top, lift_position);
            this.position.copy(lift_pos);
            this.velocity.set(0, 0, 0);
            return { crashed: false };
        }
        
        // If not started skiing yet, just keep skier in place (wait for space key)
        if (!this.started_skiing) {
            // Still enforce ground collision
            const current_ground_height = terrain_data.get_height(this.position.x, this.position.z);
            if (current_ground_height > 0 && !isNaN(current_ground_height)) {
                this.position.y = current_ground_height + 0.3;
            }
            this.velocity.set(0, 0, 0);
            return { crashed: false };
        }
        
        // Track game start time for grace period
        if (this.game_start_time === null) {
            this.game_start_time = performance.now();
        }
        
        // Update control inputs
        this.weight_transfer = controls.weight_transfer;
        this.turn_input = controls.turn_input; // A/D for turning
        this.stance_width = Math.max(0.2, Math.min(0.6, this.stance_width + controls.stance_change * delta_time));
        this.target_edge_angle += controls.edge_change * delta_time * 2;
        this.target_edge_angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.target_edge_angle));
        
        // Apply turn input to rotation (carving left/right)
        // Turning creates S-shaped motion and slows down the skier
        if (Math.abs(this.turn_input) > 0.1) {
            // Turn speed based on current speed - faster = harder to turn
            const current_speed = this.velocity.length();
            const turn_speed = this.turn_input * (1.0 + current_speed * 0.1) * delta_time;
            this.rotation.y += turn_speed;
        }
        // Note: We don't force rotation back to 0 - skier can turn and stay turned
        
        // Get terrain info at current position
        const terrain_info = this.get_terrain_info(this.position, terrain_data);
        this.terrain_normal = terrain_info.normal;
        this.terrain_type = terrain_info.type;
        this.slope_pitch = terrain_info.pitch;
        
        // Calculate weight distribution between skis
        const total_weight = this.ski_mass * 2 + 70; // skis + player
        this.left_ski.weight_distribution = Math.max(0.1, Math.min(0.9, 0.5 - this.weight_transfer * 0.4));
        this.right_ski.weight_distribution = Math.max(0.1, Math.min(0.9, 0.5 + this.weight_transfer * 0.4));
        
        // Update edge angles based on balance and input
        const balance_factor = this.balance * 0.3;
        this.left_ski.edge_angle = this.target_edge_angle - balance_factor;
        this.right_ski.edge_angle = this.target_edge_angle - balance_factor;
        
        // Calculate ski contact points
        const forward = new THREE.Vector3(
            Math.sin(this.rotation.y),
            0,
            Math.cos(this.rotation.y)
        );
        const right = new THREE.Vector3(
            Math.cos(this.rotation.y),
            0,
            -Math.sin(this.rotation.y)
        );
        
        const left_offset = right.clone().multiplyScalar(-this.stance_width / 2);
        const right_offset = right.clone().multiplyScalar(this.stance_width / 2);
        
        this.left_ski.contact_point.copy(this.position).add(left_offset);
        this.right_ski.contact_point.copy(this.position).add(right_offset);
        
        // Check if skis are on ground (use main position height check)
        const left_height = terrain_info.get_height(this.left_ski.contact_point.x, this.left_ski.contact_point.z);
        const right_height = terrain_info.get_height(this.right_ski.contact_point.x, this.right_ski.contact_point.z);
        const main_height = terrain_info.height;
        
        // Skis are on ground if we're close to terrain surface (within 0.8 units)
        this.left_ski.on_ground = this.position.y <= main_height + 0.8;
        this.right_ski.on_ground = this.position.y <= main_height + 0.8;
        
        // Calculate forces on each ski
        const left_forces = this.calculate_ski_forces(this.left_ski, terrain_info, left_height);
        const right_forces = this.calculate_ski_forces(this.right_ski, terrain_info, right_height);
        
        // Combine forces
        const total_force = new THREE.Vector3();
        total_force.add(left_forces.force);
        total_force.add(right_forces.force);
        
        const total_torque = new THREE.Vector3();
        total_torque.add(left_forces.torque);
        total_torque.add(right_forces.torque);
        
        // Apply gravity (vertical component, slope component handled in terrain constraint)
        const gravity_force = new THREE.Vector3(0, -this.gravity * (this.ski_mass * 2 + 70), 0);
        total_force.add(gravity_force);
        
        // SIMPLIFIED PHYSICS: Always apply forward force when skiing
        // This ensures the skier never stops
        
        // Get the direction the skis are pointing (forward direction from rotation)
        const forward_dir = new THREE.Vector3(
            Math.sin(this.rotation.y),
            0,
            Math.cos(this.rotation.y)
        );
        
        // Calculate how much the skier is turning
        const turn_angle = Math.abs(this.rotation.y);
        const is_turning = turn_angle > 0.1;
        
        // ALWAYS apply forward force when skiing - regardless of ground check
        if (this.started_skiing) {
            // Forward force - constant and strong
            let forward_force = 15.0;
            
            // Turning slows you down
            if (is_turning) {
                const turn_factor = 1.0 - (Math.min(turn_angle, Math.PI / 2) / (Math.PI / 2)) * 0.4;
                forward_force *= turn_factor;
            }
            
            // Apply forward force in ski direction
            this.velocity.add(forward_dir.clone().multiplyScalar(delta_time * forward_force));
            
            // Speed limits (100 km/h = 27.8 m/s)
            const current_speed = this.velocity.length();
            const max_speed = is_turning ? 22.0 : 27.8;
            if (current_speed > max_speed && current_speed > 0.01) {
                this.velocity.multiplyScalar(max_speed / current_speed);
            }
            
            // CRITICAL: Enforce minimum forward speed - ALWAYS
            const min_speed = is_turning ? 6.0 : 10.0;
            const forward_speed = this.velocity.clone().dot(forward_dir);
            if (forward_speed < min_speed) {
                // Force minimum speed
                const lateral = this.velocity.clone().sub(forward_dir.clone().multiplyScalar(forward_speed));
                this.velocity.copy(lateral).add(forward_dir.clone().multiplyScalar(min_speed));
            }
            
            // Prevent downward Y velocity
            if (this.velocity.y < 0) {
            this.velocity.y = 0;
            }
        }
        
        // NO velocity damping when skiing - let the skier accelerate naturally
        // Only apply minimal damping at extremely high speeds to prevent infinite acceleration
        const current_speed = this.velocity.length();
        if (current_speed > 30.0) {
            this.velocity.multiplyScalar(0.9995); // Very minimal damping only at very high speeds
        }
        
        // Apply angular acceleration (much reduced to prevent unwanted spinning)
        const angular_accel = total_torque.clone().multiplyScalar(delta_time * 0.02); // Reduced from 0.1 to 0.02
        this.angular_velocity.add(angular_accel);
        this.angular_velocity.multiplyScalar(0.98); // Increased damping from 0.95 to 0.98
        
        // Limit angular velocity to prevent excessive spinning
        const max_angular_velocity = 2.0;
        const angular_speed = this.angular_velocity.length();
        if (angular_speed > max_angular_velocity && angular_speed > 0.01) {
            this.angular_velocity.multiplyScalar(max_angular_velocity / angular_speed);
        }
        
        // Update rotation (only apply small changes)
        this.rotation.x += this.angular_velocity.x * delta_time * 0.5; // Reduced rotation speed
        this.rotation.z += this.angular_velocity.z * delta_time * 0.5;
        this.rotation.y += this.angular_velocity.y * delta_time * 0.5;
        
        // Stabilize pitch and roll (keep skier upright)
        this.rotation.x *= 0.95; // Dampen pitch
        this.rotation.z *= 0.95; // Dampen roll
        
        // Get terrain height at CURRENT position first
        let current_ground_height = terrain_info.get_height(this.position.x, this.position.z);
        if (current_ground_height <= 0 || isNaN(current_ground_height)) {
            current_ground_height = 10; // Minimum terrain height
        }
        
        // IMMEDIATE CHECK: Ensure current position is ALWAYS on snow surface
        // Offset accounts for skis being part of the model (skis are at y=0.15 relative to skier)
        const current_min_height = current_ground_height + 0.2; // Offset to keep skis visible above ground
        if (this.position.y < current_min_height) {
            this.position.y = current_min_height;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        // Also ensure skier doesn't fly above ground
        if (this.position.y > current_min_height + 0.5) {
            this.position.y = current_min_height + 0.1;
        }
        
        // Update position with velocity
        const new_position = this.position.clone().add(this.velocity.clone().multiplyScalar(delta_time));
        
        // Check terrain height at new position
        let ground_height = terrain_info.get_height(new_position.x, new_position.z);
        
        // If terrain height is invalid (outside bounds or too low), use safe minimum
        if (ground_height <= 0 || isNaN(ground_height)) {
            ground_height = Math.max(current_ground_height, 10); // Minimum terrain height
        }
        
        // Skier rides on snow surface with offset to keep skis visible (0.2 units)
        const min_height = ground_height + 0.2;
        
        // Constrain position to be above ground
        if (new_position.y <= min_height) {
            new_position.y = min_height;
            
            // Zero out downward Y velocity only (don't modify X/Z)
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        
        // Apply the constrained position
        this.position.copy(new_position);
        
        // CRITICAL: Final safety check - ensure skier is on snow surface
        let final_ground_height = terrain_info.get_height(this.position.x, this.position.z);
        if (final_ground_height <= 0 || isNaN(final_ground_height)) {
            final_ground_height = Math.max(current_ground_height, 10);
        }
        const final_min_height = final_ground_height + 0.2; // Offset to keep skis visible above ground
        
        // FORCE position above ground
        if (this.position.y < final_min_height) {
            this.position.y = final_min_height;
            
            // Zero out downward Y velocity only
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        
        // Keep skier on ground
        const absolute_min_height = Math.max(final_ground_height + 0.2, 10);
        if (this.position.y > absolute_min_height + 0.2) {
            this.position.y = absolute_min_height;
        }
        if (this.position.y < absolute_min_height) {
            this.position.y = absolute_min_height;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        
        // Update balance
        const balance_torque = (left_forces.grip - right_forces.grip) * 0.5;
        this.balance += balance_torque * delta_time;
        this.balance *= 0.92;
        
        // FINAL CHECK: Ensure forward velocity is ALWAYS maintained
        if (this.started_skiing) {
            const forward_dir = new THREE.Vector3(
                Math.sin(this.rotation.y),
                0,
                Math.cos(this.rotation.y)
            );
            
            const forward_speed = this.velocity.clone().dot(forward_dir);
            const is_turning = Math.abs(this.rotation.y) > 0.1;
            const min_speed = is_turning ? 6.0 : 10.0;
            
            // Force minimum forward velocity
            if (forward_speed < min_speed) {
                const lateral = this.velocity.clone().sub(forward_dir.clone().multiplyScalar(forward_speed));
                this.velocity.copy(lateral).add(forward_dir.clone().multiplyScalar(min_speed));
            }
            
            // Debug: Log velocity every 60 frames
            if (Math.random() < 0.02) {
                console.log('Velocity:', this.velocity.length().toFixed(2), 'Forward:', forward_speed.toFixed(2), 'Position Z:', this.position.z.toFixed(1));
            }
        }
        
        // SAFETY: Check for NaN in velocity and reset if found
        if (isNaN(this.velocity.x) || isNaN(this.velocity.y) || isNaN(this.velocity.z)) {
            console.error('NaN detected in velocity! Resetting...');
            const forward_dir = new THREE.Vector3(
                Math.sin(this.rotation.y),
                0,
                Math.cos(this.rotation.y)
            );
            this.velocity.copy(forward_dir.multiplyScalar(10.0));
        }
        
        // SAFETY: Check for NaN in position and reset if found
        if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
            console.error('NaN detected in position! Resetting...');
            this.position.set(0, 100, this.position.z || 0);
        }
        
        // Crashes disabled for now - just keep skiing
        return { crashed: false };
    }
    
    calculate_ski_forces(ski, terrain_info, ground_height) {
        if (!ski.on_ground) {
            return { force: new THREE.Vector3(0, 0, 0), torque: new THREE.Vector3(0, 0, 0), grip: 0 };
        }
        
        const speed = this.velocity.length();
        const forward = new THREE.Vector3(
            Math.sin(this.rotation.y),
            0,
            Math.cos(this.rotation.y)
        );
        // Avoid NaN from normalizing zero vector
        const velocity_dir = speed > 0.01 ? this.velocity.clone().normalize() : forward.clone();
        
        // Terrain-dependent friction
        let base_friction = 0.1;
        let grip_coefficient = 0.8;
        
        switch (terrain_info.type) {
            case 'ice':
                base_friction = 0.02;
                grip_coefficient = 0.2;
                break;
            case 'groomed':
                base_friction = 0.08;
                grip_coefficient = 0.9;
                break;
            case 'powder':
                base_friction = 0.15;
                grip_coefficient = 0.7;
                break;
            case 'mogul':
                base_friction = 0.1;
                grip_coefficient = 0.8;
                // Add vertical impulse from mogul (applied in force calculation)
                break;
        }
        
        // Edge engagement affects grip
        const edge_factor = Math.abs(Math.sin(ski.edge_angle));
        const effective_grip = grip_coefficient * edge_factor * (0.5 + ski.weight_distribution);
        ski.grip = effective_grip;
        
        // Friction force (opposes velocity) - MINIMAL to allow forward movement
        let friction_force = new THREE.Vector3(0, 0, 0);
        if (speed > 0.1) {
            // Very minimal friction - just enough for realism, not enough to stop movement
            const friction_magnitude = base_friction * (1 - edge_factor * 0.7) * ski.weight_distribution * (this.ski_mass * 2 + 70) * this.gravity * 0.1; // Very low friction
            friction_force = velocity_dir.clone().multiplyScalar(-friction_magnitude);
            
            // Almost no friction in forward (Z) direction
            friction_force.z *= 0.1; // Minimal friction in forward direction
        }
        
        // Turning force from edge angle
        let turn_force = new THREE.Vector3(0, 0, 0);
        if (speed > 0.1) {
            const turn_force_magnitude = effective_grip * speed * speed * 0.1 * Math.sin(ski.edge_angle);
            const turn_direction = new THREE.Vector3(
                Math.cos(this.rotation.y),
                0,
                -Math.sin(this.rotation.y)
            );
            turn_force = turn_direction.clone().multiplyScalar(turn_force_magnitude * ski.weight_distribution);
        }
        
        // Air resistance (minimal)
        let air_resistance = new THREE.Vector3(0, 0, 0);
        if (speed > 0.1) {
            air_resistance = velocity_dir.clone().multiplyScalar(-speed * speed * 0.005 * this.air_density);
        }
        
        // Mogul vertical impulse
        let vertical_impulse = new THREE.Vector3(0, 0, 0);
        if (terrain_info.type === 'mogul') {
            const mogul_phase = terrain_info.mogul_phase;
            const mogul_derivative = Math.cos(mogul_phase) * 0.3;
            vertical_impulse = new THREE.Vector3(0, mogul_derivative * speed * 0.5, 0);
        }
        
        const total_force = new THREE.Vector3();
        total_force.add(friction_force);
        total_force.add(turn_force);
        total_force.add(air_resistance);
        total_force.add(vertical_impulse);
        
        // Torque from weight distribution and edge angle
        const torque = new THREE.Vector3(
            -ski.edge_angle * ski.weight_distribution * 0.5,
            0,
            (ski.weight_distribution - 0.5) * 2
        );
        
        return { force: total_force, torque: torque, grip: effective_grip };
    }
    
    get_terrain_info(position, terrain_data) {
        // Sample terrain at position
        const x = position.x;
        const z = position.z;
        
        // Get height and normal from terrain
        const height = terrain_data.get_height(x, z);
        const normal = terrain_data.get_normal(x, z);
        const type = terrain_data.get_type(x, z);
        const pitch = Math.acos(normal.y);
        
        return {
            height: height,
            normal: normal,
            type: type,
            pitch: pitch,
            get_height: (x, z) => terrain_data.get_height(x, z),
            mogul_phase: terrain_data.get_mogul_phase(x, z)
        };
    }
}

class TerrainGenerator {
    constructor() {
        this.size = 2000;
        this.resolution = 256; // Reduced for better performance
        this.height_map = null;
        this.type_map = null;
        this.mogul_map = null;
        
        try {
            this.generate();
        } catch (error) {
            console.error('Error generating terrain:', error);
            throw error;
        }
    }
    
    generate() {
        // Create height map using multiple noise layers
        this.height_map = new Float32Array(this.resolution * this.resolution);
        this.type_map = new Uint8Array(this.resolution * this.resolution);
        this.mogul_map = new Float32Array(this.resolution * this.resolution);
        
        for (let z = 0; z < this.resolution; z++) {
            for (let x = 0; x < this.resolution; x++) {
                const world_x = (x / this.resolution - 0.5) * this.size;
                const world_z = (z / this.resolution - 0.5) * this.size;
                
                // Base downhill slope - ALWAYS goes down from top to bottom
                // Higher at top (negative Z), lower at bottom (positive Z)
                // Start at height 120 at top, end at height 0 at bottom
                const normalized_z = (world_z + this.size / 2) / this.size; // 0 to 1, from top to bottom
                
                // Add variation in steepness along the Z axis (downhill direction)
                // This creates steeper and less steep sections, but ALWAYS downhill
                // Use a low-frequency noise along Z to create gradual transitions
                const steepness_noise = this.smooth_noise(0, world_z, 0.01); // Varies from -1 to 1
                // Vary the slope rate: steeper sections have higher rate, flatter sections have lower rate
                // Always ensure it's going downhill (positive rate between 0.15 and 0.45)
                const slope_rate = 0.2 + (steepness_noise * 0.15); // Varies from 0.05 to 0.35
                const min_slope = 0.15; // Minimum slope to ensure always going down
                const max_slope = 0.45; // Maximum slope for steep sections
                const final_slope_rate = Math.max(min_slope, Math.min(max_slope, slope_rate));
                
                // Calculate height - always decreases as Z increases (going downhill)
                const adjusted_height = 120 - normalized_z * this.size * final_slope_rate;
                
                // Create a defined ski path/trail down the center (x = 0)
                // Path is smoother and wider (about 60 units wide)
                const distance_from_center = Math.abs(world_x);
                const path_width = 30; // Half-width of the path
                const path_smoothness = Math.max(0, 1 - (distance_from_center / path_width));
                
                // Path is smoother (less variation) than the sides
                const path_variation = this.smooth_noise(world_x, world_z, 0.015) * 8 * (1 - path_smoothness * 0.7);
                const side_variation = this.smooth_noise(world_x, world_z, 0.015) * 8;
                const lateral_variation = path_smoothness > 0.1 ? path_variation : side_variation;
                
                // Add fine detail noise for natural surface texture (less on path)
                const fine_noise = this.smooth_noise(world_x, world_z, 0.05) * 2 * (1 - path_smoothness * 0.5);
                
                // No moguls - just smooth slope
                this.mogul_map[z * this.resolution + x] = 0;
                
                // Final height - always ensures downhill progression
                const height = adjusted_height + lateral_variation + fine_noise;
                this.height_map[z * this.resolution + x] = height;
                
                // Determine terrain type - mostly groomed, simple terrain
                const ice_prob = Math.random() < 0.02 ? 1 : 0; // Less ice patches
                const powder_prob = Math.random() < 0.05 && height > 80 ? 1 : 0; // Less powder
                
                let type = 0; // 0 = groomed (most common)
                if (ice_prob) type = 1; // ice
                else if (powder_prob) type = 2; // powder
                // No moguls - type 3 removed
                
                this.type_map[z * this.resolution + x] = type;
            }
        }
    }
    
    noise(x, z) {
        // Improved noise function
        const n1 = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
        const n2 = Math.sin(x * 23.1407 + z * 2.6651) * 11035.1234;
        const combined = (n1 + n2) % 20000;
        return (combined / 10000) - 1; // Return -1 to 1
    }
    
    smooth_noise(x, z, scale) {
        const nx = x * scale;
        const nz = z * scale;
        const fx = nx - Math.floor(nx);
        const fz = nz - Math.floor(nz);
        
        const floor_nx = Math.floor(nx);
        const floor_nz = Math.floor(nz);
        
        const a = this.noise(floor_nx, floor_nz);
        const b = this.noise(floor_nx + 1, floor_nz);
        const c = this.noise(floor_nx, floor_nz + 1);
        const d = this.noise(floor_nx + 1, floor_nz + 1);
        
        // Smooth interpolation (smoothstep)
        const u = fx * fx * (3 - 2 * fx);
        const v = fz * fz * (3 - 2 * fz);
        
        return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    }
    
    get_height(x, z) {
        const local_x = (x / this.size + 0.5) * this.resolution;
        const local_z = (z / this.size + 0.5) * this.resolution;
        
        if (local_x < 0 || local_x >= this.resolution - 1 || local_z < 0 || local_z >= this.resolution - 1) {
            // Return a reasonable height when outside bounds instead of 0
            // Calculate approximate height based on slope formula
            const normalized_z = (z + this.size / 2) / this.size;
            return Math.max(10, 120 - normalized_z * this.size * 0.3);
        }
        
        const x0 = Math.floor(local_x);
        const z0 = Math.floor(local_z);
        const x1 = x0 + 1;
        const z1 = z0 + 1;
        
        const fx = local_x - x0;
        const fz = local_z - z0;
        
        const h00 = this.height_map[z0 * this.resolution + x0];
        const h10 = this.height_map[z0 * this.resolution + x1];
        const h01 = this.height_map[z1 * this.resolution + x0];
        const h11 = this.height_map[z1 * this.resolution + x1];
        
        const h0 = h00 * (1 - fx) + h10 * fx;
        const h1 = h01 * (1 - fx) + h11 * fx;
        
        return h0 * (1 - fz) + h1 * fz;
    }
    
    get_normal(x, z) {
        const eps = 1.0;
        const h_l = this.get_height(x - eps, z);
        const h_r = this.get_height(x + eps, z);
        const h_d = this.get_height(x, z - eps);
        const h_u = this.get_height(x, z + eps);
        
        const normal = new THREE.Vector3(
            (h_l - h_r) / (2 * eps),
            1,
            (h_d - h_u) / (2 * eps)
        ).normalize();
        
        return normal;
    }
    
    get_type(x, z) {
        const local_x = (x / this.size + 0.5) * this.resolution;
        const local_z = (z / this.size + 0.5) * this.resolution;
        
        if (local_x < 0 || local_x >= this.resolution - 1 || local_z < 0 || local_z >= this.resolution - 1) {
            return 'groomed';
        }
        
        const x0 = Math.floor(local_x);
        const z0 = Math.floor(local_z);
        const type = this.type_map[z0 * this.resolution + x0];
        
        const types = ['groomed', 'ice', 'powder', 'mogul'];
        return types[type] || 'groomed';
    }
    
    get_mogul_phase(x, z) {
        const local_x = (x / this.size + 0.5) * this.resolution;
        const local_z = (z / this.size + 0.5) * this.resolution;
        
        if (local_x < 0 || local_x >= this.resolution - 1 || local_z < 0 || local_z >= this.resolution - 1) {
            return 0;
        }
        
        const x0 = Math.floor(local_x);
        const z0 = Math.floor(local_z);
        return this.mogul_map[z0 * this.resolution + x0];
    }
}

class AlpineGame {
    constructor() {
        // Check if canvas exists
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js library not loaded');
        }
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Generate terrain first
        this.terrain = new TerrainGenerator();
        
        // Initialize lift positions FIRST (before using them)
        this.lift_bottom_pos = new THREE.Vector3(0, 0, 0);
        this.lift_top_pos = new THREE.Vector3(0, 0, -800);
        
        // Create physics and position skier on terrain
        this.physics = new SkiPhysics();
        
        // Initialize skier position at top of hill (ready to ski down)
        // Terrain size is 2000, so world coordinates go from -1000 to +1000
        // Negative Z is higher (top of mountain), positive Z is lower (bottom)
        const start_x = 0;
        const start_z = -950; // Start at very top of hill (most negative Z = highest point)
        const start_height = this.terrain.get_height(start_x, start_z);
        
        // Use terrain height if valid, otherwise calculate from base formula
        // New formula: height = 120 - (world_z + size/2) * slope_rate
        // At z = -950: approximate height around 120 - 50 * 0.3 = 105
        const expected_height = (start_height > 0 && !isNaN(start_height)) ? start_height : 120;
        this.physics.position.set(start_x, expected_height + 0.2, start_z);
        
        // Reset all physics state for fresh start
        this.physics.velocity.set(0, 0, 0);
        this.physics.angular_velocity.set(0, 0, 0);
        this.physics.rotation.set(0, 0, 0);
        this.physics.started_skiing = false;
        
        console.log('Skier starting at top:', { x: start_x, z: start_z, height: expected_height, position: this.physics.position });
        
        // Set lift positions (for visual only, not used for interaction)
        if (this.lift_bottom_pos && this.lift_top_pos) {
            const bottom_height = this.terrain.get_height(0, 0);
            this.lift_bottom_pos.set(0, (bottom_height > 0 ? bottom_height : 10) + 3, 0);
            const top_x = 0;
            const top_z = -800; // Top of mountain
            const top_height = this.terrain.get_height(top_x, top_z);
            this.lift_top_pos.set(top_x, (top_height > 0 ? top_height : 100) + 3, top_z);
        }
        
        // Face straight down the slope (positive Z is down the mountain)
        this.physics.rotation.y = 0; // Face straight down the slope (positive Z direction, no lateral rotation)
        this.physics.rotation.x = 0; // No pitch initially
        this.physics.rotation.z = 0; // No roll initially
        this.physics.angular_velocity.set(0, 0, 0); // No initial spin
        this.physics.velocity.set(0, 0, 0); // Start from rest
        
        // Note: The skier moves forward automatically when Space is pressed
        // Forward movement is driven by gravity pulling straight down the slope (positive Z direction)
        // Lateral movement (X) is constrained to prevent unwanted drifting
        
        this.controls = {
            weight_transfer: 0,
            turn_input: 0, // A/D for turning
            stance_change: 0,
            edge_change: 0
        };
        
        // Ski lift state
        this.on_lift = false;
        this.lift_position = 0; // 0 = bottom, 1 = top
        this.lift_speed = 0.3; // Speed of lift per second
        // Note: lift_bottom_pos and lift_top_pos are initialized earlier in constructor
        
        this.setup_scene();
        this.create_ski_lift();
        this.setup_controls();
        this.setup_audio();
        
        // Initialize camera position immediately so we can see the skier
        this.update_camera();
        
        this.last_time = performance.now();
        this.crashed = false;
        
        this.animate();
        
        window.addEventListener('resize', () => this.on_window_resize());
    }
    
    setup_scene() {
        // Lighting - low angle winter sun
        const ambient_light = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient_light);
        
        const sun_light = new THREE.DirectionalLight(0xfff5e6, 0.8);
        sun_light.position.set(100, 200, 100);
        sun_light.castShadow = true;
        sun_light.shadow.mapSize.width = 2048;
        sun_light.shadow.mapSize.height = 2048;
        sun_light.shadow.camera.near = 0.5;
        sun_light.shadow.camera.far = 1000;
        sun_light.shadow.camera.left = -500;
        sun_light.shadow.camera.right = 500;
        sun_light.shadow.camera.top = 500;
        sun_light.shadow.camera.bottom = -500;
        this.scene.add(sun_light);
        
        // Create terrain mesh
        this.create_terrain_mesh();
        
        // Create skier model (simple representation)
        this.create_skier_model();
        
        // Add trees at mid-elevation
        this.add_vegetation();
        
        // Add ski infrastructure
        this.add_ski_infrastructure();
        
        // Sky and fog (will be enhanced in setup_atmospheric_effects)
        this.scene.background = new THREE.Color(0x87ceeb);
        
        // Distant mountains with atmospheric perspective
        this.add_distant_mountains();
        
        // Add post-processing for atmospheric perspective (distance fog)
        this.setup_atmospheric_effects();
    }
    
    create_terrain_mesh() {
        try {
            const geometry = new THREE.PlaneGeometry(this.terrain.size, this.terrain.size, this.terrain.resolution - 1, this.terrain.resolution - 1);
            geometry.rotateX(-Math.PI / 2);
        
        // Set vertex positions from height map
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            positions[i + 1] = this.terrain.get_height(x, z);
        }
        
        geometry.computeVertexNormals();
        
        // Create material with varied snow shading
        const material = new THREE.MeshStandardMaterial({
            color: 0xf0f8ff,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.terrain_mesh = new THREE.Mesh(geometry, material);
        this.terrain_mesh.receiveShadow = true;
        this.scene.add(this.terrain_mesh);
        
        // Add terrain type visualization (subtle color variation)
        // Also highlight the ski path
        const colors = new Float32Array(positions.length);
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            const type = this.terrain.get_type(x, z);
            
            // Check if this point is on the ski path (within 30 units of center)
            const distance_from_center = Math.abs(x);
            const is_on_path = distance_from_center < 30;
            
            let color = new THREE.Color(0xf0f8ff); // default snow
            if (is_on_path) {
                // Path is slightly more compacted/groomed (slightly brighter, more yellow)
                color = new THREE.Color(0xf5f9ff);
            } else if (type === 'ice') {
                color = new THREE.Color(0xe0f0ff); // bluer, more reflective
            } else if (type === 'powder') {
                color = new THREE.Color(0xffffff); // brighter
            } else if (type === 'mogul') {
                color = new THREE.Color(0xe8f0f8); // slightly darker
            }
            
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        material.vertexColors = true;
        } catch (error) {
            console.error('Error creating terrain mesh:', error);
            throw error;
        }
    }
    
    create_skier_model() {
        const group = new THREE.Group();
        
        // Body (using cylinder instead of capsule for compatibility) - made bigger
        const body_geom = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const body_mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(body_geom, body_mat);
        body.position.y = 0.4;
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        group.add(body);
        
        // Left ski - made bigger and more visible
        const left_ski_geom = new THREE.BoxGeometry(0.12, 0.03, 2.0);
        const ski_mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
        this.left_ski_mesh = new THREE.Mesh(left_ski_geom, ski_mat);
        this.left_ski_mesh.position.set(-0.25, 0.08, 0);
        this.left_ski_mesh.castShadow = true;
        group.add(this.left_ski_mesh);
        
        // Right ski - made bigger and more visible
        this.right_ski_mesh = new THREE.Mesh(left_ski_geom.clone(), ski_mat);
        this.right_ski_mesh.position.set(0.25, 0.08, 0);
        this.right_ski_mesh.castShadow = true;
        group.add(this.right_ski_mesh);
        
        group.castShadow = true;
        this.skier_group = group;
        this.scene.add(group);
    }
    
    add_vegetation() {
        // Add pine trees on either side of the ski path
        // Path is centered at x = 0, about 60 units wide
        const path_width = 30; // Half-width of path
        const tree_spacing = 15; // Spacing between trees
        const tree_offset_from_path = path_width + 10; // Distance from path center
        
        // Place trees along the entire slope
        for (let z = -900; z < 900; z += tree_spacing) {
            // Left side of path (negative x)
            const left_x = -tree_offset_from_path + (Math.random() - 0.5) * 5;
            const left_height = this.terrain.get_height(left_x, z);
            if (left_height > 10 && left_height < 120) {
                const left_tree = this.create_tree();
                left_tree.position.set(left_x, left_height, z);
                left_tree.scale.setScalar(1.5 + Math.random() * 1.5);
                left_tree.rotation.y = Math.random() * Math.PI * 2; // Random rotation
                this.scene.add(left_tree);
            }
            
            // Right side of path (positive x)
            const right_x = tree_offset_from_path + (Math.random() - 0.5) * 5;
            const right_height = this.terrain.get_height(right_x, z);
            if (right_height > 10 && right_height < 120) {
                const right_tree = this.create_tree();
                right_tree.position.set(right_x, right_height, z);
                right_tree.scale.setScalar(1.5 + Math.random() * 1.5);
                right_tree.rotation.y = Math.random() * Math.PI * 2; // Random rotation
                this.scene.add(right_tree);
            }
        }
    }
    
    create_tree() {
        const group = new THREE.Group();
        
        // Tapered trunk with visible gaps
        const trunk_height = 4 + Math.random() * 2;
        const trunk_top_radius = 0.08;
        const trunk_bottom_radius = 0.15 + Math.random() * 0.05;
        const trunk_geom = new THREE.CylinderGeometry(trunk_top_radius, trunk_bottom_radius, trunk_height, 8);
        const trunk_mat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunk_geom, trunk_mat);
        trunk.position.y = trunk_height / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Create whorled branch layers
        const num_layers = 6 + Math.floor(Math.random() * 3);
        const dark_green = new THREE.Color(0x1a3d1a); // Dark blue-green interior
        const light_green = new THREE.Color(0x4a7c4a); // Lighter warmer green edges
        const shadow_green = new THREE.Color(0x2d4a2d); // Cooler desaturated shadows
        
        for (let layer = 0; layer < num_layers; layer++) {
            const layer_height = (layer / num_layers) * trunk_height;
            const layer_progress = layer / (num_layers - 1); // 0 at top, 1 at bottom
            
            // Branches get longer and more downward-angled toward base
            const branch_length = 0.8 + layer_progress * 1.5; // Shorter at top, longer at bottom
            const branch_angle = -0.3 + layer_progress * 0.8; // Upward at top, downward at bottom
            const branch_count = 4 + Math.floor(Math.random() * 3); // 4-6 branches per layer
            
            // Rotate branches around trunk
            for (let i = 0; i < branch_count; i++) {
                const angle = (i / branch_count) * Math.PI * 2 + Math.random() * 0.3;
                
                // Create jagged, irregular branch silhouette
                const branch_group = new THREE.Group();
                
                // Main branch segment
                const branch_segments = 3 + Math.floor(Math.random() * 2);
                for (let seg = 0; seg < branch_segments; seg++) {
                    const seg_length = branch_length / branch_segments;
                    const seg_offset = seg * seg_length;
                    
                    // Irregular, jagged shape (not smooth triangle)
                    const points = 5 + Math.floor(Math.random() * 3);
                    const branch_geom = new THREE.ConeGeometry(
                        0.15 + Math.random() * 0.1, // Irregular width
                        seg_length,
                        points // Jagged edges
                    );
                    
                    // Color variation: darker interior, lighter edges
                    const is_edge = seg === 0 || seg === branch_segments - 1;
                    const branch_color = is_edge ? light_green : dark_green;
                    const branch_mat = new THREE.MeshStandardMaterial({ 
                        color: branch_color,
                        roughness: 0.8
                    });
                    
                    const branch = new THREE.Mesh(branch_geom, branch_mat);
                    branch.position.y = seg_offset;
                    branch.rotation.z = branch_angle + (Math.random() - 0.5) * 0.3; // Irregular angle
                    branch.rotation.x = (Math.random() - 0.5) * 0.2; // Slight tilt
                    branch.castShadow = true;
                    branch_group.add(branch);
                }
                
                // Add needle tufts (clustered foliage)
                const tuft_count = 4 + Math.floor(Math.random() * 3);
                for (let t = 0; t < tuft_count; t++) {
                    const tuft_size = 0.2 + Math.random() * 0.15;
                    const tuft_geom = new THREE.SphereGeometry(tuft_size, 6, 5); // Low poly for jagged look
                    const tuft_mat = new THREE.MeshStandardMaterial({ 
                        color: Math.random() > 0.5 ? light_green : shadow_green,
                        roughness: 0.9
                    });
                    const tuft = new THREE.Mesh(tuft_geom, tuft_mat);
                    tuft.position.set(
                        (Math.random() - 0.5) * branch_length * 0.6,
                        (Math.random() - 0.5) * branch_length * 0.3,
                        (Math.random() - 0.5) * 0.2
                    );
                    tuft.castShadow = true;
                    branch_group.add(tuft);
                }
                
                // Position branch layer around trunk
                branch_group.position.y = layer_height;
                branch_group.rotation.y = angle;
                branch_group.rotation.z = branch_angle;
                group.add(branch_group);
            }
        }
        
        // Top cluster (shorter, upward branches)
        const top_tuft_geom = new THREE.ConeGeometry(0.4, 1.2, 6);
        const top_tuft_mat = new THREE.MeshStandardMaterial({ 
            color: light_green,
            roughness: 0.8
        });
        const top_tuft = new THREE.Mesh(top_tuft_geom, top_tuft_mat);
        top_tuft.position.y = trunk_height + 0.6;
        top_tuft.castShadow = true;
        group.add(top_tuft);
        
        return group;
    }
    
    add_ski_infrastructure() {
        // Add some lift towers (imperfect, slightly misaligned)
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * this.terrain.size * 0.6;
            const z = (Math.random() - 0.5) * this.terrain.size * 0.6;
            const height = this.terrain.get_height(x, z);
            
            const tower = this.create_lift_tower();
            tower.position.set(x, height, z);
            tower.rotation.y = Math.random() * 0.1; // slight misalignment
            this.scene.add(tower);
        }
    }
    
    create_ski_lift() {
        // Create ski lift cable and chairs
        this.lift_group = new THREE.Group();
        
        // Cable (line from bottom to top)
        const cable_geometry = new THREE.BufferGeometry();
        const cable_points = [
            this.lift_bottom_pos.x, this.lift_bottom_pos.y, this.lift_bottom_pos.z,
            this.lift_top_pos.x, this.lift_top_pos.y, this.lift_top_pos.z
        ];
        cable_geometry.setAttribute('position', new THREE.Float32BufferAttribute(cable_points, 3));
        const cable_material = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 3 });
        const cable = new THREE.Line(cable_geometry, cable_material);
        this.lift_group.add(cable);
        
        // Lift chairs (multiple chairs along the cable)
        this.lift_chairs = [];
        for (let i = 0; i < 5; i++) {
            const chair = this.create_lift_chair();
            this.lift_chairs.push(chair);
            this.lift_group.add(chair);
        }
        
        // Bottom station
        const bottom_station = this.create_lift_station();
        bottom_station.position.copy(this.lift_bottom_pos);
        this.lift_group.add(bottom_station);
        
        // Top station
        const top_station = this.create_lift_station();
        top_station.position.copy(this.lift_top_pos);
        this.lift_group.add(top_station);
        
        this.scene.add(this.lift_group);
    }
    
    create_lift_chair() {
        const group = new THREE.Group();
        
        // Chair seat
        const seat_geom = new THREE.BoxGeometry(0.8, 0.1, 0.6);
        const seat_mat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const seat = new THREE.Mesh(seat_geom, seat_mat);
        seat.position.y = 0.3;
        group.add(seat);
        
        // Chair back
        const back_geom = new THREE.BoxGeometry(0.8, 0.6, 0.1);
        const back = new THREE.Mesh(back_geom, seat_mat);
        back.position.set(0, 0.6, -0.25);
        group.add(back);
        
        // Cable attachment
        const cable_geom = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
        const cable_mat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cable_attach = new THREE.Mesh(cable_geom, cable_mat);
        cable_attach.position.y = 0.8;
        group.add(cable_attach);
        
        return group;
    }
    
    create_lift_station() {
        const group = new THREE.Group();
        
        // Station building
        const building_geom = new THREE.BoxGeometry(4, 6, 4);
        const building_mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const building = new THREE.Mesh(building_geom, building_mat);
        building.position.y = 3;
        group.add(building);
        
        // Station roof
        const roof_geom = new THREE.ConeGeometry(3, 2, 4);
        const roof_mat = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const roof = new THREE.Mesh(roof_geom, roof_mat);
        roof.position.y = 7;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        return group;
    }
    
    create_lift_tower() {
        const group = new THREE.Group();
        
        const tower_geom = new THREE.BoxGeometry(0.3, 15, 0.3);
        const tower_mat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const tower = new THREE.Mesh(tower_geom, tower_mat);
        tower.position.y = 7.5;
        group.add(tower);
        
        // Crossbar
        const crossbar_geom = new THREE.BoxGeometry(2, 0.2, 0.2);
        const crossbar = new THREE.Mesh(crossbar_geom, tower_mat);
        crossbar.position.set(0, 12, 0);
        group.add(crossbar);
        
        return group;
    }
    
    add_distant_mountains() {
        // Simple distant mountain silhouettes with atmospheric perspective
        for (let i = 0; i < 8; i++) {
            const size = 200 + Math.random() * 150;
            const height = 300 + Math.random() * 250;
            const distance = 1200 + Math.random() * 800;
            
            // Color becomes bluer and lower contrast with distance
            const distance_factor = Math.min(1, distance / 2000);
            const blue_factor = 0.4 + distance_factor * 0.6;
            const color = new THREE.Color(
                0.3 * (1 - distance_factor),
                0.4 * (1 - distance_factor),
                0.5 + blue_factor * 0.3
            );
            
            const mountain = new THREE.Mesh(
                new THREE.ConeGeometry(size, height, 8),
                new THREE.MeshBasicMaterial({ 
                    color: color,
                    fog: true,
                    transparent: distance_factor > 0.7,
                    opacity: 1 - distance_factor * 0.3
                })
            );
            const angle = (i / 8) * Math.PI * 2;
            mountain.position.set(
                Math.cos(angle) * distance,
                150 + height * 0.3,
                Math.sin(angle) * distance
            );
            this.scene.add(mountain);
        }
    }
    
    setup_atmospheric_effects() {
        // Enhanced fog for atmospheric perspective
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0003);
        
        // Adjust fog density based on altitude (would need shader for full effect)
        // For now, we use distance-based fog
    }
    
    setup_controls() {
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse control for edge angle (relative to center)
        document.addEventListener('mousemove', (e) => {
            const center_x = window.innerWidth / 2;
            const mouse_offset = (e.clientX - center_x) / center_x; // -1 to 1
            this.controls.edge_change = mouse_offset * 0.02; // Scale for sensitivity
        });
        
        setInterval(() => {
            if (this.crashed || !this.physics) return;
            
            // Turn input (A/D for carving left/right)
            if (keys['a'] || keys['arrowleft']) {
                this.controls.turn_input = -1; // Turn left
            } else if (keys['d'] || keys['arrowright']) {
                this.controls.turn_input = 1; // Turn right
            } else {
                this.controls.turn_input = 0;
            }
            
            // Weight transfer (for balance, separate from turning)
            // This can be used for fine control if needed
            this.controls.weight_transfer = this.controls.turn_input * 0.5;
            
            // Stance width (Q/E)
            if (keys['q']) {
                this.controls.stance_change = -0.2;
            } else if (keys['e']) {
                this.controls.stance_change = 0.2;
            } else {
                this.controls.stance_change = 0;
            }
            
            // Edge angle (mouse movement handled above)
            this.controls.edge_change *= 0.9;
            
            // Space key starts skiing downhill or restarts if stopped
            if (keys[' '] || keys['space']) {
                const current_speed = this.physics.velocity.length();
                const is_stopped = current_speed < 2.0; // Consider stopped if speed is very low
                
                if (!this.physics.started_skiing || is_stopped) {
                if (!this.physics.started_skiing) {
                    this.physics.started_skiing = true;
                    }
                    
                    // Give a strong push in the direction skis are pointing
                    try {
                        // Get terrain normal to calculate slope
                        const terrain_info = this.physics.get_terrain_info(this.physics.position, this.terrain);
                        
                        // Get direction skis are pointing
                        const forward_dir = new THREE.Vector3(
                            Math.sin(this.physics.rotation.y),
                            0,
                            Math.cos(this.physics.rotation.y)
                        );
                        
                        // Project onto slope
                        const slope_steepness = Math.sqrt(1 - terrain_info.normal.y * terrain_info.normal.y);
                        const push_dir = forward_dir.clone();
                        push_dir.y = -slope_steepness;
                        push_dir.normalize();
                        
                        // Add strong push in ski direction
                        this.physics.velocity.add(push_dir.multiplyScalar(10));
                        
                        console.log('Started/restarted skiing - skier will now move in ski direction', this.physics.velocity);
                    } catch (error) {
                        console.error('Error starting skiing:', error);
                        // Fallback: push in ski direction
                        const forward_dir = new THREE.Vector3(
                            Math.sin(this.physics.rotation.y),
                            0,
                            Math.cos(this.physics.rotation.y)
                        );
                        this.physics.velocity.add(forward_dir.multiplyScalar(10));
                    }
                }
            }
        }, 16);
    }
    
    update_lift(delta_time) {
        // Lift system is disabled, but keep method for compatibility
        // No lift interaction in current game design
        if (this.on_lift && this.lift_position !== undefined) {
            // Move lift up
            this.lift_position += this.lift_speed * delta_time;
            if (this.lift_position > 1) {
                this.lift_position = 1;
            }
        }
        
        // Update lift chair positions (if they exist)
        if (this.lift_chairs && Array.isArray(this.lift_chairs) && this.lift_bottom_pos && this.lift_top_pos) {
            for (let i = 0; i < this.lift_chairs.length; i++) {
                const chair_pos = (this.lift_position + i * 0.2) % 1;
                const chair_world_pos = this.lift_bottom_pos.clone().lerp(this.lift_top_pos, chair_pos);
                if (this.lift_chairs[i] && this.lift_chairs[i].position) {
                    this.lift_chairs[i].position.copy(chair_world_pos);
                }
            }
        }
    }
    
    setup_audio() {
        // Create audio context for ambient sounds
        this.audio_context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Note: Actual audio implementation would require audio files
        // This is a placeholder for the audio system structure
    }
    
    enforce_ground_collision() {
        // Continuous check to ensure skier is always above terrain
        if (this.crashed || this.on_lift || !this.physics || !this.terrain) return;
        
        const skier_pos = this.physics.position;
        if (!skier_pos) return;
        
        const terrain_height = this.terrain.get_height(skier_pos.x, skier_pos.z);
        
        // If terrain height is invalid, use a safe minimum
        let safe_terrain_height = terrain_height;
        if (safe_terrain_height <= 0 || isNaN(safe_terrain_height)) {
            safe_terrain_height = 10;
        }
        
        // Skier rides on snow surface with offset to keep skis visible
        const min_safe_height = safe_terrain_height + 0.2;
        
        // FORCE skier on snow surface - follows terrain contours
        // If below ground, push up
        if (skier_pos.y < min_safe_height) {
            this.physics.position.y = min_safe_height;
            // Completely zero out ALL downward velocity
            this.physics.velocity.y = Math.max(0, this.physics.velocity.y);
            if (this.physics.velocity.y < 0) {
                this.physics.velocity.y = 0;
            }
        }
        
        // If flying above ground, pull down to ground
        if (skier_pos.y > min_safe_height + 0.2) {
            this.physics.position.y = min_safe_height;
            // Remove upward velocity
            if (this.physics.velocity.y > 0) {
                this.physics.velocity.y = 0;
            }
        }
        
        // Absolute minimum height check - ensure skier is on terrain
        const absolute_min = Math.max(safe_terrain_height + 0.2, 10);
        if (skier_pos.y < absolute_min) {
            this.physics.position.y = absolute_min;
            this.physics.velocity.y = Math.max(0, this.physics.velocity.y);
            // Also remove any velocity going into ground
            if (this.physics.velocity.y < 0) {
                this.physics.velocity.y = 0;
            }
        }
        
        // CRITICAL: Ensure forward velocity is maintained even in ground collision check
        // Use ski direction, not just Z axis
        if (this.physics.started_skiing) {
            const forward_dir = new THREE.Vector3(
                Math.sin(this.physics.rotation.y),
                0,
                Math.cos(this.physics.rotation.y)
            );
            const forward_speed = this.physics.velocity.clone().dot(forward_dir);
            const is_turning = Math.abs(this.physics.rotation.y) > 0.1;
            const min_speed = is_turning ? 6.0 : 10.0;
            
            if (forward_speed < min_speed) {
                const lateral = this.physics.velocity.clone().sub(forward_dir.clone().multiplyScalar(forward_speed));
                const min_forward = forward_dir.clone().multiplyScalar(min_speed);
                this.physics.velocity.copy(lateral).add(min_forward);
            }
        }
    }
    
    update_camera() {
        // Third-person camera always behind skier, facing same direction
        const skier_pos = this.physics.position;
        
        // Get forward direction from skier's rotation (Y rotation is the heading)
        const forward = new THREE.Vector3(
            Math.sin(this.physics.rotation.y),
            0,
            Math.cos(this.physics.rotation.y)
        );
        
        // Camera position: behind skier (opposite of forward direction) and above
        const camera_distance = 12; // Distance behind skier
        const camera_height = 8; // Height above skier
        const camera_pos = skier_pos.clone()
            .add(forward.clone().multiplyScalar(-camera_distance))
            .add(new THREE.Vector3(0, camera_height, 0));
        
        // Smooth camera movement (faster lerp for more responsive following)
        this.camera.position.lerp(camera_pos, 0.2);
        
        // Camera always looks in the same direction as skier (forward)
        const look_at = skier_pos.clone().add(forward.multiplyScalar(10));
        this.camera.lookAt(look_at);
    }
    
    update_skier_visual() {
        if (!this.skier_group) return;
        
        // Update skier position and rotation
        this.skier_group.position.copy(this.physics.position);
        this.skier_group.rotation.copy(this.physics.rotation);
        
        // Update ski positions based on stance width
        const right_dir = new THREE.Vector3(
            Math.cos(this.physics.rotation.y),
            0,
            -Math.sin(this.physics.rotation.y)
        );
        const right_offset = right_dir.clone().multiplyScalar(this.physics.stance_width / 2);
        const left_offset = right_dir.clone().multiplyScalar(-this.physics.stance_width / 2);
        
        this.left_ski_mesh.position.copy(left_offset);
        this.left_ski_mesh.position.y = 0.15; // Higher position to keep skis visible above ground
        this.right_ski_mesh.position.copy(right_offset);
        this.right_ski_mesh.position.y = 0.15; // Higher position to keep skis visible above ground
        
        // Rotate skis based on edge angle (roll around forward axis)
        this.left_ski_mesh.rotation.x = this.physics.rotation.x;
        this.left_ski_mesh.rotation.y = this.physics.rotation.y;
        this.left_ski_mesh.rotation.z = this.physics.left_ski.edge_angle;
        
        this.right_ski_mesh.rotation.x = this.physics.rotation.x;
        this.right_ski_mesh.rotation.y = this.physics.rotation.y;
        this.right_ski_mesh.rotation.z = this.physics.right_ski.edge_angle;
        
        // Lean based on weight transfer and balance
        this.skier_group.rotation.z = this.physics.weight_transfer * 0.3 + this.physics.balance * 0.2;
    }
    
    update_weather() {
        // Dynamic weather effects (clouds, fog, wind)
        // This would update cloud positions, fog density, etc.
        const time = performance.now() * 0.0001;
        this.scene.fog.density = 0.0003 + Math.sin(time) * 0.0002;
    }
    
    on_window_resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const current_time = performance.now();
        const delta_time = Math.min((current_time - this.last_time) / 1000, 0.1);
        this.last_time = current_time;
        
        if (!this.crashed && this.physics && this.terrain && this.controls) {
            // Update lift system
            if (this.update_lift) {
                this.update_lift(delta_time);
            }
            
            // Update physics (only if not on lift)
            const on_lift = this.on_lift || false;
            const lift_position = this.lift_position || 0;
            const lift_bottom = this.lift_bottom_pos || new THREE.Vector3(0, 0, 0);
            const lift_top = this.lift_top_pos || new THREE.Vector3(0, 0, -800);
            
            try {
                const result = this.physics.update(delta_time, this.terrain, this.controls, on_lift, lift_position, lift_bottom, lift_top);
                
                if (result && result.crashed) {
                    this.crashed = true;
                    console.log('Crashed:', result.reason);
                }
            } catch (error) {
                console.error('Error in physics update:', error);
            }
        } else {
            // Debug: Log why physics isn't updating
            if (!this.physics.started_skiing && Math.random() < 0.01) {
                console.log('Waiting for space key to start');
            } else if (this.crashed && Math.random() < 0.01) {
                console.log('Game crashed - physics stopped');
            }
        }
        
        // Update visuals
        try {
            if (this.update_skier_visual) this.update_skier_visual();
            if (this.update_camera) this.update_camera();
            if (this.update_weather) this.update_weather();
            
            // CONTINUOUS safety check: ensure skier never goes below terrain
            if (this.enforce_ground_collision) this.enforce_ground_collision();
        } catch (error) {
            console.error('Error updating visuals:', error);
        }
        
        // Update speed indicator
        const speed_kmh = this.physics.velocity.length() * 3.6;
        const speed_element = document.getElementById('speed-indicator');
        if (speed_element) {
            speed_element.textContent = Math.round(speed_kmh) + ' km/h';
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game when page loads and Three.js is available
function initGame() {
    // Wait for Three.js to be available
    if (typeof THREE === 'undefined') {
        console.error('Three.js failed to load. Please check the CDN link.');
        const indicator = document.getElementById('speed-indicator');
        if (indicator) {
            indicator.textContent = 'Error: Three.js not loaded';
        }
        // Retry after a short delay
        setTimeout(initGame, 100);
        return;
    }
    
    try {
        game_instance = new AlpineGame();
    } catch (error) {
        console.error('Error initializing game:', error);
        const indicator = document.getElementById('speed-indicator');
        if (indicator) {
            indicator.textContent = 'Error: ' + error.message;
            indicator.classList.add('visible');
        }
        // Show start screen again with error message
        const start_screen = document.getElementById('start-screen');
        if (start_screen) {
            start_screen.classList.remove('hidden');
            const subtitle = start_screen.querySelector('.subtitle');
            if (subtitle) {
                subtitle.textContent = 'Error: ' + error.message;
            }
        }
        console.error('Stack trace:', error.stack);
    }
}

// Game instance (will be created when play button is clicked)
let game_instance = null;

// Wait for DOM and set up play button
function setupPlayButton() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPlayButton);
        return;
    }
    
    const play_button = document.getElementById('play-button');
    if (play_button) {
        play_button.addEventListener('click', () => {
            // Hide start screen
            const start_screen = document.getElementById('start-screen');
            if (start_screen) {
                start_screen.classList.add('hidden');
            }
            
            // Show speed indicator
            const speed_indicator = document.getElementById('speed-indicator');
            if (speed_indicator) {
                speed_indicator.classList.add('visible');
            }
            
            // Start the game
            if (!game_instance) {
                initGame();
            }
        });
    }
}

// Initialize play button setup
setupPlayButton();

