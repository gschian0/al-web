import { useState, useRef  } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Webcam from 'react-webcam';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cameraWidth = 720;
const cameraHeight = 720;
const aspectRatio = cameraWidth / cameraHeight;

const videoConstraints = {
  width: {
    min: cameraWidth
  },
  height: {
    min: cameraHeight
  },
  aspectRatio
};


export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [image, setImage] = useState();

  const webcamRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImage(reader.result);
    };
  };

  const handleWebcamCapture = async (e) => {
    e.preventDefault();
    const imageSrc = webcamRef.current.getScreenshot();
  setImage(imageSrc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
        image: image || (webcamRef.current ? webcamRef.current.getScreenshot() : null),
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);
  
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        return;
      }
      console.log({prediction})
      setPrediction(prediction);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Replicate + Next.js</title>
      </Head>

      <p>
        Dream something with{" "}
        <a style={{color: '#7FFF00'}} href="https://replicate.com/stability-ai/stable-diffusion">stability-ai/stable-diffusion</a>:
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input type="text" name="prompt" placeholder="Enter a prompt to display an image" />
        <input type="file" onChange={handleImageChange} />
        <button type="submit">Go!</button>
      </form>
      <div className={styles.stage}>
  {image && (
    <img src={image} />
  )}
  {!image && (
    <Webcam ref={webcamRef} videoConstraints={videoConstraints} width={cameraWidth} height={cameraHeight} />
  )}
</div>

      <form onSubmit={handleWebcamCapture}>
        <button type="submit">Take a picture with your webcam</button>
      </form>

      {image && (
        <div className={styles.imageWrapper}>
          <Image
            src={image}
            alt="input"
            width={200}
            height={200}
          />
        </div>
      )}

      {error && <div>{error}</div>}

      {prediction && (
        <div>
          {prediction.output && (
            <div className={styles.imageWrapper}>
              <Image
                
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                width={200}
                height={200}
              />
            </div>
          )}
          <p>status: {prediction.status}</p>
        </div>
      )}
    </div>
  );
}