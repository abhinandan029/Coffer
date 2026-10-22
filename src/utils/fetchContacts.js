import { PermissionsAndroid, Platform } from 'react-native';
import Contacts from "react-native-contacts";

export async function fetchContacts() {
  try 
  { 
    if( Platform.OS === "android" ){
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS
      );

      if ( granted !== PermissionsAndroid.RESULTS.GRANTED){
       return { success : false, error : 'Permission denied', data : []}
      }
    }

    const rawContacts = await Contacts.getAll({
      fields: ['displayName', 'phoneNumbers', 'givenName', 'familyName']
    });

    const data = rawContacts.map( c => {
      const fullname = [c.givenName, c.familyName].filter(Boolean).join(' ') || 'Unnamed Contact';
      const numbers = c.phoneNumbers ? c.phoneNumbers.map(p => p.number) : []

      return {
        id : c.recordID,
        name : fullname,
        numbers : numbers
      }

    })

    return { success : true, data : data}
  
  }
  catch(e){
    console.error("Error in Fetch Contacts : ", e)
    return { success: false, error: error.message, data: [] };
  }
}
