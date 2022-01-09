from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.support.ui import WebDriverWait
from bs4 import BeautifulSoup

# configure Chrome Webdriver
def configure_chrome_driver():
    # Add additional Options to the webdriver
    chrome_options = ChromeOptions()
    # add the argument and make the browser Headless.
    chrome_options.add_argument("--headless")
    # Instantiate the Webdriver: Mention the executable path of the webdriver you have downloaded
    # if driver is in PATH, no need to provide executable_path
    driver = webdriver.Chrome(executable_path="./chromedriver.exe", options = chrome_options)
    return driver

# configure Firefox Driver
def configure_firefox_driver():
    # Add additional Options to the webdriver
    firefox_options = FirefoxOptions()
    # add the argument and make the browser Headless.
    firefox_options.add_argument("--headless")

    # Instantiate the Webdriver: Mention the executable path of the webdriver you have downloaded
    # if driver is in PATH, no need to provide executable_path
    driver = webdriver.Firefox(options = firefox_options)
    return driver

def getCourses(driver, search_keyword):
    # Step 1: Go to pluralsight.com
    driver.get(f"https://www.pluralsight.com/search?q={search_keyword}&categories=course")
    WebDriverWait(driver, 5).until(
        lambda s: s.find_element_by_id("search-results-category-target").is_displayed()
    )
    
    # Load all the page data, by clicking Load More button again and again
    # loadAllContent(driver) # Uncomment me for loading all the content of the page
    
    # Step 2: Create a parse tree of page sources after searching
    soup = BeautifulSoup(driver.page_source,  "html.parser")
    
    # Step 3: Iterate over the search result and fetch the course
    for course_page in soup.select("div.search-results-page"):
        for course in course_page.select("div.search-result"):
            # selectors for the required information
            title_selector = "div.search-result__info div.search-result__title a"
            author_selector = "div.search-result__details div.search-result__author"
            level_selector = "div.search-result__details div.search-result__level"
            length_selector = "div.search-result__details div.search-result__length"
            print({
                "title": course.select_one(title_selector).text,
                "author": course.select_one(author_selector).text,
                "level": course.select_one(level_selector).text,
                "length": course.select_one(length_selector).text,
            })
            
# Driver code
# create the driver object.
driver = configure_firefox_driver()
search_keyword = "Machine Learning"
getCourses(driver, search_keyword)
# close the driver.
driver.close()