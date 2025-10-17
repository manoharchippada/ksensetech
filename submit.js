const results = {
    "high_risk_patients": [
        "DEMO002",
        "DEMO006",
        "DEMO007",
        "DEMO008",
        "DEMO010",
        "DEMO012",
        "DEMO016",
        "DEMO019",
        "DEMO020",
        "DEMO021",
        "DEMO022",
        "DEMO027",
        "DEMO028",
        "DEMO031",
        "DEMO032",
        "DEMO033",
        "DEMO040",
        "DEMO041",
        "DEMO045",
        "DEMO048"
    ],
    "fever_patients": [
        "DEMO005",
        "DEMO008",
        "DEMO009",
        "DEMO012",
        "DEMO021",
        "DEMO023",
        "DEMO037",
        "DEMO038",
        "DEMO047"
    ],
    "data_quality_issues": [
        "DEMO004",
        "DEMO005",
        "DEMO007",
        "DEMO023",
        "DEMO024",
        "DEMO035",
        "DEMO036",
        "DEMO043"
    ]
};
const API_KEY = "ak_5f2a10f7f3245c589798014a61196a3dd38b055c42392f6a";
fetch("https://assessment.ksensetech.com/api/submit-assessment", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
  },
  body: JSON.stringify(results)
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log("Assessment Results:", data);
  })
  .catch((error) => {
    console.error("Error submitting assessment:", error);
  });
