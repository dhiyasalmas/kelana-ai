def calculate_budget(days, budget, hotel_cost, transportation_cost, food_cost):
    budget_perday = budget/days
    total_estimated_cost = ((hotel_cost + transportation_cost + food_cost)) # Cost per day
    rest_budget = budget - (total_estimated_cost*days)
    return budget_perday, total_estimated_cost, rest_budget

def get_trip_category(budget):
    if budget < 1000:
        return "Backpacker", "Bus"
    elif budget <= 3000:
        return "Standard", "Train"
    else:
        return "Luxury", "Flight"

def recomendation_destination(country):
    japan = ["tokyo", "shibuya", "akihabara", "kyoto", "osaka"]
    amerika = ["new york", "los angles", "chicago", "michigan", "oregon"]
    indonesia = ["bandung", "jakarta", "semarang", "malang", "yogyakarta"]
    country = country.lower()
    print("Recommended Places")
    if country == "japan":
        for place in japan:
            print(f"- {place}")
    elif country == "amerika":
        for place in amerika:
            print(f"- {place}")
    else:
        for place in indonesia:
            print(f"- {place}")

def get_travel_season(travel_month):
    if travel_month == "December":
        return("Peak Season")
    elif travel_month == "June":
        return("Holiday Season")
    else:
        return("Regular Season")