# Tugas 1, Dhiya Salma Salsabila

def print_trip_summary():
    destination = input("Destination : ")
    country = input("Country : ")
    days = int(input("Days : "))
    budget = int(input("Budget : "))
    currency = input("Currency : ")
    hotel_cost = float(input("Hotel Cost per Day : "))
    transportation_cost = float(input("Transportation cost per Day : "))
    food_cost =  float(input("Food Cost per Day: "))
    micellaneous_cost =  float(input("Micellaneous Cost : "))
    travel_month = input("Travel Month : ")
    total_estimated_cost = ((hotel_cost + transportation_cost + food_cost)*days)+micellaneous_cost
    print("=================================")
    print("KelanaAi")
    print("=================================")
    print(f"Destination : {destination}")
    print(f"Country :  {country}")
    print(f"Days : {days}")
    print(f"Budget : {budget}")
    print(f"Currency : {currency}")
    print(f"Hotel Cost : {hotel_cost}")
    print(f"Transportation cost : {transportation_cost}")
    print(f"Food Cost : {food_cost}")
    print(f"Micellaneous Cost : {micellaneous_cost}")
    print(f"Travel Month : {travel_month}")
    if budget < total_estimated_cost:
        print ("Budget Exceeded!")
    else:
        print("Have a good travel!")

if __name__ == "__main__":
    print_trip_summary()