import { TicketPriceApi } from "./external/ticket-price.service";
import { DiscountCard, InvalidTripInputException, TripRequest} from "./model/trip.request";

export class TrainTicketEstimator {

    constructor(private readonly ticketPriceApi: TicketPriceApi) {}

    async estimate(trainDetails: TripRequest): Promise<number> {
        const passengers = trainDetails.passengers;
        const tripDetails = trainDetails.details;
        
        const basicRate = await this.ticketPriceApi.getBasicRate(tripDetails);

        if (!passengers.length) {
            return 0;
        }

        if (!tripDetails.from.trim()) {
            throw new InvalidTripInputException("Start city is invalid");
        }

        if (!tripDetails.to.trim()) {
            throw new InvalidTripInputException("Destination city is invalid");
        }

        if (tripDetails.when < new Date()) {
            throw new InvalidTripInputException("Date is invalid");
        }

        let total = 0;
        for (const passenger of passengers) {
            let passengerRate = basicRate;

            if (passenger.age < 0) {
                throw new InvalidTripInputException("Age is invalid");
            }

            if (passenger.age < 1) {
                continue;
            }
            else if (passenger.age <= 17) {
                passengerRate *= 0.6;
            } else if(passenger.age >= 70) {
                passengerRate *= 0.8;
                if (passenger.discounts.includes(DiscountCard.Senior)) {
                    passengerRate -= basicRate * 0.2;
                }
            } else {
                passengerRate *= 1.2;
            }
            
            const daysUntilTrip = Math.ceil(
                (tripDetails.when.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            if (passenger.age > 1 && passenger.age < 4) {
                passengerRate = 9;
            } else if (passenger.discounts.includes(DiscountCard.TrainStroke)) {
                passengerRate = 1;
            } else if (daysUntilTrip >= 30) {
                passengerRate -= basicRate * 0.2;
            } else if (daysUntilTrip >= 5) {
                passengerRate += (20 - daysUntilTrip) * 0.02 * basicRate;
            } else {
                passengerRate += basicRate;
            }

            total += passengerRate;

        }

        const isACouple = passengers.some(passenger => passenger.discounts.includes(DiscountCard.Couple));
        const isAHalfCouple = passengers.some(passenger => passenger.discounts.includes(DiscountCard.HalfCouple));
        const isAMinor = passengers.some(passenger => passenger.age < 18);

        if (passengers.length === 2 && isACouple && !isAMinor) {
            total -= basicRate * 0.4;
        }

        if (passengers.length === 1 && isAHalfCouple && !isAMinor) {
            total -= basicRate * 0.1;
        }

        return total;
    }
}