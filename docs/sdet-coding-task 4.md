# 🧪 Polaris SDET Take Home Coding Challenge

## Overview

We would like you to **design** and **implement** an automated test suite for the sample web application available at:

👉 [https://practicesoftwaretesting.com/](https://practicesoftwaretesting.com/)

You will also be provided with a **separate version of the site** that contains **intentional bugs**.  
Your job is not only to automate tests — but also to identify and report any **defects** your tests uncover.

🐞 [https://with-bugs.practicesoftwaretesting.com/](https://with-bugs.practicesoftwaretesting.com/)

For more information on the site, including user logins, please refer to the GitHub repository:

👉 [https://github.com/testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing)

## 🎯 Objective

You will:
1. Review the provided **user stories**
2. Design and implement an **automated test suite** for them
3. Run your tests against both:
   - The **main site** (expected to pass)
   - The **bug-ridden site** (expected to fail)
4. Analyse and document the **failures** you find

We are looking for you to demonstrate your ability to write clean, reliable and maintainable test suites from scratch. 

## 🧰 Requirements

#### 1. Framework & Language
- You can use **Cypress** or **Playwright** 
- But you **must** use **TypeScript**

#### 2. Test Coverage
Your tests should:
- **Have a 100% pass rate on the main site**
- Include at least: 
    - One **positive** test per story (happy path)
    - One **negative** or **edge-case** test per user story
- Be reliable and produce consistent results across multiple runs
- Have meaningful and practical assertions

#### 3. Test Structure & Design
- Use a **clear** and **maintainable** structure
- Organise tests logically
- Include clear and meaningful test names and descriptions

#### 4. Test Data
It is up to you how you store and generate data needed for certain tests but it must be clear and please **do not** use real data.

#### 5. Reporting
- You must include a **test report** (HTML or CLI summary is fine) for your ran test suite

#### 6. Bug Handling & Reporting
Since the buggy version will fail some tests:
- Do **not** “fix” your tests to make them pass on the buggy site  
- Instead:
  - Let the tests **fail naturally**
  - **Document** which tests failed and why (based on your analysis)
  - Add a short **Bug Report Summary** in your `README.md` or a separate `BUGS.md` file:
    - Steps to reproduce
    - Expected vs actual behavior


#### 7. Setup & Documentation
Include a **README.md** file with:
- How to install and run tests
- Frameworks and libraries used
- Known issues or limitations
- How to switch between the **main** and **buggy** site URLs depending on the implementation

## 🕒 Time Expectation

Approx. **2-4 hours** for the base task, an additional **1 hour** if you are completing the API tests too.
Focus on **test design and reasoning**, if this means you don't complete all the user stories, that is acceptable. 

We would rather you focused on **quality over quantity**, so be sure to focus on writing high-quality tests over dozens of tests.

## 📝 User Stories

#### **1. View Product Details**
**As a visitor**, I want to view detailed information about a specific tool so that I can learn more before purchasing.  
**Acceptance Criteria:**
* Clicking a product opens its detail page.
* The page displays name, description, price, and image.
* The “Add to Cart” button is visible and enabled.

#### **2. User story: View invoice after purchase**
**As a logged-in user** I would like to check my invoice after completing a purchase
**Acceptance Criteria:**
* User is able to purchase a product
* Cart is cleared after checkout
* Invoice number is shown after checkout
* Details in invoice are correct (e.g. address, amount paid, etc)

#### **3. User story: Filter products and pagination**
**As a customer** I would like to filter the products
**Acceptance Criteria:**
* Category filters (e.g., “Hand Tools”, “Power Tools”) are displayed.
* Selecting a category updates the product list.
* Clearing the filter shows all products again.
* Each product links to a detailed product page.
* Pagination or scrolling works correctly to show more products.

#### **4. User story: Update fields in account profile**
**As a newly registered user**, I would like to login and update my account information
**Acceptance Criteria:**
* All field's have correct validation (Ignore DOB since there is a known issue)
* Valid credentials allow successful login and display the correct user’s name.
* Invalid credentials display an appropriate error message.
* Login persists during navigation until logout.
* Updated fields reflect in other places, e.g. homepage and checkout page


## 🌐 API Testing (Optional Extension)

In addition to the UI automation requirements, you may choose to include **API-level tests** that complement your user stories.

These tests are not mandatory, but they may help to demonstrate your skills. If you do opt to do this, please include them in your
tests.

### Objectives
- Validate key backend endpoints that support your user stories
- Confirm that **UI and API data** are consistent
- Showcase how you would **integrate UI and API testing** in a single framework or pipeline

### Expectations
- You may use built-in capabilities from Playwright i.e.
  - `request` fixture or `APIRequestContext` in **Playwright**
  - `cy.request()` in **Cypress**
  - Or if there any additional packages that you are familiar with that you might like to use.
- Include your API tests in a clear folder
- Include test data and environment configuration as needed
- Document how to run the API tests in your `README.md`


**Good luck, and happy testing!**

