let isDev = window.location.port === "3000";
let wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
let serverUrl = isDev
  ? "ws://localhost:9001"
  : `${wsProtocol}//${window.location.host}`;

export const ClientConfig = {
  SERVER_URL: serverUrl,
  TILE_SIZE: 32,
  CAMERA_LERP: 0.1,
  MOVE_SPEED: 150,
};
