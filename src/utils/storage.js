// 1. Add a version constant (change this whenever update DEFAULT_TEMPLATES)
const SCHEMA_VERSION = 9;

const DEFAULT_TEMPLATES = {
    '3rd Party Tag': [
        {
            id: 'vn-cr-3rd-1',
            name: 'Awaiting D2C approval',
            value: 'Hi [[@D2C]],\n\nWe have verified and created subtask for [[Section|AEM|SHOP|Both]] Section.\nWe are awaiting your approval.\n\nThank you.'
        },
        {
            id: 'vn-cr-3rd-2',
            name: 'After publishing',
            value: 'Hi [[@Reporter]],\n\nI\'d like to inform you that the library has been published successfully.\nPlease recheck on your end and change the status of the ticket to "Closed" if there are no issues.\n\nShould you have any additional questions or require further assistance in the future, please feel free to create a new ticket. We are always here to help.\n\nNOTE: Please assign this ticket back to @Tagging Jira Support to ensure your update is visible to the entire team, so that we can proceed with the next step.\n\nThank you for your understanding and cooperation.'
        }
    ],
    'Account': [
        {
            id: 'vn-cr-acc-aa-1',
            category: 'AA',
            name: 'Awaiting D2C approval',
            value: 'Dear [[@D2C]],\n\nWe have well received the information table and signed NDAs.\n\nPlease approve to grant AA access under Samsung SEC, Korea r/s.\n\nBest,'
        },
        {
            id: 'vn-cr-acc-aa-2',
            category: 'AA',
            name: 'After granting',
            value: "Hi [[@Reporter]],\n\n[Name]'s user ID now has [[REQUEST|NEW|EXTENDED|ADDITIONAL]] AA Access under Samsung SEC org, Korea r/s until Sep 2027.\nLink to your desired Samsung organization: **********************\nIf inaccessible, please try clear cache and log-in incognito mode.\n\nNOTE: Kindly inform us if the user encounters any access issues.\n\nBest,"
        },
          {
            id: 'vn-cr-acc-al-1',
            category: 'AL',
            name: 'Awaiting D2C approval',
            value: 'Dear [[@D2C]],\n\nWe have well received the information table and signed NDAs.\n\nPlease approve to grant AL access under Samsung org with Malaysia props.\n\nBest,'
            
        },
        {
            id: 'vn-cr-acc-al-2',
            category: 'AL',
            name: 'After granting',
            value: "Hi [[@Reporter]],\n\n[Name]'s user ID now has [[REQUEST|NEW|ADDITIONAL]] AL Access under Samsung org, Korea r/s until Sep 2027.\nIf inaccessible, please try clear cache and log-in incognito mode.\n\nNOTE: Kindly inform us if the user encounters any access issues.\n\nBest,"
        },
        {
            id: 'vn-cr-acc-ga-1',
            category: 'GA',
            name: 'Awaiting D2C approval',
            value: 'Dear [[@D2C]],\n\nWe have well received the information table and signed NDAs.\n\nPlease approve to grant GA access with MX properties.\n\nBest,'
        },
        {
            id: 'vn-cr-acc-ga-2',
            category: 'GA',
            name: 'GA new account',
            value: 'Hi [[@Reporter]], \n\nTo enforce security, as recommended by the Samsung Information Security Center, we are transitioning to a secure account with the domain @ga-gcp.samsung.com. \n\nFor more detailed instructions on setting up a secure account, please see the attached document.  When your account is issued, you will receive a password reminder (see the Secure Account Guide), which will expire after 48 hours (about 2 days).\n\nS.com Google Analytics Secure Account Switch.pptx - Guide \nLink:\nhttps://jira.secext.samsung.net/secure/attachment/3162629/3162629_S.com+Google+Analytics+Secure+Account+Switch.pptx\n\nAs per your request:\n- GA4 access has been provided.\n- Kindly ask the users to login with their "@ga-gcp.samsung.com" account to access the properties.\nNOTE: If there are no issues with provided access, please close the ticket\n\nThank you for your cooperation. '
        },
        {
            id: 'vn-cr-acc-ga-3',
            category: 'GA',
            name: 'GA password reset',
            value: 'Hi [[@Reporter]], \nI’ve just triggered the password reset using both methods:\n\nThe standard reset link from Google\nA separate email from tagging.jira@concentrix.com sent directly to your inbox\nCould you kindly check if you’ve received either of these emails?\n \nPlease try logging in using either the Google reset link or the passcode we provided via email. If neither option works, feel free to get back to us — we’ll be happy to assist by sending a 2FA backup code to help you regain access.\n \nThanks and looking forward to your update!'
        },
    ],
    'General': [
        {
            id: 'vn-cr-gen-rem-1',
            name: 'Reminder 1',
            value: 'Hi [[@Reporter]],\n\nJust a gentle reminder.\nCould you please share an update based on our previous comment, or let us know if there has been any progress? This will help us continue supporting you effectively.\n\nIf you have any questions or need any assistance, please feel free to leave your comments here.\n\nThanks & Regards,'
        },
        {
            id: 'vn-cr-gen-rem-2',
            name: 'Reminder 2',
            value: 'Hi [[@Reporter]],\n\nJust a quick follow-up on our previous message.\nCould you please share an update or let us know if there’s any progress?\n\nThanks & Regards,'
        }
    ]
};



export async function getVNCrData() {
    const result = await chrome.storage.local.get(['vnCrTemplates', 'vnCrVersion']);

    // 2. If version is missing or old, overwrite with new defaults
    if (!result.vnCrVersion || result.vnCrVersion < SCHEMA_VERSION) {
        console.log("Updating to new template version...");
        await saveVNCrData(DEFAULT_TEMPLATES);
        await chrome.storage.local.set({ vnCrVersion: SCHEMA_VERSION });
        return DEFAULT_TEMPLATES;
    }

    return result.vnCrTemplates;
}

export async function saveVNCrData(data) {
    return chrome.storage.local.set({ vnCrTemplates: data });
}