def calculate_budget(days: int, budget: float, hotel_cost: float, transportation_cost: float, food_cost: float):
    if days <= 0:
        raise ValueError("Jumlah hari harus lebih dari 0")
    budget_perday = budget / days
    total_estimated_cost = hotel_cost + transportation_cost + food_cost
    rest_budget = budget - (total_estimated_cost * days)
    return budget_perday, total_estimated_cost, rest_budget

def get_trip_category(daily_budget: float, currency: str = "IDR"):
    thresholds = {
        "IDR": [500000, 2500000],  # Backpacker < 500rb, Standard <= 2.5jt
        "USD": [50, 200],          # Backpacker < $50, Standard <= $200
        "EUR": [45, 180],          # Backpacker < €45, Standard <= €180
        "JPY": [7500, 30000],      # Backpacker < ¥7500, Standard <= ¥30000
        "SGD": [70, 250],          # Backpacker < $70, Standard <= $250
        "MYR": [200, 800]          # Backpacker < RM200, Standard <= RM800
    }
    
    limits = thresholds.get(currency.upper(), thresholds["IDR"])
    
    if daily_budget < limits[0]:
        return "Backpacker", "Bus/Train"
    elif daily_budget <= limits[1]:
        return "Standard", "Train/Flight"
    else:
        return "Luxury", "Private Transfer/Flight"

def recomendation_destination(country: str) -> list:
    japan = ["tokyo", "shibuya", "akihabara", "kyoto", "osaka"]
    amerika = ["new york", "los angeles", "chicago", "michigan", "oregon"]
    indonesia = ["bandung", "jakarta", "semarang", "malang", "yogyakarta"]
    country = country.lower()
    if country == "japan":
        return japan
    elif country == "amerika":
        return amerika
    else:
        return indonesia

def get_travel_season(travel_month):
    if travel_month == "December":
        return("Peak Season")
    elif travel_month == "June":
        return("Holiday Season")
    else:
        return("Regular Season")