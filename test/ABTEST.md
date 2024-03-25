# A/B Testing

## A/B Test Name: Personalized Playlists

User Story: 4

Metric (from the HEART grid): Happiness

**Hypthesis:** Users will experience increased satisfaction with the music discovery and sharing experience if we introduce personalized playlists based on their listening preferences.

**Problem:** Users on music platforms are finding it difficult to discover new music that aligns with their tastes and preferences. The existing recommendation system lacks personalization and fails to engage users effectively, leading to decreased satisfaction and retention rates.

**Impact:** By implementing personalized playlists, we aim to address the user dissatisfaction with music discovery, ultimately leading to increased user satisfaction, longer user engagement sessions, and higher retention rates. This improvement in user experience will lead to positive reviews, higher ratings, and a greater likelihood of users recommending our platform to others.

**Experiment:**
  -Setup: Implement a new feature within the music platform that offers personalized playlists to users based on their listening preferences and history. This feature will be prominently displayed on the platform's homepage and accessible via a dedicated section in the app.

  -Audience: The experiment will target all active users of the music platform who have a sufficient listening history to enable personalized playlist generation. Users will be divided based on usage patterns, preferences, and engagement levels.

  -Rational: The rationale behind this experiment is to address the current user dissatisfaction with the music discovery process by providing personalized recommendations tailored to their individual tastes. By offering curated playlists that align with each users preferences, we can increase engagement, satisfaction, and retention on the platform.

  -Tracking: We will track user engagement, retention rates, and satisfaction based on NPS scoring.
  
  -Variations: The two variation we will have are the users who have the personalized playlists and the users who who will continue to use the previous system. (control group)
  
  -Design Work: Design the user interface for displaying personalized playlists. Conduct user testing and iterate on the design based on feedback to optimize the user experience and effectiveness of personalized playlists.
  

## A/B Test Name: Enhanced Discovery Experience

User Story Number: 4

Metric (from the HEART grid): Engagement

**Hypothesis:** Users are not engaging deeply with the music discovery feature, potentially due to an interface that doesn't effectively highlight new and interesting content. By redesigning the discovery page to emphasize personalized recommendations and newly released music, we expect to see an increase in user engagement as reflected by time spent on the app and the frequency of user posts.

**Problem:** Data shows that users are not spending much time on the discovery page and are not interacting with new music suggestions.

**Impact:** If users engage more with personalized content, this should increase their time spent on the app and lead to more interactions, thereby enhancing the overall user engagement.

**Experiment:**
Setup: Implement two versions of the discovery page: the current version (Control) and the new personalized recommendation design (Variant).
Audience: Randomly assign 50% of existing users to the new design to measure the effect on users already familiar with the platform.
Rationale: Targeting existing users allows us to measure changes in behavior due to the new design, as these users have established usage patterns.
Tracking: Using Firebase Analytics, measure the time spent on the discovery page and the frequency of user posts about new music for both groups.

**Variations:** 
Control (A): The existing music discovery page.
Variant (B): A redesigned discovery page that features a more personalized approach to music recommendations and new releases.

**Design Work:**
Include mockups of both the current and proposed discovery page designs.
Highlight the differences in layout and how new elements are expected to attract and retain user attention.


## A/B Test Name: Dark Mode Impact on User Adoption

User Story Number:  4
Metric (from the HEART grid): Adoption

**Hypothesis:** Users prefer apps with customizable interfaces that can be adjusted based on their environment or personal preference. By introducing a dark mode feature, and showing this as a preview when users see the app on the App Store, we anticipate that new users will be more likely to adopt the app as their primary music review platform. This is based on the assumption that dark mode will reduce eye strain and battery usage, leading to longer engagement periods and a preference for the app in low-light environments.

**Problem:** Feedback suggests that users are less likely to use the app in low-light conditions or for extended periods due to the brightness of the light mode. This could be impacting the adoption rate of new users.
**Impact:** If the dark mode is preferred by users, we expect to see an increase in the adoption rate, particularly among users who frequently use their devices in low-light settings.
Experiment:
**Setup:** Introduce a dark mode option in the app settings. Conduct an A/B test where half of the users see a preview of dark mode when browsing the app's description on the store. Also, split the default dark and light mode 50/50 as well to gauge this against retention.
**Audience:** New users within the first week of the app's installation.
**Rationale:** Focusing on new users allows us to measure the dark mode's impact on the initial adoption phase.
**Tracking:** Monitor the number of new signups who downloaded the app after viewing the preview of each mode in the App Store.
**Variations:**
Control (A): The app in light mode (the current default setting).
Variant (B): The app with a dark mode enabled by default.
**Design Work:**
Provide visuals for both light and dark mode interfaces.
Clearly identify any UI elements that change between modes, such as text color, background color, and iconography
