import { Typography, Card, CardContent, useTheme } from "@mui/material";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
const modules = {
  toolbar: [
    [{ bold: true }, { italic: true }, { underline: true }],
    [{ size: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image", "code-block"],
    [{ align: [] }],
    ["clean"],
  ],
};

const DescriptionComposent = ({ value, onChange }) => {
  const theme = useTheme();

  return (
    <div className="w-full">
      {/* Titre */}
      <Typography variant="h6" className="text-gray-700 font-semibold mb-2">
        Description <span className="text-red-500">*</span>
      </Typography>

      {/* Éditeur de texte */}
      <Card className="shadow-lg rounded-lg bg-white">
        <CardContent>
          <ReactQuill
            value={value}
            onChange={onChange}
            className="bg-white"
            theme="snow"
            modules={modules}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DescriptionComposent;

