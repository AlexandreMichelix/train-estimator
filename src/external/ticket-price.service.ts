import { ApiException, TripDetails } from "../model/trip.request";

export interface TicketPriceApiInterface {
    getBasicRate(tripDetails : TripDetails): Promise<number>;
  }

export class TicketPriceApi implements TicketPriceApiInterface {
    async getBasicRate(tripDetails: TripDetails) : Promise<number>{
      try {
        const response = await fetch(
          `https://sncf.com/api/train/estimate/price?from=${tripDetails.from}&to=${tripDetails.to}&date=${tripDetails.when}`
        );
        const json = await response.json();
  
        if (!json.price) {
            throw new ApiException();
        }
  
        return json.price;
      } catch (error) {
        throw new ApiException();
      }
    }
  }