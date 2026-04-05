import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export function CosmicGlobe() {
  const mapContainerRef = useRef<SVGGElement>(null);
  const satFrontRef = useRef<SVGCircleElement>(null);
  const satBackRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const projection = d3.geoOrthographic()
      .scale(100)
      .translate([0, 0])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule();
    const mapGroup = d3.select(mapContainerRef.current);
    
    const satFront = d3.select(satFrontRef.current);
    const satBack = d3.select(satBackRef.current);

    const rx = 200;
    const ry = 80;

    mapGroup.selectAll("*").remove();

    mapGroup.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path as any)
      .style("fill", "none")
      .style("stroke", "rgba(201,168,76,0.2)")
      .style("stroke-width", "0.5px");

    let timer: d3.Timer;

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((world: any) => {
      const countries = (topojson.feature(world as any, world.objects.countries as any) as any).features;
      
      const countryPaths = mapGroup.selectAll(".landmass")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "landmass")
        .attr("d", path as any)
        .style("fill", "#c9a84c")
        .style("opacity", "0.85")
        .style("stroke", "#080810")
        .style("stroke-width", "0.3px");

      let rotation: [number, number, number] = [0, -15, 0];
      
      timer = d3.timer((elapsed) => {
        rotation[0] = elapsed * 0.012; 
        projection.rotate(rotation);
        countryPaths.attr("d", path as any);
        mapGroup.select(".graticule").attr("d", path as any);

        const angle = elapsed * 0.0002; 
        const px = rx * Math.cos(angle);
        const py = ry * Math.sin(angle);
        
        satFront.attr("cx", px).attr("cy", py);
        satBack.attr("cx", px).attr("cy", py);

        if (py >= 0) {
          satFront.style("display", "block");
          satBack.style("display", "none");
        } else {
          satFront.style("display", "none");
          satBack.style("display", "block");
        }
      });
    });

    return () => {
      if (timer) timer.stop();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto">
      <svg className="w-full h-full" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="sphere-3d" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15"/>
            <stop offset="40%" stopColor="#c9a84c" stopOpacity="0"/>
            <stop offset="80%" stopColor="#080810" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#080810" stopOpacity="0.95"/>
          </radialGradient>

          <clipPath id="front-half-clip">
            <rect x="-300" y="-0.5" width="600" height="300" />
          </clipPath>
          <clipPath id="back-half-clip">
            <rect x="-300" y="-300" width="600" height="301" />
          </clipPath>

          <path id="text-path" d="M 250, 88 A 162,162 0 1,1 249.9,88" />
        </defs>

        {/* BACKGROUND ORBITAL PATHS (Behind the Globe) */}
        <g transform="translate(250, 250)">
          <ellipse cx="0" cy="0" rx="200" ry="80" transform="rotate(35)" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.3" clipPath="url(#back-half-clip)" />
          
          <g transform="rotate(35)">
              <circle ref={satBackRef} r="6" fill="#e8c97a" style={{ filter: 'drop-shadow(0 0 8px #e8c97a)' }} cx="200" cy="0" />
          </g>
          
          <ellipse cx="0" cy="0" rx="180" ry="100" transform="rotate(-45)" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.15" clipPath="url(#back-half-clip)" />

          <circle cx="0" cy="0" r="182" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.3"/>
          <circle cx="0" cy="0" r="150" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.1"/>
        </g>

        {/* Golden Ratio Font Size Text */}
        <text fontFamily="monospace" fontSize="16.2" fontWeight="400" fill="#c9a84c" letterSpacing="10" opacity="0.7">
          <textPath href="#text-path" startOffset="0%">
            THE COSMIC YOGA WINDOW • THE COSMIC YOGA WINDOW • THE COSMIC YOGA WINDOW • 
          </textPath>
        </text>

        {/* 3D SPINNING GLOBE */}
        <g transform="translate(250, 250)">
          <circle cx="0" cy="0" r="100" fill="#0c0e12" stroke="#c9a84c" strokeWidth="1.2" filter="url(#gold-glow)" opacity="0.6"/>
          <g ref={mapContainerRef}></g>
          <circle cx="0" cy="0" r="100" fill="url(#sphere-3d)" stroke="#c9a84c" strokeWidth="1" style={{ pointerEvents: 'none' }}/>
        </g>
        
        {/* FOREGROUND ORBITAL PATHS (In Front of the Globe) */}
        <g transform="translate(250, 250)">
          <ellipse cx="0" cy="0" rx="200" ry="80" transform="rotate(35)" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.3" clipPath="url(#front-half-clip)" />
          
          <g transform="rotate(35)">
              <circle ref={satFrontRef} r="6" fill="#e8c97a" style={{ display: 'none', filter: 'drop-shadow(0 0 8px #e8c97a)' }} cx="200" cy="0" />
          </g>
          
          <ellipse cx="0" cy="0" rx="180" ry="100" transform="rotate(-45)" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.15" clipPath="url(#front-half-clip)" />
        </g>
      </svg>
    </div>
  );
}
