import { TrainTicketEstimator } from './train-estimator';
import { InvalidTripInputException, Passenger, TripRequest } from './model/trip.request';
import { TicketPriceApi } from './external/ticket-price.service';

describe('TrainTicketEstimator', () => {
  let estimator: TrainTicketEstimator;
  let ticketPriceApi: TicketPriceApi;

  beforeEach(() => {
    ticketPriceApi = new TicketPriceApi();
    estimator = new TrainTicketEstimator(ticketPriceApi);
    jest.spyOn(ticketPriceApi, "getBasicRate").mockResolvedValue(0);
  });

  describe('estimate', () => {

    it('should return 0 if no passengers', async () => {
        const tripDetails = {
            from: 'Paris',
            to: 'Marseille',
            when: new Date('2023-06-01T08:00:00Z'),
        };
        const tripRequest: TripRequest = { passengers: [], details: tripDetails };
        const result = await estimator.estimate(tripRequest);

        expect(result).toBe(0);
    });

    it('should throw invalid trip input exception', async () => {
        const tripDetails = {
            from: '',
            to: 'Marseille',
            when: new Date('2023-06-01T08:00:00Z'),
        };
        const tripRequest: TripRequest = { passengers: [new Passenger(12, [])], details: tripDetails };
        const result = estimator.estimate(tripRequest);

        await expect(async() => await result).rejects.toThrowError(
            new InvalidTripInputException('Start city is invalid')
          );
    });
    
    it('should throw invalid destination city input exception', async () => {
        const tripDetails = {
            from: 'Paris',
            to: '',
            when: new Date(),
          };
          const tripRequest: TripRequest = { passengers: [new Passenger(12, [])], details: tripDetails };
          const result = estimator.estimate(tripRequest);

          await expect(async() => await result).rejects.toThrowError(
            new InvalidTripInputException('Destination city is invalid')
          );
    });

  });
})