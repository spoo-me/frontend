// Generated from spoo-latest/templates/legal/*.html — content is verbatim.
// Regenerate by re-running the extraction against the source templates.

export type LegalDoc = {
  slug: string
  title: string
  lastUpdated: string
  description: string
  toc: { id: string; title: string }[]
  html: string
}

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    lastUpdated: "November 16, 2025",
    description: "What we collect, why, and the rights you have over it.",
    toc: [
      {
            "id": "information-we-collect",
            "title": "Information We Collect"
      },
      {
            "id": "log-files",
            "title": "Log Files"
      },
      {
            "id": "cookies-and-web-beacons",
            "title": "Cookies and Web Beacons"
      },
      {
            "id": "how-we-use-your-information",
            "title": "How We Use Your Information"
      },
      {
            "id": "data-sharing-and-third-parties",
            "title": "Data Sharing and Third Parties"
      },
      {
            "id": "privacy-policies",
            "title": "Privacy Policies"
      },
      {
            "id": "data-security",
            "title": "Data Security"
      },
      {
            "id": "data-retention",
            "title": "Data Retention"
      },
      {
            "id": "your-rights-gdpr-ccpa-compliance",
            "title": "Your Rights (GDPR & CCPA Compliance)"
      },
      {
            "id": "international-data-transfers",
            "title": "International Data Transfers"
      },
      {
            "id": "email-verification-and-communications",
            "title": "Email Verification and Communications"
      },
      {
            "id": "third-party-privacy-policies",
            "title": "Third Party Privacy Policies"
      },
      {
            "id": "analytics",
            "title": "Analytics"
      },
      {
            "id": "personal-data",
            "title": "Personal Data"
      },
      {
            "id": "children-s-information",
            "title": "Children's Information"
      },
      {
            "id": "changes-to-this-privacy-policy",
            "title": "Changes to This Privacy Policy"
      },
      {
            "id": "online-privacy-policy-only",
            "title": "Online Privacy Policy Only"
      },
      {
            "id": "consent",
            "title": "Consent"
      },
      {
            "id": "data-protection-officer",
            "title": "Data Protection Officer"
      },
      {
            "id": "update",
            "title": "Update"
      },
      {
            "id": "contact-us",
            "title": "Contact Us"
      }
],
    html: `<p>At Spoo.me, accessible from <a href="https://spoo.me">https://spoo.me</a>, one of our main priorities is the
        privacy of our visitors. This Privacy Policy document contains types of information that is collected and 
        recorded by Spoo.me and how we use it.</p>

    <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to
        contact us at <a href="mailto:support@spoo.me">support@spoo.me</a>.</p>
<h2 id="information-we-collect">Information We Collect</h2>
<h3>Account Information</h3>

    <p>When you create an account on Spoo.me, we collect:</p>
    <ul>
        <li><strong>Email address:</strong> Used for account creation, verification, and communication</li>
        <li><strong>Display name:</strong> Your chosen username for the platform</li>
        <li><strong>Password:</strong> Stored as a secure hash (we never store plain text passwords)</li>
        <li><strong>Profile picture:</strong> If provided through OAuth authentication</li>
    </ul>

    <h3>Authentication Data</h3>

    <p>We offer multiple authentication methods:</p>
    <ul>
        <li><strong>Email/Password Authentication:</strong> We store your email and password hash securely</li>
        <li><strong>OAuth Authentication:</strong> When you sign in with Google, GitHub, or Discord, we receive your email address, display name, and profile picture from these providers. We do not receive or store your passwords for these services</li>
        <li><strong>Session Cookies:</strong> Authentication cookies are used to maintain your logged-in session</li>
        <li><strong>Email Verification:</strong> We send verification codes to confirm your email address</li>
    </ul>

    <h3>User-Generated Content</h3>

    <p>When you use our services, we store:</p>
    <ul>
        <li><strong>Shortened URLs:</strong> The URLs you create, including custom aliases and target destinations</li>
        <li><strong>API Keys:</strong> Keys you generate for programmatic access to our API</li>
        <li><strong>URL Metadata:</strong> Creation dates, expiration settings, and password protection preferences</li>
    </ul>

    <h3>Usage Data and Analytics</h3>

    <p>We collect data about how you interact with our services:</p>
    <ul>
        <li><strong>Click Analytics:</strong> Anonymized data about clicks on your shortened URLs, including geographic location, device type, and referrer information</li>
        <li><strong>API Usage:</strong> Request logs for API calls made with your API keys</li>
        <li><strong>Service Usage:</strong> Feature usage patterns to improve our platform</li>
    </ul>
<h2 id="log-files">Log Files</h2>
<p>Spoo.me follows a standard procedure of using log files. These files log visitors when they visit websites.
        The information collected by log files includes internet protocol (IP) addresses, browser type, Internet 
        Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These 
        are not linked to any information that is personally identifiable except when you are logged in to your account. 
        The purpose of the information is for analyzing trends, administering the site, tracking users' movement on 
        the website, and gathering demographic information.</p>

    <p>When you visit a short URL on Spoo.me, we collect your IP address. For anonymous visitors, this data is 
        anonymized. For logged-in users, we may associate this data with your account to provide analytics for 
        your shortened URLs.</p>
<h2 id="cookies-and-web-beacons">Cookies and Web Beacons</h2>
<p>Like any other website, Spoo.me uses 'cookies'. These cookies are used to store information including
        visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is 
        used to optimize the users' experience by customizing our web page content based on visitors' browser type 
        and/or other information.</p>

    <h3>Authentication Cookies</h3>

    <p>When you log in to your account, we use the following cookies:</p>
    <ul>
        <li><strong>Access Token:</strong> A short-lived cookie that maintains your logged-in session (typically expires after 15 minutes)</li>
        <li><strong>Refresh Token:</strong> A longer-lived cookie that allows automatic session renewal (typically expires after 7 days)</li>
        <li><strong>Session Cookie:</strong> Used to maintain your login state across page visits</li>
    </ul>

    <p>These cookies are essential for the authentication functionality and cannot be disabled if you wish to use 
        account features. You can delete these cookies by logging out or clearing your browser cookies, which will 
        sign you out of your account.</p>
<h2 id="how-we-use-your-information">How We Use Your Information</h2>
<p>We use the collected information for the following purposes:</p>
    <ul>
        <li><strong>Account Management:</strong> To create, maintain, and secure your account</li>
        <li><strong>Service Provision:</strong> To provide URL shortening services and API access</li>
        <li><strong>Analytics:</strong> To provide you with statistics about your shortened URLs</li>
        <li><strong>Communication:</strong> To send important service updates, security alerts, and email verification</li>
        <li><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorized access</li>
        <li><strong>Service Improvement:</strong> To understand usage patterns and improve our platform</li>
        <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
    </ul>
<h2 id="data-sharing-and-third-parties">Data Sharing and Third Parties</h2>
<h3>OAuth Providers</h3>

    <p>When you authenticate using OAuth (Google, GitHub, or Discord), we receive limited information from these 
        providers as per their privacy policies:</p>
    <ul>
        <li><strong>Google:</strong> Email address, profile name, and profile picture</li>
        <li><strong>GitHub:</strong> Email address, username, and profile picture</li>
        <li><strong>Discord:</strong> Email address, username, and profile picture</li>
    </ul>

    <p>We do not share your Spoo.me account data back with these OAuth providers beyond what is required for 
        authentication. Please review the privacy policies of these services:
        <a href="https://policies.google.com/privacy">Google Privacy Policy</a>,
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement">GitHub Privacy Policy</a>,
        <a href="https://discord.com/privacy">Discord Privacy Policy</a>.</p>

    <h3>Third-Party Services We Use</h3>

    <p>We use the following third-party services that may collect data:</p>
    <ul>
        <li><strong>hCaptcha:</strong> Used for spam and abuse prevention. See <a href="https://www.hcaptcha.com/privacy">hCaptcha Privacy Policy</a></li>
        <li><strong>Microsoft Clarity:</strong> Used for analytics and user experience insights. See <a href="https://privacy.microsoft.com/en-us/privacystatement">Microsoft Privacy Policy</a></li>
    </ul>

    <p>We do not sell your personal data to third parties.</p>
<h2 id="privacy-policies">Privacy Policies</h2>
<p>You may consult this list to find the Privacy Policy for each of the advertising partners of Spoo.me.</p>

    <p>Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are
        used
        in their respective advertisements and links that appear on Spoo.me, which are sent directly to users'
        browser. They automatically receive your IP address when this occurs. These technologies are used to measure
        the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see
        on
        websites that you visit.</p>

    <p>Note that Spoo.me has no access to or control over these cookies that are used by third-party advertisers.
    </p>
<h2 id="data-security">Data Security</h2>
<p>We take the security of your personal information seriously and implement appropriate technical and 
        organizational measures:</p>
    <ul>
        <li><strong>Password Security:</strong> All passwords are hashed using industry-standard bcrypt algorithm before storage</li>
        <li><strong>Encryption:</strong> Data transmission is encrypted using HTTPS/TLS</li>
        <li><strong>Access Controls:</strong> Strict access controls limit who can access user data</li>
        <li><strong>Regular Security Audits:</strong> We regularly review our security practices</li>
        <li><strong>Secure Database:</strong> User data is stored in secure, access-controlled databases</li>
    </ul>

    <p>However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive 
        to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute 
        security.</p>
<h2 id="data-retention">Data Retention</h2>
<p>We retain your personal information for as long as necessary to provide our services and comply with legal 
        obligations:</p>
    <ul>
        <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after account deletion for backup and legal purposes</li>
        <li><strong>Shortened URLs:</strong> Retained indefinitely unless you delete them or they expire based on your settings</li>
        <li><strong>Analytics Data:</strong> Anonymized click data is retained to provide historical statistics</li>
        <li><strong>Log Files:</strong> Server logs are typically retained for 90 days for security and debugging purposes</li>
        <li><strong>Deleted Accounts:</strong> When you delete your account, we remove your personal information within 30 days, though some data may be retained in backups for up to 90 days</li>
    </ul>
<h2 id="your-rights-gdpr-ccpa-compliance">Your Rights (GDPR & CCPA Compliance)</h2>
<p>Depending on your location, you may have certain rights regarding your personal information:</p>

    <h3>Rights for EU Users (GDPR)</h3>
    <ul>
        <li><strong>Right to Access:</strong> You can request a copy of all personal data we hold about you</li>
        <li><strong>Right to Rectification:</strong> You can update or correct inaccurate personal information</li>
        <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You can request deletion of your personal data</li>
        <li><strong>Right to Data Portability:</strong> You can request your data in a machine-readable format</li>
        <li><strong>Right to Restrict Processing:</strong> You can request we limit how we use your data</li>
        <li><strong>Right to Object:</strong> You can object to certain types of processing</li>
        <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for data processing at any time</li>
    </ul>

    <h3>Rights for California Users (CCPA)</h3>
    <ul>
        <li><strong>Right to Know:</strong> You can request information about the personal data we collect and how we use it</li>
        <li><strong>Right to Delete:</strong> You can request deletion of your personal information</li>
        <li><strong>Right to Opt-Out:</strong> You can opt-out of the sale of personal information (note: we do not sell personal information)</li>
        <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
    </ul>

    <h3>How to Exercise Your Rights</h3>
    <p>To exercise any of these rights, you can:</p>
    <ul>
        <li>Access your account settings to update or delete your information</li>
        <li>Export your data through your dashboard</li>
        <li>Contact us at <a href="mailto:support@spoo.me">support@spoo.me</a> with your request</li>
    </ul>

    <p>We will respond to your request within 30 days. We may need to verify your identity before processing certain requests.</p>

    <h3>Lawful Basis for Processing (GDPR)</h3>
    <p>We process your personal data based on the following lawful bases:</p>
    <ul>
        <li><strong>Consent:</strong> You provide consent when creating an account and accepting this policy</li>
        <li><strong>Contract:</strong> Processing is necessary to provide the services you requested</li>
        <li><strong>Legitimate Interests:</strong> We have legitimate interests in preventing fraud and improving our services</li>
        <li><strong>Legal Obligation:</strong> We may process data to comply with legal requirements</li>
    </ul>
<h2 id="international-data-transfers">International Data Transfers</h2>
<p>Spoo.me is operated from servers that may be located in different countries. By using our service, you 
        acknowledge that your information may be transferred to and processed in countries other than your country 
        of residence. We ensure appropriate safeguards are in place for such transfers in compliance with applicable 
        data protection laws.</p>
<h2 id="email-verification-and-communications">Email Verification and Communications</h2>
<p>When you create an account, we send a verification email to confirm your email address. We may also send you:</p>
    <ul>
        <li>Security alerts and notifications</li>
        <li>Important service updates</li>
        <li>Responses to your support requests</li>
    </ul>

    <p>We do not send marketing emails. All communications are service-related and essential for account operation.</p>
<h2 id="third-party-privacy-policies">Third Party Privacy Policies</h2>
<p>Spoo.me's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to
        consult
        the respective Privacy Policies of these third-party ad servers for more detailed information. It may
        include
        their practices and instructions about how to opt-out of certain options.</p>

    <p>You can choose to disable cookies through your individual browser options. To know more detailed information
        about cookie management with specific web browsers, it can be found at the browsers' respective websites.</p>
<h2 id="analytics">Analytics</h2>
<p>We use third-party analytics tools to help us measure traffic and usage trends for the Spoo.me service. These
        tools collect information sent by your browser as part of a web page request, including the web pages you
        visit, your browser add-ons, and other information that assists us in improving the service. We may collect
        and use this analytics information together with your IP address to infer your approximate location.</p>

    <p>Specifically, we use Microsoft Clarity for insights into our website's
        usage and user experience. This tool records information about your interaction with our website, such as
        mouse clicks, mouse movements, scrolling activity, and the text you type into the website, which helps us to
        understand our users' interactions with our website and improve user experience. For more information, you
        can refer to <a href="https://privacy.microsoft.com/en-us/privacystatement">Microsoft's Privacy Policy</a>.</p>
<h2 id="personal-data">Personal Data</h2>
<p>We collect personal data necessary to provide our services, including email addresses for account creation, 
        authentication, and communication. All personal data is handled in accordance with this Privacy Policy and 
        applicable data protection laws including GDPR and CCPA. We value your privacy and implement appropriate 
        security measures to protect your personal information.</p>
<h2 id="children-s-information">Children's Information</h2>
<p>Another part of our priority is adding protection for children while using the internet. We encourage parents
        and guardians to observe, participate in, and/or monitor and guide their online activity.</p>

    <p>Spoo.me does not knowingly collect any Personal Identifiable Information from children under the age of 13.
        If
        you think that your child provided this kind of information on our website, we strongly encourage you to
        contact us immediately and we will do our best efforts to promptly remove such information from our records.
    </p>

    <p>To create an account, users must be at least 13 years of age. By creating an account, you confirm that you 
        meet this age requirement.</p>
<h2 id="changes-to-this-privacy-policy">Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, 
        operational, or regulatory reasons. When we make material changes, we will notify you by:</p>
    <ul>
        <li>Updating the "Last Updated" date at the bottom of this policy</li>
        <li>Sending an email notification to registered users (for significant changes)</li>
        <li>Displaying a notice on our website</li>
    </ul>

    <p>Your continued use of our services after any changes constitutes acceptance of the updated Privacy Policy. 
        We encourage you to review this policy periodically.</p>
<h2 id="online-privacy-policy-only">Online Privacy Policy Only</h2>
<p>This Privacy Policy applies only to our online activities and is valid for visitors to our website with
        regards
        to the information that they shared and/or collect in Spoo.me. This policy is not applicable to any
        information collected offline or via channels other than this website.</p>
<h2 id="consent">Consent</h2>
<p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions. When 
        you create an account, you explicitly consent to the collection and processing of your personal data as 
        described in this policy.</p>
<h2 id="data-protection-officer">Data Protection Officer</h2>
<p>For questions or concerns regarding data protection and privacy, you can contact our team at 
        <a href="mailto:support@spoo.me">support@spoo.me</a>. We are committed to addressing your privacy concerns 
        and ensuring compliance with applicable data protection regulations.</p>
<h2 id="update">Update</h2>
<p>This Privacy Policy was <b>last updated on Saturday, November 16th, 2025</b>. If there will be any update,
        amendment, or changes to our Privacy Policy then these will be posted on this page.</p>
<h2 id="contact-us">Contact Us</h2>
<p>If you have any questions about this Privacy Policy, wish to exercise your data rights, or have concerns 
        about how we handle your personal information, you can contact us:</p>
    <ul>
        <li>Email: <a href="mailto:support@spoo.me">support@spoo.me</a></li>
        <li>For GDPR-related requests: Please specify "GDPR Request" in your subject line</li>
        <li>For CCPA-related requests: Please specify "CCPA Request" in your subject line</li>
    </ul>

    <p>We will respond to your inquiry within 30 days.</p>`,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    lastUpdated: "November 16, 2025",
    description: "The rules of using spoo.me, in plain language where possible.",
    toc: [
      {
            "id": "account-registration-and-eligibility",
            "title": "Account Registration and Eligibility"
      },
      {
            "id": "account-security-and-responsibilities",
            "title": "Account Security and Responsibilities"
      },
      {
            "id": "api-usage-terms-and-limitations",
            "title": "API Usage Terms and Limitations"
      },
      {
            "id": "user-content-and-intellectual-property",
            "title": "User Content and Intellectual Property"
      },
      {
            "id": "account-termination-and-suspension",
            "title": "Account Termination and Suspension"
      },
      {
            "id": "service-modifications-and-availability",
            "title": "Service Modifications and Availability"
      },
      {
            "id": "cookies",
            "title": "Cookies"
      },
      {
            "id": "license",
            "title": "License"
      },
      {
            "id": "hyperlinking-to-our-content",
            "title": "Hyperlinking to our Content"
      },
      {
            "id": "prohibited-uses",
            "title": "Prohibited Uses"
      },
      {
            "id": "iframes",
            "title": "iFrames"
      },
      {
            "id": "content-liability",
            "title": "Content Liability"
      },
      {
            "id": "reservation-of-rights",
            "title": "Reservation of Rights"
      },
      {
            "id": "removal-of-links-from-our-website",
            "title": "Removal of links from our website"
      },
      {
            "id": "disclaimer",
            "title": "Disclaimer"
      },
      {
            "id": "governing-law-and-dispute-resolution",
            "title": "Governing Law and Dispute Resolution"
      },
      {
            "id": "severability",
            "title": "Severability"
      },
      {
            "id": "contact-and-legal-notices",
            "title": "Contact and Legal Notices"
      },
      {
            "id": "updates-to-terms",
            "title": "Updates to Terms"
      }
],
    html: `<p>Welcome to spoo.me!</p>

<p>These terms of service outline the rules and regulations for the use of spoo.me's Website, located at
    https://spoo.me.</p>

<p>By accessing this website we assume you accept these terms of service. Do not continue to use spoo.me if you do
    not agree to take all of the terms of service stated on this page.</p>

<p>The following terminology applies to these Terms of Service, Privacy Statement and Disclaimer Notice and all
    Agreements: "Client", "You" and "Your" refers to you, the person log on this website and compliant to the Company's
    terms of service. "The Company", "Ourselves", "We", "Our" and "Us", refers to our Company. "Party", "Parties",
    or "Us", refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of
    payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the
    express purpose of meeting the Client's needs in respect of provision of the Company's stated services, in
    accordance with and subject to, prevailing law of Netherlands. Any use of the above terminology or other words in
    the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring
    to same.</p>
<h2 id="account-registration-and-eligibility">Account Registration and Eligibility</h2>
<p>To access certain features of spoo.me, you may be required to create an account. When creating an account, you 
    agree to:</p>

<ul>
    <li>Provide accurate, current, and complete information during registration</li>
    <li>Maintain and promptly update your account information</li>
    <li>Be at least 13 years of age to create an account</li>
    <li>Be responsible for maintaining the confidentiality of your account credentials</li>
    <li>Be responsible for all activities that occur under your account</li>
    <li>Notify us immediately of any unauthorized access or security breach</li>
    <li>Not share your account credentials with others</li>
    <li>Not create multiple accounts to circumvent restrictions or limitations</li>
</ul>

<p>You may create an account using email/password authentication or through third-party OAuth providers (Google, 
    GitHub, Discord). By using OAuth authentication, you agree to the terms and privacy policies of those respective 
    providers.</p>

<p>We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion, including 
    if we believe you have violated these Terms of Service.</p>
<h2 id="account-security-and-responsibilities">Account Security and Responsibilities</h2>
<p>You are responsible for:</p>

<ul>
    <li>Maintaining the security of your account password and credentials</li>
    <li>All activities and content posted under your account</li>
    <li>Ensuring your account is not used for prohibited purposes</li>
    <li>Complying with all applicable laws when using our services</li>
    <li>Not attempting to gain unauthorized access to other accounts or our systems</li>
</ul>

<p>We recommend that you:</p>
<ul>
    <li>Use a strong, unique password for your spoo.me account</li>
    <li>Enable email verification to secure your account</li>
    <li>Do not use automated tools to create or manage accounts without our permission</li>
    <li>Keep your email address up to date for important security notifications</li>
</ul>
<h2 id="api-usage-terms-and-limitations">API Usage Terms and Limitations</h2>
<p>When using our API services, you agree to:</p>

<ul>
    <li>Use API keys only for authorized purposes</li>
    <li>Keep your API keys confidential and secure</li>
    <li>Respect rate limits and usage quotas</li>
    <li>Not use the API to create spam, malware, or phishing URLs</li>
    <li>Not attempt to circumvent API limitations or security measures</li>
    <li>Not resell or redistribute API access without authorization</li>
    <li>Not use the API in a way that could damage, disable, or impair our services</li>
</ul>

<p>API rate limits and usage policies:</p>
<ul>
    <li>We may impose rate limits on API requests to ensure fair usage</li>
    <li>Excessive or abusive API usage may result in temporary or permanent suspension</li>
    <li>We reserve the right to modify API features, endpoints, or access at any time</li>
    <li>API keys may be revoked if they are used in violation of these terms</li>
</ul>
<h2 id="user-content-and-intellectual-property">User Content and Intellectual Property</h2>
<p>When you create shortened URLs on spoo.me:</p>

<ul>
    <li>You retain ownership of the destination URLs and any content you link to</li>
    <li>You grant spoo.me a non-exclusive license to store and display your shortened URLs</li>
    <li>You are responsible for ensuring you have the right to share the destination URLs</li>
    <li>You agree not to create URLs that infringe on intellectual property rights of others</li>
    <li>Custom aliases you create are subject to our approval and availability</li>
</ul>

<p>spoo.me retains ownership of:</p>
<ul>
    <li>The spoo.me platform, software, and infrastructure</li>
    <li>The shortened URL format and routing system</li>
    <li>Analytics and aggregate usage data</li>
    <li>Our trademarks, logos, and branding</li>
</ul>
<h2 id="account-termination-and-suspension">Account Termination and Suspension</h2>
<p>We may suspend or terminate your account if:</p>

<ul>
    <li>You violate these Terms of Service</li>
    <li>You engage in abusive or fraudulent behavior</li>
    <li>You create URLs for prohibited content (malware, phishing, illegal content)</li>
    <li>Your account is used to spam or harass others</li>
    <li>You attempt to circumvent security measures or rate limits</li>
    <li>Your account remains inactive for an extended period (we will notify you first)</li>
    <li>Required by law or regulatory authority</li>
</ul>

<p>Upon account termination:</p>
<ul>
    <li>Your access to account features will be immediately revoked</li>
    <li>Your shortened URLs may be disabled or removed</li>
    <li>Your API keys will be revoked</li>
    <li>You may request data export before termination if you voluntarily delete your account</li>
</ul>

<p>You may voluntarily delete your account at any time through your account settings. Account deletion is permanent 
    and cannot be reversed.</p>
<h2 id="service-modifications-and-availability">Service Modifications and Availability</h2>
<p>We reserve the right to:</p>

<ul>
    <li>Modify, suspend, or discontinue any aspect of the service at any time</li>
    <li>Change features, functionality, or pricing with reasonable notice</li>
    <li>Impose limits on certain features or restrict access to parts of the service</li>
    <li>Update these Terms of Service (notice will be provided for material changes)</li>
</ul>

<p>We strive to provide reliable service, but we do not guarantee:</p>
<ul>
    <li>Uninterrupted or error-free service</li>
    <li>That the service will meet all your specific requirements</li>
    <li>That all bugs or defects will be corrected</li>
    <li>Permanent storage of any particular shortened URL</li>
</ul>

<p>Scheduled maintenance and updates will be announced when possible.</p>
<h2 id="cookies">Cookies</h2>
<p>We employ the use of cookies. By accessing spoo.me, you agreed to use cookies in agreement with the spoo.me's Privacy
    Policy.</p>

<p>Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our
    website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our
    affiliate/advertising partners may also use cookies.</p>
<h2 id="license">License</h2>
<p>Unless otherwise stated, spoo.me and/or its licensors own the intellectual property rights for all material on
    spoo.me. All intellectual property rights are reserved. You may access this from spoo.me for your own personal use
    subjected to restrictions set in these terms of service.</p>

<p>You must not:</p>
<ul>
    <li>Republish material from spoo.me</li>
    <li>Sell, rent or sub-license material from spoo.me</li>
    <li>Reproduce, duplicate or copy material from spoo.me</li>
    <li>Redistribute content from spoo.me</li>
</ul>

<p>This Agreement shall begin on the date hereof.</p>

<p>Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas
    of the website. spoo.me does not filter, edit, publish or review Comments prior to their presence on the website.
    Comments do not reflect the views and opinions of spoo.me,its agents and/or affiliates. Comments reflect the views
    and opinions of the person who post their views and opinions. To the extent permitted by applicable laws, spoo.me
    shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of
    any use of and/or posting of and/or appearance of the Comments on this website.</p>

<p>spoo.me reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate,
    offensive or causes breach of these Terms of Service.</p>

<p>You warrant and represent that:</p>

<ul>
    <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;</li>
    <li>The Comments do not invade any intellectual property right, including without limitation copyright, patent or
        trademark of any third party;</li>
    <li>The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful material which
        is an invasion of privacy</li>
    <li>The Comments will not be used to solicit or promote business or custom or present commercial activities or
        unlawful activity.</li>
</ul>

<p>You hereby grant spoo.me a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and
    edit any of your Comments in any and all forms, formats or media.</p>
<h2 id="hyperlinking-to-our-content">Hyperlinking to our Content</h2>
<p>The following organizations may link to our Website without prior written approval:</p>

<ul>
    <li>Government agencies;</li>
    <li>Search engines;</li>
    <li>News organizations;</li>
    <li>Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of
        other listed businesses; and</li>
    <li>System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and
        charity fundraising groups which may not hyperlink to our Web site.</li>
</ul>

<p>These organizations may link to our home page, to publications or to other Website information so long as the link:
    (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking
    party and its products and/or services; and (c) fits within the context of the linking party's site.</p>

<p>We may consider and approve other link requests from the following types of organizations:</p>

<ul>
    <li>commonly-known consumer and/or business information sources;</li>
    <li>dot.com community sites;</li>
    <li>associations or other groups representing charities;</li>
    <li>online directory distributors;</li>
    <li>internet portals;</li>
    <li>accounting, law and consulting firms; and</li>
    <li>educational institutions and trade associations.</li>
</ul>

<p>We will approve link requests from these organizations if we decide that: (a) the link would not make us look
    unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records
    with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of spoo.me; and (d) the
    link is in the context of general resource information.</p>

<p>These organizations may link to our home page so long as the link: (a) is not in any way deceptive; (b) does not
    falsely imply sponsorship, endorsement or approval of the linking party and its products or services; and (c) fits
    within the context of the linking party's site.</p>

<p>If you are one of the organizations listed in paragraph 2 above and are interested in linking to our website, you
    must inform us by sending an e-mail to spoo.me. Please include your name, your organization name, contact
    information as well as the URL of your site, a list of any URLs from which you intend to link to our Website, and a
    list of the URLs on our site to which you would like to link. Wait 2-3 weeks for a response.</p>

<p>Approved organizations may hyperlink to our Website as follows:</p>

<ul>
    <li>By use of our corporate name; or</li>
    <li>By use of the uniform resource locator being linked to; or</li>
    <li>By use of any other description of our Website being linked to that makes sense within the context and format of
        content on the linking party's site.</li>
</ul>

<p>No use of spoo.me's logo or other artwork will be allowed for linking absent a trademark license agreement.</p>
<h2 id="prohibited-uses">Prohibited Uses</h2>
<p>Users are strictly prohibited from using spoo.me to shorten, distribute, or promote URLs that:</p>

<ul>
    <li>Lead to phishing, malware, or deceptive websites.</li>
    <li>Facilitate unsolicited bulk messaging (spam) or other forms of commercial abuse.</li>
    <li>Circumvent or attempt to bypass filters or URL scanning services such as Spamhaus, Google Safe Browsing, PhishTank, or similar.</li>
    <li>Promote or distribute illegal content or violate applicable laws or regulations.</li>
    <li>Attempt to exploit newly created URLs to evade detection by standard anti-spam or anti-phishing databases.</li>
</ul>

<p>spoo.me reserves the right to block, remove, or report any such URLs at our discretion, even if they are not yet flagged by external detection systems.</p>
<h2 id="iframes">iFrames</h2>
<p>Without prior approval and written permission, you may not create frames around our Webpages that alter in any way
    the visual presentation or appearance of our Website.</p>
<h2 id="content-liability">Content Liability</h2>
<p>We shall not be hold responsible for any content that appears on your Website. You agree to protect and defend us
    against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted
    as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other
    violation of, any third party rights.</p>
<h2 id="reservation-of-rights">Reservation of Rights</h2>
<p>We reserve the right to request that you remove all links or any particular link to our Website. You approve to
    immediately remove all links to our Website upon request. We also reserve the right to amen these terms and
    conditions and it's linking policy at any time. By continuously linking to our Website, you agree to be bound to and
    follow these linking terms of service.</p>
<h2 id="removal-of-links-from-our-website">Removal of links from our website</h2>
<p>If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any
    moment. We will consider requests to remove links but we are not obligated to or so or to respond to you directly.
</p>

<p>We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor
    do we promise to ensure that the website remains available or that the material on the website is kept up to date.
</p>
<h2 id="disclaimer">Disclaimer</h2>
<p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating
    to our website and the use of this website. Nothing in this disclaimer will:</p>

<ul>
    <li>limit or exclude our or your liability for death or personal injury;</li>
    <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
    <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
    <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
</ul>

<p>The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject
    to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities
    arising in contract, in tort and for breach of statutory duty.</p>

<p>As long as the website and the information and services on the website are provided free of charge, we will not be
    liable for any loss or damage of any nature.</p>
<h2 id="governing-law-and-dispute-resolution">Governing Law and Dispute Resolution</h2>
<p>These Terms of Service shall be governed by and construed in accordance with the laws of the Netherlands, without 
    regard to its conflict of law provisions.</p>

<p>Any disputes arising from these terms or your use of spoo.me shall be resolved through:</p>
<ul>
    <li>First, good faith negotiation between you and spoo.me</li>
    <li>If negotiation fails, through binding arbitration or competent courts in the Netherlands</li>
</ul>

<p>For EU users, this does not affect your rights under applicable consumer protection laws in your country of 
    residence.</p>
<h2 id="severability">Severability</h2>
<p>If any provision of these Terms of Service is found to be unenforceable or invalid, that provision will be limited 
    or eliminated to the minimum extent necessary so that these Terms of Service will otherwise remain in full force 
    and effect.</p>
<h2 id="contact-and-legal-notices">Contact and Legal Notices</h2>
<p>For questions about these Terms of Service or to report violations, contact us at:</p>
<ul>
    <li>Email: <a href="mailto:support@spoo.me">support@spoo.me</a></li>
    <li>For legal notices: Please specify "Legal Notice" in your subject line</li>
</ul>
<h2 id="updates-to-terms">Updates to Terms</h2>
<p>These Terms of Service were <b>last updated on Saturday, November 16th, 2025</b>.</p>

<p>We may update these terms from time to time. When we make material changes, we will notify you by:</p>
<ul>
    <li>Updating the "last updated" date</li>
    <li>Sending an email to registered users (for significant changes)</li>
    <li>Displaying a notice on our website</li>
</ul>

<p>Your continued use of spoo.me after changes take effect constitutes acceptance of the updated terms.</p>`,
  },
]
