require("dotenv").config();
const express = require("express");

const app  = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

// Routes
app.use(require("./routes/authRoutes"));
app.use(require("./routes/evaluationRoutes"));
app.use(require("./routes/sprintRoutes"));
app.use(require("./routes/taskRoutes"));
app.use(require("./routes/ideaCoachRoutes"));
app.use(require("./routes/debateRoutes"));

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
