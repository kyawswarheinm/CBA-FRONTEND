# Customer Behaviour Analysis Frontend

Public React + Vite frontend for the Customer Behaviour Analysis (CBA) project. This repository contains the user interface, bundled demo assets, and the project presentation pages used to showcase shelf-level customer interaction analytics.

![Customer Behaviour Analysis shelf reference](./src/assets/example1-shelf.png)

## Documentation Overview

This README covers:

- what is included in the public frontend repository
- which features work with bundled demo assets
- how the model was developed at a high level
- how the frontend connects to the private backend
- what to do if you do not have backend access
- local setup and environment configuration
- deployment notes for the public site

## Public Repository Scope

This public repository includes:

- the React frontend application
- landing and About pages
- sample replay videos and sample replay analysis data
- shelf-zone, heatmap, KPI, and product overlay UI
- project images used in the documentation experience

This public repository does not include:

- backend source code
- trained model weights
- upload processing services
- private analytics infrastructure
- deployment credentials or private API access

## Feature Overview

- Sample replay mode using bundled videos from `public/sample-videos/`
- Sample replay analytics loaded from `public/sample-analysis/sample_replay_data.json`
- Live stream viewer for authorized backend environments
- Upload-and-configure flow for custom shelf videos
- Heatmap, camera metrics, and product overlay analysis views
- About/documentation sections with model and project background

## Backend Access Policy

The backend that powers live analysis is our private property and cannot be accessed from this public repository.

Public users can view and run the frontend, including the bundled demo assets, but they cannot access:

- the private backend repository
- internal API deployment environments
- proprietary model logic
- backend-side upload processing
- internal analytics generation pipelines

Live analysis features require an approved backend URL supplied through `VITE_API_BASE_URL`.

## Documentation Assets

The frontend repository already includes public documentation media used by the UI:

- Shelf reference image: `src/assets/example1-shelf.png`
- Training and evaluation visuals: `public/images/`
- Sample replay content: `public/sample-videos/`

Example training results image:

![Training results documentation image](./public/images/results.png)

## Model Development Summary

The customer-interaction model shown in this frontend was developed through the following workflow:

- Define the retail interaction problem around four behavior classes: `No Interaction`, `Touching Shelf`, `Holding Product`, and `Item Removed`.
- Record 11 custom shelf-facing videos in real retail-style conditions using phone cameras and natural volunteer interactions.
- Label the footage frame by frame in CVAT so the interaction states could be trained and validated consistently.
- Split the dataset by full video instead of random frames to reduce leakage from near-identical adjacent images.
- Train the model with the Ultralytics YOLO pipeline for 50 epochs.
- Review performance using the public documentation visuals in `public/images/`, including training curves, precision-recall plots, and confusion matrices.
- Use the trained model in the private backend, while this frontend focuses on visualization, replay, presentation, and analytics display.

Dataset summary used by the project documentation:

- Training videos: `7`
- Validation videos: `3`
- Test videos: `1`
- Training images: `9,554`
- Validation images: `3,024`
- Total frames/images: `12,578`

Reported project metrics from the documented training run:

- Precision: `0.7269`
- Recall: `0.5895`
- mAP@50: `0.6091`
- mAP@50-95: `0.2525`

<h2><strong>Note: The current amount of frames (12,578) is nowhere near enough to train a production-grade model that is highly reliable, robust, and consistently accurate.</strong></h2>

This means the current model should be understood as a strong academic or prototype-stage system rather than a fully production-hardened deployment model.

## Training

The exact internal training scripts, model weights, and backend-side training environment are private and are not distributed in this public frontend repository. This section documents the real training workflow and results used by the project.

### Training Workflow

- Define the task as a four-class retail interaction problem: `No Interaction`, `Touching Shelf`, `Holding Product`, and `Item Removed`.
- Record 11 custom shelf-facing videos in real retail-style conditions using phone cameras and natural volunteer interactions.
- Annotate the footage frame by frame in CVAT to create behavior labels for training and validation.
- Split data at the full-video level to reduce leakage from highly similar neighboring frames.
- Train the detection model through the Ultralytics YOLO pipeline for 50 epochs.
- Review outcomes with label distribution charts, training curves, and confusion matrices before choosing the best checkpoint for the prototype system.

### Public Training Configuration Summary

```yaml
model:
  framework: Ultralytics YOLO
  task: retail shelf interaction detection
  classes:
    - No Interaction
    - Touching Shelf
    - Holding Product
    - Item Removed

dataset:
  source_videos: 11
  training_videos: 7
  validation_videos: 3
  test_videos: 1
  training_images: 9554
  validation_images: 3024
  total_images: 12578
  split_strategy: video-level
  annotation_tool: CVAT

training:
  epochs: 50
  best_validation_checkpoint: around_epoch_25
```

### Training Review Assets

The public repository includes the following training and evaluation visuals:

- `public/images/labels.jpg`
- `public/images/results.png`
- `public/images/confusion_matrix.png`
- `public/images/confusion_matrix_normalized.png`
- `public/images/BoxP_curve.png`
- `public/images/BoxR_curve.png`
- `public/images/BoxF1_curve.png`
- `public/images/BoxPR_curve.png`

## Results

### Performance Metrics

| Metric | Score |
|--------|-------|
| Precision | 0.7269 |
| Recall | 0.5895 |
| mAP@50 | 0.6091 |
| mAP@50-95 | 0.2525 |

### Training History

![Training History](./public/images/results.png)

### Confusion Matrix

![Confusion Matrix](./public/images/confusion_matrix.png)

## If You Do Not Have Backend Access

You can still use this public frontend without the private backend.

Recommended workflow:

- Run `npm install`.
- Run `npm run dev`.
- Use the bundled sample replay content in `public/sample-videos/` and `public/sample-analysis/`.
- Explore the landing page, About/documentation sections, training visuals, and frontend interactions.
- Treat live stream, upload, backend analytics refresh, and private API features as unavailable unless you have an approved backend endpoint.
- Request access from the project owners if you need authorized backend integration for live analysis.

If you do not have backend access, do not expect these features to work:

- live camera stream endpoints
- upload-and-analyze flow
- private analytics APIs
- backend-generated real-time heatmaps
- proprietary model inference services

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Environment Configuration

If you need to point the frontend at a specific backend, create a local `.env` file based on `.envexample`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If no authorized backend is available, the bundled sample assets still allow the UI to be explored in demo mode.

## Developer Notes

- Production live features depend on a private backend endpoint exposed through `https://████████████████.████████.███`.
- The backend remains private and is not distributed with this repository.
