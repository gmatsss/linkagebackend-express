const express = require("express");
const router = express.Router();
const {
  getWaitingForPartsJobs,
  getJobsByStatusName,
  getinvoice,
  scrapeWebsite
} = require("../../controller/premier/serviceFusionController");
// const {
//   handleSpeech,
//   handleAnswer,
//   handleEvent,
// } = require("../controller/vonageController");
// const {
//   handleJobsAnswer,
//   handleJobsSpeech,
//   handleJobsEvent,
// } = require("../controller/vonageJobController");

router.post("/jobs", getWaitingForPartsJobs);
router.post("/getinvoice", getinvoice);
router.post("/scrape", scrapeWebsite);
router.get("/bystatus", getJobsByStatusName);

// //Collection Email Follow Up invoice
// router.post("/answer", handleAnswer);
// router.post("/speech", handleSpeech);
// router.post("/event", handleEvent);

// //waitingforparts Email Follow Up invoice
// router.post("/jobanswer", handleJobsAnswer);
// router.post("/jobspeech", handleJobsSpeech);
// router.post("/jobevent", handleJobsEvent);

module.exports = router;
