const exportAsImage = async (el, imageFileName) => {
  // htmlToImage.toPng(el,{ cacheBust: true, })
  //     .then(function (dataUrl) {
  //
  //         downloadImage(dataUrl, imageFileName);
  //     });
  // htmlToImage.toPng(select(el).select('canvas').node())
  //     .then(function (dataUrl) {
  //         var img = new Image();
  //         img.crossOrigin = "Anonymous";
  //         img.src = dataUrl;
  //         document.body.appendChild(img);
  //     })
  //     .catch(function (error) {
  //         console.error('oops, something went wrong!', error);
  //     });
  const renderer = el.renderer();
  const scene = el.scene();
  const camera = el.camera();
  renderer.render(scene, camera);
  const blob = renderer.domElement.toDataURL();
  downloadImage(blob, imageFileName);
  // const canvas = select(el).select('canvas').node();
  // var context = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
  // const capturedImage = videocanvas.toDataURL();
  // canvasToImage(canvas, {
  //     name: 'myImage',
  //     type: 'jpg',
  //     quality: 0.7
  // });
};

const downloadImage = (blob, fileName) => {
  const fakeLink = window.document.createElement("a");
  fakeLink.style = "display:none;";
  fakeLink.download = fileName;

  fakeLink.href = blob;

  document.body.appendChild(fakeLink);
  fakeLink.click();
  document.body.removeChild(fakeLink);

  fakeLink.remove();
};
export default exportAsImage;
