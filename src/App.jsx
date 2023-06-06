import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map } from "react-map-gl";
import maplibregl from "maplibre-gl";
maplibregl.supported = () => true;

import DeckGL from "@deck.gl/react";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import { useRef } from "react";
// import {
//   Matrix4,
//   Vector3,
//   DirectionalLight,
//   AmbientLight,
//   PerspectiveCamera,
//   Scene,
//   WebGLRenderer,
// } from "three";
// import { IFCLoader } from "web-ifc-three/IFCLoader";
// import { useCallback } from "react";

const INITIAL_VIEW_STATE = {
  longitude: 106.8229678882143, // Bandung
  latitude: -6.19250404916643,
  zoom: 17,
  bearing: 0,
  pitch: 45,
  maxPitch: 60,
  minZoom: 2,
  maxZoom: 30,
  antialias: true,
};

const modelOrigin = [106.82297, -6.19250404916643];
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0.72, 0];

// translate to map coordinates
const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
  modelOrigin,
  modelAltitude
);

const modelTransform = {
  translateX: modelAsMercatorCoordinate.x,
  translateY: modelAsMercatorCoordinate.y,
  translateZ: modelAsMercatorCoordinate.z,
  rotateX: modelRotate[0],
  rotateY: modelRotate[1],
  rotateZ: modelRotate[2],
  scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
};

export default function App({
  mapStyle = "https://api.maptiler.com/maps/3cd9373c-5e60-4fba-9bec-5123178cb61e/style.json?key=W3KZt4R5y50GlXj6hTO5",
  updateAttributions,
}) {
  const [initialViewState, setInitialViewState] = useState(INITIAL_VIEW_STATE);

  const onTilesetLoad = (tileset) => {
    // Recenter view to cover the new tileset
    const { cartographicCenter, zoom } = tileset;
    setInitialViewState({
      ...INITIAL_VIEW_STATE,
      longitude: cartographicCenter[0],
      latitude: cartographicCenter[1],
      zoom,
    });

    if (updateAttributions) {
      updateAttributions(tileset.credits && tileset.credits.attributions);
    }
  };

  const tile3DLayer = new Tile3DLayer({
    id: "tile-3d-layer",
    pointSize: 2,
    data: "/3DHI/test/tileset.json",
    opacity: 0.25, onTilesetLoad,
    pickable: true,
    onClick: (info) => console.log(info)
  });

  const mapRef = useRef();
  const [opacity, setOpacity] = useState(1);
  const [showButton, setShowButton] = useState(false);

  /* const onLoad = useCallback(() => {
    setShowButton(true);
    const map = mapRef.current;

    const scene = new Scene();
    const camera = new PerspectiveCamera();
    const renderer = new WebGLRenderer({
      // here we inject our Three.js scene into Mapbox
      canvas: map.getCanvas(),
      antialias: true,
    });
    renderer.autoClear = false;

    const customLayer = {
      id: "3d-model",
      type: "custom",
      renderingMode: "3d",

      onAdd: function () {
        //load model
        const ifcLoader = new IFCLoader();
        ifcLoader.ifcManager.setWasmPath("/web-ifc/");
        ifcLoader.load("/BHI.ifc", function (model) {
          scene.add(model);
        });

        //add lighting
        const directionalLight = new DirectionalLight(0x404040);
        const directionalLight2 = new DirectionalLight(0x404040);
        const ambientLight = new AmbientLight(0x404040, 3);
        directionalLight.position.set(0, -70, 100).normalize();
        directionalLight2.position.set(0, 70, 100).normalize();

        scene.add(directionalLight, directionalLight2, ambientLight);
      },

      render: function (gl, matrix) {
        //apply model transformations
        const rotationX = new Matrix4().makeRotationAxis(
          new Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new Matrix4().makeRotationAxis(
          new Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new Matrix4().makeRotationAxis(
          new Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        const m = new Matrix4().fromArray(matrix);
        const l = new Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        camera.projectionMatrix = m.multiply(l);
        renderer.resetState();
        renderer.render(scene, camera);
        map.triggerRepaint();
      },
    };

    map.getMap().addLayer(customLayer);
  }, []) */

  return (
    <>
      <DeckGL
        layers={[tile3DLayer]}
        initialViewState={initialViewState}
        controller={true}
        getTooltip={info => {
          if (info.object) {
            return {
              html: `
        <div><b>3DTile Property Value</b></div>
        <div>id : ${info.object.id}</div>
        <div>type : ${info.object.type}</div>
        <div>depth : ${info.object.depth}</div>
        <div>contentState : ${info.object.contentState}</div>
        <div>refine : ${info.object.refine}</div>
        <div>userData : empty</div>
        `
            }
          }
        }}
      >
        <Map
          ref={mapRef}
          reuseMaps
          preventStyleDiffing
          mapLib={maplibregl}
          mapStyle={mapStyle}
        // onLoad={onLoad}
        ></Map>
      </DeckGL>
      {showButton && (
        <button
          style={{ position: "absolute", right: 16, top: 16 }}
          onClick={(event) => {
            event.preventDefault();
            const map = mapRef.current;
            const currentStyle = map.getStyle();
            const visibleLayers = currentStyle.layers
              .map((l) => l)
              .filter((layer) => layer.layout?.visibility !== "none");
            try {
              for (const { id, type } of visibleLayers) {
                map
                  .getMap()
                  .setPaintProperty(id, type + "-opacity", (opacity + 0.2) % 1);
              }
              setOpacity((opacity + 0.2) % 1);
            } catch (error) {
              console.log(error);
            }
          }}
        >
          Change basemap opacity
        </button>
      )}
    </>
  );
}
