// path to included test dicom-pdf
const filePath = './dcm/test-encapsulated-pdf.dcm';

// get handles for DOM elements
const pdfDisplayElement = document.getElementById('viewport');
const fileInputElement = document.getElementById('fileinput');
const messageElement = document.getElementById('message');

// attach event handler for file input change
fileInputElement.onchange = loadFile;

// handle errors by printing to console and message div
function handleError(err) {
  console.error(err);
  messageElement.innerHTML = err.message;
  window.setTimeout(() => messageElement.innerHTML = '', 3000);
}

// display a PDF file blob by converting to url and setting iframe src
function showPDF(pdfBlob) {
  const objectURL = URL.createObjectURL(pdfBlob);
  pdfDisplayElement.src = objectURL;
}

// extract an embedded pdf file from a dicom file by reading the 0042,0011 element
// throw an error if no encapsulated PDF file is found
function extractPDF(byteArray) {
  const dataset = dicomParser.parseDicom(byteArray);
  const encapsulatedDocumentMimeType = dataset.string('x00420012');
  const encapsulatedDocumentElement = dataset.elements.x00420011;
  if (
    !encapsulatedDocumentMimeType ||
    encapsulatedDocumentMimeType !== 'application/pdf' ||
    !encapsulatedDocumentElement
  ) {
    throw new Error('Not a valid DICOM encapsulated PDF file.');
  }

  const pdfBuffer = new Uint8Array(
    dataset.byteArray.buffer,
    encapsulatedDocumentElement.dataOffset,
    encapsulatedDocumentElement.length
  );
  const pdfBlob = new Blob([pdfBuffer], {
    type: 'application/pdf',
  });
  showPDF(pdfBlob);
}

// load file from input element
function loadFile() {
  const file = fileInputElement.files[0];
  const reader = new FileReader();
  reader.onload = (file) => {
    try {
      const fileArrayBuffer = file.target.result;
      const fileByteArray = new Uint8Array(fileArrayBuffer);
      extractPDF(fileByteArray);
    } catch (err) {
      handleError(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

// load default dicom-pdf
function loadDefault() {
  axios
    .get(filePath, { responseType: 'arraybuffer' })
    .then((response) => {
      const { data: file } = response;
      const byteArray = new Uint8Array(file);
      extractPDF(byteArray);
    })
    .catch((err) => {
      handleError(err);
    });
}

loadDefault();
