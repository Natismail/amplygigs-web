export default function PaymentScreen() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Payment</h1>
      <form className="space-y-4">
        <input type="text" placeholder="Card Number" className="border p-2 w-full rounded" />
        <input type="text" placeholder="Expiry Date" className="border p-2 w-full rounded" />
        <input type="text" placeholder="CVC" className="border p-2 w-full rounded" />
        <button className="bg-green-600 text-white px-4 py-2 rounded">Pay</button>
      </form>
    </div>
  );
}
