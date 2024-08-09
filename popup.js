// Initialize the stored data and counter if they don't exist
if (!localStorage.getItem('scrapedData')) {
    localStorage.setItem('scrapedData', JSON.stringify([]));
}
if (!localStorage.getItem('profileCounter')) {
    localStorage.setItem('profileCounter', '0');
}

// Update the counter display
function updateCounterDisplay() {
    const counter = localStorage.getItem('profileCounter');
    document.getElementById('profileCounter').textContent = `Profiles Stored: ${counter}`;
}

// Update the fields with the latest scraped data
function updateFields(profile) {
    document.getElementById('name').value = profile.name || '';
    document.getElementById('jobTitle').value = profile.jobTitle || '';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('employer').value = profile.employer || '';
    document.getElementById('education').value = profile.education || '';
    document.getElementById('profileUrl').value = profile.profileUrl || '';
}

// Display a notification
function showNotification(message, color, duration) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = color;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

// Scrape data when the "Scrape" button is clicked
document.getElementById('scrapeData').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: scrapeLinkedInData,
        }, (results) => {
            if (results && results[0] && results[0].result) {
                // Get the current stored data
                const scrapedData = JSON.parse(localStorage.getItem('scrapedData'));

                // Check if the candidate is already saved
                const profileUrl = results[0].result.profileUrl;
                const candidateExists = scrapedData.some(profile => profile.profileUrl === profileUrl);

                if (candidateExists) {
                    // Disable the Save button and show notification
                    document.getElementById('saveData').disabled = true;
                    showNotification('Candidate Already Saved', '#FFC107', 3000); // Yellow notification
                } else {
                    // Enable the Save button
                    document.getElementById('saveData').disabled = false;
                }

                // Update the fields with the scraped data
                updateFields(results[0].result);
            }
        });
    });
});

// Save the scraped and edited data when the "Save" button is clicked
document.getElementById('saveData').addEventListener('click', () => {
    // Get the current stored data
    const scrapedData = JSON.parse(localStorage.getItem('scrapedData'));

    // Create a new profile object from the fields
    const profile = {
        name: document.getElementById('name').value,
        jobTitle: document.getElementById('jobTitle').value,
        location: document.getElementById('location').value,
        employer: document.getElementById('employer').value,
        education: document.getElementById('education').value,
        profileUrl: document.getElementById('profileUrl').value
    };

    // Append the new data
    scrapedData.push(profile);

    // Save it back to localStorage
    localStorage.setItem('scrapedData', JSON.stringify(scrapedData));

    // Increment the counter
    let counter = parseInt(localStorage.getItem('profileCounter'), 10);
    counter++;
    localStorage.setItem('profileCounter', counter.toString());

    // Update the counter display
    updateCounterDisplay();

    // Disable the Save button and show success notification
    document.getElementById('saveData').disabled = true;
    showNotification('Candidate Saved', '#4CAF50', 2000); // Green notification
});

// Generate the filename based on the current date and time
function generateFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    const filename = `Candidates ${year}-${month}-${day} ${hour}-${minute}-${second}.csv`;

    return filename;
}

// Download the CSV when the "Download CSV" button is clicked
document.getElementById('downloadCSV').addEventListener('click', () => {
    // Get the stored data
    const scrapedData = JSON.parse(localStorage.getItem('scrapedData'));

    if (scrapedData.length === 0) {
        showNotification('No profiles stored to download.', '#FFC107', 3000); // Yellow notification
        return;
    }

    // Convert the data to CSV format
    const csvContent = "Name,Job Title,Location,Employer,Education,Profile URL\n" +
        scrapedData.map(profile => [
            escapeCsvValue(profile.name),
            escapeCsvValue(profile.jobTitle),
            escapeCsvValue(profile.location),
            escapeCsvValue(profile.employer),
            escapeCsvValue(profile.education),
            escapeCsvValue(profile.profileUrl)
        ].join(",")).join("\n");
    
        // Generate the filename
    const filename = generateFilename();

    // Trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    }, function(downloadId) {
        if (downloadId) {
            // Clear the stored data and reset the counter
            localStorage.setItem('scrapedData', JSON.stringify([]));
            localStorage.setItem('profileCounter', '0');

            // Clear the fields and update the counter display
            updateCounterDisplay();
            updateFields({});
        }
    });
});

function escapeCsvValue(value) {
    if (value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;  // Escape double quotes and wrap in double quotes
    }
    return value;
}

// Scraping function using the provided query selectors
function scrapeLinkedInData() {
    const nameElement = document.querySelector("#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card.OesrsMrnYVyfhLABgHHjukydUWPcbBDJdesHo > div.ph5.pb5 > div.mt2.relative > div:nth-child(1) > div.fgAnxUVweJyJuHoHmxChHUJyiYvVVzWimXk > span:nth-child(1) > a:nth-child(1) > h1:nth-child(1)");
    const jobTitleElement = document.querySelector("#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card.OesrsMrnYVyfhLABgHHjukydUWPcbBDJdesHo > div.ph5.pb5 > div.mt2.relative > div:nth-child(1) > div.text-body-medium.break-words");
    const locationElement = document.querySelector("#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card.OesrsMrnYVyfhLABgHHjukydUWPcbBDJdesHo > div.ph5.pb5 > div.mt2.relative > div.KouIGgUQgxaVVdvrXicbXnOILuniTFtzyo.mt2 > span.text-body-small.inline.t-black--light.break-words");
    const employerElement = document.querySelector("#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card.OesrsMrnYVyfhLABgHHjukydUWPcbBDJdesHo > div.ph5.pb5 > div.mt2.relative > ul > li:nth-child(1) > button > span > div");
    const educationElement = document.querySelector("#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card.OesrsMrnYVyfhLABgHHjukydUWPcbBDJdesHo > div.ph5.pb5 > div.mt2.relative > ul > li:nth-child(2) > button > span > div");
    const profileUrl = window.location.href; // Get the current URL of the LinkedIn profile

    return {
        name: nameElement ? nameElement.textContent.trim() : '',
        jobTitle: jobTitleElement ? jobTitleElement.textContent.trim() : '',
        location: locationElement ? locationElement.textContent.trim() : '',
        employer: employerElement ? employerElement.textContent.trim() : '',
        education: educationElement ? educationElement.textContent.trim() : '',
        profileUrl: profileUrl
    };
}

// Initial counter display update when the popup is opened
document.addEventListener('DOMContentLoaded', updateCounterDisplay);
