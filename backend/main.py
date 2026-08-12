# Tugas 2, Dhiya Salma Salsabila
from services.trip_service import calculate_budget, get_trip_category, recomendation_destination, get_travel_season

def print_trip_summary():
    #destination = input("Destination : ")
    country = input("Choose country (japan, amerika, indonesia) : ")
    days = int(input("Days : "))
    budget = int(input("Budget : "))
    currency = input("Currency : ")
    hotel_cost = float(input("Hotel Cost per Day : "))
    transportation_cost = float(input("Transportation cost per Day : "))
    food_cost =  float(input("Food Cost per Day: "))
    micellaneous_cost =  float(input("Micellaneous Cost : "))
    travel_month = input("Travel Month : ")
    #total_estimated_cost = ((hotel_cost + transportation_cost + food_cost)*days)+micellaneous_cost
    budget_perday, total_estimated_cost, rest_budget = calculate_budget(days, budget, hotel_cost, transportation_cost, food_cost)
    print("=================================")
    print("KelanaAi")
    print("=================================")
    #print(f"Destination : {destination}")
    print(f"Country :  {country}")
    print(f"Days : {days}")
    print(f"Budget : {budget}")
    print(f"Currency : {currency}")
    print(f"Hotel Cost Per Day : {hotel_cost}")
    print(f"Transportation cost Per Day : {transportation_cost}")
    print(f"Food Cost Per Day : {food_cost}")
    print(f"Micellaneous Cost : {micellaneous_cost}")
    print(f"Travel Month : {travel_month}")
    season = get_travel_season(travel_month)
    print(f"Season : {season}")
    print(f"Budget Per Day : {budget_perday}")
    print(f"Total Estimated Cost Per Day : {total_estimated_cost}")
    print(f"Rest of Money : {rest_budget-micellaneous_cost}")
    category, transportation = get_trip_category(budget)
    print(f"Travel Category : {category}")
    print(f"Transportation : {transportation}")
    recomendation_destination(country)
    if rest_budget < 0:
        print ("Budget Exceeded!")
    else:
        print("Have a good travel!")
    

if __name__ == "__main__":
    print_trip_summary()