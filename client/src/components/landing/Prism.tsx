"use client";

import React, { useEffect, useRef } from "react";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

// ==========================================
// SHADER SOURCES
// ==========================================

const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `
    precision highp float;
    
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    
    #define PI 3.14159265359
    #define TAU 6.28318530718
    #define MAX_STEPS 32
    #define MAX_DIST 50.0
    #define SURF_DIST 0.001
    
    float hash(float n) {
        return fract(sin(n) * 43758.5453123);
    }
    
    mat2 rot(float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c);
    }
    
    float sdSphere(vec3 p, float r) {
        return length(p) - r;
    }
    float sdBox(vec3 p, vec3 b) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    }
    
    float sdOctahedron(vec3 p, float s) {
        p = abs(p);
        float m = p.x + p.y + p.z - s;
        vec3 q;
        if(3.0 * p.x < m) q = p.xyz;
        else if(3.0 * p.y < m) q = p.yzx;
        else if(3.0 * p.z < m) q = p.zxy;
        else return m * 0.57735027;
        
        float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
        return length(vec3(q.x, q.y - s + k, q.z - k));
    }
    float sdTriPrism(vec3 p, vec2 h) {
        vec3 q = abs(p);
        return max(q.z - h.y, max(q.x * 0.866025 + p.y * 0.5, -p.y) - h.x * 0.5);
    }
    
    float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
    }
    float smax(float a, float b, float k) {
        return -smin(-a, -b, k);
    }
    
    float map(vec3 p) {
        vec3 op = p;
        
        vec2 m = (uMouse - 0.5) * 2.5;
        p.xy += m * 0.4;
        
        p.xz *= rot(uTime * 0.12);
        p.xy *= rot(uTime * 0.08);
        
        float d = 100.0;
        
        vec3 p1 = p;
        p1.yz *= rot(uTime * 0.15);
        
        float core_distort = sin(p1.x * 3.0 + uTime) * sin(p1.y * 3.0 + uTime) * sin(p1.z * 3.0 + uTime) * 0.1;
        float core = sdOctahedron(p1, 1.6) + core_distort;
        
        vec3 p2 = p1;
        p2.xy *= rot(PI * 0.25 + uTime * 0.2);
        float prism = sdTriPrism(p2, vec2(1.4, 2.0));
        core = smax(core, -prism, 0.2);
        
        d = core;
        
        float k_blend = 0.2 + 0.15 * (0.5 + 0.5 * sin(uTime * 1.5));
        
        for(int i = 0; i < 3; i++) {
            float fi = float(i);
            float angle = fi * TAU / 4.0 + uTime * 0.3;
            
            float radius = 3.0 + 0.3 * sin(uTime * 0.4 + fi);
            
            vec3 pos = vec3(
                cos(angle) * radius,
                sin(angle * 0.7) * 1.0,
                sin(angle) * radius
            );
            
            vec3 po = p - pos;
            po.xy *= rot(uTime * 0.5 + fi);
            
            float sat_distort = sin(po.x * 5.0 + fi) * sin(po.y * 5.0 + fi) * sin(po.z * 5.0 + fi) * 0.05;
            float satellite = sdOctahedron(po, 0.4) + sat_distort;
            
            d = smin(d, satellite, k_blend);
        }
        
        return d;
    }
    
    vec3 getNormal(vec3 p) {
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)
        ));
    }
    
    float raymarch(vec3 ro, vec3 rd) {
        float t = 0.0;
        for(int i = 0; i < MAX_STEPS; i++) {
            vec3 p = ro + rd * t;
            float d = map(p);
            if(abs(d) < SURF_DIST || t > MAX_DIST) break;
            t += d * 0.7;
        }
        return t;
    }
    
    vec3 getBackground(vec3 rd) {
        float stars = 0.0;
        vec3 p = rd * 100.0;
        float h = hash(dot(p, vec3(12.9898, 78.233, 54.53)));
        if(h > 0.98) stars = pow(h - 0.98, 10.0) * 20.0;
        vec3 nebula = vec3(0.0);
        nebula += vec3(0.3, 0.15, 0.5) * pow(max(0.0, sin(rd.x * 2.0 + uTime * 0.1)), 3.0) * 0.2;
        nebula += vec3(0.15, 0.3, 0.6) * pow(max(0.0, sin(rd.y * 2.5 + uTime * 0.05)), 3.0) * 0.2;
        
        return stars + nebula;
    }
    
    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
        
        vec2 m = (uMouse - 0.5) * 0.5;
        vec3 ro = vec3(m.x * 2.0, m.y * 2.0, 5.5);
        vec3 rd = normalize(vec3(uv, -1.0));
        
        rd.xy *= rot(m.x * 0.2);
        rd.yz *= rot(m.y * 0.2);
        
        float t = raymarch(ro, rd);
        
        vec3 color = vec3(0.0);
        
        if(t < MAX_DIST) {
            vec3 p = ro + rd * t;
            vec3 normal = getNormal(p);
            
            vec3 viewDir = normalize(ro - p);
            
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
            
            float ior = 1.5;
            vec3 refractDir = refract(rd, normal, 1.0 / ior);
            
            if(length(refractDir) > 0.0) {
                float t2 = raymarch(p - normal * 0.01, refractDir);
                
                if(t2 < MAX_DIST) {
                    vec3 p2 = p - normal * 0.01 + refractDir * t2;
                    vec3 normal2 = getNormal(p2);
                    
                    vec3 r = refract(refractDir, -normal2, ior - 0.2);
                    vec3 g = refract(refractDir, -normal2, ior);
                    vec3 b = refract(refractDir, -normal2, ior + 0.2);
                    
                    vec3 bgR = getBackground(r) * vec3(1.4, 0.7, 0.7);
                    vec3 bgG = getBackground(g) * vec3(0.7, 1.4, 0.8);
                    vec3 bgB = getBackground(b) * vec3(0.7, 0.8, 1.4);
                    
                    color = vec3(bgR.x, bgG.y, bgB.z);
                    color = pow(color, vec3(0.7)) * 5.0;
                    
                } else {
                    color = getBackground(refractDir) * 2.0;
                }
            }
            
            vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
            vec3 halfDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(normal, halfDir), 0.0), 150.0);
            color += spec * vec3(1.0, 1.0, 1.0) * 3.5;
            
            vec3 fresnelColor = vec3(
                0.5 + 0.5 * sin(fresnel * TAU + uTime),
                0.5 + 0.5 * sin(fresnel * TAU + uTime + TAU / 3.0),
                0.5 + 0.5 * sin(fresnel * TAU + uTime + TAU * 2.0 / 3.0)
            );
            color += fresnel * fresnelColor * 1.2;
            
            float edge = pow(1.0 - abs(dot(viewDir, normal)), 4.0);
            color += edge * vec3(0.6, 0.7, 1.0) * 0.7;
            
            float sss = pow(max(dot(-normal, lightDir), 0.0), 2.0);
            color += sss * vec3(1.0, 0.6, 0.8) * 0.5;
            
        } else {
            color = getBackground(rd);
        }
        
        float vignette = 1.0 - length(uv) * 0.4;
        vignette = smoothstep(0.3, 1.0, vignette);
        color *= vignette;
        
        color *= vec3(0.96, 0.99, 1.06);
        
        color = pow(color, vec3(0.88));
        color *= 1.12;
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

export function Prism() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
    const animationFrameId = useRef<number>(0);

    // Track mouse position for the glass button hover effect
    const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty("--x", `${x}px`);
        e.currentTarget.style.setProperty("--y", `${y}px`);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", {
            alpha: true,
            depth: false,
            antialias: true,
            premultipliedAlpha: true,
        });

        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        // Resize handling
        const resizeCanvas = () => {
            // Cap pixel ratio at 1.0 for performance on high-DPI screens
            const pixelRatio = Math.min(1.0, window.devicePixelRatio || 1);
            canvas.width = canvas.clientWidth * pixelRatio;
            canvas.height = canvas.clientHeight * pixelRatio;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Shader Creation Helper
        const createShader = (
            gl: WebGLRenderingContext,
            type: number,
            source: string
        ) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        // Program Creation Helper
        const createProgram = (
            gl: WebGLRenderingContext,
            vertexShader: WebGLShader,
            fragmentShader: WebGLShader
        ) => {
            const program = gl.createProgram();
            if (!program) return null;
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error("Program link error:", gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            return program;
        };

        const vertShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragShader = createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );

        if (!vertShader || !fragShader) return;

        const program = createProgram(gl, vertShader, fragShader);
        if (!program) return;

        // Uniform Locations
        const uTime = gl.getUniformLocation(program, "uTime");
        const uResolution = gl.getUniformLocation(program, "uResolution");
        const uMouse = gl.getUniformLocation(program, "uMouse");

        // Buffer Setup
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Mouse Tracking for WebGL
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.targetX = e.clientX / window.innerWidth;
            mouseRef.current.targetY = 1.0 - e.clientY / window.innerHeight;
        };
        window.addEventListener("mousemove", handleMouseMove);

        // Render Loop
        const startTime = Date.now();
        const render = () => {
            const currentTime = (Date.now() - startTime) * 0.001;

            // Smooth mouse interpolation
            mouseRef.current.x +=
                (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
            mouseRef.current.y +=
                (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);

            gl.uniform1f(uTime, currentTime);
            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);

            const positionLocation = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(positionLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            animationFrameId.current = requestAnimationFrame(render);
        };

        render();

        // Cleanup
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId.current);
            gl.deleteProgram(program);
            gl.deleteShader(vertShader);
            gl.deleteShader(fragShader);
        };
    }, []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
            <style jsx>{`
        @keyframes glowPulse {
          from {
            filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.4))
              drop-shadow(0 0 80px rgba(138, 43, 226, 0.3));
          }
          to {
            filter: drop-shadow(0 0 60px rgba(255, 255, 255, 0.6))
              drop-shadow(0 0 120px rgba(0, 191, 255, 0.4));
          }
        }
        @keyframes borderFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) rotate(30deg);
          }
          100% {
            transform: translateX(100%) rotate(30deg);
          }
        }
        .animate-glowPulse {
          animation: glowPulse 3s ease-in-out infinite alternate;
        }
        .glass-button {
          /* Initialization for the radial gradient tracking */
          --x: 50%;
          --y: 50%;
        }
        .glass-button::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 40px;
          padding: 1.5px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(138, 43, 226, 0.4) 25%,
            rgba(0, 191, 255, 0.4) 50%,
            rgba(255, 105, 180, 0.4) 75%,
            rgba(255, 255, 255, 0.4) 100%
          );
          background-size: 200% 200%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: borderFlow 3s linear infinite;
          opacity: 0.6;
          transition: opacity 0.5s ease;
        }
        .glass-button::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 40px;
          background: radial-gradient(
            circle at var(--x, 50%) var(--y, 50%),
            rgba(255, 255, 255, 0.2) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .glass-button:hover::before {
          opacity: 1;
          animation-duration: 2s;
        }
        .glass-button:hover::after {
          opacity: 1;
        }
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 45%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0.1) 55%,
            transparent 100%
          );
          animation: shimmer 3s infinite;
        }
        .glass-button:hover .shimmer-effect {
          animation-duration: 1.5s;
        }
      `}</style>

            {/* WebGL Canvas */}
            <canvas
                ref={canvasRef}
                className="block absolute inset-0 w-full h-full"
            />

            {/* Content Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center text-white pointer-events-none w-full px-4">
                {/* Title */}
                <h1
                    className={`${instrument.className} font-normal mb-2 animate-glowPulse tracking-tight bg-gradient-to-br from-white via-[#f0f0f0] to-white bg-clip-text text-transparent`}
                    style={{
                        fontSize: "clamp(3.5rem, 10vw, 8rem)",
                    }}
                >
                    PROCURE AI
                </h1>

                {/* Tagline */}
                <p className="text-[clamp(0.9rem,2vw,1.2rem)] font-light tracking-[0.3em] uppercase text-white/90 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    Intelligent Sourcing
                </p>

                {/* Buttons */}
                <div className="flex justify-center gap-4 md:gap-6 mt-10 pointer-events-auto">
                    {["Discover", "Join Now"].map((text, idx) => (
                        <Link key={idx} href="/sign-up">
                            <button
                                onMouseMove={handleButtonMouseMove}
                                className="glass-button relative px-6 md:px-10 py-3 md:py-4 text-sm md:text-base font-semibold tracking-wider text-white border-[1.5px] border-transparent rounded-[40px] overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-[3px] hover:scale-102 hover:shadow-[0_12px_48px_rgba(138,43,226,0.3),0_0_80px_rgba(0,191,255,0.2)] active:-translate-y-px active:scale-98 bg-white/5"
                            >
                                <span className="shimmer-effect absolute -top-1/2 -left-1/2 w-[200%] h-[200%] -rotate-30 pointer-events-none" />
                                <span className="relative z-10">{text}</span>
                            </button>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
