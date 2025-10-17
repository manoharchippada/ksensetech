
const fs = require("fs");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


const API_KEY = "ak_5f2a10f7f3245c589798014a61196a3dd38b055c42392f6a";
const BASE_URL = "https://assessment.ksensetech.com/api/patients";

async function fetchAllPatients(limit = 5) {
  let allRecords = [];
  let page = 1;

  while (true) {
    console.log(`Fetching page ${page}...`);
    const url = `${BASE_URL}?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      headers: { "x-api-key": API_KEY }
    });

    if (response.status === 429) {
      console.log("Rate limited. Waiting 2 seconds...");
      await new Promise((res) => setTimeout(res, 2000));
      continue;
    }

    if (response.status === 500 || response.status === 503) {
      console.log(`Server error ${response.status}. Retrying in 2 seconds...`);
      await new Promise((res) => setTimeout(res, 2000));
      continue;
    }

    if (!response.ok) {
      console.log(`Failed to fetch page ${page}: ${response.status}`);
      break;
    }

    const data = await response.json();
    let records = extractRecords(data);

    if (!records) {
      console.log(`Could not find record list in page ${page} response.`);
      console.log(JSON.stringify(data, null, 2));
      break;
    }

    if (records.length === 0) {
      console.log("No more records found.");
      break;
    }

    allRecords = allRecords.concat(records);
    page++;
    await new Promise((res) => setTimeout(res, 300)); // prevent 429s
  }

  return allRecords;
}

function extractRecords(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    for (const key of ["patients", "data", "items", "results", "records"]) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }
  return null;
}
function parseBP(bp) {
  if (!bp || typeof bp !== "string") return [null, null];
  const parts = bp.split("/");
  if (parts.length !== 2) return [null, null];
  const systolic = parseInt(parts[0], 10);
  const diastolic = parseInt(parts[1], 10);
  if (isNaN(systolic) || isNaN(diastolic)) return [null, null];
  return [systolic, diastolic];
}

function scoreBP(bp) {
  const [systolic, diastolic] = parseBP(bp);
  if (systolic === null || diastolic === null) return [0, true];
  if (systolic >= 140 || diastolic >= 90) return [3, false];
  if ((130 <= systolic && systolic <= 139) || (80 <= diastolic && diastolic <= 89)) return [2, false];
  if (120 <= systolic && systolic <= 129 && diastolic < 80) return [1, false];
  if (systolic < 120 && diastolic < 80) return [0, false];
  return [0, true];
}

function scoreTemp(temp) {
  if (temp === null || temp === undefined) return [0, true];
  const t = parseFloat(temp);
  if (isNaN(t)) return [0, true];
  if (t >= 101.0) return [2, false];
  if (t >= 99.6 && t <= 100.9) return [1, false];
  return [0, false];
}

function scoreAge(age) {
  if (age === null || age === undefined) return [0, true];
  const a = parseInt(age, 10);
  if (isNaN(a)) return [0, true];
  if (a < 40) return [0, false];
  if (a <= 65) return [1, false];
  if (a > 65) return [2, false];
  return [0, true];
}
async function run() {
  const patients = await fetchAllPatients();

  console.log(`Total patients fetched: ${patients.length}`);

  const highRisk = [];
  const fever = [];
  const dataQuality = [];

  for (const p of patients) {
    const pid = p.patient_id;
    const bp = p.blood_pressure;
    const temp = p.temperature;
    const age = p.age;

    const [bpScore, bpInvalid] = scoreBP(bp);
    const [tempScore, tempInvalid] = scoreTemp(temp);
    const [ageScore, ageInvalid] = scoreAge(age);

    const totalScore = bpScore + tempScore + ageScore;

    if (totalScore >= 4) highRisk.push(pid);

    const tVal = parseFloat(temp);
    if (!isNaN(tVal) && tVal >= 99.6) fever.push(pid);

    if (bpInvalid || tempInvalid || ageInvalid) dataQuality.push(pid);
  }

  const results = {
    high_risk_patients: highRisk,
    fever_patients: fever,
    data_quality_issues: dataQuality
  };
  fs.writeFileSync(
    "patient_risk_results.js",
    "const results = " + JSON.stringify(results, null, 4) + ";"
  );
  fs.writeFileSync("patient_risk_results.json", JSON.stringify(results, null, 4));

  console.log("Categorization complete!");
  console.log(JSON.stringify(results, null, 4));
}

run().catch((err) => console.error("Error:", err));
