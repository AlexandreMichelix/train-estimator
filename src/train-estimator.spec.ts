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
            from: 'Bordeaux',
            to: 'Paris',
            when: new Date('2023-06-01T08:00:00Z'),
        };
        const tripRequest: TripRequest = { passengers: [], details: tripDetails };
        const result = await estimator.estimate(tripRequest);

        expect(result).toBe(0);
    });

    it('should throw an InvalidTripInputException if start city is invalid', async () => {
        const tripDetails = {
            from: '',
            to: 'Paris',
            when: new Date('2023-06-01T08:00:00Z'),
        };
        const tripRequest: TripRequest = { passengers: [new Passenger(12, [])], details: tripDetails };
        const result = estimator.estimate(tripRequest);

        await expect(async() => await result).rejects.toThrowError(
            new InvalidTripInputException('Start city is invalid')
          );
    });
    
    it('should throw an InvalidTripInputException if destination city is invalid', async () => {
      const passengers = [
        {
            name: 'Alice',
            age: 12,
            discounts: [],
        }
    ];
        const tripDetails = {
            from: 'Bordeaux',
            to: '',
            when: new Date(),
          };
          const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
          const result = estimator.estimate(tripRequest);

          await expect(async() => await result).rejects.toThrowError(
            new InvalidTripInputException('Destination city is invalid')
          );
    });

    it('should throw an InvalidTripInputException if date is invalid', async () => {
      const tripDetails = {
          from: 'Bordeaux',
          to: 'Paris',
          when: new Date('2000-01-01T10:10:10Z'),
      };
      const tripRequest: TripRequest = { passengers: [], details: tripDetails };
      const result = estimator.estimate(tripRequest);

      console.log(new Date());
      await expect(async() => await result).rejects.toThrowError(new InvalidTripInputException("Date is invalid"));
  });

  it('should throw an InvalidTripInputException if age is invalid', async () => {
    const passengers = [
        {
            name: 'Alice',
            age: -5,
            discounts: [],
        }
    ];
    const tripDetails = {
        from: 'Paris',
        to: 'Marseille',
        when: new Date('2023-06-01T08:00:00Z'),
    };
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };
    const result = estimator.estimate(tripRequest);

    await expect(async() => await result).rejects.toThrowError(new InvalidTripInputException("Age is invalid"));
});

  });

  it('should calculate the correct ticket price for a single adult passenger', async () => {
    const passengers = [
        {
            name: 'Alice',
            age: 25,
            discounts: [],
        }
    ];
    const tripDetails = {
        from: 'Paris',
        to: 'Marseille',
        when: new Date('2023-06-03T08:00:00Z'),
    };
    const tripRequest: TripRequest = { passengers: passengers, details: tripDetails };

    jest.spyOn(ticketPriceApi, "getBasicRate").mockResolvedValue(100);
    const result = await estimator.estimate(tripRequest);

    expect(result).toBe(110);
});

})