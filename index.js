const express = require("express");
const { Supra } = require("supra.ts");
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const options = {
    genericSleepTime: 1000,
    closeAfterEachRequest: true,
    headless: true,
    puppeteerLaunchArgs: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-zygote",
        "--start-fullscreen"
      ],
    recaptchaKey: "65cf3f9aaa71fecdf656ff40a795f84d"
};

const supra = new Supra(options);

app.get("/", (req, res) => {
    res.send("Server online");
});

app.get('/test', async (req, res) => {
    try {
        const browser = await puppeteer.launch({headless: 'new'});
        const page = await browser.newPage();
        await page.goto('https://vrl.lta.gov.sg/eai/vrl/action/vrl-eSvcLogin?FUNCTION_ID=F0000005TT');
        const title = await page.title();
        await browser.close();
        res.send('Title: ' + title);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});


app.get("/lookup", (req, res) => {
    res.send(`
        <form id="lookupForm" action="/lookup" method="post">
            <label for="vehicleNo">Enter Vehicle Number:</label>
            <input type="text" id="vehicleNo" name="vehicleNo" required>
            <button type="button" onclick="validateAndSubmit()">Lookup</button>
            <p id="errorMessage" style="color: red; display: none;">Please enter a valid license plate</p>
        </form>
        <script>
            function validateAndSubmit() {
                var vehicleNo = document.getElementById("vehicleNo").value;
                var pattern = /^[A-Za-z]{1,3}\\d{1,4}[A-Za-z]?$/;
                
                if (!pattern.test(vehicleNo)) {
                    document.getElementById("errorMessage").style.display = "block";
                } else {
                    document.getElementById("errorMessage").style.display = "none";
                    document.getElementById("lookupForm").submit();
                }
            }
        </script>
    `);
});


app.post("/lookup", async (req, res) => {
    try {
        let { vehicleNo } = req.body;
        vehicleNo = vehicleNo.toUpperCase();
        console.log('Vehicle Number:', vehicleNo);
        const { carMake, roadTaxExpiry } = await supra.search(vehicleNo);
        res.send(`
            <h1>Result</h1>
            <p>Vehicle Number: ${vehicleNo}</p>
            <p>Car Make: ${carMake}</p>
            <p>Road Tax Expiry: ${roadTaxExpiry}</p><br/>
            <a href="/lookup">Back</a>
        `);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
