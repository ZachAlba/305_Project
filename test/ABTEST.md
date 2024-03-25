# A/B Testing

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


## A/B Test Name: Personalized Music Recommendations for Increased Retention

User Story Number:  4
Metric (from the HEART grid): Retention

**Hypothesis:** Users are more likely to return to the app if they receive personalized music recommendations that resonate with their tastes. We believe that implementing an enhanced algorithm for music suggestions will increase user retention rates, as users will find more value in the app's ability to discover new music tailored to their preferences.

**Problem:** Current user retention rates are below our target goal, indicating that users are not finding enough value to return to the app regularly.
**Impact:** By improving the personalization of music recommendations, we aim to create a more engaging experience that will make users more likely to come back, thereby increasing our retention rate.
Experiment:
**Setup:** Implement two versions of the recommendation engine: the existing one (Control) and the new enhanced algorithm (Variant).
**Audience:** A random selection of 50% of existing users will experience the new algorithm to compare their retention rates against those who continue with the current version.
**Rationale:** The test is conducted with existing users to directly measure the impact on retention, avoiding confounding factors that could affect new users' behaviors.
**Tracking:** Monitor how often users return to the app over a 30-day period using Firebase Analytics and compare the frequency of sessions between the two groups.
**Variations:**
Control (A): The existing recommendation engine currently in use.
Variant (B): The new algorithm designed to enhance personalization based on individual user behavior and feedback.
**Design Work:**
Include details about the recommendation engine changes.
Provide any UI/UX mockups that might change as a result of the new recommendation system, such as new sections on the app's homepage or changes in how recommendations are displayed.
