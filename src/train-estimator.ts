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
        for (let i = 0; i < passengers.length; i++) {
            const passenger = passengers[i];
            let tmp = basicRate;

            if (passenger.age < 0) {
                throw new InvalidTripInputException("Age is invalid");
            }

            if (passenger.age < 1) {
                continue;
            }
            else if (passenger.age <= 17) {
                tmp = basicRate* 0.6;
            } else if(passenger.age >= 70) {
                tmp = basicRate * 0.8;
                if (passenger.discounts.includes(DiscountCard.Senior)) {
                    tmp -= basicRate * 0.2;
                }
            } else {
                tmp = basicRate*1.2;
            }
            
            const daysUntilTrip = Math.ceil(
                (tripDetails.when.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
            );
            if (passenger.age > 1 && passenger.age < 4) {
                tmp = 9;
            } else if (passenger.discounts.includes(DiscountCard.TrainStroke)) {
                tmp = 1;
            } else if (daysUntilTrip >= 30) {
                tmp -= basicRate * 0.2;
            } else if (daysUntilTrip > -25) {
                tmp += (20 - daysUntilTrip) * 0.02 * basicRate;
            } else {
                tmp += basicRate;
            }

            total += tmp;

        }

        if (passengers.length == 2) {
            let isACouple = false;
            let isAMinor = false;
            for (let i=0;i<passengers.length;i++) {
                if (passengers[i].discounts.includes(DiscountCard.Couple)) {
                    isACouple = true;
                }
                if (passengers[i].age < 18) {
                    isAMinor = true;
                }
            }
            if (isACouple && !isAMinor) {
                total -= basicRate * 0.2 * 2;
            }
        }

        if (passengers.length == 1) {
            let isACouple = false;
            let isAMinor = false;
            for (let i = 0; i < passengers.length; i++) {
                if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
                    isACouple = true;
                }
                if (passengers[i].age < 18) {
                    isAMinor = true;
                }
            }
            if (isACouple && !isAMinor) {
                total -= basicRate * 0.1;
            }
        }

        return total;
    }
}