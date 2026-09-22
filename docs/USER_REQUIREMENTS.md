# MASTER PROMPT

## Build a Production-Grade Real-Time Face Tracking & Movement Analysis Platform

You are a senior full-stack engineer, computer-vision engineer, UI/UX designer, ML engineer, and software architect.

Build a complete, production-quality **Real-Time Face Tracking & Movement Analysis Platform** with a professional dashboard similar to an advanced computer-vision laboratory system.

The application must NOT be a static UI mockup.

Every major button, control, graph, camera function, tracking function, coordinate display, visualization, export function, and analysis module must actually work.

The system should be modular, responsive, performant, extensible, and suitable for desktop/laptop/tablet screens.

---

# 1. PRODUCT NAME

Use:

**MathTech Face Tracking & Analysis**

Brand:

**MathTech**

Tagline:

**I HAVE NO LIMITATION**

Application subtitle:

**Real-Time Face Detection | Tracking | Movement Analysis | Advanced Imaging**

Use a professional futuristic computer-vision/AI laboratory aesthetic.

---

# 2. PRIMARY OBJECTIVE

Create a real-time application capable of:

1. Detecting faces from a webcam/video.
2. Detecting multiple faces.
3. Assigning temporary tracking IDs.
4. Selecting and locking onto a target face.
5. Tracking the selected face across frames.
6. Displaying the face bounding box.
7. Displaying facial landmarks.
8. Calculating the face center.
9. Displaying pixel coordinates.
10. Calculating movement relative to previous frames.
11. Plotting X/Y/Z movement.
12. Estimating head pose.
13. Showing yaw, pitch and roll.
14. Measuring facial movement.
15. Showing landmark movement.
16. Detecting basic facial expressions/movement signals where technically supported.
17. Providing face-size and distance/depth estimates where supported.
18. Recording tracking data.
19. Exporting tracking data.
20. Supporting uploaded images and videos.
21. Providing multiple image-processing views.
22. Providing segmentation visualization.
23. Providing night-vision-style visualization.
24. Providing thermal-style visualization as a visualization mode only when actual thermal input is unavailable.
25. Providing blur/depth/grayscale/edge visualization.
26. Providing real-time graphs.
27. Providing a 2D tracking coordinate system.
28. Providing a 3D head/coordinate visualization.
29. Providing a detailed event/data log.
30. Providing configurable detection/tracking settings.

---

# 3. IMPORTANT PRIVACY REQUIREMENTS

Design this as a privacy-conscious computer-vision application.

Default behavior:

- Process webcam frames locally whenever possible.
- Do not upload camera frames to a remote server by default.
- Do not perform identity recognition.
- Do not identify people by name.
- Do not build a biometric database.
- Tracking IDs should be temporary session IDs such as Face-01, Face-02.
- Provide a visible camera/tracking status indicator.
- Provide a clear camera permission state.
- Allow users to stop the camera immediately.
- Do not store raw video unless the user explicitly enables recording.
- Clearly distinguish actual sensor data from simulated/derived visualization.

---

# 4. RECOMMENDED ARCHITECTURE

Use a modular architecture.

## Frontend

Preferred:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Recharts or another performant charting library
- Three.js / React Three Fiber for 3D visualization
- Web Workers where useful

## Computer Vision

Prefer browser/local processing where practical:

- MediaPipe Face Detection
- MediaPipe Face Mesh / Face Landmarker

Alternative backend processing:

- Python
- FastAPI
- OpenCV
- NumPy

The application should support a future backend CV engine without requiring a complete frontend rewrite.

---

# 5. APPLICATION STRUCTURE

Create:

```text
face-tracking-platform/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── camera/
│   │   │   ├── tracking/
│   │   │   ├── landmarks/
│   │   │   ├── charts/
│   │   │   ├── imaging/
│   │   │   ├── analytics/
│   │   │   ├── controls/
│   │   │   ├── threeD/
│   │   │   └── common/
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── ImageProcessing.tsx
│   │   │   ├── ModelSettings.tsx
│   │   │   ├── Export.tsx
│   │   │   └── Help.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCamera.ts
│   │   │   ├── useFaceDetection.ts
│   │   │   ├── useFaceTracking.ts
│   │   │   ├── useLandmarks.ts
│   │   │   ├── useHeadPose.ts
│   │   │   └── useTrackingHistory.ts
│   │   │
│   │   ├── services/
│   │   │   ├── cameraService.ts
│   │   │   ├── faceDetectionService.ts
│   │   │   ├── trackingService.ts
│   │   │   ├── analyticsService.ts
│   │   │   └── exportService.ts
│   │   │
│   │   ├── types/
│   │   ├── utils/
│   │   ├── store/
│   │   └── App.tsx
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── cv/
│   │   ├── tracking/
│   │   ├── analytics/
│   │   └── models/
│   └── requirements.txt
│
├── tests/
├── docs/
├── README.md
└── docker-compose.yml

```

Keep the CV engine replaceable.

---

# 6. MAIN DASHBOARD

Create a professional dashboard with:

### Left Sidebar

Menu:

- Live Tracking
- Analytics
- Image Processing
- Model Settings
- Export
- Help

At bottom:

```text
MathTech
Face Tracking Pro
v1.0.0

```

---

# 7. TOP HEADER

Display:

```text
MathTech
Face Tracking & Analysis System

Real-time Face Detection
Tracking
Movement Analysis
Advanced Imaging

```

Right side:

- System Online
- FPS
- Camera status
- Current timestamp
- Settings
- Fullscreen

Make the header responsive.

---

# 8. LIVE CAMERA MODULE

This is the primary module.

Display:

```text
Live Camera Feed

```

Inside the video:

- Face bounding box
- Face ID
- Confidence
- Facial landmarks
- Center point
- X/Y axes
- Coordinate crosshair
- Tracking path
- Optional velocity vector
- Optional movement trail

Example:

```text
Face ID: 01

Center:
X = 642 px
Y = 368 px

Confidence:
98.7%

Bounding Box:
X = 490
Y = 185
W = 284
H = 362

```

Add:

```text
TRACKING: ACTIVE

```

---

# 9. FACE CENTER CALCULATION

For each detected face calculate:

```text
centerX = x + width / 2
centerY = y + height / 2

```

Display:

```text
Face Center
(642, 368)

```

Draw a highly visible center marker.

Allow:

- Crosshair
- Dot
- Coordinate label

to be toggled independently.

---

# 10. COORDINATE SYSTEM

Implement a coordinate overlay.

Origin:

```text
(0,0)

```

at the top-left of the camera frame.

Display:

```text
X →
Y ↓

```

Provide an option to switch to a mathematical coordinate system:

```text
X →
Y ↑

```

Show:

```text
Current Position
X: 642
Y: 368

```

Also calculate:

```text
ΔX
ΔY
Distance
Direction
Velocity

```

---

# 11. FACE TRACKING

Implement actual temporal tracking.

The system must not simply detect a face independently every frame.

Maintain:

```text
FaceTrack {
    id
    bbox
    center
    landmarks
    confidence
    timestamp
    velocity
    acceleration
    history
    status
}

```

Use appropriate tracking logic.

Possible strategy:

```text
Detection
     ↓
Feature/landmark extraction
     ↓
Target association
     ↓
Tracking state update
     ↓
Smoothing
     ↓
Visualization

```

Use temporal smoothing to reduce jitter.

Allow configuration of:

- Tracking sensitivity
- Detection threshold
- Smoothing factor
- Lost-face timeout
- Maximum tracked faces

---

# 12. LOCK FACE FEATURE

Create:

```text
LOCK FACE

```

button.

Behavior:

1. Detect available faces.
2. User selects a face.
3. Store target tracking ID/state.
4. Highlight target face.
5. Continue tracking the selected target.
6. Ignore non-target faces for target-specific analytics.
7. If temporarily lost, attempt reacquisition.
8. Show:

```text
TARGET LOCKED
Face ID: 01

```

Allow:

```text
Unlock Face
Reset Target

```

Do not use identity recognition.

---

# 13. MULTI-FACE MODE

Support:

```text
Face 01
Face 02
Face 03
...

```

Each face should have:

- Bounding box
- ID
- Confidence
- Center
- Movement
- Tracking state

Use different visual markers.

Provide a face-selection panel.

---

# 14. FACIAL LANDMARK MODULE

Display facial landmarks.

At minimum support visualization for:

- Eyes
- Eyebrows
- Nose
- Mouth
- Cheeks
- Chin
- Jaw
- Face contour

Allow toggles:

```text
✓ Left Eye
✓ Right Eye
✓ Nose
✓ Mouth
✓ Left Brow
✓ Right Brow
✓ Left Cheek
✓ Right Cheek
✓ Chin
✓ Jawline

```

Allow:

```text
Show All
Hide All

```

---

# 15. HEAD POSE ESTIMATION

Calculate/display:

```text
Yaw
Pitch
Roll

```

Example:

```text
Yaw:   -6.3°
Pitch: -2.1°
Roll:   1.8°

```

Visualize the orientation using a 3D coordinate axis.

Show:

```text
X = Right
Y = Up
Z = Forward

```

Clearly label estimates as estimates when the underlying camera/model cannot provide true physical depth.

---

# 16. MOVEMENT ANALYSIS

Calculate:

```text
ΔX
ΔY
ΔZ
distance
direction
velocity
acceleration

```

Example:

```text
X Movement: +2.4 px
Y Movement: -1.7 px
Z Movement: +0.6

```

Also calculate:

```text
Horizontal displacement
Vertical displacement
Total displacement
Movement speed
Movement direction

```

Use timestamps rather than assuming a fixed FPS.

---

# 17. MOVEMENT TRAJECTORY

Draw the face movement path.

Example:

```text
●──●──●
      \
       ●
        \
         ●

```

The trajectory should update in real time.

Allow:

```text
Trail length:
10
25
50
100
Unlimited

```

---

# 18. MOVEMENT GRAPHS

Create real-time graphs.

### Graph 1

```text
Horizontal X Movement

```

### Graph 2

```text
Vertical Y Movement

```

### Graph 3

```text
Depth Z Movement

```

### Graph 4

```text
Face Velocity

```

### Graph 5

```text
Head Pose

```

Support:

```text
1 sec
5 sec
10 sec
30 sec
60 sec

```

Allow pause/resume.

Do not render thousands of DOM elements every frame.

Use efficient chart updates.

---

# 19. 3D TRACKING VIEW

Create a Three.js visualization.

Show:

```text
3D Head

```

with:

```text
X → Right
Y → Up
Z → Forward

```

Display:

```text
Position
Orientation
Velocity Vector

```

Example:

```text
Position

X: 0.12
Y: -0.03
Z: 0.68

Orientation

Yaw: -6.3°
Pitch: -2.1°
Roll: 1.8°

```

Add:

```text
Rotate
Zoom
Reset Camera
Grid
Axes

```

---

# 20. IMAGE PROCESSING MODULE

Create tabs:

```text
Original
Depth
Thermal
Blur
Night Vision
Grayscale
Edges
Segmentation
Contrast
Sharpen

```

Important:

If real depth or thermal hardware is unavailable, do not pretend the result is genuine sensor data.

Clearly label derived visualizations:

```text
SIMULATED THERMAL VIEW
DEPTH ESTIMATE

```

---

# 21. FACE SEGMENTATION

Implement a segmentation visualization where supported.

Show:

- Face mask
- Background mask
- Face-only image
- Overlay
- Mask opacity

Controls:

```text
Mask Opacity
Edge Strength
Background Visibility

```

---

# 22. BLUR ANALYSIS

Provide:

```text
Gaussian Blur
Motion Blur Visualization
Face Blur
Background Blur

```

Allow adjustable:

```text
Blur Radius

```

---

# 23. NIGHT VISION VISUALIZATION

Create a visual processing mode that provides a night-vision-style representation.

Include:

- brightness enhancement
- contrast adjustment
- grayscale mapping
- noise reduction

Clearly distinguish this from an actual infrared camera.

---

# 24. THERMAL VISUALIZATION

If no thermal sensor exists:

Generate a false-color visualization from image intensity/derived facial features.

Display:

```text
THERMAL STYLE
DERIVED VISUALIZATION

```

Never label a normal RGB webcam frame as actual thermal temperature data.

If a real thermal camera is connected later, design the architecture so its stream can replace this renderer.

---

# 25. FACE INFORMATION PANEL

Create:

```text
Face Information

```

Display:

```text
ID
Confidence
Center
Bounding Box
Width
Height
Area
Aspect Ratio
Tracking Status

```

Example:

```text
ID              01
Confidence      98.7%
Center          642, 368
Width           284 px
Height          362 px
Area            102,808 px²
Status          LOCKED

```

---

# 26. TRACKING CONTROL PANEL

Create:

```text
Enable Tracking

```

toggle.

Controls:

```text
Target Face
Tracking Mode
Detection Threshold
Smoothing
Trail Length
Landmarks
Show Coordinates
Show Center
Show Bounding Box
Show Pose
Show Movement

```

Buttons:

```text
LOCK FACE
RESET
PAUSE
RESUME
EXPORT DATA

```

Every button must work.

---

# 27. CAMERA CONTROL

Support:

```text
Start Camera
Stop Camera
Pause Camera
Resume Camera
Switch Camera

```

Display:

```text
Resolution
FPS
Camera Name

```

Support common resolutions:

```text
640x480
1280x720
1920x1080

```

Gracefully handle unavailable cameras.

---

# 28. VIDEO INPUT

Support:

- Webcam
- Uploaded image
- Uploaded video

For video:

```text
Play
Pause
Seek
Playback Speed
Frame Step

```

Allow tracking analysis on uploaded video where technically supported.

---

# 29. PERFORMANCE MONITORING

Display:

```text
FPS
Processing Time
Detection Latency
Tracking Latency
Memory indicator where available

```

Example:

```text
FPS: 30.2
Resolution: 1280 × 720
Detection: 18 ms
Tracking: 4 ms

```

Do not freeze the UI when processing frames.

Use:

- requestAnimationFrame
- Web Workers
- throttling
- frame skipping
- efficient canvas rendering

where appropriate.

---

# 30. DATA LOG

Create a real-time event log.

Example:

```text
11:34:27
Face detected — ID 01

11:34:26
Tracking updated — Center (642,368)

11:34:25
Head movement detected

11:34:24
Target face locked

```

Add:

```text
Clear Log
Pause Log
Export Log

```

---

# 31. ANALYTICS PAGE

Create a dedicated analytics dashboard.

Include:

### Face Statistics

```text
Total detections
Tracked faces
Average confidence
Average face size
Tracking duration

```

### Movement Statistics

```text
Total distance
Average velocity
Maximum velocity
Horizontal displacement
Vertical displacement

```

### Pose Statistics

```text
Average yaw
Maximum yaw
Average pitch
Maximum pitch
Average roll
Maximum roll

```

---

# 32. SESSION MANAGEMENT

Create tracking sessions.

A session contains:

```text
session_id
start_time
end_time
camera
resolution
model
settings
tracking_data
events
statistics

```

Allow:

```text
Start New Session
Pause Session
End Session
Save Session
Load Session

```

Prefer local storage/IndexedDB for local-only sessions.

---

# 33. EXPORT SYSTEM

Support:

```text
CSV
JSON
PNG snapshot
Tracking report

```

CSV should include:

```text
timestamp
face_id
confidence
x
y
width
height
center_x
center_y
delta_x
delta_y
velocity
yaw
pitch
roll

```

JSON should preserve complete session information.

Allow the user to choose:

```text
Current Frame
Current Session
Complete History
Analytics Summary

```

---

# 34. SNAPSHOT FEATURE

Add:

```text
Capture Frame

```

The captured image should optionally contain:

- Bounding box
- Landmarks
- Center
- Coordinates
- Face ID
- Pose
- Timestamp

Allow:

```text
Raw Image
Annotated Image

```

---

# 35. RESPONSIVE DESIGN

The application must work properly on:

```text
1920×1080
1600×900
1440×900
1366×768
1280×720
1024×768
Tablet

```

Desktop should use a multi-column dashboard.

Tablet should collapse panels intelligently.

Small screens should become stacked layouts.

Never allow:

- horizontal overflow
- overlapping panels
- unreadable graphs
- clipped controls
- broken dialogs

The camera should maintain a correct aspect ratio.

---

# 36. UI DESIGN

Use a premium dark interface.

Visual language:

- dark navy/black background
- glass-like panels
- subtle borders
- cyan/blue primary accents
- green tracking indicators
- red warning indicators
- yellow status indicators
- high readability
- restrained animations

Use:

```text
rounded-xl
subtle shadows
thin borders
glass panels
smooth transitions

```

Do not overuse glow effects.

The interface should look like a professional AI/computer-vision workstation rather than a gaming dashboard.

---

# 37. ACCESSIBILITY

Implement:

- keyboard navigation
- visible focus states
- sufficient contrast
- tooltips
- aria labels
- accessible buttons
- accessible sliders
- semantic headings

---

# 38. ERROR HANDLING

Handle:

### Camera unavailable

Show:

```text
Camera unavailable.
Check browser permissions or select another camera.

```

### No face detected

Show:

```text
No face detected

```

### Face lost

Show:

```text
TARGET TEMPORARILY LOST
Attempting reacquisition...

```

### Model unavailable

Show:

```text
Computer vision model failed to initialize.

```

Never crash the entire dashboard.

---

# 39. SETTINGS PAGE

Create sections:

## Detection

```text
Detection threshold
Maximum faces
Minimum face size

```

## Tracking

```text
Smoothing
Lost timeout
Reacquisition
Trail length

```

## Visualization

```text
Bounding box
Landmarks
Coordinates
Center point
Axes
Movement trail
Pose

```

## Performance

```text
Target FPS
Frame skip
Resolution
Processing mode

```

## Privacy

```text
Local processing
Session storage
Auto-save
Recording

```

---

# 40. STATE MANAGEMENT

Create centralized application state.

Example:

```text
cameraState
trackingState
faceState
targetState
analyticsState
settingsState
sessionState
uiState

```

Avoid passing huge amounts of state through deeply nested props.

Keep real-time frame state optimized.

---

# 41. TYPE DEFINITIONS

Create strongly typed interfaces.

Example:

```typescript
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceCenter {
  x: number;
  y: number;
}

interface HeadPose {
  yaw: number;
  pitch: number;
  roll: number;
}

interface FaceTrack {
  id: string;
  confidence: number;
  boundingBox: BoundingBox;
  center: FaceCenter;
  landmarks: Landmark[];
  pose?: HeadPose;
  velocity?: Vector3;
  history: TrackingPoint[];
  status: "detected" | "tracking" | "locked" | "lost";
}

```

Use strict TypeScript.

Avoid `any` unless absolutely necessary.

---

# 42. REAL-TIME RENDERING ARCHITECTURE

Do NOT rebuild the entire React component tree on every camera frame.

Use:

```text
Camera
   ↓
Video Element
   ↓
CV Processing
   ↓
Tracking State
   ↓
Canvas Overlay

```

Use canvas/WebGL overlays for:

- landmarks
- bounding boxes
- center points
- trajectory
- axes

Keep React responsible mainly for application state and controls.

---

# 43. TRACKING PIPELINE

Implement:

```text
Camera Frame
      ↓
Frame Preprocessing
      ↓
Face Detection
      ↓
Landmark Detection
      ↓
Face Association
      ↓
Target Lock
      ↓
Temporal Smoothing
      ↓
Center Calculation
      ↓
Movement Calculation
      ↓
Pose Estimation
      ↓
Analytics
      ↓
Visualization
      ↓
History / Export

```

---

# 44. MATHEMATICAL CALCULATIONS

Implement reusable utility functions.

### Face center

```text
cx = x + width / 2
cy = y + height / 2

```

### Displacement

```text
dx = cx(t) - cx(t-1)
dy = cy(t) - cy(t-1)

```

### Euclidean movement

```text
distance = sqrt(dx² + dy²)

```

### Velocity

```text
velocity = distance / Δt

```

### Acceleration

```text
acceleration = (v(t) - v(t-1)) / Δt

```

Use real timestamps.

Do not assume every frame has identical timing.

---

# 45. DATA SMOOTHING

Implement optional smoothing.

Possible:

```text
Exponential Moving Average
Kalman Filter

```

Allow the architecture to support both.

Example setting:

```text
Smoothing:
0% ─────────●──── 100%

```

Do not hide raw measurements.

Allow:

```text
Raw
Smoothed

```

comparison.

---

# 46. FACE MOVEMENT HEATMAP

Create an optional movement heatmap.

Display areas where the tracked face moved most frequently.

Use the trajectory history to calculate the visualization.

Allow:

```text
Heatmap ON/OFF
Intensity
Decay

```

---

# 47. LANDMARK MOVEMENT ANALYSIS

Allow selecting individual landmarks.

Example:

```text
Nose
Left Eye
Right Eye
Mouth Center
Chin

```

For the selected landmark show:

```text
X
Y
ΔX
ΔY
Velocity
Trajectory

```

---

# 48. ADVANCED ANALYTICS

Add optional analysis:

```text
Blink-related landmark movement
Mouth opening ratio
Eye aspect ratio
Face symmetry visualization
Head movement frequency
Motion intensity

```

Clearly label these as computer-vision measurements/estimates rather than medical or psychological conclusions.

Do not infer emotions, intentions, personality, health conditions, or identity.

---

# 49. CAMERA CALIBRATION

Provide a calibration panel.

Allow:

```text
Resolution
Aspect Ratio
Coordinate Scaling
Camera Intrinsics (optional advanced mode)

```

If calibration parameters are unavailable, do not claim metric physical measurements.

Use:

```text
Pixel Coordinates
Estimated Relative Depth

```

rather than falsely presenting centimeter-level physical positions.

---

# 50. DARK MODE / LIGHT MODE

Default:

```text
Dark

```

Optional:

```text
Light
System

```

Make sure every component supports both themes.

---

# 51. FULLSCREEN MODE

Provide:

```text
Fullscreen Tracking

```

This should maximize:

- camera
- tracking overlays
- target information
- coordinates

Hide unnecessary dashboard panels.

Allow pressing:

```text
ESC

```

to exit fullscreen.

---

# 52. KEYBOARD SHORTCUTS

Implement:

```text
Space       Pause/Resume
L           Lock Face
U           Unlock
R           Reset
C           Capture
E           Export
F           Fullscreen
T           Toggle Tracking
G           Toggle Graphs
M           Toggle Landmarks

```

Show shortcuts in Help.

---

# 53. HELP PAGE

Create an interactive help page explaining:

- Face detection
- Tracking
- Face locking
- Coordinates
- Center point
- Head pose
- Movement graphs
- 3D visualization
- Segmentation
- Export
- Privacy

---

# 54. TESTING

Create tests for:

### Unit tests

- center calculation
- displacement
- distance
- velocity
- acceleration
- bounding-box calculations
- coordinate conversion
- smoothing

### Component tests

- tracking controls
- lock button
- export
- camera state
- settings

### Integration tests

```text
Camera → Detection → Tracking → Analytics → Export

```

---

# 55. PERFORMANCE REQUIREMENTS

Target:

```text
30 FPS where hardware permits

```

Do not block the main UI thread.

Implement:

- frame throttling
- efficient canvas rendering
- worker-based processing where useful
- bounded tracking history
- memoized components
- lazy loading for heavy pages
- efficient chart updates

---

# 56. SECURITY

Implement:

- no unnecessary external uploads
- secure API design
- input validation
- safe file handling
- maximum upload size
- allowed media types
- no executable file uploads
- safe error messages

---

# 57. BACKEND API

If backend processing is enabled, create APIs such as:

```text
GET    /api/health

POST   /api/session/start
POST   /api/session/end

POST   /api/analyze/frame

GET    /api/session/{id}

GET    /api/session/{id}/analytics

GET    /api/session/{id}/export

```

Use FastAPI with Pydantic models.

Do not make backend mandatory for the basic browser-local tracking mode.

---

# 58. DATABASE

If persistence is enabled, use a lightweight structure initially.

Possible:

```text
SQLite

```

Tables:

```text
sessions
tracking_points
face_tracks
events
settings

```

Do not store biometric identities.

---

# 59. API RESPONSE FORMAT

Use structured JSON.

Example:

```json
{
  "timestamp": 1780000000000,
  "faces": [
    {
      "id": "face-01",
      "confidence": 0.987,
      "bbox": {
        "x": 490,
        "y": 185,
        "width": 284,
        "height": 362
      },
      "center": {
        "x": 632,
        "y": 366
      },
      "movement": {
        "dx": 2.4,
        "dy": -1.7,
        "speed": 3.2
      },
      "pose": {
        "yaw": -6.3,
        "pitch": -2.1,
        "roll": 1.8
      }
    }
  ]
}

```

---

# 60. DEMO MODE

Create a Demo Mode for users who do not want to provide camera permissions.

Demo Mode should generate realistic simulated tracking data.

Clearly label:

```text
DEMO / SIMULATION MODE

```

Never mix simulated data with actual camera data without clearly indicating the source.

---

# 61. RESPONSIVE CAMERA LAYOUT

Desktop:

```text
┌──────── Sidebar ────────┬──────── Camera ────────┬──── Info ────┐
│                         │                        │              │
│ Navigation              │     Live Camera       │ Face Info    │
│                         │                        │ Controls     │
├─────────────────────────┼────────────────────────┼──────────────┤
│                         │                        │              │
│ Movement Graphs         │ 3D Tracking            │ Imaging      │
│                         │                        │ Data Log     │
└─────────────────────────┴────────────────────────┴──────────────┘

```

Tablet:

```text
Sidebar
   ↓
Camera
   ↓
Face Information
   ↓
Controls
   ↓
Graphs
   ↓
3D
   ↓
Image Analysis

```

Mobile:

```text
Camera
↓
Tracking Status
↓
Target Information
↓
Controls
↓
Graphs
↓
Analytics

```

---

# 62. UI QUALITY REQUIREMENT

Do not produce generic dashboard components.

Every section should look intentionally designed.

Use:

- consistent spacing
- consistent typography
- responsive cards
- meaningful icons
- useful tooltips
- clear status indicators
- professional loading states
- skeleton loaders
- empty states
- error states

---

# 63. LOADING STATES

When initializing the CV model:

```text
Initializing Computer Vision Model...

Loading face detection...
Loading landmark model...
Preparing camera...

```

Progress should be represented visually.

---

# 64. EMPTY STATES

If there is no camera:

```text
No Camera Connected
Connect a camera to begin tracking.

```

If there is no face:

```text
No Face Detected
Position a face inside the camera frame.

```

If no analytics exist:

```text
No Tracking Data
Start a tracking session to generate analytics.

```

---

# 65. DOCUMENTATION

Generate:

```text
README.md
ARCHITECTURE.md
API.md
DEVELOPMENT.md
CV_PIPELINE.md
PRIVACY.md
TESTING.md

```

README must include:

- Features
- Architecture
- Installation
- Development
- Camera permissions
- Environment variables
- Running frontend
- Running backend
- Build instructions
- Troubleshooting
- Screenshots
- Project structure

---

# 66. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example

```

Document:

```text
VITE_API_URL=
VITE_ENABLE_BACKEND=
VITE_ENABLE_DEMO_MODE=

```

Never hardcode secrets.

---

# 67. DEPLOYMENT

Frontend should be deployable to:

```text
Vercel
Netlify

```

Backend should be deployable to:

```text
Render
Railway
Docker

```

Provide:

```text
Dockerfile
docker-compose.yml

```

where appropriate.

---

# 68. FINAL USER EXPERIENCE

When the user opens the application:

```text
Application
   ↓
Permission / Camera Selection
   ↓
Model Initialization
   ↓
Live Camera
   ↓
Face Detection
   ↓
Face ID
   ↓
Face Tracking
   ↓
Center Point
   ↓
Coordinates
   ↓
Movement
   ↓
Head Pose
   ↓
Graphs
   ↓
3D Visualization
   ↓
Analytics
   ↓
Export

```

The application should feel like a professional real-time computer-vision workstation.

---

# 69. IMPORTANT IMPLEMENTATION RULE

Do not stop after creating the frontend.

Implement the actual functionality.

For every major feature ask:

```text
Is the UI present?
Is the state implemented?
Is the underlying logic implemented?
Does the button actually work?
Does the visualization update with real data?
Does it handle errors?
Does it work after refresh?
Does it work responsively?

```

If any answer is no, finish that implementation before considering the feature complete.

---

# 70. DEVELOPMENT STRATEGY

Build in phases.

## Phase 1

Build:

- project architecture
- dashboard
- responsive layout
- camera module
- theme
- navigation

## Phase 2

Implement:

- face detection
- landmarks
- bounding box
- center coordinates
- FPS

## Phase 3

Implement:

- temporal tracking
- face IDs
- target locking
- tracking history
- movement calculations

## Phase 4

Implement:

- graphs
- head pose
- 3D visualization
- trajectory

## Phase 5

Implement:

- image processing
- segmentation
- derived night vision
- derived thermal visualization
- blur
- edge analysis

## Phase 6

Implement:

- analytics
- sessions
- data logging
- export

## Phase 7

Implement:

- settings
- keyboard shortcuts
- help
- accessibility
- error handling

## Phase 8

Perform:

- performance optimization
- responsive testing
- unit testing
- integration testing
- production build
- documentation

---

# 71. FINAL ACCEPTANCE CRITERIA

The project is considered complete only when:

[ ] Webcam works
[ ] Camera permission handling works
[ ] Face detection works
[ ] Multiple faces work
[ ] Face IDs work
[ ] Face locking works
[ ] Target reacquisition works
[ ] Bounding boxes work
[ ] Landmarks work
[ ] Center point works
[ ] X/Y coordinates work
[ ] Movement calculation works
[ ] Velocity works
[ ] Movement trajectory works
[ ] Head pose works where supported
[ ] 3D visualization works
[ ] Real-time graphs work
[ ] Image processing works
[ ] Segmentation visualization works where supported
[ ] Demo mode works
[ ] Data logging works
[ ] Session management works
[ ] CSV export works
[ ] JSON export works
[ ] Snapshot export works
[ ] Settings work
[ ] Keyboard shortcuts work
[ ] Responsive layout works
[ ] Error states work
[ ] Loading states work
[ ] Privacy controls work
[ ] No major console errors
[ ] No broken buttons
[ ] No placeholder functionality
[ ] Production build succeeds

---

# 72. MOST IMPORTANT INSTRUCTION

Do not create a fake AI dashboard.

Create a **functional real-time face tracking and computer-vision application**.

The generated UI should be visually close to a professional AI/CV monitoring workstation, but the underlying implementation must be real.

Use real webcam frames, real face detection, real landmarks, real coordinate calculations, real temporal tracking, real movement history, and real-time visualization wherever the selected technology supports them.

Where a capability cannot be physically measured by an ordinary RGB webcam, explicitly label it as:

```text
ESTIMATE

```

or

```text
DERIVED VISUALIZATION

```

rather than fabricating sensor measurements.

Prioritize:

**Functionality → Accuracy → Performance → Responsiveness → UX → Visual polish.**

After implementation, run the project, test the complete workflow, fix errors, and only then consider the application complete.