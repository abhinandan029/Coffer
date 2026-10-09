import { Text, View } from "react-native"

function Dashboard(){

  return (
    <View className="bg-white flex-1 w-full">

      <Text className="text-3xl mt-10 mx-5 px-4 border-b border-black">Expenditures</Text>

      <View className="flex flex-row justify-between mt-5 mx-16 px-4 border-b border-black/30">
        <Text className="text-xl font-medium" >Food</Text>
        <Text className="text-xl font-medium">$20</Text>
      </View>

      <View className="flex flex-row justify-between mx-16 px-4 border-b border-black/30">
        <Text className="text-xl font-medium" >Food</Text>
        <Text className="text-xl font-medium">$20</Text>
      </View>

    </View>
  )

}

export default Dashboard